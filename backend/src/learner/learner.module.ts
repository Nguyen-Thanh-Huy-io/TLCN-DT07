import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { LessonModule } from '../lesson/lesson.module';
import { LearnerController } from './learner.controller';
import { LearnerService } from './learner.service';

// RedisService + PrismaService are listed because AuthGuard depends on them.
@Module({
  imports: [LessonModule],
  controllers: [LearnerController],
  providers: [LearnerService, PrismaService, RedisService],
})
export class LearnerModule {}
