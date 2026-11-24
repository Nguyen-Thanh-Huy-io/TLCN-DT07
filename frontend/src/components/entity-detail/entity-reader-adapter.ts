import {
  PublicEntityDetailDto,
  PublicEntityMediaDto,
  PublicEntityRelatedArticleDto,
} from '@/services/entities/landing.service';
import {
  buildLessonTocAndHtml,
  normalizeContentToBlocks,
  LessonTocEntry,
} from '@/features/lessons/utils/lesson-toc.util';
import { ResourceLinkBlockData } from '@/features/lessons/types/block-builder.types';
import type { ReadingEntity } from '@/features/reading-aids/components/ReadingAidsPanel';
import {
  PUBLIC_ROUTES,
  SYSTEM_CATEGORY_ROOT_SLUGS,
  type PublicAuthorInfo,
} from '@/services/public/public-content.service';

export type EntityIconName =
  | 'Crown'
  | 'Sparkles'
  | 'Building2'
  | 'Swords'
  | 'UserRound'
  | 'CalendarDays'
  | 'MapPin'
  | 'BookOpen';

export interface EntityTypeConfig {
  typeKey: string;
  badgeLabel: string;
  lifespanLabel: string;
  lifespanUnit: string;
  iconName: EntityIconName;
  themeColor: string;
  themeBg: string;
  routePrefix: string;
  previousLabel: string;
  nextLabel: string;
}

const GENERIC_ADJACENT = { previousLabel: 'Bài trước', nextLabel: 'Bài tiếp theo' } as const;

const STRATEGIES: Record<string, EntityTypeConfig> = {
  [SYSTEM_CATEGORY_ROOT_SLUGS.DYNASTY]: {
    typeKey: SYSTEM_CATEGORY_ROOT_SLUGS.DYNASTY,
    badgeLabel: 'Triều đại',
    lifespanLabel: 'Thời gian trị vì',
    lifespanUnit: 'năm',
    iconName: 'Crown',
    themeColor: '#B8860B',
    themeBg: '#FFFDF5',
    routePrefix: '/bai-viet',
    previousLabel: 'Triều đại trước',
    nextLabel: 'Triều đại tiếp theo',
  },
  [SYSTEM_CATEGORY_ROOT_SLUGS.DOCUMENT]: {
    typeKey: SYSTEM_CATEGORY_ROOT_SLUGS.DOCUMENT,
    badgeLabel: 'Tác phẩm & Tư liệu',
    lifespanLabel: 'Niên đại lưu truyền',
    lifespanUnit: 'năm',
    iconName: 'Sparkles',
    themeColor: '#2E6B56',
    themeBg: '#F4FAF7',
    routePrefix: '/bai-viet',
    ...GENERIC_ADJACENT,
  },
  [SYSTEM_CATEGORY_ROOT_SLUGS.PERSON]: {
    typeKey: SYSTEM_CATEGORY_ROOT_SLUGS.PERSON,
    badgeLabel: 'Nhân vật lịch sử',
    lifespanLabel: 'Hưởng thọ',
    lifespanUnit: 'tuổi',
    iconName: 'UserRound',
    themeColor: '#8C2D19',
    themeBg: '#FAF5EE',
    routePrefix: '/bai-viet',
    previousLabel: 'Nhân vật trước',
    nextLabel: 'Nhân vật tiếp theo',
  },
  [SYSTEM_CATEGORY_ROOT_SLUGS.EVENT]: {
    typeKey: SYSTEM_CATEGORY_ROOT_SLUGS.EVENT,
    badgeLabel: 'Sự kiện lịch sử',
    lifespanLabel: 'Thời lượng sự kiện',
    lifespanUnit: 'năm',
    iconName: 'CalendarDays',
    themeColor: '#8C2D19',
    themeBg: '#FDF5EE',
    routePrefix: '/bai-viet',
    previousLabel: 'Sự kiện trước',
    nextLabel: 'Sự kiện tiếp theo',
  },
  [SYSTEM_CATEGORY_ROOT_SLUGS.LOCATION]: {
    typeKey: SYSTEM_CATEGORY_ROOT_SLUGS.LOCATION,
    badgeLabel: 'Di tích & Địa danh',
    lifespanLabel: 'Tồn tại đến nay',
    lifespanUnit: 'năm',
    iconName: 'MapPin',
    themeColor: '#2F4F4F',
    themeBg: '#F4F7F7',
    routePrefix: '/bai-viet',
    previousLabel: 'Di tích trước',
    nextLabel: 'Di tích tiếp theo',
  },
};

