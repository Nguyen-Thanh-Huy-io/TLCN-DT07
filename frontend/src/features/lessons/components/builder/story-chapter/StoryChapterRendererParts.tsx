'use client';

import React from 'react';
import { EditorialSpreadConfig, StoryChapterUnit } from '../../../types/block-builder.types';
import { getChapterLabel } from '../../../strategies/story-chapter-layout.strategy';
import { EditorialSubElementType } from '../../../context/ActiveEditorContext';
import { EditorialTransformEnum } from '@/constants/lesson-builder.constant';
import { BookOpen, GripVertical, Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

// --- StoryChapterTocBar.tsx ---
export interface StoryChapterTocBarProps {
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

// --- StoryChapterHeading.tsx ---
export interface StoryChapterHeadingProps {
  chapter: StoryChapterUnit;
  chapterIndex: number;
  chapterNumber: string;
  showChapterNumber: boolean;
  showDividers: boolean;
  headingTypoClass: string;
  headingFontStyle?: string;
  headingTransform?: string;
  headingColor: string;
  onUpdateChapter: (updates: Partial<StoryChapterUnit>) => void;
  onSelectSub: (
    e: React.MouseEvent,
    subType: EditorialSubElementType,
    label: string,
    subId?: string
  ) => void;
  getSubRingClass: (
    subType: EditorialSubElementType,
    subId?: string
  ) => string;
}

export function StoryChapterHeading({
  chapter,
  chapterIndex,
  chapterNumber,
  showChapterNumber,
  showDividers,
  headingTypoClass,
  headingFontStyle,
  headingTransform,
  headingColor,
  onUpdateChapter,
  onSelectSub,
  getSubRingClass,
}: StoryChapterHeadingProps) {
  return (
    <div
      onClick={(e) =>
        onSelectSub(
          e,
          EditorialSubElementType.MAIN_HEADING,
          `${chapterNumber} • Tiêu đề chương`,
          chapter.id
        )
      }
      className={`space-y-2 cursor-pointer ${getSubRingClass(
        EditorialSubElementType.MAIN_HEADING,
        chapter.id
      )}`}
    >
      {showChapterNumber && (
        <div className="flex items-center gap-3">
          {/* Nhãn số chương tự động từ getChapterLabel(index): CHƯƠNG I, CHƯƠNG II... */}
          <span
            data-testid={`auto-chapter-number-${chapterIndex}`}
            className="text-xs font-serif font-bold uppercase tracking-[0.16em] text-stone-900 shrink-0 select-none"
          >
            {chapterNumber}
          </span>
          <span className="text-stone-400 select-none">•</span>
          <input
            type="text"
            value={chapter.subtitle || ''}
            onChange={(e) => onUpdateChapter({ subtitle: e.target.value })}
            placeholder="Tiêu đề phụ (VD: Bối cảnh lịch sử)..."
            aria-label="Tiêu đề phụ của chương"
            className="text-xs font-serif font-bold uppercase tracking-[0.14em] text-stone-700 bg-transparent border-b border-transparent focus:border-stone-900 focus:outline-none py-0.5 min-w-[140px]"
          />
          {showDividers && (
            <span className="flex-1 h-[1.5px] bg-[#785c48]/60" />
          )}
        </div>
      )}

      <input
        type="text"
        value={chapter.title}
        onChange={(e) => onUpdateChapter({ title: e.target.value })}
        placeholder="Nhập tiêu đề chương lịch sử..."
        data-testid={
          chapterIndex === 0
            ? 'input-story-chapter-title'
            : `input-story-chapter-title-${chapterIndex}`
        }
        className={`w-full ${headingTypoClass} font-bold tracking-tight leading-tight bg-transparent border-b border-transparent focus:border-stone-900 focus:outline-none py-0.5 ${
          headingTransform === EditorialTransformEnum.UPPERCASE ? 'uppercase' : ''
        }`}
        style={{
          fontFamily: headingFontStyle || undefined,
          color: headingColor,
        }}
      />
    </div>
  );
}

// --- StoryChapterToolbar.tsx ---
export interface StoryChapterToolbarProps {
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

export const LAYOUT_BADGE_LABEL: Record<string, string> = {
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
