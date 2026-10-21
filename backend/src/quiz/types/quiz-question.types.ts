/**
 * Các dạng câu hỏi hỗ trợ trong Đề ôn tập cuối bài (Quiz).
 * Không khai báo enum Prisma tương ứng vì `type` nằm trong cột JSONB `questions`,
 * không phải cột DB (theo đúng cách `LessonBlockType` của Lesson.content đang làm).
 */
export enum QuizQuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
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

export interface MultipleChoiceQuestion extends BaseQuizQuestion {
  type: QuizQuestionType.MULTIPLE_CHOICE;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
}

export interface TrueFalseQuestion extends BaseQuizQuestion {
  type: QuizQuestionType.TRUE_FALSE;
  correctAnswer: boolean;
}

export interface OrderingQuestion extends BaseQuizQuestion {
  type: QuizQuestionType.ORDERING;
  items: Array<{ id: string; label: string }>;
  correctOrder: string[];
}

export interface MatchingQuestion extends BaseQuizQuestion {
  type: QuizQuestionType.MATCHING;
  leftItems: Array<{ id: string; label: string }>;
  rightItems: Array<{ id: string; label: string }>;
  correctPairs: Array<{ leftId: string; rightId: string }>;
}

export interface FillInBlankQuestion extends BaseQuizQuestion {
  type: QuizQuestionType.FILL_IN_BLANK;
  acceptedAnswers: string[];
  caseSensitive?: boolean;
}

export type QuizQuestion =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | OrderingQuestion
  | MatchingQuestion
  | FillInBlankQuestion;
