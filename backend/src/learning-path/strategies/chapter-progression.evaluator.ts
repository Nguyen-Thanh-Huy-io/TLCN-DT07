import { Injectable } from '@nestjs/common';
import {
  LessonProgressEvaluation,
  LessonProgressionState,
} from './progression-strategy.interface';

export const DEFAULT_CHAPTER_QUIZ_PASS_SCORE = 70;

export enum ChapterQuizProgressionState {
  PASSED = 'PASSED',
  UNLOCKED = 'UNLOCKED',
  LOCKED = 'LOCKED',
}

export enum ProgressionGateKind {
  LESSON = 'LESSON',
  CHAPTER_QUIZ = 'CHAPTER_QUIZ',
}

export interface EvaluableChapterLesson {
  id: string;
  title: string;
}

export interface EvaluableChapterQuiz {
  id: string;
  quizId: string;
  displayOrder: number;
  passScore: number | null;
  isRequired: boolean;
  quiz: {
    id: string;
    title: string | null;
    passingScorePercent: number | null;
    timeLimitMinutes?: number | null;
  };
}

export interface EvaluableChapter {
  id: string;
  title: string;
  lessons: EvaluableChapterLesson[];
  quizzes: EvaluableChapterQuiz[];
}

export interface ChapterQuizEvaluation {
  id: string;
  quizId: string;
  title: string;
  displayOrder: number;
  effectivePassScore: number;
  timeLimitMinutes: number | null;
  isRequired: boolean;
  bestScorePercent: number | null;
  state: ChapterQuizProgressionState;
  lockedReason?: string;
}

export interface EvaluatedChapterProgression {
  chapterId: string;
  lessons: LessonProgressEvaluation[];
  quizzes: ChapterQuizEvaluation[];
}

export interface LessonAccessEvaluation {
  allowed: boolean;
  gateKind?: ProgressionGateKind;
  reason?: string;
  prerequisiteLesson?: { id: string; title: string };
  prerequisiteQuiz?: {
    quizId: string;
    title: string;
    chapterTitle: string;
    passScore: number;
  };
}

type BlockingGate =
  | {
      kind: ProgressionGateKind.LESSON;
      lessonId: string;
      lessonTitle: string;
    }
  | {
      kind: ProgressionGateKind.CHAPTER_QUIZ;
      chapterTitle: string;
      quizId: string;
      quizTitle: string;
      passScore: number;
    };

export function resolveEffectiveChapterQuizPassScore(
  cq: Pick<EvaluableChapterQuiz, 'passScore' | 'quiz'>,
): number {
  return (
    cq.passScore ??
    cq.quiz.passingScorePercent ??
    DEFAULT_CHAPTER_QUIZ_PASS_SCORE
  );
}

export function isChapterQuizSatisfied(
  cq: Pick<EvaluableChapterQuiz, 'quizId' | 'passScore' | 'quiz'>,
  passedQuizIds: ReadonlySet<string>,
  bestQuizScores?: ReadonlyMap<string, number>,
): boolean {
  const requiredScore = resolveEffectiveChapterQuizPassScore(cq);
  if (bestQuizScores?.has(cq.quizId)) {
    const best = bestQuizScores.get(cq.quizId) ?? 0;
    if (best >= requiredScore) return true;
    return cq.passScore == null && passedQuizIds.has(cq.quizId);
  }
  return passedQuizIds.has(cq.quizId);
}

@Injectable()
export class ChapterProgressionEvaluator {
  evaluateChapters(params: {
    chapters: EvaluableChapter[];
    isSequential: boolean;
    completedLessonIds: ReadonlySet<string>;
    passedQuizIds: ReadonlySet<string>;
    bestQuizScores?: ReadonlyMap<string, number>;
  }): EvaluatedChapterProgression[] {
    const {
      chapters,
      isSequential,
      completedLessonIds,
      passedQuizIds,
      bestQuizScores,
    } = params;

    if (!isSequential) {
      return this.evaluateFreePacedChapters(
        chapters,
        completedLessonIds,
        passedQuizIds,
        bestQuizScores,
      );
    }

    let blockingGate: BlockingGate | null = null;
    const output: EvaluatedChapterProgression[] = [];

    for (const chapter of chapters) {
      const lessonStep = this.evaluateChapterLessons(
        chapter.lessons,
        completedLessonIds,
        blockingGate,
      );
      blockingGate = lessonStep.blockingGate;

      const quizStep = this.evaluateChapterQuizzes(
        chapter,
        passedQuizIds,
        bestQuizScores,
        blockingGate,
      );
      blockingGate = quizStep.blockingGate;

      output.push({
        chapterId: chapter.id,
        lessons: lessonStep.evaluations,
        quizzes: quizStep.evaluations,
      });
    }

    return output;
  }

