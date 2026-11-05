import { LessonBlockType } from '../types/block-palette.types';
import {
  LessonBlockItem,
  RelatedEventsBlockData,
  RelatedPeopleBlockData,
  RowSectionBlockData,
  StoryChapterBlockData,
  TimelineBlockData,
} from '../types/block-builder.types';
import { TimelineNode } from '../components/blocks/HistoricalTimelineBlock';

/** Sự kiện dùng để tự động dựng mốc Dòng thời gian khi khối nằm trong trang Thời kỳ. */
export interface TimelineResolverEvent {
  id: string;
  slug: string | null;
  title: string;
  startYear: number;
  endYear?: number | null;
  description: string | null;
  imageUrl: string | null;
  location: string | null;
  categoryIds?: string[];
  category: string;
}

/** Statement (Đồ thị tri thức) dùng để tự động dựng mốc khi khối nằm trong trang Thực thể. */
export interface TimelineResolverStatement {
  predicateCode: string;
  relatedEntityId: string | null;
  relatedEntitySlug: string | null;
  relatedEntityName: string | null;
  relatedEntityType: string | null;
  roleLabel: string | null;
  validFromYear: number | null;
  validToYear: number | null;
  relatedStartYear?: number | null;
  relatedEndYear?: number | null;
  relatedDescription?: string | null;
  relatedImageUrl?: string | null;
}

export interface TimelineResolverContext {
  /** Trang Thời kỳ (/giai-doan/[slug]): toàn bộ sự kiện đã xuất bản của thời kỳ đó. */
  events?: TimelineResolverEvent[];
  /** Trang Thực thể (/thuc-the/[slug]): các statement (liên kết đồ thị tri thức) của thực thể đó. */
  statements?: TimelineResolverStatement[];
}

function eventToNode(e: TimelineResolverEvent): TimelineNode {
  return {
    id: `auto-event-${e.id}`,
    year: String(e.startYear),
    title: e.title,
    description: e.description || '',
    eventId: e.id,
    locationName: e.location ?? undefined,
    thumbnailUrl: e.imageUrl ?? undefined,
    isManual: false,
  };
}

function statementToNode(s: TimelineResolverStatement): TimelineNode | null {
  if (!s.relatedEntityId || s.relatedStartYear == null) return null;
  return {
    id: `auto-stmt-${s.relatedEntityId}`,
    year: String(s.relatedStartYear),
    title: s.relatedEntityName || '',
    description: s.relatedDescription || '',
    eventId: s.relatedEntityId,
    role: s.roleLabel ?? undefined,
    thumbnailUrl: s.relatedImageUrl ?? undefined,
    isManual: false,
  };
}

function inYearRange(year: number, startYear?: number, endYear?: number): boolean {
  if (startYear != null && year < startYear) return false;
  if (endYear != null && year > endYear) return false;
  return true;
}

/** Dựng danh sách Nhân vật liên quan từ statement, theo `sourceMode` (AUTO = thay toàn bộ, MANUAL = giữ nguyên). */
function resolveRelatedPeople(
  block: RelatedPeopleBlockData,
  ctx: TimelineResolverContext,
): RelatedPeopleBlockData['people'] {
  if ((block.sourceMode || 'MANUAL') !== 'AUTO' || !ctx.statements) return block.people;

  const seen = new Set<string>();
  const people: RelatedPeopleBlockData['people'] = [];
  for (const s of ctx.statements) {
    if (s.relatedEntityType !== 'PERSON' || !s.relatedEntityId || seen.has(s.relatedEntityId)) continue;
    seen.add(s.relatedEntityId);
    people.push({
      id: s.relatedEntityId,
      name: s.relatedEntityName || '',
      role: s.roleLabel ?? undefined,
      avatarUrl: s.relatedImageUrl ?? undefined,
    });
  }
  return people;
}

