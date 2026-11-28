import {
  PublicEventSummaryDto,
  PublicPeriodDto,
} from "@/services/entities/landing.service";
import { comparePeriodOrder } from "@/services/entities/landing-graph";
import {
  eventCategoryLabel,
  type EventCategoryItem,
  type PublicTag,
} from "@/services/public/public-content.service";

export const SK_SELECTED_CLASS = "sk-selected";

export enum TimelineFacetKey {
  ERAS = "eras",
}

export interface TimelineEvent {
  id: string;
  dateLabel: string;
  dateNote?: string;
  year: number;
  era: string;
  subEra: string;
  category: string;
  categoryCode: string;
  categoryId?: string | null;
  title: string;
  slug?: string | null;
  summary: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  tagItems: PublicTag[];
  siteType?: string | null;
  preservationCategory?: string | null;
  endYear?: number;
  spanLabel?: string;
}

export interface TimeNode {
  id: string;
  subEraId: string;
  dateLabel: string;
  sortYear: number;
  events: TimelineEvent[];
}

export interface SubEra {
  id: string;
  parentId?: string | null;
  slug: string;
  eraId: string;
  title: string;
  periodLabel: string;
  summary: string;
  themeColor: string;
  timeNodes: TimeNode[];
  totalItemCount?: number;
}

export interface Era {
  id: string;
  slug: string;
  title: string;
  periodLabel: string;
  overview: string;
  subEras: SubEra[];
  /** Đầy đủ nhánh cha/con (kể cả nhóm gom cấp 2 có 0 mốc trực tiếp) để dựng cây Mục lục 3 tầng. */
  tocSubEras?: SubEra[];
}

const THEME_COLORS = ["green", "amber"];

/** Nhãn ngắn hiển thị trên trục/thẻ. Ghi chú niên đại dài (vd. "Theo truyền thuyết...") chỉ hiện ở chi tiết. */
const MAX_DATE_LABEL_LENGTH = 24;

function yearLabel(year: number): string {
  return year < 0 ? `${Math.abs(year)} TCN` : `Năm ${year}`;
}

function dateLabelOf(event: PublicEventSummaryDto): string {
  const note = event.eventDateNote?.trim();
  return note && note.length <= MAX_DATE_LABEL_LENGTH ? note : yearLabel(event.startYear);
}

function toTimelineEvent(
  event: PublicEventSummaryDto,
  eraTitle: string,
  subEraTitle: string,
  eventCategories: EventCategoryItem[],
): TimelineEvent {
  const directCatName = event.category?.trim();
  const label =
    directCatName && !/^[a-z0-9-]+$/.test(directCatName)
      ? directCatName
      : eventCategoryLabel(eventCategories, event);
  const tagItems = event.tagItems ?? [];
  const tagNames = tagItems.length > 0 ? tagItems.map((t) => t.name) : event.location ? [event.location] : [];

  return {
    id: event.id,
    dateLabel: dateLabelOf(event),
    dateNote: event.eventDateNote || undefined,
    year: event.startYear,
    era: eraTitle,
    subEra: subEraTitle,
    category: label,
    categoryCode: event.category,
    categoryId: event.categoryIds?.[0] ?? null,
    title: event.title,
    slug: event.slug,
    summary: event.description || "Chưa có mô tả cho dấu mốc này.",
    content: event.description || "Chưa có nội dung chi tiết cho dấu mốc này.",
    imageUrl: event.imageUrl || undefined,
    tags: tagNames,
    tagItems,
    siteType: event.siteType ?? null,
    preservationCategory: event.preservationCategory ?? null,
    ...spanOf(event),
  };
}

/** Sự kiện kéo dài nhiều năm: năm kết thúc + nhãn khoảng thời gian. */
function spanOf(event: PublicEventSummaryDto): Pick<TimelineEvent, "endYear" | "spanLabel"> {
  const end = event.endYear;
  if (end === null || end === undefined || end <= event.startYear) return {};
  // Không có năm 0: từ 1 TCN tới 1 SCN là 1 năm.
  const years = end - event.startYear - (event.startYear < 0 && end > 0 ? 1 : 0);
  return { endYear: end, spanLabel: `${eraYear(event.startYear)} – ${eraYear(end)} · ${years} năm` };
}

