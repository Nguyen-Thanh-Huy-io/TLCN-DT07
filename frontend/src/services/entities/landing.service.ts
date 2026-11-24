/**
 * Dữ liệu cho GIAO DIỆN CÔNG KHAI (trang chủ, /dong-thoi-gian, /bai-viet, /giai-doan, trang đọc chi tiết):
 * - Phân loại bài viết trực tiếp theo `category.slug` và chuyên mục gốc (`findRootCategory`).
 * - Thời kỳ / Giai đoạn và dòng sự kiện gom tự động theo cây đệ quy Chủ đề (`Topic cha > Topic con > Topic cháu`)
 *   kết hợp các bài gắn trong `TimelineNodeArticle`.
 */

import {
  fetchArticle,
  SYSTEM_CATEGORY_ROOT_SLUGS,
  type PublicArticleSummary,
  type PublicTimelineNode,
} from '@/services/public/public-content.service';
import { INTERNAL_API_BASE_URL } from '@/constants/api-url';
import { formatYear } from '@/utils/common';
import type {
  PublicPeriodDto,
  PublicSubPeriodDto,
  PublicFigureDto,
  PublicLocationSummaryDto,
  PublicEventSummaryDto,
  PublicPeriodDetailDto,
  PublicFigureProfileDto,
  PublicEntityDetailDto,
  PublicArticleLibraryItemDto,
} from './landing.dto';
import { extractNodeArticleSlugs, loadGraph, sanitizeMetadata, type PublicGraph } from './landing-graph';

const DEFAULT_LOCATION_TYPE_LABELS: Record<string, string> = {
  ANCIENT_CAPITAL: 'Cố đô',
  CITADEL: 'Thành lũy',
  PALACE: 'Cung điện',
  BATTLEFIELD: 'Chiến trường',
  RESISTANCE_BASE: 'Căn cứ kháng chiến',
  TEMPLE: 'Đền miếu',
  ARCHAEOLOGICAL_SITE: 'Di chỉ khảo cổ',
  MONUMENT: 'Di tích lịch sử',
  OTHER: 'Khác',
};

const siteTypeLabelOf = (siteType: string | undefined): string | undefined =>
  siteType ? DEFAULT_LOCATION_TYPE_LABELS[siteType] ?? siteType : undefined;

const API_URL = INTERNAL_API_BASE_URL;

function toFigure(a: PublicArticleSummary): PublicFigureDto {
  return {
    id: a.id,
    slug: a.slug,
    name: a.title,
    tagline: a.summary,
    description: a.summary,
    imageUrl: a.coverImageUrl,
    birthYear: a.startYear,
    deathYear: a.endYear,
    topicId: a.topicId,
  };
}

function toLocation(g: PublicGraph, a: PublicArticleSummary): PublicLocationSummaryDto {
  const site = a.metadata?.site ?? {};
  return {
    id: a.id,
    slug: a.slug,
    name: a.title,
    address: site.address ?? null,
    historicalSignificance: a.summary,
    imageUrl: a.coverImageUrl,
    siteType: site.siteType,
    siteTypeLabel: siteTypeLabelOf(site.siteType),
    constructionLabel: a.dateLabel,
    periodSlug: g.periodSlugOf(a),
    ancientNames: a.metadata?.aliases ?? [],
    preservationStatus: site.statusNote ?? null,
    preservationCategory: site.preservation ?? null,
    statusNote: site.statusNote ?? null,
    managingUnit: site.managingAgency ?? null,
    recognizedYear: site.recognizedYear ?? null,
    architecturalStyle: site.architecturalStyle ?? null,
  };
}

function isYearWithinSpan(a: PublicArticleSummary, targetYear: number | null): boolean {
  if (targetYear === null || a.startYear === null) return true;
  return a.startYear <= targetYear && (a.endYear === null || a.endYear >= targetYear);
}

function collectTopicMatchedEntities(
  g: PublicGraph,
  topicIds: Set<string>,
  eventYear: number | null,
  figureMap: Map<string, PublicFigureDto>,
  locationMap: Map<string, PublicLocationSummaryDto>,
) {
  if (topicIds.size === 0) return;
  for (const a of g.articles) {
    if (!a.topicId || !topicIds.has(a.topicId)) continue;
    const rootSlug = g.rootCategorySlugOf(a);
    if (rootSlug === SYSTEM_CATEGORY_ROOT_SLUGS.PERSON && !figureMap.has(a.id) && isYearWithinSpan(a, eventYear)) {
      figureMap.set(a.id, toFigure(a));
    } else if (rootSlug === SYSTEM_CATEGORY_ROOT_SLUGS.LOCATION && !locationMap.has(a.id)) {
      locationMap.set(a.id, toLocation(g, a));
    }
  }
}

