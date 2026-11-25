'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock, ExternalLink, Flag, MapPin, X } from 'lucide-react';
import { getAuthorTint, getInitials } from '../community-content.util';
import { CommunityApi, CommunityPost, extractCommunityContent } from '../api';
import { CommunityPostMediaGallery } from './CommunityPostMediaGallery';
import { PostActionBar } from './PostActionBar';
import { PostShareActionNote, PostTypeBadge } from './PostCardParts';
import { formatVietnameseRelativeTime } from './CommentModalParts';

export const DEFAULT_MEMBER_NAME = 'Thành viên HISGO';

// --- PostSummaryPane.tsx ---
export interface SharedBlogPreviewCardProps {
  sharedBlog: NonNullable<ReturnType<typeof extractCommunityContent>['sharedBlog']>;
  onClose: () => void;
}

export function SharedBlogPreviewCard({ sharedBlog, onClose }: SharedBlogPreviewCardProps) {
  const [sharedImgError, setSharedImgError] = useState(false);
  const sharedCoverImage =
    !sharedImgError &&
    sharedBlog?.coverImageUrl &&
    !sharedBlog.coverImageUrl.includes('cld-sample-6.jpg')
      ? sharedBlog.coverImageUrl
      : null;

  return (
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
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            unoptimized
            onError={() => setSharedImgError(true)}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
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
  );
}

export interface PostSummaryPaneProps {
  post: CommunityPost;
  totalCommentCount: number;
  onClose: () => void;
  onFocusInput?: () => void;
  onLikeUpdate?: (postId: string, liked: boolean, likeCount: number) => void;
  onBookmarkUpdate?: (postId: string, bookmarked: boolean) => void;
}

function resolveSummaryMedia(
  post: CommunityPost,
  parsed: ReturnType<typeof extractCommunityContent>,
  sharedBlog: ReturnType<typeof extractCommunityContent>['sharedBlog'],
) {
  if (sharedBlog) {
    return { galleryImages: [], postVideos: [], isMediaPost: false };
  }
  const galleryImages =
    parsed.images.length > 0
      ? parsed.images
      : post.coverImageUrl
        ? [{ url: post.coverImageUrl, caption: null }]
        : [];
  const postVideos = parsed.videos;
  return {
    galleryImages,
    postVideos,
    isMediaPost: galleryImages.length > 0 || postVideos.length > 0,
  };
}

export function PostSummaryPane({
  post,
  totalCommentCount,
  onClose,
  onFocusInput,
  onLikeUpdate,
  onBookmarkUpdate,
}: PostSummaryPaneProps) {
  const authorName = post.author?.username || DEFAULT_MEMBER_NAME;
  const authorTint = getAuthorTint(authorName);
  const parsed = extractCommunityContent(post);
  const sharedBlog = parsed.sharedBlog ?? null;
  const { galleryImages, postVideos, isMediaPost } = resolveSummaryMedia(
    post,
    parsed,
    sharedBlog,
  );

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
              <PostShareActionNote isSharedBlog={Boolean(sharedBlog)} isMediaPost={isMediaPost} />
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

        <PostTypeBadge isSharedBlog={Boolean(sharedBlog)} compact />
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
        <SharedBlogPreviewCard sharedBlog={sharedBlog} onClose={onClose} />
      ) : null}

      {/* Ảnh hoặc Video đính kèm */}
      <CommunityPostMediaGallery
        images={galleryImages}
        videos={postVideos}
        postTitle={post.title}
        compact
      />

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

// === Merged from ReportDialog.tsx ===
const REPORT_REASONS = [
  { id: 'HISTORICAL_REVISIONISM', label: 'Xuyên tạc lịch sử hoặc phủ nhận chủ quyền quốc gia', desc: 'Thông tin sai lệch nghiêm trọng về sự kiện, nhân vật lịch sử hoặc chủ quyền Hoàng Sa, Trường Sa.' },
  { id: 'PROFANITY', label: 'Ngôn từ xúc phạm, công kích cá nhân', desc: 'Chửi bới, hạ thấp danh dự thành viên hoặc sử dụng từ ngữ thiếu văn minh.' },
  { id: 'REGIONAL_DISCRIMINATION', label: 'Phân biệt vùng miền, chia rẽ khối đoàn kết', desc: 'Nội dung kích động kỳ thị vùng miền, dân tộc hoặc tôn giáo.' },
  { id: 'SPAM', label: 'Quảng cáo rác, đường dẫn lừa đảo', desc: 'Nội dung lặp lại vô nghĩa, quảng cáo thương mại hoặc liên kết độc hại.' },
] as const;

