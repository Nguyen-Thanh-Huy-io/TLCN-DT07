'use client';

import React from 'react';
import {
  CalloutBlockData,
  HeadingBlockData,
  LessonBlockItem,
  QuoteBlockData,
  RelatedEventsBlockData,
  RelatedPeopleBlockData,
} from '../../../types/block-builder.types';

interface SimpleInspectorProps<T extends LessonBlockItem> {
  block: T;
  onUpdateBlock: (id: string, updates: Partial<LessonBlockItem>) => void;
}

export function HeadingBlockInspector({
  block: heading,
  onUpdateBlock,
}: SimpleInspectorProps<HeadingBlockData>) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-stone-800 mb-1.5">
          Nội dung tiêu đề
        </label>
        <input
          type="text"
          value={heading.text || ''}
          onChange={(e) => onUpdateBlock(heading.id, { text: e.target.value })}
          className="w-full text-sm font-semibold px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-stone-800 mb-1.5">
          Cấp độ tiêu đề
        </label>
        <div className="grid grid-cols-4 gap-2">
          {([1, 2, 3, 4] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onUpdateBlock(heading.id, { level: lvl })}
              className={`py-2 text-sm font-bold rounded-lg border transition-colors cursor-pointer ${
                heading.level === lvl
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50'
              }`}
            >
              Cấp {lvl}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CalloutBlockInspector({
  block: callout,
  onUpdateBlock,
}: SimpleInspectorProps<CalloutBlockData>) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-stone-800 mb-1.5">
          Tiêu đề ghi chú
        </label>
        <input
          type="text"
          value={callout.title || ''}
          onChange={(e) => onUpdateBlock(callout.id, { title: e.target.value })}
          className="w-full text-sm font-semibold px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-stone-800 mb-1.5">
          Sắc thái hộp thoại
        </label>
        <select
          value={callout.variant}
          onChange={(e) =>
            onUpdateBlock(callout.id, {
              variant: e.target.value as CalloutBlockData['variant'],
            })
          }
          className="w-full text-sm font-medium px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 cursor-pointer"
        >
          <option value="HISTORICAL_NOTE">Góc nhìn Sử gia (Vàng)</option>
          <option value="INFO">Bối cảnh lịch sử (Xanh dương)</option>
          <option value="WARNING">Nghi vấn & Tranh cãi (Đỏ)</option>
          <option value="SUCCESS">Bài học thời đại (Xanh lá)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-stone-800 mb-1.5">
          Nội dung chi tiết
        </label>
        <textarea
          rows={4}
          value={callout.content || ''}
          onChange={(e) =>
            onUpdateBlock(callout.id, { content: e.target.value })
          }
          className="w-full text-sm p-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 leading-relaxed text-stone-800"
        />
      </div>
    </div>
  );
}

export function QuoteBlockInspector({
  block: quote,
  onUpdateBlock,
}: SimpleInspectorProps<QuoteBlockData>) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-stone-800 mb-1.5">
          Lời trích dẫn / Danh ngôn
        </label>
        <textarea
          rows={3}
          value={quote.quoteText || ''}
          onChange={(e) =>
            onUpdateBlock(quote.id, { quoteText: e.target.value })
          }
          className="w-full text-sm italic font-serif p-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-stone-800 mb-1.5">
          Tác giả phát ngôn
        </label>
        <input
          type="text"
          value={quote.author || ''}
          onChange={(e) => onUpdateBlock(quote.id, { author: e.target.value })}
          placeholder="VD: Hưng Đạo Đại Vương"
          className="w-full text-sm px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-stone-800 mb-1.5">
          Bối cảnh lịch sử
        </label>
        <input
          type="text"
          value={quote.sourceContext || ''}
          onChange={(e) =>
            onUpdateBlock(quote.id, { sourceContext: e.target.value })
          }
          placeholder="VD: Hội nghị Diên Hồng (1284)"
          className="w-full text-sm px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
        />
      </div>
    </div>
  );
}

export function RelatedPeopleBlockInspector({
  block: rel,
  onUpdateBlock,
}: SimpleInspectorProps<RelatedPeopleBlockData>) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-stone-800 mb-1.5">
          Tiêu đề khối
        </label>
        <input
          type="text"
          value={rel.title || ''}
          onChange={(e) => onUpdateBlock(rel.id, { title: e.target.value })}
          className="w-full text-sm font-semibold px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-stone-800 mb-1.5">
          Nguồn nội dung
        </label>
        <select
          value={rel.sourceMode || 'AUTO'}
          onChange={(e) =>
            onUpdateBlock(rel.id, {
              sourceMode: e.target.value as RelatedPeopleBlockData['sourceMode'],
            })
          }
          className="w-full text-sm font-medium px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 cursor-pointer"
        >
          <option value="AUTO">Tự động lấy từ Đồ thị tri thức</option>
          <option value="MANUAL">Nội dung nhập thủ công</option>
        </select>
      </div>
    </div>
  );
}

export function RelatedEventsBlockInspector({
  block: rel,
  onUpdateBlock,
}: SimpleInspectorProps<RelatedEventsBlockData>) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-stone-800 mb-1.5">
          Tiêu đề khối
        </label>
        <input
          type="text"
          value={rel.title || ''}
          onChange={(e) => onUpdateBlock(rel.id, { title: e.target.value })}
          className="w-full text-sm font-semibold px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-stone-800 mb-1.5">
          Mô tả ngắn (tùy chọn)
        </label>
        <input
          type="text"
          value={rel.description || ''}
          onChange={(e) => onUpdateBlock(rel.id, { description: e.target.value })}
          className="w-full text-sm px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-stone-800 mb-1.5">
          Nguồn nội dung
        </label>
        <select
          value={rel.sourceMode || 'AUTO'}
          onChange={(e) =>
            onUpdateBlock(rel.id, {
              sourceMode: e.target.value as RelatedEventsBlockData['sourceMode'],
            })
          }
          className="w-full text-sm font-medium px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 cursor-pointer"
        >
          <option value="AUTO">Tự động lấy từ Đồ thị tri thức</option>
          <option value="MANUAL">Nội dung nhập thủ công</option>
        </select>
      </div>
    </div>
  );
}