/** Trích xuất các bài viết gắn với 1 mốc Timeline (qua `TimelineNodeArticle` + cùng `topicId`). */
function extractNodeEntities(g: PublicGraph, node: PublicTimelineNode, timelineTopicId: string | null) {
  const nodeArticles = extractNodeArticleSlugs(node)
    .map((slug) => g.bySlug.get(slug))
    .filter((a): a is PublicArticleSummary => Boolean(a));

  const primaryArticle =
    nodeArticles.find((a) => g.rootCategorySlugOf(a) === SYSTEM_CATEGORY_ROOT_SLUGS.EVENT) ??
    nodeArticles[0] ??
    (node.article ? g.bySlug.get(node.article.slug) : undefined);

  const topicIds = g.descendantTopicIdsOf(primaryArticle?.topicId ?? timelineTopicId);
  const figureMap = new Map<string, PublicFigureDto>();
  const locationMap = new Map<string, PublicLocationSummaryDto>();

  for (const a of nodeArticles) {
    const rootSlug = g.rootCategorySlugOf(a);
    if (rootSlug === SYSTEM_CATEGORY_ROOT_SLUGS.PERSON) figureMap.set(a.id, toFigure(a));
    if (rootSlug === SYSTEM_CATEGORY_ROOT_SLUGS.LOCATION) locationMap.set(a.id, toLocation(g, a));
  }

  collectTopicMatchedEntities(g, topicIds, node.year ?? primaryArticle?.startYear ?? null, figureMap, locationMap);

  const locations = [...locationMap.values()];
  return {
    primaryArticle,
    nodeArticles,
    figures: [...figureMap.values()],
    locations,
    location: locations[0]?.name ?? null,
  };
}

function resolveArticleCategoryMeta(g: PublicGraph, a?: PublicArticleSummary) {
  const type = g.eventTypeOf(a);
  return {
    category: type?.name ?? a?.category?.name ?? a?.category?.slug ?? SYSTEM_CATEGORY_ROOT_SLUGS.EVENT,
    categoryIds: type ? [type.id] : a?.category ? [a.category.id] : [],
  };
}

function buildAdditionalNodeArticleEvents(
  g: PublicGraph,
  nodeId: string,
  periodSlug: string,
  timelineTopicId: string | null,
  baseYear: number,
  primaryId: string | undefined,
  nodeArticles: PublicArticleSummary[],
): PublicEventSummaryDto[] {
  return nodeArticles
    .filter((a) => a.id !== primaryId)
    .map((a) => ({
      id: `${nodeId}-${a.id}`,
      slug: a.slug,
      title: a.title,
      startYear: a.startYear ?? baseYear,
      endYear: a.endYear,
      eventDateNote: a.dateText ?? a.dateLabel,
      description: a.summary,
      imageUrl: a.coverImageUrl,
      ...resolveArticleCategoryMeta(g, a),
      periodSlug,
      topicId: a.topicId ?? timelineTopicId ?? null,
      figures: [],
      locations: [],
      location: null,
    }));
}

function buildEventsFromTimelines(g: PublicGraph, covered: Set<string>): PublicEventSummaryDto[] {
  const events: PublicEventSummaryDto[] = [];
  for (const t of g.timelines) {
    const period = g.periods.find((p) => p.id === t.id);
    for (const node of t.nodes) {
      const { primaryArticle, nodeArticles, figures, locations, location } = extractNodeEntities(g, node, t.topicId);
      for (const a of nodeArticles) covered.add(a.slug);
      if (primaryArticle) covered.add(primaryArticle.slug);
      const baseYear = node.year ?? primaryArticle?.startYear ?? period?.startYear ?? 0;

      events.push({
        id: node.id,
        slug: primaryArticle?.slug ?? node.article?.slug ?? null,
        title: node.title,
        startYear: baseYear,
        endYear: node.endYear ?? primaryArticle?.endYear,
        eventDateNote: node.dateText ?? (node.month ? node.dateLabel : null) ?? primaryArticle?.dateText ?? null,
        description: node.description ?? primaryArticle?.summary ?? null,
        imageUrl: node.imageUrl ?? primaryArticle?.coverImageUrl ?? null,
        ...resolveArticleCategoryMeta(g, primaryArticle),
        periodSlug: t.slug,
        topicId: primaryArticle?.topicId ?? t.topicId ?? null,
        figures,
        locations,
        location,
      });

      events.push(
        ...buildAdditionalNodeArticleEvents(g, node.id, t.slug, t.topicId, baseYear, primaryArticle?.id, nodeArticles),
      );
    }
  }
  return events;
}

