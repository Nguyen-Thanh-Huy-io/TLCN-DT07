'use client';

import React, { useState } from 'react';
import { Plus, ScrollText } from 'lucide-react';
import {
  StoryChapterUnit,
  EditorialSpreadConfig,
} from '../../types/block-builder.types';
import {
  getChapterLabel,
  StoryChapterLayoutStrategy,
  STORY_SUBJECT_TYPE_OPTIONS,
} from '../../strategies/story-chapter-layout.strategy';
import { useActiveEditor } from '../../context/ActiveEditorContext';
import { StoryChapterBlockEditorProps } from './story-chapter/types';
import { StoryChapterTocBar } from './story-chapter/StoryChapterTocBar';
import { StoryChapterRenderer } from './story-chapter/StoryChapterRenderer';

export type { StoryChapterBlockEditorProps };

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
        <StoryChapterTocBar
          subjectBadge={subjectOption.badge}
          chapters={sortedChapters}
          currentActiveChapterId={currentActiveChapterId}
          draggedChapterIndex={draggedChapterIndex}
          setDraggedChapterIndex={setDraggedChapterIndex}
          onReorderChapters={handleReorderChapters}
          onScrollToChapter={scrollToChapter}
          onAddChapter={handleAddChapter}
        />
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
