export const ALL_FILTER_VALUE = 'all';

export enum QuizStatusEnum {
  ALL = 'all',
  ACTIVE = 'ACTIVE',
  DRAFT = 'DRAFT',
}

export enum QuestionDifficultyEnum {
  ALL = 'all',
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export const DIFFICULTY_CONFIG: Record<
  string,
  { label: string; tone: 'ok' | 'warn' | 'neutral' }
> = {
  EASY: { label: 'Dễ', tone: 'ok' },
  MEDIUM: { label: 'Trung bình', tone: 'warn' },
  HARD: { label: 'Khó', tone: 'neutral' },
};

export const QUIZ_STATUS_BADGE_MAP: Record<
  string,
  { label: string; tone: 'ok' | 'neutral' }
> = {
  ACTIVE: { label: 'Đang hoạt động', tone: 'ok' },
  DRAFT: { label: 'Bản nháp', tone: 'neutral' },
};

export const DEFAULT_QUIZ_TIME_LIMIT = 15;
export const DEFAULT_QUIZ_PASSING_SCORE = 80;
