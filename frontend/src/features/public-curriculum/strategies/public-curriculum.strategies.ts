import { LearningPathItem } from '@/services/entities/learning-path.service';
import {
  QuizQuestion,
  QuizQuestionType,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  FillInBlankQuestion,
  OrderingQuestion,
  MatchingQuestion,
} from '@/features/lessons/types/quiz.types';
import { LearningPathFilterType } from '../constants/public-curriculum.constants';
import { LearningPathType } from '@/constants/enums';

// ==========================================
// 1. STRATEGY LỌC LỘ TRÌNH HỌC & BÀI HỌC (OCP)
// ==========================================

/** Đủ dùng cho cả LessonItem (CMS) lẫn LibraryLesson (thư viện công khai). */
export interface FilterableLesson {
  title: string;
  description?: string | null;
  tags?: Array<{ id: string }>;
  lessonTags?: Array<{ tagId: string }>;
}

export interface IPathFilterStrategy {
  matches(path: LearningPathItem, keyword: string): boolean;
}

function matchesKeywordInPath(path: LearningPathItem, normalizedKeyword: string): boolean {
  if (!normalizedKeyword) return true;
  if (
    path.title.toLowerCase().includes(normalizedKeyword) ||
    (path.description && path.description.toLowerCase().includes(normalizedKeyword))
  ) {
    return true;
  }

  return (path.chapters || []).some((ch) => {
    if (
      ch.title.toLowerCase().includes(normalizedKeyword) ||
      (ch.description && ch.description.toLowerCase().includes(normalizedKeyword))
    ) {
      return true;
    }
    return (ch.chapterLessons || []).some((cl) =>
      cl.lesson?.title?.toLowerCase().includes(normalizedKeyword),
    );
  });
}

class AllPathsFilterStrategy implements IPathFilterStrategy {
  matches(path: LearningPathItem, keyword: string): boolean {
    return matchesKeywordInPath(path, keyword);
  }
}

class ChronologicalPathsFilterStrategy implements IPathFilterStrategy {
  matches(path: LearningPathItem, keyword: string): boolean {
    return path.pathType === LearningPathType.CHRONOLOGICAL && matchesKeywordInPath(path, keyword);
  }
}

class ThematicPathsFilterStrategy implements IPathFilterStrategy {
  matches(path: LearningPathItem, keyword: string): boolean {
    return path.pathType === LearningPathType.THEMATIC && matchesKeywordInPath(path, keyword);
  }
}

export class PathFilterStrategyRegistry {
  private static readonly strategies: Record<LearningPathFilterType, IPathFilterStrategy> = {
    [LearningPathFilterType.ALL]: new AllPathsFilterStrategy(),
    [LearningPathFilterType.CHRONOLOGICAL]: new ChronologicalPathsFilterStrategy(),
    [LearningPathFilterType.THEMATIC]: new ThematicPathsFilterStrategy(),
  };

  static filter(
    paths: LearningPathItem[],
    filterType: LearningPathFilterType,
    rawKeyword: string,
  ): LearningPathItem[] {
    const strategy =
      this.strategies[filterType] || this.strategies[LearningPathFilterType.ALL];
    const normalizedKeyword = rawKeyword.trim().toLowerCase();
    return paths.filter((path) => strategy.matches(path, normalizedKeyword));
  }

  static filterLessons<T extends FilterableLesson>(
    lessons: T[],
    rawKeyword: string,
    selectedTagId: string | null,
  ): T[] {
    const normalizedKeyword = rawKeyword.trim().toLowerCase();
    return lessons.filter((lesson) => {
      if (selectedTagId) {
        const hasTag =
          (lesson.tags || []).some((t) => t.id === selectedTagId) ||
          (lesson.lessonTags || []).some((lt) => lt.tagId === selectedTagId);
        if (!hasTag) return false;
      }
      if (!normalizedKeyword) return true;
      return (
        lesson.title.toLowerCase().includes(normalizedKeyword) ||
        (lesson.description && lesson.description.toLowerCase().includes(normalizedKeyword))
      );
    });
  }
}

// ==========================================
// 2. STRATEGY CHẤM ĐIỂM ĐỀ ÔN TẬP TƯƠNG TÁC (OCP)
// ==========================================

export type UserQuizAnswer =
  | string // MULTIPLE_CHOICE (optionId) | FILL_IN_BLANK (text)
  | boolean // TRUE_FALSE
  | string[] // ORDERING (ordered itemIds)
  | Record<string, string>; // MATCHING (leftId -> rightId)

