'use client';

import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { CommunityApi } from '../api';

const REPORT_REASONS = [
  {
    id: 'HISTORICAL_REVISIONISM',
    label: 'Xuyên tạc lịch sử hoặc phủ nhận chủ quyền quốc gia',
    desc: 'Thông tin sai lệch nghiêm trọng về sự kiện, nhân vật lịch sử hoặc chủ quyền Hoàng Sa, Trường Sa.',
  },
  {
    id: 'PROFANITY',
    label: 'Ngôn từ xúc phạm, công kích cá nhân',
    desc: 'Chửi bới, hạ thấp danh dự thành viên hoặc sử dụng từ ngữ thiếu văn minh.',
  },
  {
    id: 'REGIONAL_DISCRIMINATION',
    label: 'Phân biệt vùng miền, chia rẽ khối đoàn kết',
    desc: 'Nội dung kích động kỳ thị vùng miền, dân tộc hoặc tôn giáo.',
  },
  {
    id: 'SPAM',
    label: 'Quảng cáo rác, đường dẫn lừa đảo',
    desc: 'Nội dung lặp lại vô nghĩa, quảng cáo thương mại hoặc liên kết độc hại.',
  },
] as const;

interface ReportDialogProps {
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
