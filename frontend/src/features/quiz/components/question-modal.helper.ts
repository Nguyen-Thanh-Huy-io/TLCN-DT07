import { QuizQuestionType, OrderingItem } from '@/features/lessons/types/quiz.types';
import { generateQuizId } from '@/features/lessons/factories/quiz-question.factory';
import { MatchingPairsValue } from '@/components/common/MatchingPairsEditor';
import { QuestionBankItem } from '@/services/entities/question.service';
import {
  CircleDot,
  CheckSquare,
  HelpCircle,
  Clock,
  ArrowLeftRight,
} from 'lucide-react';
import React from 'react';

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface OptionItemState {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface QuestionTypeCardConfig {
  type: QuizQuestionType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  isReady: boolean;
}

export const QUESTION_TYPE_CARDS: QuestionTypeCardConfig[] = [
  {
    type: QuizQuestionType.SINGLE_CHOICE,
    title: 'Radio Button',
    subtitle: '(Single Choice)',
    icon: CircleDot,
    isReady: true,
  },
  {
    type: QuizQuestionType.MULTIPLE_CHOICE,
    title: 'Check Box',
    subtitle: '(Multiple Choice)',
    icon: CheckSquare,
    isReady: true,
  },
  {
    type: QuizQuestionType.TRUE_FALSE,
    title: 'Đúng / Sai',
    subtitle: '(True / False)',
    icon: HelpCircle,
    isReady: true,
  },
  {
    type: QuizQuestionType.ORDERING,
    title: 'Dòng thời gian',
    subtitle: '(Timeline Order)',
    icon: Clock,
    isReady: true,
  },
  {
    type: QuizQuestionType.MATCHING,
    title: 'Ghép nối',
    subtitle: '(Matching Pairs)',
    icon: ArrowLeftRight,
    isReady: true,
  },
];

export function createDefaultMatchingPairs(): MatchingPairsValue {
  const l1 = generateQuizId('l');
  const r1 = generateQuizId('r');
  const l2 = generateQuizId('l');
  const r2 = generateQuizId('r');
  const l3 = generateQuizId('l');
  const r3 = generateQuizId('r');
  return {
    leftItems: [
      { id: l1, label: '' },
      { id: l2, label: '' },
      { id: l3, label: '' },
    ],
    rightItems: [
      { id: r1, label: '' },
      { id: r2, label: '' },
      { id: r3, label: '' },
    ],
    correctPairs: [
      { leftId: l1, rightId: r1 },
      { leftId: l2, rightId: r2 },
      { leftId: l3, rightId: r3 },
    ],
  };
}

export function createDefaultOptions(): OptionItemState[] {
  return [
    { id: generateQuizId('opt'), text: '', isCorrect: true },
    { id: generateQuizId('opt'), text: '', isCorrect: false },
    { id: generateQuizId('opt'), text: '', isCorrect: false },
    { id: generateQuizId('opt'), text: '', isCorrect: false },
  ];
}

export function createDefaultOrderingItems(): OrderingItem[] {
  return [
    { id: generateQuizId('item'), label: '' },
    { id: generateQuizId('item'), label: '' },
    { id: generateQuizId('item'), label: '' },
  ];
}

function validateChoiceQuestion(
  type: QuizQuestionType,
  options: OptionItemState[]
): string | null {
  if (options.length < 2) return 'Cần ít nhất 2 phương án lựa chọn.';
  if (options.some((o) => !o.text.trim())) {
    return 'Vui lòng nhập nội dung cho tất cả các phương án đáp án.';
  }
  const correctCount = options.filter((o) => o.isCorrect).length;
  if (type === QuizQuestionType.SINGLE_CHOICE && correctCount !== 1) {
    return 'Vui lòng đánh dấu chọn chính xác 1 đáp án đúng (Correct).';
  }
  if (type === QuizQuestionType.MULTIPLE_CHOICE && correctCount < 1) {
    return 'Vui lòng đánh dấu chọn ít nhất 1 đáp án đúng (Correct) cho câu hỏi nhiều lựa chọn.';
  }
  return null;
}

function validateOrderingQuestion(orderingItems: OrderingItem[]): string | null {
  if (orderingItems.length < 2) {
    return 'Cần ít nhất 2 mốc sự kiện để sắp xếp dòng thời gian.';
  }
  if (orderingItems.some((it) => !it.label.trim())) {
    return 'Vui lòng nhập đầy đủ nội dung cho tất cả các mốc sự kiện.';
  }
  return null;
}

function validateMatchingQuestion(matchingPairsValue: MatchingPairsValue): string | null {
  if (matchingPairsValue.leftItems.length < 2) {
    return 'Cần ít nhất 2 cặp thông tin để tạo câu hỏi ghép nối.';
  }
  if (
    matchingPairsValue.leftItems.some((it) => !it.label.trim()) ||
    matchingPairsValue.rightItems.some((it) => !it.label.trim())
  ) {
    return 'Vui lòng nhập đầy đủ nội dung Vế A và Vế B cho tất cả các cặp ghép nối.';
  }
  return null;
}

export function validateQuestionForm(
  type: QuizQuestionType,
  prompt: string,
  options: OptionItemState[],
  orderingItems: OrderingItem[],
  matchingPairsValue: MatchingPairsValue
): string | null {
  const cleanPromptText = prompt.replace(/<[^>]+>/g, '').trim();
  if (!cleanPromptText && !prompt.includes('<img')) {
    return 'Vui lòng nhập nội dung câu hỏi.';
  }

  if (type === QuizQuestionType.SINGLE_CHOICE || type === QuizQuestionType.MULTIPLE_CHOICE) {
    return validateChoiceQuestion(type, options);
  }
  if (type === QuizQuestionType.ORDERING) {
    return validateOrderingQuestion(orderingItems);
  }
  if (type === QuizQuestionType.MATCHING) {
    return validateMatchingQuestion(matchingPairsValue);
  }
  return null;
}

export function buildQuestionData(
  type: QuizQuestionType,
  options: OptionItemState[],
  correctAnswer: boolean,
  orderingItems: OrderingItem[],
  matchingPairsValue: MatchingPairsValue
) {
  if (type === QuizQuestionType.TRUE_FALSE) {
    return { correctAnswer };
  }
  if (type === QuizQuestionType.ORDERING) {
    return {
      items: orderingItems.map((it) => ({
        id: it.id,
        label: it.label.trim(),
      })),
      correctOrder: orderingItems.map((it) => it.id),
    };
  }
  if (type === QuizQuestionType.MATCHING) {
    return {
      leftItems: matchingPairsValue.leftItems.map((it) => ({
        id: it.id,
        label: it.label.trim(),
      })),
      rightItems: matchingPairsValue.rightItems.map((it) => ({
        id: it.id,
        label: it.label.trim(),
      })),
      correctPairs: matchingPairsValue.correctPairs,
    };
  }
  return { options };
}

export interface InitialParsedQuestionState {
  type: QuizQuestionType;
  prompt: string;
  explanation: string;
  difficulty: QuestionDifficulty;
  points: number;
  topicIds: string[];
  lessonIds: string[];
  correctAnswer: boolean;
  orderingItems: OrderingItem[];
  matchingPairsValue: MatchingPairsValue;
  options: OptionItemState[];
  expandedNotes: Record<string, boolean>;
}

function parseOrderingData(data?: Record<string, unknown>): OrderingItem[] {
  if (Array.isArray(data?.items) && data.items.length >= 2) {
    const rawItems: OrderingItem[] = data.items as OrderingItem[];
    const rawOrder: string[] = Array.isArray(data?.correctOrder) ? (data.correctOrder as string[]) : [];
    if (rawOrder.length === rawItems.length) {
      const itemMap = new Map(rawItems.map((it) => [it.id, it]));
      const sorted = rawOrder.map((id) => itemMap.get(id)).filter(Boolean) as OrderingItem[];
      return sorted.length === rawItems.length ? sorted : rawItems;
    }
    return rawItems;
  }
  return createDefaultOrderingItems();
}

function parseMatchingData(data?: Record<string, unknown>): MatchingPairsValue {
  if (
    Array.isArray(data?.leftItems) &&
    Array.isArray(data?.rightItems) &&
    Array.isArray(data?.correctPairs) &&
    data.leftItems.length >= 2
  ) {
    return {
      leftItems: data.leftItems as MatchingPairsValue['leftItems'],
      rightItems: data.rightItems as MatchingPairsValue['rightItems'],
      correctPairs: data.correctPairs as MatchingPairsValue['correctPairs'],
    };
  }
  return createDefaultMatchingPairs();
}

function parseOptionsData(data?: Record<string, unknown>): {
  options: OptionItemState[];
  expandedNotes: Record<string, boolean>;
} {
  if (Array.isArray(data?.options)) {
    const options = data.options as OptionItemState[];
    const notesMap: Record<string, boolean> = {};
    options.forEach((opt) => {
      if (opt.explanation && opt.explanation.trim()) {
        notesMap[opt.id] = true;
      }
    });
    return { options, expandedNotes: notesMap };
  }
  return { options: createDefaultOptions(), expandedNotes: {} };
}

export function parseInitialQuestionState(
  initialQuestion?: QuestionBankItem | null
): InitialParsedQuestionState {
  if (!initialQuestion) {
    return {
      type: QuizQuestionType.SINGLE_CHOICE,
      prompt: '',
      explanation: '',
      difficulty: 'MEDIUM',
      points: 1,
      topicIds: [],
      lessonIds: [],
      correctAnswer: true,
      orderingItems: createDefaultOrderingItems(),
      matchingPairsValue: createDefaultMatchingPairs(),
      options: createDefaultOptions(),
      expandedNotes: {},
    };
  }

  const { options, expandedNotes } = parseOptionsData(initialQuestion.data);

  return {
    type: initialQuestion.type,
    prompt: initialQuestion.prompt || '',
    explanation: initialQuestion.explanation || '',
    difficulty: initialQuestion.difficulty || 'MEDIUM',
    points: initialQuestion.points ?? 1,
    topicIds: initialQuestion.topics?.map((t) => t.id) || [],
    lessonIds: initialQuestion.lessons?.map((l) => l.id) || [],
    correctAnswer:
      typeof initialQuestion.data?.correctAnswer === 'boolean'
        ? initialQuestion.data.correctAnswer
        : true,
    orderingItems: parseOrderingData(initialQuestion.data),
    matchingPairsValue: parseMatchingData(initialQuestion.data),
    options,
    expandedNotes,
  };
}
