import { cache } from 'react';
import { type LifeNodeRef } from '@/features/articles/person-life';
import type { ArticleMetadata } from '@/services/public/public-content.service';
import { fetchArticles, fetchCategories, fetchTimelines, type PublicArticleSummary, type PublicCategory, type PublicTimeline } from '@/services/public/public-content.service';
import { resolveCategoryKind, type ArticleKind } from '@/services/public/article-kind';
import { formatYear } from '@/utils/common';
import { ArticleKindEnum } from '@/constants/enums';
import type { PublicPeriodDto } from './landing.dto';

// ======================================================================
// Adapter Article / ArticleLink / Timeline → DTO cũ
// ======================================================================

export type EntityKind = ArticleKind;

/**
 * Làm sạch Article.metadata khi ĐỌC. JSONB không có schema ở DB: dữ liệu ghi thẳng (script nhập,
 * SQL tay) có thể sai kiểu (vd. `titles` là chuỗi thay vì mảng) — không được làm sập trang công khai.
 * Đường ghi chuẩn (API) đã chuẩn hoá ở backend/src/article/article-metadata.ts.
 */
export const asText = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

export const asList = (v: unknown): string[] | undefined => {
  if (Array.isArray(v)) {
    const list = v.map(asText).filter((s): s is string => Boolean(s));
    return list.length ? list : undefined;
  }
  const one = asText(v);
  return one ? [one] : undefined;
};

export const asNumber = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

export const asObject = (v: unknown): Record<string, unknown> | undefined =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;

export function sanitizeMetadata(raw: unknown): ArticleMetadata | null {
  const m = asObject(raw);
  if (!m) return null;
  const p = asObject(m.person);
  const s = asObject(m.site);
  const e = asObject(m.event);
  return {
    aliases: asList(m.aliases),
    sources: asList(m.sources),
    person: p && {
      titles: asList(p.titles),
      occupation: asText(p.occupation),
      roles: asList(p.roles),
      birthDateLabel: asText(p.birthDateLabel),
      deathDateLabel: asText(p.deathDateLabel),
      hometown: asText(p.hometown),
      backgroundAndYouth: asText(p.backgroundAndYouth),
      notableWorks: asList(p.notableWorks),
      legacyAndHonors: asText(p.legacyAndHonors),
      anecdotes: asList(p.anecdotes),
      famousQuote: asText(p.famousQuote),
      milestones: Array.isArray(p.milestones)
        ? p.milestones
            .map(asObject)
            .filter((x): x is Record<string, unknown> => Boolean(x && asNumber(x.year) && asText(x.title)))
            .map((x) => ({
              year: x.year as number,
              month: asNumber(x.month),
              day: asNumber(x.day),
              title: asText(x.title)!,
              note: asText(x.note),
            }))
        : undefined,
    },
    site: s && {
      address: asText(s.address),
      latitude: asNumber(s.latitude),
      longitude: asNumber(s.longitude),
      siteType: asText(s.siteType),
      recognizedYear: asText(s.recognizedYear),
      preservation: asText(s.preservation),
      statusNote: asText(s.statusNote),
      managingAgency: asText(s.managingAgency),
      architecturalStyle: asText(s.architecturalStyle),
      openingHours: asText(s.openingHours),
    },
    event: e && {
      dateNote: asText(e.dateNote),
      cause: asText(e.cause),
      outcome: asText(e.outcome),
      belligerents: asList(e.belligerents),
    },
  };
}

/** Một liên kết nhìn từ 1 bài: bài ở đầu kia + nhãn + chiều. */
export interface LinkView {
  other: PublicArticleSummary;
  label: string | null;
  note: string | null;
  /** OUTGOING: bài này khai báo · INCOMING: bài kia khai báo trỏ tới bài này. */
  direction: 'OUTGOING' | 'INCOMING';
}

export interface PublicGraph {
  categories: PublicCategory[];
  articles: PublicArticleSummary[];
  timelines: PublicTimeline[];
  periods: PublicPeriodDto[];
  bySlug: Map<string, PublicArticleSummary>;
  byId: Map<string, PublicArticleSummary>;
  kindOf: (article: { category: { id: string } | null } | null | undefined) => EntityKind;
  /** Chuyên mục con của "su-kien" mà bài viết thuộc về (= loại sự kiện), nếu có. */
  eventTypeOf: (article: PublicArticleSummary | undefined) => PublicCategory | undefined;
  periodSlugOf: (article: PublicArticleSummary) => string | null;
  /** Mốc timeline trỏ tới 1 bài (kèm dòng thời gian chứa mốc). */
  nodesOf: (articleSlug: string) => LifeNodeRef[];
  /** Mọi liên kết của 1 bài (2 chiều), chỉ giữa các bài đã xuất bản. */
  linksOf: (articleId: string) => LinkView[];
}

