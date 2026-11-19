/** Trang đọc chung /bai-viet/[slug]: lối vào cũ (/nhan-vat/[slug]…) được rewrite về đây kèm ?nguon=… */
export const READER_SOURCE_PARAM = 'nguon';

export enum ReaderSource {
  ARTICLE = 'bai-viet',
  FIGURE = 'nhan-vat',
  EVENT = 'su-kien',
  SITE = 'di-tich',
  ENTITY = 'thuc-the',
}

/**
 * Application Routes (Next.js App Router)
 * Eliminates all magic string paths and route keys
 */
export const APP_ROUTES = {
  DASHBOARD: '/',
  /** Trang tổng quan CMS (dashboard theo việc cần làm). */
  CMS: '/cms',
  CURRICULUM: '/curriculum',
  TOPICS: {
    // Không có LIST riêng: trang bảng "danh sách chủ đề" độc lập (/topics) đã bị bỏ —
    // trùng với tab "Cây phân cấp Chủ đề" trong /curriculum (cùng hiển thị 1 cây
    // Giai đoạn→Chủ đề→Bài học, chỉ khác dạng bảng phẳng vs cây) — dùng CURRICULUM làm
    // điểm "quay lại" ở mọi nơi khác. CREATE/DETAIL (form Tạo/Sửa Chủ đề) vẫn giữ.
    CREATE: '/topics/create',
    DETAIL: (id: string) => `/topics/${id}`,
  },
  LESSONS: {
    // Không có LIST riêng: trang "danh sách bài học" độc lập (/lessons) đã bị gộp vào
    // tab "Thư viện" của Curriculum Studio (xem HisgoStudioView.tsx) để tránh 2 nơi cùng
    // hiển thị 1 danh sách bài học — dùng CURRICULUM làm điểm "quay lại" ở mọi nơi khác.
    CREATE: '/lessons/create',
    DETAIL: (id: string) => `/lessons/${id}`,
  },
  ARTICLES: {
    LIST: '/articles',
    CREATE: '/articles/create',
    DETAIL: (id: string) => `/articles/${id}`,
  },
  CATEGORIES: '/categories',
  TIMELINES: {
    LIST: '/timelines',
    CREATE: '/timelines/create',
    DETAIL: (id: string) => `/timelines/${id}`,
  },
  TAGS: {
    LIST: '/tags',
  },
  MEDIA: '/media',
  QUIZZES: '/quizzes',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  REVIEW: '/review',
  BLOG_REVIEW: '/blog-review',
  MODERATION: '/moderation',
  USERS: '/users',
  GAMIFICATION: '/gamification',
  LOGIN: '/login',
} as const;

/** Trang Đề thi & Ngân hàng câu hỏi gộp chung `/quizzes`, chọn tab qua `?tab=`. */
export enum QuizWorkspaceTab {
  QUIZZES = 'quizzes',
  QUESTIONS = 'questions',
}
export const QUIZ_WORKSPACE_TAB_PARAM = 'tab';
export const quizWorkspaceRoute = (tab: QuizWorkspaceTab): string =>
  `${APP_ROUTES.QUIZZES}?${QUIZ_WORKSPACE_TAB_PARAM}=${tab}`;

/**
 * Hàng chờ duyệt `/review` gộp mọi loại việc duyệt, chọn tab qua `?tab=` (giá trị = ReviewQueueType
 * ở services/entities/dashboard.service.ts, hoặc "ALL"). Trang cũ /blog-review, /moderation chuyển về đây.
 */
export const REVIEW_HUB_TAB_PARAM = 'tab';
export const REVIEW_HUB_ALL_TAB = 'ALL';
export const reviewHubRoute = (tab: string): string => `${APP_ROUTES.REVIEW}?${REVIEW_HUB_TAB_PARAM}=${tab}`;

/* eslint-disable no-restricted-syntax -- Nơi định nghĩa tập trung các URL remote mẫu và protocol theo quy chuẩn ESLint */
export const URL_PROTOCOLS = {
  HTTPS: 'https://',
  HTTP: 'http://',
} as const;

export const SOCIAL_LINKS = {
  FACEBOOK: 'https://facebook.com',
  YOUTUBE: 'https://youtube.com',
  HOMEPAGE: 'https://hisgo.vn',
} as const;

export const SAMPLE_REMOTE_LINKS = {
  TRUONG_SON_IMAGE:
    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80',
  TRUONG_SON_VIDEO: 'https://www.youtube.com/watch?v=sample-truong-son',
  TRUONG_SON_DOCUMENT: 'https://example.com/tai-lieu-duong-truong-son.pdf',
  DIEN_BIEN_PHU_WIKI:
    'https://vi.wikipedia.org/wiki/Chi%E1%BA%BFn_d%E1%BB%8Bch_%C4%90i%E1%BB%87n_Bi%C3%AAn_Ph%E1%BB%A7',
  WIKIPEDIA_BASE_VI: 'https://vi.wikipedia.org/wiki/',
  WIKIPEDIA_BASE_EN: 'https://en.wikipedia.org/wiki/',
} as const;

/** REST API Wikipedia tiếng Việt — công cụ tra cứu thực thể trong trình soạn bài học. */
export const WIKIPEDIA_VI_API = {
  SEARCH_TITLE: 'https://vi.wikipedia.org/w/rest.php/v1/search/title',
  PAGE_SUMMARY: 'https://vi.wikipedia.org/api/rest_v1/page/summary',
} as const;

/* eslint-enable no-restricted-syntax */

export enum NavigationPageKey {
  CMS = 'cms',
  DASHBOARD = 'dashboard',
  CURRICULUM = 'curriculum',
  TOPICS = 'topics',
  LESSONS = 'lessons',
  ARTICLES = 'articles',
  CATEGORIES = 'categories',
  TIMELINES = 'timelines',
  TAGS = 'tags',
  MEDIA = 'media',
  QUIZZES = 'quizzes',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings',
  REVIEW = 'review',
  BLOG_REVIEW = 'blog-review',
  MODERATION = 'moderation',
  USERS = 'users',
  GAMIFICATION = 'gamification',
}

