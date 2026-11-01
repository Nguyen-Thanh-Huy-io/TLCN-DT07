import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogGateway } from './blog.gateway';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';

@Module({
  controllers: [BlogController],
  providers: [BlogService, BlogGateway, PrismaService, RedisService],
  exports: [BlogService, BlogGateway],
})
export class BlogModule {}
