import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GoalStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import {
  CreateAchievementDto,
  QueryAdminLearnersDto,
  UpdateAchievementDto,
} from '../dto/gamification-admin.dto';
import {
  AdminLearnerSortField,
  GAMIFICATION_MESSAGES,
} from '../gamification.constant';
import {
  listRecentVnDateKeys,
  toVnDateKey,
  toVnWeekKey,
} from '../utils/vn-date.util';
import { AchievementService } from './achievement.service';
import {
  resolveEffectiveStreak,
  resolveScholarRank,
} from './streak-stats.service';

export function toAchievementCodeBase(title: string): string {
  const ascii = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  return ascii || 'ACHIEVEMENT';
}

const LEARNER_ORDER_STRATEGY: Record<
  AdminLearnerSortField,
  Prisma.UserLearningStatsOrderByWithRelationInput[]
> = {
  [AdminLearnerSortField.XP]: [{ totalXp: 'desc' }, { updatedAt: 'desc' }],
  [AdminLearnerSortField.DAY_STREAK]: [
    { currentDayStreak: 'desc' },
    { totalXp: 'desc' },
  ],
  [AdminLearnerSortField.WEEK_STREAK]: [
    { currentWeekStreak: 'desc' },
    { totalXp: 'desc' },
  ],
  [AdminLearnerSortField.ACTIVITIES]: [
    { totalActivitiesCount: 'desc' },
    { totalXp: 'desc' },
  ],
};

