'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GripVertical, ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/CommonUi';
import { LessonBlockItem, BlockWidthType } from '../../types/block-builder.types';
import { LessonBlockType, LessonBlockGroup } from '../../types/editor.types';
import { getBlockLabel, LESSON_BLOCK_DRAG_MIME, LESSON_BLOCK_ITEMS } from '../../constants/lesson.constants';
import { BlockWidthStrategy } from '../../strategies/row-layout.strategy';
import { BLOCK_TYPE_ICONS } from '../LessonLeftToolSidebar';

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
  const blockLabel = getBlockLabel(block.type);
  const availableWidths = BlockWidthStrategy.getAvailableWidths(block.type);
  const currentWidth = block.width || BlockWidthStrategy.getDefaultWidth(block.type);
  const widthCssClass = BlockWidthStrategy.getCssClass(currentWidth);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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
            {blockLabel}
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
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDeleteOpen(true);
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

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title={`Xóa khối "${blockLabel}"?`}
        message="Nội dung bên trong khối này sẽ bị xóa khỏi trình soạn thảo. Bạn có chắc muốn tiếp tục?"
        confirmLabel="Xóa khối"
        cancelLabel="Giữ lại"
        tone="danger"
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          onDelete();
        }}
      />
    </div>
  );
}

// === Merged from AddBlockDivider.tsx ===
export interface AddBlockDividerProps {
  insertIndex: number;
  onAddBlock: (type: LessonBlockType, atIndex: number) => void;
  className?: string;
}

export function AddBlockDivider({
  insertIndex,
  onAddBlock,
  className = '',
}: AddBlockDividerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleDocClick);
    }
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [isOpen]);

  const basicItems = LESSON_BLOCK_ITEMS.filter((i) => i.group === LessonBlockGroup.BASIC);
  const specializedItems = LESSON_BLOCK_ITEMS.filter((i) => i.group === LessonBlockGroup.SPECIALIZED);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const blockType = e.dataTransfer.getData(LESSON_BLOCK_DRAG_MIME) as LessonBlockType;
    if (blockType) {
      onAddBlock(blockType, insertIndex);
    }
  };

  return (
    <div
      data-testid={`add-block-divider-${insertIndex}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDragOver) setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
        }
      }}
      onDrop={handleDrop}
      className={`relative my-1 py-1 flex items-center justify-center group/divider transition-colors select-none ${className}`}
      ref={menuRef}
    >
      <div
        className={`w-full h-px transition-colors ${
          isDragOver
            ? 'bg-stone-800'
            : isOpen
            ? 'bg-stone-300'
            : 'bg-transparent group-hover/divider:bg-stone-200'
        }`}
      />

      <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          data-testid={`btn-insert-block-${insertIndex}`}
          title="Chèn khối vào vị trí này"
          className={`pointer-events-auto px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-opacity cursor-pointer ${
            isOpen || isDragOver
              ? 'opacity-100 bg-stone-900 text-white'
              : 'opacity-0 group-hover/divider:opacity-100 bg-white text-stone-700 border border-stone-300 hover:border-stone-500 hover:text-stone-900'
          }`}
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
          <span>Chèn khối</span>
        </button>
      </div>

      {isOpen && (
        <div
          data-testid="popover-insert-block-menu"
          className="absolute top-full mt-2 z-50 w-72 bg-white rounded-xl shadow-lg border border-stone-200 p-3"
        >
          <div className="text-xs font-bold text-stone-600 uppercase tracking-wider px-1 pb-2">
            Chèn khối nội dung
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            <div>
              <span className="text-xs font-semibold text-stone-600 uppercase px-1">Cơ bản</span>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {basicItems.map((item) => {
                  const IconComp = BLOCK_TYPE_ICONS[item.type];
                  return (
                    <button
                      key={item.type}
                      type="button"
                      data-testid={`btn-popover-block-${item.type}`}
                      onClick={() => {
                        onAddBlock(item.type, insertIndex);
                        setIsOpen(false);
                      }}
                      className="p-2 text-left rounded-lg hover:bg-stone-100 transition-colors cursor-pointer flex items-center gap-2 min-w-0"
                    >
                      {IconComp && <IconComp className="w-4 h-4 text-stone-600 shrink-0" />}
                      <span className="text-sm font-medium text-stone-800 truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100">
              <span className="text-xs font-semibold text-stone-600 uppercase px-1">Tri thức lịch sử</span>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {specializedItems.map((item) => {
                  const IconComp = BLOCK_TYPE_ICONS[item.type];
                  return (
                    <button
                      key={item.type}
                      type="button"
                      data-testid={`btn-popover-block-${item.type}`}
                      onClick={() => {
                        onAddBlock(item.type, insertIndex);
                        setIsOpen(false);
                      }}
                      className="p-2 text-left rounded-lg hover:bg-stone-100 transition-colors cursor-pointer flex items-center gap-2 min-w-0"
                    >
                      {IconComp && <IconComp className="w-4 h-4 text-stone-600 shrink-0" />}
                      <span className="text-sm font-medium text-stone-800 truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
