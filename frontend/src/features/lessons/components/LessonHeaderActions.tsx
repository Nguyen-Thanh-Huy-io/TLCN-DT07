'use client';

import React, { RefObject, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Loader2,
  Users,
} from 'lucide-react';
import { ContentStatus, IconName } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';
import { STATUS_LABEL_MAP } from '@/constants/ui-theme';
import { ArchiveStatusButton } from '@/components/common/ArchiveStatusButton';
import { Icon } from '@/components/icons/Icon';
import { AutoSaveState } from '../types/editor.types';

enum HeaderPopoverKind {
  ALERTS = 'ALERTS',
  HELP = 'HELP',
  TEAM = 'TEAM',
  STATUS = 'STATUS',
}

const STATUS_DOT_MAP: Record<ContentStatus, string> = {
  [ContentStatus.DRAFT]: 'bg-slate-500',
  [ContentStatus.PENDING_REVIEW]: 'bg-amber-500',
  [ContentStatus.PUBLISHED]: 'bg-emerald-500',
  [ContentStatus.REJECTED]: 'bg-rose-500',
  [ContentStatus.ARCHIVED]: 'bg-slate-400',
};

const ICON_BTN_ACTIVE = 'bg-slate-100 text-slate-900';
const ICON_BTN_IDLE = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';

export interface LessonHeaderActionsProps {
  lessonId: string | null;
  status: ContentStatus;
  isReviewer: boolean;
  saving: boolean;
  autoSaveState: AutoSaveState;
  lastSavedAt: Date | null;
  hasLocalDraft: boolean;
  lastSavedTime: string | null;
  canSubmit: boolean;
  submitHint?: string;
  assigneeName: string;
  assigneeRoleLabel: string;
  onSaveLesson: (nextStatus: ContentStatus) => void;
  onOpenSidePanel: () => void;
  onOpenCurriculumPreview: () => void;
  onRestoreDraft: () => void;
  onDismissDraft: () => void;
  isMoreMenuOpen: boolean;
  onToggleMoreMenu: () => void;
  onCloseMoreMenu: () => void;
  moreMenuRef: RefObject<HTMLDivElement | null>;
}

function buildAlertItems(
  status: ContentStatus,
  hasLocalDraft: boolean,
  lastSavedTime: string | null,
  canSubmit: boolean,
  submitHint?: string
): string[] {
  const alerts: string[] = [];
  if (status === ContentStatus.REJECTED) {
    alerts.push('Bài học bị từ chối kiểm duyệt — cần chỉnh sửa và gửi duyệt lại.');
  }
  if (!canSubmit && submitHint) {
    alerts.push(submitHint);
  }
  return alerts;
}

