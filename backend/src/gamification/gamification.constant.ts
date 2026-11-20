import {
  AchievementMetricType,
  GamificationActivityType,
  GoalPresetKey,
  GoalTargetType,
} from '@prisma/client';

export const GAMIFICATION_ROUTES = {
  ROOT: 'gamification',
  OVERVIEW: 'overview',
  GOALS: 'goals',
  GOAL_BY_ID: 'goals/:id',
  ARTICLE_READ_COMPLETE: 'articles/:articleId/read-complete',
  ARTICLE_READ_STATUS: 'articles/:articleId/read-status',
  ADMIN_OVERVIEW: 'admin/overview',
  ADMIN_LEARNERS: 'admin/learners',
  ADMIN_ACHIEVEMENTS: 'admin/achievements',
  ADMIN_ACHIEVEMENT_BY_ID: 'admin/achievements/:id',
} as const;

export enum AdminLearnerSortField {
  XP = 'XP',
  DAY_STREAK = 'DAY_STREAK',
  WEEK_STREAK = 'WEEK_STREAK',
  ACTIVITIES = 'ACTIVITIES',
}

export const ALLOWED_ACHIEVEMENT_ICONS = [
  'Sparkles',
  'Flame',
  'Award',
  'CalendarCheck',
  'BookOpen',
  'Trophy',
  'ScrollText',
  'Layers',
] as const;

export enum GamificationEventName {
  LESSON_COMPLETED = 'gamification.lesson.completed',
  QUIZ_SUBMITTED = 'gamification.quiz.submitted',
  FLASHCARD_REVIEWED = 'gamification.flashcard.reviewed',
  MINDMAP_CREATED = 'gamification.mindmap.created',
  NOTE_CREATED = 'gamification.note.created',
}

export const GAMIFICATION_LIMITS = {
  MAX_SECONDARY_ACTIVE_GOALS: 3,
  RECENT_DAYS_WINDOW: 14,
  MIN_GOAL_TARGET: 1,
  MAX_GOAL_TARGET: 200,
} as const;

export const ACTIVITY_XP_MAP: Record<GamificationActivityType, number> = {
  [GamificationActivityType.LESSON_COMPLETED]: 25,
  [GamificationActivityType.QUIZ_SUBMITTED]: 20,
  [GamificationActivityType.ARTICLE_READ_COMPLETED]: 20,
  [GamificationActivityType.MINDMAP_CREATED]: 20,
  [GamificationActivityType.NOTE_CREATED]: 10,
  [GamificationActivityType.FLASHCARD_REVIEWED]: 5,
};

export const QUIZ_XP_BY_RESULT = {
  PASSED: ACTIVITY_XP_MAP[GamificationActivityType.QUIZ_SUBMITTED],
  FAILED: 10,
} as const;

export interface ScholarRankSpec {
  code: string;
  label: string;
  minXp: number;
}

export const SCHOLAR_RANKS: ReadonlyArray<ScholarRankSpec> = [
  { code: 'SEEDLING', label: 'Mầm sử học', minXp: 0 },
  { code: 'SEEKER', label: 'Người tầm sử', minXp: 100 },
  { code: 'SCHOLAR', label: 'Học giả', minXp: 300 },
  { code: 'HISTORIAN', label: 'Sử gia trẻ', minXp: 700 },
  { code: 'CHANCELLOR', label: 'Học sĩ Quốc Tử Giám', minXp: 1500 },
  { code: 'GRAND_HISTORIAN', label: 'Đại Sử Gia', minXp: 3000 },
];

export const PRESET_WEEKLY_STUDY_DAYS: Partial<
  Record<GoalPresetKey, { days: number; title: string }>
> = {
  [GoalPresetKey.PRESET_1X]: {
    days: 1,
    title: 'Khởi động nhẹ nhàng · 1 ngày/tuần',
  },
  [GoalPresetKey.PRESET_3X]: {
    days: 3,
    title: 'Duy trì thói quen · 3 ngày/tuần',
  },
  [GoalPresetKey.PRESET_5X]: {
    days: 5,
    title: 'Bứt phá sử học · 5 ngày/tuần',
  },
};

export const DEFAULT_GOAL_TITLES: Record<GoalTargetType, string> = {
  [GoalTargetType.STUDY_DAYS]: 'Ngày có học tập',
  [GoalTargetType.COMPLETE_LESSONS]: 'Hoàn thành bài học',
  [GoalTargetType.PASS_QUIZZES]: 'Vượt qua bài Quiz',
  [GoalTargetType.REVIEW_FLASHCARDS]: 'Ôn tập thẻ Flashcard',
  [GoalTargetType.READ_ARTICLES]: 'Đọc bài viết lịch sử',
  [GoalTargetType.ANY_ACTIVITIES]: 'Hoạt động học tập',
};

