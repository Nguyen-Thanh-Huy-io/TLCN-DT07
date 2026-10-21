import { Module } from '@nestjs/common';
import { HistoricalEventController } from './historical-event.controller';
import { HistoricalEventService } from './historical-event.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { SlugService } from '../common/services/slug.service';
import { HISTORICAL_EVENT_TOKENS } from './historical-event.constant';
import { HistoricalEventPrismaRepository } from './repositories/historical-event.prisma.repository';
import { EventMetadataStrategyRegistry } from './strategies/event-metadata-strategy.registry';
import {
  BattleMetadataStrategy,
  TreatyMetadataStrategy,
  NaturalDisasterMetadataStrategy,
  DefaultEventMetadataStrategy,
} from './strategies/category-metadata.strategies';

@Module({
  controllers: [HistoricalEventController],
  providers: [
    HistoricalEventService,
    PrismaService,
    RedisService,
    SlugService,
    HistoricalEventPrismaRepository,
    {
      provide: HISTORICAL_EVENT_TOKENS.REPOSITORY,
      useClass: HistoricalEventPrismaRepository,
    },
    BattleMetadataStrategy,
    TreatyMetadataStrategy,
    NaturalDisasterMetadataStrategy,
    DefaultEventMetadataStrategy,
    EventMetadataStrategyRegistry,
  ],
  exports: [
    HistoricalEventService,
    EventMetadataStrategyRegistry,
    HISTORICAL_EVENT_TOKENS.REPOSITORY,
  ],
})
export class HistoricalEventModule {}
