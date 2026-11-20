'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { LessonBlockItem } from '../../types/block-builder.types';
import { BlockPropertyInspector } from '../builder/BlockPropertyInspector';

interface LessonPropertiesPanelProps {
  onClose: () => void;
  onOpenInfoTab?: () => void;

  // Block Inspector (bấm khối nào sửa khối đó)
  activeBlock: LessonBlockItem | null;
  activeBlockIndex?: number;
  onUpdateBlock: (id: string, updates: Partial<LessonBlockItem>) => void;
  onRemoveBlock: (id: string) => void;
  onChangeRowColumnCount?: (rowId: string, count: number) => void;
  onUpdateRowRatio?: (rowId: string, widths: number[]) => void;
}

/**
 * Cột phải của Tab CMS: Panel "Thuộc tính khối" chuyên biệt cho khối đang chọn.
 * Phần Hồ sơ, Tài liệu và Xuất bản đã được tách sang Tab 1 (Thông tin & Hồ sơ)
 * để giải phóng không gian soạn thảo CMS.
 */
export function LessonPropertiesPanel({
  onClose,
  onOpenInfoTab,
  activeBlock,
  activeBlockIndex,
  onUpdateBlock,
  onRemoveBlock,
  onChangeRowColumnCount,
  onUpdateRowRatio,
}: LessonPropertiesPanelProps) {
  return (
    <aside className="w-full lg:w-80 xl:w-[350px] shrink-0 flex flex-col gap-2.5 max-h-[calc(100vh-80px)] overflow-y-auto lg:sticky lg:top-[68px] self-start pr-0.5 animate-in slide-in-from-right duration-200 z-20 custom-editor-scrollbar">
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
        <span className="text-xs md:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <span>⚙️ Thuộc tính khối</span>
          {activeBlock && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
        </span>

        <div className="flex items-center gap-1">
          {onOpenInfoTab && (
            <button
              type="button"
              onClick={onOpenInfoTab}
              className="text-[11px] text-blue-700 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-md transition cursor-pointer font-semibold flex items-center gap-1"
              title="Chuyển sang Tab Thông tin & Hồ sơ bài học"
            >
              <ArrowLeft size={12} />
              <span>Hồ sơ</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-1.5 py-0.5 rounded-md transition cursor-pointer font-medium"
            title="Thu gọn Panel"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="animate-in fade-in-50 duration-150">
        <BlockPropertyInspector
          block={activeBlock}
          blockIndex={activeBlockIndex}
          onUpdateBlock={onUpdateBlock}
          onRemoveBlock={onRemoveBlock}
          onChangeRowColumnCount={onChangeRowColumnCount}
          onUpdateRowRatio={onUpdateRowRatio}
          className="w-full bg-white border border-slate-200 rounded-xl flex flex-col justify-between shrink-0 shadow-2xs select-none"
        />
      </div>
    </aside>
  );
}