/** Dựng danh sách Sự kiện liên quan từ statement, theo `sourceMode` (AUTO = thay toàn bộ, MANUAL = giữ nguyên). */
function resolveRelatedEvents(
  block: RelatedEventsBlockData,
  ctx: TimelineResolverContext,
): RelatedEventsBlockData['events'] {
  if ((block.sourceMode || 'MANUAL') !== 'AUTO' || !ctx.statements) return block.events;

  const seen = new Set<string>();
  const events: RelatedEventsBlockData['events'] = [];
  for (const s of ctx.statements) {
    if (s.relatedEntityType !== 'EVENT' || !s.relatedEntityId || seen.has(s.relatedEntityId)) continue;
    seen.add(s.relatedEntityId);
    events.push({
      id: s.relatedEntityId,
      title: s.relatedEntityName || '',
      year: s.relatedStartYear ?? undefined,
    });
  }
  return events;
}

/** Dựng danh sách mốc tự động cho một khối TIMELINE theo `sourceMode`/`filterConfig`, gộp với mốc thủ công đã có. */
function resolveTimelineNodes(block: TimelineBlockData, ctx: TimelineResolverContext): TimelineNode[] {
  const sourceMode = block.sourceMode || 'MANUAL';
  const manualNodes = (block.nodes || []).filter((n) => n.isManual !== false);

  if (sourceMode === 'MANUAL') return block.nodes || [];

  const filter = block.filterConfig || {};
  let autoNodes: TimelineNode[] = [];

  if (ctx.events) {
    autoNodes = ctx.events
      .filter((e) => inYearRange(e.startYear, filter.startYear, filter.endYear))
      .filter(
        (e) =>
          !filter.eventTypes?.length ||
          filter.eventTypes.includes(e.category) ||
          e.categoryIds?.some((id) => filter.eventTypes!.includes(id)),
      )
      .map(eventToNode);
  } else if (ctx.statements) {
    autoNodes = ctx.statements
      .filter((s) => s.relatedEntityType === 'EVENT')
      .filter((s) => !filter.relationTypes?.length || filter.relationTypes.includes(s.predicateCode))
      .filter((s) => s.relatedStartYear == null || inYearRange(s.relatedStartYear, filter.startYear, filter.endYear))
      .map(statementToNode)
      .filter((n): n is TimelineNode => n !== null);
  }

  const merged =
    sourceMode === 'AUTO'
      ? autoNodes
      : [...manualNodes, ...autoNodes.filter((a) => !manualNodes.some((m) => m.eventId === a.eventId))];

  const sortOrder = block.displayConfig?.sortOrder || 'CHRONOLOGICAL';
  merged.sort((a, b) => {
    const diff = Number(a.year) - Number(b.year);
    return sortOrder === 'REVERSE_CHRONOLOGICAL' ? -diff : diff;
  });

  const maxEvents = block.maxEvents ?? 10;
  return merged.slice(0, maxEvents);
}

/**
 * Thay nội dung của mọi khối "Dữ liệu động" (TIMELINE, RELATED_PEOPLE, RELATED_EVENTS — đệ quy
 * qua SECTION_ROW / STORY_CHAPTER) bằng dữ liệu thật resolve từ `ctx` theo `sourceMode` đã chọn.
 */
export function resolveTimelineBlocks(blocks: LessonBlockItem[], ctx: TimelineResolverContext): LessonBlockItem[] {
  const resolveOne = (block: LessonBlockItem): LessonBlockItem => {
    if (block.type === LessonBlockType.TIMELINE) {
      const tl = block as TimelineBlockData;
      return { ...tl, nodes: resolveTimelineNodes(tl, ctx) };
    }
    if (block.type === LessonBlockType.RELATED_PEOPLE) {
      const rp = block as RelatedPeopleBlockData;
      return { ...rp, people: resolveRelatedPeople(rp, ctx) };
    }
    if (block.type === LessonBlockType.RELATED_EVENTS) {
      const re = block as RelatedEventsBlockData;
      return { ...re, events: resolveRelatedEvents(re, ctx) };
    }
    if (block.type === LessonBlockType.SECTION_ROW) {
      const row = block as RowSectionBlockData;
      return {
        ...row,
        columns: row.columns.map((col) => ({ ...col, blocks: resolveTimelineBlocks(col.blocks, ctx) })),
      };
    }
    if (block.type === LessonBlockType.STORY_CHAPTER) {
      const sc = block as StoryChapterBlockData;
      return {
        ...sc,
        chapters: sc.chapters?.map((ch) => ({ ...ch, blocks: resolveTimelineBlocks(ch.blocks, ctx) })),
      };
    }
    return block;
  };

  return blocks.map(resolveOne);
}