function SaveStatusIcon({
  state,
  lastSavedAt,
}: {
  state: AutoSaveState;
  lastSavedAt: Date | null;
}) {
  const isBusy = state === AutoSaveState.PENDING || state === AutoSaveState.SYNCING;
  const isError = state === AutoSaveState.ERROR;
  const isSaved = state === AutoSaveState.SAVED;

  const title = isBusy
    ? 'Đang tự động lưu...'
    : isError
      ? 'Không thể lưu nháp cục bộ'
      : lastSavedAt
        ? `Đã lưu nháp lúc ${lastSavedAt.toLocaleTimeString('vi-VN')}`
        : 'Chưa có thay đổi chưa lưu';

  return (
    <span
      title={title}
      aria-label={title}
      className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 transition ${
        isError
          ? 'border-rose-200 bg-rose-50 text-rose-600'
          : isSaved
            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
            : 'border-slate-200 bg-slate-50 text-slate-400'
      }`}
    >
      {isBusy ? <Loader2 size={14} className="animate-spin text-blue-600" /> : <Check size={14} />}
    </span>
  );
}

/**
 * Cụm công cụ bên phải Header (phong cách Sanity Studio):
 * Cảnh báo · Trợ giúp · Phân công · Pill Trạng thái (Drafts) · Icon Lưu · Gửi duyệt · Menu •••
 */
export function LessonHeaderActions({
  lessonId,
  status,
  isReviewer,
  saving,
  autoSaveState,
  lastSavedAt,
  hasLocalDraft,
  lastSavedTime,
  canSubmit,
  submitHint,
  assigneeName,
  assigneeRoleLabel,
  onSaveLesson,
  onOpenSidePanel,
  onOpenCurriculumPreview,
  onRestoreDraft,
  onDismissDraft,
  isMoreMenuOpen,
  onToggleMoreMenu,
  onCloseMoreMenu,
  moreMenuRef,
}: LessonHeaderActionsProps) {
  const [openPopover, setOpenPopover] = useState<HeaderPopoverKind | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenPopover(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const togglePopover = (kind: HeaderPopoverKind) => {
    setOpenPopover((prev) => (prev === kind ? null : kind));
  };

  const alerts = buildAlertItems(status, hasLocalDraft, lastSavedTime, canSubmit, submitHint);
  const alertCount = alerts.length + (hasLocalDraft ? 1 : 0);
  const statusLabel = STATUS_LABEL_MAP[status] || status;
  const statusDot = STATUS_DOT_MAP[status] || 'bg-slate-400';

  return (
    <div ref={containerRef} className="flex items-center gap-1.5 shrink-0 relative">
      {/* 1. Cảnh báo / Nội dung cần xử lý */}
      <button
        type="button"
        onClick={() => togglePopover(HeaderPopoverKind.ALERTS)}
        title="Thông báo & Nội dung cần xử lý"
        className={`relative w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
          openPopover === HeaderPopoverKind.ALERTS ? ICON_BTN_ACTIVE : ICON_BTN_IDLE
        }`}
      >
        <AlertTriangle size={16} />
        {alertCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
        )}
      </button>

      {/* 2. Trung tâm trợ giúp CMS */}
      <button
        type="button"
        onClick={() => togglePopover(HeaderPopoverKind.HELP)}
        title="Hướng dẫn sử dụng CMS"
        className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
          openPopover === HeaderPopoverKind.HELP ? ICON_BTN_ACTIVE : ICON_BTN_IDLE
        }`}
      >
        <HelpCircle size={16} />
      </button>

      {/* 3. Phân công biên tập & Cộng tác */}
      <button
        type="button"
        onClick={() => togglePopover(HeaderPopoverKind.TEAM)}
        title="Phân công & Kiểm duyệt"
        className={`relative w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
          openPopover === HeaderPopoverKind.TEAM ? ICON_BTN_ACTIVE : ICON_BTN_IDLE
        }`}
      >
        <Users size={16} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
      </button>

      {/* 4. Pill Dropdown Trạng thái (kiểu • Drafts ▾ của Sanity) */}
      <button
        type="button"
        data-testid="btn-status-dropdown"
        onClick={() => togglePopover(HeaderPopoverKind.STATUS)}
        className="h-8 pl-2.5 pr-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition cursor-pointer shadow-2xs"
        title="Trạng thái & Hàng đợi kiểm duyệt"
      >
        <span className={`w-2 h-2 rounded-full ${statusDot}`} />
        <span>{statusLabel}</span>
        <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
          <ChevronDown size={13} />
        </span>
      </button>

      {/* 5. Icon trạng thái lưu gọn */}
      <SaveStatusIcon state={autoSaveState} lastSavedAt={lastSavedAt} />

      {/* 6. Lưu trữ (Reviewer) + Nút Gửi duyệt */}
      {lessonId && (
        <ArchiveStatusButton
          status={status}
          isReviewer={isReviewer}
          disabled={saving}
          onChangeStatus={onSaveLesson}
          className="secondary-button !h-8 !text-xs !px-2.5"
        />
      )}

      {status !== ContentStatus.ARCHIVED && (
        <button
          type="button"
          id="btn-header-submit"
          title={submitHint}
          className="primary-button !h-8 !text-xs !px-3.5 cursor-pointer font-bold flex items-center gap-1.5"
          onClick={() => onSaveLesson(ContentStatus.PENDING_REVIEW)}
          disabled={saving}
        >
          {!canSubmit && <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0" />}
          <span>{saving ? 'Đang lưu...' : lessonId ? 'Cập nhật' : 'Gửi duyệt'}</span>
        </button>
      )}

      {/* 7. Menu thao tác mở rộng */}
      <div className="relative" ref={moreMenuRef}>
        <button
          type="button"
          id="btn-header-more-menu"
          onClick={onToggleMoreMenu}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
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
              onOpenCurriculumPreview();
            }}
            className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer"
          >
            <Icon name={IconName.BOOK} size={14} className="text-amber-600" />
            <span className="font-medium">Sơ đồ lộ trình toàn diện</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onCloseMoreMenu();
              onOpenSidePanel();
            }}
            className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer"
          >
            <Icon name={IconName.GRID} size={14} className="text-blue-600" />
            <span className="font-medium">Trợ lý Cây tri thức</span>
          </button>
        </div>
      </div>

      {/* POPOVERS CHO CÁC ICON KIỂU SANITY */}
      {openPopover === HeaderPopoverKind.ALERTS && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-3.5 z-50 text-xs space-y-2.5">
          <div className="font-bold text-slate-900 flex items-center justify-between">
            <span>Thông báo cần xử lý</span>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              {alertCount}
            </span>
          </div>

          {hasLocalDraft && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 space-y-2">
              <p className="text-amber-900 font-medium leading-relaxed">
                Phát hiện bản nháp tự động lưu trên máy{lastSavedTime ? ` (lúc ${lastSavedTime})` : ''}.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Khôi phục bản nháp đã lưu trên máy vào màn hình hiện tại?')) {
                      setOpenPopover(null);
                      onRestoreDraft();
                    }
                  }}
                  className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-md font-semibold transition cursor-pointer"
                >
                  Khôi phục
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Bỏ qua và xóa bản nháp tự động lưu này?')) {
                      setOpenPopover(null);
                      onDismissDraft();
                    }
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-md font-medium transition cursor-pointer"
                >
                  Bỏ qua
                </button>
              </div>
            </div>
          )}

          {alertCount === 0 ? (
            <p className="text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Không có cảnh báo hay nội dung bị trả về.</span>
            </p>
          ) : (
            alerts.length > 0 && (
              <ul className="space-y-2">
                {alerts.map((msg) => (
                  <li key={msg} className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/70 text-amber-900">
                    {msg}
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      )}

      {openPopover === HeaderPopoverKind.HELP && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-3.5 z-50 text-xs space-y-2">
          <p className="font-bold text-slate-900">Trung tâm trợ giúp CMS</p>
          <ul className="space-y-1.5 text-slate-600 list-disc pl-4">
            <li>
              <strong>Tab Thông tin:</strong> nhập tiêu đề, tóm tắt, chọn Chủ đề, ảnh bìa và nguồn tư liệu.
            </li>
            <li>
              <strong>Tab Nội dung:</strong> soạn khối (Văn bản, Dòng thời gian, Nhân vật, Quiz...). Bấm vào khối để chỉnh thuộc tính ở cột phải.
            </li>
            <li>
              <strong>Kiểm duyệt:</strong> cần có Tiêu đề + Chủ đề trước khi bấm Gửi duyệt.
            </li>
          </ul>
        </div>
      )}

      {openPopover === HeaderPopoverKind.TEAM && (
        <div className="absolute right-0 top-10 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-3.5 z-50 text-xs space-y-2.5">
          <p className="font-bold text-slate-900">Phân công &amp; Cộng tác</p>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 space-y-0.5">
            <p className="font-semibold text-slate-800">{assigneeName}</p>
            <p className="text-[11px] text-slate-500">{assigneeRoleLabel} · Người soạn thảo</p>
          </div>
          <p className="text-[11px] text-slate-500">
            Áp dụng quy tắc duyệt 2 người: tài khoản duyệt phải khác tài khoản tạo bài học.
          </p>
        </div>
      )}

      {openPopover === HeaderPopoverKind.STATUS && (
        <div className="absolute right-0 top-10 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs">
          <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Trạng thái nội dung
          </div>
          <button
            type="button"
            onClick={() => {
              setOpenPopover(null);
              onSaveLesson(ContentStatus.DRAFT);
            }}
            disabled={saving}
            className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center justify-between text-slate-700 cursor-pointer"
          >
            <span>Lưu thành Bản nháp</span>
            {status === ContentStatus.DRAFT && <Check size={13} className="text-emerald-600" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpenPopover(null);
              onSaveLesson(ContentStatus.PENDING_REVIEW);
            }}
            disabled={saving}
            className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center justify-between text-slate-700 cursor-pointer"
          >
            <span>Gửi vào hàng đợi duyệt</span>
            {status === ContentStatus.PENDING_REVIEW && <Check size={13} className="text-amber-600" />}
          </button>
          <div className="my-1 border-t border-slate-100" />
          <Link
            href={APP_ROUTES.REVIEW}
            onClick={() => setOpenPopover(null)}
            className="block px-3.5 py-2 text-blue-700 hover:bg-blue-50 font-semibold"
          >
            Mở hàng đợi kiểm duyệt →
          </Link>
          <Link
            href={APP_ROUTES.CURRICULUM}
            onClick={() => setOpenPopover(null)}
            className="block px-3.5 py-2 text-slate-600 hover:bg-slate-50"
          >
            Về danh sách &amp; Lộ trình
          </Link>
        </div>
      )}
    </div>
  );
}
