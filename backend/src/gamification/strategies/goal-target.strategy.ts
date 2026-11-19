import { Injectable } from '@nestjs/common';
import {
  GamificationActivityType,
  GoalPeriod,
  GoalTargetType,
} from '@prisma/client';
import {
  PrismaClientOrTx,
  PrismaService,
} from '../../common/services/prisma.service';

export interface PeriodActivityRecord {
  activityType: GamificationActivityType;
  activityDate: string;
  metadata: unknown;
}

export interface GoalTargetEvaluator {
  matchesActivity(
    activityType: GamificationActivityType,
    metadata?: { isPassed?: boolean } | null,
  ): boolean;
  computeProgress(activities: ReadonlyArray<PeriodActivityRecord>): number;
}

function isQuizPassedMeta(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object') return false;
  return Boolean((metadata as { isPassed?: unknown }).isPassed);
}

const SIMPLE_ACTIVITY_EVALUATOR = (
  expectedType: GamificationActivityType,
): GoalTargetEvaluator => ({
  matchesActivity: (type) => type === expectedType,
  computeProgress: (rows) =>
    rows.filter((r) => r.activityType === expectedType).length,
});

const GOAL_TARGET_EVALUATORS: Record<GoalTargetType, GoalTargetEvaluator> = {
  [GoalTargetType.STUDY_DAYS]: {
    matchesActivity: () => true,
    computeProgress: (rows) => new Set(rows.map((r) => r.activityDate)).size,
  },
  [GoalTargetType.COMPLETE_LESSONS]: SIMPLE_ACTIVITY_EVALUATOR(
    GamificationActivityType.LESSON_COMPLETED,
  ),
  [GoalTargetType.PASS_QUIZZES]: {
    matchesActivity: (type, meta) =>
      type === GamificationActivityType.QUIZ_SUBMITTED &&
      Boolean(meta?.isPassed),
    computeProgress: (rows) =>
      rows.filter(
        (r) =>
          r.activityType === GamificationActivityType.QUIZ_SUBMITTED &&
          isQuizPassedMeta(r.metadata),
      ).length,
  },
  [GoalTargetType.REVIEW_FLASHCARDS]: SIMPLE_ACTIVITY_EVALUATOR(
    GamificationActivityType.FLASHCARD_REVIEWED,
  ),
  [GoalTargetType.READ_ARTICLES]: SIMPLE_ACTIVITY_EVALUATOR(
    GamificationActivityType.ARTICLE_READ_COMPLETED,
  ),
  [GoalTargetType.ANY_ACTIVITIES]: {
    matchesActivity: () => true,
    computeProgress: (rows) => rows.length,
  },
};

@Injectable()
export class GoalTargetStrategyRegistry {
  constructor(private readonly prisma: PrismaService) {}

  getEvaluator(targetType: GoalTargetType): GoalTargetEvaluator {
    return GOAL_TARGET_EVALUATORS[targetType];
  }

  async fetchPeriodActivities(
    userId: string,
    period: GoalPeriod,
    periodKey: string,
    client: PrismaClientOrTx = this.prisma,
  ): Promise<PeriodActivityRecord[]> {
    const where =
      period === GoalPeriod.DAILY
        ? { userId, activityDate: periodKey }
        : { userId, weekKey: periodKey };

    return client.learningActivity.findMany({
      where,
      select: {
        activityType: true,
        activityDate: true,
        metadata: true,
      },
    });
  }
}
