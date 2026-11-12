'use client';

import React from 'react';
import { X } from 'lucide-react';
import { ChapterBlockZone } from '../../../types/block-builder.types';
import { LessonBlockType } from '../../../types/block-palette.types';
import { STORY_CHAPTER_ALLOWED_NESTED_BLOCKS } from '../../../strategies/story-chapter-layout.strategy';
import { ChapterBlockZoneEnum } from '@/constants/lesson-builder.constant';

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
