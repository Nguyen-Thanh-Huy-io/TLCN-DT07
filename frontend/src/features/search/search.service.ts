import api from '@/services/api';
import type {
  PublicEventSummaryDto,
  PublicFigureProfileDto,
  PublicLocationSummaryDto,
  PublicPeriodDto,
} from '@/services/entities/landing.service';
import type { LibraryLesson } from '@/services/entities/learner.service';
import { buildSearchIndex, type SearchEntry } from './search-index';

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

let cached: Promise<SearchEntry[]> | null = null;

/** Tải chỉ mục một lần cho cả phiên (lần đầu mở ô tìm kiếm), các lần sau dùng lại. */
export function loadSearchIndex(): Promise<SearchEntry[]> {
  if (!cached) {
    cached = Promise.all([
      list<PublicPeriodDto>(ENDPOINTS.PERIODS),
      list<PublicEventSummaryDto>(ENDPOINTS.EVENTS),
      list<PublicFigureProfileDto>(ENDPOINTS.FIGURES),
      list<PublicLocationSummaryDto>(ENDPOINTS.LOCATIONS),
      list<LibraryLesson>(ENDPOINTS.LESSONS),
    ]).then(([periods, events, figures, locations, lessons]) =>
      buildSearchIndex({ periods, events, figures, locations, lessons }),
    );
    cached.then((entries) => {
      if (entries.length === 0) cached = null; // Lỗi mạng toàn bộ → lần sau thử lại.
    });
  }
  return cached;
}
