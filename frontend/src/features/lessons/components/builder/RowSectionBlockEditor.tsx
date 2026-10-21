'use client';

import React, { useRef, useState } from 'react';
import { RowSectionBlockData, LessonBlockItem } from '../../types/block-builder.types';
import { LessonBlockType, LessonBlockGroup } from '../../types/block-palette.types';
import { LESSON_BLOCK_ITEMS } from '../../constants/block-palette.constants';
import { ROW_RATIO_PRESETS } from '../../constants/row-layout.constants';
import { RowLayoutStrategy } from '../../strategies/row-layout.strategy';
import { ColumnResizer } from './ColumnResizer';
import { BlockPlacementRuleEngine } from '../../rules/block-placement.rule';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

interface RowSectionBlockEditorProps {
  data: RowSectionBlockData;
  onUpdateRowRatio: (widths: number[]) => void;
  onChangeColumnCount: (count: number) => void;
  onAddBlockToColumn: (columnId: string, type: LessonBlockType, atIndex?: number) => void;
  onUpdateBlockInColumn: (columnId: string, blockId: string, updates: Partial<LessonBlockItem>) => void;
  onRemoveBlockFromColumn: (columnId: string, blockId: string) => void;
  renderChildBlock: (block: LessonBlockItem, columnId: string) => React.ReactNode;
}

