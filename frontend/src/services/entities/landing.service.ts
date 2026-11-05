/**
 * Dữ liệu cho GIAO DIỆN CÔNG KHAI CŨ (trang chủ, /dong-thoi-gian, /nhan-vat, /di-tich, /su-kien,
 * /giai-doan, trang đọc chi tiết) — giữ nguyên các DTO cũ để component không phải sửa, nhưng nguồn
 * dữ liệu giờ là mô hình Article + Category + Tag + Timeline (Knowledge Graph đã bỏ 2026-11-05).
 *
 * QUY TẮC ÁNH XẠ (đọc trước khi sửa):
 *  • "Loại thực thể" của 1 bài viết = chuyên mục GỐC của nó:
 *      nhan-vat → PERSON · su-kien → EVENT · di-tich → LOCATION · trieu-dai → DYNASTY · khác → OTHER
 *  • Thời kỳ (PublicPeriodDto)   = 1 Timeline (slug timeline = slug thời kỳ; năm = min/max năm các mốc).
 *  • Sự kiện (PublicEventSummaryDto) = 1 MỐC của Timeline (slug = slug bài viết mốc trỏ tới, null nếu
 *      mốc không có bài) + bài viết chuyên mục Sự kiện chưa nằm trong mốc nào (không thuộc thời kỳ).
 *  • Loại sự kiện = chuyên mục CON của "su-kien" (xem services/public/public-taxonomy.ts).
 *  • Thời kỳ của 1 bài viết = timeline có mốc trỏ tới bài; nếu không có thì timeline có nhiều bài
 *      chung tag nhất với nó.
 *  • "Mạng lưới tri thức" / sự kiện trong đời nhân vật = các bài viết CHUNG TAG (không còn statement).
 *  • Không còn dữ liệu: vai trò nhân vật, quan hệ nhân vật–nhân vật, xếp hạng/hiện trạng/toạ độ di
 *      tích, khu vực → trả rỗng/null, component tự ẩn phần tương ứng.
 *
 * Chỉ dùng trong Server Component (fetch thuần, cache theo request bằng React `cache`).
 */
import { cache } from 'react';
import {
  fetchArticle,
  fetchArticles,
  fetchCategories,
  fetchTimelines,
  type PublicArticleSummary,
  type PublicCategory,
  type PublicTimeline,
} from '@/services/public/public-content.service';
import { buildTaxonomyGroup, type TaxonomyTermItem } from '@/services/public/public-taxonomy';
import { formatYear } from '@/utils/year-label';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001').replace('://localhost', '://127.0.0.1');

export const PUBLIC_ROUTE_PREFIX = {
  PERIOD: '/giai-doan',
  CHAPTER: '/chuong-su',
  KNOWLEDGE: '/kien-thuc',
  FIGURE: '/nhan-vat',
  EVENT: '/su-kien',
  ENTITY: '/thuc-the',
} as const;

export interface PublicPeriodDto {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  timeLabel: string;
  startYear: number;
  endYear: number | null;
  description: string | null;
  coverImageUrl: string | null;
  region: string | null;
}

export interface PublicTopicDto {
  id: string;
  slug: string;
  name: string;
  eyebrow: string | null;
  icon: string | null;
  description: string | null;
  coverImageUrl: string | null;
}

export interface PublicFigureDto {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  imageUrl: string | null;
  birthYear: number | null;
  deathYear: number | null;
}

export interface PublicLocationSummaryDto {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  historicalSignificance: string | null;
  imageUrl?: string | null;
  /** Mã loại di tích chuẩn hóa (LocationType). */
  siteType?: string;
  siteTypeLabel?: string;
  /** Mã cấp xếp hạng (danh mục HERITAGE_RANK); null = chưa xếp hạng. */
  rankCode?: string | null;
  rankLabel?: string | null;
  recognitionLevel?: string | null;
  constructionLabel?: string | null;
  periodSlug?: string | null;
  /** Các tên gọi trong lịch sử. */
  ancientNames?: string[];
  preservationStatus?: string | null;
  /** Hiện trạng chuẩn hóa: INTACT | MUSEUM_MEMORIAL | ARCHAEOLOGICAL_RUIN | RESTORED | ACTIVE_SITE. */
  preservationCategory?: string | null;
  preservationLabel?: string | null;
  /** Ghi chú còn lại sau khi chuẩn hóa hiện trạng — chỉ hiển thị. */
  statusNote?: string | null;
  managingUnit?: string | null;
  /** Mức độ "trải nghiệm số" có sẵn của di tích. */
  digital?: {
    hasImage: boolean;
    galleryCount: number;
    hasThenAndNow: boolean;
    hasChronicle: boolean;
    hasStructures: boolean;
  };
}

