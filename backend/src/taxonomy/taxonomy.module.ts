import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { TaxonomyController } from './taxonomy.controller';
import { TaxonomyService } from './taxonomy.service';

@Module({
  controllers: [TaxonomyController],
  // RedisService: cần cho AuthGuard / RolesGuard của các route CMS.
  providers: [TaxonomyService, PrismaService, RedisService],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}
