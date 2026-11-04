'use client';

import React, { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';

export interface CollapsibleExplanationFieldProps {
  value?: string;
  onChange: (val: string) => void;
  buttonLabel?: string;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  minRows?: number;
}

/**
 * Component dùng chung toàn hệ thống (Reusable Component) cho trường:
 * "Giải thích chung / Kiến thức củng cố sau khi trả lời"
 * - Tự động thu gọn thành nút nét đứt khi chưa có nội dung.
 * - Tự động bung mở khi đã có dữ liệu hoặc khi người dùng bấm thêm.
 * - Sử dụng textarea tự động giãn chiều cao (Auto-fit rows) theo độ dài văn bản.
 */
export function CollapsibleExplanationField({
  value = '',
  onChange,
  buttonLabel = '+ Thêm giải thích chung / Kiến thức củng cố sau khi trả lời (Optional)',
  title = 'Giải thích chung / Kiến thức lịch sử củng cố',
  subtitle = '(Hiển thị sau khi học sinh hoàn thành câu hỏi)',
  placeholder = 'Nhập giải thích tổng quát cho câu hỏi (bối cảnh lịch sử, diễn biến chính, ý nghĩa hoặc nguồn tư liệu tham khảo)...',
  minRows = 3,
}: CollapsibleExplanationFieldProps) {
  const [isOpen, setIsOpen] = useState<boolean>(Boolean(value && value.trim()));

  useEffect(() => {
    if (value && value.trim()) {
      setIsOpen(true);
    }
  }, [value]);

  const computedRows = Math.max(minRows, Math.ceil((value?.length || 0) / 85));

  if (!isOpen && !value?.trim()) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full py-2.5 px-4 border border-dashed border-amber-300 bg-amber-50/30 hover:bg-amber-50/70 rounded-xl text-xs font-semibold text-amber-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Lightbulb size={14} className="text-amber-600 shrink-0" />
        <span>{buttonLabel}</span>
      </button>
    );
  }

  return (
    <div className="p-3.5 rounded-xl border border-amber-200/90 bg-amber-50/40 space-y-2 transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
          <Lightbulb size={15} className="text-amber-600 shrink-0" />
          <span>
            {title}{' '}
            {subtitle && (
              <span className="font-normal text-amber-700/80">{subtitle}</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="text-[11px] text-rose-600 hover:text-rose-700 underline cursor-pointer"
            >
              Xóa giải thích
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Thu gọn
          </button>
        </div>
      </div>

      <textarea
        rows={computedRows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs sm:text-sm p-3 bg-white border border-amber-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 leading-relaxed resize-y"
      />
    </div>
  );
}

export interface OptionExplanationBoxProps {
  labelLetter: string;
  isCorrect: boolean;
  value?: string;
  onChange: (val: string) => void;
}

/**
 * Component dùng chung cho khung giải thích riêng của từng phương án lựa chọn (A, B, C, D)
 */
export function OptionExplanationBox({
  labelLetter,
  isCorrect,
  value = '',
  onChange,
}: OptionExplanationBoxProps) {
  const computedRows = Math.max(2, Math.ceil((value?.length || 0) / 80));

  return (
    <div className="mt-2.5 pt-2 border-t border-slate-100 pl-8 pr-1 flex items-start gap-2">
      <span className="text-amber-600 mt-1 shrink-0">
        <Lightbulb size={13} />
      </span>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700">
            Giải thích riêng khi học sinh chọn đáp án {labelLetter} (
            {isCorrect ? (
              <span className="text-emerald-600">Đáp án đúng</span>
            ) : (
              <span className="text-amber-600">Phương án sai / gây nhiễu</span>
            )}
            ):
          </span>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-[10px] text-rose-500 hover:text-rose-700 underline cursor-pointer"
            >
              Xóa ghi chú
            </button>
          )}
        </div>
        <textarea
          rows={computedRows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            isCorrect
              ? `Vì sao đáp án ${labelLetter} là chính xác (cơ sở lịch sử, bối cảnh)...`
              : `Vì sao học sinh chọn đáp án ${labelLetter} là sai (lỗi nhầm mốc thời gian, sự kiện)...`
          }
          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 leading-relaxed resize-y"
        />
      </div>
    </div>
  );
}
