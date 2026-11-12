'use client';

import React from 'react';
import { X, ImagePlus, Trash2, Upload } from 'lucide-react';
import {
  TextBlockData,
  ImageBlockData,
  QuoteBlockData,
  EditorialMediaRatio,
} from '../../../types/block-builder.types';
import { LessonBlockType } from '../../../types/block-palette.types';
import { TipTapContent } from '../../TipTapContent';
import { StoryChapterContentBlockProps } from './types';
import { EditorialSubElementType } from '../../../context/ActiveEditorContext';
import {
  ChapterBlockZoneEnum,
  EditorialMediaRatioEnum,
} from '@/constants/lesson-builder.constant';

const QUOTE_STYLE_BORDER_LEFT = 'BORDER_LEFT';
const QUOTE_STYLE_CLASSIC = 'CLASSIC_QUOTES';
const CAPTION_POS_OVERLAY = 'OVERLAY';
const CAPTION_POS_BOTTOM = 'BOTTOM';

const HOVER_DARK_BG = 'hover:bg-stone-800';
const ACTIVE_LIGHT_BADGE = 'bg-white text-stone-900 font-bold';
const ACTIVE_BLUE_BADGE = 'bg-blue-600 font-bold';
const CLOSE_BTN_CLASS =
  'absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-stone-200 text-stone-400 hover:text-rose-600 flex items-center justify-center opacity-0 group-hover/cblock:opacity-100 transition-opacity cursor-pointer z-10';

function handleUploadImageFile(
  file: File | undefined,
  onLoaded: (dataUrl: string) => void
) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      onLoaded(reader.result);
    }
  };
  reader.readAsDataURL(file);
}

