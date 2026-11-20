import React from 'react';
import { CONTENT_STATUS_LABELS, type ContentStatusValue } from '@/services/entities/article.service';

const TONES: Record<ContentStatusValue, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800',
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-700',
  ARCHIVED: 'bg-stone-200 text-stone-600',
};

/** Nhãn trạng thái nội dung (ContentStatus) dùng cho bài viết & dòng thời gian. */
export function StatusPill({ status }: { status: ContentStatusValue }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[status] ?? TONES.DRAFT}`}>
      {CONTENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}
