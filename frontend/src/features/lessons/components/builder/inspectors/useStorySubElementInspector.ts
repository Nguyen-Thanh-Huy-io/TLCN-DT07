'use client';

import { EditorialElementOverrides, EditorialSpreadConfig, ImageBlockData, LessonBlockItem, QuoteBlockData, StoryChapterBlockData, StoryChapterUnit } from '../../../types/block-builder.types';
import { getChapterLabel, StoryChapterLayoutStrategy } from '../../../strategies/story-chapter-layout.strategy';
import { ActiveSubElementSelection } from '../../../context/ActiveEditorContext';
import { LessonBlockType } from '../../../types/editor.types';

export interface StorySubElementInspectorProps {
  block: StoryChapterBlockData;
  subSelection: ActiveSubElementSelection;
  edConfig: EditorialSpreadConfig;
  onBackToSpread: () => void;
  onUpdateBlock: (id: string, updates: Partial<LessonBlockItem>) => void;
}

export function useStorySubElementInspector({ block: sc, subSelection, onUpdateBlock }: Pick<StorySubElementInspectorProps, 'block' | 'subSelection' | 'onUpdateBlock'>) {
  const chapters: StoryChapterUnit[] =
    StoryChapterLayoutStrategy.normalizeStoryChapters(sc);
  const targetChapterIndex = Math.max(
    0,
    chapters.findIndex((c) => c.id === subSelection.subId)
  );
  const targetChapter = chapters[targetChapterIndex] || chapters[0];
  const overrides: EditorialElementOverrides =
    targetChapter?.overrides || sc.overrides || {};
  const updateTargetChapter = (updates: Partial<StoryChapterUnit>) => {
    if (!targetChapter) return;
    const nextChapters = chapters.map((c) =>
      c.id === targetChapter.id ? { ...c, ...updates } : c
    );
    const first = nextChapters[0];
    onUpdateBlock(sc.id, {
      chapters: nextChapters,
      ...(first
        ? {
            chapterNumber: getChapterLabel(0),
            title: first.title,
            subtitle: first.subtitle || '',
            overrides: first.overrides,
          }
        : {}),
    });
  };
  const targetImageBlock = (targetChapter?.blocks || []).find(
    (b): b is ImageBlockData => b.type === LessonBlockType.IMAGE
  );
  const targetQuoteBlock = (targetChapter?.blocks || []).find(
    (b): b is QuoteBlockData => b.type === LessonBlockType.QUOTE
  );
  const updateChildBlockInTargetChapter = (
    blockType: LessonBlockType,
    updates: Partial<LessonBlockItem>
  ) => {
    if (!targetChapter) return;
    const nextBlocks = (targetChapter.blocks || []).map((b) =>
      b.type === blockType ? ({ ...b, ...updates } as LessonBlockItem) : b
    );
    updateTargetChapter({ blocks: nextBlocks });
  };
  const updateOverride = <K extends keyof EditorialElementOverrides>(
    key: K,
    updates: Partial<NonNullable<EditorialElementOverrides[K]>> | undefined
  ) => {
    const nextOverrides: EditorialElementOverrides = {
      ...overrides,
      [key]: updates ? { ...(overrides[key] || {}), ...updates } : undefined,
    };
    updateTargetChapter({ overrides: nextOverrides });
  };

  return {
    targetChapterIndex,
    targetChapter,
    overrides,
    updateTargetChapter,
    targetImageBlock,
    targetQuoteBlock,
    updateChildBlockInTargetChapter,
    updateOverride,
  };
}

export type StorySubElementInspectorFacade = ReturnType<typeof useStorySubElementInspector>;
