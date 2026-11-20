'use client';

import React from 'react';
import { TipTapContent } from '../TipTapContent';
import { MapBlockData, QuoteBlockData, CalloutBlockData, CalloutVariant, ComparisonTableBlockData, ComparisonTableRow } from '../../types/block-builder.types';

// --- TextBlockEditor.tsx ---
interface TextBlockEditorProps {
  content: string;
  onChange: (val: string) => void;
}

/**
 * Khối soạn thảo Văn bản (Rich Text Block) trên Canvas:
 * Giao diện tối giản, tập trung 100% vào nội dung (Distraction-free).
 * Toàn bộ công cụ định dạng Typography được điều khiển từ Cột Phải (Property Inspector).
 */
export function TextBlockEditor({ content, onChange }: TextBlockEditorProps) {
  return (
    <div className="w-full relative group/text-block" data-testid="text-block-editor">
      <TipTapContent
        value={content}
        onChange={onChange}
        compact={true}
        remoteToolbarOnly={true}
        placeholder="Nhập nội dung lịch sử tại đây..."
      />
    </div>
  );
}

// --- MapBlockItemEditor.tsx ---
interface MapBlockItemEditorProps {
  data: MapBlockData;
  onChange: (updates: Partial<MapBlockData>) => void;
}

/**
 * Editor cho khối "Bản đồ" — mô tả địa bàn/địa điểm lịch sử gắn với bài học.
 * Hiện chỉ lưu tên địa danh + mô tả dạng text (chưa tích hợp bản đồ tương tác thật),
 * đủ để hiển thị dạng chú dẫn (xem `LessonBlockRegistry.blockToHtml` case MAP).
 */
export function MapBlockItemEditor({ data, onChange }: MapBlockItemEditorProps) {
  return (
    <div className="space-y-2" data-testid="map-block-editor">
      <div>
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
          Tên địa danh
        </label>
        <input
          type="text"
          value={data.locationName}
          onChange={(e) => onChange({ locationName: e.target.value })}
          placeholder="Ví dụ: Lòng chảo Điện Biên Phủ..."
          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
          Mô tả địa bàn
        </label>
        <textarea
          rows={3}
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Mô tả vị trí địa lý, vai trò chiến lược, đặc điểm địa hình..."
          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
    </div>
  );
}

// --- QuoteBlockItemEditor.tsx ---
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

// --- CalloutBlockItemEditor.tsx ---
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

// --- ComparisonTableBlockItemEditor.tsx ---
interface ComparisonTableBlockItemEditorProps {
  data: ComparisonTableBlockData;
  onChange: (updates: Partial<ComparisonTableBlockData>) => void;
}

/**
 * Editor cho khối "Bảng so sánh" — so sánh 2 đối tượng/phe/giai đoạn theo từng tiêu chí.
 * Cho phép đổi tên 2 cột, thêm/xóa/sửa từng dòng tiêu chí.
 */
export function ComparisonTableBlockItemEditor({ data, onChange }: ComparisonTableBlockItemEditorProps) {
  const updateRow = (idx: number, updates: Partial<ComparisonTableRow>) => {
    const rows = data.rows.map((row, i) => (i === idx ? { ...row, ...updates } : row));
    onChange({ rows });
  };

  const addRow = () => {
    onChange({
      rows: [...data.rows, { criteria: 'Tiêu chí mới', colA: '', colB: '' }],
    });
  };

  const removeRow = (idx: number) => {
    if (data.rows.length <= 1) {
      alert('Bảng so sánh cần có ít nhất một dòng tiêu chí.');
      return;
    }
    onChange({ rows: data.rows.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-2.5" data-testid="comparison-table-block-editor">
      <input
        type="text"
        value={data.title || ''}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Tiêu đề bảng so sánh (tùy chọn)..."
        className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={data.colAName}
          onChange={(e) => onChange({ colAName: e.target.value })}
          placeholder="Tên cột A..."
          className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="text"
          value={data.colBName}
          onChange={(e) => onChange({ colBName: e.target.value })}
          placeholder="Tên cột B..."
          className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        {data.rows.map((row, idx) => (
          <div
            key={idx}
            data-testid={`comparison-row-${idx}`}
            className="p-2 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1"
          >
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={row.criteria}
                onChange={(e) => updateRow(idx, { criteria: e.target.value })}
                placeholder="Tiêu chí..."
                className="flex-1 min-w-0 text-xs font-semibold p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
              <button
                type="button"
                onClick={() => removeRow(idx)}
                title="Xóa dòng"
                className="text-slate-400 hover:text-rose-600 cursor-pointer shrink-0 px-1"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                value={row.colA}
                onChange={(e) => updateRow(idx, { colA: e.target.value })}
                placeholder="Nội dung cột A..."
                className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
              <input
                type="text"
                value={row.colB}
                onChange={(e) => updateRow(idx, { colB: e.target.value })}
                placeholder="Nội dung cột B..."
                className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="w-full text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-dashed border-blue-300 rounded-lg py-1.5 cursor-pointer transition"
      >
        + Thêm dòng tiêu chí
      </button>
    </div>
  );
}