export function RowSectionBlockEditor({
  data,
  onUpdateRowRatio,
  onChangeColumnCount,
  onAddBlockToColumn,
  onRemoveBlockFromColumn,
  renderChildBlock,
}: RowSectionBlockEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePickerColumnId, setActivePickerColumnId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);

  const columnCount = data.columnCount || data.columns.length || 1;
  const presets = ROW_RATIO_PRESETS[columnCount] || [];

  const basicItems = LESSON_BLOCK_ITEMS.filter(
    (i) => i.group === LessonBlockGroup.BASIC && i.type !== LessonBlockType.SECTION_ROW
  );
  const specializedItems = LESSON_BLOCK_ITEMS.filter((i) => i.group === LessonBlockGroup.SPECIALIZED);

  const gridTemplate = RowLayoutStrategy.getGridTemplateColumns(data.columns);

  const handleColDragOver = (e: React.DragEvent, col: (typeof data.columns)[0]) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedType = e.dataTransfer.getData('application/x-lesson-block') as LessonBlockType;
    if (draggedType) {
      const check = BlockPlacementRuleEngine.validate(draggedType, {
        location: 'COLUMN',
        columnWidthPercent: col.widthPercent,
      });
      if (!check.allowed) {
        e.dataTransfer.dropEffect = 'none';
        setDragError(check.reason || 'Khối không được phép đặt ở đây');
        return;
      }
    }
    e.dataTransfer.dropEffect = 'copy';
    setDragError(null);
    if (dragOverColId !== col.id) setDragOverColId(col.id);
  };

  const handleColDrop = (e: React.DragEvent, col: (typeof data.columns)[0]) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColId(null);
    setDragError(null);
    const draggedType = e.dataTransfer.getData('application/x-lesson-block') as LessonBlockType;
    if (draggedType) {
      const check = BlockPlacementRuleEngine.validate(draggedType, {
        location: 'COLUMN',
        columnWidthPercent: col.widthPercent,
      });
      if (!check.allowed) {
        alert(check.reason);
        return;
      }
      onAddBlockToColumn(col.id, draggedType);
    }
  };

  return (
    <div
      data-testid={`row-section-editor-${data.id}`}
      className="space-y-3 font-sans w-full"
    >
      {/* 1. THANH ĐIỀU KHIỂN CẤU HÌNH HÀNG (ROW CONTROL BAR) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
        {/* Số lượng cột: 1, 2, 3, 4 */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
            Số cột:
          </span>
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              type="button"
              data-testid={`btn-col-count-${num}`}
              onClick={() => onChangeColumnCount(num)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                columnCount === num
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{num}</span>
              <span className="text-[10px] opacity-80">cột</span>
            </button>
          ))}
        </div>

        {/* Tỷ lệ nhanh (Presets) */}
        {presets.length > 0 && columnCount > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
              Tỷ lệ:
            </span>
            {presets.map((preset) => {
              const currentValues = data.columns.map((c) => Math.round(c.widthPercent));
              const isMatch =
                preset.values.length === currentValues.length &&
                preset.values.every((v, i) => Math.abs(v - currentValues[i]) <= 1);

              return (
                <button
                  key={preset.id}
                  type="button"
                  data-testid={`btn-preset-ratio-${preset.id}`}
                  onClick={() => onUpdateRowRatio(preset.values)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                    isMatch
                      ? 'bg-blue-100 text-blue-700 border border-blue-300 font-bold'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {preset.label.split(' ')[0]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. KHUNG LƯỚI ĐA CỘT (RESPONSIVE GRID) */}
      <div
        ref={containerRef}
        data-testid="row-columns-grid"
        className="w-full flex flex-col md:grid gap-3 relative transition-all"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        {data.columns.map((col, colIdx) => (
          <React.Fragment key={col.id}>
            {/* Thẻ Cột nội dung (Drop zone Lớp 3) */}
            <div
              data-testid={`column-container-${colIdx}`}
              onDragOver={(e) => handleColDragOver(e, col)}
              onDragLeave={() => {
                setDragOverColId(null);
                setDragError(null);
              }}
              onDrop={(e) => handleColDrop(e, col)}
              className={`flex-1 min-w-0 flex flex-col rounded-xl p-3 relative group/col transition-all ${
                dragOverColId === col.id
                  ? dragError
                    ? 'bg-rose-50/50 border-2 border-dashed border-rose-500'
                    : 'bg-blue-50/60 border-2 border-dashed border-blue-500 shadow-sm'
                  : 'bg-slate-50/50 border border-dashed border-slate-300 hover:border-slate-400'
              }`}
            >
              {dragOverColId === col.id && (
                <div
                  className={`absolute inset-x-2 top-2 p-1.5 rounded-lg text-[10px] font-bold text-center z-20 ${
                    dragError
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-blue-600 text-white shadow-md animate-pulse'
                  }`}
                >
                  {dragError || `+ Thả để chèn vào Cột ${colIdx + 1}`}
                </div>
              )}
              {/* Header nhỏ của cột: Tên & Tỷ lệ % */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-[11px] font-bold text-slate-700 uppercase">
                    Cột {colIdx + 1}
                  </span>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                    {Math.round(col.widthPercent)}%
                  </span>
                </div>

                <span className="text-[10px] text-slate-400 font-medium">
                  {col.blocks.length} khối
                </span>
              </div>

              {/* Danh sách các khối con bên trong cột */}
              <div className="space-y-3 flex-1 min-h-[80px]">
                {col.blocks.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 italic">
                    Cột đang trống
                  </div>
                ) : (
                  col.blocks.map((childBlock) => (
                    <div
                      key={childBlock.id}
                      className="relative group/child bg-white rounded-xl border border-slate-200 shadow-2xs p-3 transition hover:border-blue-300"
                    >
                      <button
                        type="button"
                        onClick={() => onRemoveBlockFromColumn(col.id, childBlock.id)}
                        title="Xóa khối này khỏi cột"
                        className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer text-xs z-10"
                      >
                        ✕
                      </button>
                      {renderChildBlock(childBlock, col.id)}
                    </div>
                  ))
                )}
              </div>

              {/* Nút [+ Chèn khối vào cột] */}
              <div className="mt-3 pt-2 border-t border-slate-200/60 relative">
                <button
                  type="button"
                  data-testid={`btn-add-block-to-col-${colIdx}`}
                  onClick={() =>
                    setActivePickerColumnId(activePickerColumnId === col.id ? null : col.id)
                  }
                  className="w-full py-1.5 px-3 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50/50 text-blue-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Icon name={IconName.PLUS} size={13} />
                  <span>Chèn khối vào Cột {colIdx + 1}</span>
                </button>

                {/* Popover chọn loại khối để chèn vào cột này */}
                {activePickerColumnId === col.id && (
                  <div
                    data-testid={`popover-picker-col-${colIdx}`}
                    className="absolute bottom-full mb-1.5 left-0 z-50 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        Chọn khối cho Cột {colIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActivePickerColumnId(null)}
                        className="text-xs text-slate-400 hover:text-slate-700"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                      <div className="grid grid-cols-2 gap-1">
                        {basicItems.map((item) => {
                          const check = BlockPlacementRuleEngine.validate(item.type, {
                            location: 'COLUMN',
                            columnWidthPercent: col.widthPercent,
                          });
                          return (
                            <button
                              key={item.type}
                              type="button"
                              disabled={!check.allowed}
                              data-testid={`btn-col-insert-${item.type}`}
                              title={check.reason || item.description}
                              onClick={() => {
                                if (!check.allowed) return;
                                onAddBlockToColumn(col.id, item.type);
                                setActivePickerColumnId(null);
                              }}
                              className={`p-1.5 text-left rounded-lg border transition ${
                                check.allowed
                                  ? 'border-slate-100 hover:border-blue-300 hover:bg-blue-50/60 cursor-pointer'
                                  : 'border-slate-100 opacity-40 cursor-not-allowed bg-slate-50'
                              }`}
                            >
                              <span className="text-xs font-semibold text-slate-800 block truncate">
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-1 border-t border-slate-100 grid grid-cols-2 gap-1">
                        {specializedItems.map((item) => {
                          const check = BlockPlacementRuleEngine.validate(item.type, {
                            location: 'COLUMN',
                            columnWidthPercent: col.widthPercent,
                          });
                          return (
                            <button
                              key={item.type}
                              type="button"
                              disabled={!check.allowed}
                              data-testid={`btn-col-insert-${item.type}`}
                              title={check.reason || item.description}
                              onClick={() => {
                                if (!check.allowed) return;
                                onAddBlockToColumn(col.id, item.type);
                                setActivePickerColumnId(null);
                              }}
                              className={`p-1.5 text-left rounded-lg border transition ${
                                check.allowed
                                  ? 'border-slate-100 hover:border-blue-300 hover:bg-blue-50/60 cursor-pointer'
                                  : 'border-slate-100 opacity-40 cursor-not-allowed bg-slate-50'
                              }`}
                            >
                              <span className="text-xs font-semibold text-slate-800 block truncate">
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Thanh Resizer giữa 2 cột (Chỉ hiện khi có 2 cột) */}
            {columnCount === 2 && colIdx === 0 && (
              <ColumnResizer
                leftWidthPercent={col.widthPercent}
                containerRef={containerRef}
                onResize={(newLeft, newRight) => onUpdateRowRatio([newLeft, newRight])}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
