import { Injectable, BadRequestException, Optional } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import {
  ChapterQuizzesUnlockStrategy,
  LessonCompletionUnlockStrategy,
  StageExamUnlockStrategy,
} from '../strategies/stage-unlock.strategy';

export interface PrerequisiteValidationResult {
  isEligible: boolean;
  prerequisitePathId?: string;
  prerequisitePathTitle?: string;
  totalLessons: number;
  completedLessons: number;
  stageExamQuizId?: string | null;
  stageExamTitle?: string | null;
  stageExamPassScore?: number;
  stageExamPassed?: boolean;
  reason?: string;
}

@Injectable()
export class PathPrerequisitePolicy {
  private readonly lessonStrategy: LessonCompletionUnlockStrategy;
  private readonly chapterQuizzesStrategy: ChapterQuizzesUnlockStrategy;
  private readonly examStrategy: StageExamUnlockStrategy;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() lessonStrategy?: LessonCompletionUnlockStrategy,
    @Optional() examStrategy?: StageExamUnlockStrategy,
    @Optional() chapterQuizzesStrategy?: ChapterQuizzesUnlockStrategy,
  ) {
    this.lessonStrategy =
      lessonStrategy ?? new LessonCompletionUnlockStrategy(prisma);
    this.examStrategy = examStrategy ?? new StageExamUnlockStrategy(prisma);
    this.chapterQuizzesStrategy =
      chapterQuizzesStrategy ?? new ChapterQuizzesUnlockStrategy(prisma);
  }

  /**
   * Kiểm tra điều kiện tiên quyết khi người học muốn đăng ký một lộ trình.
   * Áp dụng Strategy Pattern: kết hợp LessonCompletionUnlockStrategy (100% bài học),
   * ChapterQuizzesUnlockStrategy (đề kiểm tra bắt buộc của từng chương)
   * và StageExamUnlockStrategy (vượt qua bài kiểm tra cuối chặng nếu có).
   */
  async validateEnrollmentEligibility(
    userId: string,
    targetPathId: string,
  ): Promise<PrerequisiteValidationResult> {
    const targetPath = await this.prisma.learningPath.findUnique({
      where: { id: targetPathId },
      select: {
        id: true,
        title: true,
        prerequisitePathId: true,
        prerequisitePath: {
          select: {
            id: true,
            title: true,
            stageExamQuizId: true,
            stageExamPassScore: true,
            stageExamQuiz: {
              select: {
                id: true,
                title: true,
                passingScorePercent: true,
              },
            },
            chapters: {
              orderBy: { displayOrder: 'asc' },
              select: {
                title: true,
                chapterLessons: {
                  select: { lessonId: true },
                },
                chapterQuizzes: {
                  orderBy: { displayOrder: 'asc' },
                  select: {
                    quizId: true,
                    passScore: true,
                    isRequired: true,
                    quiz: {
                      select: {
                        id: true,
                        title: true,
                        passingScorePercent: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (
      !targetPath ||
      !targetPath.prerequisitePathId ||
      !targetPath.prerequisitePath
    ) {
      return { isEligible: true, totalLessons: 0, completedLessons: 0 };
    }

    const prereq = targetPath.prerequisitePath;
    const context = { userId, prerequisitePath: prereq };

    const [lessonCheck, chapterQuizCheck, examCheck] = await Promise.all([
      this.lessonStrategy.evaluate(context),
      this.chapterQuizzesStrategy.evaluate(context),
      this.examStrategy.evaluate(context),
    ]);

    const isEligible =
      lessonCheck.passed && chapterQuizCheck.passed && examCheck.passed;
    const reason = !lessonCheck.passed
      ? lessonCheck.reason
      : !chapterQuizCheck.passed
        ? chapterQuizCheck.reason
        : !examCheck.passed
          ? examCheck.reason
          : undefined;

    return {
      isEligible,
      prerequisitePathId: prereq.id,
      prerequisitePathTitle: prereq.title,
      totalLessons: lessonCheck.totalLessons ?? 0,
      completedLessons: lessonCheck.completedLessons ?? 0,
      stageExamQuizId: examCheck.stageExamQuizId,
      stageExamTitle: examCheck.stageExamTitle,
      stageExamPassScore: examCheck.stageExamPassScore,
      stageExamPassed: examCheck.stageExamPassed,
      reason,
    };
  }

  /**
   * Đảm bảo không tạo vòng lặp phụ thuộc (circular dependency: A -> B -> A).
   */
  async assertNoCircularDependency(
    pathId: string,
    newPrerequisiteId?: string | null,
  ): Promise<void> {
    if (!newPrerequisiteId) return;

    if (pathId === newPrerequisiteId) {
      throw new BadRequestException(
        'Lộ trình không thể tự làm điều kiện tiên quyết của chính nó.',
      );
    }

    let currentCheckId: string | null = newPrerequisiteId;
    const visited = new Set<string>([pathId]);

    while (currentCheckId) {
      if (visited.has(currentCheckId)) {
        throw new BadRequestException(
          'Phát hiện vòng lặp điều kiện tiên quyết giữa các lộ trình.',
        );
      }
      visited.add(currentCheckId);

      const parent: { prerequisitePathId: string | null } | null =
        await this.prisma.learningPath.findUnique({
          where: { id: currentCheckId },
          select: { prerequisitePathId: true },
        });

      currentCheckId = parent?.prerequisitePathId ?? null;
    }
  }
}