const eraYear = (year: number) => (year < 0 ? `${Math.abs(year)} TCN` : String(year));

/** Thu thập đệ quy toàn bộ các giai đoạn con/cháu đúng theo `displayOrder` CMS của một thời kỳ gốc. */
function collectDescendantPeriods(periods: PublicPeriodDto[], rootId: string): PublicPeriodDto[] {
  const direct = periods
    .filter((p) => p.parentId === rootId)
    .sort(comparePeriodOrder);
  return direct.flatMap((child) => [child, ...collectDescendantPeriods(periods, child.id)]);
}

function hasActiveDescendantNodes(sub: SubEra, allSubs: SubEra[]): boolean {
  if (sub.timeNodes.length > 0) return true;
  return allSubs
    .filter((child) => child.parentId === sub.id)
    .some((child) => hasActiveDescendantNodes(child, allSubs));
}

export function buildEraDataset(
  periods: PublicPeriodDto[],
  events: PublicEventSummaryDto[],
  eventCategories: EventCategoryItem[] = [],
): Era[] {
  const topPeriods = periods
    .filter((p) => !p.parentId)
    .sort(comparePeriodOrder);

  const eventsByPeriodSlug = new Map<string, PublicEventSummaryDto[]>();
  for (const event of events) {
    if (!event.periodSlug) continue;
    const list = eventsByPeriodSlug.get(event.periodSlug) || [];
    list.push(event);
    eventsByPeriodSlug.set(event.periodSlug, list);
  }

  return topPeriods
    .map((top): Era => {
      const descendants = collectDescendantPeriods(periods, top.id);
      const leafPeriods = [top, ...descendants];

      const rawSubEras: SubEra[] = leafPeriods.map((leaf, leafIndex): SubEra => {
        const leafEvents = (eventsByPeriodSlug.get(leaf.slug) || []).sort((a, b) => a.startYear - b.startYear);
        const nodesByYear = new Map<number, PublicEventSummaryDto[]>();
        for (const event of leafEvents) {
          const list = nodesByYear.get(event.startYear) || [];
          list.push(event);
          nodesByYear.set(event.startYear, list);
        }

        const timeNodes: TimeNode[] = Array.from(nodesByYear.entries())
          .sort(([a], [b]) => a - b)
          .map(([year, yearEvents]): TimeNode => {
            const mappedEvents = yearEvents.map((e) => toTimelineEvent(e, top.name, leaf.name, eventCategories));
            return {
              id: `node-${yearEvents[0].id}`,
              subEraId: leaf.id,
              dateLabel: yearEvents.length > 1 ? yearLabel(year) : dateLabelOf(yearEvents[0]),
              sortYear: year,
              events: mappedEvents,
            };
          });

        return {
          id: leaf.id,
          parentId: leaf.parentId ?? null,
          slug: leaf.slug,
          eraId: top.id,
          title: leaf.name,
          periodLabel: leaf.timeLabel,
          summary: leaf.description || "",
          themeColor: THEME_COLORS[leafIndex % THEME_COLORS.length],
          timeNodes,
          totalItemCount: Math.max(leaf.totalArticleCount ?? 0, leafEvents.length, timeNodes.length),
        };
      });

      const subEras = rawSubEras.filter((subEra) => subEra.timeNodes.length > 0);
      const tocSubEras = rawSubEras.filter(
        (subEra) => subEra.id !== top.id && hasActiveDescendantNodes(subEra, rawSubEras),
      );

      return {
        id: top.id,
        slug: top.slug,
        title: top.name,
        periodLabel: top.timeLabel,
        overview: top.description || "",
        subEras,
        tocSubEras,
      };
    })
    .filter((era) => era.subEras.length > 0);
}
