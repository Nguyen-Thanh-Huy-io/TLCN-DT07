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
  MultipleChoiceOption,
  OrderingItem,
  MatchingItem,
  MatchingPair,
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
// 2. CÂU TRẢ LỜI CỦA NGƯỜI HỌC (server chấm điểm — POST /public/quizzes/:id/submit)
// ==========================================

export type UserQuizAnswer =
  | string // SINGLE_CHOICE (optionId) | FILL_IN_BLANK (text)
  | boolean // TRUE_FALSE
  | string[] // MULTIPLE_CHOICE (selected optionIds) | ORDERING (ordered itemIds)
  | Record<string, string>; // MATCHING (leftId -> rightId)

// ==========================================
// 3. STRATEGY XÁO TRỘN NGẪU NHIÊN ĐỀ ÔN TẬP CHO HỌC SINH (FISHER-YATES SHUFFLE)
// ==========================================

export function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

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

export interface RawQuizOptionInput {
  id?: string;
  text?: string;
  content?: string;
  label?: string;
  isCorrect?: boolean;
  explanation?: string;
}

export interface RawOrderingItemInput {
  id?: string;
  label?: string;
  text?: string;
  content?: string;
}

export interface RawMatchingPairInput {
  leftId?: string;
  left?: number | string;
  rightId?: string;
  right?: number | string;
}

export interface RawQuizQuestionInput {
  id?: string;
  type?: QuizQuestionType | string;
  prompt?: string;
  explanation?: string;
  options?: Array<string | RawQuizOptionInput>;
  correctAnswer?: boolean | string | string[];
  correctAnswers?: string[];
  items?: Array<string | RawOrderingItemInput>;
  correctOrder?: Array<string | number>;
  leftItems?: Array<string | RawOrderingItemInput>;
  rightItems?: Array<string | RawOrderingItemInput>;
  correctPairs?: RawMatchingPairInput[];
  acceptedAnswers?: string[];
  caseSensitive?: boolean;
  [key: string]: unknown;
}

const AFFIRMATIVE_BOOLEAN_TEXTS = ['đúng', 'true', '1', 'yes'];

