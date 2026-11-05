import { LearningPathItem } from '@/services/entities/learning-path.service';
import {
  QuizItem,
  QuizQuestion,
  QuizQuestionType,
  SingleChoiceQuestion,
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
  topicId?: string | null;
  topic?: { id: string; parentId?: string | null } | null;
  tags?: Array<{ id: string }>;
  lessonTags?: Array<{ tagId: string }>;
}

export interface IPathFilterStrategy {
  matches(path: LearningPathItem, keyword: string, selectedTopicId?: string | null, topicIdsInSubtree?: Set<string>): boolean;
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

function matchesTopicInPath(path: LearningPathItem, selectedTopicId?: string | null, topicIdsInSubtree?: Set<string>): boolean {
  if (!selectedTopicId) return true;
  return (path.chapters || []).some((ch) =>
    (ch.chapterLessons || []).some((cl) => {
      const lessonTopicId = cl.lesson?.topicId || cl.lesson?.topic?.id;
      if (!lessonTopicId) return false;
      if (topicIdsInSubtree && topicIdsInSubtree.size > 0) {
        return topicIdsInSubtree.has(lessonTopicId);
      }
      return lessonTopicId === selectedTopicId;
    }),
  );
}

class TopicAwarePathFilterStrategy implements IPathFilterStrategy {
  matches(path: LearningPathItem, keyword: string, selectedTopicId?: string | null, topicIdsInSubtree?: Set<string>): boolean {
    return matchesKeywordInPath(path, keyword) && matchesTopicInPath(path, selectedTopicId, topicIdsInSubtree);
  }
}

class AllPathsFilterStrategy implements IPathFilterStrategy {
  matches(path: LearningPathItem, keyword: string, selectedTopicId?: string | null, topicIdsInSubtree?: Set<string>): boolean {
    return matchesKeywordInPath(path, keyword) && matchesTopicInPath(path, selectedTopicId, topicIdsInSubtree);
  }
}

class ChronologicalPathsFilterStrategy implements IPathFilterStrategy {
  matches(path: LearningPathItem, keyword: string, selectedTopicId?: string | null, topicIdsInSubtree?: Set<string>): boolean {
    return (
      path.pathType === LearningPathType.CHRONOLOGICAL &&
      matchesKeywordInPath(path, keyword) &&
      matchesTopicInPath(path, selectedTopicId, topicIdsInSubtree)
    );
  }
}

class ThematicPathsFilterStrategy implements IPathFilterStrategy {
  matches(path: LearningPathItem, keyword: string, selectedTopicId?: string | null, topicIdsInSubtree?: Set<string>): boolean {
    return (
      path.pathType === LearningPathType.THEMATIC &&
      matchesKeywordInPath(path, keyword) &&
      matchesTopicInPath(path, selectedTopicId, topicIdsInSubtree)
    );
  }
}

export class PathFilterStrategyRegistry {
  private static readonly strategies: Record<string, IPathFilterStrategy> = {
    [LearningPathFilterType.ALL]: new AllPathsFilterStrategy(),
    [LearningPathFilterType.CHRONOLOGICAL]: new ChronologicalPathsFilterStrategy(),
    [LearningPathFilterType.THEMATIC]: new ThematicPathsFilterStrategy(),
    TOPIC: new TopicAwarePathFilterStrategy(),
  };

  static filter(
    paths: LearningPathItem[],
    filterType: LearningPathFilterType | string,
    rawKeyword: string,
    selectedTopicId?: string | null,
    topicIdsInSubtree?: Set<string>,
  ): LearningPathItem[] {
    const strategy =
      this.strategies[filterType] || this.strategies.TOPIC || this.strategies[LearningPathFilterType.ALL];
    const normalizedKeyword = rawKeyword.trim().toLowerCase();
    return paths.filter((path) => strategy.matches(path, normalizedKeyword, selectedTopicId, topicIdsInSubtree));
  }