export function periodFromTimeline(t: PublicTimeline): PublicPeriodDto {
  const years = t.nodes.flatMap((n) => [n.year, n.endYear]).filter((y): y is number => typeof y === 'number');
  const start = years.length ? Math.min(...years) : 0;
  const end = years.length ? Math.max(...years) : null;
  const timeLabel = end !== null && end !== start ? `${formatYear(start)} – ${formatYear(end)}` : formatYear(start);
  return {
    id: t.id,
    parentId: null,
    slug: t.slug,
    name: t.title,
    timeLabel,
    startYear: start,
    endYear: end,
    description: t.description,
    coverImageUrl: t.coverImageUrl,
  };
}

export function buildBidirectionalLinks(
  articles: PublicArticleSummary[],
  byId: Map<string, PublicArticleSummary>,
): Map<string, LinkView[]> {
  const links = new Map<string, LinkView[]>();
  const pushLink = (id: string, view: LinkView) => links.set(id, [...(links.get(id) ?? []), view]);
  for (const a of articles) {
    for (const l of a.links ?? []) {
      const target = byId.get(l.targetId);
      if (!target) continue;
      pushLink(a.id, { other: target, label: l.label, note: l.note, direction: 'OUTGOING' });
      pushLink(target.id, { other: a, label: l.label, note: l.note, direction: 'INCOMING' });
    }
  }
  return links;
}

export function buildNodesByArticle(timelines: PublicTimeline[]): Map<string, LifeNodeRef[]> {
  const nodesByArticle = new Map<string, LifeNodeRef[]>();
  for (const t of timelines) {
    for (const n of t.nodes) {
      if (!n.article) continue;
      const ref: LifeNodeRef = { ...n, timeline: { id: t.id, slug: t.slug, title: t.title } };
      nodesByArticle.set(n.article.slug, [...(nodesByArticle.get(n.article.slug) ?? []), ref]);
    }
  }
  return nodesByArticle;
}

export function createPeriodSlugResolver(
  timelines: PublicTimeline[],
  links: Map<string, LinkView[]>,
): (a: PublicArticleSummary) => string | null {
  const nodeTimeline = new Map<string, string>();
  const topicTimeline = new Map<string, string>();
  for (const t of timelines) {
    if (t.topicId && !topicTimeline.has(t.topicId)) topicTimeline.set(t.topicId, t.slug);
    for (const n of t.nodes) {
      if (n.article && !nodeTimeline.has(n.article.slug)) nodeTimeline.set(n.article.slug, t.slug);
    }
  }

  return (a: PublicArticleSummary) => {
    const direct = nodeTimeline.get(a.slug);
    if (direct) return direct;
    for (const l of links.get(a.id) ?? []) {
      const viaLink = nodeTimeline.get(l.other.slug);
      if (viaLink) return viaLink;
    }
    return a.topicId ? topicTimeline.get(a.topicId) ?? null : null;
  };
}

/** Tải 1 lần mỗi request: chuyên mục + mọi bài viết (kèm liên kết, hồ sơ) + mọi dòng thời gian. */
export const loadGraph = cache(async (): Promise<PublicGraph> => {
  const [categories, rawArticles, timelines] = await Promise.all([
    fetchCategories(),
    fetchArticles({ limit: 200 }),
    fetchTimelines(),
  ]);
  const articles = rawArticles.map((a) => ({ ...a, metadata: sanitizeMetadata(a.metadata) }));
  const catById = new Map(categories.map((c) => [c.id, c]));
  const kindOf: PublicGraph['kindOf'] = (a) => resolveCategoryKind(categories, a?.category?.id);
  // Loại sự kiện = chuyên mục con (có cha) thuộc loại EVENT.
  const eventTypeOf: PublicGraph['eventTypeOf'] = (a) => {
    const cat = a?.category ? catById.get(a.category.id) : undefined;
    return cat?.parentId && resolveCategoryKind(categories, cat.id) === ArticleKindEnum.EVENT ? cat : undefined;
  };

  const bySlug = new Map(articles.map((a) => [a.slug, a]));
  const byId = new Map(articles.map((a) => [a.id, a]));

  const links = buildBidirectionalLinks(articles, byId);
  const nodesByArticle = buildNodesByArticle(timelines);
  const periodSlugOf = createPeriodSlugResolver(timelines, links);

  return {
    categories,
    articles,
    timelines,
    periods: timelines.map(periodFromTimeline),
    bySlug,
    byId,
    kindOf,
    eventTypeOf,
    periodSlugOf,
    linksOf: (id) => links.get(id) ?? [],
    nodesOf: (articleSlug) => nodesByArticle.get(articleSlug) ?? [],
  };
});
