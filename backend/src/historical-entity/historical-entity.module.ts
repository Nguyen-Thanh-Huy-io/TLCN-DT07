import { Module } from '@nestjs/common';
import { HistoricalEntityController } from './historical-entity.controller';
import { HistoricalEntityService } from './historical-entity.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';

@Module({
  controllers: [HistoricalEntityController],
  providers: [
    HistoricalEntityService,
    PrismaService,
    RedisService,
    CustomLoggerService,
  ],
  exports: [HistoricalEntityService],
})
export class HistoricalEntityModule {}