/** Hồ sơ di sản mở rộng (metadata.heritage ở backend). */
export interface PublicHeritageProfileDto {
  recognizedYear: string | null;
  architecturalStyle: string | null;
  openingHours: string | null;
  constructionTimeline: Array<{
    id: string;
    dateLabel: string;
    dynasty: string;
    actionType: 'FOUNDED' | 'EXPANDED' | 'DAMAGED' | 'RESTORED';
    description: string;
  }>;
  subStructures: Array<{
    id: string;
    name: string;
    type: 'ARCHITECTURE' | 'NATIONAL_TREASURE';
    periodBuilt: string;
    description: string;
    imageUrl: string | null;
  }>;
  thenAndNow: { ancientImageUrl: string; ancientLabel: string; modernImageUrl: string; modernLabel: string } | null;
}

export interface PublicLocationDetailDto extends PublicLocationSummaryDto {
  tagline: string | null;
  description: string | null;
  imageCaption: string | null;
  constructionYear: number | null;
  preservationStatus: string | null;
  managingAgency: string | null;
  period: PublicPeriodDto | null;
  media: Array<{ id: string; type: string; url: string; caption: string | null }>;
  events: PublicEventSummaryDto[];
  figures: PublicFigureDto[];
  nearby: Array<PublicLocationSummaryDto & { distanceKm: number }>;
  heritage: PublicHeritageProfileDto;
  /** Nội dung tường thuật dạng Block Builder (giống Lesson.content); null = chưa có. */
  contentBlocks?: unknown;
}

export interface PublicEventSummaryDto {
  id: string;
  slug: string | null;
  title: string;
  startYear: number;
  eventDateNote: string | null;
  location: string | null;
  description: string | null;
  imageUrl: string | null;
  category: string;
  /** Id loại trong danh mục EVENT_CATEGORY (phần tử đầu là loại chính). */
  categoryIds?: string[];
  /** Năm kết thúc (null = trong một năm / chưa rõ). */
  endYear?: number | null;
  parentId?: string | null;
  /** Quan hệ với sự kiện khác (đồ thị tri thức). */
  relations?: PublicEventLinkDto[];
  /** Chủ thể không phải nhân vật / địa danh: triều đại / quốc gia, tổ chức, lực lượng, hiện vật. */
  actors?: PublicEventActorDto[];
  periodSlug: string | null;
  figures: PublicFigureDto[];
  locations: PublicLocationSummaryDto[];
}

export interface PublicEventRelationDto {
  relationType: string;
  description: string | null;
  event: PublicEventSummaryDto;
}

export interface PublicEventParticipantDto {
  entityId: string;
  role: string;
  roleLabel: string | null;
  isPrimary: boolean;
}

export interface PublicEventDetailDto extends PublicEventSummaryDto {
  summary: string | null;
  /** Nội dung diễn biến dạng Block Builder (giống Lesson.content); null = chưa có, dùng `description`. */
  contentBlocks?: unknown;
  startMonth: number | null;
  startDay: number | null;
  endYear: number | null;
  endMonth: number | null;
  endDay: number | null;
  cause: string | null;
  outcome: string | null;
  sources: string[];
  participants: PublicEventParticipantDto[];
  period: PublicPeriodDto | null;
  parent: PublicEventSummaryDto | null;
  children: PublicEventSummaryDto[];
  outgoingRelations: PublicEventRelationDto[];
  incomingRelations: PublicEventRelationDto[];
  /** Danh sách statement chung (Đồ thị tri thức) — dùng để resolveTimelineBlocks() tự dựng khối AUTO/HYBRID. */
  statements: PublicEntityStatementDto[];
}

export interface PublicLessonSummaryDto {
  id: string;
  title: string;
  contentRichText: string | null;
  sourceReferenceNote: string | null;
  estimatedReadMinutes: number;
  events: PublicEventSummaryDto[];
  entities: PublicFigureDto[];
  locations: PublicLocationSummaryDto[];
}

export interface PublicChildTopicDto extends PublicTopicDto {
  events: PublicEventSummaryDto[];
  lessons: PublicLessonSummaryDto[];
}

