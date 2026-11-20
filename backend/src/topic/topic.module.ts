import { Module } from '@nestjs/common';
import { TopicController } from './topic.controller';
import { TopicService } from './topic.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { SlugService } from '../common/services/slug.service';

@Module({
  controllers: [TopicController],
  providers: [TopicService, PrismaService, RedisService, SlugService],
  exports: [TopicService],
})
export class TopicModule {}
