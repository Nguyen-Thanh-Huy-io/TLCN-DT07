import { LessonBlockType } from '../types/block-palette.types';
import {
  LessonBlockItem,
  ResourceLinkBlockData,
  RowSectionBlockData,
  StoryChapterBlockData,
} from '../types/block-builder.types';
import { LessonBlockFactory } from '../factories/lesson-block.factory';
import {
  StoryChapterLayoutStrategy,
  getChapterLabel,
} from '../strategies/story-chapter-layout.strategy';

/**
 * Chuẩn hóa `content` thô (mảng khối JSON, chuỗi JSON, hoặc chuỗi HTML cũ) thành danh sách
 * khối + tách riêng khối Liên kết tài nguyên — dùng chung cho mọi nơi hiển thị nội dung dạng
 * khối công khai (bài học, tiểu sử nhân vật...), không chỉ riêng Lesson.
 */
export function normalizeContentToBlocks(rawContent: unknown): {
  blocks: LessonBlockItem[];
  resourceLinks: ResourceLinkBlockData[];
} {
  let items: any[] = [];
  if (Array.isArray(rawContent)) {
    items = rawContent;
  } else if (rawContent && typeof rawContent === 'object' && Array.isArray((rawContent as any).blocks)) {
    items = (rawContent as any).blocks;
  } else if (typeof rawContent === 'string' && rawContent.trim().length > 0) {
    try {
      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.blocks)) {
        items = parsed.blocks;
      } else {
        items = [{ id: 'text_fallback', type: LessonBlockType.TEXT, content: rawContent }];
      }
    } catch {
      items = [{ id: 'text_fallback', type: LessonBlockType.TEXT, content: rawContent }];
    }
  }

  const blocks: LessonBlockItem[] = [];
  const resourceLinks: ResourceLinkBlockData[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const rawType = String(item.type || '').toUpperCase();
    let normalizedType = rawType as LessonBlockType;
    if (rawType === 'TABLE') normalizedType = LessonBlockType.COMPARISON_TABLE;

    const normalizedItem = {
      ...item,
      type: normalizedType,
    };

    if (normalizedType === LessonBlockType.RESOURCE_LINK) {
      resourceLinks.push(normalizedItem as ResourceLinkBlockData);
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

/** Nhãn hiển thị trong Mục lục cho các loại khối KHÔNG dùng thẻ <h1-h3> (Timeline, Nhân
 * vật, Sự kiện, Bản đồ, Bảng so sánh...) — khối Văn bản tự tách mục theo từng heading bên
 * trong, nên không cần nhãn ở đây. Trả về `null` nghĩa là khối đó không cần mục lục riêng
 * (Hình ảnh, Video, Liên kết tài nguyên, Câu hỏi ôn tập cũ...). */
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

/**
 * Biên dịch danh sách Khối (Block Builder) thành (1) Mục lục đầy đủ — gộp cả tiêu đề
 * trong khối Văn bản VÀ nhãn đại diện cho các loại khối khác (Timeline/Nhân vật/Sự
 * kiện/Bản đồ/Bảng so sánh) — và (2) chuỗi HTML xem trước có gắn id neo khớp với từng
 * mục lục, để bấm vào Mục lục cuộn đúng tới khối tương ứng.
 *
 * Thay cho cách cũ (dò thẻ <h1-h3> bằng regex trên `contentRichText` đã biên dịch sẵn):
 * cách đó CHỈ bắt được tiêu đề trong khối Văn bản, bỏ sót mọi khối khác — khiến Mục lục
 * một bài học nhiều loại khối chỉ có 1-2 mục dù nội dung rất dài.
 */
export function buildLessonTocAndHtml(
  blocks: LessonBlockItem[]
): { tocItems: LessonTocEntry[]; html: string } {
  const tocItems: LessonTocEntry[] = [];
  let headingCount = 0;
  let anchorCount = 0;

  // Khối Văn bản: tách từng <h1-3> bên trong làm 1 mục riêng, gắn id neo cho từng heading
  const renderTextBlock = (content: string): string => {
    return content.replace(/<h([1-3])(\b[^>]*)>(.*?)<\/h\1>/gi, (_orig, lvl, attrs, inner) => {
      headingCount++;
      const id = `heading-${headingCount}`;
      const cleanText = inner.replace(/<[^>]*>/g, '').trim();
      if (cleanText) tocItems.push({ id, text: cleanText, level: parseInt(lvl, 10) });
      return `<h${lvl}${attrs} id="${id}">${inner}</h${lvl}>`;
    });
  };

  // Mọi khối khác: bọc id neo quanh HTML đã biên dịch của khối đó, gắn kèm mục lục tương ứng
  const renderBlockWithAnchor = (block: LessonBlockItem, level: number): string => {
    // Khối Tiêu đề (HEADING): tự sinh thẻ h và đưa vào Mục lục
    if (block.type === LessonBlockType.HEADING) {
      headingCount++;
      const id = `heading-${headingCount}`;
      const headingData = block as any;
      const lvl =
        headingData.level && headingData.level >= 1 && headingData.level <= 6
          ? headingData.level
          : 2;
      const cleanText = (headingData.text || '').replace(/<[^>]*>/g, '').trim();
      if (cleanText) tocItems.push({ id, text: cleanText, level: lvl });
      return `<h${lvl} id="${id}">${cleanText}</h${lvl}>`;
    }

    if (block.type === LessonBlockType.TEXT) {
      const textContent =
        (block as any).content || (block as any).text || '';
      return renderTextBlock(textContent);
    }

    // Khối Câu chuyện lịch sử (STORY_CHAPTER): Đưa cả Tiêu đề câu chuyện và từng Chương vào Mục lục
    if (block.type === LessonBlockType.STORY_CHAPTER) {
      const sc = block as StoryChapterBlockData;
      const chapters = StoryChapterLayoutStrategy.normalizeStoryChapters(sc)
        .slice()
        .sort((a, b) => a.order - b.order);

      anchorCount++;
      const storyRootId = `story-root-${block.id || anchorCount}`;
      const storyTitle = sc.storyTitle?.trim() || 'Câu chuyện lịch sử';

      // 1. Mục cha (level 1): Tiêu đề câu chuyện
      tocItems.push({
        id: storyRootId,
        text: storyTitle,
        level: level,
      });

      // 2. Các mục con (level 2): Từng chương (Chương I, Chương II...)
      chapters.forEach((ch, idx) => {
        const chapterLabel = getChapterLabel(idx);
        const chapTitle = ch.title?.trim() || `Chương ${idx + 1}`;
        tocItems.push({
          id: `story-chap-${ch.id}`,
          text: `${chapterLabel}: ${chapTitle}`,
          level: level + 1,
        });
      });

      const html = LessonBlockFactory.blockToHtml(block);
      return `<div id="${storyRootId}">${html}</div>`;
    }

    const html = LessonBlockFactory.blockToHtml(block);
    const label = getBlockTocLabel(block);
    if (!label) return html;

    anchorCount++;
    const id = `block-anchor-${anchorCount}`;
    tocItems.push({ id, text: label, level });
    return `<div id="${id}">${html}</div>`;
  };

  const htmlParts = blocks.map((block) => {
    if (block.type === LessonBlockType.SECTION_ROW) {
      const row = block as RowSectionBlockData;
      const colsHtml = row.columns
        .map((col) => {
          const inner = col.blocks.map((b) => renderBlockWithAnchor(b, 2)).join('\n');
          return `<div class="hisgo-column flex-1 min-w-0 space-y-3">${
            inner || '<p class="text-slate-400 italic text-xs">Cột trống</p>'
          }</div>`;
        })
        .join('\n');
      return `<div class="hisgo-row-section my-6 w-full flex flex-col md:grid gap-4" style="grid-template-columns: ${row.columns
        .map((c) => `${c.widthPercent}%`)
        .join(' ')};">${colsHtml}</div>`;
    }
    return renderBlockWithAnchor(block, 1);
  });

  return { tocItems, html: htmlParts.join('\n') };
}
