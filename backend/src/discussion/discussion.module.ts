import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { DiscussionController } from './discussion.controller';
import { DiscussionService } from './discussion.service';
import { NotificationService } from '../notification/notification.service';

@Module({
  controllers: [DiscussionController],
  providers: [DiscussionService, NotificationService, PrismaService, RedisService],
  exports: [DiscussionService],
})
export class DiscussionModule {}
