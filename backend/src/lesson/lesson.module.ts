import { Module } from '@nestjs/common';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';

@Module({
  controllers: [LessonController],
  providers: [LessonService, PrismaService, RedisService],
  exports: [LessonService],
})
export class LessonModule {}
