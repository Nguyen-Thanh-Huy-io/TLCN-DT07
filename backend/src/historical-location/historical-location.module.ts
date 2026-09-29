import { Module } from '@nestjs/common';
import { HistoricalLocationController } from './historical-location.controller';
import { HistoricalLocationService } from './historical-location.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';

@Module({
  controllers: [HistoricalLocationController],
  providers: [
    HistoricalLocationService,
    PrismaService,
    RedisService,
    CustomLoggerService,
  ],
  exports: [HistoricalLocationService],
})
export class HistoricalLocationModule {}
