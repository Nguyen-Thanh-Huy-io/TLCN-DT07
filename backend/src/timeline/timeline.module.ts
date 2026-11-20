import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { SlugService } from '../common/services/slug.service';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';

@Module({
  controllers: [TimelineController],
  providers: [TimelineService, PrismaService, RedisService, SlugService],
  exports: [TimelineService],
})
export class TimelineModule {}
