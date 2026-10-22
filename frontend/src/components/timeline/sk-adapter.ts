import {
  PublicEventSummaryDto,
  PublicFigureDto,
  PublicLocationSummaryDto,
  PublicPeriodDto,
} from "@/services/entities/landing.service";
import { EVENT_CATEGORY_LABELS, EventCategory } from "@/constants/enums";
import { isDomesticRegion, regionLabel } from "@/utils/region.utils";
import type { Attributed, Era, SubEra, TimeNode, TimelineEvent, TimelineFigure, TimelineLocation } from "./sk-types";

function toTimelineFigure(figure: PublicFigureDto): TimelineFigure {
  return {
    id: figure.id,
    slug: figure.slug,
    name: figure.name,
    role: figure.tagline || "Nhân vật lịch sử",
    avatarUrl: figure.imageUrl || undefined,
    bio: figure.description || figure.tagline || "Chưa có thông tin chi tiết.",
  };
}

function toTimelineLocation(location: PublicLocationSummaryDto): TimelineLocation {
  return {
    id: location.id,
    name: location.name,
    modernName: location.address || undefined,
    coordinates:
      location.latitude != null && location.longitude != null
        ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
        : undefined,
    description: location.historicalSignificance || location.address || "Chưa có mô tả chi tiết.",
  };
}

function attributeToEvents<T extends { id: string }>(
  events: TimelineEvent[],
  pick: (event: TimelineEvent) => T[],
): Attributed<T>[] {
  const byId = new Map<string, Attributed<T>>();
  for (const event of events) {
    for (const item of pick(event)) {
      const existing = byId.get(item.id);
      if (existing) existing.eventTitles.push(event.title);
      else byId.set(item.id, { ...item, eventTitles: [event.title] });
    }
  }
  return Array.from(byId.values());
}

const THEME_COLORS = ["green", "amber"];

function categoryLabel(category: string): string {
  return EVENT_CATEGORY_LABELS[category as EventCategory] || category;
}

function domainGroupOf(category: string): "POLITICS_MILITARY" | "ECONOMY_CULTURE" {
  return category === "CULTURE_SCIENCE" ? "ECONOMY_CULTURE" : "POLITICS_MILITARY";
}

function scopeGroupOf(region: string | null): "DOMESTIC" | "WORLD" {
  return isDomesticRegion(region) ? "DOMESTIC" : "WORLD";
}

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
  region: string | null,
): TimelineEvent {
  const label = categoryLabel(event.category);
  return {
    id: event.id,
    dateLabel: dateLabelOf(event),
    dateNote: event.eventDateNote || undefined,
    year: event.startYear,
    era: eraTitle,
    subEra: subEraTitle,
    category: label,
    categoryCode: event.category,
    scopeGroup: scopeGroupOf(region),
    region: regionLabel(region),
    domainGroup: domainGroupOf(event.category),
    title: event.title,
    summary: event.description || "Chưa có mô tả cho sự kiện này.",
    content: event.description || "Chưa có nội dung chi tiết cho sự kiện này.",
    imageUrl: event.imageUrl || undefined,
    tags: event.location ? [event.location] : [],
    figures: event.figures.map(toTimelineFigure),
    locations: event.locations.map(toTimelineLocation),
  };
}

export function buildEraDataset(periods: PublicPeriodDto[], events: PublicEventSummaryDto[]): Era[] {
  const topPeriods = periods
    .filter((p) => !p.parentId)
    .sort((a, b) => (a.startYear ?? 0) - (b.startYear ?? 0));

  const eventsByPeriodSlug = new Map<string, PublicEventSummaryDto[]>();
  for (const event of events) {
    if (!event.periodSlug) continue;
    const list = eventsByPeriodSlug.get(event.periodSlug) || [];
    list.push(event);
    eventsByPeriodSlug.set(event.periodSlug, list);
  }

  return topPeriods.map((top): Era => {
    const leafPeriods = periods
      .filter((p) => p.parentId === top.id)
      .sort((a, b) => (a.startYear ?? 0) - (b.startYear ?? 0));

    const subEras: SubEra[] = leafPeriods.map((leaf, leafIndex): SubEra => {
      const region = leaf.region ?? top.region ?? null;
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
          const events = yearEvents.map((e) => toTimelineEvent(e, top.name, leaf.name, region));
          return {
            id: `node-${yearEvents[0].id}`,
            subEraId: leaf.id,
            dateLabel: yearEvents.length > 1 ? yearLabel(year) : dateLabelOf(yearEvents[0]),
            sortYear: year,
            events,
            // A node can bundle unrelated events that share a year, so each entry
            // records which of those events it actually takes part in.
            figures: attributeToEvents(events, (e) => e.figures),
            locations: attributeToEvents(events, (e) => e.locations),
          };
        });

      return {
        id: leaf.id,
        eraId: top.id,
        title: leaf.name,
        periodLabel: leaf.timeLabel,
        summary: leaf.description || "",
        themeColor: THEME_COLORS[leafIndex % THEME_COLORS.length],
        timeNodes,
      };
    }).filter((subEra) => subEra.timeNodes.length > 0);

    return {
      id: top.id,
      title: top.name,
      periodLabel: top.timeLabel,
      overview: top.description || "",
      subEras,
    };
  }).filter((era) => era.subEras.length > 0);
}
