'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, SmilePlus } from 'lucide-react';
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
