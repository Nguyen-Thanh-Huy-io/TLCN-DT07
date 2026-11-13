'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare, X, CornerDownRight, Send, Edit3, Heart, Trash2, BookOpen, Clock, ExternalLink, MapPin, Share2 } from 'lucide-react';
import { getAuthorTint, getInitials } from '../utils/community-feed.helper';
import { usePostComments } from '../hooks/usePostComments';
import { CommunityPost, extractCommunityContent } from '../api';
import { KEYBOARD_KEYS } from '@/constants/enums';
import { PostActionBar } from './PostCard';

export enum CommentSortOrder {
  OLDEST = 'oldest',
  NEWEST = 'newest',
  POPULAR = 'popular',
}

export type SortOrder = CommentSortOrder;

const DEFAULT_MEMBER_NAME = 'Thành viên HISGO';

const SORT_OPTIONS: Array<{ key: SortOrder; label: string }> = [
  { key: CommentSortOrder.OLDEST, label: 'Từ trước đến nay' },
  { key: CommentSortOrder.POPULAR, label: 'Phù hợp nhất' },
  { key: CommentSortOrder.NEWEST, label: 'Mới nhất' },
];

export function PostCommentModal({
  isOpen,
  onClose,
  post,
  onLikeUpdate,
  onBookmarkUpdate,
  onCommentAdded,
}: PostCommentModalProps) {
  const {
    currentUserId,
    currentUserName,
    sortedComments,
    totalCommentCount,
    isLoadingComments,
    sortOrder,
    setSortOrder,
    composerText,
    setComposerText,
    replyingTo,
    setReplyingTo,
    editingId,
    setEditingId,
    editingText,
    setEditingText,
    inputRef,
    commentsEndRef,
    handleSelectReply,
    handleToggleLikeComment,
    handleSubmitComment,
    handleSaveEdit,
    handleDeleteComment,
  } = usePostComments({
    isOpen,
    post,
    onCommentAdded,
  });

  if (!isOpen) return null;

  const authorName = post.author?.username || DEFAULT_MEMBER_NAME;
  const currentUserTint = getAuthorTint(currentUserName);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Bình luận bài viết của ${authorName}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[14px] border border-[#D8C8AA] bg-[#FAF5E6] shadow-2xl">
        {/* Header Modal */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#D8C8AA] bg-[#F1E6D0] px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#7A1F24]" />
            <h3 className="font-serif text-[17px] font-bold text-[#14233F]">
              Bài viết của {authorName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ bình luận"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#6E5D4B] transition-colors hover:bg-[#E5DAC4] hover:text-[#14233F]"
          >
            <X size={18} />
          </button>
        </header>

        {/* Nội dung cuộn: Tóm tắt bài viết + Danh sách bình luận */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
          <PostSummaryPane
            post={post}
            totalCommentCount={totalCommentCount}
            onClose={onClose}
            onFocusInput={() => inputRef.current?.focus()}
            onLikeUpdate={onLikeUpdate}
            onBookmarkUpdate={onBookmarkUpdate}
          />

          {/* Dải tiêu đề khu vực bình luận & bộ lọc sắp xếp */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-[6px] bg-[#F1E6D0] px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-[#7A1F24]" />
              <span className="text-[14px] font-bold text-[#14233F]">
                Các bình luận trước đó ({totalCommentCount})
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[12px]">
              <span className="text-[#6E5D4B]">Hiển thị:</span>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSortOrder(opt.key)}
                  className={`rounded-[5px] px-2.5 py-1 font-semibold transition-colors ${
                    sortOrder === opt.key
                      ? 'bg-[#E5DAC4] text-[#14233F]'
                      : 'text-[#6E5D4B] hover:bg-[#FAF5E6] hover:text-[#14233F]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Danh sách bình luận */}
          <div className="mt-4 space-y-4 pb-2">
            {isLoadingComments ? (
              <div className="space-y-3 py-4">
                {[1, 2].map((skeleton) => (
                  <div key={skeleton} className="flex items-start gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-[#E5DAC4]" />
                    <div className="h-16 flex-1 rounded-[12px] bg-[#EFE5D2]" />
                  </div>
                ))}
              </div>
            ) : sortedComments.length === 0 ? (
              <div className="rounded-[8px] border border-dashed border-[#D8C8AA] bg-[#FDF9F0] p-6 text-center text-[14px] text-[#6E5D4B]">
                Chưa có bình luận nào. Hãy mở đầu cuộc thảo luận về chủ đề này!
              </div>
            ) : (
              sortedComments.map((comment) => (
                <CommentItemRow
                  key={comment.id}
                  item={comment}
                  currentUserId={currentUserId}
                  editingId={editingId}
                  editingText={editingText}
                  setEditingId={setEditingId}
                  setEditingText={setEditingText}
                  onSaveEdit={handleSaveEdit}
                  onDeleteComment={handleDeleteComment}
                  onToggleLikeComment={handleToggleLikeComment}
                  onSelectReply={handleSelectReply}
                />
              ))
            )}
            <div ref={commentsEndRef} />
          </div>
        </div>

        {/* Thanh nhập bình luận cố định ở đáy Popup */}
        <CommentComposerBar
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          currentUserName={currentUserName}
          currentUserTint={currentUserTint}
          composerText={composerText}
          onComposerTextChange={setComposerText}
          onSubmit={handleSubmitComment}
          inputRef={inputRef}
        />
      </div>
    </div>
  );
}

// --- comment-modal.types.ts ---
export interface CommunityCommentItem {
  id: string;
  authorId?: string;
  authorName: string;
  authorBadge?: string;
  content: string;
  createdAt: string;
  likes: number;
  likedByMe?: boolean;
  replies: CommunityCommentItem[];
}

export interface ModalCommentItem {
  id: string;
  authorName: string;
  content?: string;
}

export enum CommentSocketAction {
  DELETED = 'deleted',
  LIKED = 'liked',
  UPDATED = 'updated',
}

export interface PostCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: CommunityPost;
  onLikeUpdate?: (postId: string, liked: boolean, likeCount: number) => void;
  onBookmarkUpdate?: (postId: string, bookmarked: boolean) => void;
  onCommentAdded?: (
    postId: string,
    totalComments: number,
    latestComment?: { id: string; authorName: string; content: string; createdAt: string },
  ) => void;
}

// --- comment-tree.util.ts ---
export function formatVietnameseRelativeTime(iso?: string | null): string {
  if (!iso) return 'Vừa xong';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMin = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays <= 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function mapBackendCommentsToTree(
  rawComments: Array<{
    id: string;
    parentId?: string | null;
    authorId?: string;
    author?: { id?: string; username?: string };
    authorName?: string;
    content: string;
    createdAt?: string;
    likesCount?: number;
    likes?: number;
  }>,
): CommunityCommentItem[] {
  const map = new Map<string, CommunityCommentItem>();
  const roots: CommunityCommentItem[] = [];

  rawComments.forEach((c) => {
    map.set(c.id, {
      id: c.id,
      authorId: c.author?.id || c.authorId,
      authorName: c.author?.username || c.authorName || DEFAULT_MEMBER_NAME,
      content: c.content,
      createdAt: c.createdAt || new Date().toISOString(),
      likes: c.likesCount ?? c.likes ?? 0,
      likedByMe: false,
      replies: [],
    });
  });

  rawComments.forEach((c) => {
    const node = map.get(c.id);
    if (!node) return;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function countAllCommentsInTree(items: CommunityCommentItem[]): number {
  return items.reduce(
    (sum, item) => sum + 1 + countAllCommentsInTree(item.replies || []),
    0,
  );
}

// --- CommentComposerBar.tsx ---
export interface CommentComposerBarProps {
  replyingTo: { commentId: string; authorName: string } | null;
  onCancelReply: () => void;
  currentUserName: string;
  currentUserTint: { bg: string; ink: string };
  composerText: string;
  onComposerTextChange: (val: string) => void;
  onSubmit: () => Promise<void> | void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const CommentComposerBar: React.FC<CommentComposerBarProps> = ({
  replyingTo,
  onCancelReply,
  currentUserName,
  currentUserTint,
  composerText,
  onComposerTextChange,
  onSubmit,
  inputRef,
}) => {
  return (
    <footer className="shrink-0 bg-[#F1E6D0] px-4 py-3 md:px-6">
      {replyingTo ? (
        <div className="mb-2 flex items-center justify-between rounded-[6px] border border-[#D8C8AA] bg-[#FAF5E6] px-3 py-1.5 text-[12px] text-[#5C4E3C]">
          <span className="inline-flex items-center gap-1.5">
            <CornerDownRight size={13} className="text-[#7A1F24]" />
            <span>
              Đang phản hồi bình luận của{' '}
              <strong className="text-[#14233F]">{replyingTo.authorName}</strong>
            </span>
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="font-semibold text-[#7A1F24] hover:underline"
          >
            Hủy
          </button>
        </div>
      ) : null}

      <div className="flex items-end gap-3">
        <div
          style={{ backgroundColor: currentUserTint.bg, color: currentUserTint.ink }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
        >
          {getInitials(currentUserName)}
        </div>

        <div className="flex flex-1 items-end gap-2 rounded-[18px] border border-[#D8C8AA] bg-[#FDF9F0] px-3.5 py-2 focus-within:border-[#8A5A19]">
          <textarea
            ref={inputRef}
            rows={1}
            value={composerText}
            onChange={(e) => onComposerTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === KEYBOARD_KEYS.ENTER && !e.shiftKey) {
                e.preventDefault();
                void onSubmit();
              }
            }}
            placeholder={
              replyingTo
                ? `Viết phản hồi gửi tới ${replyingTo.authorName}...`
                : `Viết bình luận dưới tên ${currentUserName}... (Nhấn Enter để gửi)`
            }
            aria-label="Nhập nội dung bình luận"
            className="max-h-28 min-h-[24px] flex-1 resize-none bg-transparent text-[14px] leading-relaxed text-[#14233F] placeholder:text-[#8A7963] outline-none"
          />
          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={!composerText.trim()}
            aria-label="Gửi bình luận"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7A1F24] text-[#FAF5E6] transition-opacity hover:bg-[#651A1E] disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </footer>
  );
};

// --- CommentItemRow.tsx ---
const GUEST_USER_ID = 'guest-user';

interface CommentItemRowProps {
  item: CommunityCommentItem;
  isReply?: boolean;
  parentId?: string;
  currentUserId: string;
  editingId: string | null;
  editingText: string;
  setEditingId: (id: string | null) => void;
  setEditingText: (text: string) => void;
  onSaveEdit: (id: string) => void;
  onDeleteComment: (id: string) => void;
  onToggleLikeComment: (id: string) => void;
  onSelectReply: (commentId: string, authorName: string) => void;
}

export function CommentItemRow({
  item,
  isReply = false,
  parentId,
  currentUserId,
  editingId,
  editingText,
  setEditingId,
  setEditingText,
  onSaveEdit,
  onDeleteComment,
  onToggleLikeComment,
  onSelectReply,
}: CommentItemRowProps) {
  const tint = getAuthorTint(item.authorName);
  const isEditing = editingId === item.id;
  const isMine =
    (item.authorId && item.authorId === currentUserId) ||
    item.authorId === GUEST_USER_ID ||
    item.id.startsWith('local-');

  return (
    <div key={item.id} className="group/item flex items-start gap-2.5 sm:gap-3">
      <div
        style={{ backgroundColor: tint.bg, color: tint.ink }}
        className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${
          isReply ? 'h-8 w-8 text-[12px]' : 'h-9 w-9 text-[13px]'
        }`}
      >
        {getInitials(item.authorName)}
      </div>

      <div className="min-w-0 flex-1">
        {/* Bong bóng bình luận kiểu Facebook trên nền giấy dó ấm */}
        <div className="relative inline-block max-w-full rounded-[14px] border border-[#E2D5BC] bg-[#F2E8D5] px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-bold text-[#14233F]">
              {item.authorName}
            </span>
            {item.authorBadge ? (
              <span
                className={`rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold ${
                  item.authorBadge === 'Tác giả'
                    ? 'bg-[#7A1F24]/12 text-[#7A1F24]'
                    : 'bg-[#E5DAC4] text-[#5C4E3C]'
                }`}
              >
                {item.authorBadge}
              </span>
            ) : null}
          </div>

          {isEditing ? (
            <div className="mt-2 min-w-[260px] space-y-2 sm:min-w-[380px]">
              <textarea
                rows={2}
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                className="w-full rounded-[8px] border border-[#D8C8AA] bg-[#FDF9F0] px-3 py-2 text-[14px] text-[#14233F] outline-none focus:border-[#8A5A19]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setEditingText('');
                  }}
                  className="rounded-[5px] px-2.5 py-1 text-[12px] font-medium text-[#6E5D4B] hover:text-[#14233F]"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => onSaveEdit(item.id)}
                  className="rounded-[5px] bg-[#7A1F24] px-3 py-1 text-[12px] font-semibold text-[#FAF5E6] hover:bg-[#651A1E]"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1 whitespace-pre-line break-words text-[14px] leading-[1.6] text-[#2B241D]">
              {item.content}
            </p>
          )}

          {/* Huy hiệu lượt thích nổi ở góc phải dưới bong bóng giống Facebook */}
          {item.likes > 0 && !isEditing ? (
            <button
              type="button"
              onClick={() => onToggleLikeComment(item.id)}
              className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-[#D8C8AA] bg-[#FDF9F0] px-2 py-0.5 text-[11px] font-semibold text-[#7A1F24] tabular-nums"
            >
              <Heart size={11} className="fill-[#7A1F24] text-[#7A1F24]" />
              <span>{item.likes}</span>
            </button>
          ) : null}
        </div>

        {/* Thanh tác vụ dưới bong bóng: Thích · Phản hồi · Sửa · Xóa · Thời gian */}
        <div className="mt-1 flex flex-wrap items-center gap-3.5 pl-2 text-[12px]">
          <button
            type="button"
            onClick={() => onToggleLikeComment(item.id)}
            className={`font-semibold transition-colors ${
              item.likedByMe
                ? 'text-[#7A1F24]'
                : 'text-[#6E5D4B] hover:text-[#14233F] hover:underline'
            }`}
          >
            {item.likedByMe ? 'Đã thích' : 'Thích'}
          </button>

          <button
            type="button"
            onClick={() =>
              onSelectReply(parentId || item.id, item.authorName)
            }
            className="font-semibold text-[#6E5D4B] transition-colors hover:text-[#14233F] hover:underline"
          >
            Phản hồi
          </button>

          {isMine && !isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditingId(item.id);
                  setEditingText(item.content);
                }}
                className="inline-flex items-center gap-1 font-medium text-[#6E5D4B] hover:text-[#14233F]"
              >
                <Edit3 size={11} />
                <span>Sửa</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteComment(item.id)}
                className="inline-flex items-center gap-1 font-medium text-[#7A1F24]/80 hover:text-[#7A1F24]"
              >
                <Trash2 size={11} />
                <span>Xóa</span>
              </button>
            </>
          ) : null}

          <span className="text-[#8A7963]">
            {formatVietnameseRelativeTime(item.createdAt)}
          </span>
        </div>

        {/* Danh sách phản hồi lồng bên trong */}
        {item.replies && item.replies.length > 0 ? (
          <div className="mt-3 space-y-3 border-l-2 border-[#DFD1B8] pl-3.5 sm:pl-4">
            {item.replies.map((reply) => (
              <CommentItemRow
                key={reply.id}
                item={reply}
                isReply={true}
                parentId={parentId || item.id}
                currentUserId={currentUserId}
                editingId={editingId}
                editingText={editingText}
                setEditingId={setEditingId}
                setEditingText={setEditingText}
                onSaveEdit={onSaveEdit}
                onDeleteComment={onDeleteComment}
                onToggleLikeComment={onToggleLikeComment}
                onSelectReply={onSelectReply}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// --- PostSummaryPane.tsx ---
interface SharedBlogPreviewCardProps {
  sharedBlog: NonNullable<ReturnType<typeof extractCommunityContent>['sharedBlog']>;
  onClose: () => void;
}

function SharedBlogPreviewCard({ sharedBlog, onClose }: SharedBlogPreviewCardProps) {
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
  );
}

function PrimaryImageFigure({
  primaryImage,
  primaryCaption,
  postTitle,
}: {
  primaryImage: string;
  primaryCaption?: string | null;
  postTitle: string;
}) {
  const [imgError, setImgError] = useState(false);
  if (imgError) return null;

  return (
    <figure className="mt-3.5 overflow-hidden rounded-[8px] border border-[#E5DAC4] bg-[#F2E8D5]">
      <Image
        src={primaryImage}
        alt={primaryCaption || postTitle}
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
  );
}

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
  const authorName = post.author?.username || DEFAULT_MEMBER_NAME;
  const authorTint = getAuthorTint(authorName);
  const parsed = extractCommunityContent(post);
  const sharedBlog = parsed.sharedBlog ?? null;

  const rawPrimaryImage = !sharedBlog
    ? post.coverImageUrl || parsed.images[0]?.url || null
    : null;
  const primaryImage =
    rawPrimaryImage && !rawPrimaryImage.includes('cld-sample-6.jpg')
      ? rawPrimaryImage
      : null;
  const primaryCaption = parsed.images[0]?.caption;

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
        <SharedBlogPreviewCard sharedBlog={sharedBlog} onClose={onClose} />
      ) : null}

      {/* Ảnh đính kèm bài ngắn nếu có */}
      {primaryImage ? (
        <PrimaryImageFigure
          primaryImage={primaryImage}
          primaryCaption={primaryCaption}
          postTitle={post.title}
        />
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
