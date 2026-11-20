export enum AchievementMetricType {
  TOTAL_ACTIVITIES = 'TOTAL_ACTIVITIES',
  CURRENT_DAY_STREAK = 'CURRENT_DAY_STREAK',
  CURRENT_WEEK_STREAK = 'CURRENT_WEEK_STREAK',
  COMPLETED_LESSONS = 'COMPLETED_LESSONS',
  PASSED_QUIZZES = 'PASSED_QUIZZES',
  READ_ARTICLES = 'READ_ARTICLES',
  REVIEWED_FLASHCARDS = 'REVIEWED_FLASHCARDS',
  CREATED_MINDMAPS = 'CREATED_MINDMAPS',
}

export enum AdminLearnerSortField {
  XP = 'XP',
  DAY_STREAK = 'DAY_STREAK',
  WEEK_STREAK = 'WEEK_STREAK',
  ACTIVITIES = 'ACTIVITIES',
}

export enum CmsGamificationTab {
  ACHIEVEMENTS = 'ACHIEVEMENTS',
  LEARNERS = 'LEARNERS',
}

export const GAMIFICATION_ADMIN_API = {
  OVERVIEW: '/gamification/admin/overview',
  LEARNERS: '/gamification/admin/learners',
  ACHIEVEMENTS: '/gamification/admin/achievements',
  ACHIEVEMENT_BY_ID: (id: string) => `/gamification/admin/achievements/${id}`,
} as const;

export const METRIC_TYPE_META: Record<
  AchievementMetricType,
  { label: string; unit: string }
> = {
  [AchievementMetricType.TOTAL_ACTIVITIES]: {
    label: 'Tổng hoạt động học tập',
    unit: 'hoạt động',
  },
  [AchievementMetricType.CURRENT_DAY_STREAK]: {
    label: 'Chuỗi ngày học liên tiếp',
    unit: 'ngày',
  },
  [AchievementMetricType.CURRENT_WEEK_STREAK]: {
    label: 'Chuỗi tuần năng nổ',
    unit: 'tuần',
  },
  [AchievementMetricType.COMPLETED_LESSONS]: {
    label: 'Bài học đã hoàn thành',
    unit: 'bài học',
  },
  [AchievementMetricType.PASSED_QUIZZES]: {
    label: 'Đề Quiz vượt qua đạt chuẩn',
    unit: 'đề',
  },
  [AchievementMetricType.READ_ARTICLES]: {
    label: 'Bài viết đã đọc hoàn tất',
    unit: 'bài viết',
  },
  [AchievementMetricType.REVIEWED_FLASHCARDS]: {
    label: 'Lượt ôn thẻ Flashcard',
    unit: 'lượt',
  },
  [AchievementMetricType.CREATED_MINDMAPS]: {
    label: 'Sơ đồ tư duy đã tạo',
    unit: 'sơ đồ',
  },
};

export const LEARNER_SORT_OPTIONS: ReadonlyArray<{
  value: AdminLearnerSortField;
  label: string;
}> = [
  { value: AdminLearnerSortField.XP, label: 'XP cao nhất' },
  { value: AdminLearnerSortField.DAY_STREAK, label: 'Chuỗi ngày cao nhất' },
  { value: AdminLearnerSortField.WEEK_STREAK, label: 'Chuỗi tuần cao nhất' },
  { value: AdminLearnerSortField.ACTIVITIES, label: 'Tổng hoạt động' },
];
