import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GamificationActivityType,
  GoalPeriod,
  GoalPresetKey,
  GoalStatus,
  GoalTargetType,
  LearningGoal,
} from '@prisma/client';
import {
  PrismaClientOrTx,
  PrismaService,
} from '../../common/services/prisma.service';
import { CreateGoalDto, UpdateGoalStatusDto } from '../dto/gamification.dto';
import {
  DEFAULT_GOAL_TITLES,
  GAMIFICATION_LIMITS,
  GAMIFICATION_MESSAGES,
  PRESET_WEEKLY_STUDY_DAYS,
} from '../gamification.constant';
import {
  GoalTargetStrategyRegistry,
  PeriodActivityRecord,
} from '../strategies/goal-target.strategy';
import { toVnDateKey, toVnWeekKey } from '../utils/vn-date.util';

@Injectable()
export class GoalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly strategyRegistry: GoalTargetStrategyRegistry,
  ) {}

  async expireStaleGoals(
    userId: string,
    todayKey: string = toVnDateKey(),
    weekKey: string = toVnWeekKey(),
    client: PrismaClientOrTx = this.prisma,
  ): Promise<void> {
    await client.learningGoal.updateMany({
      where: {
        userId,
        status: GoalStatus.ACTIVE,
        OR: [
          { period: GoalPeriod.DAILY, periodKey: { not: todayKey } },
          { period: GoalPeriod.WEEKLY, periodKey: { not: weekKey } },
        ],
      },
      data: { status: GoalStatus.EXPIRED },
    });
  }

  async listGoals(userId: string): Promise<LearningGoal[]> {
    const todayKey = toVnDateKey();
    const weekKey = toVnWeekKey();
    await this.expireStaleGoals(userId, todayKey, weekKey);

    return this.prisma.learningGoal.findMany({
      where: {
        userId,
        OR: [
          { status: GoalStatus.ACTIVE },
          {
            status: GoalStatus.COMPLETED,
            periodKey: { in: [todayKey, weekKey] },
          },
        ],
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createGoal(userId: string, dto: CreateGoalDto): Promise<LearningGoal> {
    const todayKey = toVnDateKey();
    const weekKey = toVnWeekKey();
    await this.expireStaleGoals(userId, todayKey, weekKey);

    const spec = this.resolveGoalSpec(dto);
    const periodKey = spec.period === GoalPeriod.DAILY ? todayKey : weekKey;

    if (spec.isPrimary) {
      await this.prisma.learningGoal.updateMany({
        where: {
          userId,
          isPrimary: true,
          status: { in: [GoalStatus.ACTIVE, GoalStatus.COMPLETED] },
        },
        data: { status: GoalStatus.ARCHIVED },
      });
    } else {
      const secondaryCount = await this.prisma.learningGoal.count({
        where: { userId, isPrimary: false, status: GoalStatus.ACTIVE },
      });
      if (secondaryCount >= GAMIFICATION_LIMITS.MAX_SECONDARY_ACTIVE_GOALS) {
        throw new BadRequestException(
          GAMIFICATION_MESSAGES.TOO_MANY_SECONDARY_GOALS,
        );
      }
    }

    const activities = await this.strategyRegistry.fetchPeriodActivities(
      userId,
      spec.period,
      periodKey,
    );
    const initialValue = this.strategyRegistry
      .getEvaluator(spec.targetType)
      .computeProgress(activities);
    const completed = initialValue >= spec.targetValue;

    return this.prisma.learningGoal.create({
      data: {
        userId,
        title: spec.title,
        isPrimary: spec.isPrimary,
        presetKey: dto.presetKey,
        targetType: spec.targetType,
        period: spec.period,
        targetValue: spec.targetValue,
        currentValue: initialValue,
        periodKey,
        status: completed ? GoalStatus.COMPLETED : GoalStatus.ACTIVE,
        completedAt: completed ? new Date() : null,
      },
    });
  }

  async updateGoalStatus(
    userId: string,
    goalId: string,
    dto: UpdateGoalStatusDto,
  ): Promise<LearningGoal> {
    const goal = await this.prisma.learningGoal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goal) {
      throw new NotFoundException(GAMIFICATION_MESSAGES.GOAL_NOT_FOUND);
    }
    return this.prisma.learningGoal.update({
      where: { id: goalId },
      data: { status: dto.status },
    });
  }

  async deleteGoal(userId: string, goalId: string): Promise<{ deleted: true }> {
    const goal = await this.prisma.learningGoal.findFirst({
      where: { id: goalId, userId },
      select: { id: true },
    });
    if (!goal) {
      throw new NotFoundException(GAMIFICATION_MESSAGES.GOAL_NOT_FOUND);
    }
    await this.prisma.learningGoal.delete({ where: { id: goalId } });
    return { deleted: true };
  }

  /** Gọi bên trong `prisma.$transaction` của GamificationFacadeService để cùng atomically với recordActivity/applyActivityToStats. */
  async syncGoalsOnActivity(
    params: {
      userId: string;
      activityType: GamificationActivityType;
      isPassed?: boolean;
      activityDate: string;
      weekKey: string;
    },
    client: PrismaClientOrTx = this.prisma,
  ): Promise<LearningGoal[]> {
    await this.expireStaleGoals(
      params.userId,
      params.activityDate,
      params.weekKey,
      client,
    );

    const activeGoals = await client.learningGoal.findMany({
      where: { userId: params.userId, status: GoalStatus.ACTIVE },
    });
    if (activeGoals.length === 0) return [];

    const cache = new Map<string, PeriodActivityRecord[]>();
    const newlyCompleted: LearningGoal[] = [];

    for (const goal of activeGoals) {
      const evaluator = this.strategyRegistry.getEvaluator(goal.targetType);
      if (
        !evaluator.matchesActivity(params.activityType, {
          isPassed: params.isPassed,
        })
      ) {
        continue;
      }

      const cacheKey = `${goal.period}:${goal.periodKey}`;
      let rows = cache.get(cacheKey);
      if (!rows) {
        rows = await this.strategyRegistry.fetchPeriodActivities(
          params.userId,
          goal.period,
          goal.periodKey,
          client,
        );
        cache.set(cacheKey, rows);
      }

      const nextValue = evaluator.computeProgress(rows);
      if (nextValue === goal.currentValue) continue;

      const isDone = nextValue >= goal.targetValue;
      const updated = await client.learningGoal.update({
        where: { id: goal.id },
        data: {
          currentValue: nextValue,
          ...(isDone
            ? { status: GoalStatus.COMPLETED, completedAt: new Date() }
            : {}),
        },
      });
      if (isDone) newlyCompleted.push(updated);
    }

    return newlyCompleted;
  }

  private resolveGoalSpec(dto: CreateGoalDto) {
    const preset = PRESET_WEEKLY_STUDY_DAYS[dto.presetKey];
    if (preset && dto.presetKey !== GoalPresetKey.CUSTOM) {
      return {
        isPrimary: dto.isPrimary ?? true,
        targetType: GoalTargetType.STUDY_DAYS,
        period: GoalPeriod.WEEKLY,
        targetValue: preset.days,
        title: dto.title?.trim() || preset.title,
      };
    }

    const targetType = dto.targetType ?? GoalTargetType.ANY_ACTIVITIES;
    const period = dto.period ?? GoalPeriod.WEEKLY;
    const targetValue = dto.targetValue ?? 3;
    const periodLabel = period === GoalPeriod.DAILY ? 'ngày' : 'tuần';
    return {
      isPrimary: dto.isPrimary ?? false,
      targetType,
      period,
      targetValue,
      title:
        dto.title?.trim() ||
        `${DEFAULT_GOAL_TITLES[targetType]} · ${targetValue}/${periodLabel}`,
    };
  }
}
