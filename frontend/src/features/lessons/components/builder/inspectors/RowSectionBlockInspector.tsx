'use client';

import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { EmojiPickerButton } from '@/components/common/EmojiPickerButton';
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
  CalloutBlockData,
  HeadingBlockData,
  LessonBlockItem,
  RowFrameStyle,
  RowGapSize,
  RowSectionBlockData,
  RowVerticalAlign,
} from '../../../types/block-builder.types';
import { LessonBlockType } from '../../../types/editor.types';
import {
  ROW_FRAME_STYLE_OPTIONS,
  ROW_GAP_OPTIONS,
  ROW_LAYOUT_PRESETS,
  ROW_RATIO_PRESETS,
  ROW_VERTICAL_ALIGN_OPTIONS,
  type RowLayoutPresetDefinition,
} from '../../../constants/lesson.constants';
import { useActiveEditor } from '../../../context/ActiveEditorContext';
import { RowLayoutPresetRegistry } from '../../../strategies/row-layout.strategy';
import { TypographyInspectorPanel } from './TypographyInspectorPanel';
import {
  CalloutBlockInspector,
  HeadingBlockInspector,
} from './SimpleBlockInspectors';

enum RowInspectorTab {
  COLUMNS = 'COLUMNS',
  TYPOGRAPHY = 'TYPOGRAPHY',
}

interface RowSectionBlockInspectorProps {
  block: RowSectionBlockData;
  onUpdateBlock: (id: string, updates: Partial<LessonBlockItem>) => void;
  onChangeRowColumnCount?: (rowId: string, count: number) => void;
  onUpdateRowRatio?: (rowId: string, widths: number[]) => void;
}

function NestedChildInspector({
  row,
  colId,
  childBlock,
  label,
  onClearSelection,
  onUpdateBlock,
}: {
  row: RowSectionBlockData;
  colId: string;
  childBlock: LessonBlockItem;
  label: string;
  onClearSelection: () => void;
  onUpdateBlock: (id: string, updates: Partial<LessonBlockItem>) => void;
}) {
  const handleUpdateChild = (_id: string, updates: Partial<LessonBlockItem>) => {
    const nextCols = row.columns.map((c) =>
      c.id !== colId
        ? c
        : {
            ...c,
            blocks: c.blocks.map((b) =>
              b.id === childBlock.id ? ({ ...b, ...updates } as LessonBlockItem) : b
            ),
          }
    );
    onUpdateBlock(row.id, { columns: nextCols });
  };

  return (
    <div className="space-y-3.5 text-xs text-slate-700">
      <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-indigo-700">
            Đang chọn khối trong cột
          </span>
          <button
            type="button"
            onClick={onClearSelection}
            className="text-xs font-bold text-slate-800 hover:text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Cấu hình cột</span>
          </button>
        </div>
        <div className="text-xs font-bold text-slate-900 truncate">{label}</div>
      </div>

      {childBlock.type === LessonBlockType.TEXT && <TypographyInspectorPanel />}
      {childBlock.type === LessonBlockType.HEADING && (
        <HeadingBlockInspector
          block={childBlock as HeadingBlockData}
          onUpdateBlock={handleUpdateChild}
        />
      )}
      {childBlock.type === LessonBlockType.CALLOUT && (
        <div className="space-y-3.5">
          <CalloutBlockInspector
            block={childBlock as CalloutBlockData}
            onUpdateBlock={handleUpdateChild}
          />
          <TypographyInspectorPanel hideEditorialLayout />
        </div>
      )}
      {childBlock.type !== LessonBlockType.TEXT &&
        childBlock.type !== LessonBlockType.HEADING &&
        childBlock.type !== LessonBlockType.CALLOUT && (
          <p className="text-xs text-slate-500 leading-relaxed">
            Nội dung của khối này được chỉnh sửa trực tiếp ngay trong cột trên khung tài liệu ở giữa.
          </p>
        )}
    </div>
  );
}

