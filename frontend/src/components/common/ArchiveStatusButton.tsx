'use client';

import React from 'react';
import { Archive, ArchiveRestore } from 'lucide-react';
import { ContentStatus } from '@/constants/enums';

const CONFIRM_ARCHIVE =
  'Lưu trữ nội dung này? Nội dung sẽ biến mất khỏi trang công khai nhưng vẫn được giữ lại — khôi phục về bản nháp bất cứ lúc nào.';

interface ArchiveStatusButtonProps {
  status: string;
  isReviewer: boolean;
  disabled?: boolean;
  /** Gửi trạng thái mới lên server (ARCHIVED hoặc DRAFT). */
  onChangeStatus: (next: ContentStatus) => void;
  className?: string;
}

/**
 * Vòng lưu trữ PUBLISHED → ARCHIVED → DRAFT (backend: ContentWriteGuard). Chỉ người duyệt thấy nút:
 * nội dung đang xuất bản → "Lưu trữ"; đang lưu trữ → "Khôi phục về nháp"; trạng thái khác không hiện gì.
 */
export function ArchiveStatusButton({
  status,
  isReviewer,
  disabled,
  onChangeStatus,
  className = 'secondary-button !h-9 !text-sm',
}: ArchiveStatusButtonProps) {
  if (!isReviewer) return null;

  if (status === ContentStatus.PUBLISHED) {
    return (
      <button
        type="button"
        disabled={disabled}
        className={className}
        title="Gỡ khỏi trang công khai nhưng vẫn giữ lại"
        onClick={() => {
          if (window.confirm(CONFIRM_ARCHIVE)) onChangeStatus(ContentStatus.ARCHIVED);
        }}
      >
        <Archive size={15} /> Lưu trữ
      </button>
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
