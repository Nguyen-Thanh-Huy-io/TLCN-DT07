'use client';

import React, { RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { Badge } from '@/components/common/Badge';
import { IconName } from '@/constants/icons';
import { APP_ROUTES } from '@/constants/routes';
import { ContentStatus } from '@/constants/enums';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { AutoSaveState } from '../types/editor.types';

interface LessonEditorHeaderProps {
  lessonId: string | null;
  status: ContentStatus | any;
  saving: boolean;
  autoSaveState: AutoSaveState;
  lastSavedAt: Date | null;
  hasLocalDraft: boolean;
  lastSavedTime: string | null;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  onSaveLesson: (nextStatus: ContentStatus | any) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenSidePanel: () => void;
  onOpenCurriculumPreview: () => void;
  onRestoreDraft: () => void;
  isMoreMenuOpen: boolean;
  onToggleMoreMenu: () => void;
  onCloseMoreMenu: () => void;
  moreMenuRef: RefObject<HTMLDivElement | null>;
}

/** Thanh header chính (Tầng 1) của LessonEditor: Thoát + tiêu đề + badge trạng thái,
 * trạng thái auto-save, nút Thuộc tính, nút Gửi duyệt/Cập nhật, và menu "•••" cho các
 * thao tác phụ (lưu nháp, toàn màn hình, trợ lý cây tri thức, khôi phục bản nháp). */
export function LessonEditorHeader({
  lessonId,
  status,
  saving,
  autoSaveState,
  lastSavedAt,
  hasLocalDraft,
  lastSavedTime,
  showSidebar,
  onToggleSidebar,
  onSaveLesson,
  isFullscreen,
  onToggleFullscreen,
  onOpenSidePanel,
  onOpenCurriculumPreview,
  onRestoreDraft,
  isMoreMenuOpen,
  onToggleMoreMenu,
  onCloseMoreMenu,
  moreMenuRef,
}: LessonEditorHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-2xs">
      {/* Khối bên trái: Thoát + Tiêu đề trang + Badge trạng thái */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={() => {
            // Quay lại ĐÚNG trang vừa đến (ví dụ tab "Thư viện" trong Curriculum Studio).
            // Trang danh sách bài học độc lập /lessons đã bị gỡ (gộp vào tab Thư viện để
            // tránh trùng lặp giao diện) nên fallback khi không có lịch sử điều hướng giờ
            // trỏ về /curriculum — nơi duy nhất còn hiển thị danh sách bài học.
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push(APP_ROUTES.CURRICULUM);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition cursor-pointer shrink-0"
          title="Quay lại"
        >
          <span className="text-base leading-none">←</span>
          <span>Quay lại</span>
        </button>

        <div className="flex items-center gap-2 min-w-0 pr-2 border-r border-slate-200">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
          <h1 className="text-sm font-bold text-slate-900 tracking-tight truncate">
            {lessonId ? 'Chỉnh sửa Bài học' : 'Soạn thảo Bài học'}
          </h1>
        </div>

        <Badge tone="gray">{status}</Badge>
      </div>

      {/* Khối bên phải: Trạng thái lưu, Thuộc tính, Gửi duyệt & Menu chức năng phụ */}
      <div className="flex items-center gap-2 shrink-0">
        <AutoSaveIndicator state={autoSaveState} lastSavedAt={lastSavedAt} />

        {/* Nút "Xem trước" đã bỏ ở đây vì trùng với nhóm tab Soạn thảo/Chia đôi/Xem trước ở sub-header. */}
        <button
          type="button"
          id="btn-header-properties"
          onClick={onToggleSidebar}
          className={`!h-8 !text-xs !px-2.5 font-semibold rounded-lg border flex items-center gap-1.5 transition cursor-pointer ${
            showSidebar
              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
          }`}
          title={showSidebar ? 'Đóng panel thuộc tính' : 'Mở panel thuộc tính bài học'}
        >
          <Icon name={IconName.GRID} size={12} />
          <span>Thuộc tính</span>
        </button>

        <button
          type="button"
          id="btn-header-submit"
          className="primary-button !h-8 !text-xs md:!text-sm !px-4 cursor-pointer font-bold"
          onClick={() => onSaveLesson(ContentStatus.PENDING_REVIEW)}
          disabled={saving}
        >
          {saving ? 'Đang lưu...' : lessonId ? 'Cập nhật' : 'Gửi duyệt'}
        </button>

        <div className="relative" ref={moreMenuRef}>
          <button
            type="button"
            id="btn-header-more-menu"
            onClick={onToggleMoreMenu}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
            title="Thao tác phụ & mở rộng"
          >
            <Icon name={IconName.MORE} size={15} />
          </button>

          <div
            className={`absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs ${
              isMoreMenuOpen ? 'block animate-in fade-in-50 duration-100' : 'hidden'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                onCloseMoreMenu();
                onSaveLesson(ContentStatus.DRAFT);
              }}
              disabled={saving}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-slate-700 hover:text-slate-900 cursor-pointer font-medium"
            >
              <Icon name={IconName.CHECK} size={14} className="text-emerald-600" />
              <span>{saving ? 'Đang lưu nháp...' : 'Lưu bản nháp'}</span>
            </button>
            {/* Chuyển chế độ Chia đôi: đã có ở nhóm tab Soạn thảo/Chia đôi/Xem trước ở sub-header. */}
            <button
              type="button"
              onClick={() => {
                onCloseMoreMenu();
                onToggleFullscreen();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-slate-700 hover:text-slate-900 cursor-pointer font-medium"
            >
              <Icon name={IconName.SEARCH} size={14} className="text-slate-600" />
              <span>{isFullscreen ? 'Thu nhỏ giao diện' : 'Toàn màn hình (Zen)'}</span>
            </button>
            <div className="border-t border-slate-100 my-1" />
            <button
              type="button"
              onClick={() => {
                onCloseMoreMenu();
                onOpenSidePanel();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-slate-700 hover:text-slate-900 cursor-pointer font-medium"
            >
              <Icon name={IconName.GRID} size={14} className="text-blue-600" />
              <span>Trợ lý Cây tri thức</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onCloseMoreMenu();
                onOpenCurriculumPreview();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-slate-700 hover:text-slate-900 cursor-pointer font-medium"
            >
              <Icon name={IconName.BOOK} size={14} className="text-amber-600" />
              <span>Sơ đồ lộ trình toàn diện</span>
            </button>
            {hasLocalDraft && (
              <>
                <div className="border-t border-slate-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    onCloseMoreMenu();
                    onRestoreDraft();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-amber-50 text-amber-700 cursor-pointer font-medium"
                >
                  <Icon name={IconName.CLOCK} size={14} className="text-amber-600" />
                  <span>Khôi phục bản nháp ({lastSavedTime})</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
