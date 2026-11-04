import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { StandaloneQuizController } from './standalone-quiz.controller';
import { QuizService } from './quiz.service';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';

@Module({
  controllers: [QuizController, StandaloneQuizController, QuestionController],
  providers: [QuizService, QuestionService, PrismaService, RedisService],
  exports: [QuizService, QuestionService],
})
export class QuizModule {}
