import { cache } from 'react';
import {
  fetchArticles,
  fetchCategories,
  fetchTimelines,
  fetchTopics,
  findRootCategory,
  SYSTEM_CATEGORY_ROOT_SLUGS,
  type ArticleMetadata,
  type PublicArticleSummary,
  type PublicCategory,
  type PublicTimeline,
  type PublicTimelineNode,
  type PublicTopicRef,
} from '@/services/public/public-content.service';
import type { PublicPeriodDto } from './landing.dto';

export interface LifeNodeRef {
  id: string;
  title: string;
  description?: string | null;
  dateText: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  endYear: number | null;
  timeline: { id: string; slug: string; title: string };
}

/**
 * Làm sạch Article.metadata khi ĐỌC. JSONB không có schema ở DB: dữ liệu ghi thẳng (script nhập,
 * SQL tay) có thể sai kiểu (vd. `titles` là chuỗi thay vì mảng) — không được làm sập trang công khai.
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
  return {
    aliases: asList(m.aliases),
    sources: asList(m.sources),
    person: p && {
      titles: asList(p.titles),
      roles: asList(p.roles),
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
      siteType: asText(s.siteType),
      recognizedYear: asText(s.recognizedYear),
      preservation: asText(s.preservation),
      statusNote: asText(s.statusNote),
      managingAgency: asText(s.managingAgency),
      architecturalStyle: asText(s.architecturalStyle),
    },
  };
}

export interface PublicGraph {
  categories: PublicCategory[];
  articles: PublicArticleSummary[];
  timelines: PublicTimeline[];
  periods: PublicPeriodDto[];
  topics: PublicTopicRef[];
  bySlug: Map<string, PublicArticleSummary>;
  byId: Map<string, PublicArticleSummary>;
  /** Slug chuyên mục gốc của bài viết (`su-kien`, `nhan-vat`, `di-tich`, `trieu-dai`, `tac-pham-tu-lieu`). */
  rootCategorySlugOf: (article: { category: { id: string; slug?: string } | null } | null | undefined) => string;
  /** Chuyên mục con của "su-kien" mà bài viết thuộc về (= loại sự kiện), nếu có. */
  eventTypeOf: (article: PublicArticleSummary | undefined) => PublicCategory | undefined;
  periodSlugOf: (article: PublicArticleSummary) => string | null;
  rootTopicOf: (topicId: string | null | undefined) => PublicTopicRef | undefined;
  /** Tập hợp đệ quy tất cả `topicId` thuộc nhánh Topic này (chính nó + con + cháu... N cấp). */
  descendantTopicIdsOf: (rootTopicId: string | null | undefined) => Set<string>;
  /** Mốc timeline trỏ tới 1 bài (kèm dòng thời gian chứa mốc). */
  nodesOf: (articleSlug: string) => LifeNodeRef[];
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

/** Tập hợp đệ quy mọi `topicId` con/cháu của `rootTopicId` (gồm cả `rootTopicId`). */
export function collectDescendantTopicIds(
  topics: PublicTopicRef[],
  rootTopicId: string | null | undefined,
): Set<string> {
  if (!rootTopicId) return new Set<string>();
  const childrenByParent = new Map<string, string[]>();
  for (const t of topics) {
    if (!t.parentId) continue;
    const list = childrenByParent.get(t.parentId) ?? [];
    list.push(t.id);
    childrenByParent.set(t.parentId, list);
  }
  const result = new Set<string>();
  const stack = [rootTopicId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    for (const childId of childrenByParent.get(id) ?? []) {
      if (!result.has(childId)) stack.push(childId);
    }
  }
  return result;
}

/**
 * Tìm Timeline gần nhất trên cây tổ tiên Topic (Topic con -> Topic cha -> Topic ông...).
 */
export function findNearestTimelinePeriodId(
  topicId: string | null | undefined,
  topicById: Map<string, PublicTopicRef>,
  periodIdByTopicId: Map<string, string>,
  excludeTopicId?: string | null,
): string | null {
  let cur = topicId ? topicById.get(topicId) : undefined;
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    if (cur.id !== excludeTopicId && periodIdByTopicId.has(cur.id)) {
      return periodIdByTopicId.get(cur.id)!;
    }
    cur = cur.parentId ? topicById.get(cur.parentId) : undefined;
  }
  return null;
}

export function comparePeriodOrder(
  a: Pick<PublicPeriodDto, 'displayOrder' | 'name'>,
  b: Pick<PublicPeriodDto, 'displayOrder' | 'name'>,
): number {
  const orderDiff = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
  if (orderDiff !== 0) return orderDiff;
  return a.name.localeCompare(b.name, 'vi');
}

export function siblingPeriods(period: PublicPeriodDto, all: PublicPeriodDto[]) {
  const siblings = all
    .filter((p) => (period.parentId ? p.parentId === period.parentId : !p.parentId))
    .sort(comparePeriodOrder);
  const i = siblings.findIndex((p) => p.id === period.id);
  return {
    prev: i > 0 ? siblings[i - 1] : null,
    next: i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : null,
  };
}

/**
 * Period cha/con suy đệ quy theo cây Topic (`Timeline.topic.parentId` leo lên tổ tiên gần nhất có Timeline),
 * sắp xếp hoàn toàn theo `displayOrder` CMS và lấy nhãn phụ `timeLabel` từ `topic.eyebrow` (không tự quét năm).
 */
