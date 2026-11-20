'use client';

import { useState } from 'react';
import { LessonBlockItem, StoryChapterBlockData, StoryChapterUnit, EditorialSpreadConfig } from '../../../types/block-builder.types';
import { getChapterLabel, StoryChapterLayoutStrategy } from '../../../strategies/story-chapter-layout.strategy';
import { useActiveEditor } from '../../../context/ActiveEditorContext';
import { StorySubElementInspector } from './StorySubElementInspector';
import { EditorialLayoutType, EditorialColumnRatioEnum, InspectorTabKey } from '@/constants/lesson-builder.constant';
import { StoryChapterSelector, StoryLayoutTabPanel, CONTENT_WIDTH_NORMAL, CONTENT_WIDTH_WIDE, CONTENT_WIDTH_FULL } from './StoryChapterLayoutPanels';
import type { UpdateConfigFn } from './StoryChapterLayoutPanels';
import { StoryTypographyTabPanel, StoryAdvancedTabPanel, CONFIG_SECTION_TYPOGRAPHY, FONT_FAMILY_SERIF, FONT_FAMILY_SANS, FONT_NAME_SERIF, FONT_NAME_SANS, TYPO_PRESET_MAGAZINE, TYPO_PRESET_CLASSIC, TYPO_PRESET_MODERN, CONFIG_SECTION_APPEARANCE } from './StoryChapterStylePanels';

interface StoryChapterBlockInspectorProps {
  block: StoryChapterBlockData;
  onUpdateBlock: (id: string, updates: Partial<LessonBlockItem>) => void;
}

const CONTENT_WIDTH_NARROW = 'NARROW';

