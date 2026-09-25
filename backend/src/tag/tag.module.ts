import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';

@Module({
  controllers: [TagController],
  providers: [TagService, PrismaService, RedisService],
  exports: [TagService],
})
export class TagModule {}