export interface IQuizQuestionGrader<T extends QuizQuestion = QuizQuestion> {
  isCorrect(question: T, answer: UserQuizAnswer | undefined): boolean;
  getCorrectSummary(question: T): string;
}

class MultipleChoiceGrader implements IQuizQuestionGrader<MultipleChoiceQuestion> {
  isCorrect(question: MultipleChoiceQuestion, answer: UserQuizAnswer | undefined): boolean {
    if (typeof answer !== 'string') return false;
    const correctOption = question.options.find((o) => o.isCorrect);
    return Boolean(correctOption && correctOption.id === answer);
  }

  getCorrectSummary(question: MultipleChoiceQuestion): string {
    const correctOption = question.options.find((o) => o.isCorrect);
    return correctOption ? correctOption.text : '';
  }
}

class TrueFalseGrader implements IQuizQuestionGrader<TrueFalseQuestion> {
  isCorrect(question: TrueFalseQuestion, answer: UserQuizAnswer | undefined): boolean {
    return typeof answer === 'boolean' && answer === question.correctAnswer;
  }

  getCorrectSummary(question: TrueFalseQuestion): string {
    return question.correctAnswer ? 'Đúng' : 'Sai';
  }
}

class FillInBlankGrader implements IQuizQuestionGrader<FillInBlankQuestion> {
  isCorrect(question: FillInBlankQuestion, answer: UserQuizAnswer | undefined): boolean {
    if (typeof answer !== 'string' || !answer.trim()) return false;
    const candidate = question.caseSensitive ? answer.trim() : answer.trim().toLowerCase();
    return question.acceptedAnswers.some((acc) => {
      const normalized = question.caseSensitive ? acc.trim() : acc.trim().toLowerCase();
      return normalized === candidate;
    });
  }

  getCorrectSummary(question: FillInBlankQuestion): string {
    return question.acceptedAnswers.join(' / ');
  }
}

class OrderingGrader implements IQuizQuestionGrader<OrderingQuestion> {
  isCorrect(question: OrderingQuestion, answer: UserQuizAnswer | undefined): boolean {
    if (!Array.isArray(answer) || answer.length !== question.correctOrder.length) {
      return false;
    }
    return question.correctOrder.every((id, idx) => answer[idx] === id);
  }

  getCorrectSummary(question: OrderingQuestion): string {
    const byId = new Map(question.items.map((it) => [it.id, it.label]));
    return question.correctOrder.map((id, idx) => `${idx + 1}. ${byId.get(id) || id}`).join(' → ');
  }
}

class MatchingGrader implements IQuizQuestionGrader<MatchingQuestion> {
  isCorrect(question: MatchingQuestion, answer: UserQuizAnswer | undefined): boolean {
    if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return false;
    const map = answer as Record<string, string>;
    return question.correctPairs.every((pair) => map[pair.leftId] === pair.rightId);
  }

  getCorrectSummary(question: MatchingQuestion): string {
    const leftMap = new Map(question.leftItems.map((i) => [i.id, i.label]));
    const rightMap = new Map(question.rightItems.map((i) => [i.id, i.label]));
    return question.correctPairs
      .map((p) => `${leftMap.get(p.leftId) || p.leftId} ↔ ${rightMap.get(p.rightId) || p.rightId}`)
      .join(' | ');
  }
}

export class QuizGradingStrategyRegistry {
  private static readonly graders: Record<QuizQuestionType, IQuizQuestionGrader<any>> = {
    [QuizQuestionType.MULTIPLE_CHOICE]: new MultipleChoiceGrader(),
    [QuizQuestionType.TRUE_FALSE]: new TrueFalseGrader(),
    [QuizQuestionType.FILL_IN_BLANK]: new FillInBlankGrader(),
    [QuizQuestionType.ORDERING]: new OrderingGrader(),
    [QuizQuestionType.MATCHING]: new MatchingGrader(),
  };

  static evaluateQuestion(
    question: QuizQuestion,
    answer: UserQuizAnswer | undefined,
  ): { isCorrect: boolean; correctSummary: string } {
    const grader = this.graders[question.type];
    if (!grader) {
      return { isCorrect: false, correctSummary: '' };
    }
    return {
      isCorrect: grader.isCorrect(question, answer),
      correctSummary: grader.getCorrectSummary(question),
    };
  }
}
