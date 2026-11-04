'use client';

import React from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { EditorViewMode } from '../types/editor.types';

interface LessonEditorSubHeaderProps {
  activeTab: EditorViewMode;
  onChangeTab: (tab: EditorViewMode) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  showLeftToc: boolean;
  onToggleLeftToc: () => void;
}

/** Sub-header (Tầng 2): chuyển chế độ xem Soạn thảo/Chia đôi/Xem trước + nút ẩn/hiện
 * cột "Khối nội dung" bên trái + Toàn màn hình. */
export function LessonEditorSubHeader({
  activeTab,
  onChangeTab,
  isFullscreen,
  onToggleFullscreen,
  showLeftToc,
  onToggleLeftToc,
}: LessonEditorSubHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 bg-slate-50/90 border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-2xs">
      <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs md:text-sm font-medium">
        <button
          type="button"
          className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === EditorViewMode.EDIT
              ? 'bg-white text-slate-900 font-bold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => onChangeTab(EditorViewMode.EDIT)}
          title="Chế độ soạn thảo tập trung"
        >
          <Icon name={IconName.EDIT} size={14} />
          <span>Soạn thảo</span>
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === EditorViewMode.SPLIT
              ? 'bg-white text-slate-900 font-bold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => onChangeTab(EditorViewMode.SPLIT)}
          title="Soạn thảo bên trái, xem kết quả bên phải"
        >
          <Icon name={IconName.GRID} size={14} />
          <span>Chia đôi</span>
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === EditorViewMode.PREVIEW
              ? 'bg-white text-slate-900 font-bold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => onChangeTab(EditorViewMode.PREVIEW)}
          title="Xem trước toàn bộ giao diện bài học"
        >
          <Icon name={IconName.EYE} size={14} />
          <span>Xem trước</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        {!isFullscreen && activeTab !== EditorViewMode.PREVIEW && (
          <button
            type="button"
            onClick={onToggleLeftToc}
            className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition cursor-pointer font-medium ${
              showLeftToc ? 'bg-blue-100 text-blue-700 font-bold' : ''
            }`}
            title={showLeftToc ? 'Ẩn thanh công cụ khối bên trái' : 'Hiện thanh công cụ khối bên trái'}
          >
            <Icon name={IconName.GRID} size={14} />
            <span>Khối nội dung</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleFullscreen}
          className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition cursor-pointer font-medium ${
            isFullscreen ? 'bg-blue-100 text-blue-700 font-bold' : ''
          }`}
          title={isFullscreen ? 'Thu nhỏ giao diện' : 'Mở rộng soạn thảo toàn màn hình'}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isFullscreen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M10 4v6m0 0H4m6 0L3 3m11 7h6m-6 0V4m0 6l7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            )}
          </svg>
          <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
        </button>

        {/* Nút "Thuộc tính" đã bỏ ở đây vì trùng với nút ở header trên (cùng điều khiển showSidebar). */}
      </div>
    </div>
  );
}
