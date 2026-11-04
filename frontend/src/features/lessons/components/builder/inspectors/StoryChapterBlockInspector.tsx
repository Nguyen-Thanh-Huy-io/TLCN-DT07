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

interface StoryChapterBlockInspectorProps {
  block: StoryChapterBlockData;
  onUpdateBlock: (id: string, updates: Partial<LessonBlockItem>) => void;
}

const LAYOUT_OPTIONS: Array<{
  type: EditorialLayout;
  label: string;
  defaultRatio: EditorialColumnRatio;
  renderThumb: () => React.ReactNode;
}> = [
  {
    type: 'MAGAZINE_GRID',
    label: 'Lưới',
    defaultRatio: '4_8',
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
    type: 'ASYMMETRIC',
    label: 'Bất đối xứng',
    defaultRatio: '7_5',
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
    type: 'SPLIT',
    label: 'Chia đôi',
    defaultRatio: '6_6',
    renderThumb: () => (
      <div className="w-full h-7 grid grid-cols-12 gap-1 p-0.5">
        <div className="col-span-6 bg-stone-300 rounded-[2px]" />
        <div className="col-span-6 bg-stone-400/85 rounded-[2px]" />
      </div>
    ),
  },
  {
    type: 'FULL_WIDTH',
    label: 'Toàn chiều rộng',
    defaultRatio: '6_6',
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
  { id: '4_8', label: '4:8' },
  { id: '5_7', label: '5:7' },
  { id: '6_6', label: '6:6' },
  { id: '7_5', label: '7:5' },
  { id: '8_4', label: '8:4' },
];

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
  const [activeTab, setActiveTab] = useState<
    'LAYOUT' | 'TYPOGRAPHY' | 'ADVANCED'
  >('LAYOUT');
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
    StoryChapterLayoutStrategy.createDefaultEditorialConfig('MAGAZINE_GRID');
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
      'MAGAZINE_GRID'
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

  const updateEditorialConfig = <
    K extends keyof Omit<EditorialSpreadConfig, 'version'>
  >(
    section: K,
    updates: Partial<NonNullable<EditorialSpreadConfig[K]>>
  ) => {
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
      ...(activeChapIndex === 0 || section === 'appearance'
        ? { config: nextConfig }
        : {}),
    });
  };

  // Xác định Phong cách chữ hiện tại (Tạp chí / Cổ điển / Hiện đại)
  const currentStylePreset =
    edConfig.typography.headingFont === 'SANS' &&
    edConfig.typography.bodyFont === 'SANS'
      ? 'MODERN'
      : edConfig.typography.headingFont === 'SERIF' &&
        edConfig.typography.bodyFont === 'SERIF'
      ? 'CLASSIC'
      : 'MAGAZINE';

  const applyTypographyPreset = (preset: 'MAGAZINE' | 'CLASSIC' | 'MODERN') => {
    if (preset === 'MAGAZINE') {
      updateEditorialConfig('typography', {
        headingFont: 'SERIF',
        headingFontName: 'var(--font-merriweather), Georgia, serif',
        bodyFont: 'SANS',
        bodyFontName: 'var(--font-be-vietnam-pro), sans-serif',
        dropCap: true,
      });
    } else if (preset === 'CLASSIC') {
      updateEditorialConfig('typography', {
        headingFont: 'SERIF',
        headingFontName: 'var(--font-noto-serif), Cambria, serif',
        bodyFont: 'SERIF',
        bodyFontName: 'var(--font-merriweather), Georgia, serif',
        dropCap: true,
      });
    } else {
      updateEditorialConfig('typography', {
        headingFont: 'SANS',
        headingFontName: 'var(--font-be-vietnam-pro), sans-serif',
        bodyFont: 'SANS',
        bodyFontName: 'var(--font-be-vietnam-pro), sans-serif',
        dropCap: false,
      });
    }
  };

  const currentRatio = edConfig.layout.columnRatio || '4_8';
  const currentTextCols = edConfig.layout.textColumns === 2 ? 2 : 1;
  const currentGap = edConfig.layout.gap || 'MD';
  const currentWidth =
    edConfig.layout.contentWidth === 'NORMAL' ||
    edConfig.layout.contentWidth === 'NARROW'
      ? 'NORMAL'
      : edConfig.layout.contentWidth === 'WIDE'
      ? 'WIDE'
      : 'FULL';
  const currentFontSizePreset =
    (edConfig.typography.bodyFontSizePx || 16) <= 14
      ? 'SM'
      : (edConfig.typography.bodyFontSizePx || 16) >= 18
      ? 'LG'
      : 'MD';

  return (
    <div className="space-y-4">
      {/* HEADER NGỮ CẢNH CHƯƠNG ĐANG CHỈNH SỬA */}
      <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/90 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Story Chapter
            </div>
            <div className="text-sm font-bold text-stone-900 truncate">
              Chương {activeChapIndex + 1} ·{' '}
              {activeChap?.title || 'Chưa đặt tên'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowChapterList((prev) => !prev)}
            className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold shrink-0 cursor-pointer hover:bg-emerald-100"
          >
            {showChapterList
              ? 'Đóng danh sách'
              : `Đang chỉnh sửa (${chapters.length})`}
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

      {/* 3 TAB RÚT GỌN: BỐ CỤC | KIỂU CHỮ | NÂNG CAO */}
      <div className="grid grid-cols-3 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
        {[
          { id: 'LAYOUT', label: 'Bố cục' },
          { id: 'TYPOGRAPHY', label: 'Kiểu chữ' },
          { id: 'ADVANCED', label: 'Nâng cao' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(tab.id as 'LAYOUT' | 'TYPOGRAPHY' | 'ADVANCED')
              }
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

      {/* =====================================================================
          TAB 1: BỐ CỤC (Chỉ giữ đúng 5 thuộc tính cốt lõi)
          ===================================================================== */}
      {activeTab === 'LAYOUT' && (
        <div className="space-y-4">
          {/* 1. Kiểu bố cục */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Kiểu bố cục
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LAYOUT_OPTIONS.map((card) => {
                const isSelected = edConfig.layout.type === card.type;
                return (
                  <button
                    key={card.type}
                    type="button"
                    onClick={() =>
                      updateEditorialConfig('layout', {
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

          {/* 2. Tỷ lệ cột */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Tỷ lệ cột
            </label>
            <div className="grid grid-cols-5 gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
              {COLUMN_RATIOS.map((r) => {
                const active = currentRatio === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() =>
                      updateEditorialConfig('layout', { columnRatio: r.id })
                    }
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      active
                        ? 'bg-white text-blue-600 font-bold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Số cột văn bản */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Số cột văn bản
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
              {([1, 2] as const).map((cols) => {
                const active = currentTextCols === cols;
                return (
                  <button
                    key={cols}
                    type="button"
                    onClick={() =>
                      updateEditorialConfig('layout', { textColumns: cols })
                    }
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      active
                        ? 'bg-white text-blue-600 font-bold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {cols} cột
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Khoảng cách */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Khoảng cách
            </label>
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
                      updateEditorialConfig('layout', {
                        gap: g.id,
                        rowGap: g.id,
                      })
                    }
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      active
                        ? 'bg-white text-blue-600 font-bold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Chiều rộng */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Chiều rộng
            </label>
            <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
              {(
                [
                  { id: 'NORMAL', label: 'Bình thường' },
                  { id: 'WIDE', label: 'Rộng' },
                  { id: 'FULL', label: 'Toàn màn hình' },
                ] as const
              ).map((w) => {
                const active = currentWidth === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() =>
                      updateEditorialConfig('layout', { contentWidth: w.id })
                    }
                    className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                      active
                        ? 'bg-white text-blue-600 font-bold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: KIỂU CHỮ (Chỉ giữ đúng 5 thuộc tính cốt lõi)
          ===================================================================== */}
      {activeTab === 'TYPOGRAPHY' && (
        <div className="space-y-4">
          {/* 1. Phong cách */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Phong cách
            </label>
            <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
              {(
                [
                  { id: 'MAGAZINE', label: 'Tạp chí' },
                  { id: 'CLASSIC', label: 'Cổ điển' },
                  { id: 'MODERN', label: 'Hiện đại' },
                ] as const
              ).map((p) => {
                const active = currentStylePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyTypographyPreset(p.id)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      active
                        ? 'bg-white text-blue-600 font-bold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Font tiêu đề */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Font tiêu đề
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
              {(
                [
                  { id: 'SERIF', label: 'Serif (Có chân)' },
                  { id: 'SANS', label: 'Sans-serif' },
                ] as const
              ).map((f) => {
                const active =
                  (edConfig.typography.headingFont || 'SERIF') === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() =>
                      updateEditorialConfig('typography', {
                        headingFont: f.id,
                        headingFontName:
                          f.id === 'SERIF'
                            ? 'var(--font-merriweather), Georgia, serif'
                            : 'var(--font-be-vietnam-pro), sans-serif',
                      })
                    }
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      active
                        ? 'bg-white text-blue-600 font-bold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Font nội dung */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Font nội dung
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
              {(
                [
                  { id: 'SERIF', label: 'Serif (Có chân)' },
                  { id: 'SANS', label: 'Sans-serif' },
                ] as const
              ).map((f) => {
                const active =
                  (edConfig.typography.bodyFont || 'SANS') === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() =>
                      updateEditorialConfig('typography', {
                        bodyFont: f.id,
                        bodyFontName:
                          f.id === 'SERIF'
                            ? 'var(--font-merriweather), Georgia, serif'
                            : 'var(--font-be-vietnam-pro), sans-serif',
                      })
                    }
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      active
                        ? 'bg-white text-blue-600 font-bold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Chữ cái đầu lớn (Drop Cap) */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-semibold text-stone-700">
              Chữ cái đầu lớn (Drop Cap)
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={edConfig.typography.dropCap !== false}
              onClick={() =>
                updateEditorialConfig('typography', {
                  dropCap: edConfig.typography.dropCap === false,
                })
              }
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                edConfig.typography.dropCap !== false
                  ? 'bg-blue-600'
                  : 'bg-stone-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition ${
                  edConfig.typography.dropCap !== false
                    ? 'translate-x-4'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 5. Cỡ chữ */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Cỡ chữ
            </label>
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
                      updateEditorialConfig('typography', {
                        bodySize: sz.id,
                        bodyFontSizePx: sz.px,
                      })
                    }
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      active
                        ? 'bg-white text-blue-600 font-bold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {sz.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: NÂNG CAO (Chỉ giữ đúng 4 thuộc tính cốt lõi)
          ===================================================================== */}
      {activeTab === 'ADVANCED' && (
        <div className="space-y-4">
          {/* 1. Màu nền */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Màu nền
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { color: '#faf7f2', label: 'Giấy cổ' },
                { color: '#ffffff', label: 'Trắng sáng' },
                { color: '#f3efe6', label: 'Trầm mặc' },
              ].map((preset) => {
                const active =
                  (appearance.backgroundColor || '#faf7f2') === preset.color;
                return (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() =>
                      updateEditorialConfig('appearance', {
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

          {/* 2. Đường phân cách */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-semibold text-stone-700">
              Đường phân cách
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={appearance.showRegionDividers !== false}
              onClick={() =>
                updateEditorialConfig('appearance', {
                  showRegionDividers: appearance.showRegionDividers === false,
                })
              }
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                appearance.showRegionDividers !== false
                  ? 'bg-blue-600'
                  : 'bg-stone-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition ${
                  appearance.showRegionDividers !== false
                    ? 'translate-x-4'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 3. Hiển thị trên thiết bị di động */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-semibold text-stone-700">
              Hiển thị trên thiết bị di động
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={!appearance.hideOnMobile}
              onClick={() =>
                updateEditorialConfig('appearance', {
                  hideOnMobile: !appearance.hideOnMobile,
                })
              }
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                !appearance.hideOnMobile ? 'bg-blue-600' : 'bg-stone-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition ${
                  !appearance.hideOnMobile ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 4. Hiệu ứng xuất hiện khi cuộn */}
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
                const active =
                  (appearance.scrollAnimation || 'NONE') === anim.id;
                return (
                  <button
                    key={anim.id}
                    type="button"
                    onClick={() =>
                      updateEditorialConfig('appearance', {
                        scrollAnimation: anim.id,
                      })
                    }
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      active
                        ? 'bg-white text-blue-600 font-bold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {anim.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
