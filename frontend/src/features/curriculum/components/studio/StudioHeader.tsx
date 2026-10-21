'use client';

import React from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { LearningPathItem } from '@/services/entities/learning-path.service';
import { StudioTab } from '../HisgoStudioView';

interface StudioHeaderProps {
  activeTab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  currentPath: LearningPathItem | null;
  libraryCount: number;
}

/** Header trên cùng của HISGO Studio: tên sản phẩm, badge trạng thái lộ trình đang chọn,
 * và tab chính (Chương & nhóm | Thư viện Lesson). */
export function StudioHeader({ activeTab, onTabChange, currentPath, libraryCount }: StudioHeaderProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-black tracking-widest text-sm shadow-xs">
            HIS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">HISGO Studio</h1>
              {currentPath && (
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                    currentPath.status === 'PUBLISHED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {currentPath.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Biên soạn bài học và tổ chức thành lộ trình học</p>
          </div>
        </div>

        {/* Switcher Tab Chính: Chương & nhóm | Thư viện Lesson */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            id="tab-curriculum-chapters"
            onClick={() => onTabChange('CURRICULUM')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'CURRICULUM'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon name={IconName.BOOK} size={14} />
            <span>Chương &amp; nhóm</span>
          </button>
          <button
            type="button"
            id="tab-lesson-library"
            onClick={() => onTabChange('LESSON_LIBRARY')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'LESSON_LIBRARY'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon name={IconName.FILE} size={14} />
            <span>Thư viện Lesson</span>
            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px]">
              {libraryCount}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
