export enum GoalPresetKey {
  PRESET_1X = 'PRESET_1X',
  PRESET_3X = 'PRESET_3X',
  PRESET_5X = 'PRESET_5X',
  CUSTOM = 'CUSTOM',
}

export enum GoalTargetType {
  STUDY_DAYS = 'STUDY_DAYS',
  COMPLETE_LESSONS = 'COMPLETE_LESSONS',
  PASS_QUIZZES = 'PASS_QUIZZES',
  REVIEW_FLASHCARDS = 'REVIEW_FLASHCARDS',
  READ_ARTICLES = 'READ_ARTICLES',
  ANY_ACTIVITIES = 'ANY_ACTIVITIES',
}

export enum GoalPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
}

export const GAMIFICATION_API = {
  OVERVIEW: '/gamification/overview',
  GOALS: '/gamification/goals',
  GOAL_BY_ID: (id: string) => `/gamification/goals/${id}`,
  ARTICLE_READ_COMPLETE: (articleId: string) =>
    `/gamification/articles/${articleId}/read-complete`,
  ARTICLE_READ_STATUS: (articleId: string) =>
    `/gamification/articles/${articleId}/read-status`,
} as const;

export const GAMIFICATION_CHANGE_EVENT = 'hisgo:gamification-change';

export interface GoalPresetUiMeta {
  key: GoalPresetKey;
  badgeText: string;
  title: string;
  subtitle: string;
  badgeBgClass: string;
  badgeTextClass: string;
  daysPerWeek?: number;
}

export const GOAL_PRESET_CARDS: ReadonlyArray<GoalPresetUiMeta> = [
  {
    key: GoalPresetKey.PRESET_1X,
    badgeText: '1x',
    title: 'Khởi động nhẹ nhàng',
    subtitle: '1 ngày học / tuần',
    badgeBgClass: 'bg-violet-100 border-violet-200',
    badgeTextClass: 'text-violet-700',
    daysPerWeek: 1,
  },
  {
    key: GoalPresetKey.PRESET_3X,
    badgeText: '3x',
    title: 'Duy trì thói quen',
    subtitle: '3 ngày học / tuần',
    badgeBgClass: 'bg-amber-100 border-amber-200',
    badgeTextClass: 'text-amber-700',
    daysPerWeek: 3,
  },
  {
    key: GoalPresetKey.PRESET_5X,
    badgeText: '5x',
    title: 'Bứt phá sử học',
    subtitle: '5 ngày học / tuần',
    badgeBgClass: 'bg-emerald-100 border-emerald-200',
    badgeTextClass: 'text-emerald-700',
    daysPerWeek: 5,
  },
  {
    key: GoalPresetKey.CUSTOM,
    badgeText: '✎',
    title: 'Tự chọn mục tiêu',
    subtitle: 'Đặt chỉ tiêu bài học, quiz hoặc flashcard riêng',
    badgeBgClass: 'bg-rose-100 border-rose-200',
    badgeTextClass: 'text-rose-700',
  },
];

export const GOAL_TARGET_OPTIONS: ReadonlyArray<{
  value: GoalTargetType;
  label: string;
  unitLabel: string;
}> = [
  { value: GoalTargetType.STUDY_DAYS, label: 'Số ngày có học tập', unitLabel: 'ngày' },
  { value: GoalTargetType.COMPLETE_LESSONS, label: 'Hoàn thành bài học', unitLabel: 'bài học' },
  { value: GoalTargetType.PASS_QUIZZES, label: 'Vượt qua đề Quiz', unitLabel: 'đề đạt' },
  { value: GoalTargetType.READ_ARTICLES, label: 'Đọc xong bài viết', unitLabel: 'bài viết' },
  { value: GoalTargetType.REVIEW_FLASHCARDS, label: 'Ôn tập thẻ Flashcard', unitLabel: 'lượt thẻ' },
  { value: GoalTargetType.ANY_ACTIVITIES, label: 'Tổng hoạt động học tập', unitLabel: 'hoạt động' },
];

export const GOAL_PERIOD_OPTIONS: ReadonlyArray<{
  value: GoalPeriod;
  label: string;
}> = [
  { value: GoalPeriod.WEEKLY, label: 'Hằng tuần (Thứ 2 – Chủ nhật)' },
  { value: GoalPeriod.DAILY, label: 'Hằng ngày (Hôm nay)' },
];

export const GOAL_TARGET_UNIT: Record<GoalTargetType, string> = Object.fromEntries(
  GOAL_TARGET_OPTIONS.map((o) => [o.value, o.unitLabel]),
) as Record<GoalTargetType, string>;
