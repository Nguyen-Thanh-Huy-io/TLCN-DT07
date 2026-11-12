'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { getAuthorTint, getInitials } from '../utils/author-avatar.util';

function formatVietnameseDate(iso?: string | null) {
  if (!iso) return 'Mới đăng';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Mới đăng';
  const diffMin = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays <= 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

interface PostPreviewCommentBoxProps {
  previewComment: {
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
  };
  commentCount: number;
  onOpenComments: () => void;
}

export function PostPreviewCommentBox({
  previewComment,
  commentCount,
  onOpenComments,
}: PostPreviewCommentBoxProps) {
  const tint = getAuthorTint(previewComment.authorName);

  return (
    <div className="mt-4 rounded-[8px] border border-[#E5DAC4] bg-[#F5EDE0] px-4 py-3 text-[13px] text-[#4A3F33]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              style={{
                backgroundColor: tint.bg,
                color: tint.ink,
              }}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
            >
              {getInitials(previewComment.authorName)}
            </span>
            <span className="font-semibold text-[#14233F]">
              {previewComment.authorName}
            </span>
            <span className="text-[12px] text-[#5C4E3C]">
              · {formatVietnameseDate(previewComment.createdAt)}
            </span>
          </div>
          <p className="mt-1.5 line-clamp-2 pl-8 text-[13.5px] leading-relaxed text-[#3A3026]">
            {previewComment.content}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between rounded-[6px] bg-[#EFE4CF] px-3 py-1.5 pl-8">
        <button
          type="button"
          onClick={onOpenComments}
          className="inline-flex items-center gap-1.5 font-semibold text-[#7A1F24] transition-colors hover:text-[#14233F] hover:underline"
        >
          <MessageSquare size={13} />
          <span>Xem tất cả {commentCount} bình luận trước đó...</span>
        </button>
        <button
          type="button"
          onClick={onOpenComments}
          className="font-medium text-[#6E5D4B] hover:text-[#14233F] hover:underline"
        >
          Viết bình luận
        </button>
      </div>
    </div>
  );
}
