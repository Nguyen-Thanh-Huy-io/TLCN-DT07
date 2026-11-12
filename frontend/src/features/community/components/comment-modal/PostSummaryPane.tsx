'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Clock,
  ExternalLink,
  MapPin,
  Share2,
} from 'lucide-react';
import { CommunityPost, extractCommunityContent } from '../../api';
import { PostActionBar } from '../PostActionBar';
import { getAuthorTint, getInitials } from '../../utils/author-avatar.util';
import { formatVietnameseRelativeTime } from './comment-tree.util';

interface PostSummaryPaneProps {
  post: CommunityPost;
  totalCommentCount: number;
  onClose: () => void;
  onFocusInput?: () => void;
  onLikeUpdate?: (postId: string, liked: boolean, likeCount: number) => void;
  onBookmarkUpdate?: (postId: string, bookmarked: boolean) => void;
}

export function PostSummaryPane({
  post,
  totalCommentCount,
  onClose,
  onFocusInput,
  onLikeUpdate,
  onBookmarkUpdate,
}: PostSummaryPaneProps) {
  const [imgError, setImgError] = useState(false);
  const [sharedImgError, setSharedImgError] = useState(false);

  const authorName = post.author?.username || 'Thành viên HISGO';
  const authorTint = getAuthorTint(authorName);
  const parsed = extractCommunityContent(post);
  const sharedBlog = parsed.sharedBlog ?? null;

  const rawPrimaryImage = !sharedBlog
    ? post.coverImageUrl || parsed.images[0]?.url || null
    : null;
  const primaryImage =
    !imgError && rawPrimaryImage && !rawPrimaryImage.includes('cld-sample-6.jpg')
      ? rawPrimaryImage
      : null;
  const primaryCaption = parsed.images[0]?.caption;

  const sharedCoverImage =
    !sharedImgError &&
    sharedBlog?.coverImageUrl &&
    !sharedBlog.coverImageUrl.includes('cld-sample-6.jpg')
      ? sharedBlog.coverImageUrl
      : null;

  return (
    <div className="rounded-[8px] border border-[#E5DAC4] bg-[#FDF9F0] p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: authorTint.bg, color: authorTint.ink }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
          >
            {getInitials(authorName)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-semibold text-[#14233F]">
                {authorName}
              </span>
              {sharedBlog ? (
                <span className="text-[13px] text-[#5C4E3C]">
                  đã chia sẻ bài chuyên khảo từ <strong>HISGO Blog</strong>
                </span>
              ) : null}
              <span className="text-[12px] text-[#7A6B57]">·</span>
              <span className="text-[12px] text-[#7A6B57]">
                {formatVietnameseRelativeTime(post.publishedAt || post.createdAt)}
              </span>
            </div>

            {(parsed.period || parsed.locations) && (
              <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[12px] text-[#6E5D4B]">
                {parsed.period ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    <span>{parsed.period}</span>
                  </span>
                ) : null}
                {parsed.locations ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} />
                    <span>{parsed.locations}</span>
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <span
          className={`inline-flex h-6 items-center gap-1 rounded-[5px] px-2.5 text-[11px] font-semibold ${
            sharedBlog ? 'bg-[#F2E5C9] text-[#6B4E16]' : 'bg-[#E5EFE6] text-[#1E4620]'
          }`}
        >
          {sharedBlog ? (
            <>
              <Share2 size={11} />
              <span>Chia sẻ bài Blog</span>
            </>
          ) : (
            <span>Câu hỏi / Thảo luận ngắn</span>
          )}
        </span>
      </div>

      {/* Nội dung câu hỏi / lời dẫn */}
      <div className="mt-3.5">
        <h3 className="text-[17px] font-bold leading-snug text-[#14233F] md:text-[19px]">
          {post.title}
        </h3>

        {parsed.paragraphs.length > 0 ? (
          <div className="mt-2 space-y-2.5 text-[14px] leading-[1.7] text-[#4A3F33]">
            {parsed.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        ) : post.excerpt && post.excerpt !== post.title ? (
          <p className="mt-2 text-[14px] leading-[1.7] text-[#4A3F33]">
            {post.excerpt}
          </p>
        ) : null}
      </div>

      {/* Thẻ chia sẻ bài Blog kiểu Facebook bên trong Popup */}
      {sharedBlog ? (
        <Link
          href={`/blog/${sharedBlog.slug}`}
          onClick={onClose}
          className="group mt-3.5 block overflow-hidden rounded-[8px] border border-[#D8C8AA] bg-[#F4ECDA] transition-colors hover:border-[#8A5A19]"
        >
          {sharedCoverImage ? (
            <div className="relative aspect-[16/8] max-h-[260px] w-full overflow-hidden bg-[#EADBC0]">
              <Image
                src={sharedCoverImage}
                alt={sharedBlog.title}
                width={800}
                height={260}
                unoptimized
                onError={() => setSharedImgError(true)}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-[4px] bg-[#14233F]/85 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#FAF5E6]">
                <BookOpen size={11} />
                <span>HISGO BLOG</span>
              </span>
            </div>
          ) : null}
          <div className="p-3.5 md:p-4">
            <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#8A5A19]">
              <span>
                HISGO.VN/BLOG ·{' '}
                {sharedBlog.authorName ? `TÁC GIẢ: ${sharedBlog.authorName}` : 'CHUYÊN KHẢO'}
              </span>
              <span className="inline-flex items-center gap-1 text-[#7A1F24] group-hover:underline">
                <span>Đọc trên Blog</span>
                <ExternalLink size={11} />
              </span>
            </div>
            <h4 className="mt-1 text-[16px] font-bold text-[#14233F] group-hover:text-[#7A1F24]">
              {sharedBlog.title}
            </h4>
            {sharedBlog.excerpt ? (
              <p className="mt-1 line-clamp-2 text-[13px] text-[#5C4E3C]">
                {sharedBlog.excerpt}
              </p>
            ) : null}
          </div>
        </Link>
      ) : null}

      {/* Ảnh đính kèm bài ngắn nếu có */}
      {primaryImage ? (
        <figure className="mt-3.5 overflow-hidden rounded-[8px] border border-[#E5DAC4] bg-[#F2E8D5]">
          <Image
            src={primaryImage}
            alt={primaryCaption || post.title}
            width={800}
            height={360}
            unoptimized
            onError={() => setImgError(true)}
            className="max-h-[360px] w-full object-cover"
          />
          {primaryCaption ? (
            <figcaption className="bg-[#EFE4CF] px-3.5 py-2 text-[12px] text-[#6E5D4B]">
              Nguồn / Chú thích: {primaryCaption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      <PostActionBar
        postId={post.id}
        postTitle={post.title}
        likeCount={post.likeCount}
        commentCount={totalCommentCount}
        viewCount={post.viewCount}
        likedByMe={post.likedByMe}
        bookmarkedByMe={post.bookmarkedByMe}
        commentsOpen={true}
        onToggleComments={() => onFocusInput?.()}
        onLikeUpdate={onLikeUpdate}
        onBookmarkUpdate={onBookmarkUpdate}
      />
    </div>
  );
}
