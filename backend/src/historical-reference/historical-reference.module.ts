import { Module } from '@nestjs/common';
import { HistoricalReferenceController } from './historical-reference.controller';
import { HistoricalReferenceService } from './historical-reference.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';

@Module({
  controllers: [HistoricalReferenceController],
  providers: [HistoricalReferenceService, PrismaService, RedisService],
  exports: [HistoricalReferenceService],
})
export class HistoricalReferenceModule {}
