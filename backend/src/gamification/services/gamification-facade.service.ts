import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ContentStatus,
  GamificationActivityType,
  NotificationType,
  UserLearningStats,
} from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import {
  GAMIFICATION_LIMITS,
  GAMIFICATION_MESSAGES,
} from '../gamification.constant';
import {
  ActivityTrackerService,
  GamificationActivityInput,
} from './activity-tracker.service';
import { AchievementService } from './achievement.service';
import { GoalService } from './goal.service';
import {
  resolveEffectiveStreak,
  resolveScholarRank,
  StreakStatsService,
} from './streak-stats.service';

@Injectable()
export class GamificationFacadeService {
  private readonly logger = new Logger(GamificationFacadeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tracker: ActivityTrackerService,
    private readonly streakStats: StreakStatsService,
    private readonly goalService: GoalService,
    private readonly achievementService: AchievementService,
    private readonly notificationService: NotificationService,
  ) {}

  async processLearningActivity(input: GamificationActivityInput) {
    const recorded = await this.tracker.recordActivity(input);
    if (recorded.skipped) {
      return { skipped: true, xpEarned: 0 };
    }

    // Stats + mục tiêu là 2 thao tác ghi phụ thuộc cùng một activity vừa ghi nhận ở trên
    // nên phải atomically cùng nhau: lỗi giữa đường không để lại XP/streak mà thiếu mục tiêu đã đồng bộ.
    const { stats, completedGoals } = await this.prisma.$transaction(
      async (tx) => {
        const txStats = await this.streakStats.applyActivityToStats(
          {
            userId: input.userId,
            activityType: input.activityType,
            activityDate: recorded.activityDate,
            weekKey: recorded.weekKey,
            xpEarned: recorded.xpEarned,
            isPassed: input.isPassed,
          },
          tx,
        );

        const txCompletedGoals = await this.goalService.syncGoalsOnActivity(
          {
            userId: input.userId,
            activityType: input.activityType,
            isPassed: input.isPassed,
            activityDate: recorded.activityDate,
            weekKey: recorded.weekKey,
          },
          tx,
        );

        return { stats: txStats, completedGoals: txCompletedGoals };
      },
    );

    for (const goal of completedGoals) {
      try {
        await this.notificationService.notify(
          input.userId,
          NotificationType.GOAL_COMPLETED,
          `Hoàn thành mục tiêu: ${goal.title}`,
          `Bạn đã đạt ${goal.currentValue}/${goal.targetValue} cho cam kết đã đặt.`,
          '/tai-khoan?tab=muc-tieu',
        );
      } catch (err) {
        this.logger.warn(
          `Không gửi được thông báo mục tiêu: ${(err as Error).message}`,
        );
      }
    }

    await this.achievementService.evaluateAndUnlock(input.userId, stats);

    return {
      skipped: false,
      xpEarned: recorded.xpEarned,
    };
  }

  async getOverview(userId: string) {
    const stats = await this.streakStats.getOrCreateStats(userId);
    const streak = resolveEffectiveStreak(stats);
    const statsForAchievements: UserLearningStats = {
      ...stats,
      currentDayStreak: streak.currentDayStreak,
      currentWeekStreak: streak.currentWeekStreak,
    };
    const [goals, recentDays, achievements, readRows] = await Promise.all([
      this.goalService.listGoals(userId),
      this.streakStats.getRecentDaysActivity(
        userId,
        GAMIFICATION_LIMITS.RECENT_DAYS_WINDOW,
      ),
      this.achievementService.listWithProgress(userId, statsForAchievements),
      this.prisma.learningActivity.findMany({
        where: {
          userId,
          activityType: GamificationActivityType.ARTICLE_READ_COMPLETED,
          entityId: { not: null },
        },
        select: { entityId: true },
      }),
    ]);

    const rank = resolveScholarRank(stats.totalXp);
    const primaryGoal = goals.find((g) => g.isPrimary) ?? null;
    const secondaryGoals = goals.filter((g) => !g.isPrimary);

    return {
      streak,
      stats: {
        totalXp: stats.totalXp,
        completedLessonsCount: stats.completedLessonsCount,
        passedQuizzesCount: stats.passedQuizzesCount,
        reviewedFlashcardsCount: stats.reviewedFlashcardsCount,
        readArticlesCount: stats.readArticlesCount,
        createdMindmapsCount: stats.createdMindmapsCount,
        createdNotesCount: stats.createdNotesCount,
        totalActivitiesCount: stats.totalActivitiesCount,
      },
      rank,
      primaryGoal,
      secondaryGoals,
      recentDays,
      achievements,
      readArticleIds: readRows
        .map((r) => r.entityId)
        .filter((id): id is string => Boolean(id)),
    };
  }

  async markArticleReadComplete(userId: string, articleId: string) {
    const article = await this.prisma.article.findFirst({
      where: { id: articleId, status: ContentStatus.PUBLISHED },
      select: { id: true, title: true },
    });
    if (!article) {
      throw new NotFoundException(GAMIFICATION_MESSAGES.ARTICLE_NOT_FOUND);
    }

    const result = await this.processLearningActivity({
      userId,
      activityType: GamificationActivityType.ARTICLE_READ_COMPLETED,
      entityType: 'ARTICLE',
      entityId: article.id,
      dedupKey: `ARTICLE_READ:${userId}:${article.id}`,
      metadata: { title: article.title },
    });

    const overview = await this.getOverview(userId);
    return {
      alreadyCompleted: result.skipped,
      xpEarned: result.xpEarned,
      overview,
    };
  }

  async isArticleReadCompleted(userId: string, articleId: string) {
    const found = await this.prisma.learningActivity.findUnique({
      where: { dedupKey: `ARTICLE_READ:${userId}:${articleId}` },
      select: { id: true, occurredAt: true },
    });
    return {
      completed: Boolean(found),
      completedAt: found?.occurredAt ?? null,
    };
  }
}