export function StoryChapterBlockInspector({
  block: sc,
  onUpdateBlock,
}: StoryChapterBlockInspectorProps) {
  const {
    activeSubElement,
    setActiveSubElement,
    activeChapterId,
    setActiveChapterId,
  } = useActiveEditor();
  const [activeTab, setActiveTab] = useState<InspectorTabKey>(InspectorTabKey.LAYOUT);
  const [showChapterList, setShowChapterList] = useState(false);

  const chapters: StoryChapterUnit[] =
    StoryChapterLayoutStrategy.normalizeStoryChapters(sc);
  const activeChap =
    chapters.find((c) => c.id === activeChapterId) || chapters[0];
  const activeChapIndex = Math.max(
    0,
    chapters.findIndex((c) => c.id === activeChap?.id)
  );

  const edConfig: EditorialSpreadConfig =
    activeChap?.config ||
    sc.config ||
    StoryChapterLayoutStrategy.createDefaultEditorialConfig(EditorialLayoutType.MAGAZINE_GRID);
  const appearance = edConfig.appearance || {
    backgroundColor: '#faf7f2',
    showRegionDividers: true,
    borderRadius: 'XL',
    shadow: 'NONE',
  };

  const commitChaptersToBlock = (
    nextChapters: StoryChapterUnit[],
    extraUpdates?: Partial<StoryChapterBlockData>
  ) => {
    const reindexed =
      StoryChapterLayoutStrategy.sortAndReindexChapters(nextChapters);
    const first = reindexed[0];
    onUpdateBlock(sc.id, {
      chapters: reindexed,
      ...(first
        ? {
            chapterNumber: getChapterLabel(0),
            title: first.title,
            config: first.config,
          }
        : {}),
      ...(extraUpdates || {}),
    });
  };

  const handleAddChapter = () => {
    const newChap = StoryChapterLayoutStrategy.createChapterContainer(
      chapters.length,
      EditorialLayoutType.MAGAZINE_GRID
    );
    commitChaptersToBlock([...chapters, newChap]);
    setActiveChapterId(newChap.id);
  };

  const handleMoveChapter = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= chapters.length) return;
    const cloned = [...chapters];
    const [moved] = cloned.splice(idx, 1);
    cloned.splice(target, 0, moved);
    commitChaptersToBlock(cloned.map((ch, i) => ({ ...ch, order: i })));
    setActiveChapterId(moved.id);
  };

  const handleRemoveChapter = (chapId: string) => {
    if (chapters.length <= 1) return;
    const filtered = chapters
      .filter((c) => c.id !== chapId)
      .map((ch, i) => ({ ...ch, order: i }));
    commitChaptersToBlock(filtered);
    if (activeChap?.id === chapId) {
      setActiveChapterId(filtered[0]?.id || null);
    }
  };

  if (activeSubElement && activeSubElement.parentBlockId === sc.id) {
    return (
      <StorySubElementInspector
        block={sc}
        subSelection={activeSubElement}
        edConfig={edConfig}
        onBackToSpread={() => setActiveSubElement(null)}
        onUpdateBlock={onUpdateBlock}
      />
    );
  }

  const updateEditorialConfig: UpdateConfigFn = (section, updates) => {
    const nextConfig: EditorialSpreadConfig = {
      ...edConfig,
      [section]: {
        ...(edConfig[section] || {}),
        ...updates,
      },
    };
    const nextChapters = chapters.map((c) =>
      c.id === activeChap?.id ? { ...c, config: nextConfig } : c
    );
    commitChaptersToBlock(nextChapters, {
      ...(activeChapIndex === 0 || section === CONFIG_SECTION_APPEARANCE
        ? { config: nextConfig }
        : {}),
    });
  };

  const currentStylePreset =
    edConfig.typography.headingFont === FONT_FAMILY_SANS &&
    edConfig.typography.bodyFont === FONT_FAMILY_SANS
      ? TYPO_PRESET_MODERN
      : edConfig.typography.headingFont === FONT_FAMILY_SERIF &&
        edConfig.typography.bodyFont === FONT_FAMILY_SERIF
      ? TYPO_PRESET_CLASSIC
      : TYPO_PRESET_MAGAZINE;

  const applyTypographyPreset = (preset: 'MAGAZINE' | 'CLASSIC' | 'MODERN') => {
    if (preset === TYPO_PRESET_MAGAZINE) {
      updateEditorialConfig(CONFIG_SECTION_TYPOGRAPHY, {
        headingFont: FONT_FAMILY_SERIF,
        headingFontName: FONT_NAME_SERIF,
        bodyFont: FONT_FAMILY_SANS,
        bodyFontName: FONT_NAME_SANS,
        dropCap: true,
      });
    } else if (preset === TYPO_PRESET_CLASSIC) {
      updateEditorialConfig(CONFIG_SECTION_TYPOGRAPHY, {
        headingFont: FONT_FAMILY_SERIF,
        headingFontName: 'var(--font-noto-serif), Cambria, serif',
        bodyFont: FONT_FAMILY_SERIF,
        bodyFontName: FONT_NAME_SERIF,
        dropCap: true,
      });
    } else {
      updateEditorialConfig(CONFIG_SECTION_TYPOGRAPHY, {
        headingFont: FONT_FAMILY_SANS,
        headingFontName: FONT_NAME_SANS,
        bodyFont: FONT_FAMILY_SANS,
        bodyFontName: FONT_NAME_SANS,
        dropCap: false,
      });
    }
  };

  const currentRatio = edConfig.layout.columnRatio || EditorialColumnRatioEnum.RATIO_4_8;
  const currentTextCols = edConfig.layout.textColumns === 2 ? 2 : 1;
  const currentGap = edConfig.layout.gap || 'MD';
  const currentWidth =
    edConfig.layout.contentWidth === CONTENT_WIDTH_NORMAL ||
    edConfig.layout.contentWidth === CONTENT_WIDTH_NARROW
      ? CONTENT_WIDTH_NORMAL
      : edConfig.layout.contentWidth === CONTENT_WIDTH_WIDE
      ? CONTENT_WIDTH_WIDE
      : CONTENT_WIDTH_FULL;
  const currentFontSizePreset =
    (edConfig.typography.bodyFontSizePx || 16) <= 14
      ? 'SM'
      : (edConfig.typography.bodyFontSizePx || 16) >= 18
      ? 'LG'
      : 'MD';

  return (
    <div className="space-y-4">
      <StoryChapterSelector
        chapters={chapters}
        activeChap={activeChap}
        activeChapIndex={activeChapIndex}
        showChapterList={showChapterList}
        setShowChapterList={setShowChapterList}
        setActiveChapterId={setActiveChapterId}
        handleAddChapter={handleAddChapter}
        handleMoveChapter={handleMoveChapter}
        handleRemoveChapter={handleRemoveChapter}
      />

      <div className="grid grid-cols-3 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
        {[
          { id: InspectorTabKey.LAYOUT, label: 'Bố cục' },
          { id: InspectorTabKey.TYPOGRAPHY, label: 'Kiểu chữ' },
          { id: InspectorTabKey.CONTENT, label: 'Nâng cao' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-stone-950 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === InspectorTabKey.LAYOUT && (
        <StoryLayoutTabPanel
          edConfig={edConfig}
          updateEditorialConfig={updateEditorialConfig}
          currentRatio={currentRatio}
          currentTextCols={currentTextCols}
          currentGap={currentGap}
          currentWidth={currentWidth}
        />
      )}

      {activeTab === InspectorTabKey.TYPOGRAPHY && (
        <StoryTypographyTabPanel
          edConfig={edConfig}
          updateEditorialConfig={updateEditorialConfig}
          currentStylePreset={currentStylePreset}
          applyTypographyPreset={applyTypographyPreset}
          currentFontSizePreset={currentFontSizePreset}
        />
      )}

      {activeTab === InspectorTabKey.CONTENT && (
        <StoryAdvancedTabPanel
          appearance={appearance}
          updateEditorialConfig={updateEditorialConfig}
        />
      )}
    </div>
  );
}
