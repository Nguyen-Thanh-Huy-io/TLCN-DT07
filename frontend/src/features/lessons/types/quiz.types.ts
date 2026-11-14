/**
 * Các dạng câu hỏi trong Đề ôn tập cuối bài — khớp 1:1 với backend
 * (`backend/src/quiz/types/quiz-question.types.ts`). Câu hỏi nằm ở Ngân hàng (`Question`), đề chỉ liên kết qua `quiz_questions`.
 */
export enum QuizQuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  ORDERING = 'ORDERING',
  MATCHING = 'MATCHING',
  FILL_IN_BLANK = 'FILL_IN_BLANK',
}

interface BaseQuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  explanation?: string;
}

export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string; // Ghi chú giải thích riêng cho lựa chọn này (ví dụ: vì sao sai / đúng)
}

export interface SingleChoiceQuestion extends BaseQuizQuestion {
  type: QuizQuestionType.SINGLE_CHOICE;
  options: MultipleChoiceOption[];
}

export interface MultipleChoiceQuestion extends BaseQuizQuestion {
  type: QuizQuestionType.MULTIPLE_CHOICE;
  options: MultipleChoiceOption[];
}

export interface TrueFalseQuestion extends BaseQuizQuestion {
  type: QuizQuestionType.TRUE_FALSE;
  correctAnswer: boolean;
}

export interface OrderingItem {
  id: string;
  label: string;
}

export interface OrderingQuestion extends BaseQuizQuestion {
  type: QuizQuestionType.ORDERING;
  items: OrderingItem[];
  correctOrder: string[];
}

export interface MatchingItem {
  id: string;
  label: string;
}

export interface MatchingPair {
  leftId: string;
  rightId: string;
}

export interface MatchingQuestion extends BaseQuizQuestion {
  type: QuizQuestionType.MATCHING;
  leftItems: MatchingItem[];
  rightItems: MatchingItem[];
  correctPairs: MatchingPair[];
}

export interface FillInBlankQuestion extends BaseQuizQuestion {
  type: QuizQuestionType.FILL_IN_BLANK;
  acceptedAnswers: string[];
  caseSensitive?: boolean;
}

export type QuizQuestion =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | OrderingQuestion
  | MatchingQuestion
  | FillInBlankQuestion;

export interface QuizItem {
  id: string;
  lessonId: string;
  title?: string | null;
  passingScorePercent?: number | null;
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export const QUIZ_QUESTION_TYPE_META: Record<
  QuizQuestionType,
  { label: string; shortLabel: string; color: string }
> = {
  [QuizQuestionType.SINGLE_CHOICE]: {
    label: 'Trắc nghiệm 1 đáp án',
    shortLabel: '1 đáp án',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  [QuizQuestionType.TRUE_FALSE]: {
    label: 'Đúng / Sai',
    shortLabel: 'Đúng/Sai',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  [QuizQuestionType.MULTIPLE_CHOICE]: {
    label: 'Nhiều đáp án đúng',
    shortLabel: 'Nhiều đáp án',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  [QuizQuestionType.ORDERING]: {
    label: 'Sắp xếp dòng thời gian',
    shortLabel: 'Sắp xếp',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  [QuizQuestionType.MATCHING]: {
    label: 'Ghép nối',
    shortLabel: 'Ghép nối',
    color: 'text-violet-600 bg-violet-50 border-violet-200',
  },
  [QuizQuestionType.FILL_IN_BLANK]: {
    label: 'Điền vào chỗ trống',
    shortLabel: 'Điền khuyết',
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  },
};
