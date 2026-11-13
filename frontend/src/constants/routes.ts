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
  QUESTIONS: '/questions',
  QUIZZES: '/quizzes',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  REVIEW: '/review',
  BLOG_REVIEW: '/blog-review',
  MODERATION: '/moderation',
  USERS: '/users',
  LOGIN: '/login',
} as const;

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

/** Ảnh nền phần đầu trang Dòng thời gian. */
export const TIMELINE_HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1686766219304-5e2fb0df9d2d?auto=format&fit=crop&w=1400&q=85';
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
  QUESTIONS = 'questions',
  QUIZZES = 'quizzes',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings',
  REVIEW = 'review',
  BLOG_REVIEW = 'blog-review',
  MODERATION = 'moderation',
  USERS = 'users',
}

