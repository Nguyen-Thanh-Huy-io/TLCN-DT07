import { LessonBlockType } from '../types/editor.types';
import {
  LessonBlockItem,
  ResourceLinkBlockData,
  RowSectionBlockData,
} from '../types/block-builder.types';
import { LEGACY_BLOCK_TYPE_STORY_CHAPTER } from '../constants/lesson.constants';
import { LessonBlockRegistry } from '../plugins/block-plugin.registry';
import {
  RowLayoutStrategy,
  migrateLegacyStoryChapterToBlocks,
} from '../strategies/row-layout.strategy';

const LEGACY_BLOCK_TYPE_TABLE = 'TABLE';
const FALLBACK_TEXT_BLOCK_ID = 'text_fallback';
const FOOTNOTE_TAG_REGEX = /<sup\b[^>]*data-footnote[^>]*>[\s\S]*?<\/sup>/gi;

function stripHtmlForToc(html: string): string {
  return html.replace(FOOTNOTE_TAG_REGEX, '').replace(/<[^>]*>/g, '').trim();
}

type HeadingBlockPayload = {
  type?: LessonBlockType | string;
  level?: number;
  text?: string;
  title?: string;
  content?: string;
  [key: string]: unknown;
};

type TextBlockPayload = {
  type?: LessonBlockType | string;
  content?: string;
  text?: string;
  [key: string]: unknown;
};

interface RawBlocksContainer {
  blocks?: unknown[];
}

function parseStringContentToBlocks(rawContent: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(rawContent);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && typeof parsed === 'object' && 'blocks' in parsed && Array.isArray((parsed as RawBlocksContainer).blocks)) {
      return (parsed as RawBlocksContainer).blocks || [];
    }
    return [{ id: FALLBACK_TEXT_BLOCK_ID, type: LessonBlockType.TEXT, content: rawContent }];
  } catch {
    return [{ id: FALLBACK_TEXT_BLOCK_ID, type: LessonBlockType.TEXT, content: rawContent }];
  }
}

function extractRawBlockItems(rawContent: unknown): unknown[] {
  if (Array.isArray(rawContent)) {
    return rawContent;
  }
  if (
    rawContent &&
    typeof rawContent === 'object' &&
    'blocks' in rawContent &&
    Array.isArray((rawContent as RawBlocksContainer).blocks)
  ) {
    return (rawContent as RawBlocksContainer).blocks || [];
  }
  if (typeof rawContent === 'string' && rawContent.trim().length > 0) {
    return parseStringContentToBlocks(rawContent);
  }
  return [];
}

/**
 * Chuẩn hóa `content` thô (mảng khối JSON, chuỗi JSON, hoặc chuỗi HTML cũ) thành danh sách
 * khối + tách riêng khối Liên kết tài nguyên.
 */
export function normalizeContentToBlocks(rawContent: unknown): {
  blocks: LessonBlockItem[];
  resourceLinks: ResourceLinkBlockData[];
} {
  const items = extractRawBlockItems(rawContent);
  const blocks: LessonBlockItem[] = [];
  const resourceLinks: ResourceLinkBlockData[] = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const itemRecord = item as Record<string, unknown>;
    const rawType = String(itemRecord.type || '').toUpperCase();
    if (rawType === LEGACY_BLOCK_TYPE_STORY_CHAPTER) {
      blocks.push(...migrateLegacyStoryChapterToBlocks(itemRecord));
      continue;
    }
    const normalizedType =
      rawType === LEGACY_BLOCK_TYPE_TABLE ? LessonBlockType.COMPARISON_TABLE : (rawType as LessonBlockType);

    const normalizedItem: LessonBlockItem = {
      ...itemRecord,
      type: normalizedType,
    } as unknown as LessonBlockItem;

    if (normalizedType === LessonBlockType.RESOURCE_LINK) {
      resourceLinks.push(normalizedItem as unknown as ResourceLinkBlockData);
    } else {
      blocks.push(normalizedItem);
    }
  }
  return { blocks, resourceLinks };
}

export interface LessonTocEntry {
  id: string;
  text: string;
  level: number;
}

