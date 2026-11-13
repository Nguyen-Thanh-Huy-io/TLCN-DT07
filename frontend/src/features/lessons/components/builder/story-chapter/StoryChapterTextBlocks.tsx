'use client';

import { X } from 'lucide-react';
import { TextBlockData, QuoteBlockData } from '../../../types/block-builder.types';
import { TipTapContent } from '../../TipTapContent';
import { EditorialSubElementType } from '../../../context/ActiveEditorContext';
import type { StoryChapterContentBlockProps } from './StoryChapterRenderer';

export const QUOTE_STYLE_BORDER_LEFT = 'BORDER_LEFT';

export const QUOTE_STYLE_CLASSIC = 'CLASSIC_QUOTES';

export const HOVER_DARK_BG = 'hover:bg-stone-800';

export const ACTIVE_LIGHT_BADGE = 'bg-white text-stone-900 font-bold';

export const ACTIVE_BLUE_BADGE = 'bg-blue-600 font-bold';

export const CLOSE_BTN_CLASS =
  'absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-stone-200 text-stone-400 hover:text-rose-600 flex items-center justify-center opacity-0 group-hover/cblock:opacity-100 transition-opacity cursor-pointer z-10';

export function IntroBlockRenderer(props: StoryChapterContentBlockProps) {
  const {
    chapter,
    chapterNumber,
    block,
    zone,
    indexInZone,
    lineHeightVal,
    introFontSizePx,
    isIntroDropCap,
    introDropCapColor,
    setDraggedBlockId,
    onDropBlockOnTarget,
    onUpdateChildBlock,
    onSelectSub,
    isSubSelected,
    getSubRingClass,
    onUpdateChapterOverride,
  } = props;

  const textBlock = block as TextBlockData;
  const plainText = (textBlock.content || '').replace(/<[^>]+>/g, '').trim();
  const firstLetter = (plainText.charAt(0) || 'N').toUpperCase();

  return (
    <div
      key={block.id}
      draggable
      onDragStart={() => setDraggedBlockId(block.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDropBlockOnTarget(block.id, zone)}
      onClick={(e) =>
        onSelectSub(
          e,
          EditorialSubElementType.INTRO_TEXT,
          `${chapterNumber} • Khối Mở đầu (Drop Cap)`,
          chapter.id
        )
      }
      className={`relative group/cblock space-y-3 text-stone-800 cursor-pointer ${getSubRingClass(
        EditorialSubElementType.INTRO_TEXT,
        chapter.id
      )}`}
      style={{
        fontSize: `${introFontSizePx}px`,
        lineHeight: lineHeightVal,
        color: chapter.overrides?.intro?.textColor || undefined,
      }}
    >
      {isSubSelected(EditorialSubElementType.INTRO_TEXT, chapter.id) && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-stone-900 text-white text-[11px] font-sans shadow-md mb-1"
        >
          <button
            type="button"
            onClick={() =>
              onUpdateChapterOverride('intro', { dropCap: !isIntroDropCap })
            }
            className={`px-2 py-0.5 rounded cursor-pointer font-semibold ${
              isIntroDropCap ? 'bg-blue-600' : HOVER_DARK_BG
            }`}
          >
            Drop Cap
          </button>
          <span className="text-stone-500">|</span>
          {[
            { label: 'Nhỏ', px: 14 },
            { label: 'Vừa', px: 16 },
            { label: 'Lớn', px: 18 },
          ].map((s) => (
            <button
              key={s.px}
              type="button"
              onClick={() =>
                onUpdateChapterOverride('intro', { fontSizePx: s.px })
              }
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                introFontSizePx === s.px ? ACTIVE_LIGHT_BADGE : HOVER_DARK_BG
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {isIntroDropCap && indexInZone === 0 && (
        <div
          aria-hidden="true"
          className="font-serif font-bold text-[76px] leading-[0.82] tracking-tight select-none pt-1"
          style={{ color: introDropCapColor }}
        >
          {firstLetter}
        </div>
      )}

      <div className="font-serif">
        <TipTapContent
          value={
            textBlock.content ||
            '<p>Nhập đoạn mở đầu dẫn nhập bối cảnh lịch sử...</p>'
          }
          onChange={(html: string) => onUpdateChildBlock(block.id, { content: html })}
          compact={true}
          remoteToolbarOnly={true}
          minHeightClass="min-h-[90px]"
          placeholder="Nhập đoạn dẫn nhập mở đầu chương..."
        />
      </div>
    </div>
  );
}

export function ArticleBlockRenderer(props: StoryChapterContentBlockProps) {
  const {
    chapter,
    chapterNumber,
    block,
    zone,
    blocksCount,
    lineHeightVal,
    articleColWrapperClass,
    articleFontSizePx,
    articleCols,
    setDraggedBlockId,
    onDropBlockOnTarget,
    onUpdateChildBlock,
    onRemoveChildBlock,
    onSelectSub,
    isSubSelected,
    getSubRingClass,
    onUpdateChapterConfig,
    onUpdateChapterOverride,
  } = props;

  const textBlock = block as TextBlockData;
  return (
    <div
      key={block.id}
      draggable
      onDragStart={() => setDraggedBlockId(block.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDropBlockOnTarget(block.id, zone)}
      onClick={(e) =>
        onSelectSub(
          e,
          EditorialSubElementType.ARTICLE_TEXT,
          `${chapterNumber} • Khối Văn bản chính (Rich Text)`,
          chapter.id
        )
      }
      className={`relative group/cblock cursor-pointer ${articleColWrapperClass} ${
        chapter.overrides?.article?.dropCap ? 'editorial-slot-dropcap' : ''
      } ${getSubRingClass(EditorialSubElementType.ARTICLE_TEXT, chapter.id)}`}
      style={{
        fontSize: `${articleFontSizePx}px`,
        lineHeight: lineHeightVal,
      }}
    >
      {isSubSelected(EditorialSubElementType.ARTICLE_TEXT, chapter.id) && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-stone-900 text-white text-[11px] font-sans shadow-md mb-2"
        >
          {(
            [
              { id: 'SERIF', label: 'Serif' },
              { id: 'SANS', label: 'Sans' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() =>
                onUpdateChapterConfig('typography', { bodyFont: f.id })
              }
              className={`px-2 py-0.5 rounded cursor-pointer ${
                chapter.config?.typography.bodyFont === f.id
                  ? ACTIVE_BLUE_BADGE
                  : HOVER_DARK_BG
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="text-stone-500">|</span>
          {[
            { label: 'Nhỏ', px: 14 },
            { label: 'Vừa', px: 16 },
            { label: 'Lớn', px: 18 },
          ].map((s) => (
            <button
              key={s.px}
              type="button"
              onClick={() =>
                onUpdateChapterOverride('article', { fontSizePx: s.px })
              }
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                articleFontSizePx === s.px ? ACTIVE_LIGHT_BADGE : HOVER_DARK_BG
              }`}
            >
              {s.label}
            </button>
          ))}
          <span className="text-stone-500">|</span>
          {([1, 2] as const).map((colNum) => (
            <button
              key={colNum}
              type="button"
              onClick={() =>
                onUpdateChapterOverride('article', { textColumns: colNum })
              }
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                articleCols === colNum ? ACTIVE_BLUE_BADGE : HOVER_DARK_BG
              }`}
            >
              {colNum} cột
            </button>
          ))}
        </div>
      )}
      {blocksCount > 2 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveChildBlock(block.id);
          }}
          title="Xóa khối văn bản này"
          className={CLOSE_BTN_CLASS}
        >
          <X className="w-3 h-3" />
        </button>
      )}
      <TipTapContent
        value={
          textBlock.content ||
          '<p>Nhập nội dung bối cảnh và diễn biến lịch sử tại đây...</p>'
        }
        onChange={(html: string) => onUpdateChildBlock(block.id, { content: html })}
        compact={true}
        remoteToolbarOnly={true}
        minHeightClass="min-h-[76px]"
        placeholder="Nhập nội dung bài viết của chương..."
      />
    </div>
  );
}

export function QuoteBlockRenderer(props: StoryChapterContentBlockProps) {
  const {
    chapter,
    chapterNumber,
    block,
    zone,
    blocksCount,
    effectiveQuoteStyle,
    quoteAccentColor,
    quoteFontSizePx,
    setDraggedBlockId,
    onDropBlockOnTarget,
    onUpdateChildBlock,
    onRemoveChildBlock,
    onSelectSub,
    isSubSelected,
    getSubRingClass,
    onUpdateChapterOverride,
  } = props;

  const quoteBlock = block as QuoteBlockData;
  const isBorderLeft = effectiveQuoteStyle === QUOTE_STYLE_BORDER_LEFT;

  return (
    <div
      key={block.id}
      draggable
      onDragStart={() => setDraggedBlockId(block.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDropBlockOnTarget(block.id, zone)}
      onClick={(e) =>
        onSelectSub(
          e,
          EditorialSubElementType.PULL_QUOTE,
          `${chapterNumber} • Khối Trích dẫn (Quote Block)`,
          chapter.id
        )
      }
      className={`relative group/cblock space-y-2 cursor-pointer ${
        isBorderLeft ? 'border-l-4 pl-4' : ''
      } ${getSubRingClass(EditorialSubElementType.PULL_QUOTE, chapter.id)}`}
      style={isBorderLeft ? { borderColor: quoteAccentColor } : undefined}
    >
      {isSubSelected(EditorialSubElementType.PULL_QUOTE, chapter.id) && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-stone-900 text-white text-[11px] font-sans shadow-md mb-1"
        >
          {(
            [
              { id: 'CLASSIC_QUOTES', label: 'Ngoặc kép' },
              { id: 'BORDER_LEFT', label: 'Viền dọc' },
              { id: 'MINIMAL', label: 'Tối giản' },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() =>
                onUpdateChapterOverride('pullQuote', { style: st.id })
              }
              className={`px-2 py-0.5 rounded cursor-pointer ${
                effectiveQuoteStyle === st.id ? ACTIVE_BLUE_BADGE : HOVER_DARK_BG
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      )}
      {blocksCount > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveChildBlock(block.id);
          }}
          title="Xóa khối trích dẫn này"
          className={CLOSE_BTN_CLASS}
        >
          <X className="w-3 h-3" />
        </button>
      )}
      {effectiveQuoteStyle === QUOTE_STYLE_CLASSIC && (
        <div
          aria-hidden="true"
          className="font-serif font-bold text-5xl leading-none select-none"
          style={{ color: quoteAccentColor }}
        >
          “
        </div>
      )}
      <textarea
        rows={3}
        value={quoteBlock.quoteText || ''}
        onChange={(e) =>
          onUpdateChildBlock(block.id, { quoteText: e.target.value })
        }
        placeholder="Nhập câu nói hoặc lời hịch nổi bật..."
        className="w-full font-serif italic font-bold text-stone-900 leading-snug bg-transparent border border-transparent focus:border-stone-800 focus:bg-white/70 focus:outline-none rounded-lg p-1 -mx-1 resize-y"
        style={{ fontSize: `${quoteFontSizePx}px` }}
      />
      <div className="flex items-center gap-2 pt-1">
        <span className="w-6 h-px bg-stone-500 shrink-0" />
        <input
          type="text"
          value={quoteBlock.author || ''}
          onChange={(e) =>
            onUpdateChildBlock(block.id, { author: e.target.value })
          }
          placeholder="Tên nhân vật / Tác giả..."
          className="flex-1 text-sm font-serif text-stone-700 bg-transparent border-b border-transparent focus:border-stone-900 focus:outline-none py-0.5"
        />
      </div>
    </div>
  );
}
