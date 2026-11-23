'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock, ExternalLink, MapPin } from 'lucide-react';
import { getAuthorTint, getInitials } from '../utils/community-feed.helper';
import { CommunityPost, extractCommunityContent } from '../api';
import { CommunityPostMediaGallery } from './CommunityPostMediaGallery';
import { PostActionBar } from './PostCard';
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
