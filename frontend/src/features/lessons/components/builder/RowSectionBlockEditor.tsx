'use client';

import React, { useRef, useState } from 'react';
import { Columns3, Plus, Trash2, X } from 'lucide-react';
import { RowSectionBlockData, LessonBlockItem } from '../../types/block-builder.types';
import { LessonBlockType, LessonBlockGroup } from '../../types/block-palette.types';
import { LESSON_BLOCK_ITEMS } from '../../constants/block-palette.constants';
import { ROW_RATIO_PRESETS } from '../../constants/row-layout.constants';
import { RowLayoutStrategy } from '../../strategies/row-layout.strategy';
import { ColumnResizer } from './ColumnResizer';
import { BlockPlacementRuleEngine } from '../../rules/block-placement.rule';
import { useActiveEditor } from '../../context/ActiveEditorContext';

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
  onAddBlockToColumn,
  onRemoveBlockFromColumn,
  renderChildBlock,
}: RowSectionBlockEditorProps) {
  const { activeSubElement, setActiveSubElement } = useActiveEditor();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePickerColumnId, setActivePickerColumnId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);

  const columnCount = data.columnCount || data.columns.length || 1;

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
      onClick={() => setActiveSubElement(null)}
      className="space-y-4 font-sans w-full"
    >
      {/* KHUNG LƯỚI ĐA CỘT (EDITORIAL MULTI-COLUMN SPREAD — MỌI CẤU HÌNH SỐ CỘT & TỶ LỆ NẰM BÊN INSPECTOR PHẢI) */}
      <div
        ref={containerRef}
        data-testid="row-columns-grid"
        className="w-full flex flex-col md:grid gap-6 relative items-start"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        {data.columns.map((col, colIdx) => (
          <React.Fragment key={col.id}>
            {/* Cột nội dung */}
            <div
              data-testid={`column-container-${colIdx}`}
              onDragOver={(e) => handleColDragOver(e, col)}
              onDragLeave={() => {
                setDragOverColId(null);
                setDragError(null);
              }}
              onDrop={(e) => handleColDrop(e, col)}
              className={`flex-1 min-w-0 flex flex-col relative group/col transition-colors ${
                dragOverColId === col.id
                  ? dragError
                    ? 'bg-rose-50/50 ring-2 ring-rose-500 rounded-xl p-2'
                    : 'bg-stone-100/70 ring-2 ring-stone-900 rounded-xl p-2'
                  : ''
              }`}
            >
              {dragOverColId === col.id && (
                <div
                  className={`mb-2 py-1.5 px-3 rounded-lg text-sm font-semibold text-center z-20 ${
                    dragError ? 'bg-rose-700 text-white' : 'bg-stone-900 text-white'
                  }`}
                >
                  {dragError || `Thả để chèn vào Cột ${colIdx + 1}`}
                </div>
              )}

              {/* Nhãn cột tinh tế */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200/80 text-xs font-semibold text-stone-600">
                <span>
                  Cột {colIdx + 1} ({Math.round(col.widthPercent)}%)
                </span>
                <span>{col.blocks.length} khối</span>
              </div>

              {/* Danh sách các khối con bên trong cột (Phẳng, không đóng khung chồng chéo) */}
              <div className="space-y-4 flex-1 min-h-[72px]">
                {col.blocks.length === 0 ? (
                  <div className="py-6 text-center text-sm text-stone-600 italic border border-dashed border-stone-300 rounded-xl">
                    Cột đang trống — Bấm nút bên dưới để thêm nội dung
                  </div>
                ) : (
                  col.blocks.map((childBlock, childIdx) => {
                    const subKey = `${col.id}::${childBlock.id}`;
                    const isChildActive =
                      activeSubElement?.parentBlockId === data.id &&
                      activeSubElement?.subId === subKey;
                    const itemDef = LESSON_BLOCK_ITEMS.find(
                      (i) => i.type === childBlock.type
                    );
                    return (
                      <div
                        key={`${col.id}_${childBlock.id}_${childIdx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSubElement({
                            parentBlockId: data.id,
                            subType: 'NESTED_BLOCK',
                            subId: subKey,
                            label: `Cột ${colIdx + 1} · ${
                              itemDef?.label || 'Khối con'
                            }`,
                          });
                        }}
                        className={`relative group/child pb-3 border-b border-stone-200/60 last:border-b-0 last:pb-0 cursor-pointer rounded-xl transition-all ${
                          isChildActive
                            ? 'ring-2 ring-blue-500/85 bg-blue-50/20 p-2 -mx-2'
                            : 'hover:ring-1 hover:ring-stone-300/80 p-1.5 -mx-1.5'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveBlockFromColumn(col.id, childBlock.id);
                          }}
                          title="Xóa khối này khỏi cột"
                          className="absolute top-1 right-1 p-1.5 text-stone-600 hover:text-rose-700 hover:bg-rose-50 rounded-md opacity-0 group-hover/child:opacity-100 transition-opacity cursor-pointer z-10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {renderChildBlock(childBlock, col.id)}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Nút [+ Chèn khối vào cột] */}
              <div className="mt-3 pt-2 border-t border-stone-200/70 relative">
                <button
                  type="button"
                  data-testid={`btn-add-block-to-col-${colIdx}`}
                  onClick={() =>
                    setActivePickerColumnId(activePickerColumnId === col.id ? null : col.id)
                  }
                  className="w-full py-1.5 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm khối vào Cột {colIdx + 1}</span>
                </button>

                {/* Popover chọn loại khối để chèn vào cột này */}
                {activePickerColumnId === col.id && (
                  <div
                    data-testid={`popover-picker-col-${colIdx}`}
                    className="absolute bottom-full mb-2 left-0 z-50 w-72 bg-white rounded-xl shadow-lg border border-stone-300 p-3"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200">
                      <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                        Chọn khối cho Cột {colIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActivePickerColumnId(null)}
                        className="text-stone-600 hover:text-stone-950 p-1 rounded cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                      <div className="grid grid-cols-2 gap-1.5">
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
                              className={`px-2.5 py-2 text-left rounded-lg transition-colors ${
                                check.allowed
                                  ? 'bg-stone-50 hover:bg-stone-900 hover:text-white text-stone-900 cursor-pointer'
                                  : 'opacity-40 cursor-not-allowed bg-stone-50 text-stone-500'
                              }`}
                            >
                              <span className="text-sm font-medium block truncate">
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-stone-200 grid grid-cols-2 gap-1.5">
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
                              className={`px-2.5 py-2 text-left rounded-lg transition-colors ${
                                check.allowed
                                  ? 'bg-stone-50 hover:bg-stone-900 hover:text-white text-stone-900 cursor-pointer'
                                  : 'opacity-40 cursor-not-allowed bg-stone-50 text-stone-500'
                              }`}
                            >
                              <span className="text-sm font-medium block truncate">
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
