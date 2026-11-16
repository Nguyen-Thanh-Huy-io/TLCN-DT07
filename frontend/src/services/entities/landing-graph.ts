import { cache } from 'react';
import { type LifeNodeRef } from '@/features/articles/person-life';
import type { ArticleMetadata } from '@/services/public/public-content.service';
import { fetchArticles, fetchCategories, fetchTimelines, fetchTopics, type PublicArticleSummary, type PublicCategory, type PublicTimeline, type PublicTopicRef } from '@/services/public/public-content.service';
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
  topics: PublicTopicRef[];
  bySlug: Map<string, PublicArticleSummary>;
  byId: Map<string, PublicArticleSummary>;
  kindOf: (article: { category: { id: string } | null } | null | undefined) => EntityKind;
  /** Chuyên mục con của "su-kien" mà bài viết thuộc về (= loại sự kiện), nếu có. */
  eventTypeOf: (article: PublicArticleSummary | undefined) => PublicCategory | undefined;
  periodSlugOf: (article: PublicArticleSummary) => string | null;
  /** Topic gốc (đi hết lên tổ tiên) của 1 topicId — dùng nhóm bài viết theo Chủ đề ở trang Khám phá. */
  rootTopicOf: (topicId: string | null | undefined) => PublicTopicRef | undefined;
  /** Mốc timeline trỏ tới 1 bài (kèm dòng thời gian chứa mốc). */
  nodesOf: (articleSlug: string) => LifeNodeRef[];
  /** Mọi liên kết của 1 bài (2 chiều), chỉ giữa các bài đã xuất bản. */
  linksOf: (articleId: string) => LinkView[];
}

/** Đi hết lên tổ tiên của 1 Topic (chặn vòng lặp nếu dữ liệu lỗi). */
export function findRootTopic(
  topics: PublicTopicRef[],
  topicId: string | null | undefined,
): PublicTopicRef | undefined {
  const byId = new Map(topics.map((t) => [t.id, t]));
  let cur = topicId ? byId.get(topicId) : undefined;
  const seen = new Set<string>();
  while (cur?.parentId && byId.has(cur.parentId) && !seen.has(cur.id)) {
    seen.add(cur.id);
    cur = byId.get(cur.parentId);
  }
  return cur;
}

/**
 * Period cha/con suy theo Topic cha/con của 2 Timeline (`Timeline.topic.parentId`) — Timeline
 * chưa gắn Topic, hoặc Topic cha chưa có Timeline riêng, thì period đó vẫn là gốc (`parentId: null`).
 */
export function buildPeriods(timelines: PublicTimeline[]): PublicPeriodDto[] {
  const periodIdByTopicId = new Map(
    timelines.filter((t): t is PublicTimeline & { topicId: string } => Boolean(t.topicId)).map((t) => [t.topicId, t.id]),
  );
  return timelines.map((t) => {
    const parentTopicId = t.topic?.parentId ?? null;
    return {
      ...periodFromTimeline(t),
      parentId: parentTopicId ? (periodIdByTopicId.get(parentTopicId) ?? null) : null,
    };
  });
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

/** Thời kỳ của 1 bài = Timeline cùng `topicId` với bài (Timeline gắn Topic sẵn, không suy qua mốc/liên kết). */
export function createPeriodSlugResolver(
  timelines: PublicTimeline[],
): (a: PublicArticleSummary) => string | null {
  const topicTimeline = new Map<string, string>();
  for (const t of timelines) {
    if (t.topicId && !topicTimeline.has(t.topicId)) topicTimeline.set(t.topicId, t.slug);
  }

  return (a: PublicArticleSummary) => (a.topicId ? topicTimeline.get(a.topicId) ?? null : null);
}

/** Tải 1 lần mỗi request: chuyên mục + mọi bài viết (kèm liên kết, hồ sơ) + dòng thời gian + Topic. */
export const loadGraph = cache(async (): Promise<PublicGraph> => {
  const [categories, rawArticles, timelines, topics] = await Promise.all([
    fetchCategories(),
    fetchArticles({ limit: 200 }),
    fetchTimelines(),
    fetchTopics(),
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
  const periodSlugOf = createPeriodSlugResolver(timelines);

  return {
    categories,
    articles,
    timelines,
    periods: buildPeriods(timelines),
    topics,
    bySlug,
    byId,
    kindOf,
    eventTypeOf,
    periodSlugOf,
    rootTopicOf: (topicId) => findRootTopic(topics, topicId),
    linksOf: (id) => links.get(id) ?? [],
    nodesOf: (articleSlug) => nodesByArticle.get(articleSlug) ?? [],
  };
});

/** Id khối dùng cho các mục chưa gắn Chủ đề nào — không trộn vào khối Topic thật. */
export const NO_TOPIC_ID = '__no-topic__';

export interface TopicLeafGroup<T> {
  id: string;
  slug: string | null;
  name: string;
  items: T[];
}

export interface TopicBlock<T> {
  id: string;
  slug: string | null;
  name: string;
  leaves: TopicLeafGroup<T>[];
}

/**
 * Nhóm danh sách bài viết (nhân vật/sự kiện...) theo cây Topic: khối lớn = Topic gốc (đi hết lên
 * tổ tiên qua `rootTopicOf`), khối con = Topic trực tiếp của từng bài. Bài chưa gắn Topic gom vào
 * 1 khối "Khác" riêng, không trộn lẫn các khối Topic thật.
 */
export function groupByTopic<T>(
  items: T[],
  topicIdOf: (item: T) => string | null | undefined,
  g: Pick<PublicGraph, 'topics' | 'rootTopicOf'>,
): TopicBlock<T>[] {
  const topicById = new Map(g.topics.map((t) => [t.id, t]));
  const leavesByTopic = new Map<string, T[]>();
  for (const item of items) {
    const key = topicIdOf(item) ?? NO_TOPIC_ID;
    const list = leavesByTopic.get(key) ?? [];
    list.push(item);
    leavesByTopic.set(key, list);
  }

  const blocks = new Map<string, TopicBlock<T>>();
  for (const [topicId, leafItems] of leavesByTopic) {
    const leafTopic = topicId !== NO_TOPIC_ID ? topicById.get(topicId) : undefined;
    const root = topicId !== NO_TOPIC_ID ? g.rootTopicOf(topicId) : undefined;
    const blockId = root?.id ?? NO_TOPIC_ID;
    const block = blocks.get(blockId) ?? { id: blockId, slug: root?.slug ?? null, name: root?.name ?? 'Khác', leaves: [] };
    block.leaves.push({ id: topicId, slug: leafTopic?.slug ?? null, name: leafTopic?.name ?? 'Khác', items: leafItems });
    blocks.set(blockId, block);
  }

  // Giữ đúng thứ tự Topic đã cấu hình (displayOrder từ BE) thay vì thứ tự xuất hiện ngẫu nhiên
  // trong items; khối/chủ đề con "Khác" (chưa gắn Topic) luôn xuống cuối.
  const orderIndex = new Map(g.topics.map((t, i) => [t.id, i]));
  const byOrder = (idA: string, idB: string) => (orderIndex.get(idA) ?? Infinity) - (orderIndex.get(idB) ?? Infinity);
  for (const block of blocks.values()) block.leaves.sort((a, b) => byOrder(a.id, b.id));
  return [...blocks.values()].sort((a, b) => byOrder(a.id, b.id));
}
