import {
  ChapterQuizProgressionStateEnum,
  LessonProgressionStateEnum,
  ProgressionGateKindEnum,
} from '@/constants/enums';
import type {
  ChapterItem,
  ChapterQuizItem,
  ChapterQuizProgressionState,
  LearningPathItem,
  LessonProgressionState,
} from '@/services/entities/learner.service';
import { publishedChapterLessons } from '../facades/usePublicCurriculumFacade';

export const DEFAULT_CHAPTER_QUIZ_PASS_SCORE = 70;

export interface EvaluatedJourneyLesson {
  lessonId: string;
  state: LessonProgressionState;
  lockedReason?: string;
}

export interface EvaluatedJourneyQuiz {
  id: string;
  quizId: string;
  title: string;
  effectivePassScore: number;
  timeLimitMinutes: number | null;
  questionCount: number | null;
  isRequired: boolean;
  bestScorePercent: number | null;
  state: ChapterQuizProgressionState;
  lockedReason?: string;
}

export interface EvaluatedJourneyChapter {
  chapterId: string;
  isLessonsComplete: boolean;
  isRequiredQuizzesPassed: boolean;
  isChapterFullyComplete: boolean;
  lessons: Map<string, EvaluatedJourneyLesson>;
  quizzes: EvaluatedJourneyQuiz[];
}

export interface JourneyProgressContext {
  isCompleted: (lessonId: string) => boolean;
  isQuizPassed?: (quizId: string) => boolean;
  bestQuizScores?: Record<string, number>;
}

export function resolveChapterQuizPassScore(cq: ChapterQuizItem): number {
  return (
    cq.passScore ??
    cq.quiz?.passingScorePercent ??
    DEFAULT_CHAPTER_QUIZ_PASS_SCORE
  );
}

export function readBestQuizScore(
  scores: Record<string, number> | undefined,
  quizId: string,
): number | null {
  if (!scores) return null;
  const val = scores[quizId];
  return Number.isFinite(val) ? val : null;
}

export function isChapterQuizPassedByContext(
  cq: ChapterQuizItem,
  ctx: JourneyProgressContext,
): boolean {
  const requiredScore = resolveChapterQuizPassScore(cq);
  const bestScore = readBestQuizScore(ctx.bestQuizScores, cq.quizId);
  if (bestScore !== null) {
    if (bestScore >= requiredScore) return true;
    return cq.passScore == null && Boolean(ctx.isQuizPassed?.(cq.quizId));
  }
  return Boolean(ctx.isQuizPassed?.(cq.quizId));
}

type BlockingGate =
  | {
      kind: ProgressionGateKindEnum.LESSON;
      chapterId: string;
      chapterTitle: string;
      lessonTitle: string;
    }
  | {
      kind: ProgressionGateKindEnum.CHAPTER_QUIZ;
      chapterTitle: string;
      quizTitle: string;
      passScore: number;
    };

function buildLockedLessonReason(gate: BlockingGate): string {
  if (gate.kind === ProgressionGateKindEnum.LESSON) {
    return `Cần hoàn thành bài "${gate.lessonTitle}" trước để mở khóa.`;
  }
  return `Cần vượt qua đề "${gate.quizTitle}" (đạt ≥ ${gate.passScore}%) của ${gate.chapterTitle} để mở khóa chương này.`;
}

function buildLockedQuizReason(
  chapter: Pick<ChapterItem, 'id' | 'title'>,
  gate: BlockingGate | null,
): string {
  if (gate?.kind === ProgressionGateKindEnum.LESSON) {
    if (gate.chapterId === chapter.id) {
      return `Hoàn thành các bài học trong "${chapter.title}" để mở đề kiểm tra này.`;
    }
    return `Hoàn thành bài "${gate.lessonTitle}" (${gate.chapterTitle}) trước để mở đề kiểm tra này.`;
  }
  if (gate?.kind === ProgressionGateKindEnum.CHAPTER_QUIZ) {
    return `Vượt qua đề "${gate.quizTitle}" của "${gate.chapterTitle}" trước.`;
  }
  return 'Hoàn thành nội dung trước đó để mở đề kiểm tra.';
}

