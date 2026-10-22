import { PublicEventSummaryDto, PublicPeriodDto } from "@/services/entities/landing.service";
import { EVENT_CATEGORY_LABELS, EventCategory } from "@/constants/enums";
import type { Era, SubEra, TimeNode, TimelineEvent } from "./sk-types";

const THEME_COLORS = ["green", "amber"];

function categoryLabel(category: string): string {
  return EVENT_CATEGORY_LABELS[category as EventCategory] || category;
}

function domainGroupOf(category: string): "POLITICS_MILITARY" | "ECONOMY_CULTURE" {
  return category === "CULTURE_SCIENCE" ? "ECONOMY_CULTURE" : "POLITICS_MILITARY";
}

function dateLabelOf(event: PublicEventSummaryDto): string {
  if (event.eventDateNote) return event.eventDateNote;
  return event.startYear < 0 ? `${Math.abs(event.startYear)} TCN` : `Năm ${event.startYear}`;
}

function toTimelineEvent(event: PublicEventSummaryDto, eraTitle: string, subEraTitle: string): TimelineEvent {
  const label = categoryLabel(event.category);
  return {
    id: event.id,
    dateLabel: dateLabelOf(event),
    year: event.startYear,
    era: eraTitle,
    subEra: subEraTitle,
    category: label,
    scopeGroup: "DOMESTIC",
    domainGroup: domainGroupOf(event.category),
    title: event.title,
    summary: event.description || "Chưa có mô tả cho sự kiện này.",
    content: event.description || "Chưa có nội dung chi tiết cho sự kiện này.",
    tags: event.location ? [event.location] : [],
    isMilestone: false,
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
      const leafEvents = (eventsByPeriodSlug.get(leaf.slug) || []).sort((a, b) => a.startYear - b.startYear);
      const nodesByYear = new Map<number, PublicEventSummaryDto[]>();
      for (const event of leafEvents) {
        const list = nodesByYear.get(event.startYear) || [];
        list.push(event);
        nodesByYear.set(event.startYear, list);
      }

      const timeNodes: TimeNode[] = Array.from(nodesByYear.entries())
        .sort(([a], [b]) => a - b)
        .map(([year, yearEvents]): TimeNode => ({
          id: `node-${yearEvents[0].id}`,
          subEraId: leaf.id,
          dateLabel: dateLabelOf(yearEvents[0]),
          sortYear: year,
          nodeType: "POINT",
          events: yearEvents.map((e) => toTimelineEvent(e, top.name, leaf.name)),
          figures: [],
          locations: [],
        }));

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
