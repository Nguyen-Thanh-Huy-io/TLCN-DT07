import { Module } from '@nestjs/common';
import { LearningPathController } from './learning-path.controller';
import { LearningPathService } from './learning-path.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { SlugService } from '../common/services/slug.service';
import { AuthModule } from '../auth/auth.module';
import { SequentialProgressionStrategy } from './strategies/sequential-progression.strategy';
import { FreePacedProgressionStrategy } from './strategies/free-paced-progression.strategy';
import { ProgressionStrategyFactory } from './strategies/progression-strategy.factory';
import {
  ChapterQuizzesUnlockStrategy,
  LessonCompletionUnlockStrategy,
  StageExamUnlockStrategy,
} from './strategies/stage-unlock.strategy';
import { ChapterProgressionEvaluator } from './strategies/chapter-progression.evaluator';
import { PathPrerequisitePolicy } from './policies/path-prerequisite.policy';

@Module({
  imports: [AuthModule],
  controllers: [LearningPathController],
  providers: [
    LearningPathService,
    PrismaService,
    RedisService,
    SlugService,
    SequentialProgressionStrategy,
    FreePacedProgressionStrategy,
    ProgressionStrategyFactory,
    LessonCompletionUnlockStrategy,
    ChapterQuizzesUnlockStrategy,
    StageExamUnlockStrategy,
    ChapterProgressionEvaluator,
    PathPrerequisitePolicy,
  ],
  exports: [
    LearningPathService,
    ProgressionStrategyFactory,
    ChapterProgressionEvaluator,
    PathPrerequisitePolicy,
  ],
})
export class LearningPathModule {}