function normalizeChoiceQuestion(
  rawQ: RawQuizQuestionInput,
  qType: QuizQuestionType.SINGLE_CHOICE | QuizQuestionType.MULTIPLE_CHOICE,
): SingleChoiceQuestion | MultipleChoiceQuestion {
  const rawOptions = Array.isArray(rawQ.options) ? rawQ.options : [];
  const normalizedOptions: MultipleChoiceOption[] = rawOptions.map((opt, idx) => {
    if (typeof opt === 'string') {
      const isCorrect =
        rawQ.correctAnswer === opt ||
        (Array.isArray(rawQ.correctAnswer) && rawQ.correctAnswer.includes(opt)) ||
        (Array.isArray(rawQ.correctAnswers) && rawQ.correctAnswers.includes(opt));
      return {
        id: `opt_${idx}`,
        text: opt,
        isCorrect: Boolean(isCorrect),
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
    id: rawQ.id || '',
    prompt: rawQ.prompt || '',
    type: qType,
    options: normalizedOptions,
  } as SingleChoiceQuestion | MultipleChoiceQuestion;
}

function normalizeTrueFalseQuestion(rawQ: RawQuizQuestionInput): TrueFalseQuestion {
  let correctAnswer = Boolean(rawQ.correctAnswer);
  if (typeof rawQ.correctAnswer === 'string') {
    correctAnswer = AFFIRMATIVE_BOOLEAN_TEXTS.includes(rawQ.correctAnswer.trim().toLowerCase());
  }
  return {
    ...rawQ,
    id: rawQ.id || '',
    prompt: rawQ.prompt || '',
    type: QuizQuestionType.TRUE_FALSE,
    correctAnswer,
  };
}

function normalizeOrderingQuestion(rawQ: RawQuizQuestionInput): OrderingQuestion {
  const rawItems = Array.isArray(rawQ.items) ? rawQ.items : [];
  const normalizedItems: OrderingItem[] = rawItems.map((item, idx) => {
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
    correctOrder = rawQ.correctOrder.map((it) => {
      if (typeof it === 'number' && normalizedItems[it]) {
        return normalizedItems[it].id;
      }
      return String(it);
    });
  } else {
    correctOrder = normalizedItems.map((i) => i.id);
  }

  return {
    ...rawQ,
    id: rawQ.id || '',
    prompt: rawQ.prompt || '',
    type: QuizQuestionType.ORDERING,
    items: normalizedItems,
    correctOrder,
  };
}

function normalizeMatchingQuestion(rawQ: RawQuizQuestionInput): MatchingQuestion {
  const rawLeft = Array.isArray(rawQ.leftItems) ? rawQ.leftItems : [];
  const rawRight = Array.isArray(rawQ.rightItems) ? rawQ.rightItems : [];

  const normLeft: MatchingItem[] = rawLeft.map((it, idx) => {
    if (typeof it === 'string') return { id: `left_${idx}`, label: it };
    return { id: it.id || `left_${idx}`, label: it.label || it.text || it.content || '' };
  });

  const normRight: MatchingItem[] = rawRight.map((it, idx) => {
    if (typeof it === 'string') return { id: `right_${idx}`, label: it };
    return { id: it.id || `right_${idx}`, label: it.label || it.text || it.content || '' };
  });

  const rawPairs = Array.isArray(rawQ.correctPairs) ? rawQ.correctPairs : [];
  const normPairs: MatchingPair[] = rawPairs.map((p) => {
    if (p.left !== undefined && p.right !== undefined) {
      const leftIdx = Number(p.left);
      const rightIdx = Number(p.right);
      const leftId = normLeft[leftIdx]?.id || `left_${p.left}`;
      const rightId = normRight[rightIdx]?.id || `right_${p.right}`;
      return { leftId, rightId };
    }
    return {
      leftId: String(p.leftId ?? p.left ?? ''),
      rightId: String(p.rightId ?? p.right ?? ''),
    };
  });

  return {
    ...rawQ,
    id: rawQ.id || '',
    prompt: rawQ.prompt || '',
    type: QuizQuestionType.MATCHING,
    leftItems: normLeft,
    rightItems: normRight,
    correctPairs: normPairs,
  };
}

function normalizeFillBlankQuestion(rawQ: RawQuizQuestionInput): FillInBlankQuestion {
  const acceptedAnswers = Array.isArray(rawQ.acceptedAnswers)
    ? rawQ.acceptedAnswers
    : typeof rawQ.correctAnswer === 'string'
      ? [rawQ.correctAnswer]
      : [];
  return {
    ...rawQ,
    id: rawQ.id || '',
    prompt: rawQ.prompt || '',
    type: QuizQuestionType.FILL_IN_BLANK,
    acceptedAnswers,
    caseSensitive: Boolean(rawQ.caseSensitive),
  };
}

export function normalizeQuizQuestionForDisplay(rawQ: RawQuizQuestionInput): QuizQuestion {
  const qType = rawQ.type as QuizQuestionType;

  if (qType === QuizQuestionType.SINGLE_CHOICE || qType === QuizQuestionType.MULTIPLE_CHOICE) {
    return normalizeChoiceQuestion(rawQ, qType);
  }
  if (qType === QuizQuestionType.TRUE_FALSE) {
    return normalizeTrueFalseQuestion(rawQ);
  }
  if (qType === QuizQuestionType.ORDERING) {
    return normalizeOrderingQuestion(rawQ);
  }
  if (qType === QuizQuestionType.MATCHING) {
    return normalizeMatchingQuestion(rawQ);
  }
  if (qType === QuizQuestionType.FILL_IN_BLANK) {
    return normalizeFillBlankQuestion(rawQ);
  }

  return rawQ as QuizQuestion;
}

export function prepareQuizSessionForLearner<T extends Pick<QuizItem, 'questions'>>(rawQuiz: T): {
  preparedQuiz: T;
  initialAnswers: Record<string, UserQuizAnswer>;
} {
  const initialAnswers: Record<string, UserQuizAnswer> = {};

  const shuffledQuestions: QuizQuestion[] = (rawQuiz.questions || []).map((rawQ) => {
    const q = normalizeQuizQuestionForDisplay(rawQ as unknown as RawQuizQuestionInput);

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
