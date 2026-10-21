'use client';

import React from 'react';
import { LessonBlockItem, BlockWidthType } from '../../types/block-builder.types';
import { LessonBlockType } from '../../types/block-palette.types';
import { BlockWidthStrategy } from '../../strategies/block-width.strategy';

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
      return { label: 'VĂN BẢN', color: 'text-slate-600 bg-slate-100' };
    case LessonBlockType.TIMELINE:
      return { label: 'TIMELINE', color: 'text-blue-600 bg-blue-50' };
    case LessonBlockType.CHARACTER:
      return { label: 'NHÂN VẬT', color: 'text-indigo-600 bg-indigo-50' };
    case LessonBlockType.EVENT:
      return { label: 'SỰ KIỆN', color: 'text-amber-600 bg-amber-50' };
    case LessonBlockType.IMAGE:
      return { label: 'HÌNH ẢNH', color: 'text-emerald-600 bg-emerald-50' };
    case LessonBlockType.VIDEO:
      return { label: 'VIDEO', color: 'text-purple-600 bg-purple-50' };
    case LessonBlockType.COMPARISON_TABLE:
      return { label: 'BẢNG SO SÁNH', color: 'text-cyan-600 bg-cyan-50' };
    case LessonBlockType.QUIZ:
      return { label: 'CÂU HỎI ÔN TẬP', color: 'text-amber-600 bg-amber-50' };
    case LessonBlockType.RESOURCE_LINK:
      return { label: 'TÀI LIỆU', color: 'text-blue-600 bg-blue-50' };
    case LessonBlockType.MAP:
      return { label: 'BẢN ĐỒ', color: 'text-emerald-600 bg-emerald-50' };
    case LessonBlockType.SECTION_ROW:
      return { label: 'HÀNG NHIỀU CỘT', color: 'text-violet-600 bg-violet-50' };
    default:
      return { label: 'KHỐI NỘI DUNG', color: 'text-slate-600 bg-slate-100' };
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

  // Đề xuất: Block văn bản gần với trình soạn thảo tài liệu (Document-like), chỉ hiện công cụ khi chọn
  const isTextBlock = block.type === LessonBlockType.TEXT;

  return (
    <div
      data-testid={`block-card-wrapper-${block.id}`}
      data-block-type={block.type}
      data-block-width={currentWidth}
      onClick={onSelect}
      className={`relative rounded-2xl transition-all duration-150 group/block bg-white ${widthCssClass} ${
        isTextBlock
          ? isSelected
            ? 'border-2 border-emerald-500/80 ring-3 ring-emerald-50/60 shadow-xs'
            : 'border border-transparent hover:border-slate-200/90 hover:shadow-2xs'
          : isSelected
          ? 'border-2 border-blue-500 ring-4 ring-blue-50 shadow-sm'
          : 'border border-slate-200 hover:border-slate-300 shadow-2xs'
      }`}
    >
      {/* Thanh Header khối: Đối với văn bản, chỉ hiển thị mỏng nhẹ khi hover hoặc khi được chọn */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 border-b rounded-t-2xl transition-all duration-150 ${
          isTextBlock && !isSelected
            ? 'opacity-0 group-hover/block:opacity-100 bg-slate-50/70 border-slate-100'
            : isSelected
            ? isTextBlock
              ? 'bg-emerald-50/50 border-emerald-200'
              : 'bg-blue-50/50 border-blue-200'
            : 'bg-slate-50/60 border-slate-100 group-hover/block:bg-slate-50'
        }`}
      >
        {/* Khối bên trái: Tay nắm kéo + Icon + Tên loại khối + Số thứ tự */}
        <div className="flex items-center gap-2">
          {/* Tay nắm kéo (Drag handle ⠿) */}
          <div
            draggable
            onDragStart={onDragStart}
            data-testid={`drag-handle-${block.id}`}
            title="Kéo thả để sắp xếp thứ tự khối"
            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-emerald-700 cursor-grab active:cursor-grabbing hover:bg-white rounded transition select-none"
          >
            <span className="font-mono text-sm font-bold leading-none tracking-tighter">⠿</span>
          </div>

          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>
            {meta.label}
          </span>

          <span className="text-[11px] font-semibold text-slate-400">
            #{index + 1}
          </span>
        </div>

        {/* Khối ở giữa: Tùy chọn chiều rộng dạng Dropdown (100%, 1/2, 1/3) tiết kiệm diện tích */}
        {availableWidths.length > 1 && (
          <div
            data-testid={`width-selector-${block.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1"
          >
            <select
              value={currentWidth}
              data-testid={`select-width-${block.id}`}
              onChange={(e) => {
                e.stopPropagation();
                onUpdateWidth?.(e.target.value as BlockWidthType);
              }}
              className="text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-md px-2 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs transition"
              title="Chọn tỉ lệ chiều rộng khối (Toàn hàng, 1/2, 1/3)"
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

        {/* Khối bên phải: Nút Lên / Xuống / Xóa */}
        <div className="flex items-center gap-1">
          {index > 0 && onMoveUp && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              data-testid={`btn-move-up-${block.id}`}
              title="Chuyển lên trên"
              className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-white rounded transition cursor-pointer text-xs"
            >
              ▲
            </button>
          )}

          {index < totalBlocks - 1 && onMoveDown && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              data-testid={`btn-move-down-${block.id}`}
              title="Chuyển xuống dưới"
              className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-white rounded transition cursor-pointer text-xs"
            >
              ▼
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Bạn có chắc muốn xóa khối này khỏi bài học?')) {
                onDelete();
              }
            }}
            data-testid={`btn-delete-block-${block.id}`}
            title="Xóa khối này"
            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer text-xs ml-1"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Nội dung khối */}
      <div className={isTextBlock ? 'p-2 sm:p-3' : 'p-4'}>{children}</div>
    </div>
  );
}
