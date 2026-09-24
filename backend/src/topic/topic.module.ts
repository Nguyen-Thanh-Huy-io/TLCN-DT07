import { Module } from '@nestjs/common';
import { TopicController } from './topic.controller';
import { TopicService } from './topic.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';

@Module({
  controllers: [TopicController],
  providers: [TopicService, PrismaService, RedisService],
  exports: [TopicService],
})
export class TopicModule {}