/** Nhãn hiển thị trong Mục lục cho các loại khối KHÔNG dùng thẻ <h1-h3> */
function getBlockTocLabel(block: LessonBlockItem): string | null {
  switch (block.type) {
    case LessonBlockType.TIMELINE:
      return block.title?.trim() || 'Dòng thời gian';
    case LessonBlockType.CHARACTER:
      return `Nhân vật: ${block.name}`;
    case LessonBlockType.EVENT:
      return `Sự kiện: ${block.title}`;
    case LessonBlockType.MAP:
      return `Bản đồ: ${block.locationName}`;
    case LessonBlockType.COMPARISON_TABLE:
      return block.title?.trim() || 'Bảng so sánh';
    case LessonBlockType.QUIZ:
      return 'Câu hỏi tự kiểm tra nhanh';
    default:
      return null;
  }
}

interface TocCompilerContext {
  addTocItem: (entry: LessonTocEntry) => void;
  nextHeadingId: () => string;
  nextAnchorId: () => number;
}

function renderHeadingBlock(block: LessonBlockItem, ctx: TocCompilerContext): string {
  const id = ctx.nextHeadingId();
  const headingData = (block as unknown) as HeadingBlockPayload;
  const lvl =
    headingData.level && headingData.level >= 1 && headingData.level <= 6
      ? headingData.level
      : 2;
  const cleanText = stripHtmlForToc(headingData.text || '');
  if (cleanText) ctx.addTocItem({ id, text: cleanText, level: lvl });
  return `<h${lvl} id="${id}">${cleanText}</h${lvl}>`;
}

function renderTextBlock(block: LessonBlockItem, ctx: TocCompilerContext): string {
  const textData = (block as unknown) as TextBlockPayload;
  const textContent = textData.content || textData.text || '';
  return textContent.replace(/<h([1-3])(\b[^>]*)>(.*?)<\/h\1>/gi, (_orig, lvl, attrs, inner) => {
    const id = ctx.nextHeadingId();
    const cleanText = stripHtmlForToc(inner);
    if (cleanText) ctx.addTocItem({ id, text: cleanText, level: parseInt(lvl, 10) });
    return `<h${lvl}${attrs} id="${id}">${inner}</h${lvl}>`;
  });
}

function renderBlockWithAnchor(
  block: LessonBlockItem,
  level: number,
  ctx: TocCompilerContext,
): string {
  if (block.type === LessonBlockType.HEADING) {
    return renderHeadingBlock(block, ctx);
  }

  if (block.type === LessonBlockType.TEXT) {
    return renderTextBlock(block, ctx);
  }

  const html = LessonBlockRegistry.blockToHtml(block);
  const label = getBlockTocLabel(block);
  if (!label) return html;

  const anchorNum = ctx.nextAnchorId();
  const id = `block-anchor-${anchorNum}`;
  ctx.addTocItem({ id, text: label, level });
  return `<div id="${id}">${html}</div>`;
}

function renderRowSectionBlock(row: RowSectionBlockData, ctx: TocCompilerContext): string {
  return RowLayoutStrategy.compileRowToHtml(row, (b) => renderBlockWithAnchor(b, 2, ctx));
}

/**
 * Biên dịch danh sách Khối (Block Builder) thành (1) Mục lục đầy đủ và (2) chuỗi HTML xem trước.
 */
export function buildLessonTocAndHtml(
  blocks: LessonBlockItem[],
): { tocItems: LessonTocEntry[]; html: string } {
  const tocItems: LessonTocEntry[] = [];
  let headingCount = 0;
  let anchorCount = 0;

  const ctx: TocCompilerContext = {
    addTocItem: (entry) => tocItems.push(entry),
    nextHeadingId: () => {
      headingCount++;
      return `heading-${headingCount}`;
    },
    nextAnchorId: () => {
      anchorCount++;
      return anchorCount;
    },
  };

  const htmlParts = blocks.map((block) => {
    if (block.type === LessonBlockType.SECTION_ROW) {
      return renderRowSectionBlock(block as RowSectionBlockData, ctx);
    }
    return renderBlockWithAnchor(block, 1, ctx);
  });

  return { tocItems, html: htmlParts.join('\n') };
}
