import { Module } from '@nestjs/common';
import { HistoricalEventController } from './historical-event.controller';
import { HistoricalEventService } from './historical-event.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';

@Module({
  controllers: [HistoricalEventController],
  providers: [HistoricalEventService, PrismaService, RedisService],
  exports: [HistoricalEventService],
})
export class HistoricalEventModule {}