function buildEventsFromUncoveredArticles(g: PublicGraph, covered: Set<string>): PublicEventSummaryDto[] {
  const events: PublicEventSummaryDto[] = [];
  for (const a of g.articles) {
    if (covered.has(a.slug) || a.startYear === null) {
      continue;
    }
    const periodSlug = g.periodSlugOf(a);
    // Cho phép mọi bài viết có năm bắt đầu và thuộc nhánh Topic của Timeline (hoặc thuộc chuyên mục Sự kiện) hiển thị trên trục
    if (!periodSlug && g.rootCategorySlugOf(a) !== SYSTEM_CATEGORY_ROOT_SLUGS.EVENT) {
      continue;
    }
    const type = g.eventTypeOf(a);
    const topicIds = g.descendantTopicIdsOf(a.topicId);
    const sameTopicArticles = a.topicId ? g.articles.filter((other) => Boolean(other.topicId && topicIds.has(other.topicId))) : [];
    const figures = sameTopicArticles
      .filter((other) => g.rootCategorySlugOf(other) === SYSTEM_CATEGORY_ROOT_SLUGS.PERSON)
      .map(toFigure);
    const locations = sameTopicArticles
      .filter((other) => g.rootCategorySlugOf(other) === SYSTEM_CATEGORY_ROOT_SLUGS.LOCATION)
      .map((other) => toLocation(g, other));

    events.push({
      id: a.id,
      slug: a.slug,
      title: a.title,
      startYear: a.startYear,
      endYear: a.endYear,
      eventDateNote: a.dateText,
      description: a.summary,
      imageUrl: a.coverImageUrl,
      category: type?.name ?? a.category?.name ?? a.category?.slug ?? SYSTEM_CATEGORY_ROOT_SLUGS.EVENT,
      categoryIds: type ? [type.id] : a.category ? [a.category.id] : [],
      periodSlug,
      topicId: a.topicId,
      figures,
      locations,
      location: locations[0]?.name ?? null,
    });
  }
  return events;
}

/** Mọi "sự kiện": mốc của các timeline + bài Sự kiện (kể cả bài gắn qua cây Topic đệ quy). */
function buildEvents(g: PublicGraph): PublicEventSummaryDto[] {
  const covered = new Set<string>();
  const events: PublicEventSummaryDto[] = [
    ...buildEventsFromTimelines(g, covered),
    ...buildEventsFromUncoveredArticles(g, covered),
  ];
  return events.sort((x, y) => x.startYear - y.startYear);
}

