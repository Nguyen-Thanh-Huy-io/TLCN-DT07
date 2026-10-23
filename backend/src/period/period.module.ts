import { Module } from '@nestjs/common';
import { PeriodController } from './period.controller';
import { PeriodService } from './period.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { SlugService } from '../common/services/slug.service';
import { TaxonomyModule } from '../taxonomy/taxonomy.module';

@Module({
  imports: [TaxonomyModule],
  controllers: [PeriodController],
  providers: [PeriodService, PrismaService, RedisService, SlugService],
  exports: [PeriodService],
})
export class PeriodModule {}
