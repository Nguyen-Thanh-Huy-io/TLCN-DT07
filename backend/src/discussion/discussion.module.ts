import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { DiscussionController } from './discussion.controller';
import { DiscussionService } from './discussion.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [DiscussionController],
  providers: [DiscussionService, PrismaService, RedisService],
  exports: [DiscussionService],
})
export class DiscussionModule {}
