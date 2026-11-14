import { Module } from '@nestjs/common';
import { StandaloneQuizController } from './standalone-quiz.controller';
import { QuizService } from './quiz.service';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';

@Module({
  controllers: [StandaloneQuizController, QuestionController],
  providers: [QuizService, QuestionService, PrismaService, RedisService],
  exports: [QuizService, QuestionService],
})
export class QuizModule {}
