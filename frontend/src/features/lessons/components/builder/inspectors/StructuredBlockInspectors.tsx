'use client';

import React from 'react';
import {
  INSPECTOR_SEG_BTN_ACTIVE,
  INSPECTOR_SEG_BTN_IDLE,
  INSPECTOR_SEG_GROUP_CLS,
  INSPECTOR_SELECT_CLS,
  InspectorAccordionSection,
  InspectorFieldRow,
  InspectorToggleSwitch,
} from '@/components/common/TextStyleControls';
import {
  RowGapSize,
  TimelineSceneStyle,
  TimelineSortOrder,
  type LessonBlockItem,
  type RowSectionBlockData,
  type TimelineBlockData,
  type TimelineDisplayConfig,
} from '../../../types/block-builder.types';

const ROW_PRESETS: ReadonlyArray<{ id: string; label: string; count: number; widths: number[] }> = [
  { id: '1_100', label: '1 cột (100%)', count: 1, widths: [100] },
  { id: '2_50_50', label: '2 cột (50 / 50)', count: 2, widths: [50, 50] },
  { id: '2_35_65', label: '2 cột (35 / 65)', count: 2, widths: [35, 65] },
  { id: '3_eq', label: '3 cột đều', count: 3, widths: [33.33, 33.33, 33.34] },
];

const ROW_GAP_OPTIONS: ReadonlyArray<{ value: RowGapSize; label: string }> = [
  { value: RowGapSize.SM, label: 'Hẹp' },
  { value: RowGapSize.MD, label: 'Vừa' },
  { value: RowGapSize.LG, label: 'Rộng' },
];

const TIMELINE_STYLE_OPTIONS: ReadonlyArray<{ value: TimelineSceneStyle; label: string }> = [
  { value: TimelineSceneStyle.CHRONO_MINIMAL, label: 'Trục dọc' },
  { value: TimelineSceneStyle.MUSEUM_SPLIT, label: 'Chia đôi' },
  { value: TimelineSceneStyle.CINEMATIC_BACKDROP, label: 'Điện ảnh' },
];

const TIMELINE_SORT_OPTIONS: ReadonlyArray<{ value: TimelineSortOrder; label: string }> = [
  { value: TimelineSortOrder.CHRONOLOGICAL, label: 'Xuôi' },
  { value: TimelineSortOrder.REVERSE_CHRONOLOGICAL, label: 'Ngược' },
];

export interface RowSectionBlockInspectorProps {
  block: RowSectionBlockData;
  onUpdateBlock: (id: string, updates: Partial<LessonBlockItem>) => void;
  onChangeRowColumnCount?: (rowId: string, count: number) => void;
  onUpdateRowRatio?: (rowId: string, widths: number[]) => void;
}

export function RowSectionBlockInspector({
  block,
  onUpdateBlock,
  onChangeRowColumnCount,
  onUpdateRowRatio,
}: RowSectionBlockInspectorProps) {
  const columns = Array.isArray(block.columns) ? block.columns : [];
  const currentGap = block.gapSize || RowGapSize.MD;
  const activePreset =
    ROW_PRESETS.find(
      (p) =>
        columns.length === p.count &&
        Math.abs((columns[0]?.widthPercent ?? 50) - p.widths[0]) <= 3,
    ) ?? ROW_PRESETS[1];

  return (
    <InspectorAccordionSection title="Bố cục nhiều cột">
      <InspectorFieldRow label="Số cột & tỷ lệ">
        <select
          aria-label="Số cột và tỷ lệ"
          value={activePreset.id}
          onChange={(e) => {
            const preset = ROW_PRESETS.find((p) => p.id === e.target.value);
            if (!preset) return;
            if (columns.length !== preset.count) {
              onChangeRowColumnCount?.(block.id, preset.count);
            }
            onUpdateRowRatio?.(block.id, preset.widths);
          }}
          className={`${INSPECTOR_SELECT_CLS} w-36`}
        >
          {ROW_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </InspectorFieldRow>

      <InspectorFieldRow label="Khoảng cách">
        <div className={`grid w-36 grid-cols-3 ${INSPECTOR_SEG_GROUP_CLS}`}>
          {ROW_GAP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onUpdateBlock(block.id, { gapSize: opt.value })}
              className={`grid h-7 place-items-center text-[11px] transition cursor-pointer ${
                currentGap === opt.value ? INSPECTOR_SEG_BTN_ACTIVE : INSPECTOR_SEG_BTN_IDLE
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </InspectorFieldRow>

      <InspectorFieldRow label="Đường ngăn cột">
        <InspectorToggleSwitch
          ariaLabel="Đường ngăn giữa các cột"
          checked={Boolean(block.showColumnDivider)}
          onChange={(next) => onUpdateBlock(block.id, { showColumnDivider: next })}
        />
      </InspectorFieldRow>
    </InspectorAccordionSection>
  );
}

export interface TimelineBlockInspectorProps {
  block: TimelineBlockData;
  onUpdateBlock: (id: string, updates: Partial<LessonBlockItem>) => void;
}

export function TimelineBlockInspector({
  block,
  onUpdateBlock,
}: TimelineBlockInspectorProps) {
  const cfg: TimelineDisplayConfig = block.displayConfig || {};
  const currentStyle = cfg.sceneStyle || TimelineSceneStyle.CHRONO_MINIMAL;
  const currentSort = cfg.sortOrder || TimelineSortOrder.CHRONOLOGICAL;

  const updateConfig = (patch: Partial<TimelineDisplayConfig>) => {
    onUpdateBlock(block.id, {
      displayConfig: { ...cfg, ...patch },
    });
  };

  return (
    <InspectorAccordionSection title="Hiển thị dòng thời gian">
      <div className="space-y-1.5">
        <span className="block text-[11px] font-medium text-slate-600">Kiểu trình bày</span>
        <div className={`grid w-full grid-cols-3 ${INSPECTOR_SEG_GROUP_CLS}`}>
          {TIMELINE_STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateConfig({ sceneStyle: opt.value })}
              className={`grid h-7 place-items-center text-[11px] transition cursor-pointer ${
                currentStyle === opt.value ? INSPECTOR_SEG_BTN_ACTIVE : INSPECTOR_SEG_BTN_IDLE
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <InspectorFieldRow label="Thứ tự mốc">
        <div className={`grid w-32 grid-cols-2 ${INSPECTOR_SEG_GROUP_CLS}`}>
          {TIMELINE_SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateConfig({ sortOrder: opt.value })}
              className={`grid h-7 place-items-center text-[11px] transition cursor-pointer ${
                currentSort === opt.value ? INSPECTOR_SEG_BTN_ACTIVE : INSPECTOR_SEG_BTN_IDLE
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </InspectorFieldRow>

      <InspectorFieldRow label="Hiện ảnh & video">
        <InspectorToggleSwitch
          ariaLabel="Hiển thị ảnh và video trong dòng thời gian"
          checked={cfg.showImage !== false}
          onChange={(next) => updateConfig({ showImage: next })}
        />
      </InspectorFieldRow>

      <InspectorFieldRow label="Hiện địa điểm">
        <InspectorToggleSwitch
          ariaLabel="Hiển thị địa điểm trên từng mốc"
          checked={Boolean(cfg.showLocation)}
          onChange={(next) => updateConfig({ showLocation: next })}
        />
      </InspectorFieldRow>
    </InspectorAccordionSection>
  );
}
