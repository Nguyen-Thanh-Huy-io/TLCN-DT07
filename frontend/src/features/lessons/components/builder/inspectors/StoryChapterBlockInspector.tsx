'use client';

import React, { useState } from 'react';
import { Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import {
  LessonBlockItem,
  StoryChapterBlockData,
  StoryChapterUnit,
  EditorialSpreadConfig,
  EditorialLayout,
  EditorialColumnRatio,
} from '../../../types/block-builder.types';
import {
  getChapterLabel,
  StoryChapterLayoutStrategy,
} from '../../../strategies/story-chapter-layout.strategy';
import { useActiveEditor } from '../../../context/ActiveEditorContext';
import { StorySubElementInspector } from './StorySubElementInspector';
import {
  EditorialLayoutType,
  EditorialColumnRatioEnum,
  InspectorTabKey,
} from '@/constants/lesson-builder.constant';

interface StoryChapterBlockInspectorProps {
  block: StoryChapterBlockData;
  onUpdateBlock: (id: string, updates: Partial<LessonBlockItem>) => void;
}

const CONFIG_SECTION_APPEARANCE = 'appearance';
const CONFIG_SECTION_TYPOGRAPHY = 'typography';
const CONFIG_SECTION_LAYOUT = 'layout';

const FONT_FAMILY_SERIF = 'SERIF';
const FONT_FAMILY_SANS = 'SANS';
const FONT_NAME_SERIF = 'var(--font-merriweather), Georgia, serif';
const FONT_NAME_SANS = 'var(--font-be-vietnam-pro), sans-serif';

const TYPO_PRESET_MAGAZINE = 'MAGAZINE';
const TYPO_PRESET_CLASSIC = 'CLASSIC';
const TYPO_PRESET_MODERN = 'MODERN';

const CONTENT_WIDTH_NORMAL = 'NORMAL';
const CONTENT_WIDTH_NARROW = 'NARROW';
const CONTENT_WIDTH_WIDE = 'WIDE';
const CONTENT_WIDTH_FULL = 'FULL';

const TAB_INACTIVE_CLASS = 'text-stone-600 hover:text-stone-900';
const TAB_ACTIVE_CLASS = 'bg-white text-blue-600 font-bold shadow-2xs';
const SWITCH_ON_BG = 'bg-blue-600';
const SWITCH_OFF_BG = 'bg-stone-300';
const SWITCH_ON_TRANSLATE = 'translate-x-4';
const SWITCH_OFF_TRANSLATE = 'translate-x-0';

const LAYOUT_OPTIONS: Array<{
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

const COLUMN_RATIOS: Array<{ id: EditorialColumnRatio; label: string }> = [
  { id: EditorialColumnRatioEnum.RATIO_4_8, label: '4:8' },
  { id: EditorialColumnRatioEnum.RATIO_5_7, label: '5:7' },
  { id: EditorialColumnRatioEnum.RATIO_6_6, label: '6:6' },
  { id: EditorialColumnRatioEnum.RATIO_7_5, label: '7:5' },
  { id: EditorialColumnRatioEnum.RATIO_8_4, label: '8:4' },
];

type UpdateConfigFn = <K extends keyof Omit<EditorialSpreadConfig, 'version'>>(
  section: K,
  updates: Partial<NonNullable<EditorialSpreadConfig[K]>>
) => void;

function StoryChapterSelector({
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

function StoryLayoutTabPanel({
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

function StoryTypographyTabPanel({
  edConfig,
  updateEditorialConfig,
  currentStylePreset,
  applyTypographyPreset,
  currentFontSizePreset,
}: {
  edConfig: EditorialSpreadConfig;
  updateEditorialConfig: UpdateConfigFn;
  currentStylePreset: string;
  applyTypographyPreset: (preset: 'MAGAZINE' | 'CLASSIC' | 'MODERN') => void;
  currentFontSizePreset: string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-700">Phong cách</label>
        <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
          {(
            [
              { id: TYPO_PRESET_MAGAZINE, label: 'Tạp chí' },
              { id: TYPO_PRESET_CLASSIC, label: 'Cổ điển' },
              { id: TYPO_PRESET_MODERN, label: 'Hiện đại' },
            ] as const
          ).map((p) => {
            const active = currentStylePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyTypographyPreset(p.id)}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  active ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-700">Font tiêu đề</label>
        <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
          {(
            [
              { id: FONT_FAMILY_SERIF, label: 'Serif (Có chân)' },
              { id: FONT_FAMILY_SANS, label: 'Sans-serif' },
            ] as const
          ).map((f) => {
            const active =
              (edConfig.typography.headingFont || FONT_FAMILY_SERIF) === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() =>
                  updateEditorialConfig(CONFIG_SECTION_TYPOGRAPHY, {
                    headingFont: f.id,
                    headingFontName:
                      f.id === FONT_FAMILY_SERIF ? FONT_NAME_SERIF : FONT_NAME_SANS,
                  })
                }
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  active ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-700">Font nội dung</label>
        <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
          {(
            [
              { id: FONT_FAMILY_SERIF, label: 'Serif (Có chân)' },
              { id: FONT_FAMILY_SANS, label: 'Sans-serif' },
            ] as const
          ).map((f) => {
            const active =
              (edConfig.typography.bodyFont || FONT_FAMILY_SANS) === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() =>
                  updateEditorialConfig(CONFIG_SECTION_TYPOGRAPHY, {
                    bodyFont: f.id,
                    bodyFontName:
                      f.id === FONT_FAMILY_SERIF ? FONT_NAME_SERIF : FONT_NAME_SANS,
                  })
                }
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  active ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-xs font-semibold text-stone-700">Chữ cái đầu lớn (Drop Cap)</span>
        <button
          type="button"
          role="switch"
          aria-checked={edConfig.typography.dropCap !== false}
          onClick={() =>
            updateEditorialConfig(CONFIG_SECTION_TYPOGRAPHY, {
              dropCap: edConfig.typography.dropCap === false,
            })
          }
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            edConfig.typography.dropCap !== false ? SWITCH_ON_BG : SWITCH_OFF_BG
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition ${
              edConfig.typography.dropCap !== false
                ? SWITCH_ON_TRANSLATE
                : SWITCH_OFF_TRANSLATE
            }`}
          />
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-700">Cỡ chữ</label>
        <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
          {(
            [
              { id: 'SM', label: 'Nhỏ', px: 14 },
              { id: 'MD', label: 'Vừa', px: 16 },
              { id: 'LG', label: 'Lớn', px: 18 },
            ] as const
          ).map((sz) => {
            const active = currentFontSizePreset === sz.id;
            return (
              <button
                key={sz.id}
                type="button"
                onClick={() =>
                  updateEditorialConfig(CONFIG_SECTION_TYPOGRAPHY, {
                    bodySize: sz.id,
                    bodyFontSizePx: sz.px,
                  })
                }
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  active ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
                }`}
              >
                {sz.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StoryAdvancedTabPanel({
  appearance,
  updateEditorialConfig,
}: {
  appearance: NonNullable<EditorialSpreadConfig['appearance']>;
  updateEditorialConfig: UpdateConfigFn;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-700">Màu nền</label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { color: '#faf7f2', label: 'Giấy cổ' },
            { color: '#ffffff', label: 'Trắng sáng' },
            { color: '#f3efe6', label: 'Trầm mặc' },
          ].map((preset) => {
            const active = (appearance.backgroundColor || '#faf7f2') === preset.color;
            return (
              <button
                key={preset.color}
                type="button"
                onClick={() =>
                  updateEditorialConfig(CONFIG_SECTION_APPEARANCE, {
                    backgroundColor: preset.color,
                  })
                }
                className={`px-2 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? 'border-blue-600 bg-blue-50/40 text-blue-700'
                    : 'border-stone-200 bg-white text-stone-700'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0"
                  style={{ backgroundColor: preset.color }}
                />
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-xs font-semibold text-stone-700">Đường phân cách</span>
        <button
          type="button"
          role="switch"
          aria-checked={appearance.showRegionDividers !== false}
          onClick={() =>
            updateEditorialConfig(CONFIG_SECTION_APPEARANCE, {
              showRegionDividers: appearance.showRegionDividers === false,
            })
          }
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            appearance.showRegionDividers !== false ? SWITCH_ON_BG : SWITCH_OFF_BG
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition ${
              appearance.showRegionDividers !== false
                ? SWITCH_ON_TRANSLATE
                : SWITCH_OFF_TRANSLATE
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-xs font-semibold text-stone-700">
          Hiển thị trên thiết bị di động
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={!appearance.hideOnMobile}
          onClick={() =>
            updateEditorialConfig(CONFIG_SECTION_APPEARANCE, {
              hideOnMobile: !appearance.hideOnMobile,
            })
          }
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            !appearance.hideOnMobile ? SWITCH_ON_BG : SWITCH_OFF_BG
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition ${
              !appearance.hideOnMobile ? SWITCH_ON_TRANSLATE : SWITCH_OFF_TRANSLATE
            }`}
          />
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-700">
          Hiệu ứng xuất hiện khi cuộn
        </label>
        <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
          {(
            [
              { id: 'NONE', label: 'Tắt' },
              { id: 'FADE_UP', label: 'Mờ dần' },
              { id: 'REVEAL', label: 'Trượt nhẹ' },
            ] as const
          ).map((anim) => {
            const active = (appearance.scrollAnimation || 'NONE') === anim.id;
            return (
              <button
                key={anim.id}
                type="button"
                onClick={() =>
                  updateEditorialConfig(CONFIG_SECTION_APPEARANCE, {
                    scrollAnimation: anim.id,
                  })
                }
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  active ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
                }`}
              >
                {anim.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