function IntroBlockRenderer(props: StoryChapterContentBlockProps) {
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

function ArticleBlockRenderer(props: StoryChapterContentBlockProps) {
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

function QuoteBlockRenderer(props: StoryChapterContentBlockProps) {
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

function ImageBlockRenderer(props: StoryChapterContentBlockProps) {
  const {
    chapter,
    chapterNumber,
    block,
    zone,
    blocksCount,
    effectiveImageRatio,
    mediaAspectClass,
    imageFitClass,
    effectiveCaptionPos,
    openImageBlockId,
    setDraggedBlockId,
    setOpenImageBlockId,
    onDropBlockOnTarget,
    onUpdateChildBlock,
    onRemoveChildBlock,
    onSelectSub,
    isSubSelected,
    getSubRingClass,
    onUpdateChapterOverride,
  } = props;

  const imgBlock = block as ImageBlockData;
  const isImgOpen = openImageBlockId === block.id;

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
          EditorialSubElementType.MAIN_IMAGE,
          `${chapterNumber} • Khối Hình ảnh (Image Block)`,
          chapter.id
        )
      }
      className={`relative group/cblock space-y-2 pt-1 cursor-pointer ${getSubRingClass(
        EditorialSubElementType.MAIN_IMAGE,
        chapter.id
      )}`}
    >
      {isSubSelected(EditorialSubElementType.MAIN_IMAGE, chapter.id) && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-stone-900 text-white text-[11px] font-sans shadow-md mb-1"
        >
          {(
            [
              { id: EditorialMediaRatioEnum.RATIO_16_10, label: '16:10' },
              { id: EditorialMediaRatioEnum.RATIO_4_3, label: '4:3' },
              { id: EditorialMediaRatioEnum.RATIO_21_9, label: '21:9' },
              { id: EditorialMediaRatioEnum.AUTO, label: 'Tự nhiên' },
            ] as Array<{ id: EditorialMediaRatio; label: string }>
          ).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() =>
                onUpdateChapterOverride('mainImage', { ratio: r.id })
              }
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                effectiveImageRatio === r.id ? ACTIVE_BLUE_BADGE : HOVER_DARK_BG
              }`}
            >
              {r.label}
            </button>
          ))}
          <span className="text-stone-500">|</span>
          {(
            [
              { id: 'COVER', label: 'Lấp đầy' },
              { id: 'CONTAIN', label: 'Vừa khung' },
            ] as const
          ).map((fit) => (
            <button
              key={fit.id}
              type="button"
              onClick={() =>
                onUpdateChapterOverride('mainImage', { imageFit: fit.id })
              }
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                chapter.overrides?.mainImage?.imageFit === fit.id
                  ? ACTIVE_LIGHT_BADGE
                  : HOVER_DARK_BG
              }`}
            >
              {fit.label}
            </button>
          ))}
        </div>
      )}
      <figure className="relative group/fig rounded-lg overflow-hidden bg-stone-200/70 border border-stone-300/80">
        {imgBlock.src ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imgBlock.src}
            alt={imgBlock.alt || imgBlock.caption || chapter.title}
            className={`w-full ${mediaAspectClass} ${imageFitClass}`}
          />
        ) : (
          <div
            onClick={() => setOpenImageBlockId(block.id)}
            className={`w-full ${mediaAspectClass} bg-gradient-to-br from-stone-200 via-[#e7dfd3] to-stone-300 flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:opacity-95 transition-opacity`}
          >
            <ImagePlus className="w-8 h-8 text-stone-700 mb-2" />
            <span className="text-sm font-serif font-bold text-stone-800">
              Nhấp để chỉnh sửa hoặc đính kèm ảnh tư liệu
            </span>
            <span className="text-xs text-stone-600 mt-1">
              Tỷ lệ khung ảnh: {effectiveImageRatio.replace('_', ':')}
            </span>
          </div>
        )}

        {effectiveCaptionPos === CAPTION_POS_OVERLAY && imgBlock.caption && (
          <figcaption className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 to-transparent text-white text-xs italic px-4 py-2.5">
            {imgBlock.caption}
          </figcaption>
        )}

        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover/fig:opacity-100 transition-opacity font-sans">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenImageBlockId(isImgOpen ? null : block.id);
            }}
            className="px-3 py-1.5 rounded-lg bg-stone-900/85 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            <span>{imgBlock.src ? 'Đổi ảnh' : 'Chọn ảnh'}</span>
          </button>
          {blocksCount > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveChildBlock(block.id);
              }}
              title="Xóa khối ảnh này"
              className="p-1.5 rounded-lg bg-stone-900/85 text-white hover:bg-rose-700 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </figure>

      {effectiveCaptionPos === CAPTION_POS_BOTTOM &&
        chapter.config?.media.showCaption !== false && (
          <input
            type="text"
            value={imgBlock.caption || ''}
            onChange={(e) =>
              onUpdateChildBlock(block.id, { caption: e.target.value })
            }
            placeholder="Nhập chú thích ảnh tư liệu (tùy chọn)..."
            className="w-full text-xs italic text-stone-600 bg-transparent border-b border-transparent focus:border-stone-900 focus:outline-none py-0.5"
          />
        )}

      {isImgOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="p-3 bg-white border border-stone-300 rounded-xl space-y-2 font-sans shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Đường dẫn hoặc tải ảnh tư liệu ({chapterNumber})
            </span>
            <button
              type="button"
              onClick={() => setOpenImageBlockId(null)}
              className="text-stone-600 hover:text-stone-950 p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={imgBlock.src || ''}
              onChange={(e) =>
                onUpdateChildBlock(block.id, { src: e.target.value })
              }
              placeholder="Dán đường dẫn ảnh (https://...)"
              className="flex-1 min-w-[180px] text-sm px-3 py-1.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
            />
            <label className="px-3 py-1.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>Tải ảnh lên</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleUploadImageFile(e.target.files?.[0], (url) =>
                    onUpdateChildBlock(block.id, { src: url })
                  )
                }
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export function StoryChapterContentBlock(props: StoryChapterContentBlockProps) {
  const {
    chapterNumber,
    block,
    zone,
    onRemoveChildBlock,
    onUpdateChildBlock,
    onSelectSub,
    renderNestedBlock,
  } = props;

  // 1. Khối Văn bản (TEXT) ở Cột Trái -> Render phong cách Mở đầu + Drop Cap tạp chí
  if (block.type === LessonBlockType.TEXT && zone === ChapterBlockZoneEnum.LEFT) {
    return <IntroBlockRenderer {...props} />;
  }

  // 2. Khối Văn bản (TEXT) ở Cột Phải -> Render bài viết Rich Text chia cột tạp chí
  if (block.type === LessonBlockType.TEXT && zone !== ChapterBlockZoneEnum.LEFT) {
    return <ArticleBlockRenderer {...props} />;
  }

  // 3. Khối Trích dẫn (QUOTE) -> Render phong cách Pull Quote tạp chí
  if (block.type === LessonBlockType.QUOTE) {
    return <QuoteBlockRenderer {...props} />;
  }

  // 4. Khối Hình ảnh (IMAGE) -> Render khung ảnh tạp chí theo tỷ lệ Media
  if (block.type === LessonBlockType.IMAGE) {
    return <ImageBlockRenderer {...props} />;
  }

  // 5. Các ContentBlock khác (HEADING, CALLOUT, CHARACTER, EVENT, DIVIDER...)
  if (renderNestedBlock) {
    return (
      <div
        key={block.id}
        onClick={(e) =>
          onSelectSub(
            e,
            EditorialSubElementType.NESTED_BLOCK,
            `${chapterNumber} • Khối nội dung con`,
            block.id
          )
        }
        className="relative group/cblock rounded-xl border border-stone-200/80 bg-white/70 p-3"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveChildBlock(block.id);
          }}
          title="Xóa khối này khỏi chương"
          className="absolute top-2 right-2 w-6 h-6 rounded-md bg-white border border-stone-200 text-stone-500 hover:text-rose-600 flex items-center justify-center opacity-0 group-hover/cblock:opacity-100 transition-opacity cursor-pointer z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        {renderNestedBlock(block, (updates) =>
          onUpdateChildBlock(block.id, updates)
        )}
      </div>
    );
  }

  return null;
}