const DEFAULT_STRATEGY: EntityTypeConfig = {
  typeKey: 'bai-viet',
  badgeLabel: 'Bài viết lịch sử',
  lifespanLabel: 'Thời gian lưu dấu',
  lifespanUnit: 'năm',
  iconName: 'BookOpen',
  themeColor: '#5C4033',
  themeBg: '#FAF7F2',
  routePrefix: '/bai-viet',
  ...GENERIC_ADJACENT,
};

export function getEntityTypeStrategy(type: string | null | undefined, categoryName?: string | null): EntityTypeConfig {
  const key = (type || '').trim().toLowerCase();
  const matched = STRATEGIES[key] ?? DEFAULT_STRATEGY;
  if (categoryName?.trim()) {
    return { ...matched, badgeLabel: categoryName.trim() };
  }
  return matched;
}

/** Bài liên quan với bài đang đọc → danh sách Nhân vật / Địa danh / Sự kiện cho bảng "Trong bài". */
function toReadingEntities(related: PublicEntityRelatedArticleDto[]): ReadingEntity[] {
  return related.flatMap((item) => {
    if (!item.slug || !item.name) return [];
    return [
      {
        id: item.id,
        name: item.name,
        href: PUBLIC_ROUTES.ARTICLE(item.slug),
        kind: item.type,
        note: item.dateLabel ?? item.categoryName,
        summary: item.summary,
      },
    ];
  });
}

export interface FastFactItem {
  id: string;
  label: string;
  value: string;
  href?: string;
}

export interface EntityQuickStat {
  id: string;
  value: string;
  label: string;
}

export interface EntityAdjacent {
  id: string;
  slug: string;
  name: string;
  dateLabel: string | null;
  href: string;
}

export interface EntityReaderModel {
  id: string;
  slug: string;
  name: string;
  hanziName: string | null;
  type: string;
  strategy: EntityTypeConfig;
  tagline: string | null;
  description: string | null;
  dateLabel: string;
  /** false = bài chưa có năm → ẩn mọi chỗ hiện ngày thay vì in "Chưa rõ niên đại". */
  hasKnownDate: boolean;
  author: PublicAuthorInfo | null;
  publishedAt: string | null;
  updatedAt: string | null;
  periodName: string | null;
  periodHref: string | null;
  imageUrl: string | null;
  imageCaption: string | null;
  aliases: string[];
  toc: LessonTocEntry[];
  html: string;
  resourceLinks: ResourceLinkBlockData[];
  readMinutes: number;
  readingEntities: ReadingEntity[];
  relatedByTag: PublicEntityRelatedArticleDto[];
  facts: FastFactItem[];
  media: PublicEntityMediaDto[];
  quickStats: EntityQuickStat[];
  previous: EntityAdjacent | null;
  next: EntityAdjacent | null;
  /** Dòng thời gian làm nguồn cho bài trước / sau; null = cùng chuyên mục theo năm. */
  adjacentTimeline: { title: string; href: string } | null;
  previousLabel: string;
  nextLabel: string;
}

