'use client';

import React from 'react';
import { CalloutBlockData, CalloutVariant } from '../../types/block-builder.types';

interface CalloutBlockItemEditorProps {
  data: CalloutBlockData;
  onChange: (updates: Partial<CalloutBlockData>) => void;
}

const CALLOUT_VARIANTS: Array<{
  variant: CalloutVariant;
  label: string;
  icon: string;
  bgClass: string;
  borderClass: string;
  titleClass: string;
}> = [
  {
    variant: 'HISTORICAL_NOTE',
    label: 'Góc nhìn Sử gia / Lưu ý',
    icon: '📜',
    bgClass: 'bg-amber-50/80',
    borderClass: 'border-amber-300',
    titleClass: 'text-amber-900',
  },
  {
    variant: 'INFO',
    label: 'Bối cảnh / Thông tin thêm',
    icon: '💡',
    bgClass: 'bg-blue-50/80',
    borderClass: 'border-blue-300',
    titleClass: 'text-blue-900',
  },
  {
    variant: 'WARNING',
    label: 'Tranh cãi / Nghi vấn lịch sử',
    icon: '⚠️',
    bgClass: 'bg-rose-50/80',
    borderClass: 'border-rose-300',
    titleClass: 'text-rose-900',
  },
  {
    variant: 'SUCCESS',
    label: 'Bài học & Ý nghĩa thời đại',
    icon: '✨',
    bgClass: 'bg-emerald-50/80',
    borderClass: 'border-emerald-300',
    titleClass: 'text-emerald-900',
  },
];

export function CalloutBlockItemEditor({ data, onChange }: CalloutBlockItemEditorProps) {
  const currentVariant = CALLOUT_VARIANTS.find((v) => v.variant === data.variant) || CALLOUT_VARIANTS[0];

  return (
    <div className={`p-4 rounded-xl border ${currentVariant.borderClass} ${currentVariant.bgClass} space-y-3 transition-colors`}>
      {/* Thanh chọn Variant */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">{currentVariant.icon}</span>
          <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
            Hộp ghi chú (Callout)
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {CALLOUT_VARIANTS.map((v) => (
            <button
              key={v.variant}
              type="button"
              onClick={() => onChange({ variant: v.variant })}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer border ${
                data.variant === v.variant
                  ? 'bg-white shadow-2xs border-slate-300 text-slate-900'
                  : 'bg-black/5 border-transparent text-slate-600 hover:bg-black/10'
              }`}
            >
              <span>{v.icon}</span> <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ô tiêu đề Callout */}
      <div>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Tiêu đề hộp ghi chú (Ví dụ: Góc nhìn sử học về chiến thuật...)"
          className={`w-full text-xs sm:text-sm font-bold bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200/80 focus:bg-white focus:outline-none focus:border-slate-400 ${currentVariant.titleClass}`}
        />
      </div>

      {/* Nội dung diễn giải Callout */}
      <div>
        <textarea
          rows={3}
          value={data.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Nhập nội dung lưu ý, đánh giá bối cảnh lịch sử hoặc phân tích sâu tại đây..."
          className="w-full text-xs p-3 bg-white/90 rounded-lg border border-slate-200/80 focus:bg-white focus:outline-none focus:border-slate-400 text-slate-700 leading-relaxed"
        />
      </div>
    </div>
  );
}
