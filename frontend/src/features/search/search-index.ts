import api from '@/services/api';
import { PUBLIC_ROUTES, type PublicArticleSummary, type PublicLibraryLesson, type PublicTimeline } from '@/services/public/public-content.service';

// === search.service.ts ===
const ENDPOINTS = {
  ARTICLES: '/public/articles',
  TIMELINES: '/public/timelines',
  LESSONS: '/public/lessons',
} as const;

async function list<T>(endpoint: string): Promise<T[]> {
  try {
    const res = await api.get(endpoint);
    const payload = res.data?.data ?? res.data;
    return Array.isArray(payload) ? payload : [];
  } catch {
    // Một nguồn lỗi không làm hỏng cả ô tìm kiếm — chỉ thiếu loại kết quả đó.
    return [];
  }
}

let catalog: Promise<SearchSource> | null = null;

/** Dữ liệu công khai tải 1 lần cho cả phiên (client), dùng chung cho tìm kiếm & "liên quan". */
export function loadPublicCatalog(): Promise<SearchSource> {
  if (!catalog) {
    catalog = Promise.all([
      list<PublicArticleSummary>(ENDPOINTS.ARTICLES),
      list<PublicTimeline>(ENDPOINTS.TIMELINES),
      list<PublicLibraryLesson>(ENDPOINTS.LESSONS),
    ]).then(([articles, timelines, lessons]) => ({ articles, timelines, lessons }));
    catalog.then((c) => {
      // Lỗi mạng toàn bộ → lần sau thử lại.
      if (!c.articles.length && !c.timelines.length && !c.lessons.length) catalog = null;
    });
  }
  return catalog;
}

let index: Promise<SearchEntry[]> | null = null;

export function loadSearchIndex(): Promise<SearchEntry[]> {
  if (!index) {
    index = loadPublicCatalog().then(buildSearchIndex);
    index.then((entries) => {
      if (entries.length === 0) index = null;
    });
  }
  return index;
}

// === search-index.ts ===
export type SearchEntryType = 'ARTICLE' | 'TIMELINE' | 'LESSON';

export interface SearchEntry {
  id: string;
  type: SearchEntryType;
  title: string;
  subtitle: string;
  year?: string;
  href: string;
  /** Chuỗi đã bỏ dấu, chữ thường — dùng để so khớp nhanh. */
  haystack: string;
}

/** Dữ liệu công khai tải 1 lần mỗi phiên (ô tìm kiếm + khối "liên quan" của bài học). */
export interface SearchSource {
  articles: PublicArticleSummary[];
  timelines: PublicTimeline[];
  lessons: PublicLibraryLesson[];
}

export { formatYear } from '@/utils/common';

/** "Lịch sử Thế giới: Thời kỳ Trung đại (476 - 1492)" → "Thế giới Trung đại". */
export function shortPeriodName(name: string): string {
  return name
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/^Lịch sử\s+/i, '')
    .replace(/:\s*Thời kỳ\s+/i, ' ')
    .replace(/^(Thời kỳ|Thời đại|Giai đoạn)\s+/i, '')
    .trim();
}

export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function truncate(text: string | null | undefined, max: number): string {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** `keywords`: chữ dùng để tìm nhưng không hiển thị (tag, mốc trong dòng thời gian...). */
function entry(e: Omit<SearchEntry, 'haystack'>, keywords: string[] = []): SearchEntry {
  return { ...e, haystack: normalizeSearch(`${e.title} ${e.subtitle} ${e.year ?? ''} ${keywords.join(' ')}`) };
}

export function buildSearchIndex(source: SearchSource): SearchEntry[] {
  return [
    ...source.articles.map((a) =>
      entry(
        {
          id: a.id,
          type: 'ARTICLE',
          title: a.title,
          subtitle: [a.category?.name, truncate(a.summary, 90)].filter(Boolean).join(' · '),
          year: a.dateLabel ?? undefined,
          href: PUBLIC_ROUTES.ARTICLE(a.slug),
        },
        [...a.tags.map((t) => t.name), ...(a.metadata?.aliases ?? [])],
      ),
    ),
    ...source.timelines.map((t) =>
      entry(
        {
          id: t.id,
          type: 'TIMELINE',
          title: t.title,
          subtitle: `${t.nodes.length} mốc${t.description ? ` · ${truncate(t.description, 80)}` : ''}`,
          href: PUBLIC_ROUTES.TIMELINE(t.slug),
        },
        t.nodes.map((n) => n.title),
      ),
    ),
    ...source.lessons.map((l) =>
      entry(
        {
          id: l.id,
          type: 'LESSON',
          title: l.title,
          subtitle: truncate(l.description, 100) || `${l.estimatedReadMinutes} phút đọc`,
          href: PUBLIC_ROUTES.LESSON(l.slug),
        },
        l.tags.map((t) => t.name),
      ),
    ),
  ];
}
