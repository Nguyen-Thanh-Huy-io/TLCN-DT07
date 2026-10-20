/**
 * Application Routes (Next.js App Router)
 * Eliminates all magic string paths and route keys
 */
export const APP_ROUTES = {
  // Public Landing Page
  HOME: '/',

  // CMS Admin routes (all prefixed with /admin)
  DASHBOARD: '/admin',
  CURRICULUM: '/admin/curriculum',
  KNOWLEDGE: '/admin/knowledge',
  PERIODS: {
    LIST: '/admin/periods',
    CREATE: '/admin/periods/create',
  },
  TOPICS: {
    LIST: '/admin/topics',
    CREATE: '/admin/topics/create',
    DETAIL: (id: string) => `/admin/topics/${id}`,
  },
  LESSONS: {
    LIST: '/admin/lessons',
    CREATE: '/admin/lessons/create',
  },
  EVENTS: {
    LIST: '/admin/events',
    CREATE: '/admin/events/create',
  },
  LOCATIONS: {
    LIST: '/admin/locations',
    CREATE: '/admin/locations/create',
  },
  ENTITIES: {
    LIST: '/admin/entities',
    CREATE: '/admin/entities/create',
  },
  TAGS: {
    LIST: '/admin/tags',
    CREATE: '/admin/tags/create',
  },
  REVIEW: '/admin/review',
  USERS: '/admin/users',
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
  | 'users';
