'use client';

import React from 'react';
import {
  StoryChapterBlockData,
  StoryChapterUnit,
  LessonBlockItem,
  ChapterBlockZone,
} from '../../../types/block-builder.types';

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
    subType: import('../../../context/ActiveEditorContext').EditorialSubElementType,
    label: string,
    subId?: string
  ) => void;
  isSubSelected: (
    subType: import('../../../context/ActiveEditorContext').EditorialSubElementType,
    subId?: string
  ) => boolean;
  getSubRingClass: (
    subType: import('../../../context/ActiveEditorContext').EditorialSubElementType,
    subId?: string
  ) => string;
  onUpdateChapterConfig: <K extends keyof Omit<import('../../../types/block-builder.types').EditorialSpreadConfig, 'version'>>(
    section: K,
    updates: Partial<NonNullable<import('../../../types/block-builder.types').EditorialSpreadConfig[K]>>
  ) => void;
  onUpdateChapterOverride: <K extends keyof import('../../../types/block-builder.types').EditorialElementOverrides>(
    key: K,
    updates: Partial<NonNullable<import('../../../types/block-builder.types').EditorialElementOverrides[K]>>
  ) => void;
  renderNestedBlock?: (
    childBlock: LessonBlockItem,
    onUpdateChild: (updates: Partial<LessonBlockItem>) => void
  ) => React.ReactNode;
}
