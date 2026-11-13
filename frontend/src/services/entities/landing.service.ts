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
 *  • Loại sự kiện = chuyên mục CON có loại EVENT (services/public/article-kind.ts).
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

import { buildPersonLife } from '@/features/articles/person-life';
import { fetchArticle, type PublicArticleSummary } from '@/services/public/public-content.service';
import { ArticleKindEnum } from '@/constants/enums';
import { INTERNAL_API_BASE_URL } from '@/constants/api-url';
import type { PublicPeriodDto, PublicFigureDto, PublicLocationSummaryDto, PublicEventSummaryDto, PublicPeriodDetailDto, PublicFigureProfileDto, PublicEntityStatementDto, PublicEntityDetailDto } from './landing.dto';
import { loadGraph, sanitizeMetadata } from './landing-graph';
import type { EntityKind, PublicGraph } from './landing-graph';

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
  FIGURE: '/nhan-vat',
  EVENT: '/su-kien',
  ENTITY: '/thuc-the',
} as const;

const DEFAULT_LINK_LABEL = 'Liên quan';

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

export type { PublicPeriodDto, PublicFigureDto, PublicLocationSummaryDto, PublicEventSummaryDto, PublicPeriodDetailDto, PublicFigureRelationDto, PublicFigureProfileDto, PublicEntityMediaDto, PublicEntityStatementDto, PublicEntityDetailDto } from './landing.dto';
