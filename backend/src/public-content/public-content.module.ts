import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { PublicContentController } from './public-content.controller';
import { LandingContentFacade } from './landing-content.facade';
import { LandingSectionRegistry } from './strategies/landing-section.registry';
import {
  ChaptersSectionStrategy,
  KnowledgeSectionStrategy,
} from './strategies/landing-section.strategy';
import { LANDING_SECTION_STRATEGIES } from './public-content.constant';

@Module({
  controllers: [PublicContentController],
  providers: [
    PrismaService,
    RedisService,
    ChaptersSectionStrategy,
    KnowledgeSectionStrategy,
    {
      provide: LANDING_SECTION_STRATEGIES,
      useFactory: (
        chapters: ChaptersSectionStrategy,
        knowledge: KnowledgeSectionStrategy,
      ) => [chapters, knowledge],
      inject: [ChaptersSectionStrategy, KnowledgeSectionStrategy],
    },
    LandingSectionRegistry,
    LandingContentFacade,
  ],
  exports: [LandingContentFacade],
})
export class PublicContentModule {}
