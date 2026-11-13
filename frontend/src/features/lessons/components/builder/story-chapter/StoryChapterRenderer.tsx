'use client';

import React, { useState } from 'react';
import { EditorialSpreadConfig, EditorialElementOverrides, ChapterBlockZone, LessonBlockItem, StoryChapterBlockData, StoryChapterUnit } from '../../../types/block-builder.types';
import { LessonBlockType } from '../../../types/editor.types';
import { StoryChapterLayoutStrategy, getChapterLabel } from '../../../strategies/story-chapter-layout.strategy';
import { LessonBlockRegistry } from '../../../plugins/block-plugin.registry';
import { useActiveEditor, EditorialSubElementType } from '../../../context/ActiveEditorContext';
import { StoryChapterContentBlock, useStoryChapterColumnResize, StoryChapterAddBlockMenu } from './StoryChapterContentBlock';
import { ChapterBlockZoneEnum, EditorialLayoutType, EditorialTransformEnum } from '@/constants/lesson-builder.constant';
import { BookOpen, GripVertical, Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

const IMAGE_FIT_CONTAIN = 'CONTAIN';

export function StoryChapterRenderer({
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

  const { handleStartColumnResize } = useStoryChapterColumnResize({
    currentRatio: chapConfig.layout.columnRatio,
    onUpdateColumnRatio: (nextRatio) =>
      updateChapterConfig('layout', { columnRatio: nextRatio }),
  });

  const { leftClass, rightClass } =
    StoryChapterLayoutStrategy.getColumnRatioSpanClasses(
      chapConfig.layout.columnRatio || '4_8'
    );
  const gapClass = StoryChapterLayoutStrategy.getGapClass(
    chapConfig.layout.gap
  );

  const defaultBodySizePx = chapConfig.typography.bodyFontSizePx || 16;
  const lineHeightVal = chapConfig.typography.lineHeightValue || '1.7';

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
    effectiveImageFit === IMAGE_FIT_CONTAIN ? 'object-contain' : 'object-cover';
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
    const created = LessonBlockRegistry.createDefaultBlock(type);
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

  const leftBlocks = blocks.filter((b, i) =>
    b.zone
      ? b.zone === ChapterBlockZoneEnum.LEFT
      : i === 0 &&
        (b.type === LessonBlockType.TEXT || b.type === LessonBlockType.QUOTE)
  );
  const rightBlocks = blocks.filter((b) => !leftBlocks.includes(b));

  const renderContentBlock = (
    block: LessonBlockItem,
    zone: ChapterBlockZone,
    indexInZone: number
  ) => (
    <StoryChapterContentBlock
      key={block.id}
      parentBlockId={parentBlockId}
      chapter={chapter}
      chapterNumber={chapterNumber}
      block={block}
      zone={zone}
      indexInZone={indexInZone}
      blocksCount={blocks.length}
      lineHeightVal={lineHeightVal}
      introFontSizePx={introFontSizePx}
      isIntroDropCap={isIntroDropCap}
      introDropCapColor={introDropCapColor}
      articleColWrapperClass={articleColWrapperClass}
      articleFontSizePx={articleFontSizePx}
      articleCols={articleCols}
      effectiveQuoteStyle={effectiveQuoteStyle}
      quoteAccentColor={quoteAccentColor}
      quoteFontSizePx={quoteFontSizePx}
      effectiveImageRatio={effectiveImageRatio}
      mediaAspectClass={mediaAspectClass}
      imageFitClass={imageFitClass}
      effectiveCaptionPos={effectiveCaptionPos}
      openImageBlockId={openImageBlockId}
      draggedBlockId={draggedBlockId}
      setDraggedBlockId={setDraggedBlockId}
      setOpenImageBlockId={setOpenImageBlockId}
      onDropBlockOnTarget={handleDropBlockOnTarget}
      onUpdateChildBlock={updateChildBlock}
      onRemoveChildBlock={removeChildBlock}
      onSelectSub={selectSub}
      isSubSelected={isSubSelected}
      getSubRingClass={getSubRingClass}
      onUpdateChapterConfig={updateChapterConfig}
      onUpdateChapterOverride={updateChapterOverride}
      renderNestedBlock={renderNestedBlock}
    />
  );

  const headingNode = (
    <StoryChapterHeading
      chapter={chapter}
      chapterIndex={chapterIndex}
      chapterNumber={chapterNumber}
      showChapterNumber={showChapterNumber}
      showDividers={showDividers}
      headingTypoClass={headingTypoClass}
      headingFontStyle={headingFontStyle}
      headingTransform={headingTransform}
      headingColor={headingColor}
      onUpdateChapter={onUpdateChapter}
      onSelectSub={selectSub}
      getSubRingClass={getSubRingClass}
    />
  );

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
      <StoryChapterToolbar
        chapterNumber={chapterNumber}
        chapterIndex={chapterIndex}
        totalChapters={totalChapters}
        isChapterActive={isChapterActive}
        blocksCount={blocks.length}
        chapConfig={chapConfig}
        onMoveChapter={onMoveChapter}
        onToggleAddZone={() => setOpenAddZone(openAddZone ? null : 'RIGHT')}
        onRemoveChapter={onRemoveChapter}
      />

      {openAddZone && (
        <StoryChapterAddBlockMenu
          chapterNumber={chapterNumber}
          openAddZone={openAddZone}
          onSetOpenAddZone={setOpenAddZone}
          onAddChildBlock={addChildBlock}
        />
      )}

      {chapConfig.layout.type === EditorialLayoutType.FULL_WIDTH ? (
        <div className="space-y-5">
          {headingNode}
          <div className="space-y-4">
            {blocks.map((b, i) => renderContentBlock(b, ChapterBlockZoneEnum.FULL, i))}
          </div>
        </div>
      ) : (
        <div
          data-chapter-grid={chapter.id}
          className={`grid grid-cols-12 ${gapClass} items-start`}
        >
          <div className={`${leftClass} space-y-4`}>
            {leftBlocks.map((b, i) => renderContentBlock(b, 'LEFT', i))}
          </div>

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
            {headingNode}
            {rightBlocks.map((b, i) => renderContentBlock(b, 'RIGHT', i))}
          </div>
        </div>
      )}
    </article>
  );
}

// --- types.ts ---
export interface StoryChapterBlockEditorProps {
  data: StoryChapterBlockData;
  onChange: (updates: Partial<StoryChapterBlockData>) => void;
  renderNestedBlock?: (
    childBlock: LessonBlockItem,
    onUpdateChild: (updates: Partial<LessonBlockItem>) => void
  ) => React.ReactNode;
}

export interface StoryChapterRendererProps {
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

export interface StoryChapterContentBlockProps {
  parentBlockId: string;
  chapter: StoryChapterUnit;
  chapterNumber: string;
  block: LessonBlockItem;
  zone: ChapterBlockZone;
  indexInZone: number;
  blocksCount: number;
  lineHeightVal: string;
  introFontSizePx: number;
  isIntroDropCap: boolean;
  introDropCapColor: string;
  articleColWrapperClass: string;
  articleFontSizePx: number;
  articleCols: number;
  effectiveQuoteStyle: string;
  quoteAccentColor: string;
  quoteFontSizePx: number;
  effectiveImageRatio: string;
  mediaAspectClass: string;
  imageFitClass: string;
  effectiveCaptionPos: string;
  openImageBlockId: string | null;
  draggedBlockId: string | null;
  setDraggedBlockId: (id: string | null) => void;
  setOpenImageBlockId: (id: string | null) => void;
  onDropBlockOnTarget: (targetBlockId: string, zone: ChapterBlockZone) => void;
  onUpdateChildBlock: (blockId: string, updates: Partial<LessonBlockItem>) => void;
  onRemoveChildBlock: (blockId: string) => void;
  onSelectSub: (
    e: React.MouseEvent,
    subType: EditorialSubElementType,
    label: string,
    subId?: string
  ) => void;
  isSubSelected: (
    subType: EditorialSubElementType,
    subId?: string
  ) => boolean;
  getSubRingClass: (
    subType: EditorialSubElementType,
    subId?: string
  ) => string;
  onUpdateChapterConfig: <K extends keyof Omit<EditorialSpreadConfig, 'version'>>(
    section: K,
    updates: Partial<NonNullable<EditorialSpreadConfig[K]>>
  ) => void;
  onUpdateChapterOverride: <K extends keyof EditorialElementOverrides>(
    key: K,
    updates: Partial<NonNullable<EditorialElementOverrides[K]>>
  ) => void;
  renderNestedBlock?: (
    childBlock: LessonBlockItem,
    onUpdateChild: (updates: Partial<LessonBlockItem>) => void
  ) => React.ReactNode;
}

// --- StoryChapterTocBar.tsx ---
interface StoryChapterTocBarProps {
  subjectBadge: string;
  chapters: StoryChapterUnit[];
  currentActiveChapterId: string | null;
  draggedChapterIndex: number | null;
  setDraggedChapterIndex: (index: number | null) => void;
  onReorderChapters: (fromIndex: number, toIndex: number) => void;
  onScrollToChapter: (chapterId: string) => void;
  onAddChapter: () => void;
}

export function StoryChapterTocBar({
  subjectBadge,
  chapters,
  currentActiveChapterId,
  draggedChapterIndex,
  setDraggedChapterIndex,
  onReorderChapters,
  onScrollToChapter,
  onAddChapter,
}: StoryChapterTocBarProps) {
  return (
    <nav
      aria-label="Mục lục các chương của câu chuyện"
      onClick={(e) => e.stopPropagation()}
      className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-stone-300/80 font-sans"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-900 text-[#faf7f2] text-[11px] font-bold tracking-wide">
          <BookOpen className="w-3 h-3" />
          <span>{subjectBadge}</span>
        </span>

        {chapters.map((chap, idx) => {
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
                  onReorderChapters(draggedChapterIndex, idx);
                  setDraggedChapterIndex(null);
                }
              }}
              onClick={() => onScrollToChapter(chap.id)}
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
        onClick={onAddChapter}
        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-stone-900 text-stone-800 hover:text-white border border-stone-300 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Thêm chương</span>
      </button>
    </nav>
  );
}

// --- StoryChapterHeading.tsx ---
interface StoryChapterHeadingProps {
  chapter: StoryChapterUnit;
  chapterIndex: number;
  chapterNumber: string;
  showChapterNumber: boolean;
  showDividers: boolean;
  headingTypoClass: string;
  headingFontStyle?: string;
  headingTransform?: string;
  headingColor: string;
  onUpdateChapter: (updates: Partial<StoryChapterUnit>) => void;
  onSelectSub: (
    e: React.MouseEvent,
    subType: EditorialSubElementType,
    label: string,
    subId?: string
  ) => void;
  getSubRingClass: (
    subType: EditorialSubElementType,
    subId?: string
  ) => string;
}

export function StoryChapterHeading({
  chapter,
  chapterIndex,
  chapterNumber,
  showChapterNumber,
  showDividers,
  headingTypoClass,
  headingFontStyle,
  headingTransform,
  headingColor,
  onUpdateChapter,
  onSelectSub,
  getSubRingClass,
}: StoryChapterHeadingProps) {
  return (
    <div
      onClick={(e) =>
        onSelectSub(
          e,
          EditorialSubElementType.MAIN_HEADING,
          `${chapterNumber} • Tiêu đề chương`,
          chapter.id
        )
      }
      className={`space-y-2 cursor-pointer ${getSubRingClass(
        EditorialSubElementType.MAIN_HEADING,
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
          headingTransform === EditorialTransformEnum.UPPERCASE ? 'uppercase' : ''
        }`}
        style={{
          fontFamily: headingFontStyle || undefined,
          color: headingColor,
        }}
      />
    </div>
  );
}

// --- StoryChapterToolbar.tsx ---
interface StoryChapterToolbarProps {
  chapterNumber: string;
  chapterIndex: number;
  totalChapters: number;
  isChapterActive: boolean;
  blocksCount: number;
  chapConfig: EditorialSpreadConfig;
  onMoveChapter: (direction: -1 | 1) => void;
  onToggleAddZone: () => void;
  onRemoveChapter: () => void;
}

const LAYOUT_BADGE_LABEL: Record<string, string> = {
  MAGAZINE_GRID: 'Lưới tạp chí',
  ASYMMETRIC: 'Bất đối xứng',
  SPLIT: 'Chia đôi',
  FULL_WIDTH: 'Toàn khung',
  MASONRY: 'Bố cục so le',
};

export function StoryChapterToolbar({
  chapterNumber,
  chapterIndex,
  totalChapters,
  isChapterActive,
  blocksCount,
  chapConfig,
  onMoveChapter,
  onToggleAddZone,
  onRemoveChapter,
}: StoryChapterToolbarProps) {
  return (
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
            {LAYOUT_BADGE_LABEL[chapConfig.layout.type] || 'Lưới tạp chí'} (
            {(chapConfig.layout.columnRatio || '4_8').replace('_', ':')})
          </strong>
        </span>
        <span className="text-stone-400">•</span>
        <span className="text-stone-600">{blocksCount} khối con</span>
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
            onToggleAddZone();
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
  );
}
