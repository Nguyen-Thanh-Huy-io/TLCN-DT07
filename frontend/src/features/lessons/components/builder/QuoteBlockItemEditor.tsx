'use client';

import React from 'react';
import { QuoteBlockData } from '../../types/block-builder.types';

interface QuoteBlockItemEditorProps {
  data: QuoteBlockData;
  onChange: (updates: Partial<QuoteBlockData>) => void;
}

export function QuoteBlockItemEditor({ data, onChange }: QuoteBlockItemEditorProps) {
  return (
    <div className="p-4 sm:p-5 rounded-xl border border-amber-200/90 bg-amber-50/40 relative space-y-3.5">
      <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
          <span className="text-base leading-none">“</span>
          <span>Khối trích dẫn lịch sử (Quote)</span>
        </span>
        <span className="text-[11px] text-amber-800/70 font-serif italic">
          Lời hịch, sấm truyền, danh ngôn
        </span>
      </div>

      {/* Nội dung câu trích dẫn */}
      <div className="relative pl-3 border-l-4 border-amber-500">
        <textarea
          rows={3}
          value={data.quoteText}
          onChange={(e) => onChange({ quoteText: e.target.value })}
          placeholder="Nhập câu danh ngôn, lời thề, tuyên ngôn lịch sử... (Ví dụ: Đầu tôi chưa rơi xuống đất, xin bệ hạ đừng lo...)"
          className="w-full text-xs sm:text-sm font-serif italic p-3 bg-white border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500 text-slate-800 leading-relaxed shadow-2xs"
        />
      </div>

      {/* Người phát ngôn & Bối cảnh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Nhân vật / Tác giả phát ngôn <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={data.author}
            onChange={(e) => onChange({ author: e.target.value })}
            placeholder="Ví dụ: Thái sư Trần Thủ Độ, Lý Thường Kiệt..."
            className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Bối cảnh / Thời điểm / Tác phẩm
          </label>
          <input
            type="text"
            value={data.sourceContext || ''}
            onChange={(e) => onChange({ sourceContext: e.target.value })}
            placeholder="Ví dụ: Kháng chiến chống Nguyên Mông lần thứ nhất (1258)..."
            className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>
    </div>
  );
}
