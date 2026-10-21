import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { SlugService } from '../common/services/slug.service';
import { HistoricalEntityController } from './historical-entity.controller';
import { HistoricalEntityService } from './historical-entity.service';

@Module({
  controllers: [HistoricalEntityController],
  providers: [
    HistoricalEntityService,
    PrismaService,
    RedisService,
    SlugService,
  ],
  exports: [HistoricalEntityService],
})
export class HistoricalEntityModule {}
