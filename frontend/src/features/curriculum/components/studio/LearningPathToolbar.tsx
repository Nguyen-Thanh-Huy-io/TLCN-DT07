'use client';

import React from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { LearningPathItem } from '@/services/entities/learning-path.service';

interface LearningPathToolbarProps {
  currentPath: LearningPathItem;
  onBackToList: () => void;
  onOpenEditPath: () => void;
  onOpenCreateLesson: () => void;
  onTogglePublishPath: () => void;
  actionLoading: boolean;
}

/** Thanh tiêu đề của màn CHI TIẾT 1 Lộ trình (sau khi đã chọn từ LearningPathListPanel)
 * — không còn dropdown chọn lộ trình ở đây nữa (List → Detail: việc chọn lộ trình đã
 * xảy ra ở màn danh sách trước đó), chỉ còn nút "Quay lại" + nhóm hành động. */
export function LearningPathToolbar({
  currentPath,
  onBackToList,
  onOpenEditPath,
  onOpenCreateLesson,
  onTogglePublishPath,
  actionLoading,
}: LearningPathToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
      <div className="space-y-1">
        <button
          type="button"
          onClick={onBackToList}
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-700 transition cursor-pointer"
        >
          <span>←</span>
          <span>Danh sách lộ trình</span>
        </button>

        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-bold text-slate-900">{currentPath.title}</h2>
          <button
            type="button"
            onClick={onOpenEditPath}
            title="Sửa thông tin lộ trình này"
            className="p-1 text-slate-400 hover:text-emerald-700 rounded shrink-0"
          >
            <Icon name={IconName.EDIT} size={14} />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{currentPath.chapters?.length || 0} chương</span>
          {currentPath.description && (
            <>
              <span className="text-slate-300">&bull;</span>
              <span className="truncate max-w-md">{currentPath.description}</span>
            </>
          )}
        </div>
      </div>

      {/* Nhóm nút: 2 thao tác phụ (viền) tách biệt bằng 1 vạch khỏi 1 thao tác chính (nền đặc) */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200">
          <button
            type="button"
            id="btn-add-lesson-from-path"
            onClick={onOpenCreateLesson}
            className="secondary-button !h-8 !text-xs !px-3"
          >
            <Icon name={IconName.PLUS} size={13} />
            <span>Soạn Lesson mới</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onTogglePublishPath}
          disabled={actionLoading}
          className={`!h-8 !text-xs !px-3 font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
            currentPath.status === 'PUBLISHED'
              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              : 'bg-emerald-700 text-white hover:bg-emerald-800'
          }`}
        >
          <Icon name={IconName.CHECK} size={13} />
          <span>{currentPath.status === 'PUBLISHED' ? 'Chuyển về Nháp' : 'Xuất bản Lộ trình'}</span>
        </button>
      </div>
    </div>
  );
}
