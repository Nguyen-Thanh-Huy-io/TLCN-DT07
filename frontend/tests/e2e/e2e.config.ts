/**
 * Cấu hình & hằng số tập trung cho bộ kiểm thử Playwright E2E TypeScript (không magic string).
 */

export enum E2eRoutes {
  HOME = '/',
  LOGIN = '/login',
  REGISTER = '/dang-ky',
  ACCOUNT = '/tai-khoan',
  ARTICLES = '/bai-viet',
  PRACTICE = '/luyen-tap',
  CURRICULUM = '/chuong-trinh-hoc',
  TIMELINE = '/dong-thoi-gian',
  CONCEPT_CANVAS = '/kham-pha-khai-niem',
  COMMUNITY = '/cong-dong',
  COMMUNITY_MEMBER = '/cong-dong/thanh-vien',
  CMS_HOME = '/cms',
  CMS_ARTICLES = '/articles',
  CMS_ARTICLE_CREATE = '/articles/create',
  CMS_CATEGORIES = '/categories',
  CMS_TAGS = '/tags',
  CMS_TIMELINES = '/timelines',
  CMS_CURRICULUM = '/curriculum',
  CMS_LESSON_CREATE = '/lessons/create',
  CMS_QUIZZES = '/quizzes',
  CMS_QUESTIONS_LEGACY = '/questions',
  CMS_REVIEW = '/review',
  CMS_MODERATION_LEGACY = '/moderation',
  CMS_BLOG_REVIEW_LEGACY = '/blog-review',
  CMS_USERS = '/users',
}

export enum AccountTabLabels {
  PROFILE = 'Hồ sơ sử học',
  LEARNING = 'Lộ trình của tôi',
  GAMIFICATION = 'Mục tiêu & Thành tựu',
  BOOKMARKS = 'Tư liệu đã lưu',
  FLASHCARDS = 'Thẻ ghi nhớ',
  MINDMAPS = 'Sơ đồ tư duy',
  SECURITY = 'Bảo mật & Phiên',
}

export enum FollowButtonLabels {
  FOLLOW = 'Theo dõi',
  FOLLOWING = 'Đang theo dõi',
}

export enum UiMessages {
  INVALID_LOGIN_VI = 'email hoặc mật khẩu không đúng',
  INVALID_LOGIN_EN = 'invalid email or password',
  QUIZ_SUBMITTED = 'Bài thi đã nộp thành công',
}

export const E2E_SEED_ACCOUNTS = {
  learnerEmail: 'e2e_ui_learner@example.com',
  learnerUsername: 'e2e_ui_learner',
  authorEmail: 'e2e_ui_author@example.com',
  authorUsername: 'e2e_ui_author',
  adminEmail: 'e2e_ui_admin@example.com',
  adminUsername: 'e2e_ui_admin',
  password: process.env.E2E_UI_PASSWORD || 'HisgoE2e@2026!',
  articleSlug: 'e2e-ui-khoi-nghia-hai-ba-trung',
  articleTitle: 'E2E Khởi nghĩa Hai Bà Trưng',
  quizTitle: 'E2E Đề luyện tập Hai Bà Trưng',
  timelineTitle: 'E2E Dòng thời gian Hai Bà Trưng',
  timelineNodeTitle: 'Hội thề Hát Môn (Năm 40)',
  categorySlug: 'e2e-ui-nhan-vat',
  categoryName: 'Nhân vật E2E',
  topicName: 'Thời kỳ Bắc thuộc E2E',
  lessonTitle: 'E2E Bài học Khởi nghĩa Hai Bà Trưng',
  lessonSlug: 'e2e-ui-bai-hoc-hai-ba-trung',
  pathTitle: 'E2E Lộ trình Lịch sử Hai Bà Trưng',
  tagName: 'E2E Hai Bà Trưng',
  blogTitle: 'Ghi chép sử liệu Hai Bà Trưng E2E',
} as const;