export interface ReportDialogProps {
  postId: string;
  postTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onReported?: () => void;
}

export function ReportDialog({
  postId,
  postTitle,
  isOpen,
  onClose,
  onReported,
}: ReportDialogProps) {
  const [selectedId, setSelectedId] = useState<string>(REPORT_REASONS[0].id);
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const chosen = REPORT_REASONS.find((r) => r.id === selectedId);
    const composedReason = customNote.trim()
      ? `[${chosen?.label}] ${customNote.trim()}`
      : chosen?.label || 'Báo cáo nội dung vi phạm';

    try {
      await CommunityApi.reportPost(postId, composedReason);
      setDone(true);
      onReported?.();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Không thể gửi báo cáo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1730]/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-dialog-title"
    >
      <div className="w-full max-w-lg rounded-[12px] border border-[#E2D5B8] bg-[#FAF5E6] p-5 text-[#14233F]">
        <div className="flex items-start justify-between gap-3 border-b border-[#E5DAC4] pb-3.5">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-[#7A1F24]" />
            <h2 id="report-dialog-title" className="text-[16px] font-semibold text-[#14233F]">
              Báo cáo bài viết vi phạm
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại báo cáo"
            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E2D5B8] bg-[#F2E8D5] text-[#4A3F33] transition-colors hover:border-[#14233F] hover:text-[#14233F]"
          >
            <X size={15} />
          </button>
        </div>

        <p className="mt-3 line-clamp-1 text-[13px] text-[#7A6B57]">
          Bài viết: <strong className="font-medium text-[#14233F]">{postTitle}</strong>
        </p>

        {done ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-[8px] border border-[#C6E6D2] bg-[#E5EFE6] p-3.5 text-[13px] leading-5 text-[#184E2C]">
              Đã ghi nhận báo cáo của bạn. Hệ thống kiểm duyệt AI và Ban quản trị HISGO sẽ đối chiếu nội dung này.
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded-[6px] bg-[#7A1F24] px-4 text-[13px] font-medium text-[#FAF5E6]"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <fieldset className="space-y-2">
              <legend className="mb-1.5 text-[13px] font-medium text-[#14233F]">
                Chọn nhóm vi phạm chính
              </legend>
              {REPORT_REASONS.map((item) => {
                const active = selectedId === item.id;
                return (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-[8px] border p-3 transition-colors ${
                      active
                        ? 'border-[#8A5A19] bg-[#F2E8D5]'
                        : 'border-[#E5DAC4] bg-[#FDF9F0] hover:border-[#C9A45C]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={item.id}
                      checked={active}
                      onChange={() => setSelectedId(item.id)}
                      className="mt-1 accent-[#7A1F24]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-[#14233F]">{item.label}</span>
                      <span className="mt-0.5 block text-[12px] leading-5 text-[#7A6B57]">{item.desc}</span>
                    </span>
                  </label>
                );
              })}
            </fieldset>

            <div>
              <label htmlFor="report-custom-note" className="mb-1.5 block text-[13px] font-medium text-[#14233F]">
                Ghi chú dẫn chứng bổ sung (tùy chọn)
              </label>
              <textarea
                id="report-custom-note"
                rows={2}
                maxLength={400}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Nêu rõ chi tiết sai lệch sử liệu hoặc đoạn văn vi phạm..."
                className="w-full resize-none rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3 py-2 text-[13px] leading-5 text-[#14233F] outline-none focus:border-[#8A5A19]"
              />
            </div>

            {errorMsg ? (
              <div className="rounded-[6px] border border-[#E8C5C6] bg-[#F9E8E6] px-3 py-2 text-[12px] text-[#7A1F24]">
                {errorMsg}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded-[6px] border border-[#D4C5A6] bg-[#FDF9F0] px-3.5 text-[13px] font-medium text-[#4A3F33] transition-colors hover:border-[#14233F] hover:text-[#14233F]"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-9 rounded-[6px] bg-[#7A1F24] px-4 text-[13px] font-medium text-[#FAF5E6] transition-colors hover:bg-[#651A1E] disabled:opacity-60"
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
