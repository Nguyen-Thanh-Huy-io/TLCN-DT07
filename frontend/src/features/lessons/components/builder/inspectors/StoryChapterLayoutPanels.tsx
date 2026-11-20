'use client';

import React from 'react';
import { Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { StoryChapterUnit, EditorialSpreadConfig, EditorialLayout, EditorialColumnRatio } from '../../../types/block-builder.types';
import { EditorialLayoutType, EditorialColumnRatioEnum } from '@/constants/lesson-builder.constant';

export const CONFIG_SECTION_LAYOUT = 'layout';

export const CONTENT_WIDTH_NORMAL = 'NORMAL';

export const CONTENT_WIDTH_WIDE = 'WIDE';

export const CONTENT_WIDTH_FULL = 'FULL';

export const TAB_INACTIVE_CLASS = 'text-stone-600 hover:text-stone-900';

export const TAB_ACTIVE_CLASS = 'bg-white text-blue-600 font-bold shadow-2xs';

export const LAYOUT_OPTIONS: Array<{
  type: EditorialLayout;
  label: string;
  defaultRatio: EditorialColumnRatio;
  renderThumb: () => React.ReactNode;
}> = [
  {
    type: EditorialLayoutType.MAGAZINE_GRID,
    label: 'Lưới',
    defaultRatio: EditorialColumnRatioEnum.RATIO_4_8,
    renderThumb: () => (
      <div className="w-full h-7 grid grid-cols-12 gap-1 p-0.5">
        <div className="col-span-4 flex flex-col gap-0.5">
          <div className="h-2 w-2 bg-stone-500 rounded-[1px]" />
          <div className="h-1 w-full bg-stone-300 rounded-[1px]" />
          <div className="h-1 w-4/5 bg-stone-300 rounded-[1px]" />
        </div>
        <div className="col-span-8 flex flex-col gap-0.5 border-l border-stone-300 pl-1">
          <div className="h-1 w-3/4 bg-stone-400 rounded-[1px]" />
          <div className="flex-1 bg-stone-400/80 rounded-[2px]" />
        </div>
      </div>
    ),
  },
  {
    type: EditorialLayoutType.ASYMMETRIC,
    label: 'Bất đối xứng',
    defaultRatio: EditorialColumnRatioEnum.RATIO_7_5,
    renderThumb: () => (
      <div className="w-full h-7 grid grid-cols-12 gap-1 p-0.5">
        <div className="col-span-7 flex flex-col gap-0.5">
          <div className="h-1 w-3/4 bg-stone-400 rounded-[1px]" />
          <div className="flex-1 bg-stone-400/80 rounded-[2px]" />
        </div>
        <div className="col-span-5 flex flex-col gap-0.5 border-l border-stone-300 pl-1">
          <div className="h-1.5 w-full bg-stone-300 rounded-[1px]" />
          <div className="h-1.5 w-4/5 bg-stone-300 rounded-[1px]" />
        </div>
      </div>
    ),
  },
  {
    type: EditorialLayoutType.SPLIT,
    label: 'Chia đôi',
    defaultRatio: EditorialColumnRatioEnum.RATIO_6_6,
    renderThumb: () => (
      <div className="w-full h-7 grid grid-cols-12 gap-1 p-0.5">
        <div className="col-span-6 bg-stone-300 rounded-[2px]" />
        <div className="col-span-6 bg-stone-400/85 rounded-[2px]" />
      </div>
    ),
  },
  {
    type: EditorialLayoutType.FULL_WIDTH,
    label: 'Toàn chiều rộng',
    defaultRatio: EditorialColumnRatioEnum.RATIO_6_6,
    renderThumb: () => (
      <div className="w-full h-7 flex flex-col gap-0.5 p-0.5">
        <div className="h-3.5 w-full bg-stone-400/85 rounded-[2px]" />
        <div className="grid grid-cols-2 gap-1 flex-1">
          <div className="bg-stone-300 rounded-[1px]" />
          <div className="bg-stone-300 rounded-[1px]" />
        </div>
      </div>
    ),
  },
];

export const COLUMN_RATIOS: Array<{ id: EditorialColumnRatio; label: string }> = [
  { id: EditorialColumnRatioEnum.RATIO_4_8, label: '4:8' },
  { id: EditorialColumnRatioEnum.RATIO_5_7, label: '5:7' },
  { id: EditorialColumnRatioEnum.RATIO_6_6, label: '6:6' },
  { id: EditorialColumnRatioEnum.RATIO_7_5, label: '7:5' },
  { id: EditorialColumnRatioEnum.RATIO_8_4, label: '8:4' },
];

export type UpdateConfigFn = <K extends keyof Omit<EditorialSpreadConfig, 'version'>>(
  section: K,
  updates: Partial<NonNullable<EditorialSpreadConfig[K]>>
) => void;

export function StoryChapterSelector({
  chapters,
  activeChap,
  activeChapIndex,
  showChapterList,
  setShowChapterList,
  setActiveChapterId,
  handleAddChapter,
  handleMoveChapter,
  handleRemoveChapter,
}: {
  chapters: StoryChapterUnit[];
  activeChap?: StoryChapterUnit;
  activeChapIndex: number;
  showChapterList: boolean;
  setShowChapterList: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveChapterId: (id: string | null) => void;
  handleAddChapter: () => void;
  handleMoveChapter: (idx: number, dir: -1 | 1) => void;
  handleRemoveChapter: (chapId: string) => void;
}) {
  return (
    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/90 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Story Chapter
          </div>
          <div className="text-sm font-bold text-stone-900 truncate">
            Chương {activeChapIndex + 1} · {activeChap?.title || 'Chưa đặt tên'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowChapterList((prev) => !prev)}
          className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold shrink-0 cursor-pointer hover:bg-emerald-100"
        >
          {showChapterList ? 'Đóng danh sách' : `Đang chỉnh sửa (${chapters.length})`}
        </button>
      </div>

      {showChapterList && (
        <div className="pt-2 border-t border-stone-200 space-y-1">
          {chapters.map((ch, idx) => {
            const isSelected = activeChap?.id === ch.id;
            return (
              <div
                key={ch.id}
                onClick={() => {
                  setActiveChapterId(ch.id);
                  document
                    .getElementById(`story-chapter-unit-${ch.id}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }}
                className={`flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg text-xs cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="truncate flex-1">
                  Chương {idx + 1} · {ch.title}
                </span>
                <div
                  className="flex items-center gap-0.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveChapter(idx, -1)}
                    className="p-0.5 text-stone-500 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === chapters.length - 1}
                    onClick={() => handleMoveChapter(idx, 1)}
                    className="p-0.5 text-stone-500 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  {chapters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChapter(ch.id)}
                      className="p-0.5 text-stone-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={handleAddChapter}
            className="w-full mt-1 py-1.5 rounded-lg border border-dashed border-stone-300 text-xs font-semibold text-stone-700 hover:bg-white flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm chương mới</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function StoryLayoutTabPanel({
  edConfig,
  updateEditorialConfig,
  currentRatio,
  currentTextCols,
  currentGap,
  currentWidth,
}: {
  edConfig: EditorialSpreadConfig;
  updateEditorialConfig: UpdateConfigFn;
  currentRatio: EditorialColumnRatio;
  currentTextCols: number;
  currentGap: string;
  currentWidth: string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-700">Kiểu bố cục</label>
        <div className="grid grid-cols-2 gap-2">
          {LAYOUT_OPTIONS.map((card) => {
            const isSelected = edConfig.layout.type === card.type;
            return (
              <button
                key={card.type}
                type="button"
                onClick={() =>
                  updateEditorialConfig(CONFIG_SECTION_LAYOUT, {
                    type: card.type,
                    columnRatio: card.defaultRatio,
                  })
                }
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500/30'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                {card.renderThumb()}
                <div
                  className={`text-[11px] font-semibold mt-1.5 ${
                    isSelected ? 'text-blue-700' : 'text-stone-700'
                  }`}
                >
                  {card.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-700">Tỷ lệ cột</label>
        <div className="grid grid-cols-5 gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
          {COLUMN_RATIOS.map((r) => {
            const active = currentRatio === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() =>
                  updateEditorialConfig(CONFIG_SECTION_LAYOUT, { columnRatio: r.id })
                }
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  active ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-700">Số cột văn bản</label>
        <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
          {([1, 2] as const).map((cols) => {
            const active = currentTextCols === cols;
            return (
              <button
                key={cols}
                type="button"
                onClick={() =>
                  updateEditorialConfig(CONFIG_SECTION_LAYOUT, { textColumns: cols })
                }
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  active ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
                }`}
              >
                {cols} cột
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-700">Khoảng cách</label>
        <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
          {(
            [
              { id: 'SM', label: 'Nhỏ' },
              { id: 'MD', label: 'Vừa' },
              { id: 'LG', label: 'Lớn' },
            ] as const
          ).map((g) => {
            const active = currentGap === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() =>
                  updateEditorialConfig(CONFIG_SECTION_LAYOUT, {
                    gap: g.id,
                    rowGap: g.id,
                  })
                }
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  active ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-700">Chiều rộng</label>
        <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
          {(
            [
              { id: CONTENT_WIDTH_NORMAL, label: 'Bình thường' },
              { id: CONTENT_WIDTH_WIDE, label: 'Rộng' },
              { id: CONTENT_WIDTH_FULL, label: 'Toàn màn hình' },
            ] as const
          ).map((w) => {
            const active = currentWidth === w.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() =>
                  updateEditorialConfig(CONFIG_SECTION_LAYOUT, {
                    contentWidth: w.id as 'NORMAL' | 'WIDE' | 'FULL',
                  })
                }
                className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                  active ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
                }`}
              >
                {w.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
