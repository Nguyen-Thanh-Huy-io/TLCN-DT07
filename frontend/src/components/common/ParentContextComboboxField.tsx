'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';

export enum ParentContextCategory {
  PERIOD = 'PERIOD',
  STAGE = 'STAGE',
  CAMPAIGN = 'CAMPAIGN',
}

export interface ParentContextOption {
  key: string;
  label: string;
  subtitle?: string;
  category: ParentContextCategory;
  periodId: string | null;
  topicId: string | null;
}

export interface ParentContextComboboxFieldProps {
  label?: string;
  placeholder?: string;
  helperText?: string;
  options: ParentContextOption[];
  selectedKey: string;
  onSelect: (option: ParentContextOption | null) => void;
}

const CATEGORY_BADGE_CONFIG: Record<
  ParentContextCategory,
  { text: string; className: string }
> = {
  [ParentContextCategory.PERIOD]: {
    text: 'Thời kỳ',
    className: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  [ParentContextCategory.STAGE]: {
    text: 'Giai đoạn',
    className: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  [ParentContextCategory.CAMPAIGN]: {
    text: 'Chiến dịch',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
};

const DEFAULT_TEXTS = {
  LABEL: 'Sự kiện / giai đoạn cha',
  PLACEHOLDER: 'Tìm sự kiện hoặc giai đoạn...',
  ATTACHED_PREFIX: 'Đã gắn vào:',
  EMPTY_RESULT: 'Không tìm thấy thời kỳ, giai đoạn hoặc chiến dịch phù hợp',
  REMOVE_TITLE: 'Gỡ liên kết',
} as const;

/**
 * Component 1 Ô Duy Nhất dạng Searchable Combobox chuẩn SOLID:
 * - Gõ tìm nhanh theo tên Thời kỳ, Giai đoạn hoặc Chiến dịch.
 * - Danh sách gợi ý hiển thị kèm Tag phân loại nhỏ (Thời kỳ | Giai đoạn | Chiến dịch).
 * - Sau khi chọn: hiện thẻ gọn gàng `Đã gắn vào: [ Chiến dịch Hồ Chí Minh (1975) × ]`.
 */
export function ParentContextComboboxField({
  label = DEFAULT_TEXTS.LABEL,
  placeholder = DEFAULT_TEXTS.PLACEHOLDER,
  helperText,
  options,
  selectedKey,
  onSelect,
}: ParentContextComboboxFieldProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.key === selectedKey) || null,
    [options, selectedKey],
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((opt) => {
      if (!q) return true;
      const badgeText = CATEGORY_BADGE_CONFIG[opt.category].text.toLowerCase();
      return (
        opt.label.toLowerCase().includes(q) ||
        (opt.subtitle || '').toLowerCase().includes(q) ||
        badgeText.includes(q)
      );
    });
  }, [options, query]);

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <span className="text-xs font-semibold text-slate-700 block">
        {label}
      </span>

      {/* Ô tìm kiếm thông minh duy nhất */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full text-xs px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 transition"
        />

        {helperText && (
          <span className="text-[11px] text-slate-400 mt-1 block">
            {helperText}
          </span>
        )}

        {/* Danh sách gợi ý sổ xuống kèm Tag phân loại nhỏ */}
        {isOpen && (
          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-30 py-1 divide-y divide-slate-100">
            {suggestions.length === 0 ? (
              <div className="px-3.5 py-2.5 text-xs text-slate-400 italic">
                {DEFAULT_TEXTS.EMPTY_RESULT}
              </div>
            ) : (
              suggestions.slice(0, 20).map((item) => {
                const badge = CATEGORY_BADGE_CONFIG[item.category];
                const isCurrent = item.key === selectedKey;
                const fullText = `${item.label}${
                  item.subtitle ? ` (${item.subtitle})` : ''
                }`;
                return (
                  <button
                    key={item.key}
                    type="button"
                    title={fullText}
                    onClick={() => {
                      onSelect(item);
                      setQuery('');
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 transition flex items-center justify-between gap-3 text-xs cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-50/90 text-slate-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-800 block truncate">
                        {item.label}
                      </span>
                      {item.subtitle && (
                        <span className="text-[11px] text-slate-500 block truncate">
                          {item.subtitle}
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${badge.className}`}
                    >
                      {badge.text}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Sau khi chọn: Hiện thẻ đã chọn gọn gàng: Đã gắn vào: [ Chiến dịch Hồ Chí Minh (1975) × ] */}
      {selectedOption && (
        <div className="flex items-center flex-wrap gap-2 pt-0.5">
          <span className="text-[11px] font-medium text-slate-500">
            {DEFAULT_TEXTS.ATTACHED_PREFIX}
          </span>
          <span
            title={
              selectedOption.subtitle
                ? `${selectedOption.label} (${selectedOption.subtitle})`
                : selectedOption.label
            }
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-950 border border-amber-200 shadow-2xs"
          >
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                CATEGORY_BADGE_CONFIG[selectedOption.category].className
              }`}
            >
              {CATEGORY_BADGE_CONFIG[selectedOption.category].text}
            </span>
            <span>{selectedOption.label}</span>
            <button
              type="button"
              onClick={() => onSelect(null)}
              title={DEFAULT_TEXTS.REMOVE_TITLE}
              className="text-amber-700 hover:text-rose-600 font-bold leading-none cursor-pointer ml-0.5"
            >
              ×
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
