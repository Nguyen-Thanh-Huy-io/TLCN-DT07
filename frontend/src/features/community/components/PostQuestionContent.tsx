'use client';

import React from 'react';

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
