'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BlogPostType } from '@/constants/enums';
import { CommunityApi, extractCommunityContent, type CommunityPost, type CommunityReferenceItem, type SharedBlogEmbed } from '../api';
import { PostCommentModal } from './PostCommentModal';
import { useRouter } from 'next/navigation';
import { Bookmark, Eye, Flag, Heart, MessageSquare, Check, Clock, MapPin, Share2, UserPlus, BookOpen, ExternalLink } from 'lucide-react';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { ReportDialog } from './ReportDialog';
import { getAuthorTint, getInitials } from '../utils/community-feed.helper';

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
  const [followLoading, setFollowLoading] = useState(false);

  const [localCommentCount, setLocalCommentCount] = useState(post.commentCount);
  const [localPreviewComment, setLocalPreviewComment] = useState<{
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
  } | null>(() => post.previewComment || null);

  const authorName = post.author?.username || 'Thành viên HISGO';
  const parsed = extractCommunityContent(post);
  const sharedBlog = parsed.sharedBlog ?? null;
  const isDirectLongForm = post.postType === BlogPostType.LONG_FORM;

  const rawPrimaryImage = !sharedBlog
    ? post.coverImageUrl || parsed.images[0]?.url || null
    : null;
  const primaryImage =
    !imgError && rawPrimaryImage && !rawPrimaryImage.includes('cld-sample-6.jpg')
      ? rawPrimaryImage
      : null;
  const primaryCaption = parsed.images[0]?.caption;

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
      <PostAuthorHeader
        authorName={authorName}
        authorProfileHref={authorProfileHref}
        publishedAt={post.publishedAt || post.createdAt}
        showFollowButton={showFollowButton}
        isOwnPost={isOwnPost}
        effectiveFollowed={effectiveFollowed}
        followLoading={followLoading}
        onToggleFollow={() => void handleToggleFollowAuthor()}
        isSharedBlog={Boolean(sharedBlog)}
        period={parsed.period}
        locations={parsed.locations}
      />

      <PostQuestionContent
        title={post.title}
        isDirectLongForm={isDirectLongForm}
        summaryText={summaryText}
        expandedText={expandedText}
        paragraphs={parsed.paragraphs}
        fullParagraphText={fullParagraphText}
        hasMoreContent={hasMoreContent}
        onExpandContent={handleExpandContent}
      />

      {sharedBlog ? (
        <PostSharedBlogCard
          sharedBlog={sharedBlog}
          authorName={authorName}
          onTrackView={trackViewOnce}
        />
      ) : null}

      {primaryImage ? (
        <figure className="mt-4 overflow-hidden rounded-[8px] border border-[#E5DAC4] bg-[#F2E8D5]">
          <Image
            src={primaryImage}
            alt={primaryCaption || post.title}
            width={800}
            height={480}
            unoptimized
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

      <PostReferencesAndTags
        references={parsed.references}
        tags={parsed.tags}
        activeTag={activeTag}
        onSelectTag={onSelectTag}
      />

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

      {localPreviewComment ? (
        <PostPreviewCommentBox
          previewComment={localPreviewComment}
          commentCount={localCommentCount}
          onOpenComments={handleToggleComments}
        />
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

// --- PostActionBar.tsx ---
const DEFAULT_ACTION_BUTTON_STYLE =
  'border-[#E2D5BC] bg-[#FAF5E6] text-[#4A3F33] hover:border-[#8A5A19] hover:text-[#14233F]';

interface PostActionBarProps {
  postId: string;
  postTitle: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  commentsOpen: boolean;
  onToggleComments: () => void;
  onLikeUpdate?: (postId: string, liked: boolean, likeCount: number) => void;
  onBookmarkUpdate?: (postId: string, bookmarked: boolean) => void;
}

export function PostActionBar({
  postId,
  postTitle,
  likeCount: initialLikeCount,
  commentCount,
  viewCount,
  likedByMe = false,
  bookmarkedByMe = false,
  commentsOpen,
  onToggleComments,
  onLikeUpdate,
  onBookmarkUpdate,
}: PostActionBarProps) {
  const router = useRouter();
  const user = useAuthSession();
  const [liked, setLiked] = useState(Boolean(likedByMe));
  const [likes, setLikes] = useState(Math.max(0, initialLikeCount));
  const [bookmarked, setBookmarked] = useState(Boolean(bookmarkedByMe));
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);

  const [prevProps, setPrevProps] = useState({
    likeCount: initialLikeCount,
    likedByMe,
    bookmarkedByMe,
  });

  if (
    initialLikeCount !== prevProps.likeCount ||
    likedByMe !== prevProps.likedByMe ||
    bookmarkedByMe !== prevProps.bookmarkedByMe
  ) {
    setPrevProps({
      likeCount: initialLikeCount,
      likedByMe,
      bookmarkedByMe,
    });
    setLikes(Math.max(0, initialLikeCount));
    setLiked(Boolean(likedByMe));
    setBookmarked(Boolean(bookmarkedByMe));
  }

  const requireAuth = () => {
    if (!user?.id) {
      router.push('/login?redirect=/cong-dong');
      return false;
    }
    return true;
  };

  const handleToggleLike = async () => {
    if (!requireAuth() || isLiking) return;

    const prevLiked = liked;
    const prevLikes = likes;
    const nextLiked = !prevLiked;
    const nextLikes = Math.max(0, prevLikes + (nextLiked ? 1 : -1));

    setLiked(nextLiked);
    setLikes(nextLikes);
    onLikeUpdate?.(postId, nextLiked, nextLikes);

    if (postId.startsWith('seed-post-')) return;

    setIsLiking(true);
    try {
      const res = await CommunityApi.toggleLike(postId);
      setLiked(res.liked);
      setLikes(res.likeCount);
      onLikeUpdate?.(postId, res.liked, res.likeCount);
    } catch {
      setLiked(prevLiked);
      setLikes(prevLikes);
      onLikeUpdate?.(postId, prevLiked, prevLikes);
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!requireAuth() || isBookmarking) return;

    const prevBookmarked = bookmarked;
    const nextBookmarked = !prevBookmarked;

    setBookmarked(nextBookmarked);
    onBookmarkUpdate?.(postId, nextBookmarked);

    if (postId.startsWith('seed-post-')) return;

    setIsBookmarking(true);
    try {
      const res = await CommunityApi.toggleBookmark(postId);
      setBookmarked(res.bookmarked);
      onBookmarkUpdate?.(postId, res.bookmarked);
    } catch {
      setBookmarked(prevBookmarked);
      onBookmarkUpdate?.(postId, prevBookmarked);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleOpenReport = () => {
    if (!requireAuth()) return;
    setReportOpen(true);
  };

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EFE5D2] pt-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleLike}
            aria-pressed={liked}
            className={`inline-flex h-9 items-center gap-2 rounded-[6px] border px-3.5 text-[14px] font-medium transition-colors ${
              liked
                ? 'border-[#7A1F24] bg-[#F9E8E6] text-[#7A1F24]'
                : DEFAULT_ACTION_BUTTON_STYLE
            }`}
          >
            <Heart size={15} className={liked ? 'fill-[#7A1F24] text-[#7A1F24]' : ''} />
            <span>Thích</span>
            <span className="tabular-nums font-semibold">{likes.toLocaleString('vi-VN')}</span>
          </button>

          <button
            type="button"
            onClick={onToggleComments}
            aria-expanded={commentsOpen}
            className={`inline-flex h-9 items-center gap-2 rounded-[6px] border px-3.5 text-[14px] font-medium transition-colors ${
              commentsOpen
                ? 'border-[#14233F] bg-[#14233F] text-[#FAF5E6]'
                : DEFAULT_ACTION_BUTTON_STYLE
            }`}
          >
            <MessageSquare size={15} />
            <span>Thảo luận</span>
            <span className="tabular-nums font-semibold">{commentCount.toLocaleString('vi-VN')}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleBookmark}
            aria-pressed={bookmarked}
            className={`inline-flex h-9 items-center gap-2 rounded-[6px] border px-3.5 text-[14px] font-medium transition-colors ${
              bookmarked
                ? 'border-[#8A5A19] bg-[#F2E5C9] text-[#6B4E16]'
                : DEFAULT_ACTION_BUTTON_STYLE
            }`}
          >
            <Bookmark size={15} className={bookmarked ? 'fill-[#6B4E16] text-[#6B4E16]' : ''} />
            <span>{bookmarked ? 'Đã lưu' : 'Lưu bài'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3.5">
          <span
            className="inline-flex items-center gap-1.5 text-[13px] text-[#6E5D4B] tabular-nums"
            title="Lượt đọc bài viết"
          >
            <Eye size={15} />
            <span>{viewCount.toLocaleString('vi-VN')} lượt xem</span>
          </span>

          <button
            type="button"
            onClick={handleOpenReport}
            disabled={reported}
            className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-transparent px-3 text-[13px] font-medium text-[#6E5D4B] transition-colors hover:border-[#E2D5BC] hover:bg-[#F3EAD8] hover:text-[#7A1F24] disabled:opacity-60"
          >
            <Flag size={14} />
            <span>{reported ? 'Đã báo cáo' : 'Báo cáo'}</span>
          </button>
        </div>
      </div>

      <ReportDialog
        postId={postId}
        postTitle={postTitle}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onReported={() => setReported(true)}
      />
    </>
  );
}

// --- PostAuthorHeader.tsx ---
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

// --- PostPreviewCommentBox.tsx ---
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

// --- PostQuestionContent.tsx ---
interface PostQuestionContentProps {
  title: string;
  isDirectLongForm: boolean;
  summaryText: string;
  expandedText: boolean;
  paragraphs: string[];
  fullParagraphText: string;
  hasMoreContent: boolean;
  onExpandContent: () => void;
}

export function PostQuestionContent({
  title,
  isDirectLongForm,
  summaryText,
  expandedText,
  paragraphs,
  fullParagraphText,
  hasMoreContent,
  onExpandContent,
}: PostQuestionContentProps) {
  if (isDirectLongForm) {
    return (
      <p className="mt-3.5 text-[15px] leading-relaxed text-[#4A3F33]">
        Mời cộng đồng cùng đọc và thảo luận bài chuyên khảo lịch sử được xuất bản trên chuyên trang Blog của HISGO:
      </p>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="text-[19px] font-bold leading-snug text-[#14233F] md:text-[21px]">
        {title}
      </h3>

      {summaryText && summaryText !== title ? (
        <div className="mt-2.5 max-w-[85ch] space-y-3 text-[15px] leading-[1.7] text-[#4A3F33]">
          {expandedText && fullParagraphText ? (
            paragraphs.map((p, idx) => <p key={idx}>{p}</p>)
          ) : (
            <p className="line-clamp-4">{summaryText}</p>
          )}
        </div>
      ) : null}

      {hasMoreContent ? (
        <div className="mt-2.5">
          <button
            type="button"
            onClick={onExpandContent}
            className="text-[13px] font-semibold text-[#7A1F24] hover:text-[#14233F]"
          >
            {expandedText ? 'Thu gọn nội dung' : 'Xem thêm nội dung câu hỏi'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

// --- PostReferencesAndTags.tsx ---
interface PostReferencesAndTagsProps {
  references: CommunityReferenceItem[];
  tags: string[];
  activeTag?: string | null;
  onSelectTag?: (tag: string) => void;
}

export function PostReferencesAndTags({
  references,
  tags,
  activeTag,
  onSelectTag,
}: PostReferencesAndTagsProps) {
  return (
    <>
      {references.length > 0 ? (
        <div className="mt-4 rounded-[8px] border border-[#E2D5BC] bg-[#F2E8D5] px-4 py-2.5 text-[13px] text-[#4A3F33]">
          <span className="font-semibold text-[#8A5A19]">Sử liệu đối chiếu: </span>
          <span>
            {references
              .map((ref) => (ref.source ? `${ref.title} (${ref.source})` : ref.title))
              .join(' · ')}
          </span>
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {tags.map((tag) => {
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
    </>
  );
}

// --- PostSharedBlogCard.tsx ---
interface PostSharedBlogCardProps {
  sharedBlog: SharedBlogEmbed;
  authorName: string;
  onTrackView: () => void;
}

export function PostSharedBlogCard({
  sharedBlog,
  authorName,
  onTrackView,
}: PostSharedBlogCardProps) {
  const [sharedImgError, setSharedImgError] = useState(false);

  const sharedCoverImage =
    !sharedImgError &&
    sharedBlog.coverImageUrl &&
    !sharedBlog.coverImageUrl.includes('cld-sample-6.jpg')
      ? sharedBlog.coverImageUrl
      : null;

  return (
    <Link
      href={`/blog/${sharedBlog.slug}`}
      onClick={onTrackView}
      className="group mt-4 block overflow-hidden rounded-[10px] border border-[#D8C8AA] bg-[#F4ECDA] transition-colors hover:border-[#8A5A19]"
    >
      {sharedCoverImage ? (
        <div className="relative aspect-[16/8.5] max-h-[340px] w-full overflow-hidden bg-[#EADBC0]">
          <Image
            src={sharedCoverImage}
            alt={sharedBlog.title}
            width={800}
            height={340}
            unoptimized
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
          <ExternalLink
            size={24}
            className="shrink-0 opacity-75 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </div>
      )}

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
  );
}
