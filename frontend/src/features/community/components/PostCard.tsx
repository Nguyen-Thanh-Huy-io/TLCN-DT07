'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Check, Clock, ExternalLink, MapPin, MessageSquare, Share2, UserPlus } from 'lucide-react';
import { CommunityApi, extractCommunityContent, type CommunityPost } from '../api';
import { PostActionBar } from './PostActionBar';
import { PostCommentModal } from './PostCommentModal';
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

interface PostCardProps {
  post: CommunityPost;
  activeTag?: string | null;
  onSelectTag?: (tag: string) => void;
  onLikeUpdate?: (postId: string, liked: boolean, likeCount: number) => void;
  onBookmarkUpdate?: (postId: string, bookmarked: boolean) => void;
  isFollowedAuthor?: boolean;
  isOwnPost?: boolean;
  showFollowButton?: boolean;
  onFollowUpdate?: (authorIdentifier: string, following: boolean, followerCount?: number) => void;
}

export function PostCard({
  post,
  activeTag,
  onSelectTag,
  onLikeUpdate,
  onBookmarkUpdate,
  isFollowedAuthor,
  isOwnPost = false,
  showFollowButton = true,
  onFollowUpdate,
}: PostCardProps) {
  const [expandedText, setExpandedText] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [sharedImgError, setSharedImgError] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [localCommentCount, setLocalCommentCount] = useState(post.commentCount);
  const [localPreviewComment, setLocalPreviewComment] = useState<{
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
  } | null>(() => post.previewComment || null);

  const authorName = post.author?.username || 'Thành viên HISGO';
  const tint = getAuthorTint(authorName);
  const parsed = extractCommunityContent(post);
  const sharedBlog = parsed.sharedBlog ?? null;
  const isDirectLongForm = post.postType === 'LONG_FORM';

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

  const fullParagraphText = parsed.paragraphs.join('\n\n');
  const summaryText = post.excerpt || parsed.paragraphs[0] || '';
  const hasMoreContent = !isDirectLongForm && fullParagraphText.length > summaryText.length + 40;

  const trackViewOnce = () => {
    if (viewTracked) return;
    setViewTracked(true);
    void CommunityApi.incrementView(post.id);
  };

  const handleToggleComments = () => {
    trackViewOnce();
    setCommentsOpen((prev) => !prev);
  };

  const handleExpandContent = () => {
    trackViewOnce();
    setExpandedText((prev) => !prev);
  };

  const authorProfileHref = `/cong-dong/thanh-vien/${encodeURIComponent(authorName)}`;
  const effectiveFollowed = isFollowedAuthor ?? Boolean(post.author?.followedByMe);

  const handleToggleFollowAuthor = async () => {
    if (followLoading || isOwnPost) return;
    const identifier = post.author?.id || authorName;
    const nextState = !effectiveFollowed;
    onFollowUpdate?.(identifier, nextState);
    setFollowLoading(true);
    try {
      const res = await CommunityApi.toggleFollow(identifier);
      onFollowUpdate?.(identifier, res.following, res.followerCount);
    } catch {
      onFollowUpdate?.(identifier, !nextState);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <article className="rounded-[8px] border border-[#E5DAC4] bg-[#FDF9F0] p-6 transition-colors hover:border-[#D8C8AA] md:p-8">
      {/* Header tác giả */}
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
                  onClick={() => void handleToggleFollowAuthor()}
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
              {sharedBlog ? (
                <span className="text-[13px] text-[#5C4E3C]">
                  đã chia sẻ một bài chuyên khảo từ <strong>HISGO Blog</strong>
                </span>
              ) : null}
              <span className="text-[13px] text-[#5C4E3C]">·</span>
              <span className="text-[13px] text-[#5C4E3C]">
                {formatVietnameseDate(post.publishedAt || post.createdAt)}
              </span>
            </div>

            {(parsed.period || parsed.locations) && (
              <div className="mt-1 flex flex-wrap items-center gap-3.5 text-[13px] text-[#6E5D4B]">
                {parsed.period ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={13} />
                    <span>{parsed.period}</span>
                  </span>
                ) : null}
                {parsed.locations ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} />
                    <span>{parsed.locations}</span>
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-7 items-center gap-1.5 rounded-[6px] px-3 text-[12px] font-semibold whitespace-nowrap ${
              sharedBlog
                ? 'bg-[#F2E5C9] text-[#6B4E16]'
                : 'bg-[#E5EFE6] text-[#1E4620]'
            }`}
          >
            {sharedBlog ? (
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

      {/* Nội dung lời dẫn hoặc câu hỏi ngắn trên Cộng đồng */}
      {!isDirectLongForm ? (
        <div className="mt-4">
          <h3 className="text-[19px] font-bold leading-snug text-[#14233F] md:text-[21px]">
            {post.title}
          </h3>

          {summaryText && summaryText !== post.title ? (
            <div className="mt-2.5 max-w-[85ch] space-y-3 text-[15px] leading-[1.7] text-[#4A3F33]">
              {expandedText && fullParagraphText ? (
                parsed.paragraphs.map((p, idx) => <p key={idx}>{p}</p>)
              ) : (
                <p className="line-clamp-4">{summaryText}</p>
              )}
            </div>
          ) : null}

          {hasMoreContent ? (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={handleExpandContent}
                className="text-[13px] font-semibold text-[#7A1F24] hover:text-[#14233F]"
              >
                {expandedText ? 'Thu gọn nội dung' : 'Xem thêm nội dung câu hỏi'}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-3.5 text-[15px] leading-relaxed text-[#4A3F33]">
          Mời cộng đồng cùng đọc và thảo luận bài chuyên khảo lịch sử được xuất bản trên chuyên trang Blog của HISGO:
        </p>
      )}

      {/* THẺ CHIA SẺ BÀI BLOG KIỂU FACEBOOK (Ảnh bìa + Tiêu đề + Lời chú thích nhỏ → Bấm vào chuyển sang /blog/[slug]) */}
      {sharedBlog ? (
        <Link
          href={`/blog/${sharedBlog.slug}`}
          onClick={trackViewOnce}
          className="group mt-4 block overflow-hidden rounded-[10px] border border-[#D8C8AA] bg-[#F4ECDA] transition-colors hover:border-[#8A5A19]"
        >
          {/* Khung ảnh bìa kiểu Facebook Link Share */}
          {sharedCoverImage ? (
            <div className="relative aspect-[16/8.5] max-h-[340px] w-full overflow-hidden bg-[#EADBC0]">
              <img
                src={sharedCoverImage}
                alt={sharedBlog.title}
                onError={() => setSharedImgError(true)}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-[5px] bg-[#14233F]/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#FAF5E6]">
                <BookOpen size={12} />
                <span>HISGO BLOG</span>
              </span>
            </div>
          ) : (
            <div className="relative flex h-36 w-full items-center justify-between overflow-hidden bg-[#2C1E16] px-6 py-5 text-[#FAF5E6]">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#FAF5E6]">
                  <BookOpen size={12} />
                  <span>HISGO BLOG · CHUYÊN KHẢO LỊCH SỬ</span>
                </span>
                <p className="mt-2 line-clamp-1 text-[15px] font-medium text-[#F5EEDC]/90">
                  Tác giả: {sharedBlog.authorName || authorName}
                </p>
              </div>
              <ExternalLink size={24} className="shrink-0 opacity-75 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          )}

          {/* Phần chân thẻ: Nhãn tên miền, Tiêu đề bài chuyên khảo & Lời chú thích nhỏ */}
          <div className="p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A5A19]">
              <span>
                HISGO.VN/BLOG · {sharedBlog.authorName ? `TÁC GIẢ: ${sharedBlog.authorName}` : 'CHUYÊN KHẢO'}
              </span>
              <span className="inline-flex items-center gap-1 text-[#7A1F24] group-hover:underline">
                <span>Đọc toàn văn trên Blog</span>
                <ExternalLink size={12} />
              </span>
            </div>

            <h4 className="mt-1.5 text-[18px] font-bold leading-snug text-[#14233F] transition-colors group-hover:text-[#7A1F24] md:text-[20px]">
              {sharedBlog.title}
            </h4>

            {sharedBlog.excerpt ? (
              <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-[#5C4E3C]">
                {sharedBlog.excerpt}
              </p>
            ) : null}
          </div>
        </Link>
      ) : null}

      {/* Ảnh tư liệu đính kèm trực tiếp cho bài đặt câu hỏi ngắn */}
      {primaryImage ? (
        <figure className="mt-4 overflow-hidden rounded-[8px] border border-[#E5DAC4] bg-[#F2E8D5]">
          <img
            src={primaryImage}
            alt={primaryCaption || post.title}
            onError={() => setImgError(true)}
            className="max-h-[480px] w-full object-cover"
          />
          {primaryCaption ? (
            <figcaption className="bg-[#EFE4CF] px-4 py-2.5 text-[13px] text-[#6E5D4B]">
              Nguồn / Chú thích: {primaryCaption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      {parsed.references.length > 0 ? (
        <div className="mt-4 rounded-[8px] border border-[#E2D5BC] bg-[#F2E8D5] px-4 py-2.5 text-[13px] text-[#4A3F33]">
          <span className="font-semibold text-[#8A5A19]">Sử liệu đối chiếu: </span>
          <span>
            {parsed.references
              .map((ref) => (ref.source ? `${ref.title} (${ref.source})` : ref.title))
              .join(' · ')}
          </span>
        </div>
      ) : null}

      {parsed.tags.length > 0 ? (
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {parsed.tags.map((tag) => {
            const isSelected = activeTag?.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onSelectTag?.(tag)}
                className={`h-7 rounded-[6px] border px-2.5 text-[13px] font-medium transition-colors ${
                  isSelected
                    ? 'border-[#7A1F24] bg-[#7A1F24] text-[#FAF5E6]'
                    : 'border-[#E2D5BC] bg-[#F3EAD8] text-[#5C4E3C] hover:border-[#8A5A19] hover:text-[#14233F]'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      ) : null}

      <PostActionBar
        postId={post.id}
        postTitle={post.title}
        likeCount={post.likeCount}
        commentCount={localCommentCount}
        viewCount={post.viewCount}
        likedByMe={post.likedByMe}
        bookmarkedByMe={post.bookmarkedByMe}
        commentsOpen={commentsOpen}
        onToggleComments={handleToggleComments}
        onLikeUpdate={onLikeUpdate}
        onBookmarkUpdate={onBookmarkUpdate}
      />

      {/* Xem trước bình luận nổi bật và nút bấm mở Popup tất cả bình luận kiểu Facebook */}
      {localPreviewComment ? (
        <div className="mt-4 rounded-[8px] border border-[#E5DAC4] bg-[#F5EDE0] px-4 py-3 text-[13px] text-[#4A3F33]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  style={{
                    backgroundColor: getAuthorTint(localPreviewComment.authorName).bg,
                    color: getAuthorTint(localPreviewComment.authorName).ink,
                  }}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                >
                  {getInitials(localPreviewComment.authorName)}
                </span>
                <span className="font-semibold text-[#14233F]">
                  {localPreviewComment.authorName}
                </span>
                <span className="text-[12px] text-[#5C4E3C]">
                  · {formatVietnameseDate(localPreviewComment.createdAt)}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 pl-8 text-[13.5px] leading-relaxed text-[#3A3026]">
                {localPreviewComment.content}
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between rounded-[6px] bg-[#EFE4CF] px-3 py-1.5 pl-8">
            <button
              type="button"
              onClick={handleToggleComments}
              className="inline-flex items-center gap-1.5 font-semibold text-[#7A1F24] transition-colors hover:text-[#14233F] hover:underline"
            >
              <MessageSquare size={13} />
              <span>Xem tất cả {localCommentCount} bình luận trước đó...</span>
            </button>
            <button
              type="button"
              onClick={handleToggleComments}
              className="font-medium text-[#6E5D4B] hover:text-[#14233F] hover:underline"
            >
              Viết bình luận
            </button>
          </div>
        </div>
      ) : null}

      <PostCommentModal
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        post={{ ...post, commentCount: localCommentCount }}
        onLikeUpdate={onLikeUpdate}
        onBookmarkUpdate={onBookmarkUpdate}
        onCommentAdded={(_postId, updatedTotal, latestComment) => {
          setLocalCommentCount(updatedTotal);
          if (latestComment) {
            setLocalPreviewComment(latestComment);
          }
        }}
      />
    </article>
  );
}
