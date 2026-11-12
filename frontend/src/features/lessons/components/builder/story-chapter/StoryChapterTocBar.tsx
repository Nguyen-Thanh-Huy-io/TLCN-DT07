'use client';

import React from 'react';
import { BookOpen, GripVertical, Plus } from 'lucide-react';
import { StoryChapterUnit } from '../../../types/block-builder.types';
import { getChapterLabel } from '../../../strategies/story-chapter-layout.strategy';

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