export interface PublicSubPeriodDto extends PublicPeriodDto {
  eventCount: number;
  figureCount: number;
}

export interface PublicPeriodDetailDto extends PublicPeriodDto {
  topics: PublicTopicDto[];
  /** Gồm cả nhân vật của các giai đoạn con và nhân vật tham gia sự kiện. */
  figures: PublicFigureDto[];
  /** Gồm cả sự kiện của các giai đoạn con. */
  events: PublicEventSummaryDto[];
  parent: PublicPeriodDto | null;
  children: PublicSubPeriodDto[];
  locations: PublicLocationSummaryDto[];
  concurrentPeriods: PublicPeriodDto[];
  concurrentEvents: PublicEventSummaryDto[];
}

export interface PublicTopicDetailDto extends PublicTopicDto {
  period: PublicPeriodDto | null;
  children: PublicChildTopicDto[];
  events: PublicEventSummaryDto[];
  lessons: PublicLessonSummaryDto[];
}

export interface PublicFigureDetailDto extends PublicFigureDto {
  period: PublicPeriodDto | null;
  events: PublicEventSummaryDto[];
  lessons: PublicLessonSummaryDto[];
}

export interface PublicEventActorDto {
  id: string;
  name: string;
  slug: string | null;
  type: string;
  role: string;
  roleLabel: string | null;
  startYear: number | null;
  endYear: number | null;
}

export interface PublicEventLinkDto {
  eventId: string;
  relationType: string;
  /** OUTGOING: sự kiện này → eventId · INCOMING: eventId → sự kiện này. */
  direction: 'OUTGOING' | 'INCOMING';
}

export interface PublicFigureEventDto {
  id: string;
  slug: string | null;
  title: string;
  startYear: number;
  eventDateNote: string | null;
  description: string | null;
  category: string;
  /** Id loại trong danh mục EVENT_CATEGORY (phần tử đầu là loại chính). */
  categoryIds?: string[];
  periodSlug: string | null;
  role: string;
  roleLabel: string | null;
  isPrimary: boolean;
}

export interface PublicFigureRelationDto {
  figureId: string;
  slug: string;
  name: string;
  relationType: string;
  direction: 'OUTGOING' | 'INCOMING';
  note: string | null;
  startYear: number | null;
  endYear: number | null;
}

export interface PublicFigureLegacyDto {
  hometown: string | null;
  backgroundAndYouth: string | null;
  notableWorks: string[];
  legacyAndHonors: string | null;
  anecdotes: string[];
  famousQuote: string | null;
}

export interface PublicFigureProfileDto extends PublicFigureDto {
  roles: string[];
  legacy: PublicFigureLegacyDto;
  aliases: string[];
  birthDateLabel: string | null;
  deathDateLabel: string | null;
  biography: string | null;
  /** Nội dung tường thuật dạng Block Builder (giống Lesson.content); null = chưa có, dùng `biography`. */
  contentBlocks?: unknown;
  occupation: string | null;
  titles: string[];
  sources: string[];
  periodSlug: string | null;
  events: PublicFigureEventDto[];
  relationships: PublicFigureRelationDto[];
  /** Danh sách statement chung (Đồ thị tri thức) — dùng để resolveTimelineBlocks() tự dựng khối AUTO/HYBRID. */
  statements: PublicEntityStatementDto[];
}

export interface PublicEntityMediaDto {
  id: string;
  type: string;
  url: string;
  caption: string | null;
}

export interface PublicEntityStatementDto {
  id: string;
  predicateCode: string;
  predicateLabel: string;
  direction: 'OUTGOING' | 'INCOMING';
  relatedEntityId: string | null;
  relatedEntitySlug: string | null;
  relatedEntityName: string | null;
  relatedEntityType: string | null;
  roleLabel: string | null;
  note: string | null;
  validFromYear: number | null;
  validToYear: number | null;
  /** Chỉ có khi relatedEntityType === 'EVENT' — phục vụ khối Dòng thời gian tự động (AUTO/HYBRID). */
  relatedStartYear?: number | null;
  relatedEndYear?: number | null;
  relatedDescription?: string | null;
  relatedImageUrl?: string | null;
}

export interface PublicEntityAdjacentDto {
  id: string;
  slug: string;
  name: string;
  dateLabel: string | null;
}

