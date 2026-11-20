import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { ModerationModule } from '../moderation/moderation.module';
import { NotificationModule } from '../notification/notification.module';
import { BlogGatewayModule } from './blog-gateway.module';
import { BlogCommentService } from './blog-comment.service';
import { BlogFollowService } from './blog-follow.service';
import { BlogInteractionService } from './blog-interaction.service';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';

@Module({
  imports: [NotificationModule, BlogGatewayModule, ModerationModule],
  controllers: [BlogController],
  providers: [
    BlogService,
    BlogCommentService,
    BlogInteractionService,
    BlogFollowService,
    PrismaService,
    RedisService,
  ],
  exports: [
    BlogService,
    BlogCommentService,
    BlogInteractionService,
    BlogFollowService,
    BlogGatewayModule,
  ],
})
export class BlogModule {}
