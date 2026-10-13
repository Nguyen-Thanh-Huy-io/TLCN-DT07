'use client';

import React from 'react';
import { LessonBlockPaletteProps, LessonBlockType, LessonBlockGroup } from '../types/block-palette.types';
import { LESSON_BLOCK_ITEMS } from '../constants/block-palette.constants';

const renderBlockIcon = (type: LessonBlockType) => {
  const iconClass = 'w-4 h-4 shrink-0';

  switch (type) {
    case LessonBlockType.TEXT:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case LessonBlockType.IMAGE:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case LessonBlockType.VIDEO:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case LessonBlockType.RESOURCE_LINK:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case LessonBlockType.TIMELINE:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h8m-8 5h8m-8 5h8M4 7h.01M4 12h.01M4 17h.01" />
        </svg>
      );
    case LessonBlockType.MAP:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case LessonBlockType.CHARACTER:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case LessonBlockType.EVENT:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case LessonBlockType.COMPARISON_TABLE:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      );
    case LessonBlockType.QUIZ:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      );
  }
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
