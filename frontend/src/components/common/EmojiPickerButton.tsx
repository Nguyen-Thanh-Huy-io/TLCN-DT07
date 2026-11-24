'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, Lightbulb, SmilePlus } from 'lucide-react';
import { EmojiStyle, type EmojiClickData } from 'emoji-picker-react';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => (
    <div className="h-[340px] w-[296px] grid place-items-center text-xs text-slate-400">
      Đang tải biểu tượng...
    </div>
  ),
});

interface EmojiPickerButtonProps {
  value?: string;
  displayEmoji?: string;
  placeholder?: string;
  triggerLabel?: string;
  allowClear?: boolean;
  allowResetDefault?: boolean;
  align?: 'left' | 'right';
  ariaLabel?: string;
  onChange: (emoji: string | undefined) => void;
}

const ALIGN_CLASS_MAP: Record<'left' | 'right', string> = {
  left: 'left-0',
  right: 'right-0',
};

export function EmojiPickerButton({
  value,
  displayEmoji,
  placeholder = 'Chọn',
  triggerLabel,
  allowClear = true,
  allowResetDefault = false,
  align = 'right',
  ariaLabel = 'Mở thư viện chọn biểu tượng',
  onChange,
}: EmojiPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const visibleEmoji = displayEmoji !== undefined ? displayEmoji : value?.trim() || '';
  const alignCls = ALIGN_CLASS_MAP[align];

  const handleSelect = (emojiData: EmojiClickData) => {
    onChange(emojiData.emoji);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition cursor-pointer shadow-2xs"
      >
        {visibleEmoji ? (
          <span className="text-sm leading-none">{visibleEmoji}</span>
        ) : (
          <SmilePlus className="w-3.5 h-3.5 text-slate-400" />
        )}
        <span className={visibleEmoji ? 'text-slate-700' : 'text-slate-400'}>
          {triggerLabel ?? (visibleEmoji ? 'Đổi' : placeholder)}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Thư viện biểu tượng"
          className={`absolute ${alignCls} top-full mt-1.5 z-50 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden`}
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50/70">
            <span className="text-[11px] font-semibold text-slate-600">Thư viện biểu tượng</span>
            <div className="flex items-center gap-1.5">
              {allowClear && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setOpen(false);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                    value === ''
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Ẩn
                </button>
              )}
              {allowResetDefault && value !== undefined && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(undefined);
                    setOpen(false);
                  }}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Mặc định
                </button>
              )}
            </div>
          </div>

          <EmojiPicker
            emojiStyle={EmojiStyle.NATIVE}
            lazyLoadEmojis={true}
            skinTonesDisabled={true}
            searchPlaceholder="Tìm biểu tượng..."
            previewConfig={{ showPreview: false }}
            width={296}
            height={340}
            onEmojiClick={handleSelect}
          />
        </div>
      )}
    </div>
  );
}

// === Merged from CollapsibleExplanationField.tsx ===
export interface CollapsibleExplanationFieldProps {
  value?: string;
  onChange: (val: string) => void;
  buttonLabel?: string;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  minRows?: number;
}

export function CollapsibleExplanationField({
  value = '',
  onChange,
  buttonLabel = '+ Thêm giải thích chung · Tuỳ chọn',
  title = 'Giải thích chung / Kiến thức lịch sử củng cố',
  subtitle = 'Hiển thị sau khi hoàn thành câu hỏi',
  placeholder = 'Nhập giải thích tổng quát cho câu hỏi: bối cảnh lịch sử, diễn biến chính, ý nghĩa hoặc nguồn tư liệu tham khảo...',
  minRows = 3,
}: CollapsibleExplanationFieldProps) {
  const [isOpen, setIsOpen] = useState<boolean>(Boolean(value && value.trim()));

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (value && value.trim()) {
        setIsOpen(true);
      }
    });
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
            Giải thích riêng cho đáp án {labelLetter} ·{' '}
            {isCorrect ? (
              <span className="text-emerald-600">Đáp án đúng</span>
            ) : (
              <span className="text-amber-600">Phương án sai / gây nhiễu</span>
            )}
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
              ? `Vì sao đáp án ${labelLetter} là chính xác: cơ sở lịch sử, bối cảnh...`
              : `Vì sao đáp án ${labelLetter} chưa chính xác: nhầm mốc thời gian, sự kiện...`
          }
          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 leading-relaxed resize-y"
        />
      </div>
    </div>
  );
}