  checkLessonAccess(params: {
    targetLessonId: string;
    chapters: EvaluableChapter[];
    isSequential: boolean;
    completedLessonIds: ReadonlySet<string>;
    passedQuizIds: ReadonlySet<string>;
    bestQuizScores?: ReadonlyMap<string, number>;
  }): LessonAccessEvaluation {
    const {
      targetLessonId,
      chapters,
      isSequential,
      completedLessonIds,
      passedQuizIds,
      bestQuizScores,
    } = params;

    if (!isSequential || completedLessonIds.has(targetLessonId)) {
      return { allowed: true };
    }

    for (const chapter of chapters) {
      const lessonDecision = this.inspectChapterLessonsForTarget(
        chapter.lessons,
        targetLessonId,
        completedLessonIds,
      );
      if (lessonDecision) {
        return lessonDecision;
      }

      const quizDecision = this.findBlockingQuizAccessError(
        chapter,
        passedQuizIds,
        bestQuizScores,
      );
      if (quizDecision) {
        return quizDecision;
      }
    }

    return { allowed: true };
  }

  private evaluateFreePacedChapters(
    chapters: EvaluableChapter[],
    completedLessonIds: ReadonlySet<string>,
    passedQuizIds: ReadonlySet<string>,
    bestQuizScores?: ReadonlyMap<string, number>,
  ): EvaluatedChapterProgression[] {
    return chapters.map((ch) => ({
      chapterId: ch.id,
      lessons: ch.lessons.map((l) => ({
        lessonId: l.id,
        state: completedLessonIds.has(l.id)
          ? LessonProgressionState.COMPLETED
          : LessonProgressionState.CURRENT_UNLOCKED,
      })),
      quizzes: ch.quizzes.map((cq) =>
        this.buildQuizEvaluation(
          cq,
          isChapterQuizSatisfied(cq, passedQuizIds, bestQuizScores)
            ? ChapterQuizProgressionState.PASSED
            : ChapterQuizProgressionState.UNLOCKED,
          bestQuizScores,
        ),
      ),
    }));
  }

  private evaluateChapterLessons(
    lessons: EvaluableChapterLesson[],
    completedLessonIds: ReadonlySet<string>,
    initialGate: BlockingGate | null,
  ): {
    evaluations: LessonProgressEvaluation[];
    blockingGate: BlockingGate | null;
  } {
    let blockingGate = initialGate;
    const evaluations: LessonProgressEvaluation[] = [];

    for (const lesson of lessons) {
      if (completedLessonIds.has(lesson.id)) {
        evaluations.push({
          lessonId: lesson.id,
          state: LessonProgressionState.COMPLETED,
        });
        continue;
      }

      if (!blockingGate) {
        evaluations.push({
          lessonId: lesson.id,
          state: LessonProgressionState.CURRENT_UNLOCKED,
        });
        blockingGate = {
          kind: ProgressionGateKind.LESSON,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
        };
        continue;
      }

      evaluations.push(
        this.buildLockedLessonEvaluation(lesson.id, blockingGate),
      );
    }

    return { evaluations, blockingGate };
  }

  private buildLockedLessonEvaluation(
    lessonId: string,
    gate: BlockingGate,
  ): LessonProgressEvaluation {
    if (gate.kind === ProgressionGateKind.LESSON) {
      return {
        lessonId,
        state: LessonProgressionState.LOCKED_PREREQUISITE,
        prerequisiteLessonId: gate.lessonId,
        lockedReason: `Cần hoàn thành bài "${gate.lessonTitle}" trước để mở khóa.`,
      };
    }

    return {
      lessonId,
      state: LessonProgressionState.LOCKED_PREREQUISITE,
      lockedReason: `Cần vượt qua đề kiểm tra "${gate.quizTitle}" (đạt tối thiểu ${gate.passScore}%) của "${gate.chapterTitle}" để mở khóa chương này.`,
    };
  }

