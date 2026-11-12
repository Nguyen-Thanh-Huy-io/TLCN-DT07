/**
 * Dữ liệu cho GIAO DIỆN CÔNG KHAI CŨ (trang chủ, /dong-thoi-gian, /nhan-vat, /di-tich, /su-kien,
 * /giai-doan, trang đọc chi tiết) — giữ nguyên các DTO cũ để component không phải sửa, nguồn dữ liệu
 * là Article + Category + Tag + ArticleLink + Timeline (Knowledge Graph đã bỏ 2026-11-05).
 *
 * QUY TẮC ÁNH XẠ (đọc trước khi sửa):
 *  • Loại bài = `Category.kind` của chuyên mục (trống → kế thừa cha, gốc trống → OTHER) —
 *      services/public/article-kind.ts. Không gán cứng theo slug.
 *  • Thời kỳ (PublicPeriodDto) = 1 Timeline (năm = min/max năm các mốc).
 *  • Sự kiện (PublicEventSummaryDto) = 1 MỐC của Timeline (slug = bài mốc trỏ tới) + bài chuyên mục
 *      Sự kiện chưa nằm trong mốc nào (không thuộc thời kỳ → không hiện ở /dong-thoi-gian).
 *  • Loại sự kiện = chuyên mục CON có loại EVENT (services/public/public-taxonomy.ts).
 *  • Liên kết bài ↔ bài = bảng ArticleLink (`summary.links`, chỉ chiều bài khai báo → bài đích; chiều
 *      ngược tự suy ở đây). Ý nghĩa theo loại 2 đầu, nhãn = `label` (chữ tự do):
 *        PERSON–PERSON  → tab "Mối quan hệ" (cả 2 hồ sơ)
 *        PERSON–EVENT   → sự kiện trong dòng đời nhân vật (vai trò = label) + người tham gia sự kiện
 *        EVENT–LOCATION → nơi diễn ra sự kiện + sự kiện của di tích
 *        EVENT–EVENT    → quan hệ sự kiện (chế độ "Liên kết" của dòng thời gian)
 *        mọi cặp        → "Mạng lưới tri thức" ở trang đọc (trước các bài chung tag)
 *  • Hồ sơ mô tả = Article.metadata (aliases, sources, person, site, event) — tùy chọn.
 *  • Thời kỳ của bài = timeline có mốc trỏ tới bài; không có thì timeline có nhiều bài chung tag nhất.
 *  • Dòng đời nhân vật = features/articles/person-life.ts (dùng CHUNG với khung xem trước ở CMS):
 *      liên kết tới bài sự kiện + mốc trỏ thẳng tới bài nhân vật + mốc đời riêng. KHÔNG suy theo tag.
 *
 * Chỉ dùng trong Server Component (fetch thuần, cache theo request bằng React `cache`).
 */
import { cache } from 'react';
import { buildPersonLife, type LifeNodeRef } from '@/features/articles/person-life';
import type { ArticleMetadata } from '@/services/public/public-content.service';
import {
  fetchArticle,
  fetchArticles,
  fetchCategories,
  fetchTimelines,
  type PublicArticleSummary,
  type PublicCategory,
  type PublicTimeline,
} from '@/services/public/public-content.service';
import { resolveCategoryKind, type ArticleKind } from '@/services/public/article-kind';
import { formatYear } from '@/utils/year-label';
import { ArticleKindEnum } from '@/constants/enums';
import { INTERNAL_API_BASE_URL } from '@/constants/api-url';

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

const API_URL = INTERNAL_API_BASE_URL;

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
}

// ======================================================================
// Adapter Article / ArticleLink / Timeline → DTO cũ
// ======================================================================

type EntityKind = ArticleKind;

const DEFAULT_LINK_LABEL = 'Liên quan';

/**
 * Làm sạch Article.metadata khi ĐỌC. JSONB không có schema ở DB: dữ liệu ghi thẳng (script nhập,
 * SQL tay) có thể sai kiểu (vd. `titles` là chuỗi thay vì mảng) — không được làm sập trang công khai.
 * Đường ghi chuẩn (API) đã chuẩn hoá ở backend/src/article/article-metadata.ts.
 */
const asText = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const asList = (v: unknown): string[] | undefined => {
  if (Array.isArray(v)) {
    const list = v.map(asText).filter((s): s is string => Boolean(s));
    return list.length ? list : undefined;
  }
  const one = asText(v);
  return one ? [one] : undefined;
};
const asNumber = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const asObject = (v: unknown): Record<string, unknown> | undefined =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;