export function buildPeriods(timelines: PublicTimeline[], topics: PublicTopicRef[] = []): PublicPeriodDto[] {
  const topicById = new Map<string, PublicTopicRef>(topics.map((t) => [t.id, t]));
  for (const t of timelines) {
    if (t.topic && !topicById.has(t.topic.id)) {
      topicById.set(t.topic.id, t.topic);
    }
  }
  const periodIdByTopicId = new Map(
    timelines.filter((t): t is PublicTimeline & { topicId: string } => Boolean(t.topicId)).map((t) => [t.topicId, t.id]),
  );
  return timelines
    .map((t) => {
      const linkedTopic = t.topic ?? (t.topicId ? topicById.get(t.topicId) : undefined);
      const parentTopicId = linkedTopic?.parentId ?? null;
      const parentId = findNearestTimelinePeriodId(parentTopicId, topicById, periodIdByTopicId, t.topicId);
      return {
        ...periodFromTimeline(t, linkedTopic?.eyebrow),
        parentId,
      };
    })
    .sort(comparePeriodOrder);
}

export function periodFromTimeline(t: PublicTimeline, fallbackEyebrow?: string | null): PublicPeriodDto {
  const eyebrow = t.topic?.eyebrow ?? fallbackEyebrow ?? null;
  return {
    id: t.id,
    parentId: null,
    slug: t.slug,
    name: t.title,
    timeLabel: eyebrow?.trim() ?? '',
    displayOrder: t.displayOrder,
    startYear: 0,
    endYear: null,
    description: t.description,
    coverImageUrl: t.coverImageUrl,
    totalArticleCount: t.totalTopicArticles,
  };
}

/** Lấy mọi slug bài viết gắn với 1 mốc Timeline (gồm cả `node.articles` N-N và `node.article` 1-N). */
export function extractNodeArticleSlugs(node: PublicTimelineNode): string[] {
  const slugs = new Set<string>();
  for (const a of node.articles ?? []) {
    if (a?.slug) slugs.add(a.slug);
  }
  if (node.article?.slug) slugs.add(node.article.slug);
  return [...slugs];
}

export function buildNodesByArticle(timelines: PublicTimeline[]): Map<string, LifeNodeRef[]> {
  const nodesByArticle = new Map<string, LifeNodeRef[]>();
  for (const t of timelines) {
    for (const n of t.nodes) {
      const slugs = extractNodeArticleSlugs(n);
      if (slugs.length === 0) continue;
      const ref: LifeNodeRef = { ...n, timeline: { id: t.id, slug: t.slug, title: t.title } };
      for (const slug of slugs) {
        nodesByArticle.set(slug, [...(nodesByArticle.get(slug) ?? []), ref]);
      }
    }
  }
  return nodesByArticle;
}

/**
 * Thời kỳ của 1 bài = Timeline gắn với Topic của bài, hoặc leo đệ quy lên Topic cha/ông gần nhất có Timeline.
 */
export function createPeriodSlugResolver(
  timelines: PublicTimeline[],
  topics: PublicTopicRef[] = [],
): (a: PublicArticleSummary) => string | null {
  const topicById = new Map<string, PublicTopicRef>(topics.map((t) => [t.id, t]));
  const topicTimeline = new Map<string, string>();
  for (const t of timelines) {
    if (t.topic && !topicById.has(t.topic.id)) topicById.set(t.topic.id, t.topic);
    if (t.topicId && !topicTimeline.has(t.topicId)) topicTimeline.set(t.topicId, t.slug);
  }

  return (a: PublicArticleSummary) => {
    let curId = a.topicId;
    const seen = new Set<string>();
    while (curId && !seen.has(curId)) {
      seen.add(curId);
      const hit = topicTimeline.get(curId);
      if (hit) return hit;
      curId = topicById.get(curId)?.parentId ?? null;
    }
    return null;
  };
}

/** Tải 1 lần mỗi request: chuyên mục + mọi bài viết + dòng thời gian + Topic. */
export const loadGraph = cache(async (): Promise<PublicGraph> => {
  const [categories, rawArticles, timelines, topics] = await Promise.all([
    fetchCategories(),
    fetchArticles({ limit: 200 }),
    fetchTimelines(),
    fetchTopics(),
  ]);
  const articles = rawArticles.map((a) => ({ ...a, metadata: sanitizeMetadata(a.metadata) }));
  const catById = new Map(categories.map((c) => [c.id, c]));
  const rootCategorySlugOf: PublicGraph['rootCategorySlugOf'] = (a) =>
    findRootCategory(categories, a?.category?.id)?.slug ?? a?.category?.slug ?? '';

  // Loại sự kiện = chuyên mục con (có cha) thuộc nhánh Sự kiện (`su-kien`).
  const eventTypeOf: PublicGraph['eventTypeOf'] = (a) => {
    const cat = a?.category ? catById.get(a.category.id) : undefined;
    return cat?.parentId && rootCategorySlugOf(a) === SYSTEM_CATEGORY_ROOT_SLUGS.EVENT ? cat : undefined;
  };

  const bySlug = new Map(articles.map((a) => [a.slug, a]));
  const byId = new Map(articles.map((a) => [a.id, a]));

  const nodesByArticle = buildNodesByArticle(timelines);
  const periodSlugOf = createPeriodSlugResolver(timelines, topics);

  return {
    categories,
    articles,
    timelines,
    periods: buildPeriods(timelines, topics),
    topics,
    bySlug,
    byId,
    rootCategorySlugOf,
    eventTypeOf,
    periodSlugOf,
    rootTopicOf: (topicId) => findRootTopic(topics, topicId),
    descendantTopicIdsOf: (rootTopicId) => collectDescendantTopicIds(topics, rootTopicId),
    nodesOf: (articleSlug) => nodesByArticle.get(articleSlug) ?? [],
  };
});