  static filterLessons<T extends FilterableLesson>(
    lessons: T[],
    rawKeyword: string,
    selectedTagId: string | null,
    selectedTopicId?: string | null,
    topicIdsInSubtree?: Set<string>,
  ): T[] {
    const normalizedKeyword = rawKeyword.trim().toLowerCase();
    return lessons.filter((lesson) => {
      if (selectedTopicId) {
        const lessonTopicId = lesson.topicId || lesson.topic?.id;
        if (!lessonTopicId) return false;
        if (topicIdsInSubtree && topicIdsInSubtree.size > 0) {
          if (!topicIdsInSubtree.has(lessonTopicId)) return false;
        } else if (lessonTopicId !== selectedTopicId) {
          return false;
        }
      }
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
  | string // SINGLE_CHOICE (optionId) | FILL_IN_BLANK (text)
  | boolean // TRUE_FALSE
  | string[] // MULTIPLE_CHOICE (selected optionIds) | ORDERING (ordered itemIds)
  | Record<string, string>; // MATCHING (leftId -> rightId)

export interface IQuizQuestionGrader<T extends QuizQuestion = QuizQuestion> {
  isCorrect(question: T, answer: UserQuizAnswer | undefined): boolean;
  getCorrectSummary(question: T): string;
}

abstract class BaseChoiceGrader<
  T extends SingleChoiceQuestion | MultipleChoiceQuestion,
> implements IQuizQuestionGrader<T> {
  isCorrect(question: T, answer: UserQuizAnswer | undefined): boolean {
    const selectedIds = Array.isArray(answer)
      ? answer
      : typeof answer === 'string' && answer
        ? [answer]
        : [];
    const correctIds = (question.options || []).filter((o: any) => o.isCorrect).map((o: any) => o.id);
    if (correctIds.length === 0 || selectedIds.length !== correctIds.length) {
      return false;
    }
    const selectedSet = new Set(selectedIds);
    return correctIds.every((id) => selectedSet.has(id));
  }

  getCorrectSummary(question: T): string {
    return (question.options || [])
      .filter((o: any) => o.isCorrect)
      .map((o: any) => o.text || o.content || o.label || '')
      .join(' • ');
  }
}

class SingleChoiceGrader extends BaseChoiceGrader<SingleChoiceQuestion> {}

class MultipleChoiceGrader extends BaseChoiceGrader<MultipleChoiceQuestion> {}

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
    const acceptedList = Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : [];
    return acceptedList.some((acc) => {
      const normalized = question.caseSensitive ? acc.trim() : acc.trim().toLowerCase();
      return normalized === candidate;
    });
  }

  getCorrectSummary(question: FillInBlankQuestion): string {
    return (question.acceptedAnswers || []).join(' / ');
  }
}

class OrderingGrader implements IQuizQuestionGrader<OrderingQuestion> {
  isCorrect(question: OrderingQuestion, answer: UserQuizAnswer | undefined): boolean {
    const correctOrder = Array.isArray(question.correctOrder) ? question.correctOrder : [];
    if (!Array.isArray(answer) || answer.length !== correctOrder.length) {
      return false;
    }
    return correctOrder.every((id, idx) => answer[idx] === id);
  }

  getCorrectSummary(question: OrderingQuestion): string {
    const items = Array.isArray(question.items) ? question.items : [];
    const byId = new Map(items.map((it: any) => [it.id, it.label || it.text || it.content || '']));
    const correctOrder = Array.isArray(question.correctOrder) ? question.correctOrder : [];
    return correctOrder.map((id, idx) => `${idx + 1}. ${byId.get(id) || id}`).join(' → ');
  }
}

class MatchingGrader implements IQuizQuestionGrader<MatchingQuestion> {
  isCorrect(question: MatchingQuestion, answer: UserQuizAnswer | undefined): boolean {
    if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return false;
    const map = answer as Record<string, string>;
    const pairs = Array.isArray(question.correctPairs) ? question.correctPairs : [];
    return pairs.every((pair) => map[pair.leftId] === pair.rightId);
  }

  getCorrectSummary(question: MatchingQuestion): string {
    const leftItems = Array.isArray(question.leftItems) ? question.leftItems : [];
    const rightItems = Array.isArray(question.rightItems) ? question.rightItems : [];
    const pairs = Array.isArray(question.correctPairs) ? question.correctPairs : [];
    const leftMap = new Map(leftItems.map((i: any) => [i.id, i.label || i.text || i.content || '']));
    const rightMap = new Map(rightItems.map((i: any) => [i.id, i.label || i.text || i.content || '']));
    return pairs
      .map((p) => `${leftMap.get(p.leftId) || p.leftId} ↔ ${rightMap.get(p.rightId) || p.rightId}`)
      .join(' | ');
  }
}

export class QuizGradingStrategyRegistry {
  private static readonly graders: Record<QuizQuestionType, IQuizQuestionGrader<any>> = {
    [QuizQuestionType.SINGLE_CHOICE]: new SingleChoiceGrader(),
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

// ==========================================
// 3. STRATEGY XÁO TRỘN NGẪU NHIÊN ĐỀ ÔN TẬP CHO HỌC SINH (FISHER-YATES SHUFFLE)
// ==========================================

/**
 * Thuật toán Fisher-Yates Shuffle thuần túy (không làm biến đổi mảng gốc)
 */
export function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Xáo trộn ngẫu nhiên mảng ID của câu hỏi ORDERING và đảm bảo kết quả sau khi xáo
 * KHÔNG vô tình trùng khít 100% với đáp án đúng `correctOrder` (khi có >= 2 mốc).
 */
export function shuffleOrderingIds(itemIds: readonly string[], correctOrder: readonly string[]): string[] {
  if (itemIds.length < 2) return [...itemIds];
  const shuffled = shuffleArray(itemIds);
  const isIdenticalToCorrect =
    shuffled.length === correctOrder.length &&
    shuffled.every((id, idx) => id === correctOrder[idx]);

  if (isIdenticalToCorrect) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return shuffled;
}

/**
 * Chuẩn hóa một câu hỏi thô (tương thích nhiều format: options chuỗi hoặc object, items chuỗi hoặc object, matching pairs kiểu left/right hoặc leftId/rightId).
 */
export function normalizeQuizQuestionForDisplay(rawQ: any): QuizQuestion {
  const qType = rawQ.type as QuizQuestionType;

  // Single choice / Multiple choice
  if (qType === QuizQuestionType.SINGLE_CHOICE || qType === QuizQuestionType.MULTIPLE_CHOICE) {
    const rawOptions = Array.isArray(rawQ.options) ? rawQ.options : [];
    const normalizedOptions = rawOptions.map((opt: any, idx: number) => {
      if (typeof opt === 'string') {
        const isCorrect =
          rawQ.correctAnswer === opt ||
          (Array.isArray(rawQ.correctAnswer) && rawQ.correctAnswer.includes(opt)) ||
          (Array.isArray(rawQ.correctAnswers) && rawQ.correctAnswers.includes(opt));
        return {
          id: `opt_${idx}`,
          text: opt,
          isCorrect,
          explanation: '',
        };
      }
      return {
        id: opt.id || `opt_${idx}`,
        text: opt.text || opt.content || opt.label || '',
        isCorrect: Boolean(opt.isCorrect),
        explanation: opt.explanation || '',
      };
    });

    return {
      ...rawQ,
      type: qType,
      options: normalizedOptions,
    } as SingleChoiceQuestion | MultipleChoiceQuestion;
  }

  // True / False
  if (qType === QuizQuestionType.TRUE_FALSE) {
    let correctAnswer = Boolean(rawQ.correctAnswer);
    if (typeof rawQ.correctAnswer === 'string') {
      correctAnswer = rawQ.correctAnswer.toLowerCase() === 'đúng' || rawQ.correctAnswer.toLowerCase() === 'true';
    }
    return {
      ...rawQ,
      type: QuizQuestionType.TRUE_FALSE,
      correctAnswer,
    } as TrueFalseQuestion;
  }

  // Ordering
  if (qType === QuizQuestionType.ORDERING) {
    const rawItems = Array.isArray(rawQ.items) ? rawQ.items : [];
    const normalizedItems = rawItems.map((item: any, idx: number) => {
      if (typeof item === 'string') {
        return {
          id: `ord_${idx}`,
          label: item,
        };
      }
      return {
        id: item.id || `ord_${idx}`,
        label: item.label || item.text || item.content || '',
      };
    });

    let correctOrder: string[] = [];
    if (Array.isArray(rawQ.correctOrder)) {
      correctOrder = rawQ.correctOrder.map((it: any) => {
        if (typeof it === 'number' && normalizedItems[it]) {
          return normalizedItems[it].id;
        }
        return String(it);
      });
    } else {
      correctOrder = normalizedItems.map((i: { id: string }) => i.id);
    }

    return {
      ...rawQ,
      type: QuizQuestionType.ORDERING,
      items: normalizedItems,
      correctOrder,
    } as OrderingQuestion;
  }

  // Matching
  if (qType === QuizQuestionType.MATCHING) {
    const rawLeft = Array.isArray(rawQ.leftItems) ? rawQ.leftItems : [];
    const rawRight = Array.isArray(rawQ.rightItems) ? rawQ.rightItems : [];

    const normLeft = rawLeft.map((it: any, idx: number) => {
      if (typeof it === 'string') return { id: `left_${idx}`, label: it };
      return { id: it.id || `left_${idx}`, label: it.label || it.text || it.content || '' };
    });

    const normRight = rawRight.map((it: any, idx: number) => {
      if (typeof it === 'string') return { id: `right_${idx}`, label: it };
      return { id: it.id || `right_${idx}`, label: it.label || it.text || it.content || '' };
    });

    const rawPairs = Array.isArray(rawQ.correctPairs) ? rawQ.correctPairs : [];
    const normPairs = rawPairs.map((p: any) => {
      if ('left' in p && 'right' in p) {
        const leftId = normLeft[p.left]?.id || `left_${p.left}`;
        const rightId = normRight[p.right]?.id || `right_${p.right}`;
        return { leftId, rightId };
      }
      return {
        leftId: p.leftId || p.left,
        rightId: p.rightId || p.right,
      };
    });

    return {
      ...rawQ,
      type: QuizQuestionType.MATCHING,
      leftItems: normLeft,
      rightItems: normRight,
      correctPairs: normPairs,
    } as MatchingQuestion;
  }

  // Fill in blank
  if (qType === QuizQuestionType.FILL_IN_BLANK) {
    const acceptedAnswers = Array.isArray(rawQ.acceptedAnswers)
      ? rawQ.acceptedAnswers
      : typeof rawQ.correctAnswer === 'string'
        ? [rawQ.correctAnswer]
        : [];
    return {
      ...rawQ,
      type: QuizQuestionType.FILL_IN_BLANK,
      acceptedAnswers,
      caseSensitive: Boolean(rawQ.caseSensitive),
    } as FillInBlankQuestion;
  }

  return rawQ as QuizQuestion;
}

/**
 * Chuẩn bị phiên làm bài mới cho Học sinh:
 * - Dạng 1 (SINGLE_CHOICE) & Dạng 2 (MULTIPLE_CHOICE): Đảo ngẫu nhiên vị trí các đáp án A, B, C, D.
 * - Dạng 3 (TRUE_FALSE): Giữ cố định 2 nút Đúng / Sai trực quan.
 * - Dạng 4 (ORDERING): Đảo ngẫu nhiên thứ tự các mốc sự kiện khởi tạo (đảm bảo khác `correctOrder`).
 * - Dạng 5 (MATCHING): Đảo ngẫu nhiên cột vế phải (`rightItems`).
 */
export function prepareQuizSessionForLearner(rawQuiz: QuizItem): {
  preparedQuiz: QuizItem;
  initialAnswers: Record<string, UserQuizAnswer>;
} {
  const initialAnswers: Record<string, UserQuizAnswer> = {};

  const shuffledQuestions: QuizQuestion[] = (rawQuiz.questions || []).map((rawQ) => {
    const q = normalizeQuizQuestionForDisplay(rawQ);

    if (
      q.type === QuizQuestionType.SINGLE_CHOICE ||
      q.type === QuizQuestionType.MULTIPLE_CHOICE
    ) {
      return {
        ...q,
        options: shuffleArray(q.options),
      };
    }

    if (q.type === QuizQuestionType.ORDERING) {
      const allIds = q.items.map((it) => it.id);
      const targetCorrect =
        Array.isArray(q.correctOrder) && q.correctOrder.length === allIds.length
          ? q.correctOrder
          : allIds;
      initialAnswers[q.id] = shuffleOrderingIds(allIds, targetCorrect);
      return q;
    }

    if (q.type === QuizQuestionType.MATCHING) {
      const shuffledRight = shuffleArray(q.rightItems);
      if (shuffledRight.length >= 2) {
        const pairByLeft = new Map(q.correctPairs.map((p) => [p.leftId, p.rightId]));
        const isAlignedWithLeft = q.leftItems.every(
          (left, idx) => shuffledRight[idx]?.id === pairByLeft.get(left.id),
        );
        if (isAlignedWithLeft) {
          [shuffledRight[0], shuffledRight[1]] = [shuffledRight[1], shuffledRight[0]];
        }
      }
      return {
        ...q,
        rightItems: shuffledRight,
      };
    }

    return q;
  });

  return {
    preparedQuiz: {
      ...rawQuiz,
      questions: shuffledQuestions,
    },
    initialAnswers,
  };
}