export interface GenericContentBlock {
  type?: string;
  title?: string;
  data?: {
    rows?: unknown[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const LEGACY_BLOCK_TABLE_TYPE = 'table';
const UNKNOWN_DATE_LABEL = 'Chưa rõ niên đại';
const DEFAULT_NATIONAL_NAME = 'Đại Việt';
const DEFAULT_CAPITAL_NAME = 'Định đô Thăng Long';
const DEFAULT_CAPITAL_YEAR = 1010;

function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} TCN` : `${year}`;
}

export function cleanPeriodName(name: string | null | undefined): string {
  if (!name) return '';
  return name.replace(/^dòng thời gian\s+/i, '').trim();
}

export function buildEntityDateLabel(entity: PublicEntityDetailDto): string {
  if (entity.dateText) return entity.dateText;
  if (entity.startYear != null && entity.endYear != null) {
    return `${formatYear(entity.startYear)} – ${formatYear(entity.endYear)}`;
  }
  if (entity.startYear != null) {
    return `Từ năm ${formatYear(entity.startYear)}`;
  }
  if (entity.endYear != null) {
    return `Đến năm ${formatYear(entity.endYear)}`;
  }
  return UNKNOWN_DATE_LABEL;
}

function wordCount(...texts: Array<string | null | undefined>): number {
  return texts.reduce((n, t) => n + (t ? t.trim().split(/\s+/).length : 0), 0);
}

function extractHanziName(text: string | null | undefined): string | null {
  if (!text) return null;
  const hanziRegex = /(?:chữ Hán:\s*([\u4e00-\u9fa5]+)|huý là[^(]*\(([\u4e00-\u9fa5]+)\))/i;
  const match = text.match(hanziRegex);
  if (match) {
    return match[1] || match[2] || null;
  }
  const generalHanzi = /\(([\u4e00-\u9fa5]{1,6})\)/;
  const generalMatch = text.match(generalHanzi);
  return generalMatch ? generalMatch[1] : null;
}

function extractPersonQuickStats(entity: PublicEntityDetailDto, strategy: EntityTypeConfig): EntityQuickStat[] {
  const stats: EntityQuickStat[] = [];

  if (entity.startYear != null && entity.endYear != null) {
    const diff = Math.abs(entity.endYear - entity.startYear);
    stats.push({
      id: 'stat-lifespan',
      value: `${diff} ${strategy.lifespanUnit}`,
      label: strategy.lifespanLabel,
    });
  }

  if (entity.titles && entity.titles.length > 0) {
    const matchReign = entity.titles[0].match(/(\d+\s*năm(?:\s*,\s*\d+\s*ngày)?)/i);
    if (matchReign) {
      stats.push({
        id: 'stat-reign-time',
        value: matchReign[1],
        label: 'Thời gian tại vị',
      });
    }
  }

  if (entity.period?.name) {
    stats.push({
      id: 'stat-period',
      value: cleanPeriodName(entity.period.name),
      label: 'Vương triều / Thời đại',
    });
  }

  if (entity.roles && entity.roles.length > 0) {
    stats.push({
      id: 'stat-role',
      value: entity.roles[0],
      label: 'Vị thế lịch sử',
    });
  } else if (entity.titles?.[0]) {
    stats.push({
      id: 'stat-title',
      value: entity.titles[0],
      label: 'Danh hiệu',
    });
  }

  return stats;
}

function resolveEmperorsCount(
  meta: Record<string, unknown>,
  blocks: GenericContentBlock[],
  desc: string,
): number | null {
  if (meta.emperorsCount) {
    return Number(meta.emperorsCount);
  }
  const tableBlock = blocks.find(
    (b: GenericContentBlock) =>
      b.type?.toLowerCase() === LEGACY_BLOCK_TABLE_TYPE &&
      /vua|hoàng đế|niên biểu|hoàng tử/i.test(b.title || ''),
  );
  if (tableBlock && Array.isArray(tableBlock.data?.rows)) {
    return tableBlock.data.rows.length;
  }
  const match = desc.match(/(\d+)\s+(?:vị|đời)\s+(?:vua|hoàng đế)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

function extractDynastyQuickStats(
  entity: PublicEntityDetailDto,
  strategy: EntityTypeConfig,
  blocks: GenericContentBlock[],
  meta: Record<string, unknown>,
  desc: string,
): EntityQuickStat[] {
  const stats: EntityQuickStat[] = [];

  if (entity.startYear != null && entity.endYear != null) {
    const years = Math.abs(entity.endYear - entity.startYear);
    stats.push({
      id: 'stat-reign-years',
      value: `${years} năm`,
      label: strategy.lifespanLabel || 'Trị vì độc lập',
    });
  }

  const emperorsCount = resolveEmperorsCount(meta, blocks, desc);
  if (emperorsCount) {
    stats.push({
      id: 'stat-emperors',
      value: `${emperorsCount} đời vua`,
      label: 'Hoàng đế trị vì',
    });
  }

  if (meta.capitalYear || desc.includes('1010')) {
    const yr = meta.capitalYear || DEFAULT_CAPITAL_YEAR;
    stats.push({
      id: 'stat-capital',
      value: `${yr}`,
      label: meta.capital ? `Định đô ${meta.capital}` : DEFAULT_CAPITAL_NAME,
    });
  } else if (entity.startYear != null) {
    stats.push({
      id: 'stat-start',
      value: `${formatYear(entity.startYear)}`,
      label: 'Khởi dựng vương triều',
    });
  }

  const nationalName =
    String(meta.nationalName || '') ||
    entity.aliases?.find((a) =>
      /đại việt|đại cồ việt|đại ngu|văn lang|âu lạc/i.test(a),
    ) ||
    DEFAULT_NATIONAL_NAME;

  stats.push({
    id: 'stat-national-name',
    value: nationalName,
    label: 'Quốc hiệu rạng danh',
  });

  return stats;
}

function extractLocationQuickStats(entity: PublicEntityDetailDto, knownDateLabel: string | null): EntityQuickStat[] {
  return [
    ...(entity.siteTypeLabel ? [{ id: 'stat-site-type', value: entity.siteTypeLabel, label: 'Loại di tích' }] : []),
    ...(knownDateLabel ? [{ id: 'stat-founded', value: knownDateLabel, label: 'Niên đại khởi dựng' }] : []),
  ];
}

/** Ngày và thời kỳ đã hiện ở đầu trang nên chỉ còn khoảng thời gian (bỏ khi bằng 0). */
function extractFallbackQuickStats(entity: PublicEntityDetailDto, strategy: EntityTypeConfig): EntityQuickStat[] {
  if (entity.startYear == null || entity.endYear == null) return [];
  const diff = Math.abs(entity.endYear - entity.startYear);
  return diff > 0 ? [{ id: 'stat-duration', value: `${diff} ${strategy.lifespanUnit}`, label: strategy.lifespanLabel }] : [];
}

function extractQuickStats(
  entity: PublicEntityDetailDto,
  strategy: EntityTypeConfig,
  blocks: GenericContentBlock[],
  dateLabel: string,
): EntityQuickStat[] {
  const meta = (entity.metadata || {}) as Record<string, unknown>;
  const desc = `${entity.description || ''} ${entity.tagline || ''}`;

  switch (entity.type) {
    case SYSTEM_CATEGORY_ROOT_SLUGS.PERSON:
      return extractPersonQuickStats(entity, strategy).slice(0, 4);
    case SYSTEM_CATEGORY_ROOT_SLUGS.DYNASTY:
      return extractDynastyQuickStats(entity, strategy, blocks, meta, desc).slice(0, 4);
    case SYSTEM_CATEGORY_ROOT_SLUGS.LOCATION:
      return extractLocationQuickStats(entity, dateLabel === UNKNOWN_DATE_LABEL ? null : dateLabel).slice(0, 4);
    default:
      return extractFallbackQuickStats(entity, strategy);
  }
}

function extractPersonFastFacts(entity: PublicEntityDetailDto): FastFactItem[] {
  const facts: FastFactItem[] = [];
  if (entity.roles && entity.roles.length > 0) {
    facts.push({ id: 'entity-roles', label: 'Vai trò', value: entity.roles.join(', ') });
  }
  if (entity.titles && entity.titles.length > 0) {
    const formattedTitles = entity.titles.map((t) =>
      t.replace(/\((\d+)/g, ' ($1').replace(/\s*–\s*/g, ' – ')
    );
    facts.push({ id: 'entity-titles', label: 'Tước hiệu', value: formattedTitles.join(', ') });
  }
  return facts;
}

function extractLocationFastFacts(entity: PublicEntityDetailDto): FastFactItem[] {
  const facts: FastFactItem[] = [];
  if (entity.address) facts.push({ id: 'site-address', label: 'Địa chỉ', value: entity.address });
  if (entity.statusNote) facts.push({ id: 'site-status', label: 'Hiện trạng', value: entity.statusNote });
  if (entity.managingAgency) facts.push({ id: 'site-managing-agency', label: 'Đơn vị quản lý', value: entity.managingAgency });
  return facts;
}

function extractMetadataFastFacts(meta: Record<string, unknown>): FastFactItem[] {
  const facts: FastFactItem[] = [];
  if (meta.capital) {
    facts.push({ id: 'meta-capital', label: 'Kinh đô', value: String(meta.capital) });
  }
  if (meta.founder) {
    facts.push({ id: 'meta-founder', label: 'Vị vua / Người sáng lập', value: String(meta.founder) });
  }
  if (meta.dynasty) {
    facts.push({ id: 'meta-dynasty', label: 'Triều đại liên thuộc', value: String(meta.dynasty) });
  }
  if (meta.location) {
    facts.push({ id: 'meta-location', label: 'Địa điểm / Hiện trạng', value: String(meta.location) });
  }
  return facts;
}

/** Loại bài, ngày và thời kỳ đã hiện ở đầu trang → hồ sơ chỉ giữ thông tin chưa có ở đó. */
function extractEntityFastFacts(entity: PublicEntityDetailDto): FastFactItem[] {
  const facts: FastFactItem[] = [];

  if (entity.aliases && entity.aliases.length > 0) {
    facts.push({
      id: 'entity-aliases',
      label: 'Tên gọi khác / Danh xưng',
      value: entity.aliases.join(', '),
    });
  }

  if (entity.type === SYSTEM_CATEGORY_ROOT_SLUGS.PERSON) facts.push(...extractPersonFastFacts(entity));
  if (entity.type === SYSTEM_CATEGORY_ROOT_SLUGS.LOCATION) facts.push(...extractLocationFastFacts(entity));

  const meta = (entity.metadata || {}) as Record<string, unknown>;
  facts.push(...extractMetadataFastFacts(meta));

  return facts;
}

function buildAdjacentNavigation(
  adjacent: PublicEntityDetailDto['previous'],
  hrefOf: (slug: string) => string,
): EntityAdjacent | null {
  if (!adjacent) return null;
  return {
    id: adjacent.id,
    slug: adjacent.slug,
    name: adjacent.name,
    dateLabel: adjacent.dateLabel,
    href: hrefOf(adjacent.slug),
  };
}

const TIMELINE_ADJACENT_LABELS = { previousLabel: 'Mốc trước', nextLabel: 'Mốc tiếp theo' } as const;

export function buildEntityReaderModel(entity: PublicEntityDetailDto): EntityReaderModel {
  const strategy = getEntityTypeStrategy(entity.type, entity.categoryName);
  const dateLabel = buildEntityDateLabel(entity);

  const normalized = normalizeContentToBlocks(entity.contentBlocks);
  const { tocItems, html } = buildLessonTocAndHtml(normalized.blocks);
  const cleanHtml = html ? html.normalize('NFC') : '';
  const cleanToc = (tocItems || []).map((item) => ({
    ...item,
    text: item.text.normalize('NFC'),
  }));

  const facts = extractEntityFastFacts(entity);

  const plainTextLength = wordCount(entity.description, entity.tagline, html.replace(/<[^>]*>/g, ''));
  const readMinutes = Math.max(2, Math.ceil(plainTextLength / 220));

  const quickStats = extractQuickStats(
    entity,
    strategy,
    (normalized.blocks as unknown) as GenericContentBlock[],
    dateLabel,
  );

  const timeline = entity.adjacentTimeline ?? null;
  const adjacentHref = PUBLIC_ROUTES.ARTICLE;
  const previous = buildAdjacentNavigation(entity.previous, adjacentHref);
  const next = buildAdjacentNavigation(entity.next, adjacentHref);
  const adjacentLabels = timeline ? TIMELINE_ADJACENT_LABELS : strategy;

  const hanziName =
    extractHanziName(entity.name) ||
    extractHanziName(entity.description) ||
    extractHanziName(entity.tagline);

  const relatedByTag = entity.relatedByTag ?? [];

  return {
    id: entity.id,
    slug: entity.slug,
    name: entity.name,
    hanziName,
    type: entity.type,
    strategy,
    tagline: entity.tagline,
    description: entity.description,
    dateLabel,
    hasKnownDate: dateLabel !== UNKNOWN_DATE_LABEL,
    author: entity.author ?? null,
    publishedAt: entity.publishedAt ?? null,
    updatedAt: entity.updatedAt ?? null,
    periodName: entity.period?.name ? cleanPeriodName(entity.period.name) : null,
    periodHref: entity.period ? `/giai-doan/${entity.period.slug}` : null,
    imageUrl: entity.imageUrl,
    imageCaption: entity.imageCaption,
    aliases: entity.aliases ?? [],
    toc: cleanToc,
    html: cleanHtml,
    resourceLinks: normalized.resourceLinks,
    readMinutes,
    readingEntities: toReadingEntities(relatedByTag),
    relatedByTag,
    facts,
    media: entity.media ?? [],
    quickStats,
    previous,
    next,
    adjacentTimeline: timeline ? { title: timeline.title, href: PUBLIC_ROUTES.TIMELINE(timeline.slug) } : null,
    previousLabel: adjacentLabels.previousLabel,
    nextLabel: adjacentLabels.nextLabel,
  };
}
