import { BadRequestException } from '@nestjs/common';
import {
  GamificationActivityType,
  GoalPeriod,
  GoalPresetKey,
  GoalStatus,
  GoalTargetType,
} from '@prisma/client';
import { GoalTargetStrategyRegistry } from '../strategies/goal-target.strategy';
import { GoalService } from './goal.service';

describe('GoalService', () => {
  let service: GoalService;
  const prisma = {
    learningGoal: {
      updateMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    learningActivity: {
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const registry = new GoalTargetStrategyRegistry(prisma as any);
    service = new GoalService(prisma as any, registry);
  });

  it('tạo Preset 3x (3 ngày/tuần) và tính ngay tiến độ ngược từ đầu tuần', async () => {
    prisma.learningActivity.findMany.mockResolvedValue([
      {
        activityType: GamificationActivityType.FLASHCARD_REVIEWED,
        activityDate: '2026-11-17',
        metadata: null,
      },
      {
        activityType: GamificationActivityType.FLASHCARD_REVIEWED,
        activityDate: '2026-11-17', // cùng ngày -> vẫn chỉ đếm là 1 ngày
        metadata: null,
      },
      {
        activityType: GamificationActivityType.LESSON_COMPLETED,
        activityDate: '2026-11-19',
        metadata: null,
      },
    ]);
    prisma.learningGoal.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'g-1', ...data }),
    );

    const created = await service.createGoal('u-1', {
      presetKey: GoalPresetKey.PRESET_3X,
    });

    expect(prisma.learningGoal.updateMany).toHaveBeenCalledTimes(2);
    expect(created.isPrimary).toBe(true);
    expect(created.targetType).toBe(GoalTargetType.STUDY_DAYS);
    expect(created.targetValue).toBe(3);
    expect(created.currentValue).toBe(2);
    expect(created.status).toBe(GoalStatus.ACTIVE);
  });

  it('chặn tạo quá 3 mục tiêu phụ tùy chọn đang hoạt động', async () => {
    prisma.learningGoal.count.mockResolvedValue(3);

    await expect(
      service.createGoal('u-1', {
        presetKey: GoalPresetKey.CUSTOM,
        isPrimary: false,
        targetType: GoalTargetType.PASS_QUIZZES,
        period: GoalPeriod.WEEKLY,
        targetValue: 5,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('tự chuyển Goal sang COMPLETED khi số ngày/hoạt động đạt ngưỡng', async () => {
    prisma.learningGoal.findMany.mockResolvedValue([
      {
        id: 'g-1',
        userId: 'u-1',
        title: '3 ngày/tuần',
        isPrimary: true,
        presetKey: GoalPresetKey.PRESET_3X,
        targetType: GoalTargetType.STUDY_DAYS,
        period: GoalPeriod.WEEKLY,
        targetValue: 2,
        currentValue: 1,
        periodKey: '2026-W47',
        status: GoalStatus.ACTIVE,
      },
    ]);
    prisma.learningActivity.findMany.mockResolvedValue([
      {
        activityType: GamificationActivityType.LESSON_COMPLETED,
        activityDate: '2026-11-18',
        metadata: null,
      },
      {
        activityType: GamificationActivityType.ARTICLE_READ_COMPLETED,
        activityDate: '2026-11-19',
        metadata: null,
      },
    ]);
    prisma.learningGoal.update.mockImplementation(({ data }: any) =>
      Promise.resolve({
        id: 'g-1',
        title: '3 ngày/tuần',
        targetValue: 2,
        ...data,
      }),
    );

    const completed = await service.syncGoalsOnActivity({
      userId: 'u-1',
      activityType: GamificationActivityType.ARTICLE_READ_COMPLETED,
      activityDate: '2026-11-19',
      weekKey: '2026-W47',
    });

    expect(completed).toHaveLength(1);
    expect(completed[0].status).toBe(GoalStatus.COMPLETED);
    expect(completed[0].currentValue).toBe(2);
  });
});