export interface PublicEntityDetailDto {
  id: string;
  slug: string;
  name: string;
  type: 'PERSON' | 'ORGANIZATION' | 'DYNASTY' | 'MILITARY_FORCE' | 'ARTIFACT' | 'LOCATION' | 'EVENT' | string;
  tagline: string | null;
  description: string | null;
  imageUrl: string | null;
  imageCaption: string | null;
  aliases: string[];
  dateText: string | null;
  startYear: number | null;
  endYear: number | null;
  contentBlocks?: unknown;
  metadata?: unknown;
  period: PublicPeriodDto | null;
  media: PublicEntityMediaDto[];
  statements: PublicEntityStatementDto[];
  previous?: PublicEntityAdjacentDto | null;
  next?: PublicEntityAdjacentDto | null;
  /** Chỉ có giá trị khi type === 'PERSON' (từ bảng Person). */
  roles?: string[];
  occupation?: string | null;
  titles?: string[];
  /** Chỉ có giá trị khi type === 'LOCATION' (từ bảng HistoricalSite). */
  address?: string | null;
  managingAgency?: string | null;
  recognitionLevel?: string | null;
}

// ======================================================================
// Adapter Article/Timeline → DTO cũ
// ======================================================================

type EntityKind = 'PERSON' | 'EVENT' | 'LOCATION' | 'DYNASTY' | 'OTHER';

const ROOT_KIND: Record<string, EntityKind> = {
  'nhan-vat': 'PERSON',
  'su-kien': 'EVENT',
  'di-tich': 'LOCATION',
  'trieu-dai': 'DYNASTY',
};

const DEFAULT_REGION = 'Việt Nam';
const EMPTY_LEGACY: PublicFigureLegacyDto = {
  hometown: null,
  backgroundAndYouth: null,
  notableWorks: [],
  legacyAndHonors: null,
  anecdotes: [],
  famousQuote: null,
};

interface PublicGraph {
  categories: PublicCategory[];
  articles: PublicArticleSummary[];
  timelines: PublicTimeline[];
  periods: PublicPeriodDto[];
  bySlug: Map<string, PublicArticleSummary>;
  kindOf: (article: { category: { id: string } | null } | null | undefined) => EntityKind;
  /** Chuyên mục con của "su-kien" mà bài viết thuộc về (= loại sự kiện), nếu có. */
  eventTypeOf: (article: PublicArticleSummary | undefined) => PublicCategory | undefined;
  periodSlugOf: (article: PublicArticleSummary) => string | null;
}

function periodFromTimeline(t: PublicTimeline): PublicPeriodDto {
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
    region: DEFAULT_REGION,
  };
}

/** Tải 1 lần mỗi request: chuyên mục + mọi bài viết + mọi dòng thời gian đã xuất bản. */
const loadGraph = cache(async (): Promise<PublicGraph> => {
  const [categories, articles, timelines] = await Promise.all([
    fetchCategories(),
    fetchArticles({ limit: 200 }),
    fetchTimelines(),
  ]);
  const catById = new Map(categories.map((c) => [c.id, c]));
  const rootOf = (id: string): PublicCategory | undefined => {
    let cur = catById.get(id);
    const seen = new Set<string>();
    while (cur?.parentId && catById.has(cur.parentId) && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = catById.get(cur.parentId);
    }
    return cur;
  };
  const kindOf: PublicGraph['kindOf'] = (a) =>
    a?.category ? (ROOT_KIND[rootOf(a.category.id)?.slug ?? ''] ?? 'OTHER') : 'OTHER';
  const eventTypeOf: PublicGraph['eventTypeOf'] = (a) => {
    const cat = a?.category ? catById.get(a.category.id) : undefined;
    return cat?.parentId && rootOf(cat.id)?.slug === 'su-kien' ? cat : undefined;
  };

  const bySlug = new Map(articles.map((a) => [a.slug, a]));
  // Thời kỳ của bài: timeline có mốc trỏ tới bài, nếu không thì timeline có nhiều bài chung tag nhất.
  const nodeTimeline = new Map<string, string>();
  const timelineTags = new Map<string, Map<string, number>>();
  for (const t of timelines) {
    const tagCount = new Map<string, number>();
    for (const n of t.nodes) {
      if (!n.article) continue;
      if (!nodeTimeline.has(n.article.slug)) nodeTimeline.set(n.article.slug, t.slug);
      for (const tag of bySlug.get(n.article.slug)?.tags ?? []) tagCount.set(tag.id, (tagCount.get(tag.id) ?? 0) + 1);
    }
    timelineTags.set(t.slug, tagCount);
  }
  const periodSlugOf = (a: PublicArticleSummary) => {
    const direct = nodeTimeline.get(a.slug);
    if (direct) return direct;
    let best: string | null = null;
    let bestScore = 0;
    for (const [slug, counts] of timelineTags) {
      const score = a.tags.reduce((sum, tag) => sum + (counts.get(tag.id) ?? 0), 0);
      if (score > bestScore) {
        best = slug;
        bestScore = score;
      }
    }
    return best;
  };

  return {
    categories,
    articles,
    timelines,
    periods: timelines.map(periodFromTimeline),
    bySlug,
    kindOf,
    eventTypeOf,
    periodSlugOf,
  };
});

