'use client';

import React from 'react';
import { GripVertical, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { LessonBlockItem, BlockWidthType } from '../../types/block-builder.types';
import { LessonBlockType } from '../../types/editor.types';
import { BlockWidthStrategy } from '../../strategies/row-layout.strategy';

interface BlockCardWrapperProps {
  block: LessonBlockItem;
  index: number;
  totalBlocks: number;
  isSelected: boolean;
  onSelect: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onUpdateWidth?: (width: BlockWidthType) => void;
  children: React.ReactNode;
}

const getBlockMeta = (type: LessonBlockType) => {
  switch (type) {
    case LessonBlockType.TEXT:
      return { label: 'Văn bản' };
    case LessonBlockType.HEADING:
      return { label: 'Tiêu đề mục' };
    case LessonBlockType.TIMELINE:
      return { label: 'Dòng thời gian' };
    case LessonBlockType.CHARACTER:
      return { label: 'Hồ sơ thực thể' };
    case LessonBlockType.EVENT:
      return { label: 'Thẻ sự kiện' };
    case LessonBlockType.RELATED_PEOPLE:
      return { label: 'Nhân vật liên quan' };
    case LessonBlockType.RELATED_EVENTS:
      return { label: 'Sự kiện liên quan' };
    case LessonBlockType.IMAGE:
      return { label: 'Hình ảnh' };
    case LessonBlockType.VIDEO:
      return { label: 'Phim tư liệu' };
    case LessonBlockType.COMPARISON_TABLE:
      return { label: 'Bảng so sánh' };
    case LessonBlockType.CALLOUT:
      return { label: 'Hộp ghi chú' };
    case LessonBlockType.QUOTE:
      return { label: 'Trích dẫn' };
    case LessonBlockType.DIVIDER:
      return { label: 'Đường phân cách' };
    case LessonBlockType.MAP:
      return { label: 'Bản đồ lịch sử' };
    case LessonBlockType.SECTION_ROW:
      return { label: 'Bố cục nhiều cột' };
    case LessonBlockType.QUIZ:
      return { label: 'Ôn tập' };
    default:
      return { label: 'Khối nội dung' };
  }
};

export function BlockCardWrapper({
  block,
  index,
  totalBlocks,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDragStart,
  onUpdateWidth,
  children,
}: BlockCardWrapperProps) {
  const meta = getBlockMeta(block.type);
  const availableWidths = BlockWidthStrategy.getAvailableWidths(block.type);
  const currentWidth = block.width || BlockWidthStrategy.getDefaultWidth(block.type);
  const widthCssClass = BlockWidthStrategy.getCssClass(currentWidth);

  return (
    <div
      data-testid={`block-card-wrapper-${block.id}`}
      data-block-type={block.type}
      data-block-width={currentWidth}
      onClickCapture={onSelect}
      onClick={onSelect}
      className={`relative rounded-xl border bg-white transition-all duration-150 group/block ${widthCssClass} ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/15 shadow-sm'
          : 'border-slate-200 shadow-2xs hover:border-slate-300'
      }`}
    >
      {/* Thanh tiêu đề phân tách rõ từng khối: luôn hiển thị nhãn + tay nắm kéo */}
      <div
        className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-t-xl border-b transition-colors cursor-pointer ${
          isSelected
            ? 'bg-blue-50/70 border-blue-200/80'
            : 'bg-slate-50/80 border-slate-100 group-hover/block:bg-slate-100/70'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            draggable
            onDragStart={onDragStart}
            data-testid={`drag-handle-${block.id}`}
            title="Kéo thả để sắp xếp thứ tự khối"
            className="p-1 text-slate-500 hover:text-slate-900 cursor-grab active:cursor-grabbing rounded transition-colors shrink-0"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono shrink-0">
            #{index + 1}
          </span>

          <span className="text-xs font-bold text-slate-700 truncate">
            {meta.label}
          </span>
        </div>

        <div
          className={`flex items-center gap-1 transition-opacity duration-150 ${
            isSelected ? 'opacity-100' : 'opacity-65 group-hover/block:opacity-100'
          }`}
        >
          {availableWidths.length > 1 && (
            <div data-testid={`width-selector-${block.id}`} className="flex items-center">
              <select
                value={currentWidth}
                data-testid={`select-width-${block.id}`}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdateWidth?.(e.target.value as BlockWidthType);
                }}
                className="text-sm font-medium text-stone-800 bg-white border border-stone-300 rounded-md px-2.5 py-1 cursor-pointer focus:outline-none"
                title="Tỉ lệ chiều rộng khối"
              >
                {availableWidths.map((w) => {
                  const opt = BlockWidthStrategy.getWidthOption(w);
                  return (
                    <option key={w} value={w}>
                      {opt.label}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {index > 0 && onMoveUp && (
            <button
              type="button"
              onClick={() => onMoveUp()}
              data-testid={`btn-move-up-${block.id}`}
              title="Chuyển lên trên"
              className="p-1.5 text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}

          {index < totalBlocks - 1 && onMoveDown && (
            <button
              type="button"
              onClick={() => onMoveDown()}
              data-testid={`btn-move-down-${block.id}`}
              title="Chuyển xuống dưới"
              className="p-1.5 text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Bạn có chắc muốn xóa khối này khỏi bài viết?')) {
                onDelete();
              }
            }}
            data-testid={`btn-delete-block-${block.id}`}
            title="Xóa khối này"
            className="p-1.5 text-stone-700 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Nội dung khối */}
      <div className="p-4">{children}</div>
    </div>
  );
}
