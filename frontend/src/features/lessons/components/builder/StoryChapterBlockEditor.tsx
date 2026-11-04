'use client';

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ImagePlus,
  Upload,
  ScrollText,
  X,
  ArrowUp,
  ArrowDown,
  BookOpen,
  GripVertical,
} from 'lucide-react';
import {
  StoryChapterBlockData,
  StoryChapterUnit,
  LessonBlockItem,
  EditorialSpreadConfig,
  EditorialElementOverrides,
  EditorialColumnRatio,
  EditorialMediaRatio,
  TextBlockData,
  ImageBlockData,
  QuoteBlockData,
  ChapterBlockZone,
} from '../../types/block-builder.types';
import {
  getChapterLabel,
  StoryChapterLayoutStrategy,
  STORY_SUBJECT_TYPE_OPTIONS,
  STORY_CHAPTER_ALLOWED_NESTED_BLOCKS,
} from '../../strategies/story-chapter-layout.strategy';
import { LessonBlockFactory } from '../../factories/lesson-block.factory';
import {
  useActiveEditor,
  EditorialSubElementType,
} from '../../context/ActiveEditorContext';
import { TipTapContent } from '../TipTapContent';
import { LessonBlockType } from '../../types/block-palette.types';

interface StoryChapterBlockEditorProps {
  data: StoryChapterBlockData;
  onChange: (updates: Partial<StoryChapterBlockData>) => void;
  renderNestedBlock?: (
    childBlock: LessonBlockItem,
    onUpdateChild: (updates: Partial<LessonBlockItem>) => void
  ) => React.ReactNode;
}

interface StoryChapterRendererProps {
  parentBlockId: string;
  chapter: StoryChapterUnit;
  chapterIndex: number;
  totalChapters: number;
  chapterNumber: string; // Tự động tính từ getChapterLabel(index) -> "CHƯƠNG I", "CHƯƠNG II"...
  isChapterActive: boolean;
  showChapterNumber: boolean;
  showDividers: boolean;
  onSelectChapter: () => void;
  onUpdateChapter: (updates: Partial<StoryChapterUnit>) => void;
  onMoveChapter: (direction: -1 | 1) => void;
  onRemoveChapter: () => void;
  renderNestedBlock?: (
    childBlock: LessonBlockItem,
    onUpdateChild: (updates: Partial<LessonBlockItem>) => void
  ) => React.ReactNode;
}

/**
 * Component con: Render một StoryChapterUnit thuần Container.
 * Không lưu cứng chapterNumber, leadText, contentHtml hay imageUrl trên Chapter,
 * mà render hoàn toàn từ danh sách `chapter.blocks: LessonBlockItem[]` theo bố cục riêng `chapter.config`.
 */
