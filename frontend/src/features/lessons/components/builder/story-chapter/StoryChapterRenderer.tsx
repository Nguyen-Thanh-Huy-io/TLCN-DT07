'use client';

import React, { useState } from 'react';
import { EditorialSpreadConfig, EditorialElementOverrides, ChapterBlockZone, LessonBlockItem, StoryChapterBlockData, StoryChapterUnit } from '../../../types/block-builder.types';
import { LessonBlockType } from '../../../types/editor.types';
import { StoryChapterLayoutStrategy } from '../../../strategies/story-chapter-layout.strategy';
import { LessonBlockRegistry } from '../../../plugins/block-plugin.registry';
import { useActiveEditor, EditorialSubElementType } from '../../../context/ActiveEditorContext';
import { StoryChapterContentBlock, useStoryChapterColumnResize, StoryChapterAddBlockMenu } from './StoryChapterContentBlock';
import { ChapterBlockZoneEnum, EditorialLayoutType } from '@/constants/lesson-builder.constant';
import { StoryChapterHeading, StoryChapterToolbar } from './StoryChapterRendererParts';

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

export { StoryChapterTocBar } from './StoryChapterRendererParts';
