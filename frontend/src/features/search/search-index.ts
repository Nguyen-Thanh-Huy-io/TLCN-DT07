import type {
  PublicEventSummaryDto,
  PublicFigureProfileDto,
  PublicLocationSummaryDto,
  PublicPeriodDto,
} from '@/services/entities/landing.service';
import type { LibraryLesson } from '@/services/entities/learner.service';
import { regionLabel } from '@/utils/region.utils';

export type SearchEntryType = 'EVENT' | 'FIGURE' | 'LOCATION' | 'LESSON' | 'PERIOD';

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

export interface SearchSource {
  periods: PublicPeriodDto[];
  events: PublicEventSummaryDto[];
  figures: PublicFigureProfileDto[];
  locations: PublicLocationSummaryDto[];
  lessons: LibraryLesson[];
}

export const SEARCH_ROUTES = {
  EVENT: (slug: string) => `/su-kien/${slug}`,
  FIGURE: (slug: string) => `/nhan-vat/${slug}`,
  PERIOD: (slug: string) => `/giai-doan/${slug}`,
  LESSON: (slug: string) => `/bai-hoc/${slug}`,
  LOCATIONS: '/di-tich',
} as const;

export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} TCN` : String(year);
}

/** "Lịch sử Thế giới: Thời kỳ Trung đại (476 - 1492)" → "Thế giới Trung đại". */
export function shortPeriodName(name: string): string {
  return name
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/^Lịch sử\s+/i, '')
    .replace(/:\s*Thời kỳ\s+/i, ' ')
    .replace(/^(Thời kỳ|Thời đại|Giai đoạn)\s+/i, '')
    .trim();
}

function truncate(text: string | null | undefined, max: number): string {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function figureYears(f: PublicFigureProfileDto): string | undefined {
  const birth = f.birthDateLabel ?? (f.birthYear != null ? formatYear(f.birthYear) : null);
  const death = f.deathDateLabel ?? (f.deathYear != null ? formatYear(f.deathYear) : null);
  return birth || death ? `${birth ?? '?'} — ${death ?? '?'}` : undefined;
}

/** `keywords`: chữ dùng để tìm nhưng không hiển thị (tên gọi khác, nhân vật liên quan...). */
function entry(e: Omit<SearchEntry, 'haystack'>, keywords: string[] = []): SearchEntry {
  return { ...e, haystack: normalizeSearch(`${e.title} ${e.subtitle} ${e.year ?? ''} ${keywords.join(' ')}`) };
}

/** Chỉ mục tìm kiếm toàn cục: sự kiện, nhân vật, thời kỳ, địa danh, bài học. */
export function buildSearchIndex(source: SearchSource): SearchEntry[] {
  const regionBySlug = new Map(source.periods.map((p) => [p.slug, p]));
  const byId = new Map(source.periods.map((p) => [p.id, p]));
  const regionOfPeriod = (slug: string | null) => {
    let p = slug ? regionBySlug.get(slug) : undefined;
    while (p?.parentId && byId.has(p.parentId)) p = byId.get(p.parentId);
    return p ? regionLabel(p.region) : null;
  };

  return [
    ...source.events
      .filter((e) => e.slug)
      .map((e) =>
        entry(
          {
            id: `e-${e.id}`,
            type: 'EVENT',
            title: e.title,
            subtitle: [regionOfPeriod(e.periodSlug), e.figures[0]?.name].filter(Boolean).join(' · '),
            year: formatYear(e.startYear),
            href: SEARCH_ROUTES.EVENT(e.slug as string),
          },
          [...e.figures.map((f) => f.name), e.location ?? ''],
        ),
      ),
    ...source.figures.map((f) =>
      entry(
        {
          id: `f-${f.id}`,
          type: 'FIGURE',
          title: f.name,
          subtitle: truncate(f.tagline || f.occupation || '', 90),
          year: figureYears(f),
          href: SEARCH_ROUTES.FIGURE(f.slug),
        },
        [...(f.aliases ?? []), ...f.titles],
      ),
    ),
    ...source.periods.map((p) =>
      entry({
        id: `p-${p.id}`,
        type: 'PERIOD',
        title: shortPeriodName(p.name),
        subtitle: regionLabel(p.region),
        year: p.timeLabel,
        href: SEARCH_ROUTES.PERIOD(p.slug),
      }),
    ),
    ...source.locations.map((l) =>
      entry({
        id: `l-${l.id}`,
        type: 'LOCATION',
        title: l.name,
        subtitle: l.address ?? 'Di tích & địa danh',
        href: SEARCH_ROUTES.LOCATIONS,
      }),
    ),
    ...source.lessons.map((l) =>
      entry({
        id: `b-${l.id}`,
        type: 'LESSON',
        title: l.title,
        subtitle: `Bài học • ${l.estimatedReadMinutes} phút đọc`,
        href: SEARCH_ROUTES.LESSON(l.slug),
      }),
    ),
  ];
}
