import { forwardRef, Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { ModerationModule } from '../moderation/moderation.module';
import { NotificationModule } from '../notification/notification.module';
import { BlogController } from './blog.controller';
import { BlogGateway } from './blog.gateway';
import { BlogService } from './blog.service';

@Module({
  imports: [NotificationModule, forwardRef(() => ModerationModule)],
  controllers: [BlogController],
  providers: [BlogService, BlogGateway, PrismaService, RedisService],
  exports: [BlogService, BlogGateway],
})
export class BlogModule {}