const sharesTag = (a: PublicArticleSummary, b: PublicArticleSummary) =>
  a.id !== b.id && a.tags.some((t) => b.tags.some((u) => u.id === t.id));

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
  };
}

function toLocation(g: PublicGraph, a: PublicArticleSummary): PublicLocationSummaryDto {
  return {
    id: a.id,
    slug: a.slug,
    name: a.title,
    address: null,
    latitude: null,
    longitude: null,
    historicalSignificance: a.summary,
    imageUrl: a.coverImageUrl,
    constructionLabel: a.dateLabel,
    periodSlug: g.periodSlugOf(a),
  };
}

/** Mọi "sự kiện": mốc của các timeline + bài Sự kiện chưa nằm trong mốc nào. */
function buildEvents(g: PublicGraph): PublicEventSummaryDto[] {
  const events: PublicEventSummaryDto[] = [];
  const covered = new Set<string>();
  for (const t of g.timelines) {
    const period = g.periods.find((p) => p.id === t.id);
    for (const node of t.nodes) {
      const article = node.article ? g.bySlug.get(node.article.slug) : undefined;
      if (article) covered.add(article.slug);
      const kind = g.kindOf(article);
      const type = g.eventTypeOf(article);
      events.push({
        id: node.id,
        slug: node.article?.slug ?? null,
        title: node.title,
        startYear: node.year ?? period?.startYear ?? 0,
        endYear: node.endYear,
        eventDateNote: node.dateText ?? (node.month ? node.dateLabel : null),
        location: null,
        description: node.description ?? article?.summary ?? null,
        imageUrl: node.imageUrl ?? article?.coverImageUrl ?? null,
        category: type?.slug ?? 'OTHER',
        categoryIds: type ? [type.id] : [],
        periodSlug: t.slug,
        figures: article && kind === 'PERSON' ? [toFigure(article)] : [],
        locations: article && kind === 'LOCATION' ? [toLocation(g, article)] : [],
        actors: [],
        relations: [],
      });
    }
  }
  for (const a of g.articles) {
    if (covered.has(a.slug) || g.kindOf(a) !== 'EVENT' || a.startYear === null) continue;
    const type = g.eventTypeOf(a);
    events.push({
      id: a.id,
      slug: a.slug,
      title: a.title,
      startYear: a.startYear,
      endYear: a.endYear,
      eventDateNote: a.dateText,
      location: null,
      description: a.summary,
      imageUrl: a.coverImageUrl,
      category: type?.slug ?? 'OTHER',
      categoryIds: type ? [type.id] : [],
      periodSlug: null,
      figures: [],
      locations: [],
      actors: [],
      relations: [],
    });
  }
  return events.sort((x, y) => x.startYear - y.startYear);
}

function toFigureProfile(
  g: PublicGraph,
  a: PublicArticleSummary,
  events: PublicEventSummaryDto[],
): PublicFigureProfileDto {
  const born = a.startYear ?? -Infinity;
  const died = a.endYear ?? Infinity;
  const mine = events.filter((e) => {
    if (!e.slug) return false;
    if (e.slug === a.slug) return true;
    const other = g.bySlug.get(e.slug);
    return Boolean(other && sharesTag(a, other) && e.startYear >= born && e.startYear <= died);
  });
  return {
    ...toFigure(a),
    roles: [],
    legacy: EMPTY_LEGACY,
    aliases: [],
    birthDateLabel: null,
    deathDateLabel: null,
    biography: a.summary,
    occupation: null,
    titles: [],
    sources: [],
    periodSlug: g.periodSlugOf(a),
    events: mine.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      startYear: e.startYear,
      eventDateNote: e.eventDateNote,
      description: e.description,
      category: e.category,
      categoryIds: e.categoryIds,
      periodSlug: e.periodSlug,
      role: 'PARTICIPANT',
      roleLabel: null,
      isPrimary: e.slug === a.slug,
    })),
    relationships: [],
    statements: [],
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
  return g.articles.filter((a) => g.kindOf(a) === 'PERSON').map((a) => toFigureProfile(g, a, events));
}

