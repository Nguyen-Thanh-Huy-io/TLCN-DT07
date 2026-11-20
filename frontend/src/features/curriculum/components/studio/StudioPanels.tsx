'use client';

import React from 'react';
import { ContentStatus, IconName } from '@/constants/enums';
import { Icon } from '@/components/icons/Icon';
import { LearningPathItem } from '@/services/entities/learning-path.service';
import { StudioTab } from '../HisgoStudioView';
import { STATUS_LABEL_MAP } from '@/constants/ui-theme';
import { StatusPill } from '@/features/articles/components/StatusPill';
import { ArchiveStatusButton } from '@/components/common/ArchiveStatusButton';

// --- LearningPathListPanel.tsx ---
interface LearningPathListPanelProps {
  paths: LearningPathItem[];
  loading: boolean;
  onSelectPath: (id: string) => void;
  onCreatePath: () => void;
}

/** Danh sách mọi Lộ trình học (khóa học) — màn hình MẶC ĐỊNH của tab "Chương & nhóm".
 * Bấm vào 1 Lộ trình để sang màn chi tiết xem/sửa Chương của đúng lộ trình đó (List →
 * Detail), thay cho dropdown + hiện luôn Chương ngay dưới như trước — giúp dễ quét khi
 * có nhiều Lộ trình, và tách bạch rõ "chọn lộ trình" khỏi "sửa cấu trúc chương". */
export function LearningPathListPanel({ paths, loading, onSelectPath, onCreatePath }: LearningPathListPanelProps) {
  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-600 font-medium">Đang tải danh sách lộ trình...</div>;
  }

  if (paths.length === 0) {
    return (
      <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
        <p className="text-sm font-semibold text-slate-800">Chưa có lộ trình học nào</p>
        <p className="text-xs text-slate-600 mt-1">
          Tạo 1 lộ trình để bắt đầu gom các bài học thành khóa học có trình tự riêng.
        </p>
        <button type="button" onClick={onCreatePath} className="primary-button !h-8 !text-xs !px-4 mt-4 font-bold">
          <Icon name={IconName.PLUS} size={12} />
          <span>Tạo lộ trình đầu tiên</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Lộ trình học</h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Mỗi lộ trình là 1 khóa học riêng, gồm các Chương được sắp xếp theo trình tự giảng dạy.
          </p>
        </div>
        <button type="button" onClick={onCreatePath} className="primary-button !h-8 !text-xs !px-3.5 font-bold">
          <Icon name={IconName.PLUS} size={12} />
          <span>Tạo lộ trình</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paths.map((path) => {
          const chapterCount = path.chapters?.length || 0;
          const lessonCount = (path.chapters || []).reduce(
            (sum, c) => sum + (c.chapterLessons?.length || 0),
            0,
          );
          return (
            <button
              key={path.id}
              type="button"
              onClick={() => onSelectPath(path.id)}
              className="text-left border border-slate-200 rounded-lg p-4 bg-white hover:border-emerald-400 hover:shadow-2xs transition-all flex flex-col justify-between cursor-pointer"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <StatusPill status={path.status} />
                  <Icon name={IconName.ARROW} size={13} className="text-slate-400 group-hover:text-emerald-700" />
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{path.title}</h3>

                {path.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{path.description}</p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-600">
                <span className="font-bold text-slate-800">{chapterCount} chương</span>
                <span className="text-slate-400">&bull;</span>
                <span>{lessonCount} bài học</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- LearningPathToolbar.tsx ---
interface LearningPathToolbarProps {
  currentPath: LearningPathItem;
  onBackToList: () => void;
  onOpenEditPath: () => void;
  onOpenCreateLesson: () => void;
  onChangePathStatus: (next: ContentStatus) => void;
  /** Chỉ người duyệt được xuất bản / chuyển về nháp. */
  canPublish: boolean;
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
  onChangePathStatus,
  canPublish,
  actionLoading,
}: LearningPathToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
      <div className="space-y-1">
        <button
          type="button"
          onClick={onBackToList}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition cursor-pointer"
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
            className="p-1 text-slate-500 hover:text-emerald-700 rounded shrink-0"
          >
            <Icon name={IconName.EDIT} size={14} />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="font-semibold text-slate-800">{currentPath.chapters?.length || 0} chương</span>
          {currentPath.description && (
            <>
              <span className="text-slate-400">&bull;</span>
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

        <ArchiveStatusButton
          status={currentPath.status}
          isReviewer={canPublish}
          disabled={actionLoading}
          onChangeStatus={onChangePathStatus}
          className="secondary-button !h-8 !text-xs !px-3"
        />
        {currentPath.status === ContentStatus.ARCHIVED ? null : canPublish ? (
        <button
          type="button"
          onClick={() =>
            onChangePathStatus(
              currentPath.status === ContentStatus.PUBLISHED ? ContentStatus.DRAFT : ContentStatus.PUBLISHED,
            )
          }
          disabled={actionLoading}
          className={`!h-8 !text-xs !px-3 font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
            currentPath.status === ContentStatus.PUBLISHED
              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              : 'bg-emerald-700 text-white hover:bg-emerald-800'
          }`}
        >
          <Icon name={IconName.CHECK} size={13} />
          <span>{currentPath.status === ContentStatus.PUBLISHED ? 'Chuyển về Nháp' : 'Xuất bản Lộ trình'}</span>
        </button>
        ) : (
          <span className="text-xs font-semibold rounded-lg px-2.5 py-1.5 bg-slate-100 text-slate-700">
            {currentPath.status === ContentStatus.PUBLISHED ? STATUS_LABEL_MAP[ContentStatus.PUBLISHED] : 'Bản nháp — người duyệt sẽ xuất bản'}
          </span>
        )}
      </div>
    </div>
  );
}

// --- StudioHeader.tsx ---
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
                <StatusPill status={currentPath.status} />
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">Biên soạn bài học và tổ chức thành lộ trình học</p>
          </div>
        </div>

        {/* Switcher Tab Chính: Chương & nhóm | Thư viện Lesson */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            id="tab-curriculum-chapters"
            onClick={() => onTabChange(StudioTab.CURRICULUM)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === StudioTab.CURRICULUM
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
            onClick={() => onTabChange(StudioTab.LESSON_LIBRARY)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === StudioTab.LESSON_LIBRARY
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon name={IconName.FILE} size={14} />
            <span>Thư viện bài học</span>
            <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full text-xs font-bold">
              {libraryCount}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
