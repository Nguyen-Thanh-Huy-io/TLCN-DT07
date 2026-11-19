import {
  AchievementMetricType,
  ContentStatus,
  GamificationActivityType,
  NotificationType,
} from '@prisma/client';
import { AchievementMetricStrategyRegistry } from '../strategies/achievement-metric.strategy';
import { GoalTargetStrategyRegistry } from '../strategies/goal-target.strategy';
import { ActivityTrackerService } from './activity-tracker.service';
import { AchievementService } from './achievement.service';
import { GamificationFacadeService } from './gamification-facade.service';
import { GoalService } from './goal.service';
import { StreakStatsService } from './streak-stats.service';

describe('GamificationFacadeService', () => {
  const prisma = {
    article: { findFirst: jest.fn() },
    learningActivity: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    userLearningStats: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    learningGoal: {
      updateMany: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    achievement: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    userAchievement: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
    $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(prisma)),
  };
  const notificationService = {
    notify: jest.fn().mockResolvedValue({}),
  };

  let facade: GamificationFacadeService;

  beforeEach(() => {
    jest.clearAllMocks();
    const tracker = new ActivityTrackerService(prisma as any);
    const streakStats = new StreakStatsService(prisma as any);
    const goalService = new GoalService(
      prisma as any,
      new GoalTargetStrategyRegistry(prisma as any),
    );
    const achievementService = new AchievementService(
      prisma as any,
      new AchievementMetricStrategyRegistry(),
      streakStats,
      notificationService as any,
    );
    facade = new GamificationFacadeService(
      prisma as any,
      tracker,
      streakStats,
      goalService,
      achievementService,
      notificationService as any,
    );
  });

  it('bỏ qua (idempotent) nếu dedupKey đã tồn tại — không cộng XP hay streak lần 2', async () => {
    prisma.learningActivity.findUnique.mockResolvedValue({ id: 'act-1' });

    const res = await facade.processLearningActivity({
      userId: 'u-1',
      activityType: GamificationActivityType.LESSON_COMPLETED,
      dedupKey: 'LESSON:u-1:l-1',
    });

    expect(res).toEqual({ skipped: true, xpEarned: 0 });
    expect(prisma.learningActivity.create).not.toHaveBeenCalled();
    expect(prisma.userLearningStats.upsert).not.toHaveBeenCalled();
  });

  it('mở khóa huy hiệu và bắn NotificationService khi đủ điều kiện', async () => {
    prisma.learningActivity.findUnique.mockResolvedValue(null);
    prisma.learningActivity.create.mockResolvedValue({ id: 'act-2' });
    prisma.userLearningStats.findUnique.mockResolvedValue(null);
    const createdStats = {
      id: 'st-1',
      userId: 'u-1',
      totalXp: 20,
      currentDayStreak: 1,
      longestDayStreak: 1,
      currentWeekStreak: 1,
      longestWeekStreak: 1,
      totalActivitiesCount: 1,
      completedLessonsCount: 0,
      passedQuizzesCount: 0,
      reviewedFlashcardsCount: 0,
      readArticlesCount: 1,
      createdMindmapsCount: 0,
      createdNotesCount: 0,
      lastActiveDate: '2026-11-19',
      lastActiveWeekKey: '2026-W47',
      updatedAt: new Date(),
    };
    prisma.userLearningStats.upsert.mockResolvedValue(createdStats);
    prisma.achievement.findMany.mockResolvedValue([
      {
        id: 'ach-1',
        code: 'FIRST_STEP',
        title: 'Khởi hành sử học',
        description: 'Hoạt động đầu tiên',
        iconKey: 'Sparkles',
        metricType: AchievementMetricType.TOTAL_ACTIVITIES,
        threshold: 1,
        xpReward: 20,
      },
    ]);
    prisma.userAchievement.findMany.mockResolvedValue([]);
    prisma.userAchievement.create.mockResolvedValue({ id: 'ua-1' });
    prisma.article.findFirst.mockResolvedValue({
      id: 'art-1',
      title: 'Ngô Quyền',
      status: ContentStatus.PUBLISHED,
    });

    const out = await facade.markArticleReadComplete('u-1', 'art-1');

    expect(out.alreadyCompleted).toBe(false);
    expect(out.xpEarned).toBe(20);
    expect(prisma.userAchievement.create).toHaveBeenCalled();
    expect(notificationService.notify).toHaveBeenCalledWith(
      'u-1',
      NotificationType.ACHIEVEMENT_UNLOCKED,
      expect.stringContaining('Khởi hành sử học'),
      expect.any(String),
      expect.any(String),
    );
  });
});
