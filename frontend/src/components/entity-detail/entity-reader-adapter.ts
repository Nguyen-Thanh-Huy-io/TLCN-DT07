import {
  PublicEntityDetailDto,
  PublicEntityMediaDto,
  PublicEntityStatementDto,
} from '@/services/entities/landing.service';
import { getEntityTypeStrategy, EntityTypeConfig } from './entity-strategy';
import {
  buildLessonTocAndHtml,
  normalizeContentToBlocks,
  LessonTocEntry,
} from '@/features/lessons/utils/lesson-toc.util';
import { ResourceLinkBlockData } from '@/features/lessons/types/block-builder.types';
import { ArticleKindEnum } from '@/constants/enums';

export interface FastFactItem {
  id: string;
  label: string;
  value: string;
  href?: string;
  isHighlight?: boolean;
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
  periodName: string | null;
  periodHref: string | null;
  imageUrl: string | null;
  imageCaption: string | null;
  aliases: string[];
  toc: LessonTocEntry[];
  html: string;
  resourceLinks: ResourceLinkBlockData[];
  readMinutes: number;
  statements: PublicEntityStatementDto[];
  facts: FastFactItem[];
  media: PublicEntityMediaDto[];
  quickStats: EntityQuickStat[];
  previous: EntityAdjacent | null;
  next: EntityAdjacent | null;
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
  // Bắt mẫu chữ Hán: 黎太祖 hoặc 黎利
  const hanziRegex = /(?:chữ Hán:\s*([\u4e00-\u9fa5]+)|huý là[^(]*\(([\u4e00-\u9fa5]+)\))/i;
  const match = text.match(hanziRegex);
  if (match) {
    return match[1] || match[2] || null;
  }
  // Mẫu chữ Hán bất kỳ trong ngoặc
  const generalHanzi = /\(([\u4e00-\u9fa5]{1,6})\)/;
  const generalMatch = text.match(generalHanzi);
  return generalMatch ? generalMatch[1] : null;
}

function extractPersonQuickStats(
  entity: PublicEntityDetailDto,
  strategy: EntityTypeConfig,
  blocks: GenericContentBlock[],
): EntityQuickStat[] {
  const stats: EntityQuickStat[] = [];

  // 1. Tuổi hưởng thọ (nếu là nhân vật lịch sử)
  if (entity.startYear != null && entity.endYear != null) {
    const diff = Math.abs(entity.endYear - entity.startYear);
    stats.push({
      id: 'stat-lifespan',
      value: `${diff} ${strategy.lifespanUnit}`,
      label: strategy.lifespanLabel,
    });
  }

  // 2. Thời gian tại vị / tước hiệu chính nếu có
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

  // 3. Số đề mục tư liệu khảo cứu
  if (blocks.length > 0) {
    stats.push({
      id: 'stat-topics',
      value: `${blocks.length} đề mục`,
      label: 'Tư liệu khảo cứu',
    });
  }

  // 4. Triều đại / Thời đại
  if (entity.period?.name) {
    stats.push({
      id: 'stat-period',
      value: cleanPeriodName(entity.period.name),
      label: 'Vương triều / Thời đại',
    });
  }

  // 5. Vai trò / Vị thế lịch sử (hoặc Lãnh thổ)
  if (entity.roles && entity.roles.length > 0) {
    stats.push({
      id: 'stat-role',
      value: entity.roles[0],
      label: 'Vị thế lịch sử',
    });
  } else if (entity.occupation) {
    stats.push({
      id: 'stat-occupation',
      value: entity.occupation,
      label: 'Chức vụ / Sự nghiệp',
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

  // 1. Số năm trị vì
  if (entity.startYear != null && entity.endYear != null) {
    const years = Math.abs(entity.endYear - entity.startYear);
    stats.push({
      id: 'stat-reign-years',
      value: `${years} năm`,
      label: strategy.lifespanLabel || 'Trị vì độc lập',
    });
  }

  // 2. Số đời vua kế vị
  const emperorsCount = resolveEmperorsCount(meta, blocks, desc);
  if (emperorsCount) {
    stats.push({
      id: 'stat-emperors',
      value: `${emperorsCount} đời vua`,
      label: 'Hoàng đế trị vì',
    });
  }

  // 3. Mốc định đô / Khai quốc
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

  // 4. Quốc hiệu
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

function extractFallbackQuickStats(
  entity: PublicEntityDetailDto,
  strategy: EntityTypeConfig,
  blocks: GenericContentBlock[],
  dateLabel: string,
): EntityQuickStat[] {
  const stats: EntityQuickStat[] = [];

  if (entity.startYear != null && entity.endYear != null) {
    const diff = Math.abs(entity.endYear - entity.startYear);
    stats.push({
      id: 'stat-duration',
      value: `${diff} ${strategy.lifespanUnit}`,
      label: strategy.lifespanLabel,
    });
  } else if (dateLabel && dateLabel !== UNKNOWN_DATE_LABEL) {
    stats.push({
      id: 'stat-date',
      value: dateLabel,
      label: strategy.timeLabelTitle,
    });
  }

  if (entity.period?.name) {
    stats.push({
      id: 'stat-period',
      value: cleanPeriodName(entity.period.name),
      label: 'Thời kỳ lịch sử',
    });
  }

  if (blocks.length > 0) {
    stats.push({
      id: 'stat-topics',
      value: `${blocks.length} đề mục`,
      label: 'Tư liệu khảo cứu',
    });
  }

  return stats;
}

function extractQuickStats(
  entity: PublicEntityDetailDto,
  strategy: EntityTypeConfig,
  blocks: GenericContentBlock[],
  dateLabel: string,
): EntityQuickStat[] {
  const meta = (entity.metadata || {}) as Record<string, unknown>;
  const desc = `${entity.description || ''} ${entity.tagline || ''}`;

  if (entity.type === ArticleKindEnum.PERSON) {
    return extractPersonQuickStats(entity, strategy, blocks).slice(0, 4);
  }
  if (entity.type === ArticleKindEnum.DYNASTY) {
    return extractDynastyQuickStats(entity, strategy, blocks, meta, desc).slice(0, 4);
  }
  return extractFallbackQuickStats(entity, strategy, blocks, dateLabel).slice(0, 4);
}

function extractPersonFastFacts(entity: PublicEntityDetailDto): FastFactItem[] {
  const facts: FastFactItem[] = [];
  if (entity.roles && entity.roles.length > 0) {
    facts.push({ id: 'entity-roles', label: 'Vai trò', value: entity.roles.join(', ') });
  }
  if (entity.occupation) {
    facts.push({ id: 'entity-occupation', label: 'Nghề nghiệp / Chức vụ', value: entity.occupation });
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
  if (entity.address) {
    facts.push({ id: 'entity-address', label: 'Địa chỉ', value: entity.address });
  }
  if (entity.managingAgency) {
    facts.push({ id: 'entity-managing-agency', label: 'Đơn vị quản lý', value: entity.managingAgency });
  }
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

function extractEntityFastFacts(
  entity: PublicEntityDetailDto,
  strategy: EntityTypeConfig,
  dateLabel: string,
): FastFactItem[] {
  const facts: FastFactItem[] = [
    {
      id: 'entity-type',
      label: 'Phân loại',
      value: strategy.badgeLabel,
      isHighlight: true,
    },
    {
      id: 'entity-date',
      label: strategy.timeLabelTitle,
      value: dateLabel,
      isHighlight: true,
    },
  ];

  if (entity.period) {
    facts.push({
      id: 'entity-period',
      label: 'Thời kỳ lịch sử',
      value: cleanPeriodName(entity.period.name),
      href: `/giai-doan/${entity.period.slug}`,
    });
  }

  if (entity.aliases && entity.aliases.length > 0) {
    facts.push({
      id: 'entity-aliases',
      label: 'Tên gọi khác / Danh xưng',
      value: entity.aliases.join(', '),
    });
  }

  if (entity.type === ArticleKindEnum.PERSON) {
    facts.push(...extractPersonFastFacts(entity));
  } else if (entity.type === ArticleKindEnum.LOCATION) {
    facts.push(...extractLocationFastFacts(entity));
  }

  const meta = (entity.metadata || {}) as Record<string, unknown>;
  facts.push(...extractMetadataFastFacts(meta));

  return facts;
}

function buildAdjacentNavigation(
  adjacent: PublicEntityDetailDto['previous'],
  routePrefix: string,
): EntityAdjacent | null {
  if (!adjacent) return null;
  return {
    id: adjacent.id,
    slug: adjacent.slug,
    name: adjacent.name,
    dateLabel: adjacent.dateLabel,
    href: `${routePrefix}/${adjacent.slug}`,
  };
}

export function buildEntityReaderModel(entity: PublicEntityDetailDto): EntityReaderModel {
  const strategy = getEntityTypeStrategy(entity.type);
  const dateLabel = buildEntityDateLabel(entity);

  // Chuẩn hóa, tự động dựng mốc cho khối Dòng thời gian (AUTO/HYBRID) rồi biên dịch toàn bộ khối contentBlocks
  const normalized = normalizeContentToBlocks(entity.contentBlocks);
  const { tocItems, html } = buildLessonTocAndHtml(normalized.blocks);
  const cleanHtml = html ? html.normalize('NFC') : '';
  const cleanToc = (tocItems || []).map((item) => ({
    ...item,
    text: item.text.normalize('NFC'),
  }));

  const facts = extractEntityFastFacts(entity, strategy, dateLabel);

  const plainTextLength = wordCount(entity.description, entity.tagline, html.replace(/<[^>]*>/g, ''));
  const readMinutes = Math.max(2, Math.ceil(plainTextLength / 220));

  const quickStats = extractQuickStats(
    entity,
    strategy,
    (normalized.blocks as unknown) as GenericContentBlock[],
    dateLabel,
  );

  const previous = buildAdjacentNavigation(entity.previous, strategy.routePrefix);
  const next = buildAdjacentNavigation(entity.next, strategy.routePrefix);

  const hanziName =
    extractHanziName(entity.name) ||
    extractHanziName(entity.description) ||
    extractHanziName(entity.tagline);

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
    periodName: entity.period?.name ? cleanPeriodName(entity.period.name) : null,
    periodHref: entity.period ? `/giai-doan/${entity.period.slug}` : null,
    imageUrl: entity.imageUrl,
    imageCaption: entity.imageCaption,
    aliases: entity.aliases ?? [],
    toc: cleanToc,
    html: cleanHtml,
    resourceLinks: normalized.resourceLinks,
    readMinutes,
    statements: entity.statements ?? [],
    facts,
    media: entity.media ?? [],
    quickStats,
    previous,
    next,
  };
}
