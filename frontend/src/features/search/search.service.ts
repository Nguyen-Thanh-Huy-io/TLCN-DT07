import api from '@/services/api';
import type {
  PublicArticleSummary,
  PublicLibraryLesson,
  PublicTimeline,
} from '@/services/public/public-content.service';
import { buildSearchIndex, type SearchEntry, type SearchSource } from './search-index';

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
