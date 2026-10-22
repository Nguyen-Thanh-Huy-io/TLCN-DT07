import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { LessonModule } from '../lesson/lesson.module';
import { QuizModule } from '../quiz/quiz.module';
import { LearnerController } from './learner.controller';
import { LearnerService } from './learner.service';

// RedisService + PrismaService are listed because AuthGuard depends on them (same as QuizModule).
@Module({
  imports: [LessonModule, QuizModule],
  controllers: [LearnerController],
  providers: [LearnerService, PrismaService, RedisService],
})
export class LearnerModule {}
