import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { DEFAULT_CHAPTER_QUIZ_PASS_SCORE } from './chapter-progression.evaluator';

export const DEFAULT_STAGE_EXAM_PASS_SCORE = 70;

export interface StageUnlockContext {
  userId: string;
  prerequisitePath: {
    id: string;
    title: string;
    stageExamQuizId: string | null;
    stageExamPassScore: number | null;
    stageExamQuiz: {
      id: string;
      title: string | null;
      passingScorePercent: number | null;
    } | null;
    chapters: Array<{
      title?: string;
      chapterLessons: Array<{ lessonId: string }>;
      chapterQuizzes?: Array<{
        quizId: string;
        passScore: number | null;
        isRequired: boolean;
        quiz: {
          id: string;
          title: string | null;
          passingScorePercent: number | null;
        };
      }>;
    }>;
  };
}

export interface StageUnlockCheckResult {
  passed: boolean;
  reason?: string;
  totalLessons?: number;
  completedLessons?: number;
  stageExamQuizId?: string | null;
  stageExamTitle?: string | null;
  stageExamPassScore?: number;
  stageExamPassed?: boolean;
}

export interface StageUnlockStrategy {
  evaluate(context: StageUnlockContext): Promise<StageUnlockCheckResult>;
}

/**
 * Strategy 1: Yêu cầu hoàn thành 100% bài học của chặng tiên quyết.
 */
@Injectable()
export class LessonCompletionUnlockStrategy implements StageUnlockStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(context: StageUnlockContext): Promise<StageUnlockCheckResult> {
    const { userId, prerequisitePath } = context;
    const requiredLessonIds = prerequisitePath.chapters.flatMap((c) =>
      c.chapterLessons.map((cl) => cl.lessonId),
    );

    if (requiredLessonIds.length === 0) {
      return { passed: true, totalLessons: 0, completedLessons: 0 };
    }

    const completedProgress = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: requiredLessonIds },
      },
      select: { lessonId: true },
    });

    const completedCount = completedProgress.length;
    const totalCount = requiredLessonIds.length;
    const passed = completedCount >= totalCount;

    return {
      passed,
      totalLessons: totalCount,
      completedLessons: completedCount,
      reason: passed
        ? undefined
        : `Bạn cần hoàn thành toàn bộ lộ trình tiên quyết "${prerequisitePath.title}" (${completedCount}/${totalCount} bài) trước khi đăng ký lộ trình này.`,
    };
  }
}

/**
 * Strategy 2: Yêu cầu vượt qua bài kiểm tra cuối chặng (Stage Exam) nếu chặng tiên quyết có gắn đề thi.
 */
@Injectable()
export class StageExamUnlockStrategy implements StageUnlockStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(context: StageUnlockContext): Promise<StageUnlockCheckResult> {
    const { userId, prerequisitePath } = context;
    if (!prerequisitePath.stageExamQuizId) {
      return { passed: true, stageExamPassed: true };
    }

    const requiredScore =
      prerequisitePath.stageExamPassScore ??
      prerequisitePath.stageExamQuiz?.passingScorePercent ??
      DEFAULT_STAGE_EXAM_PASS_SCORE;

    const passedAttempt = await this.prisma.quizAttempt.findFirst({
      where: {
        userId,
        quizId: prerequisitePath.stageExamQuizId,
        OR: [{ isPassed: true }, { scorePercent: { gte: requiredScore } }],
      },
      select: { id: true, scorePercent: true },
    });

    const passed = Boolean(passedAttempt);
    const examTitle =
      prerequisitePath.stageExamQuiz?.title || 'Kiểm tra cuối chặng';

    return {
      passed,
      stageExamQuizId: prerequisitePath.stageExamQuizId,
      stageExamTitle: examTitle,
      stageExamPassScore: requiredScore,
      stageExamPassed: passed,
      reason: passed
        ? undefined
        : `Bạn cần vượt qua bài kiểm tra cuối chặng "${examTitle}" (đạt tối thiểu ${requiredScore}%) của chặng "${prerequisitePath.title}" trước khi mở chặng tiếp theo.`,
    };
  }
}

/**
 * Strategy 3: Yêu cầu vượt qua toàn bộ đề kiểm tra bắt buộc (isRequired = true) của các chương trong chặng tiên quyết.
 */
@Injectable()
export class ChapterQuizzesUnlockStrategy implements StageUnlockStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(context: StageUnlockContext): Promise<StageUnlockCheckResult> {
    const { userId, prerequisitePath } = context;
    const requiredQuizzes = prerequisitePath.chapters.flatMap((ch) =>
      (ch.chapterQuizzes ?? [])
        .filter((cq) => cq.isRequired)
        .map((cq) => ({
          chapterTitle: ch.title || 'Chương học',
          quizId: cq.quizId,
          quizTitle: cq.quiz.title || 'Đề kiểm tra chương',
          requiredScore:
            cq.passScore ??
            cq.quiz.passingScorePercent ??
            DEFAULT_CHAPTER_QUIZ_PASS_SCORE,
        })),
    );

    if (requiredQuizzes.length === 0) {
      return { passed: true };
    }

    const attempts = this.prisma.quizAttempt
      ? await this.prisma.quizAttempt.findMany({
          where: {
            userId,
            quizId: { in: requiredQuizzes.map((q) => q.quizId) },
          },
          select: { quizId: true, scorePercent: true, isPassed: true },
        })
      : [];

    for (const req of requiredQuizzes) {
      const matched = attempts.some(
        (a) =>
          a.quizId === req.quizId &&
          (a.scorePercent >= req.requiredScore || a.isPassed),
      );
      if (!matched) {
        return {
          passed: false,
          reason: `Bạn cần vượt qua đề kiểm tra "${req.quizTitle}" (đạt tối thiểu ${req.requiredScore}%) thuộc "${req.chapterTitle}" của chặng "${prerequisitePath.title}" trước khi mở chặng tiếp theo.`,
        };
      }
    }

    return { passed: true };
  }
}