function toFigureProfile(
  g: PublicGraph,
  a: PublicArticleSummary,
  events: PublicEventSummaryDto[],
): PublicFigureProfileDto {
  const person = a.metadata?.person ?? {};
  const topicIds = g.descendantTopicIdsOf(a.topicId);
  const relatedEvents = events.filter(
    (e) =>
      e.figures.some((f) => f.id === a.id) ||
      (Boolean(a.topicId && e.topicId && topicIds.has(e.topicId)) &&
        (a.startYear === null || (e.startYear >= a.startYear && (a.endYear === null || e.startYear <= a.endYear)))),
  );

  const milestoneEvents = (person.milestones ?? [])
    .filter((m): m is typeof m & { year: number } => typeof m.year === 'number')
    .map((m, idx) => ({
      id: `${a.id}-ms-${idx}`,
      slug: null,
      title: m.title,
      startYear: m.year,
      eventDateNote: formatYear(m.year),
      description: m.note ?? null,
      category: SYSTEM_CATEGORY_ROOT_SLUGS.EVENT,
      categoryIds: [],
      periodSlug: g.periodSlugOf(a),
      role: 'PARTICIPANT',
      roleLabel: 'Dấu mốc cuộc đời',
    }));

  const combinedEvents = [
    ...relatedEvents.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      startYear: e.startYear,
      eventDateNote: e.eventDateNote,
      description: e.description,
      category: e.category,
      categoryIds: e.categoryIds ?? [],
      periodSlug: e.periodSlug ?? g.periodSlugOf(a),
      role: 'PARTICIPANT',
      roleLabel: 'Tham gia',
    })),
    ...milestoneEvents,
  ].sort((x, y) => x.startYear - y.startYear);

  // Nhân vật cùng Topic / Thời kỳ để khám phá tiếp trong sơ đồ đồng đại.
  const periodSlug = g.periodSlugOf(a);
  const contemporaries = g.articles
    .filter(
      (other) =>
        other.id !== a.id &&
        g.rootCategorySlugOf(other) === SYSTEM_CATEGORY_ROOT_SLUGS.PERSON &&
        ((a.topicId && other.topicId === a.topicId) || (periodSlug && g.periodSlugOf(other) === periodSlug)),
    )
    .slice(0, 8)
    .map((other) => ({
      figureId: other.id,
      slug: other.slug,
      name: other.title,
      relationType: 'CONTEMPORARY_OF',
      direction: 'OUTGOING' as const,
      note: other.summary,
      startYear: other.startYear,
      endYear: other.endYear,
    }));

  return {
    ...toFigure(a),
    roles: person.roles ?? [],
    legacy: {
      hometown: person.hometown ?? null,
      backgroundAndYouth: person.backgroundAndYouth ?? null,
      notableWorks: person.notableWorks ?? [],
      legacyAndHonors: person.legacyAndHonors ?? null,
      anecdotes: person.anecdotes ?? [],
      famousQuote: person.famousQuote ?? null,
    },
    aliases: a.metadata?.aliases ?? [],
    biography: a.summary,
    titles: person.titles ?? [],
    sources: a.metadata?.sources ?? [],
    periodSlug,
    events: combinedEvents,
    relationships: contemporaries,
  };
}

// ---------- API cho trang ----------

export async function fetchPeriods(): Promise<PublicPeriodDto[]> {
  return (await loadGraph()).periods;
}

export async function fetchEvents(): Promise<PublicEventSummaryDto[]> {
  return buildEvents(await loadGraph());
}

export async function fetchFigureDirectory(): Promise<PublicFigureProfileDto[]> {
  const g = await loadGraph();
  const events = buildEvents(g);
  return g.articles
    .filter((a) => g.rootCategorySlugOf(a) === SYSTEM_CATEGORY_ROOT_SLUGS.PERSON)
    .map((a) => toFigureProfile(g, a, events));
}

export async function fetchLocations(): Promise<PublicLocationSummaryDto[]> {
  const g = await loadGraph();
  return g.articles
    .filter((a) => g.rootCategorySlugOf(a) === SYSTEM_CATEGORY_ROOT_SLUGS.LOCATION)
    .map((a) => toLocation(g, a));
}

export async function fetchArticleLibrary(): Promise<PublicArticleLibraryItemDto[]> {
  const g = await loadGraph();
  return g.articles.map((a) => {
    const site = a.metadata?.site ?? {};
    const person = a.metadata?.person ?? {};
    const rootSlug = g.rootCategorySlugOf(a);
    return {
      id: a.id,
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      imageUrl: a.coverImageUrl,
      startYear: a.startYear,
      endYear: a.endYear,
      dateLabel: a.dateLabel,
      kind: rootSlug || (a.category?.slug ?? ''),
      categoryId: a.category?.id ?? null,
      categorySlug: a.category?.slug ?? null,
      categoryName: a.category?.name ?? null,
      periodSlug: g.periodSlugOf(a),
      topicId: a.topicId,
      aliases: a.metadata?.aliases ?? [],
      tags: a.tags.map((t) => ({ id: t.id, name: t.name })),
      address: site.address ?? null,
      siteType: site.siteType ?? null,
      siteTypeLabel: siteTypeLabelOf(site.siteType) ?? null,
      preservationCategory: site.preservation ?? null,
      recognizedYear: site.recognizedYear ?? null,
      roles: person.roles ?? [],
      titles: person.titles ?? [],
      hometown: person.hometown ?? null,
      famousQuote: person.famousQuote ?? null,
      linkedEventsCount: g.nodesOf(a.slug).length,
      linkedFigureNames: [],
      linkedLocationNames: [],
    };
  });
}

