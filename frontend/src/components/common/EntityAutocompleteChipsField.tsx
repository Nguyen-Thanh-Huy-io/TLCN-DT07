'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface AutocompleteEntityOption {
  id: string;
  name: string;
  type?: string;
  tagline?: string | null;
}

export interface EntityAutocompleteChipsFieldProps {
  label: string;
  subtitle?: string;
  placeholder: string;
  options: AutocompleteEntityOption[];
  selectedIds: string[];
  onToggleId: (id: string) => void;
  emptySuggestionText?: string;
}

const DEFAULT_TEXTS = {
  SELECTED_PREFIX: 'Đã chọn:',
  EMPTY_SUGGESTION: 'Không tìm thấy kết quả phù hợp',
  REMOVE_TITLE: 'Bỏ chọn',
} as const;

/**
 * Component tái sử dụng chuẩn SOLID (SRP/OCP) cho ô chọn thực thể dạng Autocomplete + Tag Chips:
 * - Gõ chữ nào gợi ý chữ đó ngay trong dropdown.
 * - Chọn nhiều kết quả liên tiếp với ít thao tác nhất.
 * - Chọn xong hiện thành các thẻ Tag (Chip) nhỏ gọn ngay dưới ô input:
 *   Đã chọn: [ Võ Bẩm × ] [ Hồ Chí Minh × ]
 */
export function EntityAutocompleteChipsField({
  label,
  subtitle,
  placeholder,
  options,
  selectedIds,
  onToggleId,
  emptySuggestionText = DEFAULT_TEXTS.EMPTY_SUGGESTION,
}: EntityAutocompleteChipsFieldProps) {
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

  const selectedItems = useMemo(
    () => options.filter((opt) => selectedIds.includes(opt.id)),
    [options, selectedIds],
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((opt) => {
      if (selectedIds.includes(opt.id)) return false;
      if (!q) return true;
      return (
        opt.name.toLowerCase().includes(q) ||
        (opt.tagline || '').toLowerCase().includes(q)
      );
    });
  }, [options, selectedIds, query]);

  return (
    <div className="space-y-2" ref={containerRef}>
      <div>
        <span className="text-xs font-bold text-slate-900 block">
          {label}
        </span>
        {subtitle && (
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {subtitle}
          </span>
        )}
      </div>

      {/* Ô tìm kiếm Autocomplete */}
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
          className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 transition"
        />

        {/* Dropdown gợi ý khi focus hoặc gõ chữ */}
        {isOpen && (
          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-30 py-1">
            {suggestions.length === 0 ? (
              <div className="px-3.5 py-2 text-xs text-slate-400 italic">
                {emptySuggestionText}
              </div>
            ) : (
              suggestions.slice(0, 12).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onToggleId(item.id);
                    setQuery('');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-amber-50/80 transition flex items-center justify-between gap-2 text-xs cursor-pointer"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800 block truncate">
                      {item.name}
                    </span>
                    {item.tagline && (
                      <span className="text-[11px] text-slate-500 block truncate">
                        {item.tagline}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-amber-700 font-semibold shrink-0">
                    + Chọn
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Các thẻ Tag (Chip) nhỏ gọn ngay dưới ô input */}
      {selectedItems.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
          <span className="text-[11px] font-medium text-slate-500 mr-0.5">
            {DEFAULT_TEXTS.SELECTED_PREFIX}
          </span>
          {selectedItems.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-950 border border-amber-200/90 shadow-2xs"
            >
              <span>{item.name}</span>
              <button
                type="button"
                onClick={() => onToggleId(item.id)}
                title={`${DEFAULT_TEXTS.REMOVE_TITLE} ${item.name}`}
                className="text-amber-700 hover:text-rose-600 font-bold leading-none cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
