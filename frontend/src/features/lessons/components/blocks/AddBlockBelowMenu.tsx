'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LessonBlockType, LessonBlockGroup } from '../../types/block-palette.types';
import { LESSON_BLOCK_ITEMS } from '../../constants/block-palette.constants';

interface AddBlockBelowMenuProps {
  onSelectBlock: (type: LessonBlockType) => void;
  buttonLabel?: string;
}

export function AddBlockBelowMenu({
  onSelectBlock,
  buttonLabel = '+ Thêm khối bên dưới',
}: AddBlockBelowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleDocClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
    };
  }, [isOpen]);

  const basicItems = LESSON_BLOCK_ITEMS.filter(
    (item) => item.group === LessonBlockGroup.BASIC
  );
  const specializedItems = LESSON_BLOCK_ITEMS.filter(
    (item) => item.group === LessonBlockGroup.SPECIALIZED
  );

  return (
    <div className="relative mt-3 pt-2 border-t border-dashed border-slate-200 flex flex-col items-center" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="btn-add-block-below"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 transition-all cursor-pointer shadow-2xs group"
      >
        <span className="text-blue-600 font-bold text-sm leading-none transition-transform group-hover:scale-125">+</span>
        <span>{buttonLabel}</span>
      </button>

      {isOpen && (
        <div
          data-testid="menu-add-block-below-popover"
          className="absolute bottom-full mb-2 z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1.5 pb-1">
            Chọn loại khối muốn thêm
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5 custom-editor-scrollbar">
            {/* Nhóm cơ bản */}
            <div>
              <div className="text-[10px] font-bold text-blue-600 px-1.5 pb-0.5 uppercase">
                Nội dung cơ bản
              </div>
              <div className="grid grid-cols-2 gap-1">
                {basicItems.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    data-testid={`select-block-${item.type}`}
                    onClick={() => {
                      onSelectBlock(item.type);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-1.5 p-1.5 rounded-lg text-left hover:bg-blue-50/70 hover:text-blue-700 text-slate-700 transition cursor-pointer text-xs"
                  >
                    <span className="font-medium truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nhóm chuyên biệt */}
            <div className="border-t border-slate-100 pt-1.5">
              <div className="text-[10px] font-bold text-amber-600 px-1.5 pb-0.5 uppercase">
                Khối chuyên biệt
              </div>
              <div className="grid grid-cols-2 gap-1">
                {specializedItems.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    data-testid={`select-block-${item.type}`}
                    onClick={() => {
                      onSelectBlock(item.type);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-1.5 p-1.5 rounded-lg text-left hover:bg-amber-50/70 hover:text-amber-800 text-slate-700 transition cursor-pointer text-xs"
                  >
                    <span className="font-medium truncate">{item.label}</span>
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
