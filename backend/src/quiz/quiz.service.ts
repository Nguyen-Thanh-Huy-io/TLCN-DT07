import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { UpsertQuizDto } from './dto/upsert-quiz.dto';
import { validateAndNormalizeQuestions } from './validators/quiz-question.validator';

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lấy đề ôn tập của 1 bài học (null nếu chưa có — hợp lệ, không phải lỗi) */
  async findByLessonId(lessonId: string) {
    return this.prisma.quiz.findUnique({ where: { lessonId } });
  }

  /** Tạo mới hoặc cập nhật nguyên đề (CMS luôn gửi lên toàn bộ mảng `questions`, giống
   * cách Block Builder lưu nguyên mảng `blocks` của Lesson.content). */
  async upsert(lessonId: string, dto: UpsertQuizDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException(`Không tìm thấy bài học với ID "${lessonId}"`);
    }

    const questions = validateAndNormalizeQuestions(dto.questions);

    return this.prisma.quiz.upsert({
      where: { lessonId },
      create: {
        lessonId,
        title: dto.title,
        passingScorePercent: dto.passingScorePercent,
        questions: questions as any,
      },
      update: {
        title: dto.title,
        passingScorePercent: dto.passingScorePercent,
        questions: questions as any,
      },
    });
  }

  /** Xóa đề ôn tập của 1 bài học */
  async remove(lessonId: string) {
    const existing = await this.prisma.quiz.findUnique({ where: { lessonId } });
    if (!existing) {
      throw new NotFoundException(`Bài học này chưa có đề ôn tập.`);
    }
    await this.prisma.quiz.delete({ where: { lessonId } });
    return { success: true, message: 'Đã xóa đề ôn tập.' };
  }
}
