'use client';

import React from 'react';
import { ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';
import { EditorialSpreadConfig } from '../../../types/block-builder.types';

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
