import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  Achievement,
  NotificationType,
  UserLearningStats,
} from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { DEFAULT_ACHIEVEMENTS } from '../gamification.constant';
import { AchievementMetricStrategyRegistry } from '../strategies/achievement-metric.strategy';
import { StreakStatsService } from './streak-stats.service';

export interface AchievementWithProgress {
  id: string;
  code: string;
  title: string;
  description: string;
  iconKey: string;
  imageUrl: string | null;
  threshold: number;
  xpReward: number;
  currentValue: number;
  progressPercent: number;
  unlockedAt: Date | null;
}

const PRISMA_UNIQUE_ERROR = 'P2002';

@Injectable()
export class AchievementService implements OnModuleInit {
  private readonly logger = new Logger(AchievementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metricRegistry: AchievementMetricStrategyRegistry,
    private readonly streakStats: StreakStatsService,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureDefaultSeeded();
    } catch (err) {
      this.logger.warn(
        `Chưa thể seed mặc định bảng achievements lúc khởi động: ${(err as Error).message}`,
      );
    }
  }

  async ensureDefaultSeeded(): Promise<void> {
    for (const item of DEFAULT_ACHIEVEMENTS) {
      await this.prisma.achievement.upsert({
        where: { code: item.code },
        update: {},
        create: {
          code: item.code,
          title: item.title,
          description: item.description,
          iconKey: item.iconKey,
          metricType: item.metricType,
          threshold: item.threshold,
          xpReward: item.xpReward,
          sortOrder: item.sortOrder,
        },
      });
    }
  }

  private loadCatalogAndUnlocked(userId: string) {
    return Promise.all([
      this.prisma.achievement.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true, unlockedAt: true },
      }),
    ]);
  }

  async evaluateAndUnlock(
    userId: string,
    stats: UserLearningStats,
  ): Promise<Achievement[]> {
    const [catalog, existing] = await this.loadCatalogAndUnlocked(userId);

    const unlockedSet = new Set(existing.map((e) => e.achievementId));
    const newlyUnlocked: Achievement[] = [];

    for (const ach of catalog) {
      if (unlockedSet.has(ach.id)) continue;
      const metricValue = this.metricRegistry.evaluateMetric(
        ach.metricType,
        stats,
      );
      if (metricValue < ach.threshold) continue;

      const created = await this.unlockIdempotent(userId, ach);
      if (!created) continue;
      newlyUnlocked.push(ach);
    }

    return newlyUnlocked;
  }

  async listWithProgress(
    userId: string,
    stats: UserLearningStats,
  ): Promise<AchievementWithProgress[]> {
    const [catalog, unlocked] = await this.loadCatalogAndUnlocked(userId);

    const unlockedMap = new Map(
      unlocked.map((u) => [u.achievementId, u.unlockedAt]),
    );

    return catalog.map((ach) => {
      const current = this.metricRegistry.evaluateMetric(ach.metricType, stats);
      const unlockedAt = unlockedMap.get(ach.id) ?? null;
      const ratio = Math.min(1, current / Math.max(1, ach.threshold));
      return {
        id: ach.id,
        code: ach.code,
        title: ach.title,
        description: ach.description,
        iconKey: ach.iconKey,
        imageUrl: ach.imageUrl ?? null,
        threshold: ach.threshold,
        xpReward: ach.xpReward,
        currentValue: unlockedAt ? Math.max(current, ach.threshold) : current,
        progressPercent: unlockedAt ? 100 : Math.round(ratio * 100),
        unlockedAt,
      };
    });
  }

  private async unlockIdempotent(
    userId: string,
    ach: Achievement,
  ): Promise<boolean> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.userAchievement.create({
          data: { userId, achievementId: ach.id },
        });
        if (ach.xpReward > 0) {
          await this.streakStats.addBonusXp(userId, ach.xpReward, tx);
        }
      });
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === PRISMA_UNIQUE_ERROR) {
        return false;
      }
      throw err;
    }

    try {
      await this.notificationService.notify(
        userId,
        NotificationType.ACHIEVEMENT_UNLOCKED,
        `Mở khóa huy hiệu: ${ach.title}`,
        `${ach.description} (+${ach.xpReward} XP)`,
        '/tai-khoan?tab=muc-tieu',
      );
    } catch (err) {
      this.logger.warn(
        `Không gửi được thông báo huy hiệu: ${(err as Error).message}`,
      );
    }

    return true;
  }
}
