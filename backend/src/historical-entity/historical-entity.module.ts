import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { SlugService } from '../common/services/slug.service';
import { HistoricalEntityController } from './historical-entity.controller';
import { HistoricalEntityService } from './historical-entity.service';
import { TaxonomyModule } from '../taxonomy/taxonomy.module';
import { PersonEntityDelegate } from './delegates/person-entity.delegate';
import { SiteEntityDelegate } from './delegates/site-entity.delegate';

@Module({
  imports: [TaxonomyModule],
  controllers: [HistoricalEntityController],
  providers: [
    HistoricalEntityService,
    PersonEntityDelegate,
    SiteEntityDelegate,
    PrismaService,
    RedisService,
    SlugService,
  ],
  exports: [HistoricalEntityService, PersonEntityDelegate, SiteEntityDelegate],
})
export class HistoricalEntityModule {}
