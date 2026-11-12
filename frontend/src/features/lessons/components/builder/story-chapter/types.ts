'use client';

import React from 'react';
import {
  StoryChapterBlockData,
  StoryChapterUnit,
  LessonBlockItem,
  ChapterBlockZone,
  EditorialSpreadConfig,
  EditorialElementOverrides,
} from '../../../types/block-builder.types';
import { EditorialSubElementType } from '../../../context/ActiveEditorContext';

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