function sanitizeMetadata(raw: unknown): ArticleMetadata | null {
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
interface LinkView {
  other: PublicArticleSummary;
  label: string | null;
  note: string | null;
  /** OUTGOING: bài này khai báo · INCOMING: bài kia khai báo trỏ tới bài này. */
  direction: 'OUTGOING' | 'INCOMING';
}

interface PublicGraph {
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
  };
}

function buildBidirectionalLinks(
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

function buildNodesByArticle(timelines: PublicTimeline[]): Map<string, LifeNodeRef[]> {
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

function createPeriodSlugResolver(
  timelines: PublicTimeline[],
  bySlug: Map<string, PublicArticleSummary>,
  links: Map<string, LinkView[]>,
): (a: PublicArticleSummary) => string | null {
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

  return (a: PublicArticleSummary) => {
    const direct = nodeTimeline.get(a.slug);
    if (direct) return direct;
    for (const l of links.get(a.id) ?? []) {
      const viaLink = nodeTimeline.get(l.other.slug);
      if (viaLink) return viaLink;
    }
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
}

/** Tải 1 lần mỗi request: chuyên mục + mọi bài viết (kèm liên kết, hồ sơ) + mọi dòng thời gian. */
const loadGraph = cache(async (): Promise<PublicGraph> => {
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
  const periodSlugOf = createPeriodSlugResolver(timelines, bySlug, links);

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

const sharesTag = (a: PublicArticleSummary, b: PublicArticleSummary) =>
  a.id !== b.id && a.tags.some((t) => b.tags.some((u) => u.id === t.id));

const linksOfKind = (g: PublicGraph, a: PublicArticleSummary, kind: EntityKind) =>
  g.linksOf(a.id).filter((l) => g.kindOf(l.other) === kind);

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
  const site = a.metadata?.site ?? {};
  return {
    id: a.id,
    slug: a.slug,
    name: a.title,
    address: site.address ?? null,
    latitude: site.latitude ?? null,
    longitude: site.longitude ?? null,
    historicalSignificance: a.summary,
    imageUrl: a.coverImageUrl,
    siteType: site.siteType,
    siteTypeLabel: site.siteType ? DEFAULT_LOCATION_TYPE_LABELS[site.siteType] ?? site.siteType : undefined,
    constructionLabel: a.dateLabel,
    periodSlug: g.periodSlugOf(a),
    ancientNames: a.metadata?.aliases ?? [],
    preservationStatus: site.statusNote ?? null,
    preservationCategory: site.preservation ?? null,
    statusNote: site.statusNote ?? null,
    managingUnit: site.managingAgency ?? null,
  };
}

/** Trích xuất dữ liệu người tham gia và nơi diễn ra từ bài viết. */
function buildArticleEventExtractors(g: PublicGraph) {
  return (article: PublicArticleSummary | undefined) => {
    if (!article) return { figures: [], locations: [], location: null };
    const kind = g.kindOf(article);
    const places = linksOfKind(g, article, ArticleKindEnum.LOCATION).map((l) => l.other);
    const people = linksOfKind(g, article, ArticleKindEnum.PERSON).map((l) => l.other);
    return {
      figures: [...(kind === ArticleKindEnum.PERSON ? [article] : []), ...people].map(toFigure),
      locations: [...(kind === ArticleKindEnum.LOCATION ? [article] : []), ...places].map((p) => toLocation(g, p)),
      location: places[0]?.title ?? null,
    };
  };
}

function buildEventsFromTimelines(
  g: PublicGraph,
  covered: Set<string>,
  fromArticle: ReturnType<typeof buildArticleEventExtractors>,
): PublicEventSummaryDto[] {
  const events: PublicEventSummaryDto[] = [];
  for (const t of g.timelines) {
    const period = g.periods.find((p) => p.id === t.id);
    for (const node of t.nodes) {
      const article = node.article ? g.bySlug.get(node.article.slug) : undefined;
      if (article) covered.add(article.slug);
      const type = g.eventTypeOf(article);
      events.push({
        id: node.id,
        slug: node.article?.slug ?? null,
        title: node.title,
        startYear: node.year ?? period?.startYear ?? 0,
        endYear: node.endYear,
        eventDateNote: node.dateText ?? (node.month ? node.dateLabel : null) ?? article?.metadata?.event?.dateNote ?? null,
        description: node.description ?? article?.summary ?? null,
        imageUrl: node.imageUrl ?? article?.coverImageUrl ?? null,
        category: type?.slug ?? 'OTHER',
        categoryIds: type ? [type.id] : [],
        periodSlug: t.slug,
        actors: [],
        relations: [],
        ...fromArticle(article),
      });
    }
  }
  return events;
}

function buildEventsFromUncoveredArticles(
  g: PublicGraph,
  covered: Set<string>,
  fromArticle: ReturnType<typeof buildArticleEventExtractors>,
): PublicEventSummaryDto[] {
  const events: PublicEventSummaryDto[] = [];
  for (const a of g.articles) {
    if (covered.has(a.slug) || g.kindOf(a) !== ArticleKindEnum.EVENT || a.startYear === null) continue;
    const type = g.eventTypeOf(a);
    events.push({
      id: a.id,
      slug: a.slug,
      title: a.title,
      startYear: a.startYear,
      endYear: a.endYear,
      eventDateNote: a.metadata?.event?.dateNote ?? a.dateText,
      description: a.summary,
      imageUrl: a.coverImageUrl,
      category: type?.slug ?? 'OTHER',
      categoryIds: type ? [type.id] : [],
      periodSlug: null,
      actors: [],
      relations: [],
      ...fromArticle(a),
    });
  }
  return events;
}

function attachEventRelations(events: PublicEventSummaryDto[], g: PublicGraph): void {
  const entryIdBySlug = new Map(events.filter((e) => e.slug).map((e) => [e.slug!, e.id]));
  for (const e of events) {
    const article = e.slug ? g.bySlug.get(e.slug) : undefined;
    if (!article) continue;
    e.relations = linksOfKind(g, article, ArticleKindEnum.EVENT)
      .map((l) => ({
        eventId: entryIdBySlug.get(l.other.slug) ?? '',
        relationType: l.label ?? DEFAULT_LINK_LABEL,
        direction: l.direction,
      }))
      .filter((r) => r.eventId);
  }
}

/** Mọi "sự kiện": mốc của các timeline + bài Sự kiện chưa nằm trong mốc nào. */
function buildEvents(g: PublicGraph): PublicEventSummaryDto[] {
  const covered = new Set<string>();
  const fromArticle = buildArticleEventExtractors(g);
  const events: PublicEventSummaryDto[] = [
    ...buildEventsFromTimelines(g, covered, fromArticle),
    ...buildEventsFromUncoveredArticles(g, covered, fromArticle),
  ];
  attachEventRelations(events, g);
  return events.sort((x, y) => x.startYear - y.startYear);
}

function toFigureProfile(
  g: PublicGraph,
  a: PublicArticleSummary,
  events: PublicEventSummaryDto[],
): PublicFigureProfileDto {
  const person = a.metadata?.person ?? {};
  // Dòng đời: QUY TẮC CHUNG với CMS (features/articles/person-life.ts) — liên kết sự kiện, mốc trỏ
  // thẳng tới bài nhân vật, mốc đời riêng. Không suy theo tag.
  const life = buildPersonLife({
    ownNodes: g.nodesOf(a.slug),
    eventLinks: linksOfKind(g, a, 'EVENT').map((l) => ({
      article: { ...l.other, nodes: g.nodesOf(l.other.slug) },
      label: l.label,
      direction: l.direction,
    })),
    milestones: (person.milestones ?? []).filter((m): m is typeof m & { year: number } => typeof m.year === 'number'),
  }).filter((it) => it.year !== null);
  const entryById = new Map(events.map((e) => [e.id, e]));

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
    birthDateLabel: person.birthDateLabel ?? null,
    deathDateLabel: person.deathDateLabel ?? null,
    biography: a.summary,
    occupation: person.occupation ?? null,
    titles: person.titles ?? [],
    sources: a.metadata?.sources ?? [],
    periodSlug: g.periodSlugOf(a),
    events: life.map((it) => {
      const id = it.node?.id ?? it.article?.id ?? `${a.id}-${it.key}`;
      const entry = entryById.get(id);
      return {
        id,
        slug: it.article?.slug ?? null,
        title: it.title,
        startYear: it.year!,
        eventDateNote: it.dateLabel,
        description: it.description,
        category: entry?.category ?? 'OTHER',
        categoryIds: entry?.categoryIds ?? [],
        periodSlug: it.timeline?.slug ?? g.periodSlugOf(a),
        role: 'PARTICIPANT',
        roleLabel: it.role,
        isPrimary: it.isPrimary,
      };
    }),
    // Tab "Mối quan hệ": liên kết tới / từ bài nhân vật khác; nhãn hiện nguyên chữ.
    relationships: linksOfKind(g, a, 'PERSON').map((l) => ({
      figureId: l.other.id,
      slug: l.other.slug,
      name: l.other.title,
      relationType: l.label ?? DEFAULT_LINK_LABEL,
      direction: l.direction,
      note: l.note,
      startYear: null,
      endYear: null,
    })),
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
  return g.articles.filter((a) => g.kindOf(a) === ArticleKindEnum.PERSON).map((a) => toFigureProfile(g, a, events));
}

export async function fetchLocations(): Promise<PublicLocationSummaryDto[]> {
  const g = await loadGraph();
  return g.articles.filter((a) => g.kindOf(a) === ArticleKindEnum.LOCATION).map((a) => toLocation(g, a));
}

/** Trang /giai-doan/[slug]: 1 timeline + bài trong mốc + bài liên kết / chung tag với các bài đó. */
export async function fetchPeriodBySlug(slug: string): Promise<PublicPeriodDetailDto | null> {
  const g = await loadGraph();
  const timeline = g.timelines.find((t) => t.slug === slug);
  const period = g.periods.find((p) => p.slug === slug);
  if (!timeline || !period) return null;

  const inNodes = timeline.nodes
    .map((n) => (n.article ? g.bySlug.get(n.article.slug) : undefined))
    .filter((a): a is PublicArticleSummary => Boolean(a));
  const linked = inNodes.flatMap((a) => g.linksOf(a.id).map((l) => l.other));
  const relatedIds = new Set([...inNodes, ...linked].map((a) => a.id));
  const related = g.articles.filter(
    (a) => relatedIds.has(a.id) || inNodes.some((b) => sharesTag(a, b)),
  );
  const end = period.endYear ?? period.startYear;

  return {
    ...period,
    topics: [],
    figures: related.filter((a) => g.kindOf(a) === ArticleKindEnum.PERSON).map(toFigure),
    events: buildEvents(g).filter((e) => e.periodSlug === slug),
    parent: null,
    children: [],
    locations: related.filter((a) => g.kindOf(a) === ArticleKindEnum.LOCATION).map((a) => toLocation(g, a)),
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
  const kind = g.kindOf(article);
  const meta = sanitizeMetadata(article.metadata) ?? {};
  const site = meta.site ?? {};

  // "Mạng lưới tri thức": liên kết khai báo (2 chiều) trước, sau đó bài chung tag.
  const statements: PublicEntityStatementDto[] = [];
  const seen = new Set<string>();
  const push = (r: PublicArticleSummary, label: string, direction: 'OUTGOING' | 'INCOMING', note: string | null) => {
    if (seen.has(r.id)) return;
    seen.add(r.id);
    statements.push({
      id: `${r.id}-${statements.length}`,
      predicateCode: 'RELATED',
      predicateLabel: label,
      direction,
      relatedEntityId: r.id,
      relatedEntitySlug: r.slug,
      relatedEntityName: r.title,
      relatedEntityType: g.kindOf(r),
      roleLabel: label,
      note: note ?? r.summary,
      validFromYear: r.startYear,
      validToYear: r.endYear,
    });
  };
  for (const l of g.linksOf(article.id)) push(l.other, l.label ?? DEFAULT_LINK_LABEL, l.direction, l.note);
  for (const r of article.related) push(r, r.category?.name ?? DEFAULT_LINK_LABEL, 'OUTGOING', null);

  const period = g.periods.find((p) => p.slug === periodSlug) ?? null;
  return {
    id: article.id,
    slug: article.slug,
    name: article.title,
    type: kind,
    tagline: article.summary,
    description: article.summary,
    imageUrl: article.coverImageUrl,
    imageCaption: article.coverCaption,
    aliases: meta.aliases ?? [],
    dateText: article.dateText,
    startYear: article.startYear,
    endYear: article.endYear,
    contentBlocks: article.contentBlocks,
    metadata: null,
    period,
    media: [],
    statements,
    previous: article.previous
      ? { id: article.previous.slug, slug: article.previous.slug, name: article.previous.title, dateLabel: article.previous.dateLabel }
      : null,
    next: article.next
      ? { id: article.next.slug, slug: article.next.slug, name: article.next.title, dateLabel: article.next.dateLabel }
      : null,
    roles: meta.person?.roles ?? [],
    occupation: meta.person?.occupation ?? null,
    titles: meta.person?.titles,
    address: site.address ?? null,
    managingAgency: site.managingAgency ?? null,
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
