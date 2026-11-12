'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { LessonBlockPaletteProps, LessonBlockType, LessonBlockGroup } from '../types/block-palette.types';
import { LESSON_BLOCK_ITEMS } from '../constants/block-palette.constants';
import { BLOCK_TYPE_ICONS } from './builder/BlockLibraryPalette';

const renderBlockIcon = (type: LessonBlockType) => {
  const IconComp = BLOCK_TYPE_ICONS[type] || Plus;
  return <IconComp className="w-4 h-4 shrink-0" />;
};

export const LessonBlockPalette: React.FC<LessonBlockPaletteProps> = ({
  onSelectBlock,
  activeBlockType = null,
  className = '',
  disabled = false,
}) => {
  const basicBlocks = LESSON_BLOCK_ITEMS.filter((item) => item.group === LessonBlockGroup.BASIC);
  const specializedBlocks = LESSON_BLOCK_ITEMS.filter((item) => item.group === LessonBlockGroup.SPECIALIZED);

  const renderBlockButton = (item: typeof LESSON_BLOCK_ITEMS[0]) => {
    const isActive = activeBlockType === item.type;
    return (
      <button
        key={item.type}
        type="button"
        disabled={disabled}
        draggable={!disabled}
        onDragStart={(e) => {
          e.dataTransfer.setData('application/x-lesson-block', item.type);
          e.dataTransfer.setData('text/plain', item.label);
          e.dataTransfer.effectAllowed = 'copy';
        }}
        data-testid={`btn-block-${item.type}`}
        onClick={() => onSelectBlock(item.type)}
        title={`${item.label} (Nhấp hoặc Kéo thả vào bài soạn): ${item.description}`}
        className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition select-none cursor-grab active:cursor-grabbing group ${
          isActive
            ? 'bg-blue-50/80 border-blue-500 shadow-2xs'
            : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/25 shadow-2xs hover:shadow-xs'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition ${
            isActive
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-slate-50 text-slate-500 border-slate-200/90 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200'
          }`}
        >
          {renderBlockIcon(item.type)}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className={`text-xs font-bold leading-tight transition truncate ${
              isActive ? 'text-blue-700' : 'text-slate-800 group-hover:text-blue-700'
            }`}
          >
            {item.label}
          </span>
          <span className="text-[11px] text-slate-400 group-hover:text-slate-500 leading-tight truncate mt-0.5">
            {item.description}
          </span>
        </div>
      </button>
    );
  };

  return (
    <aside
      data-testid="lesson-block-palette"
      className={`w-full shrink-0 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col gap-3 font-sans ${className}`}
    >
      {/* Tiêu đề phụ chuẩn img2.png */}
      <p className="text-[11px] text-slate-500 font-medium px-0.5">
        Chọn một khối nội dung để chèn vào bài học
      </p>

      {/* 1. Nhóm 1: Nội dung cơ bản (img2.png) */}
      <div className="flex flex-col gap-1.5" data-testid="section-basic-blocks">
        <h4 className="text-xs font-bold text-slate-900 tracking-wide px-0.5">
          Nội dung cơ bản
        </h4>
        <div className="flex flex-col gap-1.5">
          {basicBlocks.map(renderBlockButton)}
        </div>
      </div>

      {/* 2. Nhóm 2: Khối chuyên biệt (img2.png) */}
      <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-100" data-testid="section-specialized-blocks">
        <h4 className="text-xs font-bold text-slate-900 tracking-wide px-0.5">
          Khối chuyên biệt
        </h4>
        <div className="flex flex-col gap-1.5">
          {specializedBlocks.map(renderBlockButton)}
        </div>
      </div>
    </aside>
  );
};
