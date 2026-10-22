import api from '@/services/api';
import type {
  PublicEventSummaryDto,
  PublicFigureProfileDto,
  PublicLocationSummaryDto,
  PublicPeriodDto,
} from '@/services/entities/landing.service';
import type { LibraryLesson } from '@/services/entities/learner.service';
import { buildSearchIndex, type SearchEntry, type SearchSource } from './search-index';

const ENDPOINTS = {
  PERIODS: '/public/periods',
  EVENTS: '/public/events',
  FIGURES: '/public/figures/directory',
  LOCATIONS: '/public/locations',
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

/**
 * Dữ liệu công khai (thời kỳ, sự kiện, nhân vật, địa danh, bài học) tải một lần cho cả phiên,
 * dùng chung cho ô tìm kiếm toàn cục và phần "liên quan" của bài học.
 */
export function loadPublicCatalog(): Promise<SearchSource> {
  if (!catalog) {
    catalog = Promise.all([
      list<PublicPeriodDto>(ENDPOINTS.PERIODS),
      list<PublicEventSummaryDto>(ENDPOINTS.EVENTS),
      list<PublicFigureProfileDto>(ENDPOINTS.FIGURES),
      list<PublicLocationSummaryDto>(ENDPOINTS.LOCATIONS),
      list<LibraryLesson>(ENDPOINTS.LESSONS),
    ]).then(([periods, events, figures, locations, lessons]) => ({ periods, events, figures, locations, lessons }));
    catalog.then((c) => {
      // Lỗi mạng toàn bộ → lần sau thử lại.
      if (!c.periods.length && !c.events.length && !c.figures.length) catalog = null;
    });
  }
  return catalog;
}

let index: Promise<SearchEntry[]> | null = null;

/** Chỉ mục tìm kiếm, dựng một lần từ dữ liệu công khai. */
export function loadSearchIndex(): Promise<SearchEntry[]> {
  if (!index) {
    index = loadPublicCatalog().then(buildSearchIndex);
    index.then((entries) => {
      if (entries.length === 0) index = null;
    });
  }
  return index;
}
