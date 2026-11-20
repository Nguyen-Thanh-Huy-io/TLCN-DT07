import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ReviewQueueService } from './review-queue.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardService,
    ReviewQueueService,
    PrismaService,
    RedisService,
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
