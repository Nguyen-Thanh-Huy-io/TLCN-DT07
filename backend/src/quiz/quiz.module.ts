import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';

// `RedisService` bắt buộc phải khai ở đây vì `AuthGuard` (dùng trong QuizController qua
// @UseGuards) cần nó để kiểm tra rate-limit/token — thiếu sẽ crash lúc Nest khởi tạo module
// (UnknownDependenciesException), đúng như mẫu đã làm ở PeriodModule/LessonModule.
@Module({
  controllers: [QuizController],
  providers: [QuizService, PrismaService, RedisService],
  exports: [QuizService],
})
export class QuizModule {}
