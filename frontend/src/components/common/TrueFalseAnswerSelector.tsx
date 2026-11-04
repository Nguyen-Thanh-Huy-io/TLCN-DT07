'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

export interface TrueFalseAnswerSelectorProps {
  value: boolean;
  onChange: (nextValue: boolean) => void;
  compact?: boolean;
}

/**
 * Component chọn đáp án Đúng / Sai (True / False) tái sử dụng dùng chung
 * cho cả Ngân hàng câu hỏi (`QuestionBankModal`) và Trình soạn thảo Quiz bài học (`TrueFalseEditor`).
 */
export function TrueFalseAnswerSelector({
  value,
  onChange,
  compact = false,
}: TrueFalseAnswerSelectorProps) {
  const choices: Array<{
    boolVal: boolean;
    title: string;
    subtitle: string;
    activeCls: string;
    iconBgCls: string;
    badgeCls: string;
    Icon: typeof Check;
  }> = [
    {
      boolVal: true,
      title: 'Đúng (True)',
      subtitle: 'Mệnh đề lịch sử nêu trên là hoàn toàn chính xác',
      activeCls: 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs',
      iconBgCls: value === true ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400',
      badgeCls: 'bg-emerald-600 text-white',
      Icon: Check,
    },
    {
      boolVal: false,
      title: 'Sai (False)',
      subtitle: 'Mệnh đề lịch sử nêu trên có chi tiết chưa chính xác',
      activeCls: 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20 shadow-xs',
      iconBgCls: value === false ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400',
      badgeCls: 'bg-rose-600 text-white',
      Icon: X,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-bold text-slate-800">
          Đáp án đúng của mệnh đề <span className="text-blue-600 font-normal">(True / False)</span>
        </label>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
            value
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          <span>Đáp án đang chọn: {value ? '✓ Đúng (True)' : '✕ Sai (False)'}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {choices.map((item) => {
          const isSelected = value === item.boolVal;
          const IconComp = item.Icon;

          return (
            <button
              key={String(item.boolVal)}
              type="button"
              onClick={() => onChange(item.boolVal)}
              className={`relative flex items-center gap-3 text-left rounded-xl border transition-all cursor-pointer ${
                compact ? 'p-3' : 'p-4'
              } ${
                isSelected
                  ? item.activeCls
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${item.iconBgCls}`}
              >
                <IconComp size={18} strokeWidth={2.5} />
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{item.title}</span>
                  {isSelected && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeCls}`}
                    >
                      Correct
                    </span>
                  )}
                </div>
                {!compact && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{item.subtitle}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