/** Tập hợp đệ quy tất cả Period con/cháu của `rootPeriodId`. */
function collectDescendantPeriods(periods: PublicPeriodDto[], rootPeriodId: string): PublicPeriodDto[] {
  const directChildren = periods
    .filter((p) => p.parentId === rootPeriodId)
    .sort((a, b) => (a.startYear ?? 0) - (b.startYear ?? 0));
  return directChildren.flatMap((child) => [child, ...collectDescendantPeriods(periods, child.id)]);
}

export async function fetchPeriodBySlug(slug: string): Promise<PublicPeriodDetailDto | null> {
  const g = await loadGraph();
  const timeline = g.timelines.find((t) => t.slug === slug);
  const period = g.periods.find((p) => p.slug === slug);
  if (!timeline || !period) return null;

  // Gom đệ quy toàn bộ nhánh Topic (Topic cha -> Topic con -> Topic cháu...) và các mốc Timeline thuộc nhánh này.
  const descendantPeriods = collectDescendantPeriods(g.periods, period.id);
  const ownAndDescendantSlugs = new Set([slug, ...descendantPeriods.map((c) => c.slug)]);
  const descendantTopicIds = g.descendantTopicIdsOf(timeline.topicId);

  const inNodes = g.timelines
    .filter((t) => ownAndDescendantSlugs.has(t.slug))
    .flatMap((t) => t.nodes.flatMap(extractNodeArticleSlugs))
    .map((s) => g.bySlug.get(s))
    .filter((a): a is PublicArticleSummary => Boolean(a));

  const nodeArticleIds = new Set(inNodes.map((a) => a.id));
  const related = g.articles.filter(
    (a) => nodeArticleIds.has(a.id) || Boolean(a.topicId && descendantTopicIds.has(a.topicId)),
  );
  const end = period.endYear ?? period.startYear;
  const allEvents = buildEvents(g);

  const parent = period.parentId ? (g.periods.find((p) => p.id === period.parentId) ?? null) : null;
  const directChildPeriods = g.periods
    .filter((p) => p.parentId === period.id)
    .sort((a, b) => (a.startYear ?? 0) - (b.startYear ?? 0));

  const children: PublicSubPeriodDto[] = directChildPeriods.map((c) => {
    const childBranchSlugs = new Set([c.slug, ...collectDescendantPeriods(g.periods, c.id).map((sub) => sub.slug)]);
    const childTimeline = g.timelines.find((t) => t.id === c.id);
    const childTopicIds = g.descendantTopicIdsOf(childTimeline?.topicId);
    const childEvents = allEvents.filter(
      (e) =>
        (e.periodSlug && childBranchSlugs.has(e.periodSlug)) ||
        Boolean(e.topicId && childTopicIds.has(e.topicId)),
    );
    const figureIds = new Set([
      ...childEvents.flatMap((e) => e.figures.map((f) => f.id)),
      ...g.articles
        .filter(
          (a) =>
            g.rootCategorySlugOf(a) === SYSTEM_CATEGORY_ROOT_SLUGS.PERSON &&
            Boolean(a.topicId && childTopicIds.has(a.topicId)),
        )
        .map((a) => a.id),
    ]);
    return { ...c, eventCount: childEvents.length, figureCount: figureIds.size };
  });

  const events = allEvents.filter(
    (e) =>
      (e.periodSlug && ownAndDescendantSlugs.has(e.periodSlug)) ||
      Boolean(e.topicId && descendantTopicIds.has(e.topicId)),
  );

  const figuresById = new Map<string, PublicFigureDto>();
  for (const a of related.filter((a) => g.rootCategorySlugOf(a) === SYSTEM_CATEGORY_ROOT_SLUGS.PERSON)) {
    figuresById.set(a.id, toFigure(a));
  }
  for (const e of events) for (const f of e.figures) figuresById.set(f.id, f);

  return {
    ...period,
    topics: [],
    figures: [...figuresById.values()],
    events,
    parent,
    children,
    locations: related
      .filter((a) => g.rootCategorySlugOf(a) === SYSTEM_CATEGORY_ROOT_SLUGS.LOCATION)
      .map((a) => toLocation(g, a)),
    concurrentPeriods: g.periods.filter(
      (p) =>
        p.slug !== slug &&
        !ownAndDescendantSlugs.has(p.slug) &&
        p.startYear <= end &&
        (p.endYear ?? p.startYear) >= period.startYear,
    ),
    concurrentEvents: [],
  };
}

