'use client';

import React, { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { AlertTriangle, Archive, ArchiveRestore, X } from 'lucide-react';
import { Icon } from '@/components/icons/Icon';
import { ContentStatus, IconName, KeyboardKey } from '@/constants/enums';
import { BadgeTone } from '@/constants/ui-theme';

export interface LogoProps {
  collapsed?: boolean;
}

export function Logo({ collapsed = false }: LogoProps) {
  return (
    <div className={`logo-wrap ${collapsed ? 'logo-collapsed' : ''}`}>
      <div className="logo-mark" title="HISGO CMS">
        <span>H</span>
      </div>
      {!collapsed && (
        <div className="logo-text">
          <strong>HISGO</strong>
          <span className="logo-tag">CMS</span>
        </div>
      )}
    </div>
  );
}

export interface AvatarProps {
  text?: string;
  small?: boolean;
  className?: string;
}

export function Avatar({ text = 'MA', small = false, className = '' }: AvatarProps) {
  return (
    <span className={`avatar ${small ? 'avatar-sm' : ''} ${className}`.trim()}>
      {text}
    </span>
  );
}

export interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone | string;
  className?: string;
}

export function Badge({ children, tone = 'gray', className = '' }: BadgeProps) {
  return (
    <span className={`badge badge-${tone} ${className}`.trim()}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}

export interface UserCellProps {
  initials: string;
  name: string;
}

export function UserCell({ initials, name }: UserCellProps) {
  return (
    <div className="user-cell">
      <Avatar text={initials} small />
      <span>{name}</span>
    </div>
  );
}

// --- Merged from RemoteImage.tsx ---
type RemoteImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  src: string;
  alt: string;
};

export function RemoteImage({ src, alt, loading = 'lazy', ...rest }: RemoteImageProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={loading} decoding="async" {...rest} />;
}

export type ConfirmDialogTone = 'warning' | 'danger' | 'primary';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
}

const CONFIRM_TONE_STYLES: Record<
  ConfirmDialogTone,
  { iconWrap: string; confirmBtn: string }
> = {
  warning: {
    iconWrap: 'bg-amber-50 text-amber-600 border-amber-200',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  danger: {
    iconWrap: 'bg-rose-50 text-rose-600 border-rose-200',
    confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  primary: {
    iconWrap: 'bg-slate-100 text-slate-700 border-slate-200',
    confirmBtn: 'bg-slate-900 hover:bg-slate-800 text-white',
  },
};

/** Hộp thoại xác nhận dùng chung chuẩn HISGO (thay thế window.confirm / window.alert thô). */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  tone = 'warning',
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.ESCAPE) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const styles = CONFIRM_TONE_STYLES[tone];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4"
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${styles.iconWrap}`}
          >
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">{title}</h3>
            <p className="mt-1 text-xs sm:text-[13px] text-slate-600 leading-relaxed">{message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer ${styles.confirmBtn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Merged from ArchiveStatusButton.tsx ---
const CONFIRM_ARCHIVE =
  'Nội dung sẽ được gỡ khỏi trang công khai nhưng vẫn giữ nguyên dữ liệu — bạn có thể khôi phục về bản nháp bất cứ lúc nào.';

export interface ArchiveStatusButtonProps {
  status: string;
  isReviewer: boolean;
  disabled?: boolean;
  onChangeStatus: (next: ContentStatus) => void;
  className?: string;
}

export function ArchiveStatusButton({
  status,
  isReviewer,
  disabled,
  onChangeStatus,
  className = 'secondary-button !h-9 !text-sm',
}: ArchiveStatusButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!isReviewer) return null;

  if (status === ContentStatus.PUBLISHED) {
    return (
      <>
        <button
          type="button"
          disabled={disabled}
          className={className}
          title="Gỡ khỏi trang công khai nhưng vẫn giữ lại"
          onClick={() => setConfirmOpen(true)}
        >
          <Archive size={15} /> Lưu trữ
        </button>
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => onChangeStatus(ContentStatus.ARCHIVED)}
          title="Lưu trữ nội dung này?"
          message={CONFIRM_ARCHIVE}
          confirmLabel="Lưu trữ ngay"
          cancelLabel="Hủy"
          tone="warning"
        />
      </>
    );
  }

  if (status === ContentStatus.ARCHIVED) {
    return (
      <button
        type="button"
        disabled={disabled}
        className={className}
        onClick={() => onChangeStatus(ContentStatus.DRAFT)}
      >
        <ArchiveRestore size={15} /> Khôi phục về nháp
      </button>
    );
  }

  return null;
}

// --- Merged from ConfirmDeleteModal.tsx ---
export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemTypeLabel?: string;
  message?: string;
  confirmLabel?: string;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemTypeLabel = 'mục',
  message,
  confirmLabel,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Xác nhận xóa {itemTypeLabel}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <p className="delete-warn-text">
            {message || (
              <>
                Bạn có chắc chắn muốn xóa {itemTypeLabel} <strong>&ldquo;{title}&rdquo;</strong> không? Thao tác này không thể hoàn tác.
              </>
            )}
          </p>
          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>
              Hủy bỏ
            </button>
            <button
              type="button"
              className="danger-button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmLabel || `Xóa ${itemTypeLabel}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Merged from ActionMenu.tsx ---
export interface ActionMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export function ActionMenu({ onEdit, onDelete, onView }: ActionMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="action-menu-wrapper" style={{ position: 'relative' }}>
      <button
        type="button"
        className="action-more"
        aria-label="Mở thao tác"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <Icon name={IconName.MORE} size={15} className="text-slate-700" />
      </button>
      {open && (
        <>
          <div className="action-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="action-dropdown shadow-md border border-slate-200">
            <button
              type="button"
              className="dropdown-item text-xs font-semibold text-slate-700 hover:text-slate-900"
              onClick={() => {
                setOpen(false);
                if (onView) onView();
                else alert('Xem thông tin chi tiết');
              }}
            >
              <Icon name={IconName.EYE} size={15} className="text-slate-600" /> Xem chi tiết
            </button>
            <button
              type="button"
              className="dropdown-item text-xs font-semibold text-slate-700 hover:text-slate-900"
              onClick={() => {
                setOpen(false);
                if (onEdit) onEdit();
                else alert('Chỉnh sửa nội dung');
              }}
            >
              <Icon name={IconName.EDIT} size={15} className="text-slate-600" /> Chỉnh sửa
            </button>
            <button
              type="button"
              className="dropdown-item danger text-xs font-semibold text-red-600 hover:text-red-700"
              onClick={() => {
                setOpen(false);
                if (onDelete) onDelete();
                else alert('Xóa mục này');
              }}
            >
              <Icon name={IconName.TRASH} size={15} className="text-red-600" /> Xóa
            </button>
          </div>
        </>
      )}
    </div>
  );
}
