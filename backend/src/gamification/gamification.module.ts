import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { NotificationModule } from '../notification/notification.module';
import { GamificationAdminController } from './gamification-admin.controller';
import { GamificationController } from './gamification.controller';
import { GamificationEventListener } from './listeners/gamification.listener';
import { AchievementService } from './services/achievement.service';
import { ActivityTrackerService } from './services/activity-tracker.service';
import { GamificationAdminService } from './services/gamification-admin.service';
import { GamificationFacadeService } from './services/gamification-facade.service';
import { GoalService } from './services/goal.service';
import { StreakStatsService } from './services/streak-stats.service';
import { AchievementMetricStrategyRegistry } from './strategies/achievement-metric.strategy';
import { GoalTargetStrategyRegistry } from './strategies/goal-target.strategy';

// RedisService + PrismaService are listed because AuthGuard depends on them.
@Module({
  imports: [NotificationModule],
  controllers: [GamificationController, GamificationAdminController],
  providers: [
    PrismaService,
    RedisService,
    GoalTargetStrategyRegistry,
    AchievementMetricStrategyRegistry,
    ActivityTrackerService,
    StreakStatsService,
    GoalService,
    AchievementService,
    GamificationAdminService,
    GamificationFacadeService,
    GamificationEventListener,
  ],
  exports: [GamificationFacadeService],
})
export class GamificationModule {}
