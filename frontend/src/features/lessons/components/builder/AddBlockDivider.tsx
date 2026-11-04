'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { LessonBlockType, LessonBlockGroup } from '../../types/block-palette.types';
import { LESSON_BLOCK_ITEMS } from '../../constants/block-palette.constants';
import { BLOCK_TYPE_ICONS } from './BlockLibraryPalette';

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