export interface SeedAchievementSpec {
  code: string;
  title: string;
  description: string;
  iconKey: string;
  metricType: AchievementMetricType;
  threshold: number;
  xpReward: number;
  sortOrder: number;
}

export const DEFAULT_ACHIEVEMENTS: ReadonlyArray<SeedAchievementSpec> = [
  {
    code: 'FIRST_STEP',
    title: 'Khởi hành sử học',
    description: 'Hoàn thành hoạt động học tập đầu tiên trên HISGO.',
    iconKey: 'Sparkles',
    metricType: AchievementMetricType.TOTAL_ACTIVITIES,
    threshold: 1,
    xpReward: 20,
    sortOrder: 1,
  },
  {
    code: 'STREAK_3',
    title: 'Giữ lửa 3 ngày',
    description: 'Học lịch sử đều đặn 3 ngày liên tiếp.',
    iconKey: 'Flame',
    metricType: AchievementMetricType.CURRENT_DAY_STREAK,
    threshold: 3,
    xpReward: 30,
    sortOrder: 2,
  },
  {
    code: 'STREAK_7',
    title: 'Bền bỉ 7 ngày',
    description: 'Duy trì chuỗi học tập 7 ngày liên tiếp không ngắt quãng.',
    iconKey: 'Award',
    metricType: AchievementMetricType.CURRENT_DAY_STREAK,
    threshold: 7,
    xpReward: 60,
    sortOrder: 3,
  },
  {
    code: 'WEEK_WARRIOR',
    title: 'Nhịp tuần vàng',
    description: 'Giữ thói quen học ít nhất 2 tuần liên tiếp.',
    iconKey: 'CalendarCheck',
    metricType: AchievementMetricType.CURRENT_WEEK_STREAK,
    threshold: 2,
    xpReward: 50,
    sortOrder: 4,
  },
  {
    code: 'LESSON_SCHOLAR',
    title: 'Học giả chuyên cần',
    description: 'Hoàn thành 5 bài học trong chương trình sử học.',
    iconKey: 'BookOpen',
    metricType: AchievementMetricType.COMPLETED_LESSONS,
    threshold: 5,
    xpReward: 50,
    sortOrder: 5,
  },
  {
    code: 'QUIZ_MASTER',
    title: 'Chiến thần Luyện tập',
    description: 'Vượt qua 5 đề Quiz đạt điểm chuẩn.',
    iconKey: 'Trophy',
    metricType: AchievementMetricType.PASSED_QUIZZES,
    threshold: 5,
    xpReward: 50,
    sortOrder: 6,
  },
  {
    code: 'ARTICLE_READER',
    title: 'Độc giả sử liệu',
    description: 'Đọc hoàn tất 5 bài viết tư liệu lịch sử.',
    iconKey: 'ScrollText',
    metricType: AchievementMetricType.READ_ARTICLES,
    threshold: 5,
    xpReward: 40,
    sortOrder: 7,
  },
  {
    code: 'MEMORY_KEEPER',
    title: 'Trí nhớ vàng',
    description: 'Ôn tập 20 lượt thẻ ghi nhớ Flashcard.',
    iconKey: 'Layers',
    metricType: AchievementMetricType.REVIEWED_FLASHCARDS,
    threshold: 20,
    xpReward: 40,
    sortOrder: 8,
  },
];

export const GAMIFICATION_MESSAGES = {
  GOAL_NOT_FOUND: 'Không tìm thấy mục tiêu học tập.',
  TOO_MANY_SECONDARY_GOALS: `Chỉ hỗ trợ tối đa ${GAMIFICATION_LIMITS.MAX_SECONDARY_ACTIVE_GOALS} mục tiêu phụ cùng lúc.`,
  ARTICLE_NOT_FOUND: 'Không tìm thấy bài viết đã xuất bản.',
  ACHIEVEMENT_NOT_FOUND: 'Không tìm thấy huy hiệu thành tựu.',
  ACHIEVEMENT_CODE_EXISTS: 'Mã huy hiệu này đã tồn tại trong hệ thống.',
  ACHIEVEMENT_LOCKED_FOR_DELETE: (count: number) =>
    `Đã có ${count} học viên đạt huy hiệu này nên không thể xoá. Hãy chuyển sang Tắt hiển thị để bảo toàn lịch sử.`,
} as const;