/** Trang đọc chi tiết (/bai-viet/[slug] và các đường dẫn rewrite /nhan-vat/[slug], /su-kien/[slug], /di-tich/[slug], /thuc-the/[slug]). */
export async function fetchEntityBySlug(slug: string): Promise<PublicEntityDetailDto | null> {
  const [article, g] = await Promise.all([fetchArticle(slug), loadGraph()]);
  if (!article) return null;
  const summary = g.bySlug.get(slug) ?? article;
  const periodSlug = g.periodSlugOf(summary);
  const rootCategorySlug = g.rootCategorySlugOf(article) || (article.category?.slug ?? '');
  const meta = sanitizeMetadata(article.metadata) ?? {};
  const site = meta.site ?? {};

  // Gợi ý bài viết cùng chủ đề (Topic), cùng thẻ (Tag) hoặc cùng chuyên mục (Category).
  const seen = new Set<string>([article.id]);
  const sameTopicCandidates = article.topicId
    ? g.articles.filter((a) => a.id !== article.id && a.topicId === article.topicId)
    : [];
  const combinedRelated = [...article.related, ...sameTopicCandidates].filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  const relatedByTag = combinedRelated.slice(0, 8).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.title,
    type: g.rootCategorySlugOf(r) || (r.category?.slug ?? ''),
    categoryName: r.category?.name ?? null,
    summary: r.summary,
    dateLabel: r.dateLabel,
  }));

  const period = g.periods.find((p) => p.slug === periodSlug) ?? null;
  return {
    id: article.id,
    slug: article.slug,
    name: article.title,
    type: rootCategorySlug,
    categoryName: article.category?.name ?? null,
    tagline: article.summary,
    description: article.summary,
    imageUrl: article.coverImageUrl,
    imageCaption: article.coverCaption,
    aliases: meta.aliases ?? [],
    dateText: article.dateText,
    startYear: article.startYear,
    endYear: article.endYear,
    author: article.author ?? null,
    publishedAt: article.publishedAt ?? null,
    updatedAt: article.updatedAt ?? null,
    contentBlocks: article.contentBlocks,
    metadata: null,
    period,
    media: [],
    statements: [],
    relatedByTag,
    adjacentTimeline: article.adjacentTimeline ?? null,
    previous: article.previous
      ? { id: article.previous.slug, slug: article.previous.slug, name: article.previous.title, dateLabel: article.previous.dateLabel }
      : null,
    next: article.next
      ? { id: article.next.slug, slug: article.next.slug, name: article.next.title, dateLabel: article.next.dateLabel }
      : null,
    roles: meta.person?.roles ?? [],
    titles: meta.person?.titles,
    address: site.address ?? null,
    managingAgency: site.managingAgency ?? null,
    siteTypeLabel: siteTypeLabelOf(site.siteType) ?? null,
    statusNote: site.statusNote ?? null,
  };
}

/** Danh sách từ endpoint công khai bất kỳ (bài học /public/lessons, lộ trình /learning-paths). */
export async function fetchPublicList<T>(endpoint: string): Promise<T[]> {
  try {
    /* eslint-disable-next-line no-restricted-syntax -- Server Component data fetching */
    const response = await fetch(`${API_URL}${endpoint}`, { cache: 'no-store' });
    if (!response.ok) return [];
    const body = await response.json();
    const payload = body?.data ?? body;
    if (Array.isArray(payload)) return payload;
    return Array.isArray(payload?.items) ? payload.items : [];
  } catch {
    return [];
  }
}

export type {
  PublicPeriodDto,
  PublicLocationSummaryDto,
  PublicEventSummaryDto,
  PublicPeriodDetailDto,
  PublicFigureProfileDto,
  PublicEntityMediaDto,
  PublicEntityRelatedArticleDto,
  PublicEntityDetailDto,
  PublicArticleLibraryItemDto,
} from './landing.dto';
