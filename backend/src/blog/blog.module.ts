import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { NotificationModule } from '../notification/notification.module';
import { BlogController } from './blog.controller';
import { BlogGateway } from './blog.gateway';
import { BlogService } from './blog.service';

@Module({
  imports: [NotificationModule],
  controllers: [BlogController],
  providers: [BlogService, BlogGateway, PrismaService],
  exports: [BlogService],
})
export class BlogModule {}
