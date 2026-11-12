import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { ModerationModule } from '../moderation/moderation.module';
import { NotificationModule } from '../notification/notification.module';
import { BlogGatewayModule } from './blog-gateway.module';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';

@Module({
  imports: [NotificationModule, BlogGatewayModule, ModerationModule],
  controllers: [BlogController],
  providers: [BlogService, PrismaService, RedisService],
  exports: [BlogService, BlogGatewayModule],
})
export class BlogModule {}
