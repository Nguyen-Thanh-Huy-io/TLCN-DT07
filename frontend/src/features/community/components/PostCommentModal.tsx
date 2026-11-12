'use client';

import React from 'react';
import { MessageSquare, X } from 'lucide-react';
import { getAuthorTint } from '../utils/author-avatar.util';
import {
  CommentSortOrder,
  PostCommentModalProps,
  SortOrder,
} from './comment-modal/comment-modal.types';
import { usePostComments } from './comment-modal/usePostComments';
import { PostSummaryPane } from './comment-modal/PostSummaryPane';
import { CommentItemRow } from './comment-modal/CommentItemRow';
import { CommentComposerBar } from './comment-modal/CommentComposerBar';

export { countAllCommentsInTree } from './comment-modal/comment-tree.util';
export * from './comment-modal/comment-modal.types';

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

  const authorName = post.author?.username || 'Thành viên HISGO';
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
