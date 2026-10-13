'use client';

import React from 'react';
import {
  LessonLeftSidebarProps,
  LessonCategoryType,
  TocItem,
  QuickSettingKey,
} from '../types/left-sidebar.types';
import {
  QUICK_SETTING_ITEMS,
  LESSON_TYPE_CONFIGS,
} from '../constants/left-sidebar.constants';

export const LessonLeftSidebar: React.FC<LessonLeftSidebarProps> = ({
  lessonTitle,
  lessonType = LessonCategoryType.EVENT,
  tocItems,
  activeHeadingId,
  onSelectHeading,
  onAddHeading,
  onQuickJump,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const typeConfig = LESSON_TYPE_CONFIGS[lessonType] || LESSON_TYPE_CONFIGS[LessonCategoryType.EVENT];

  if (isCollapsed) {
    return (
      <aside
        data-testid="lesson-left-sidebar-collapsed"
        className="w-12 shrink-0 bg-white border border-slate-200 rounded-xl p-2 flex flex-col items-center gap-3 shadow-2xs"
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          data-testid="btn-expand-sidebar"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          title="Mở rộng Sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside
      data-testid="lesson-left-sidebar"
      className="w-full lg:w-[250px] xl:w-[260px] shrink-0 flex flex-col gap-3 font-sans"
    >
      {/* 1. Header Breadcrumb */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
          TẠO / CHỈNH SỬA BÀI HỌC
        </span>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            data-testid="btn-collapse-sidebar"
            className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
            title="Thu gọn Sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* 2. Card tóm tắt loại bài học */}
      <div
        data-testid="lesson-summary-card"
        className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-start gap-2.5"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] text-slate-500 font-medium">Loại bài học</span>
            <span
              data-testid="badge-lesson-type"
              className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800 border border-blue-200"
            >
              {typeConfig.label}
            </span>
          </div>
          <h2
            data-testid="sidebar-lesson-title"
            className="text-xs font-bold text-slate-900 leading-snug line-clamp-2"
            title={lessonTitle || 'Chưa có tiêu đề'}
          >
            {lessonTitle || 'Chiến dịch Điện Biên Phủ năm 1954'}
          </h2>
        </div>
      </div>

      {/* 3. Khối Mục lục nội dung (Tree Outline) */}
      <div
        data-testid="lesson-toc-card"
        className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col gap-2"
      >
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-900 tracking-tight">Mục lục nội dung</span>
          {onAddHeading && (
            <button
              type="button"
              onClick={onAddHeading}
              data-testid="btn-add-toc-item"
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition cursor-pointer border border-blue-200/60 flex items-center gap-0.5"
            >
              <span>+</span>
              <span>Thêm mục</span>
            </button>
          )}
        </div>

        {tocItems && tocItems.length > 0 ? (
          <nav data-testid="toc-item-list" className="space-y-1 text-xs max-h-56 overflow-y-auto pr-0.5">
            {tocItems.map((item, index) => {
              const isActive = activeHeadingId === item.id;
              const indentLevel = Math.max(0, (item.level - 1) * 10);
              return (
                <div
                  key={item.id}
                  data-testid={`toc-item-${item.id}`}
                  style={{ paddingLeft: `${indentLevel}px` }}
                  className="flex items-center justify-between group rounded-md hover:bg-slate-50 transition py-0.5 px-1"
                >
                  <button
                    type="button"
                    onClick={() => onSelectHeading(item.id)}
                    className={`flex items-baseline gap-1.5 text-left flex-1 min-w-0 cursor-pointer ${
                      isActive ? 'text-blue-700 font-bold' : 'text-slate-700 hover:text-blue-600'
                    }`}
                  >
                    <span className="text-[11px] font-mono text-slate-400 group-hover:text-blue-500 shrink-0">
                      {item.sectionNumber || `${index + 1}.`}
                    </span>
                    <span className="truncate text-xs leading-snug">{item.text}</span>
                  </button>

                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 px-1 text-xs transition cursor-pointer shrink-0"
                    title="Tùy chọn mục này"
                  >
                    •••
                  </button>
                </div>
              );
            })}
          </nav>
        ) : (
          <div
            data-testid="toc-empty-state"
            className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200"
          >
            Chưa có đề mục. Thêm H1, H2 trong văn bản để tự động tạo mục lục.
          </div>
        )}
      </div>

      {/* 4. Khối Thiết lập nhanh (Quick Settings) */}
      <div
        data-testid="lesson-quick-settings-card"
        className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col gap-1.5"
      >
        <span className="text-xs font-bold text-slate-900 tracking-tight pb-1 border-b border-slate-100">
          Thiết lập nhanh
        </span>
        <div className="space-y-0.5 text-xs">
          {QUICK_SETTING_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              data-testid={`quick-jump-${item.key}`}
              onClick={() => onQuickJump(item.key)}
              className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg text-slate-700 hover:text-blue-700 hover:bg-blue-50/70 transition cursor-pointer text-left group"
              title={item.description}
            >
              <span className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 flex items-center justify-center text-xs">
                {item.key === QuickSettingKey.EVENT_INFO && '📅'}
                {item.key === QuickSettingKey.CHARACTERS && '👤'}
                {item.key === QuickSettingKey.LOCATIONS && '📍'}
                {item.key === QuickSettingKey.TIMELINE && '⏱️'}
                {item.key === QuickSettingKey.MEDIA_DOCS && '📁'}
                {item.key === QuickSettingKey.QUESTIONS && '📝'}
              </span>
              <span className="flex-1 truncate font-medium text-[12px]">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Card giải thích ngữ cảnh loại bài học (Guidance Note) */}
      <div
        data-testid="lesson-guidance-card"
        className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 shadow-2xs flex items-start gap-2.5 text-xs text-amber-900"
      >
        <div className="text-amber-600 mt-0.5 shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <p className="text-[11px] leading-relaxed text-amber-950/80 font-normal">
          {typeConfig.guidanceText}
        </p>
      </div>
    </aside>
  );
};
