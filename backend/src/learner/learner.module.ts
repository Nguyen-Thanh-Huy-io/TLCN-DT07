import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { LessonModule } from '../lesson/lesson.module';
import { LearningPathModule } from '../learning-path/learning-path.module';
import { LearnerController } from './learner.controller';
import { LearnerService } from './learner.service';
import {
  CompletedLessonHistoryStrategy,
  LearnerHistoryStrategyRegistry,
  QuizAttemptHistoryStrategy,
  ReadArticleHistoryStrategy,
} from './strategies/learner-history.strategy';

// RedisService + PrismaService are listed because AuthGuard depends on them.
@Module({
  imports: [LessonModule, LearningPathModule],
  controllers: [LearnerController],
  providers: [
    LearnerService,
    QuizAttemptHistoryStrategy,
    CompletedLessonHistoryStrategy,
    ReadArticleHistoryStrategy,
    LearnerHistoryStrategyRegistry,
    PrismaService,
    RedisService,
  ],
})
export class LearnerModule {}
