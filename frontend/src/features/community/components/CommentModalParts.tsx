'use client';

import React from 'react';
import { CornerDownRight, Send, Edit3, Heart, Trash2 } from 'lucide-react';
import { getAuthorTint, getInitials } from '../utils/community-feed.helper';
import { KEYBOARD_KEYS } from '@/constants/enums';

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
export const GUEST_USER_ID = 'guest-user';

export interface CommentItemRowProps {
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
