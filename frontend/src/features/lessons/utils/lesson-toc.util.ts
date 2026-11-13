import { LessonBlockType } from '../types/editor.types';
import {
  LessonBlockItem,
  ResourceLinkBlockData,
  RowSectionBlockData,
  StoryChapterBlockData,
} from '../types/block-builder.types';
import { LessonBlockRegistry } from '../plugins/block-plugin.registry';
import {
  StoryChapterLayoutStrategy,
  getChapterLabel,
} from '../strategies/story-chapter-layout.strategy';

const LEGACY_BLOCK_TYPE_TABLE = 'TABLE';
const FALLBACK_TEXT_BLOCK_ID = 'text_fallback';

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
  const cleanText = (headingData.text || '').replace(/<[^>]*>/g, '').trim();
  if (cleanText) ctx.addTocItem({ id, text: cleanText, level: lvl });
  return `<h${lvl} id="${id}">${cleanText}</h${lvl}>`;
}

function renderTextBlock(block: LessonBlockItem, ctx: TocCompilerContext): string {
  const textData = (block as unknown) as TextBlockPayload;
  const textContent = textData.content || textData.text || '';
  return textContent.replace(/<h([1-3])(\b[^>]*)>(.*?)<\/h\1>/gi, (_orig, lvl, attrs, inner) => {
    const id = ctx.nextHeadingId();
    const cleanText = inner.replace(/<[^>]*>/g, '').trim();
    if (cleanText) ctx.addTocItem({ id, text: cleanText, level: parseInt(lvl, 10) });
    return `<h${lvl}${attrs} id="${id}">${inner}</h${lvl}>`;
  });
}

function renderStoryChapterBlock(
  block: LessonBlockItem,
  level: number,
  ctx: TocCompilerContext,
): string {
  const sc = block as StoryChapterBlockData;
  const chapters = StoryChapterLayoutStrategy.normalizeStoryChapters(sc)
    .slice()
    .sort((a, b) => a.order - b.order);

  const anchorNum = ctx.nextAnchorId();
  const storyRootId = `story-root-${block.id || anchorNum}`;
  const storyTitle = sc.storyTitle?.trim() || 'Câu chuyện lịch sử';

  // 1. Mục cha (level 1): Tiêu đề câu chuyện
  ctx.addTocItem({
    id: storyRootId,
    text: storyTitle,
    level: level,
  });

  // 2. Các mục con (level 2): Từng chương (Chương I, Chương II...)
  chapters.forEach((ch, idx) => {
    const chapterLabel = getChapterLabel(idx);
    const chapTitle = ch.title?.trim() || `Chương ${idx + 1}`;
    ctx.addTocItem({
      id: `story-chap-${ch.id}`,
      text: `${chapterLabel}: ${chapTitle}`,
      level: level + 1,
    });
  });

  const html = LessonBlockRegistry.blockToHtml(block);
  return `<div id="${storyRootId}">${html}</div>`;
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

  if (block.type === LessonBlockType.STORY_CHAPTER) {
    return renderStoryChapterBlock(block, level, ctx);
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
  const colsHtml = row.columns
    .map((col) => {
      const inner = col.blocks.map((b) => renderBlockWithAnchor(b, 2, ctx)).join('\n');
      return `<div class="hisgo-column flex-1 min-w-0 space-y-3">${
        inner || '<p class="text-slate-400 italic text-xs">Cột trống</p>'
      }</div>`;
    })
    .join('\n');
  return `<div class="hisgo-row-section my-6 w-full flex flex-col md:grid gap-4" style="grid-template-columns: ${row.columns
    .map((c) => `${c.widthPercent}%`)
    .join(' ')};">${colsHtml}</div>`;
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
