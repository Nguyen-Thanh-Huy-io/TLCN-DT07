'use client';

import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  CalloutBlockData,
  CharacterBlockData,
  EventBlockData,
  HeadingBlockData,
  ImageBlockData,
  LessonBlockItem,
  QuoteBlockData,
  RowSectionBlockData,
} from '../../../types/block-builder.types';
import { LessonBlockType } from '../../../types/editor.types';
import { ROW_RATIO_PRESETS } from '../../../constants/lesson.constants';
import { useActiveEditor } from '../../../context/ActiveEditorContext';
import { TypographyInspectorPanel } from './TypographyInspectorPanel';
import {
  CalloutBlockInspector,
  HeadingBlockInspector,
  QuoteBlockInspector,
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

export function RowSectionBlockInspector({
  block: row,
  onUpdateBlock,
  onChangeRowColumnCount,
  onUpdateRowRatio,
}: RowSectionBlockInspectorProps) {
  const { activeSubElement, setActiveSubElement } = useActiveEditor();
  const [activeTab, setActiveTab] = useState<RowInspectorTab>(
    RowInspectorTab.COLUMNS
  );

  // NẾU NGƯỜI DÙNG ĐANG BẤM VÀO 1 KHỐI CON BÊN TRONG CỘT CỦA SECTION_ROW -> HIỂN THỊ THUỘC TÍNH KHỐI CON ĐÓ
  if (
    activeSubElement &&
    activeSubElement.parentBlockId === row.id &&
    activeSubElement.subId
  ) {
    const [colId, childId] = activeSubElement.subId.split('::');
    const targetCol = row.columns.find((c) => c.id === colId);
    const targetChild = targetCol?.blocks.find((b) => b.id === childId);

    if (targetCol && targetChild) {
      const handleUpdateChild = (
        _id: string,
        updates: Partial<LessonBlockItem>
      ) => {
        const nextCols = row.columns.map((c) => {
          if (c.id !== colId) return c;
          return {
            ...c,
            blocks: c.blocks.map((b) =>
              b.id === childId ? ({ ...b, ...updates } as LessonBlockItem) : b
            ),
          };
        });
        onUpdateBlock(row.id, { columns: nextCols });
      };

      return (
        <div className="space-y-4">
          <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Đang chọn khối trong cột
              </span>
              <button
                type="button"
                onClick={() => setActiveSubElement(null)}
                className="text-xs font-bold text-stone-800 hover:text-blue-700 bg-white px-2 py-0.5 rounded-md border border-stone-200 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Cấu hình cột</span>
              </button>
            </div>
            <div className="text-xs font-bold text-stone-900 truncate">
              {activeSubElement.label}
            </div>
          </div>

          {targetChild.type === LessonBlockType.TEXT && (
            <TypographyInspectorPanel />
          )}
          {targetChild.type === LessonBlockType.HEADING && (
            <HeadingBlockInspector
              block={targetChild as HeadingBlockData}
              onUpdateBlock={handleUpdateChild}
            />
          )}
          {targetChild.type === LessonBlockType.CALLOUT && (
            <CalloutBlockInspector
              block={targetChild as CalloutBlockData}
              onUpdateBlock={handleUpdateChild}
            />
          )}
          {targetChild.type === LessonBlockType.QUOTE && (
            <QuoteBlockInspector
              block={targetChild as QuoteBlockData}
              onUpdateBlock={handleUpdateChild}
            />
          )}
          {targetChild.type === LessonBlockType.CHARACTER && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tên thực thể / Nhân vật
                </label>
                <input
                  type="text"
                  value={(targetChild as CharacterBlockData).name || ''}
                  onChange={(e) =>
                    handleUpdateChild(targetChild.id, { name: e.target.value })
                  }
                  className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Niên đại / Thời kỳ
                </label>
                <input
                  type="text"
                  value={(targetChild as CharacterBlockData).years || ''}
                  onChange={(e) =>
                    handleUpdateChild(targetChild.id, { years: e.target.value })
                  }
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tóm tắt tiểu sử / Vai trò
                </label>
                <textarea
                  rows={3}
                  value={(targetChild as CharacterBlockData).summary || ''}
                  onChange={(e) =>
                    handleUpdateChild(targetChild.id, {
                      summary: e.target.value,
                    })
                  }
                  className="w-full text-xs p-2.5 bg-white border border-stone-200 rounded-lg"
                />
              </div>
            </div>
          )}
          {targetChild.type === LessonBlockType.EVENT && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tên sự kiện
                </label>
                <input
                  type="text"
                  value={(targetChild as EventBlockData).title || ''}
                  onChange={(e) =>
                    handleUpdateChild(targetChild.id, { title: e.target.value })
                  }
                  className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Thời gian & Địa điểm
                </label>
                <input
                  type="text"
                  value={(targetChild as EventBlockData).timeLocation || ''}
                  onChange={(e) =>
                    handleUpdateChild(targetChild.id, {
                      timeLocation: e.target.value,
                    })
                  }
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
                />
              </div>
            </div>
          )}
          {targetChild.type === LessonBlockType.IMAGE && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Đường dẫn hình ảnh
                </label>
                <input
                  type="text"
                  value={(targetChild as ImageBlockData).src || ''}
                  onChange={(e) =>
                    handleUpdateChild(targetChild.id, { src: e.target.value })
                  }
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Chú thích ảnh
                </label>
                <input
                  type="text"
                  value={(targetChild as ImageBlockData).caption || ''}
                  onChange={(e) =>
                    handleUpdateChild(targetChild.id, {
                      caption: e.target.value,
                    })
                  }
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  const colCount = row.columnCount || row.columns.length || 2;
  const presets = ROW_RATIO_PRESETS[colCount] || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab(RowInspectorTab.COLUMNS)}
          className={`py-1.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === RowInspectorTab.COLUMNS
              ? 'bg-stone-900 text-white'
              : 'text-stone-800 hover:bg-white'
          }`}
        >
          Cấu hình cột
        </button>
        <button
          type="button"
          onClick={() => setActiveTab(RowInspectorTab.TYPOGRAPHY)}
          className={`py-1.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === RowInspectorTab.TYPOGRAPHY
              ? 'bg-stone-900 text-white'
              : 'text-stone-800 hover:bg-white'
          }`}
        >
          Định dạng chữ
        </button>
      </div>

      {activeTab === RowInspectorTab.TYPOGRAPHY ? (
        <TypographyInspectorPanel />
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-1.5">
              Số lượng cột
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([1, 2, 3, 4] as const).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChangeRowColumnCount?.(row.id, num)}
                  className={`py-2 text-sm font-bold rounded-lg border transition-colors cursor-pointer ${
                    colCount === num
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  {num} cột
                </button>
              ))}
            </div>
          </div>

          {presets.length > 0 && colCount > 1 && (
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-1.5">
                Tỷ lệ phân chia cột
              </label>
              <div className="space-y-1.5">
                {presets.map((preset) => {
                  const currentValues = row.columns.map((c) =>
                    Math.round(c.widthPercent)
                  );
                  const isMatch =
                    preset.values.length === currentValues.length &&
                    preset.values.every(
                      (v, i) => Math.abs(Math.round(v) - currentValues[i]) <= 1
                    );
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onUpdateRowRatio?.(row.id, preset.values)}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium border text-left transition-colors cursor-pointer ${
                        isMatch
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