@Injectable()
export class GamificationAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly achievementService: AchievementService,
  ) {}

  async getAdminOverview() {
    await this.achievementService.ensureDefaultSeeded();
    const todayKey = toVnDateKey();
    const weekKey = toVnWeekKey();
    const recentKeys = listRecentVnDateKeys(7);

    const [
      activeStreakTodayCount,
      weeklyActiveLearnersCount,
      activitiesLast7DaysCount,
      activeGoalsCount,
      completedGoalsCount,
      totalUnlockedBadgesCount,
      achievements,
    ] = await Promise.all([
      this.prisma.userLearningStats.count({
        where: { lastActiveDate: todayKey },
      }),
      this.prisma.userLearningStats.count({
        where: { lastActiveWeekKey: weekKey },
      }),
      this.prisma.learningActivity.count({
        where: { activityDate: { in: recentKeys } },
      }),
      this.prisma.learningGoal.count({
        where: { status: GoalStatus.ACTIVE },
      }),
      this.prisma.learningGoal.count({
        where: { status: GoalStatus.COMPLETED, periodKey: weekKey },
      }),
      this.prisma.userAchievement.count(),
      this.prisma.achievement.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        include: { _count: { select: { userAchievements: true } } },
      }),
    ]);

    return {
      summary: {
        activeStreakTodayCount,
        weeklyActiveLearnersCount,
        activitiesLast7DaysCount,
        activeGoalsCount,
        completedGoalsCount,
        totalUnlockedBadgesCount,
      },
      achievements: achievements.map(({ _count, ...ach }) => ({
        ...ach,
        unlockedCount: _count.userAchievements,
      })),
    };
  }

  async listLearners(query: QueryAdminLearnersDto) {
    const q = query.q?.trim();
    const sortField = query.sortBy ?? AdminLearnerSortField.XP;
    const take = query.limit ?? 25;

    const userFilter: Prisma.authUserWhereInput = {
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { username: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              {
                userProfile: {
                  OR: [
                    { firstName: { contains: q, mode: 'insensitive' } },
                    { lastName: { contains: q, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.userLearningStats.findMany({
      where: { user: userFilter },
      orderBy: LEARNER_ORDER_STRATEGY[sortField],
      take,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            userProfile: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
            _count: {
              select: {
                userAchievements: true,
                learningGoals: true,
              },
            },
          },
        },
      },
    });

    return rows.map((row) => {
      const effectiveStreak = resolveEffectiveStreak(row);
      const rank = resolveScholarRank(row.totalXp);
      const fullName = [
        row.user.userProfile?.lastName,
        row.user.userProfile?.firstName,
      ]
        .filter(Boolean)
        .join(' ');

      return {
        userId: row.userId,
        username: row.user.username,
        displayName: fullName || row.user.username,
        email: row.user.email,
        avatarUrl: row.user.userProfile?.avatarUrl ?? null,
        totalXp: row.totalXp,
        rankLabel: rank.current.label,
        currentDayStreak: effectiveStreak.currentDayStreak,
        longestDayStreak: effectiveStreak.longestDayStreak,
        currentWeekStreak: effectiveStreak.currentWeekStreak,
        studiedToday: effectiveStreak.studiedToday,
        totalActivitiesCount: row.totalActivitiesCount,
        completedLessonsCount: row.completedLessonsCount,
        passedQuizzesCount: row.passedQuizzesCount,
        readArticlesCount: row.readArticlesCount,
        unlockedBadgesCount: row.user._count.userAchievements,
        goalsCount: row.user._count.learningGoals,
      };
    });
  }

  private async resolveUniqueAchievementCode(
    title: string,
    providedCode?: string,
  ): Promise<string> {
    const explicit = providedCode?.trim().toUpperCase();
    if (explicit) {
      const existing = await this.prisma.achievement.findUnique({
        where: { code: explicit },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(
          GAMIFICATION_MESSAGES.ACHIEVEMENT_CODE_EXISTS,
        );
      }
      return explicit;
    }

    const base = toAchievementCodeBase(title);
    const similar = await this.prisma.achievement.findMany({
      where: { code: { startsWith: base } },
      select: { code: true },
    });
    const used = new Set(similar.map((s) => s.code));
    if (!used.has(base)) return base;

    let suffix = 2;
    while (used.has(`${base}_${suffix}`)) {
      suffix += 1;
    }
    return `${base}_${suffix}`;
  }

  async createAchievement(dto: CreateAchievementDto) {
    const code = await this.resolveUniqueAchievementCode(dto.title, dto.code);
    const sortOrder =
      dto.sortOrder ?? (await this.prisma.achievement.count()) + 1;

    const ach = await this.prisma.achievement.create({
      data: {
        code,
        title: dto.title.trim(),
        description: dto.description.trim(),
        iconKey: dto.iconKey ?? 'Award',
        imageUrl: dto.imageUrl?.trim() || null,
        metricType: dto.metricType,
        threshold: dto.threshold,
        xpReward: dto.xpReward ?? 20,
        sortOrder,
        isActive: dto.isActive ?? true,
      },
    });
    return { ...ach, unlockedCount: 0 };
  }

  private async findAchievementWithCountOrThrow(id: string) {
    const existing = await this.prisma.achievement.findUnique({
      where: { id },
      include: { _count: { select: { userAchievements: true } } },
    });
    if (!existing) {
      throw new NotFoundException(GAMIFICATION_MESSAGES.ACHIEVEMENT_NOT_FOUND);
    }
    return existing;
  }

  async updateAchievement(id: string, dto: UpdateAchievementDto) {
    await this.findAchievementWithCountOrThrow(id);

    const updated = await this.prisma.achievement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.iconKey !== undefined ? { iconKey: dto.iconKey } : {}),
        ...(dto.imageUrl !== undefined
          ? { imageUrl: dto.imageUrl?.trim() || null }
          : {}),
        ...(dto.metricType !== undefined ? { metricType: dto.metricType } : {}),
        ...(dto.threshold !== undefined ? { threshold: dto.threshold } : {}),
        ...(dto.xpReward !== undefined ? { xpReward: dto.xpReward } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: { _count: { select: { userAchievements: true } } },
    });
    const { _count, ...ach } = updated;
    return { ...ach, unlockedCount: _count.userAchievements };
  }

  async deleteAchievement(id: string): Promise<{ deleted: true }> {
    const existing = await this.findAchievementWithCountOrThrow(id);
    const unlockedCount = existing._count.userAchievements;
    if (unlockedCount > 0) {
      throw new BadRequestException(
        GAMIFICATION_MESSAGES.ACHIEVEMENT_LOCKED_FOR_DELETE(unlockedCount),
      );
    }

    await this.prisma.achievement.delete({ where: { id } });
    return { deleted: true };
  }
}
