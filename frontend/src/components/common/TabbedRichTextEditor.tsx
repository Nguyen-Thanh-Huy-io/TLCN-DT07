'use client';
import React, { useState } from 'react';
import { TipTapContent } from '@/features/lessons/components/TipTapContent';

export interface RichTextTabItem {
  id: string;
  label: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export interface TabbedRichTextEditorProps {
  tabs: RichTextTabItem[];
  defaultActiveTabId?: string;
  compact?: boolean;
}

const TAB_INDICATOR_TITLE = 'Đã có nội dung';

function hasMeaningfulHtmlContent(html: string): boolean {
  if (!html) return false;
  return Boolean(html.replace(/<[^>]+>/g, '').trim()) || html.includes('<img');
}

/**
 * Component tái sử dụng chuẩn SOLID (OCP/SRP) cho khung Rich Text Editor đa Tab:
 * - Đặt thanh Tab chuyển đổi ngay trên đỉnh khung Editor.
 * - Bên dưới là thanh Toolbar chuẩn tmp.png ([Format v] | [B I U] | [•≡ 1. ❝] | [🔗 🖼] | [+]).
 * - Chỉ khởi tạo 1 vùng soạn thảo duy nhất hiển thị nội dung của tab đang chọn.
 * - Có thể tái sử dụng cho Sự kiện (Bối cảnh / Diễn biến / Kết quả), Nhân vật (Tiểu sử / Sự nghiệp / Đánh giá), Địa danh (Lịch sử / Kiến trúc / Giá trị)...
 */
export function TabbedRichTextEditor({
  tabs,
  defaultActiveTabId,
  compact = false,
}: TabbedRichTextEditorProps) {
  const [activeTabId, setActiveTabId] = useState<string>(
    defaultActiveTabId || tabs[0]?.id || '',
  );

  const currentTab =
    tabs.find((tab) => tab.id === activeTabId) || tabs[0] || null;

  if (!currentTab) {
    return null;
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
      {/* Thanh Tab chuyển đổi ngay trên đỉnh khung Editor */}
      {tabs.length > 1 && (
        <div className="flex items-center bg-slate-100 border-b border-slate-200 px-2 pt-2 gap-1.5 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = currentTab.id === tab.id;
            const filled = hasMeaningfulHtmlContent(tab.value);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className={`px-3.5 py-2 rounded-t-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer border-t border-x ${
                  isActive
                    ? 'bg-white text-slate-900 border-slate-200 -mb-px pb-[9px] shadow-2xs'
                    : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>{tab.label}</span>
                {filled && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
                    title={TAB_INDICATOR_TITLE}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Khung Editor duy nhất render nội dung của tab đang chọn */}
      <TipTapContent
        key={currentTab.id}
        label={tabs.length === 1 ? currentTab.label : undefined}
        compact={compact}
        value={currentTab.value}
        onChange={currentTab.onChange}
        placeholder={currentTab.placeholder}
      />
    </div>
  );
}
