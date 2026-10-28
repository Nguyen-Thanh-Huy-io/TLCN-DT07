/**
 * Application Routes (Next.js App Router)
 * Eliminates all magic string paths and route keys
 */
export const APP_ROUTES = {
  DASHBOARD: '/',
  CURRICULUM: '/curriculum',
  KNOWLEDGE: '/knowledge',
  PERIODS: {
    LIST: '/periods',
    CREATE: '/periods/create',
    DETAIL: (id: string) => `/periods/${id}`,
  },
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
  EVENTS: {
    LIST: '/events',
    CREATE: '/events/create',
    DETAIL: (id: string) => `/events/${id}`,
  },
  LOCATIONS: {
    LIST: '/locations',
    CREATE: '/locations/create',
    DETAIL: (id: string) => `/locations/${id}`,
  },
  ENTITIES: {
    LIST: '/entities',
    CREATE: '/entities/create',
    DETAIL: (id: string) => `/entities/${id}`,
  },
  TAGS: {
    LIST: '/tags',
    CREATE: '/tags/create',
  },
  REVIEW: '/review',
  USERS: '/users',
  TAXONOMIES: '/taxonomies',
} as const;

export const SAMPLE_REMOTE_LINKS = {
  TRUONG_SON_IMAGE:
    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80',
  TRUONG_SON_VIDEO: 'https://www.youtube.com/watch?v=sample-truong-son',
  TRUONG_SON_DOCUMENT: 'https://example.com/tai-lieu-duong-truong-son.pdf',
} as const;

export enum NavigationPageKey {
  DASHBOARD = 'dashboard',
  CURRICULUM = 'curriculum',
  KNOWLEDGE = 'knowledge',
  PERIODS = 'periods',
  TOPICS = 'topics',
  LESSONS = 'lessons',
  EVENTS = 'events',
  LOCATIONS = 'locations',
  ENTITIES = 'entities',
  TAGS = 'tags',
  REVIEW = 'review',
  USERS = 'users',
  TAXONOMIES = 'taxonomies',
}

