'use client';

import React from 'react';
import { X } from 'lucide-react';
import { EditorialColumnRatio, ChapterBlockZone } from '../../../types/block-builder.types';
import { LessonBlockType } from '../../../types/editor.types';
import { EditorialSubElementType } from '../../../context/ActiveEditorContext';
import { ChapterBlockZoneEnum } from '@/constants/lesson-builder.constant';
import { STORY_CHAPTER_ALLOWED_NESTED_BLOCKS } from '../../../strategies/story-chapter-layout.strategy';
import type { StoryChapterContentBlockProps } from './StoryChapterRenderer';
import { IntroBlockRenderer, ArticleBlockRenderer, QuoteBlockRenderer } from './StoryChapterTextBlocks';
import { ImageBlockRenderer } from './StoryChapterImageBlock';

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

// --- useStoryChapterColumnResize.ts ---
interface UseStoryChapterColumnResizeProps {
  currentRatio?: EditorialColumnRatio;
  onUpdateColumnRatio: (nextRatio: EditorialColumnRatio) => void;
}

export function useStoryChapterColumnResize({
  currentRatio = '6_6',
  onUpdateColumnRatio,
}: UseStoryChapterColumnResizeProps) {
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

      if (nextRatio !== currentRatio) {
        onUpdateColumnRatio(nextRatio);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return { handleStartColumnResize };
}

// --- StoryChapterAddBlockMenu.tsx ---
interface StoryChapterAddBlockMenuProps {
  chapterNumber: string;
  openAddZone: ChapterBlockZone;
  onSetOpenAddZone: (zone: ChapterBlockZone | null) => void;
  onAddChildBlock: (type: LessonBlockType, zone: ChapterBlockZone) => void;
}

export function StoryChapterAddBlockMenu({
  chapterNumber,
  openAddZone,
  onSetOpenAddZone,
  onAddChildBlock,
}: StoryChapterAddBlockMenuProps) {
  return (
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
              onClick={() => onSetOpenAddZone(ChapterBlockZoneEnum.LEFT)}
              className={`px-2 py-0.5 rounded-md cursor-pointer ${
                openAddZone === ChapterBlockZoneEnum.LEFT
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-stone-600'
              }`}
            >
              Cột trái
            </button>
            <button
              type="button"
              onClick={() => onSetOpenAddZone(ChapterBlockZoneEnum.RIGHT)}
              className={`px-2 py-0.5 rounded-md cursor-pointer ${
                openAddZone === ChapterBlockZoneEnum.RIGHT
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
          onClick={() => onSetOpenAddZone(null)}
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
            onClick={() => onAddChildBlock(item.type, openAddZone)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-50 hover:bg-blue-50 hover:text-blue-700 border border-stone-200 hover:border-blue-300 text-stone-800 transition-colors cursor-pointer"
          >
            + {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
