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
  },
  TOPICS: {
    LIST: '/topics',
    CREATE: '/topics/create',
  },
  LESSONS: {
    LIST: '/lessons',
    CREATE: '/lessons/create',
  },
  EVENTS: {
    LIST: '/events',
    CREATE: '/events/create',
  },
  LOCATIONS: {
    LIST: '/locations',
    CREATE: '/locations/create',
  },
  ENTITIES: {
    LIST: '/entities',
    CREATE: '/entities/create',
  },
  TAGS: {
    LIST: '/tags',
    CREATE: '/tags/create',
  },
  REVIEW: '/review',
  USERS: '/users',
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