export async function fetchLocations(): Promise<PublicLocationSummaryDto[]> {
  const g = await loadGraph();
  return g.articles.filter((a) => g.kindOf(a) === 'LOCATION').map((a) => toLocation(g, a));
}

/** "Danh mục" cho component cũ — sinh từ chuyên mục (xem public-taxonomy.ts). */
export async function fetchTaxonomyTerms(groupCode: string): Promise<TaxonomyTermItem[]> {
  return buildTaxonomyGroup(groupCode, (await loadGraph()).categories).terms;
}

/** Trang /giai-doan/[slug]: 1 timeline + bài viết trong mốc + bài chung tag với các bài đó. */
export async function fetchPeriodBySlug(slug: string): Promise<PublicPeriodDetailDto | null> {
  const g = await loadGraph();
  const timeline = g.timelines.find((t) => t.slug === slug);
  const period = g.periods.find((p) => p.slug === slug);
  if (!timeline || !period) return null;

  const inNodes = timeline.nodes
    .map((n) => (n.article ? g.bySlug.get(n.article.slug) : undefined))
    .filter((a): a is PublicArticleSummary => Boolean(a));
  const related = g.articles.filter((a) => inNodes.some((b) => b.id === a.id || sharesTag(a, b)));
  const end = period.endYear ?? period.startYear;

  return {
    ...period,
    topics: [],
    figures: related.filter((a) => g.kindOf(a) === 'PERSON').map(toFigure),
    events: buildEvents(g).filter((e) => e.periodSlug === slug),
    parent: null,
    children: [],
    locations: related.filter((a) => g.kindOf(a) === 'LOCATION').map((a) => toLocation(g, a)),
    concurrentPeriods: g.periods.filter(
      (p) => p.slug !== slug && p.startYear <= end && (p.endYear ?? p.startYear) >= period.startYear,
    ),
    concurrentEvents: [],
  };
}

/** Trang đọc chi tiết (/nhan-vat/[slug], /su-kien/[slug], /di-tich/[slug], /thuc-the/[slug], /bai-viet/[slug]). */
export async function fetchEntityBySlug(slug: string): Promise<PublicEntityDetailDto | null> {
  const [article, g] = await Promise.all([fetchArticle(slug), loadGraph()]);
  if (!article) return null;
  const summary = g.bySlug.get(slug) ?? article;
  const periodSlug = article.timelines[0]?.slug ?? g.periodSlugOf(summary);

  return {
    id: article.id,
    slug: article.slug,
    name: article.title,
    type: g.kindOf(article),
    tagline: article.summary,
    description: article.summary,
    imageUrl: article.coverImageUrl,
    imageCaption: article.coverCaption,
    aliases: [],
    dateText: article.dateText,
    startYear: article.startYear,
    endYear: article.endYear,
    contentBlocks: article.contentBlocks,
    metadata: null,
    period: g.periods.find((p) => p.slug === periodSlug) ?? null,
    media: [],
    // "Mạng lưới tri thức" = bài viết chung tag (backend đã chọn sẵn trong `related`).
    statements: article.related.map((r) => ({
      id: r.id,
      predicateCode: 'RELATED',
      predicateLabel: 'Liên quan',
      direction: 'OUTGOING' as const,
      relatedEntityId: r.id,
      relatedEntitySlug: r.slug,
      relatedEntityName: r.title,
      relatedEntityType: g.kindOf(r),
      roleLabel: r.category?.name ?? null,
      note: r.summary,
      validFromYear: r.startYear,
      validToYear: r.endYear,
    })),
    previous: article.previous
      ? { id: article.previous.slug, slug: article.previous.slug, name: article.previous.title, dateLabel: article.previous.dateLabel }
      : null,
    next: article.next
      ? { id: article.next.slug, slug: article.next.slug, name: article.next.title, dateLabel: article.next.dateLabel }
      : null,
  };
}

/** Danh sách từ endpoint công khai bất kỳ (bài học /public/lessons, lộ trình /learning-paths). */
export async function fetchPublicList<T>(endpoint: string): Promise<T[]> {
  try {
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
