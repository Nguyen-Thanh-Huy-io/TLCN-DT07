import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { MultipleChoiceEvaluator } from './evaluators/multiple-choice.evaluator';
import { MultipleSelectEvaluator } from './evaluators/multiple-select.evaluator';
import { TrueFalseEvaluator } from './evaluators/true-false.evaluator';
import { QuestionEvaluatorFactory } from './evaluators/question-evaluator.factory';
import { StandardScoringStrategy } from './strategies/scoring/standard-scoring.strategy';
import { WeightedScoringStrategy } from './strategies/scoring/weighted-scoring.strategy';
import { ScoringStrategyContext } from './strategies/scoring/scoring-strategy.context';

@Module({
  controllers: [QuizController],
  providers: [
    QuizService,
    PrismaService,
    RedisService,
    CustomLoggerService,
    // Evaluators (Factory pattern components)
    MultipleChoiceEvaluator,
    MultipleSelectEvaluator,
    TrueFalseEvaluator,
    QuestionEvaluatorFactory,
    // Strategies (Strategy pattern components)
    StandardScoringStrategy,
    WeightedScoringStrategy,
    ScoringStrategyContext,
  ],
  exports: [QuizService],
})
export class QuizModule {}