function StoryChapterRenderer({
  parentBlockId,
  chapter,
  chapterIndex,
  totalChapters,
  chapterNumber,
  isChapterActive,
  showChapterNumber,
  showDividers,
  onSelectChapter,
  onUpdateChapter,
  onMoveChapter,
  onRemoveChapter,
  renderNestedBlock,
}: StoryChapterRendererProps) {
  const { activeSubElement, setActiveSubElement, setActiveChapterId } =
    useActiveEditor();

  const [openImageBlockId, setOpenImageBlockId] = useState<string | null>(null);
  const [openAddZone, setOpenAddZone] = useState<ChapterBlockZone | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

  const chapConfig: EditorialSpreadConfig =
    chapter.config ||
    StoryChapterLayoutStrategy.createDefaultEditorialConfig('MAGAZINE_GRID');
  const chapOverrides: EditorialElementOverrides = chapter.overrides || {};

  const updateChapterConfig = <
    K extends keyof Omit<EditorialSpreadConfig, 'version'>
  >(
    section: K,
    updates: Partial<NonNullable<EditorialSpreadConfig[K]>>
  ) => {
    onUpdateChapter({
      config: {
        ...chapConfig,
        [section]: {
          ...(chapConfig[section] || {}),
          ...updates,
        },
      },
    });
  };

  const updateChapterOverride = <K extends keyof EditorialElementOverrides>(
    key: K,
    updates: Partial<NonNullable<EditorialElementOverrides[K]>>
  ) => {
    onUpdateChapter({
      overrides: {
        ...chapOverrides,
        [key]: {
          ...(chapOverrides[key] || {}),
          ...updates,
        },
      },
    });
  };

  // Kéo đường chia cột trực tiếp trên Canvas để đổi tỷ lệ 4:8 <-> 5:7 <-> 6:6 <-> 7:5 <-> 8:4
  const handleStartColumnResize = (
    e: React.MouseEvent<HTMLDivElement>,
    gridEl: HTMLElement | null
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!gridEl) return;
    const rect = gridEl.getBoundingClientRect();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const relX = (moveEvent.clientX - rect.left) / Math.max(1, rect.width);
      let nextRatio: EditorialColumnRatio = '6_6';
      if (relX < 0.38) nextRatio = '4_8';
      else if (relX < 0.46) nextRatio = '5_7';
      else if (relX < 0.54) nextRatio = '6_6';
      else if (relX < 0.62) nextRatio = '7_5';
      else nextRatio = '8_4';

      if (nextRatio !== chapConfig.layout.columnRatio) {
        updateChapterConfig('layout', { columnRatio: nextRatio });
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const { leftClass, rightClass } =
    StoryChapterLayoutStrategy.getColumnRatioSpanClasses(
      chapConfig.layout.columnRatio || '4_8'
    );
  const gapClass = StoryChapterLayoutStrategy.getGapClass(
    chapConfig.layout.gap
  );

  const defaultBodySizePx = chapConfig.typography.bodyFontSizePx || 16;
  const lineHeightVal = chapConfig.typography.lineHeightValue || '1.7';

  // Thuộc tính Typography & Media của chương
  const isIntroDropCap =
    chapOverrides.intro?.dropCap !== undefined
      ? chapOverrides.intro.dropCap
      : chapConfig.typography.dropCap !== false;
  const introDropCapColor =
    chapOverrides.intro?.initialLetterColor ||
    chapConfig.typography.initialLetterColor ||
    '#8b261d';
  const introFontSizePx = chapOverrides.intro?.fontSizePx || defaultBodySizePx;

  const headingTypoClass =
    StoryChapterLayoutStrategy.getHeadingTypographyClass(chapConfig.typography);
  const headingFontStyle =
    chapOverrides.heading?.fontFamily || chapConfig.typography.headingFontName;
  const headingTransform =
    chapOverrides.heading?.transform ||
    chapConfig.typography.headingTransform ||
    'NONE';
  const headingColor = chapOverrides.heading?.color || '#0c0a09';

  const articleCols =
    chapOverrides.article?.textColumns || chapConfig.layout.textColumns || 1;
  const articleColWrapperClass =
    articleCols === 2
      ? 'editorial-slot-cols-2'
      : articleCols === 3
      ? 'editorial-slot-cols-3'
      : '';
  const articleFontSizePx =
    chapOverrides.article?.fontSizePx || defaultBodySizePx;

  const effectiveImageRatio =
    chapOverrides.mainImage?.ratio ||
    chapConfig.media.defaultRatio ||
    '16_10';
  const mediaAspectClass =
    StoryChapterLayoutStrategy.getMediaAspectClass(effectiveImageRatio);
  const effectiveImageFit =
    chapOverrides.mainImage?.imageFit || chapConfig.media.imageFit || 'COVER';
  const imageFitClass =
    effectiveImageFit === 'CONTAIN' ? 'object-contain' : 'object-cover';
  const effectiveCaptionPos =
    chapOverrides.mainImage?.captionPosition ||
    chapConfig.media.captionPosition ||
    'BOTTOM';

  const effectiveQuoteStyle =
    chapOverrides.pullQuote?.style ||
    chapConfig.typography.pullQuoteStyle ||
    'CLASSIC_QUOTES';
  const quoteAccentColor = chapOverrides.pullQuote?.accentColor || '#8b261d';
  const quoteFontSizePx = chapOverrides.pullQuote?.fontSizePx || 20;

  const isSubSelected = (subType: EditorialSubElementType, subId?: string) =>
    activeSubElement?.parentBlockId === parentBlockId &&
    activeSubElement?.subType === subType &&
    activeSubElement?.subId === (subId || chapter.id);

  const selectSub = (
    e: React.MouseEvent,
    subType: EditorialSubElementType,
    label: string,
    subId?: string
  ) => {
    e.stopPropagation();
    setActiveChapterId(chapter.id);
    setActiveSubElement({
      parentBlockId,
      subType,
      subId: subId || chapter.id,
      label,
    });
  };

  const getSubRingClass = (subType: EditorialSubElementType, subId?: string) =>
    isSubSelected(subType, subId)
      ? 'ring-2 ring-blue-500/85 bg-white/50 rounded-xl p-2 -m-2 transition-all'
      : 'hover:ring-1 hover:ring-stone-300/80 rounded-xl p-2 -m-2 transition-all';

  const handleUploadImageFile = (
    file: File | undefined,
    onLoaded: (dataUrl: string) => void
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onLoaded(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Quản lý danh sách Content Blocks con bên trong Chapter Container
  const blocks = chapter.blocks || [];

  const updateChildBlock = (
    blockId: string,
    updates: Partial<LessonBlockItem>
  ) => {
    const next = blocks.map((b) =>
      b.id === blockId ? ({ ...b, ...updates } as LessonBlockItem) : b
    );
    onUpdateChapter({ blocks: next });
  };

  const removeChildBlock = (blockId: string) => {
    onUpdateChapter({
      blocks: blocks.filter((b) => b.id !== blockId),
    });
  };

  const addChildBlock = (type: LessonBlockType, zone: ChapterBlockZone) => {
    const created = LessonBlockFactory.createDefaultBlock(type);
    created.zone = zone;
    onUpdateChapter({
      blocks: [...blocks, created],
    });
    setOpenAddZone(null);
  };

  const handleDropBlockOnTarget = (
    targetBlockId: string,
    targetZone: ChapterBlockZone
  ) => {
    if (!draggedBlockId || draggedBlockId === targetBlockId) return;
    const fromIdx = blocks.findIndex((b) => b.id === draggedBlockId);
    const toIdx = blocks.findIndex((b) => b.id === targetBlockId);
    if (fromIdx < 0 || toIdx < 0) return;

    const cloned = [...blocks];
    const [moved] = cloned.splice(fromIdx, 1);
    moved.zone = targetZone;
    cloned.splice(toIdx, 0, moved);
    onUpdateChapter({ blocks: cloned });
    setDraggedBlockId(null);
  };

  // Phân bổ các ContentBlock vào Cột Trái (LEFT) và Cột Phải (RIGHT)
  const leftBlocks = blocks.filter((b, i) =>
    b.zone
      ? b.zone === 'LEFT'
      : i === 0 &&
        (b.type === LessonBlockType.TEXT || b.type === LessonBlockType.QUOTE)
  );
  const rightBlocks = blocks.filter((b) => !leftBlocks.includes(b));

  // Render một ContentBlock bên trong Chapter theo ngữ cảnh Editorial Spread
  const renderContentBlockInChapter = (
    block: LessonBlockItem,
    zone: ChapterBlockZone,
    indexInZone: number
  ) => {
    // 1. Khối Văn bản (TEXT) ở Cột Trái -> Render phong cách Mở đầu + Drop Cap tạp chí
    if (block.type === LessonBlockType.TEXT && zone === 'LEFT') {
      const textBlock = block as TextBlockData;
      const plainText = (textBlock.content || '')
        .replace(/<[^>]+>/g, '')
        .trim();
      const firstLetter = (plainText.charAt(0) || 'N').toUpperCase();

      return (
        <div
          key={block.id}
          draggable
          onDragStart={() => setDraggedBlockId(block.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDropBlockOnTarget(block.id, zone)}
          onClick={(e) =>
            selectSub(
              e,
              'INTRO_TEXT',
              `${chapterNumber} • Khối Mở đầu (Drop Cap)`,
              chapter.id
            )
          }
          className={`relative group/cblock space-y-3 text-stone-800 cursor-pointer ${getSubRingClass(
            'INTRO_TEXT',
            chapter.id
          )}`}
          style={{
            fontSize: `${introFontSizePx}px`,
            lineHeight: lineHeightVal,
            color: chapOverrides.intro?.textColor || undefined,
          }}
        >
          {/* Thanh nổi trên Canvas khi chọn Văn bản mở đầu */}
          {isSubSelected('INTRO_TEXT', chapter.id) && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-stone-900 text-white text-[11px] font-sans shadow-md mb-1"
            >
              <button
                type="button"
                onClick={() =>
                  updateChapterOverride('intro', { dropCap: !isIntroDropCap })
                }
                className={`px-2 py-0.5 rounded cursor-pointer font-semibold ${
                  isIntroDropCap ? 'bg-blue-600' : 'hover:bg-stone-800'
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
                    updateChapterOverride('intro', { fontSizePx: s.px })
                  }
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    introFontSizePx === s.px
                      ? 'bg-white text-stone-900 font-bold'
                      : 'hover:bg-stone-800'
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
              onChange={(html) => updateChildBlock(block.id, { content: html })}
              compact={true}
              remoteToolbarOnly={true}
              minHeightClass="min-h-[90px]"
              placeholder="Nhập đoạn dẫn nhập mở đầu chương..."
            />
          </div>
        </div>
      );
    }

    // 2. Khối Văn bản (TEXT) ở Cột Phải -> Render bài viết Rich Text chia cột tạp chí
    if (block.type === LessonBlockType.TEXT && zone !== 'LEFT') {
      const textBlock = block as TextBlockData;
      return (
        <div
          key={block.id}
          draggable
          onDragStart={() => setDraggedBlockId(block.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDropBlockOnTarget(block.id, zone)}
          onClick={(e) =>
            selectSub(
              e,
              'ARTICLE_TEXT',
              `${chapterNumber} • Khối Văn bản chính (Rich Text)`,
              chapter.id
            )
          }
          className={`relative group/cblock cursor-pointer ${articleColWrapperClass} ${
            chapOverrides.article?.dropCap ? 'editorial-slot-dropcap' : ''
          } ${getSubRingClass('ARTICLE_TEXT', chapter.id)}`}
          style={{
            fontSize: `${articleFontSizePx}px`,
            lineHeight: lineHeightVal,
          }}
        >
          {/* Thanh nổi trên Canvas khi chọn Văn bản chính: Chỉnh nhanh Font, Cỡ chữ, 1/2 cột */}
          {isSubSelected('ARTICLE_TEXT', chapter.id) && (
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
                    updateChapterConfig('typography', { bodyFont: f.id })
                  }
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    chapConfig.typography.bodyFont === f.id
                      ? 'bg-blue-600 font-bold'
                      : 'hover:bg-stone-800'
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
                    updateChapterOverride('article', { fontSizePx: s.px })
                  }
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    articleFontSizePx === s.px
                      ? 'bg-white text-stone-900 font-bold'
                      : 'hover:bg-stone-800'
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
                    updateChapterOverride('article', { textColumns: colNum })
                  }
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    articleCols === colNum
                      ? 'bg-blue-600 font-bold'
                      : 'hover:bg-stone-800'
                  }`}
                >
                  {colNum} cột
                </button>
              ))}
            </div>
          )}
          {blocks.length > 2 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeChildBlock(block.id);
              }}
              title="Xóa khối văn bản này"
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-stone-200 text-stone-400 hover:text-rose-600 flex items-center justify-center opacity-0 group-hover/cblock:opacity-100 transition-opacity cursor-pointer z-10"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <TipTapContent
            value={
              textBlock.content ||
              '<p>Nhập nội dung bối cảnh và diễn biến lịch sử tại đây...</p>'
            }
            onChange={(html) => updateChildBlock(block.id, { content: html })}
            compact={true}
            remoteToolbarOnly={true}
            minHeightClass="min-h-[76px]"
            placeholder="Nhập nội dung bài viết của chương..."
          />
        </div>
      );
    }

    // 3. Khối Trích dẫn (QUOTE) -> Render phong cách Pull Quote tạp chí
    if (block.type === LessonBlockType.QUOTE) {
      const quoteBlock = block as QuoteBlockData;
      return (
        <div
          key={block.id}
          draggable
          onDragStart={() => setDraggedBlockId(block.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDropBlockOnTarget(block.id, zone)}
          onClick={(e) =>
            selectSub(
              e,
              'PULL_QUOTE',
              `${chapterNumber} • Khối Trích dẫn (Quote Block)`,
              chapter.id
            )
          }
          className={`relative group/cblock space-y-2 cursor-pointer ${
            effectiveQuoteStyle === 'BORDER_LEFT' ? 'border-l-4 pl-4' : ''
          } ${getSubRingClass('PULL_QUOTE', chapter.id)}`}
          style={
            effectiveQuoteStyle === 'BORDER_LEFT'
              ? { borderColor: quoteAccentColor }
              : undefined
          }
        >
          {/* Thanh nổi trên Canvas khi chọn Trích dẫn: Chỉnh nhanh kiểu trích dẫn */}
          {isSubSelected('PULL_QUOTE', chapter.id) && (
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
                    updateChapterOverride('pullQuote', { style: st.id })
                  }
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    effectiveQuoteStyle === st.id
                      ? 'bg-blue-600 font-bold'
                      : 'hover:bg-stone-800'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          )}
          {blocks.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeChildBlock(block.id);
              }}
              title="Xóa khối trích dẫn này"
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-stone-200 text-stone-400 hover:text-rose-600 flex items-center justify-center opacity-0 group-hover/cblock:opacity-100 transition-opacity cursor-pointer z-10"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          {effectiveQuoteStyle === 'CLASSIC_QUOTES' && (
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
              updateChildBlock(block.id, { quoteText: e.target.value })
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
                updateChildBlock(block.id, { author: e.target.value })
              }
              placeholder="Tên nhân vật / Tác giả..."
              className="flex-1 text-sm font-serif text-stone-700 bg-transparent border-b border-transparent focus:border-stone-900 focus:outline-none py-0.5"
            />
          </div>
        </div>
      );
    }

    // 4. Khối Hình ảnh (IMAGE) -> Render khung ảnh tạp chí theo tỷ lệ Media
    if (block.type === LessonBlockType.IMAGE) {
      const imgBlock = block as ImageBlockData;
      const isImgOpen = openImageBlockId === block.id;
      return (
        <div
          key={block.id}
          draggable
          onDragStart={() => setDraggedBlockId(block.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDropBlockOnTarget(block.id, zone)}
          onClick={(e) =>
            selectSub(
              e,
              'MAIN_IMAGE',
              `${chapterNumber} • Khối Hình ảnh (Image Block)`,
              chapter.id
            )
          }
          className={`relative group/cblock space-y-2 pt-1 cursor-pointer ${getSubRingClass(
            'MAIN_IMAGE',
            chapter.id
          )}`}
        >
          {/* Thanh nổi trên Canvas khi chọn Ảnh: Chỉnh nhanh tỷ lệ ảnh & căn chỉnh */}
          {isSubSelected('MAIN_IMAGE', chapter.id) && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-stone-900 text-white text-[11px] font-sans shadow-md mb-1"
            >
              {(
                [
                  { id: '16_10', label: '16:10' },
                  { id: '4_3', label: '4:3' },
                  { id: '21_9', label: '21:9' },
                  { id: 'AUTO', label: 'Tự nhiên' },
                ] as Array<{ id: EditorialMediaRatio; label: string }>
              ).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() =>
                    updateChapterOverride('mainImage', { ratio: r.id })
                  }
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    effectiveImageRatio === r.id
                      ? 'bg-blue-600 font-bold'
                      : 'hover:bg-stone-800'
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
                    updateChapterOverride('mainImage', { imageFit: fit.id })
                  }
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    effectiveImageFit === fit.id
                      ? 'bg-white text-stone-900 font-bold'
                      : 'hover:bg-stone-800'
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

            {effectiveCaptionPos === 'OVERLAY' && imgBlock.caption && (
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
              {blocks.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChildBlock(block.id);
                  }}
                  title="Xóa khối ảnh này"
                  className="p-1.5 rounded-lg bg-stone-900/85 text-white hover:bg-rose-700 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </figure>

          {effectiveCaptionPos === 'BOTTOM' &&
            chapConfig.media.showCaption !== false && (
              <input
                type="text"
                value={imgBlock.caption || ''}
                onChange={(e) =>
                  updateChildBlock(block.id, { caption: e.target.value })
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
                    updateChildBlock(block.id, { src: e.target.value })
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
                        updateChildBlock(block.id, { src: url })
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

    // 5. Các ContentBlock khác (HEADING, CALLOUT, CHARACTER, EVENT, DIVIDER...)
    if (renderNestedBlock) {
      return (
        <div
          key={block.id}
          onClick={(e) =>
            selectSub(
              e,
              'NESTED_BLOCK',
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
              removeChildBlock(block.id);
            }}
            title="Xóa khối này khỏi chương"
            className="absolute top-2 right-2 w-6 h-6 rounded-md bg-white border border-stone-200 text-stone-500 hover:text-rose-600 flex items-center justify-center opacity-0 group-hover/cblock:opacity-100 transition-opacity cursor-pointer z-10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {renderNestedBlock(block, (updates) =>
            updateChildBlock(block.id, updates)
          )}
        </div>
      );
    }

    return null;
  };

  // Header Tiêu đề Chương (Số chương CHƯƠNG I, CHƯƠNG II... tự động tính từ thứ tự)
  const renderChapterHeading = () => (
    <div
      onClick={(e) =>
        selectSub(
          e,
          'MAIN_HEADING',
          `${chapterNumber} • Tiêu đề chương`,
          chapter.id
        )
      }
      className={`space-y-2 cursor-pointer ${getSubRingClass(
        'MAIN_HEADING',
        chapter.id
      )}`}
    >
      {showChapterNumber && (
        <div className="flex items-center gap-3">
          {/* Nhãn số chương tự động từ getChapterLabel(index): CHƯƠNG I, CHƯƠNG II... */}
          <span
            data-testid={`auto-chapter-number-${chapterIndex}`}
            className="text-xs font-serif font-bold uppercase tracking-[0.16em] text-stone-900 shrink-0 select-none"
          >
            {chapterNumber}
          </span>
          <span className="text-stone-400 select-none">•</span>
          <input
            type="text"
            value={chapter.subtitle || ''}
            onChange={(e) => onUpdateChapter({ subtitle: e.target.value })}
            placeholder="Tiêu đề phụ (VD: Bối cảnh lịch sử)..."
            aria-label="Tiêu đề phụ của chương"
            className="text-xs font-serif font-bold uppercase tracking-[0.14em] text-stone-700 bg-transparent border-b border-transparent focus:border-stone-900 focus:outline-none py-0.5 min-w-[140px]"
          />
          {showDividers && (
            <span className="flex-1 h-[1.5px] bg-[#785c48]/60" />
          )}
        </div>
      )}

      <input
        type="text"
        value={chapter.title}
        onChange={(e) => onUpdateChapter({ title: e.target.value })}
        placeholder="Nhập tiêu đề chương lịch sử..."
        data-testid={
          chapterIndex === 0
            ? 'input-story-chapter-title'
            : `input-story-chapter-title-${chapterIndex}`
        }
        className={`w-full ${headingTypoClass} font-bold tracking-tight leading-tight bg-transparent border-b border-transparent focus:border-stone-900 focus:outline-none py-0.5 ${
          headingTransform === 'UPPERCASE' ? 'uppercase' : ''
        }`}
        style={{
          fontFamily: headingFontStyle || undefined,
          color: headingColor,
        }}
      />
    </div>
  );

  const layoutBadgeLabel: Record<string, string> = {
    MAGAZINE_GRID: 'Lưới tạp chí',
    ASYMMETRIC: 'Bất đối xứng',
    SPLIT: 'Chia đôi',
    FULL_WIDTH: 'Toàn khung',
    MASONRY: 'Bố cục so le',
  };

  return (
    <article
      id={`story-chapter-unit-${chapter.id}`}
      data-testid={`story-chapter-unit-${chapterIndex}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelectChapter();
      }}
      className={`group/chap relative transition-all ${
        chapterIndex > 0
          ? showDividers
            ? 'pt-7 border-t border-stone-300/90'
            : 'pt-6'
          : ''
      } ${
        isChapterActive
          ? 'ring-1 ring-blue-500/40 rounded-xl p-3 -mx-3 bg-white/25'
          : ''
      }`}
    >
      {/* Thanh công cụ quản lý Chương (Container Toolbar) */}
      <div
        className={`flex items-center justify-between gap-2 mb-3 pb-2 border-b border-stone-200/70 font-sans text-xs transition-opacity ${
          isChapterActive
            ? 'opacity-100'
            : 'opacity-0 group-hover/chap:opacity-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-stone-900 text-white font-bold text-[11px]">
            {chapterNumber}
          </span>
          <span className="text-stone-600 font-medium">
            Bố cục riêng:{' '}
            <strong className="text-stone-900">
              {layoutBadgeLabel[chapConfig.layout.type] || 'Lưới tạp chí'} (
              {(chapConfig.layout.columnRatio || '4_8').replace('_', ':')})
            </strong>
          </span>
          <span className="text-stone-400">•</span>
          <span className="text-stone-600">{blocks.length} khối con</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={chapterIndex === 0}
            onClick={(e) => {
              e.stopPropagation();
              onMoveChapter(-1);
            }}
            title="Đưa chương này lên trên (Tự động cập nhật số chương)"
            className="p-1 rounded border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-35 cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={chapterIndex === totalChapters - 1}
            onClick={(e) => {
              e.stopPropagation();
              onMoveChapter(1);
            }}
            title="Đưa chương này xuống dưới (Tự động cập nhật số chương)"
            className="p-1 rounded border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-35 cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenAddZone(openAddZone ? null : 'RIGHT');
            }}
            className="px-2 py-1 rounded border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Thêm Block con</span>
          </button>
          {totalChapters > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveChapter();
              }}
              title="Xóa chương này"
              className="p-1 rounded border border-stone-200 bg-white text-stone-500 hover:text-rose-700 hover:border-rose-200 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Menu chọn ContentBlock con để chèn vào Cột Trái hoặc Cột Phải của Chương */}
      {openAddZone && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mb-4 p-3 bg-white border border-stone-300 rounded-xl shadow-sm font-sans space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-800">
                Chèn Content Block vào {chapterNumber}:
              </span>
              <div className="inline-flex rounded-lg bg-stone-100 p-0.5 border border-stone-200 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setOpenAddZone('LEFT')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer ${
                    openAddZone === 'LEFT'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-stone-600'
                  }`}
                >
                  Cột trái
                </button>
                <button
                  type="button"
                  onClick={() => setOpenAddZone('RIGHT')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer ${
                    openAddZone === 'RIGHT'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-stone-600'
                  }`}
                >
                  Cột phải
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpenAddZone(null)}
              className="text-stone-500 hover:text-stone-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STORY_CHAPTER_ALLOWED_NESTED_BLOCKS.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => addChildBlock(item.type, openAddZone)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-50 hover:bg-blue-50 hover:text-blue-700 border border-stone-200 hover:border-blue-300 text-stone-800 transition-colors cursor-pointer"
              >
                + {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RENDER CÁC CONTENT BLOCKS THEO BỐ CỤC RIÊNG CỦA CHƯƠNG */}
      {chapConfig.layout.type === 'FULL_WIDTH' ? (
        <div className="space-y-5">
          {renderChapterHeading()}
          <div className="space-y-4">
            {blocks.map((b, i) => renderContentBlockInChapter(b, 'FULL', i))}
          </div>
        </div>
      ) : (
        <div
          data-chapter-grid={chapter.id}
          className={`grid grid-cols-12 ${gapClass} items-start`}
        >
          {/* Cột Trái (Mở đầu DropCap / Trích dẫn Pull Quote / Tư liệu phụ) */}
          <div className={`${leftClass} space-y-4`}>
            {leftBlocks.map((b, i) =>
              renderContentBlockInChapter(b, 'LEFT', i)
            )}
          </div>

          {/* Cột Phải (Kèm đường chia cột có thể kéo qua lại để đổi tỷ lệ 4:8 <-> 5:7 <-> 6:6 <-> 7:5 <-> 8:4) */}
          <div
            className={`${rightClass} relative ${
              showDividers
                ? 'md:border-l md:border-stone-300/90 md:pl-7'
                : 'md:pl-4'
            } space-y-4`}
          >
            <div
              role="separator"
              title="Kéo sang trái/phải để thay đổi tỷ lệ cột"
              onMouseDown={(e) =>
                handleStartColumnResize(
                  e,
                  e.currentTarget.closest(
                    `[data-chapter-grid="${chapter.id}"]`
                  ) as HTMLElement | null
                )
              }
              className="hidden md:flex absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize items-center justify-center group/resizer z-10"
            >
              <span className="w-1 h-10 rounded-full bg-stone-400/0 group-hover/resizer:bg-blue-500 transition-colors" />
            </div>
            {renderChapterHeading()}
            {rightBlocks.map((b, i) =>
              renderContentBlockInChapter(b, 'RIGHT', i)
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export function StoryChapterBlockEditor({
  data,
  onChange,
  renderNestedBlock,
}: StoryChapterBlockEditorProps) {
  const { setActiveSubElement, activeChapterId, setActiveChapterId } =
    useActiveEditor();

  const [draggedChapterIndex, setDraggedChapterIndex] = useState<number | null>(
    null
  );

  const displayConfig = data.displayConfig || {
    showChapterNumber: true,
    showTime: true,
    showLocation: true,
    showReferenceSource: true,
  };

  // Chuẩn hóa và sắp xếp danh sách Chương theo `order` tăng dần
  const sortedChapters: StoryChapterUnit[] =
    StoryChapterLayoutStrategy.normalizeStoryChapters(data)
      .slice()
      .sort((a, b) => a.order - b.order);

  const currentActiveChapterId =
    activeChapterId && sortedChapters.some((c) => c.id === activeChapterId)
      ? activeChapterId
      : sortedChapters[0]?.id || null;

  const parentConfig: EditorialSpreadConfig =
    data.config ||
    sortedChapters[0]?.config ||
    StoryChapterLayoutStrategy.createDefaultEditorialConfig('MAGAZINE_GRID');

  const showToc = data.showToc !== false;
  const subjectOption =
    STORY_SUBJECT_TYPE_OPTIONS.find(
      (s) => s.id === (data.subjectType || 'EVENT')
    ) || STORY_SUBJECT_TYPE_OPTIONS[0];

  // Lưu lại mảng chapters[] đã chuẩn hóa thứ tự `order: 0, 1, 2...`
  const commitChapters = (nextChapters: StoryChapterUnit[]) => {
    const normalized =
      StoryChapterLayoutStrategy.sortAndReindexChapters(nextChapters);
    const first = normalized[0];
    onChange({
      chapters: normalized,
      ...(first
        ? {
            chapterNumber: getChapterLabel(0),
            title: first.title,
            subtitle: first.subtitle || '',
            config: first.config,
            overrides: first.overrides,
          }
        : {}),
    });
  };

  const handleUpdateChapter = (
    chapterId: string,
    updates: Partial<StoryChapterUnit>
  ) => {
    const next = sortedChapters.map((ch) =>
      ch.id === chapterId ? { ...ch, ...updates } : ch
    );
    commitChapters(next);
  };

  const handleAddChapter = () => {
    const nextOrder = sortedChapters.length;
    const newChap = StoryChapterLayoutStrategy.createChapterContainer(
      nextOrder,
      'MAGAZINE_GRID'
    );
    const next = [...sortedChapters, newChap];
    commitChapters(next);
    setActiveChapterId(newChap.id);
    setActiveSubElement(null);
  };

  const handleRemoveChapter = (chapterId: string) => {
    if (sortedChapters.length <= 1) return;
    const filtered = sortedChapters
      .filter((ch) => ch.id !== chapterId)
      .map((ch, idx) => ({ ...ch, order: idx }));
    commitChapters(filtered);
    if (currentActiveChapterId === chapterId) {
      setActiveChapterId(filtered[0]?.id || null);
    }
  };

  const handleReorderChapters = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      toIndex < 0 ||
      toIndex >= sortedChapters.length
    ) {
      return;
    }
    const cloned = [...sortedChapters];
    const [moved] = cloned.splice(fromIndex, 1);
    cloned.splice(toIndex, 0, moved);
    const reordered = cloned.map((ch, idx) => ({ ...ch, order: idx }));
    commitChapters(reordered);
    setActiveChapterId(moved.id);
  };

  const scrollToChapter = (chapterId: string) => {
    setActiveChapterId(chapterId);
    setActiveSubElement(null);
    const el = document.getElementById(`story-chapter-unit-${chapterId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Appearance chung của khung Story
  const bgColor = parentConfig.appearance?.backgroundColor || '#faf7f2';
  const showDividers = parentConfig.appearance?.showRegionDividers !== false;
  const radiusMap: Record<string, string> = {
    NONE: 'rounded-none',
    MD: 'rounded-lg',
    LG: 'rounded-xl',
    XL: 'rounded-2xl',
  };
  const shadowMap: Record<string, string> = {
    NONE: '',
    SM: 'shadow-xs',
    MD: 'shadow-md',
    LG: 'shadow-lg',
  };
  const radiusClass =
    radiusMap[parentConfig.appearance?.borderRadius || 'XL'] || 'rounded-2xl';
  const shadowClass =
    shadowMap[parentConfig.appearance?.shadow || 'NONE'] || '';

  const contentWidthMap: Record<string, string> = {
    NARROW: 'max-w-3xl',
    NORMAL: 'max-w-4xl',
    WIDE: 'max-w-5xl',
    FULL: 'w-full',
  };
  const alignMap: Record<string, string> = {
    LEFT: 'mr-auto',
    CENTER: 'mx-auto',
    RIGHT: 'ml-auto',
  };
  const widthAlignClass = `${
    contentWidthMap[parentConfig.layout.contentWidth || 'FULL'] || 'w-full'
  } ${alignMap[parentConfig.layout.horizontalAlign || 'CENTER'] || 'mx-auto'}`;

  return (
    <div
      data-testid="story-chapter-block-editor"
      onClick={() => setActiveSubElement(null)}
      className={`space-y-7 ${widthAlignClass} ${radiusClass} ${shadowClass} border border-stone-200/90 transition-colors`}
      style={{
        backgroundColor: bgColor,
        paddingTop: `${parentConfig.layout.paddingTopPx ?? 32}px`,
        paddingBottom: `${parentConfig.layout.paddingBottomPx ?? 32}px`,
        paddingLeft: `${parentConfig.layout.paddingLeftPx ?? 32}px`,
        paddingRight: `${parentConfig.layout.paddingRightPx ?? 32}px`,
      }}
    >
      {/* 1. THANH MỤC LỤC CHƯƠNG TỰ ĐỘNG & KÉO THẢ SẮP XẾP CHƯƠNG */}
      {showToc && (
        <nav
          aria-label="Mục lục các chương của câu chuyện"
          onClick={(e) => e.stopPropagation()}
          className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-stone-300/80 font-sans"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-900 text-[#faf7f2] text-[11px] font-bold tracking-wide">
              <BookOpen className="w-3 h-3" />
              <span>{subjectOption.badge}</span>
            </span>

            {sortedChapters.map((chap, idx) => {
              const isSelected = currentActiveChapterId === chap.id;
              const autoChapterLabel = getChapterLabel(idx);
              return (
                <button
                  key={chap.id}
                  type="button"
                  draggable
                  onDragStart={() => setDraggedChapterIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedChapterIndex !== null) {
                      handleReorderChapters(draggedChapterIndex, idx);
                      setDraggedChapterIndex(null);
                    }
                  }}
                  onClick={() => scrollToChapter(chap.id)}
                  title="Bấm để chuyển đến chương hoặc kéo thả để đổi thứ tự chương"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white/80 text-stone-800 border-stone-300/90 hover:bg-white'
                  }`}
                >
                  <GripVertical className="w-3 h-3 opacity-60 cursor-grab" />
                  <span className="font-serif font-bold">
                    {autoChapterLabel}:
                  </span>
                  <span className="truncate max-w-[150px]">
                    {chap.title || `Chương ${idx + 1}`}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            data-testid="btn-add-subchapter"
            onClick={handleAddChapter}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-stone-900 text-stone-800 hover:text-white border border-stone-300 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm chương</span>
          </button>
        </nav>
      )}

      {/* 2. RENDER TỰ ĐỘNG CÁC CHƯƠNG THEO THỨ TỰ `order` & TỰ ĐỘNG TÍNH `getChapterLabel(index)` */}
      <div className="space-y-8">
        {sortedChapters
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((chapter, index) => (
            <StoryChapterRenderer
              key={chapter.id}
              parentBlockId={data.id}
              chapter={chapter}
              chapterIndex={index}
              totalChapters={sortedChapters.length}
              chapterNumber={getChapterLabel(index)}
              isChapterActive={currentActiveChapterId === chapter.id}
              showChapterNumber={displayConfig.showChapterNumber}
              showDividers={showDividers}
              onSelectChapter={() => {
                setActiveChapterId(chapter.id);
                setActiveSubElement(null);
              }}
              onUpdateChapter={(updates) =>
                handleUpdateChapter(chapter.id, updates)
              }
              onMoveChapter={(dir) =>
                handleReorderChapters(index, index + dir)
              }
              onRemoveChapter={() => handleRemoveChapter(chapter.id)}
              renderNestedBlock={renderNestedBlock}
            />
          ))}
      </div>

      {/* 3. NÚT THÊM CHƯƠNG MỚI Ở CUỐI STORY & NGUỒN THAM KHẢO SỬ LIỆU */}
      <div className="pt-4 border-t border-stone-300/70 flex flex-wrap items-center justify-between gap-4 font-sans">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleAddChapter();
          }}
          className="text-xs font-semibold text-stone-700 hover:text-stone-950 flex items-center gap-1.5 cursor-pointer bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-stone-300/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>
            Thêm chương mới ({getChapterLabel(sortedChapters.length)})
          </span>
        </button>

        {displayConfig.showReferenceSource && (
          <div className="flex items-center gap-2 text-xs text-stone-600 flex-1 min-w-[240px]">
            <ScrollText className="w-3.5 h-3.5 text-stone-500 shrink-0" />
            <span className="font-semibold shrink-0">Nguồn sử liệu:</span>
            <input
              type="text"
              value={data.referenceSource || ''}
              onChange={(e) => onChange({ referenceSource: e.target.value })}
              placeholder="VD: Đại Việt Sử Ký Toàn Thư..."
              className="flex-1 bg-transparent border-b border-transparent focus:border-stone-900 focus:outline-none py-0.5 italic text-stone-700"
            />
          </div>
        )}
      </div>
    </div>
  );
}
