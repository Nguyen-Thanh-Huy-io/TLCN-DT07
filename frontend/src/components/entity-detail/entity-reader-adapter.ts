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
  type: string;
  strategy: EntityTypeConfig;
  tagline: string | null;
  description: string | null;
  dateLabel: string;
  periodName: string | null;
  periodHref: string | null;
  periodRegion: string | null;
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

function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} TCN` : `${year}`;
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
  return 'Chưa rõ niên đại';
}

function wordCount(...texts: Array<string | null | undefined>): number {
  return texts.reduce((n, t) => n + (t ? t.trim().split(/\s+/).length : 0), 0);
}

function extractQuickStats(
  entity: PublicEntityDetailDto,
  strategy: EntityTypeConfig,
  blocks: any[],
  dateLabel: string,
): EntityQuickStat[] {
  const stats: EntityQuickStat[] = [];
  const meta = (entity.metadata || {}) as Record<string, any>;
  const desc = (entity.description || '') + ' ' + (entity.tagline || '');

  if (entity.type === 'DYNASTY') {
    // 1. Số năm trị vì
    if (entity.startYear != null && entity.endYear != null) {
      const years = Math.abs(entity.endYear - entity.startYear);
      stats.push({
        id: 'stat-reign-years',
        value: `${years} năm`,
        label: 'Trị vì độc lập',
      });
    }

    // 2. Số đời vua kế vị
    let emperorsCount: number | null = null;
    if (meta.emperorsCount) emperorsCount = Number(meta.emperorsCount);
    if (!emperorsCount) {
      const tableBlock = blocks.find(
        (b: any) =>
          b.type === 'table' &&
          /vua|hoàng đế|niên biểu|hoàng tử/i.test(b.title || ''),
      );
      if (tableBlock && Array.isArray(tableBlock.data?.rows)) {
        emperorsCount = tableBlock.data.rows.length;
      }
    }
    if (!emperorsCount) {
      const match = desc.match(/(\d+)\s+(?:vị|đời)\s+(?:vua|hoàng đế)/i);
      if (match) emperorsCount = parseInt(match[1], 10);
    }
    if (emperorsCount) {
      stats.push({
        id: 'stat-emperors',
        value: `${emperorsCount} đời vua`,
        label: 'Hoàng đế trị vì',
      });
    }

    // 3. Mốc định đô / Khai quốc
    if (meta.capitalYear || desc.includes('1010')) {
      const yr = meta.capitalYear || 1010;
      stats.push({
        id: 'stat-capital',
        value: `${yr}`,
        label: meta.capital ? `Định đô ${meta.capital}` : 'Định đô Thăng Long',
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
      meta.nationalName ||
      entity.aliases.find((a) =>
        /đại việt|đại cồ việt|đại ngu|văn lang|âu lạc/i.test(a),
      ) ||
      'Đại Việt';
    stats.push({
      id: 'stat-national-name',
      value: nationalName,
      label: 'Quốc hiệu rạng danh',
    });
  } else {
    // Tự động xây dựng cho các thực thể khác
    if (entity.startYear != null && entity.endYear != null) {
      const diff = Math.abs(entity.endYear - entity.startYear);
      stats.push({
        id: 'stat-duration',
        value: `${diff} năm`,
        label: 'Thời gian tồn tại',
      });
    } else if (dateLabel && dateLabel !== 'Chưa rõ niên đại') {
      stats.push({
        id: 'stat-date',
        value: dateLabel,
        label: strategy.timeLabelTitle,
      });
    }

    if (entity.period?.name) {
      stats.push({
        id: 'stat-period',
        value: entity.period.name,
        label: 'Thời kỳ lịch sử',
      });
    }

    if (entity.period?.region) {
      stats.push({
        id: 'stat-region',
        value: entity.period.region,
        label: 'Không gian địa lý',
      });
    }

    if (blocks.length > 0) {
      stats.push({
        id: 'stat-topics',
        value: `${blocks.length} đề mục`,
        label: 'Tư liệu khảo cứu',
      });
    }
  }

  return stats.slice(0, 4);
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

  // Xây dựng các facts tóm tắt nhanh cho sidebar infobox
  const facts: FastFactItem[] = [];

  facts.push({
    id: 'entity-type',
    label: 'Phân loại',
    value: strategy.badgeLabel,
    isHighlight: true,
  });

  facts.push({
    id: 'entity-date',
    label: strategy.timeLabelTitle,
    value: dateLabel,
    isHighlight: true,
  });

  if (entity.period) {
    facts.push({
      id: 'entity-period',
      label: 'Thời kỳ lịch sử',
      value: entity.period.name,
      href: `/giai-doan/${entity.period.slug}`,
    });
  }

  if (entity.period?.region) {
    facts.push({
      id: 'entity-region',
      label: 'Không gian / Lãnh thổ',
      value: entity.period.region,
    });
  }

  if (entity.aliases && entity.aliases.length > 0) {
    facts.push({
      id: 'entity-aliases',
      label: 'Tên gọi khác / Danh xưng',
      value: entity.aliases.join(', '),
    });
  }

  if (entity.type === 'PERSON') {
    if (entity.roles && entity.roles.length > 0) {
      facts.push({ id: 'entity-roles', label: 'Vai trò', value: entity.roles.join(', ') });
    }
    if (entity.occupation) {
      facts.push({ id: 'entity-occupation', label: 'Nghề nghiệp / Chức vụ', value: entity.occupation });
    }
    if (entity.titles && entity.titles.length > 0) {
      facts.push({ id: 'entity-titles', label: 'Tước hiệu', value: entity.titles.join(', ') });
    }
  }

  if (entity.type === 'LOCATION') {
    if (entity.address) {
      facts.push({ id: 'entity-address', label: 'Địa chỉ', value: entity.address });
    }
    if (entity.recognitionLevel) {
      facts.push({ id: 'entity-rank', label: 'Xếp hạng di tích', value: entity.recognitionLevel });
    }
    if (entity.managingAgency) {
      facts.push({ id: 'entity-managing-agency', label: 'Đơn vị quản lý', value: entity.managingAgency });
    }
  }

  // Trích xuất các thông tin từ metadata nếu có (ví dụ: kinh đô, người sáng lập, quốc hiệu...)
  const meta = (entity.metadata || {}) as Record<string, any>;
  if (meta.capital) {
    facts.push({
      id: 'meta-capital',
      label: 'Kinh đô',
      value: String(meta.capital),
    });
  }
  if (meta.founder) {
    facts.push({
      id: 'meta-founder',
      label: 'Vị vua / Người sáng lập',
      value: String(meta.founder),
    });
  }
  if (meta.dynasty) {
    facts.push({
      id: 'meta-dynasty',
      label: 'Triều đại liên thuộc',
      value: String(meta.dynasty),
    });
  }
  if (meta.location) {
    facts.push({
      id: 'meta-location',
      label: 'Địa điểm / Hiện trạng',
      value: String(meta.location),
    });
  }

  const plainTextLength = wordCount(entity.description, entity.tagline, html.replace(/<[^>]*>/g, ''));
  const readMinutes = Math.max(2, Math.ceil(plainTextLength / 220));

  const quickStats = extractQuickStats(
    entity,
    strategy,
    normalized.blocks,
    dateLabel,
  );

  const previous: EntityAdjacent | null = entity.previous
    ? {
        id: entity.previous.id,
        slug: entity.previous.slug,
        name: entity.previous.name,
        dateLabel: entity.previous.dateLabel,
        href: `${strategy.routePrefix}/${entity.previous.slug}`,
      }
    : null;

  const next: EntityAdjacent | null = entity.next
    ? {
        id: entity.next.id,
        slug: entity.next.slug,
        name: entity.next.name,
        dateLabel: entity.next.dateLabel,
        href: `${strategy.routePrefix}/${entity.next.slug}`,
      }
    : null;

  return {
    id: entity.id,
    slug: entity.slug,
    name: entity.name,
    type: entity.type,
    strategy,
    tagline: entity.tagline,
    description: entity.description,
    dateLabel,
    periodName: entity.period?.name ?? null,
    periodHref: entity.period ? `/giai-doan/${entity.period.slug}` : null,
    periodRegion: entity.period?.region ?? null,
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
