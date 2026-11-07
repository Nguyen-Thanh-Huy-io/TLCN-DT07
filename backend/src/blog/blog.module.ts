import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { BlogController } from './blog.controller';
import { BlogGateway } from './blog.gateway';
import { BlogService } from './blog.service';

@Module({
  controllers: [BlogController],
  providers: [BlogService, BlogGateway, PrismaService],
  exports: [BlogService],
})
export class BlogModule {}
