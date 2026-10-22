import {
  PUBLIC_ROUTE_PREFIX,
  type PublicEventDetailDto,
  type PublicEventSummaryDto,
} from "@/services/entities/landing.service";
import { EVENT_CATEGORY_LABELS, EventCategory } from "@/constants/enums";
import type { ArticleSection, EntityMention, EventReaderModel } from "./ce-types";

export function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} TCN` : `${year}`;
}

function formatPoint(year: number, month: number | null, day: number | null): string {
  if (day && month) return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${formatYear(year)}`;
  if (month) return `Tháng ${month}/${formatYear(year)}`;
  return `Năm ${formatYear(year)}`;
}

export function eventDateLabel(e: PublicEventDetailDto): string {
  const start = formatPoint(e.startYear, e.startMonth, e.startDay);
  if (e.endYear === null || (e.endYear === e.startYear && !e.endMonth)) return start;
  const end = e.endMonth ? formatPoint(e.endYear, e.endMonth, e.endDay) : formatYear(e.endYear);
  return `${start.replace(/^Năm /, "")} – ${end}`;
}

function summaryDateLabel(e: PublicEventSummaryDto): string {
  return formatYear(e.startYear);
}

function eventHref(slug: string | null): string {
  return slug ? `${PUBLIC_ROUTE_PREFIX.EVENT}/${slug}` : "/dong-thoi-gian";
}

function buildMentions(event: PublicEventDetailDto): EntityMention[] {
  const roles = new Map(event.participants.map((p) => [p.entityId, p]));
  const figures: EntityMention[] = event.figures.map((f) => ({
    id: f.id,
    type: "FIGURE",
    name: f.name,
    roleLabel: roles.get(f.id)?.roleLabel ?? f.tagline,
    summary: f.tagline || f.description,
    imageUrl: f.imageUrl,
    href: `/nhan-vat?nv=${encodeURIComponent(f.slug)}`,
    isPrimary: roles.get(f.id)?.isPrimary ?? false,
  }));
  const locations: EntityMention[] = event.locations.map((l) => ({
    id: l.id,
    type: "LOCATION",
    name: l.name,
    roleLabel: roles.get(l.id)?.roleLabel ?? l.address,
    summary: l.historicalSignificance,
    imageUrl: null,
    href: "/di-tich",
    isPrimary: roles.get(l.id)?.isPrimary ?? false,
  }));
  return [...figures, ...locations];
}

function wordCount(...texts: Array<string | null>): number {
  return texts.reduce((n, t) => n + (t ? t.trim().split(/\s+/).length : 0), 0);
}

// Neighbours inside the same period, in chronological order — plain reading order, not causality.
function adjacent(event: PublicEventDetailDto, all: PublicEventSummaryDto[]) {
  const siblings = all
    .filter((e) => e.periodSlug && e.periodSlug === event.periodSlug)
    .map((e, i) => ({ e, i }))
    .sort((a, b) => a.e.startYear - b.e.startYear || a.i - b.i)
    .map(({ e }) => e);
  const index = siblings.findIndex((e) => e.id === event.id);
  const pick = (e: PublicEventSummaryDto | undefined) =>
    e ? { title: e.title, href: eventHref(e.slug), dateLabel: summaryDateLabel(e) } : null;
  return index < 0 ? { previous: null, next: null } : { previous: pick(siblings[index - 1]), next: pick(siblings[index + 1]) };
}

export function buildEventReaderModel(
  event: PublicEventDetailDto,
  allEvents: PublicEventSummaryDto[],
): EventReaderModel {
  const mentions = buildMentions(event);
  const sections: ArticleSection[] = [];

  if (event.cause) sections.push({ id: "boi-canh", title: "Bối cảnh & nguyên nhân", paragraphs: [event.cause] });
  if (event.description || event.children.length) {
    sections.push({
      id: "dien-bien",
      title: "Diễn biến",
      paragraphs: event.description ? [event.description] : [],
      children: event.children.map((c) => ({
        id: c.id,
        title: c.title,
        href: eventHref(c.slug),
        dateLabel: c.eventDateNote || summaryDateLabel(c),
      })),
    });
  }
  if (event.outcome) sections.push({ id: "ket-qua", title: "Kết quả & ý nghĩa", paragraphs: [event.outcome] });
  if (mentions.length) {
    sections.push({ id: "nhan-vat-dia-danh", title: "Nhân vật & địa danh", paragraphs: [], participants: mentions });
  }
  if (event.sources.length) sections.push({ id: "nguon", title: "Nguồn tham khảo", paragraphs: [], sources: event.sources });

  const { previous, next } = adjacent(event, allEvents);
  const primaryLocation = mentions.find((m) => m.type === "LOCATION" && m.isPrimary) ?? null;

  return {
    title: event.title,
    dateLabel: eventDateLabel(event),
    dateNote: event.eventDateNote,
    categoryLabel: EVENT_CATEGORY_LABELS[event.category as EventCategory] || event.category,
    periodName: event.period?.name ?? null,
    periodHref: event.period ? `${PUBLIC_ROUTE_PREFIX.PERIOD}/${event.period.slug}` : null,
    parent: event.parent ? { title: event.parent.title, href: eventHref(event.parent.slug) } : null,
    lead: event.summary,
    imageUrl: event.imageUrl,
    locationLabel: event.location ?? primaryLocation?.name ?? null,
    readMinutes: Math.max(1, Math.ceil(wordCount(event.summary, event.description, event.cause, event.outcome) / 200)),
    mentions,
    sections,
    previous,
    next,
  };
}
