import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { SlugService } from '../common/services/slug.service';
import { HistoricalEntityController } from './historical-entity.controller';
import { HistoricalEntityService } from './historical-entity.service';
import { TaxonomyModule } from '../taxonomy/taxonomy.module';
import { PersonEntityDelegate } from './delegates/person-entity.delegate';
import { SiteEntityDelegate } from './delegates/site-entity.delegate';
import { PersonTimelineBuilder } from './timeline/person-timeline.builder';
import { StatementDirectionProjector } from './timeline/statement-direction.projector';
import { PersonTimelineService } from './timeline/person-timeline.service';

@Module({
  imports: [TaxonomyModule],
  controllers: [HistoricalEntityController],
  providers: [
    HistoricalEntityService,
    PersonEntityDelegate,
    SiteEntityDelegate,
    PersonTimelineBuilder,
    StatementDirectionProjector,
    PersonTimelineService,
    PrismaService,
    RedisService,
    SlugService,
  ],
  exports: [
    HistoricalEntityService,
    PersonEntityDelegate,
    SiteEntityDelegate,
    PersonTimelineService,
    PersonTimelineBuilder,
  ],
})
export class HistoricalEntityModule {}