function PresetPreviewStrip({
  preset,
  active,
}: {
  preset: RowLayoutPresetDefinition;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-1 w-full h-3.5">
      {preset.widths.map((w, idx) => (
        <span
          key={idx}
          style={{ width: `${w}%` }}
          className={`h-full rounded-[3px] transition-colors ${
            active ? 'bg-indigo-500/80' : 'bg-slate-200'
          } ${
            preset.showColumnDivider && idx > 0
              ? 'border-l border-indigo-400/70'
              : ''
          }`}
        />
      ))}
    </div>
  );
}

export function RowSectionBlockInspector({
  block: row,
  onUpdateBlock,
  onChangeRowColumnCount,
  onUpdateRowRatio,
}: RowSectionBlockInspectorProps) {
  const { activeSubElement, setActiveSubElement } = useActiveEditor();
  const [activeTab, setActiveTab] = useState<RowInspectorTab>(RowInspectorTab.COLUMNS);

  if (activeSubElement && activeSubElement.parentBlockId === row.id && activeSubElement.subId) {
    const [colId, childId] = activeSubElement.subId.split('::');
    const targetCol = row.columns.find((c) => c.id === colId);
    const targetChild = targetCol?.blocks.find((b) => b.id === childId);
    if (targetCol && targetChild) {
      return (
        <NestedChildInspector
          row={row}
          colId={colId}
          childBlock={targetChild}
          label={activeSubElement.label}
          onClearSelection={() => setActiveSubElement(null)}
          onUpdateBlock={onUpdateBlock}
        />
      );
    }
  }

  const colCount = row.columnCount || row.columns.length || 2;
  const presets = ROW_RATIO_PRESETS[colCount] || [];
  const currentValues = row.columns.map((c) => Math.round(c.widthPercent));
  const matchedPreset = presets.find(
    (p) =>
      p.values.length === currentValues.length &&
      p.values.every((v, i) => Math.abs(Math.round(v) - currentValues[i]) <= 1)
  );
  const activeLayoutPreset = RowLayoutPresetRegistry.detectMatchingPreset(row);
  const currentGap = row.gapSize ?? RowGapSize.MD;
  const currentAlign = row.verticalAlign ?? RowVerticalAlign.TOP;
  const currentFrame = row.frameStyle ?? RowFrameStyle.NONE;

  return (
    <div className="space-y-3.5 text-xs text-slate-700">
      <div className={`grid grid-cols-2 ${INSPECTOR_SEG_GROUP_CLS}`}>
        <button
          type="button"
          onClick={() => setActiveTab(RowInspectorTab.COLUMNS)}
          className={`grid h-8 place-items-center transition cursor-pointer ${
            activeTab === RowInspectorTab.COLUMNS
              ? INSPECTOR_SEG_BTN_ACTIVE
              : INSPECTOR_SEG_BTN_IDLE
          }`}
        >
          Cấu hình cột
        </button>
        <button
          type="button"
          onClick={() => setActiveTab(RowInspectorTab.TYPOGRAPHY)}
          className={`grid h-8 place-items-center transition cursor-pointer ${
            activeTab === RowInspectorTab.TYPOGRAPHY
              ? INSPECTOR_SEG_BTN_ACTIVE
              : INSPECTOR_SEG_BTN_IDLE
          }`}
        >
          Định dạng chữ
        </button>
      </div>

      {activeTab === RowInspectorTab.TYPOGRAPHY ? (
        <TypographyInspectorPanel />
      ) : (
        <div className="space-y-3.5">
          <InspectorAccordionSection title="Mẫu bố cục nhanh">
            <div className="grid grid-cols-2 gap-2 pt-1">
              {ROW_LAYOUT_PRESETS.map((preset) => {
                const isActive = activeLayoutPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    data-testid={`btn-row-preset-${preset.id}`}
                    title={preset.description}
                    onClick={() =>
                      onUpdateBlock(row.id, RowLayoutPresetRegistry.applyPreset(row, preset.id))
                    }
                    className={`p-2 rounded-lg border text-left space-y-1.5 transition cursor-pointer ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50/70 ring-1 ring-indigo-500/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <PresetPreviewStrip preset={preset} active={isActive} />
                    <div className="text-[11px] font-bold text-slate-800 truncate">
                      {preset.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </InspectorAccordionSection>

          <InspectorAccordionSection title="Lưới cột">
            <InspectorFieldRow label="Số lượng cột">
              <div className={`grid w-36 grid-cols-4 ${INSPECTOR_SEG_GROUP_CLS}`}>
                {([1, 2, 3, 4] as const).map((num) => (
                  <button
                    key={num}
                    type="button"
                    data-testid={`btn-col-count-${num}`}
                    onClick={() => onChangeRowColumnCount?.(row.id, num)}
                    className={`grid h-7 place-items-center text-[11px] transition cursor-pointer ${
                      colCount === num ? INSPECTOR_SEG_BTN_ACTIVE : INSPECTOR_SEG_BTN_IDLE
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </InspectorFieldRow>

            {presets.length > 0 && colCount > 1 && (
              <InspectorFieldRow label="Tỷ lệ chia">
                <select
                  data-testid="select-row-ratio"
                  aria-label="Tỷ lệ phân chia cột"
                  value={matchedPreset?.id || presets[0]?.id}
                  onChange={(e) => {
                    const found = presets.find((p) => p.id === e.target.value);
                    if (found) onUpdateRowRatio?.(row.id, found.values);
                  }}
                  className={`${INSPECTOR_SELECT_CLS} w-44`}
                >
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </InspectorFieldRow>
            )}
          </InspectorAccordionSection>

          <InspectorAccordionSection title="Hiển thị cột">
            <InspectorFieldRow label="Khoảng cách">
              <div className={`grid w-36 grid-cols-3 ${INSPECTOR_SEG_GROUP_CLS}`}>
                {ROW_GAP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    data-testid={`btn-row-gap-${opt.value}`}
                    onClick={() => onUpdateBlock(row.id, { gapSize: opt.value })}
                    className={`grid h-7 place-items-center text-[11px] transition cursor-pointer ${
                      currentGap === opt.value
                        ? INSPECTOR_SEG_BTN_ACTIVE
                        : INSPECTOR_SEG_BTN_IDLE
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </InspectorFieldRow>

            <InspectorFieldRow label="Căn dọc cột">
              <div className={`grid w-36 grid-cols-3 ${INSPECTOR_SEG_GROUP_CLS}`}>
                {ROW_VERTICAL_ALIGN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    data-testid={`btn-row-align-${opt.value}`}
                    onClick={() => onUpdateBlock(row.id, { verticalAlign: opt.value })}
                    className={`grid h-7 place-items-center text-[11px] transition cursor-pointer ${
                      currentAlign === opt.value
                        ? INSPECTOR_SEG_BTN_ACTIVE
                        : INSPECTOR_SEG_BTN_IDLE
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </InspectorFieldRow>

            {colCount > 1 && (
              <InspectorFieldRow label="Đường kẻ ngăn">
                <InspectorToggleSwitch
                  ariaLabel="Đường kẻ ngăn giữa các cột"
                  checked={Boolean(row.showColumnDivider)}
                  onChange={(next) =>
                    onUpdateBlock(row.id, { showColumnDivider: next })
                  }
                />
              </InspectorFieldRow>
            )}

            <InspectorFieldRow label="Khung bao">
              <div className={`grid min-w-[164px] grid-cols-3 ${INSPECTOR_SEG_GROUP_CLS}`}>
                {ROW_FRAME_STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    data-testid={`btn-row-frame-${opt.value}`}
                    title={opt.title}
                    onClick={() => onUpdateBlock(row.id, { frameStyle: opt.value })}
                    className={`h-7 px-1.5 flex items-center justify-center text-[11px] whitespace-nowrap transition cursor-pointer ${
                      currentFrame === opt.value
                        ? INSPECTOR_SEG_BTN_ACTIVE
                        : INSPECTOR_SEG_BTN_IDLE
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </InspectorFieldRow>

            {currentFrame !== RowFrameStyle.NONE && (
              <InspectorFieldRow label="Icon góc">
                <EmojiPickerButton
                  value={row.frameIcon}
                  displayEmoji={row.frameIcon?.trim()}
                  placeholder="Chọn icon"
                  align="right"
                  ariaLabel="Chọn icon góc khung bao"
                  onChange={(next) => onUpdateBlock(row.id, { frameIcon: next || '' })}
                />
              </InspectorFieldRow>
            )}
          </InspectorAccordionSection>
        </div>
      )}
    </div>
  );
}
