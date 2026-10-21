'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LessonBlockType, LessonBlockGroup } from '../../types/block-palette.types';
import { LESSON_BLOCK_ITEMS } from '../../constants/block-palette.constants';

interface AddBlockDividerProps {
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

  // Đóng popover khi nhấp ra ngoài
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
    setIsDragOver(false);
    const blockType = e.dataTransfer.getData('application/x-lesson-block') as LessonBlockType;
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
      className={`relative my-2 py-1 flex items-center justify-center group/divider transition-all select-none ${className}`}
      ref={menuRef}
    >
      {/* Vạch chèn màu xanh chuẩn img6.png */}
      <div
        className={`w-full h-0.5 rounded transition-all ${
          isDragOver
            ? 'bg-blue-600 h-1 shadow-md scale-y-125'
            : isOpen
            ? 'bg-blue-400'
            : 'bg-transparent group-hover/divider:bg-blue-300'
        }`}
      />

      {/* Nút [+] Chèn khối ở giữa chuẩn img7.png */}
      <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          data-testid={`btn-insert-block-${insertIndex}`}
          title="Chèn khối vào vị trí này"
          className={`pointer-events-auto h-6 px-2.5 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
            isOpen || isDragOver
              ? 'bg-blue-600 text-white shadow-md scale-105'
              : 'opacity-0 group-hover/divider:opacity-100 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
          }`}
        >
          <span className="text-xs font-black leading-none">+</span>
          <span>Chèn khối</span>
        </button>
      </div>

      {/* Popover chọn loại khối để chèn */}
      {isOpen && (
        <div
          data-testid="popover-insert-block-menu"
          className="absolute top-full mt-1.5 z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1.5">
            Chọn loại khối muốn chèn
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {/* Nhóm cơ bản */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase px-1">Nội dung cơ bản</span>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {basicItems.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    data-testid={`btn-popover-block-${item.type}`}
                    onClick={() => {
                      onAddBlock(item.type, insertIndex);
                      setIsOpen(false);
                    }}
                    className="p-1.5 text-left rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition cursor-pointer flex flex-col min-w-0"
                  >
                    <span className="text-xs font-semibold text-slate-800 truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nhóm chuyên biệt */}
            <div className="pt-1.5 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase px-1">Khối chuyên biệt</span>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {specializedItems.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    data-testid={`btn-popover-block-${item.type}`}
                    onClick={() => {
                      onAddBlock(item.type, insertIndex);
                      setIsOpen(false);
                    }}
                    className="p-1.5 text-left rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition cursor-pointer flex flex-col min-w-0"
                  >
                    <span className="text-xs font-semibold text-slate-800 truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
