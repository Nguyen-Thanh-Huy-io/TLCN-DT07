import { ContentStatus } from '@prisma/client';

/** Chỉ nội dung đã xuất bản mới được lộ ra ngoài public. */
export const PUBLIC_CONTENT_STATUS = ContentStatus.PUBLISHED;

/** Các section động của landing page (lấy dữ liệu từ Topic). */
export enum LandingSection {
  CHAPTERS = 'CHAPTERS',
  KNOWLEDGE = 'KNOWLEDGE',
}

/** Token DI để inject danh sách tất cả strategy của landing. */
export const LANDING_SECTION_STRATEGIES = Symbol('LANDING_SECTION_STRATEGIES');

export const PUBLIC_CONTENT_ROUTES = {
  ROOT: 'public',
  LANDING: 'landing',
  PERIODS: 'periods',
  PERIOD_DETAIL: 'periods/:slug',
  TOPICS: 'topics',
  TOPIC_DETAIL: 'topics/:slug',
  FIGURES: 'figures',
  FIGURE_DIRECTORY: 'figures/directory',
  FIGURE_DETAIL: 'figures/:slug',
  LOCATIONS: 'locations',
  EVENTS: 'events',
  EVENT_DETAIL: 'events/:slug',
} as const;

export const PUBLIC_CONTENT_MESSAGES = {
  PERIOD_NOT_FOUND: (slug: string) =>
    `Không tìm thấy giai đoạn lịch sử với đường dẫn "${slug}"`,
  TOPIC_NOT_FOUND: (slug: string) =>
    `Không tìm thấy chủ đề / chương sử với đường dẫn "${slug}"`,
  FIGURE_NOT_FOUND: (slug: string) =>
    `Không tìm thấy nhân vật lịch sử với đường dẫn "${slug}"`,
  EVENT_NOT_FOUND: (slug: string) =>
    `Không tìm thấy sự kiện lịch sử với đường dẫn "${slug}"`,
} as const;

/** Hậu tố niên đại khi tự sinh timeLabel. */
export const ERA_SUFFIX = {
  BCE: 'TCN',
  PRESENT: 'nay',
} as const;

