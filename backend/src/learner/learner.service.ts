import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { LessonService } from '../lesson/lesson.service';
import { QuizService } from '../quiz/quiz.service';
import { LEARNER_ERROR_CODES, LEARNER_MESSAGES } from './learner.constant';

@Injectable()
export class LearnerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lessonService: LessonService,
    private readonly quizService: QuizService,
  ) {}

  /** Lộ trình đã đăng ký + bài đã hoàn thành của người học. */
  async getOverview(userId: string) {
    const [enrollments, progress] = await Promise.all([
      this.prisma.learningPathEnrollment.findMany({
        where: { userId },
        select: { learningPathId: true, enrolledAt: true },
        orderBy: { enrolledAt: 'asc' },
      }),
      this.prisma.lessonProgress.findMany({
        where: { userId },
        select: { lessonId: true, completedAt: true },
      }),
    ]);
    return {
      enrolledPathIds: enrollments.map((e) => e.learningPathId),
      completedLessonIds: progress.map((p) => p.lessonId),
    };
  }

  async enroll(userId: string, learningPathId: string) {
    const path = await this.prisma.learningPath.findFirst({
      where: { id: learningPathId, status: ContentStatus.PUBLISHED },
      select: { id: true },
    });
    if (!path) {
      throw new NotFoundException(
        LEARNER_MESSAGES.PATH_NOT_FOUND(learningPathId),
      );
    }
    await this.prisma.learningPathEnrollment.upsert({
      where: { userId_learningPathId: { userId, learningPathId } },
      update: {},
      create: { userId, learningPathId },
    });
    return this.getOverview(userId);
  }

  async unenroll(userId: string, learningPathId: string) {
    await this.prisma.learningPathEnrollment.deleteMany({
      where: { userId, learningPathId },
    });
    return this.getOverview(userId);
  }

  /**
   * Nội dung bài để đọc. Bài nằm trong lộ trình đã xuất bản thì phải đăng ký một trong các
   * lộ trình đó; bài chỉ có trong thư viện (không thuộc lộ trình nào) thì đăng nhập là đủ.
   */
  async getLessonForReading(userId: string, slug: string) {
    const lesson = await this.lessonService.findBySlug(slug);
    if (lesson.status !== ContentStatus.PUBLISHED) {
      throw new NotFoundException(LEARNER_MESSAGES.LESSON_NOT_FOUND(slug));
    }

    const containingPaths = await this.prisma.learningPath.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        chapters: {
          some: { chapterLessons: { some: { lessonId: lesson.id } } },
        },
      },
      select: {
        id: true,
        enrollments: { where: { userId }, select: { id: true } },
      },
    });

    const enrolled = containingPaths.some((p) => p.enrollments.length > 0);
    if (containingPaths.length > 0 && !enrolled) {
      throw new ForbiddenException({
        code: LEARNER_ERROR_CODES.NOT_ENROLLED,
        message: LEARNER_MESSAGES.NOT_ENROLLED,
        learningPathIds: containingPaths.map((p) => p.id),
      });
    }

    const quiz = await this.quizService.findByLessonId(lesson.id);
    return { lesson, quiz };
  }

  async completeLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, status: ContentStatus.PUBLISHED },
      select: { id: true },
    });
    if (!lesson) {
      throw new NotFoundException(LEARNER_MESSAGES.LESSON_NOT_FOUND(lessonId));
    }
    await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {},
      create: { userId, lessonId },
    });
    return this.getOverview(userId);
  }
}
