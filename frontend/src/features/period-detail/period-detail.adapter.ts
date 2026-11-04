import { formatYear, shortPeriodName } from '@/features/landing/landing.adapter';
import { regionLabel } from '@/utils/region.utils';
import type {
  PublicEventSummaryDto,
  PublicPeriodDetailDto,
  PublicPeriodDto,
} from '@/services/entities/landing.service';

export { formatYear, regionLabel, shortPeriodName };

export const PERIOD_ROUTES = {
  PERIOD: (slug: string) => `/giai-doan/${slug}`,
  EVENT: (slug: string) => `/su-kien/${slug}`,
  FIGURE: (slug: string) => `/nhan-vat/${slug}`,
  LOCATIONS: '/di-tich',
  LOCATION: (slug: string) => `/di-tich/${slug}`,
  TIMELINE: '/dong-thoi-gian',
} as const;

/** Nhãn năm của sự kiện: ghi chú ngắn nếu có, không thì năm. */
export function eventYearLabel(event: PublicEventSummaryDto): string {
  const note = event.eventDateNote?.trim();
  return note && note.length <= 24 ? note : formatYear(event.startYear);
}

export interface EventGroup {
  id: string;
  title: string;
  years: string;
  href: string | null;
  events: PublicEventSummaryDto[];
}

/** Gom sự kiện theo giai đoạn con (theo thứ tự thời gian); sự kiện gắn thẳng vào thời kỳ để nhóm riêng. */
export function groupEventsByStage(period: PublicPeriodDetailDto, events: PublicEventSummaryDto[]): EventGroup[] {
  const groups: EventGroup[] = period.children.map((child) => ({
    id: child.id,
    title: shortPeriodName(child.name),
    years: child.timeLabel,
    href: PERIOD_ROUTES.PERIOD(child.slug),
    events: events.filter((e) => e.periodSlug === child.slug),
  }));
  const childSlugs = new Set(period.children.map((c) => c.slug));
  const direct = events.filter((e) => !e.periodSlug || !childSlugs.has(e.periodSlug));
  if (direct.length) {
    groups.unshift({
      id: period.id,
      title: period.children.length ? 'Toàn thời kỳ' : shortPeriodName(period.name),
      years: period.timeLabel,
      href: null,
      events: direct,
    });
  }
  return groups.filter((g) => g.events.length);
}

/** Thời kỳ liền trước / liền sau cùng cấp (cùng thời kỳ cha, hoặc cùng khu vực nếu là thời kỳ gốc). */
export function siblingPeriods(period: PublicPeriodDto, all: PublicPeriodDto[]) {
  const siblings = all
    .filter((p) =>
      period.parentId
        ? p.parentId === period.parentId
        : !p.parentId && regionLabel(p.region) === regionLabel(period.region),
    )
    .sort((a, b) => (a.startYear ?? 0) - (b.startYear ?? 0));
  const i = siblings.findIndex((p) => p.id === period.id);
  return { prev: i > 0 ? siblings[i - 1] : null, next: i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : null };
}
