import React from 'react';
import { CornerDownRight, Send } from 'lucide-react';
import { KEYBOARD_KEYS } from '@/constants/enums';

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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
