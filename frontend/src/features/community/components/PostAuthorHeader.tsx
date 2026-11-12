'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Clock, MapPin, Share2, UserPlus } from 'lucide-react';
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

interface PostAuthorHeaderProps {
  authorName: string;
  authorProfileHref: string;
  publishedAt?: string | null;
  showFollowButton: boolean;
  isOwnPost: boolean;
  effectiveFollowed: boolean;
  followLoading: boolean;
  onToggleFollow: () => void;
  isSharedBlog: boolean;
  period?: string | null;
  locations?: string | null;
}

export function PostAuthorHeader({
  authorName,
  authorProfileHref,
  publishedAt,
  showFollowButton,
  isOwnPost,
  effectiveFollowed,
  followLoading,
  onToggleFollow,
  isSharedBlog,
  period,
  locations,
}: PostAuthorHeaderProps) {
  const tint = getAuthorTint(authorName);

  return (
    <div className="flex flex-wrap items-start justify-between gap-3.5">
      <div className="flex items-center gap-3.5">
        <Link
          href={authorProfileHref}
          aria-label={`Xem trang cá nhân của ${authorName}`}
          style={{
            backgroundColor: tint.bg,
            color: tint.ink,
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold transition-opacity hover:opacity-85"
        >
          {getInitials(authorName)}
        </Link>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={authorProfileHref}
              className="text-[15px] font-semibold text-[#14233F] hover:text-[#7A1F24]"
            >
              {authorName}
            </Link>
            {showFollowButton && !isOwnPost ? (
              <button
                type="button"
                onClick={onToggleFollow}
                disabled={followLoading}
                className={`inline-flex h-6 items-center gap-1 rounded-[5px] border px-2 text-[12px] font-semibold transition-colors ${
                  effectiveFollowed
                    ? 'border-[#D8C8AA] bg-[#F1E6D0] text-[#5C4E3C] hover:border-[#7A1F24] hover:text-[#7A1F24]'
                    : 'border-[#7A1F24]/30 bg-[#FAF5E6] text-[#7A1F24] hover:border-[#7A1F24] hover:bg-[#7A1F24] hover:text-[#FAF5E6]'
                }`}
              >
                {effectiveFollowed ? (
                  <>
                    <Check size={11} />
                    <span>Đang theo dõi</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={11} />
                    <span>Theo dõi</span>
                  </>
                )}
              </button>
            ) : null}
            {isSharedBlog ? (
              <span className="text-[13px] text-[#5C4E3C]">
                đã chia sẻ một bài chuyên khảo từ <strong>HISGO Blog</strong>
              </span>
            ) : null}
            <span className="text-[13px] text-[#5C4E3C]">·</span>
            <span className="text-[13px] text-[#5C4E3C]">
              {formatVietnameseDate(publishedAt)}
            </span>
          </div>

          {(period || locations) && (
            <div className="mt-1 flex flex-wrap items-center gap-3.5 text-[13px] text-[#6E5D4B]">
              {period ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} />
                  <span>{period}</span>
                </span>
              ) : null}
              {locations ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={13} />
                  <span>{locations}</span>
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-7 items-center gap-1.5 rounded-[6px] px-3 text-[12px] font-semibold whitespace-nowrap ${
            isSharedBlog
              ? 'bg-[#F2E5C9] text-[#6B4E16]'
              : 'bg-[#E5EFE6] text-[#1E4620]'
          }`}
        >
          {isSharedBlog ? (
            <>
              <Share2 size={12} />
              <span>Chia sẻ bài Blog</span>
            </>
          ) : (
            <span>Câu hỏi / Thảo luận ngắn</span>
          )}
        </span>
      </div>
    </div>
  );
}