  private evaluateChapterQuizzes(
    chapter: EvaluableChapter,
    passedQuizIds: ReadonlySet<string>,
    bestQuizScores: ReadonlyMap<string, number> | undefined,
    initialGate: BlockingGate | null,
  ): {
    evaluations: ChapterQuizEvaluation[];
    blockingGate: BlockingGate | null;
  } {
    let blockingGate = initialGate;
    const chapterReadyForQuizzes = initialGate === null;
    const evaluations: ChapterQuizEvaluation[] = [];

    for (const cq of chapter.quizzes) {
      if (isChapterQuizSatisfied(cq, passedQuizIds, bestQuizScores)) {
        evaluations.push(
          this.buildQuizEvaluation(
            cq,
            ChapterQuizProgressionState.PASSED,
            bestQuizScores,
          ),
        );
        continue;
      }

      if (chapterReadyForQuizzes) {
        evaluations.push(
          this.buildQuizEvaluation(
            cq,
            ChapterQuizProgressionState.UNLOCKED,
            bestQuizScores,
          ),
        );
        if (cq.isRequired && !blockingGate) {
          blockingGate = {
            kind: ProgressionGateKind.CHAPTER_QUIZ,
            chapterTitle: chapter.title,
            quizId: cq.quizId,
            quizTitle: cq.quiz.title || 'Đề kiểm tra chương',
            passScore: resolveEffectiveChapterQuizPassScore(cq),
          };
        }
        continue;
      }

      evaluations.push(
        this.buildQuizEvaluation(
          cq,
          ChapterQuizProgressionState.LOCKED,
          bestQuizScores,
          this.resolveQuizLockedReason(chapter.title, blockingGate),
        ),
      );
    }

    return { evaluations, blockingGate };
  }

  private resolveQuizLockedReason(
    chapterTitle: string,
    gate: BlockingGate | null,
  ): string {
    if (gate?.kind === ProgressionGateKind.LESSON) {
      return `Hoàn thành tất cả bài học trong "${chapterTitle}" để mở bài kiểm tra này.`;
    }
    if (gate?.kind === ProgressionGateKind.CHAPTER_QUIZ) {
      return `Cần vượt qua đề "${gate.quizTitle}" của "${gate.chapterTitle}" trước.`;
    }
    return 'Hoàn thành nội dung trước đó để mở khóa bài kiểm tra.';
  }

  private inspectChapterLessonsForTarget(
    lessons: EvaluableChapterLesson[],
    targetLessonId: string,
    completedLessonIds: ReadonlySet<string>,
  ): LessonAccessEvaluation | null {
    for (const lesson of lessons) {
      if (lesson.id === targetLessonId) {
        return { allowed: true };
      }
      if (!completedLessonIds.has(lesson.id)) {
        return {
          allowed: false,
          gateKind: ProgressionGateKind.LESSON,
          reason: `Bài học này đang bị khóa. Bạn cần hoàn thành bài "${lesson.title}" trước.`,
          prerequisiteLesson: {
            id: lesson.id,
            title: lesson.title,
          },
        };
      }
    }
    return null;
  }

  private findBlockingQuizAccessError(
    chapter: EvaluableChapter,
    passedQuizIds: ReadonlySet<string>,
    bestQuizScores?: ReadonlyMap<string, number>,
  ): LessonAccessEvaluation | null {
    for (const cq of chapter.quizzes) {
      if (!cq.isRequired) continue;
      if (isChapterQuizSatisfied(cq, passedQuizIds, bestQuizScores)) continue;

      const passScore = resolveEffectiveChapterQuizPassScore(cq);
      const quizTitle = cq.quiz.title || 'Đề kiểm tra chương';
      return {
        allowed: false,
        gateKind: ProgressionGateKind.CHAPTER_QUIZ,
        reason: `Bạn cần vượt qua đề kiểm tra "${quizTitle}" (đạt tối thiểu ${passScore}%) của "${chapter.title}" để mở khóa chương tiếp theo.`,
        prerequisiteQuiz: {
          quizId: cq.quizId,
          title: quizTitle,
          chapterTitle: chapter.title,
          passScore,
        },
      };
    }
    return null;
  }

  private buildQuizEvaluation(
    cq: EvaluableChapterQuiz,
    state: ChapterQuizProgressionState,
    bestQuizScores?: ReadonlyMap<string, number>,
    lockedReason?: string,
  ): ChapterQuizEvaluation {
    return {
      id: cq.id,
      quizId: cq.quizId,
      title: cq.quiz.title || 'Đề kiểm tra chương',
      displayOrder: cq.displayOrder,
      effectivePassScore: resolveEffectiveChapterQuizPassScore(cq),
      timeLimitMinutes: cq.quiz.timeLimitMinutes ?? null,
      isRequired: cq.isRequired,
      bestScorePercent: bestQuizScores?.get(cq.quizId) ?? null,
      state,
      ...(lockedReason ? { lockedReason } : {}),
    };
  }
}
