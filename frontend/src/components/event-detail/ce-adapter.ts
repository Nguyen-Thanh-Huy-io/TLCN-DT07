import {
  PUBLIC_ROUTE_PREFIX,
  type PublicEventDetailDto,
  type PublicEventSummaryDto,
} from "@/services/entities/landing.service";
import {
  EVENT_RELATION_TYPE_LABELS,
} from "@/constants/enums";
import {
  type ArticleSection,
  type EntityMention,
  type EventReaderModel,
  type EventRelationLink,
  MentionType,
  RelationDirection,
} from "./ce-types";
import type { TaxonomyTermItem } from "@/services/entities/taxonomy.service";
import { eventCategoryLabel, eventRoleLabel, relationLabel } from "@/features/taxonomy/taxonomy-labels";

/** Giá trị danh mục dùng chung để gắn nhãn (loại sự kiện, vai trò); thiếu thì dùng nhãn cũ. */
export interface EventReaderTaxonomy {
  categories?: TaxonomyTermItem[];
  roles?: TaxonomyTermItem[];
  /** Nhóm EVENT_RELATION — nhãn chiều ngược cho quan hệ hướng tới sự kiện này. */
  relations?: TaxonomyTermItem[];
}

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

const PARTICIPANT_ROLE_CODE = "PARTICIPANT";

function buildMentions(event: PublicEventDetailDto, roleTerms: TaxonomyTermItem[]): EntityMention[] {
  const roles = new Map(event.participants.map((p) => [p.entityId, p]));
  // Không có mô tả riêng thì hiện tên vai trò chuẩn (trừ "Tham gia" chung chung).
  const roleName = (id: string) => {
    const role = roles.get(id)?.role;
    return role && role !== PARTICIPANT_ROLE_CODE ? eventRoleLabel(roleTerms, role) : null;
  };
  const figures: EntityMention[] = event.figures.map((f) => ({
    id: f.id,
    type: MentionType.FIGURE,
    name: f.name,
    roleLabel: roles.get(f.id)?.roleLabel ?? roleName(f.id) ?? f.tagline,
    summary: f.tagline || f.description,
    imageUrl: f.imageUrl,
    href: `/nhan-vat?nv=${encodeURIComponent(f.slug)}`,
    isPrimary: roles.get(f.id)?.isPrimary ?? false,
  }));
  const locations: EntityMention[] = event.locations.map((l) => ({
    id: l.id,
    type: MentionType.LOCATION,
    name: l.name,
    roleLabel: roles.get(l.id)?.roleLabel ?? roleName(l.id) ?? l.address,
    summary: l.historicalSignificance,
    imageUrl: l.imageUrl ?? null,
    href: `/di-tich/${l.slug}`,
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

function splitParagraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function buildRelationLinks(event: PublicEventDetailDto, relationTerms: TaxonomyTermItem[]): EventRelationLink[] {
  const incoming: EventRelationLink[] = (event.incomingRelations || []).map((r) => {
    // Quan hệ hướng tới sự kiện này: đọc theo nhãn chiều ngược của danh mục.
    const typeLabel = relationLabel(relationTerms, r.relationType, RelationDirection.INCOMING, EVENT_RELATION_TYPE_LABELS);
    return {
      id: r.event.id,
      title: r.event.title,
      href: eventHref(r.event.slug),
      dateLabel: formatYear(r.event.startYear),
      relationType: r.relationType,
      relationLabel: typeLabel,
      description: r.description,
      direction: RelationDirection.INCOMING,
    };
  });

  const outgoing: EventRelationLink[] = (event.outgoingRelations || []).map((r) => {
    const typeLabel = relationLabel(relationTerms, r.relationType, RelationDirection.OUTGOING, EVENT_RELATION_TYPE_LABELS);
    return {
      id: r.event.id,
      title: r.event.title,
      href: eventHref(r.event.slug),
      dateLabel: formatYear(r.event.startYear),
      relationType: r.relationType,
      relationLabel: typeLabel,
      description: r.description,
      direction: RelationDirection.OUTGOING,
    };
  });

  return [...incoming, ...outgoing];
}

export function buildEventReaderModel(
  event: PublicEventDetailDto,
  allEvents: PublicEventSummaryDto[],
  taxonomy: EventReaderTaxonomy = {},
): EventReaderModel {
  const mentions = buildMentions(event, taxonomy.roles ?? []);
  const sections: ArticleSection[] = [];
  const causeParagraphs = splitParagraphs(event.cause);
  const descParagraphs = splitParagraphs(event.description);
  const outcomeParagraphs = splitParagraphs(event.outcome);
  const relationLinks = buildRelationLinks(event, taxonomy.relations ?? []);

  if (causeParagraphs.length) {
    sections.push({
      id: "boi-canh",
      title: "Bối cảnh & nguyên nhân",
      paragraphs: causeParagraphs,
    });
  }

  if (descParagraphs.length || event.children.length) {
    sections.push({
      id: "dien-bien",
      title: "Diễn biến lịch sử",
      paragraphs: descParagraphs,
      children: event.children.map((c) => ({
        id: c.id,
        title: c.title,
        href: eventHref(c.slug),
        dateLabel: c.eventDateNote || summaryDateLabel(c),
      })),
    });
  }

  if (outcomeParagraphs.length) {
    sections.push({
      id: "ket-qua",
      title: "Kết quả & ý nghĩa lịch sử",
      paragraphs: outcomeParagraphs,
    });
  }

  if (relationLinks.length) {
    sections.push({
      id: "quan-he-nhan-qua",
      title: "Dòng chảy lịch sử & Mối liên hệ nhân – quả",
      paragraphs: [
        "Sự kiện này nằm trong chuỗi liên kết nhân – quả của dòng chảy lịch sử dân tộc, có tác động qua lại mật thiết với các mốc biến cố trước và sau:",
      ],
      relations: relationLinks,
    });
  }

  if (mentions.length) {
    sections.push({
      id: "nhan-vat-dia-danh",
      title: "Nhân vật & địa danh lịch sử",
      paragraphs: [],
      participants: mentions,
    });
  }

  if (event.sources.length) {
    sections.push({
      id: "nguon",
      title: "Tài liệu & nguồn tham khảo",
      paragraphs: [],
      sources: event.sources,
    });
  }

  const { previous, next } = adjacent(event, allEvents);
  const primaryLocation = mentions.find((m) => m.type === MentionType.LOCATION && m.isPrimary) ?? null;

  return {
    title: event.title,
    dateLabel: eventDateLabel(event),
    dateNote: event.eventDateNote,
    categoryLabel: eventCategoryLabel(taxonomy.categories ?? [], event),
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
