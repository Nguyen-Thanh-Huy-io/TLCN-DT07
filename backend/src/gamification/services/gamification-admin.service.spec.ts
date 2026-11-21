import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AchievementMetricType } from '@prisma/client';
import { GamificationAdminService } from './gamification-admin.service';

describe('GamificationAdminService', () => {
  const prisma = {
    userLearningStats: { count: jest.fn(), findMany: jest.fn() },
    learningActivity: { count: jest.fn() },
    learningGoal: { count: jest.fn() },
    userAchievement: { count: jest.fn() },
    achievement: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      count: jest.fn().mockResolvedValue(8),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const achievementService = {
    ensureDefaultSeeded: jest.fn().mockResolvedValue(undefined),
  };

  let service: GamificationAdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GamificationAdminService(
      prisma as any,
      achievementService as any,
    );
  });

  it('tạo mới huy hiệu và từ chối nếu trùng mã code', async () => {
    prisma.achievement.findUnique.mockResolvedValue({ id: 'a-1' });

    await expect(
      service.createAchievement({
        code: 'FIRST_STEP',
        title: 'Test',
        description: 'Mô tả test dài',
        iconKey: 'Award',
        metricType: AchievementMetricType.TOTAL_ACTIVITIES,
        threshold: 1,
      }),
    ).rejects.toThrow(ConflictException);

    prisma.achievement.findUnique.mockResolvedValue(null);
    prisma.achievement.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'a-new', ...data }),
    );
    const created = await service.createAchievement({
      code: 'MINDMAP_CREATOR',
      title: 'Kiến trúc tư duy',
      description: 'Tạo sơ đồ tư duy đầu tiên',
      iconKey: 'Sparkles',
      metricType: AchievementMetricType.CREATED_MINDMAPS,
      threshold: 1,
      xpReward: 30,
    });
    expect(created.code).toBe('MINDMAP_CREATOR');
    expect(created.unlockedCount).toBe(0);
  });

  it('tự động sinh mã định danh tiếng Việt không dấu duy nhất khi không truyền code', async () => {
    prisma.achievement.findMany.mockResolvedValue([
      { code: 'NGUOI_GIU_LUA_VIET' },
    ]);
    prisma.achievement.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'a-auto', ...data }),
    );

    const created = await service.createAchievement({
      title: 'Người giữ lửa Việt',
      description: 'Học tập đều đặn không ngắt quãng',
      iconKey: 'Flame',
      imageUrl: '/uploads/images/badge-su-gia.png',
      metricType: AchievementMetricType.CURRENT_DAY_STREAK,
      threshold: 14,
    });

    expect(created.code).toBe('NGUOI_GIU_LUA_VIET_2');
    expect(created.imageUrl).toBe('/uploads/images/badge-su-gia.png');
    expect(created.sortOrder).toBe(9);
  });

  it('chặn xoá cứng huy hiệu đã có học viên đạt được (unlockedCount > 0)', async () => {
    prisma.achievement.findUnique.mockResolvedValue({
      id: 'a-1',
      _count: { userAchievements: 4 },
    });

    await expect(service.deleteAchievement('a-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.achievement.delete).not.toHaveBeenCalled();

    prisma.achievement.findUnique.mockResolvedValue({
      id: 'a-2',
      _count: { userAchievements: 0 },
    });
    prisma.achievement.delete.mockResolvedValue({ id: 'a-2' });
    await expect(service.deleteAchievement('a-2')).resolves.toEqual({
      deleted: true,
    });
  });

  it('báo NotFoundException khi sửa huy hiệu không tồn tại', async () => {
    prisma.achievement.findUnique.mockResolvedValue(null);
    await expect(
      service.updateAchievement('missing', { title: 'Mới' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('cập nhật huy hiệu hợp lệ và trả về unlockedCount', async () => {
    prisma.achievement.findUnique.mockResolvedValue({
      id: 'a-1',
      _count: { userAchievements: 2 },
    });
    prisma.achievement.update.mockResolvedValue({
      id: 'a-1',
      title: 'Danh hiệu mới',
      _count: { userAchievements: 5 },
    });

    const updated = await service.updateAchievement('a-1', {
      title: ' Danh hiệu mới ',
      description: ' Mô tả mới ',
      xpReward: 50,
      isActive: true,
    });
    expect(updated.title).toBe('Danh hiệu mới');
    expect(updated.unlockedCount).toBe(5);
  });

  it('getAdminOverview tổng hợp KPI thống kê và danh sách huy hiệu', async () => {
    prisma.userLearningStats.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(25);
    prisma.learningActivity.count.mockResolvedValue(140);
    prisma.learningGoal.count.mockResolvedValueOnce(6).mockResolvedValueOnce(4);
    prisma.userAchievement.count.mockResolvedValue(18);
    prisma.achievement.findMany.mockResolvedValue([
      { id: 'a-1', code: 'FIRST', _count: { userAchievements: 7 } },
    ]);

    const overview = await service.getAdminOverview();
    expect(achievementService.ensureDefaultSeeded).toHaveBeenCalled();
    expect(overview.summary).toEqual({
      activeStreakTodayCount: 10,
      weeklyActiveLearnersCount: 25,
      activitiesLast7DaysCount: 140,
      activeGoalsCount: 6,
      completedGoalsCount: 4,
      totalUnlockedBadgesCount: 18,
    });
    expect(overview.achievements[0].unlockedCount).toBe(7);
  });

  it('listLearners lọc theo từ khoá và ánh xạ danh sách học viên', async () => {
    prisma.userLearningStats.findMany.mockResolvedValue([
      {
        userId: 'u-1',
        totalXp: 300,
        currentStreak: 5,
        longestStreak: 8,
        totalLessonsCompleted: 12,
        totalArticlesRead: 4,
        totalQuizzesCompleted: 3,
        lastActiveDate: '2026-11-20',
        user: {
          id: 'u-1',
          username: 'minh',
          email: 'minh@hisgo.vn',
          role: 'USER',
          userProfile: {
            firstName: 'Nguyễn',
            lastName: 'Minh',
            avatarUrl: null,
          },
          _count: { userAchievements: 2, learningGoals: 1 },
        },
      },
    ]);

    const rows = await service.listLearners({ q: 'minh', limit: 10 });
    expect(rows).toHaveLength(1);
    expect(rows[0].unlockedBadgesCount).toBe(2);
    expect(rows[0].goalsCount).toBe(1);
  });
});