function evaluateChapterLessonsStep(
  chapter: ChapterItem,
  isSequential: boolean,
  ctx: JourneyProgressContext,
  initialGate: BlockingGate | null,
): {
  lessonMap: Map<string, EvaluatedJourneyLesson>;
  publishedCount: number;
  isLessonsComplete: boolean;
  blockingGate: BlockingGate | null;
} {
  const publishedLessons = publishedChapterLessons(chapter).map(
    (cl) => cl.lesson,
  );
  const lessonMap = new Map<string, EvaluatedJourneyLesson>();
  let blockingGate = initialGate;
  let completedCount = 0;

  for (const lesson of publishedLessons) {
    if (ctx.isCompleted(lesson.id)) {
      completedCount++;
      lessonMap.set(lesson.id, {
        lessonId: lesson.id,
        state: LessonProgressionStateEnum.COMPLETED,
      });
      continue;
    }

    if (!isSequential || !blockingGate) {
      lessonMap.set(lesson.id, {
        lessonId: lesson.id,
        state: LessonProgressionStateEnum.CURRENT_UNLOCKED,
      });
      if (isSequential) {
        blockingGate = {
          kind: ProgressionGateKindEnum.LESSON,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          lessonTitle: lesson.title,
        };
      }
      continue;
    }

    lessonMap.set(lesson.id, {
      lessonId: lesson.id,
      state: LessonProgressionStateEnum.LOCKED_PREREQUISITE,
      lockedReason: buildLockedLessonReason(blockingGate),
    });
  }

  return {
    lessonMap,
    publishedCount: publishedLessons.length,
    isLessonsComplete:
      publishedLessons.length === 0 ||
      completedCount === publishedLessons.length,
    blockingGate,
  };
}

function evaluateChapterQuizzesStep(
  chapter: ChapterItem,
  isSequential: boolean,
  ctx: JourneyProgressContext,
  initialGate: BlockingGate | null,
): {
  quizzes: EvaluatedJourneyQuiz[];
  allRequiredQuizzesPassed: boolean;
  blockingGate: BlockingGate | null;
} {
  const chapterQuizzes = chapter.chapterQuizzes || [];
  const chapterReadyForQuizzes = !isSequential || initialGate === null;
  let blockingGate = initialGate;
  let allRequiredQuizzesPassed = true;
  const quizzes: EvaluatedJourneyQuiz[] = [];

  for (const cq of chapterQuizzes) {
    const effectivePassScore = resolveChapterQuizPassScore(cq);
    const title = cq.quiz?.title || 'Đề kiểm tra chương';
    const passed = isChapterQuizPassedByContext(cq, ctx);
    const bestScore = readBestQuizScore(ctx.bestQuizScores, cq.quizId);

    if (cq.isRequired && !passed) {
      allRequiredQuizzesPassed = false;
    }

    let state: ChapterQuizProgressionState =
      ChapterQuizProgressionStateEnum.LOCKED;
    let lockedReason: string | undefined;

    if (!chapterReadyForQuizzes) {
      lockedReason = buildLockedQuizReason(chapter, blockingGate);
    } else if (passed) {
      state = ChapterQuizProgressionStateEnum.PASSED;
    } else {
      state = ChapterQuizProgressionStateEnum.UNLOCKED;
      if (isSequential && cq.isRequired && !blockingGate) {
        blockingGate = {
          kind: ProgressionGateKindEnum.CHAPTER_QUIZ,
          chapterTitle: chapter.title,
          quizTitle: title,
          passScore: effectivePassScore,
        };
      }
    }

    quizzes.push({
      id: cq.id,
      quizId: cq.quizId,
      title,
      effectivePassScore,
      timeLimitMinutes: cq.quiz?.timeLimitMinutes ?? null,
      questionCount: cq.quiz?._count?.quizQuestions ?? null,
      isRequired: cq.isRequired,
      bestScorePercent: bestScore,
      state,
      lockedReason,
    });
  }

  return { quizzes, allRequiredQuizzesPassed, blockingGate };
}

/**
 * Tính toán trạng thái mở khóa của toàn bộ Chương, Bài học và Đề kiểm tra chương (0..N đề/chương).
 */
export function evaluatePathJourney(
  path: LearningPathItem,
  ctx: JourneyProgressContext,
): Map<string, EvaluatedJourneyChapter> {
  const chapters = path.chapters || [];
  const result = new Map<string, EvaluatedJourneyChapter>();
  let blockingGate: BlockingGate | null = null;

  for (const chapter of chapters) {
    const lessonStep = evaluateChapterLessonsStep(
      chapter,
      path.isSequential,
      ctx,
      blockingGate,
    );
    blockingGate = lessonStep.blockingGate;

    const quizStep = evaluateChapterQuizzesStep(
      chapter,
      path.isSequential,
      ctx,
      blockingGate,
    );
    blockingGate = quizStep.blockingGate;

    const hasAnyContent =
      lessonStep.publishedCount > 0 || quizStep.quizzes.length > 0;

    result.set(chapter.id, {
      chapterId: chapter.id,
      isLessonsComplete:
        lessonStep.publishedCount > 0 && lessonStep.isLessonsComplete,
      isRequiredQuizzesPassed: quizStep.allRequiredQuizzesPassed,
      isChapterFullyComplete:
        hasAnyContent &&
        lessonStep.isLessonsComplete &&
        quizStep.allRequiredQuizzesPassed,
      lessons: lessonStep.lessonMap,
      quizzes: quizStep.quizzes,
    });
  }

  return result;
}
