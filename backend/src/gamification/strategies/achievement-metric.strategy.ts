import { Injectable } from '@nestjs/common';
import { AchievementMetricType, UserLearningStats } from '@prisma/client';

export type MetricExtractor = (stats: UserLearningStats) => number;

const METRIC_EXTRACTORS: Record<AchievementMetricType, MetricExtractor> = {
  [AchievementMetricType.TOTAL_ACTIVITIES]: (s) => s.totalActivitiesCount,
  [AchievementMetricType.CURRENT_DAY_STREAK]: (s) => s.currentDayStreak,
  [AchievementMetricType.CURRENT_WEEK_STREAK]: (s) => s.currentWeekStreak,
  [AchievementMetricType.COMPLETED_LESSONS]: (s) => s.completedLessonsCount,
  [AchievementMetricType.PASSED_QUIZZES]: (s) => s.passedQuizzesCount,
  [AchievementMetricType.READ_ARTICLES]: (s) => s.readArticlesCount,
  [AchievementMetricType.REVIEWED_FLASHCARDS]: (s) => s.reviewedFlashcardsCount,
  [AchievementMetricType.CREATED_MINDMAPS]: (s) => s.createdMindmapsCount,
};

@Injectable()
export class AchievementMetricStrategyRegistry {
  evaluateMetric(
    metricType: AchievementMetricType,
    stats: UserLearningStats,
  ): number {
    const extractor = METRIC_EXTRACTORS[metricType];
    return extractor ? extractor(stats) : 0;
  }
}
