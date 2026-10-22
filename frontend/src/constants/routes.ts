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

export type NavigationPageKey =
  | 'dashboard'
  | 'curriculum'
  | 'knowledge'
  | 'periods'
  | 'topics'
  | 'lessons'
  | 'events'
  | 'locations'
  | 'entities'
  | 'tags'
  | 'review'
  | 'users'
  | 'taxonomies';
