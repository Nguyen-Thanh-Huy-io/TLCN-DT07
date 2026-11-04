'use client';
import React, { useState, useRef, useEffect } from 'react';
import { KeyboardKey } from '@/constants/enums';

export interface GroupedSelectOption {
  id: string;
  label: string;
  subtitle?: string;
  badge?: string;
  depth?: number;
}

export interface SelectOptionGroup {
  groupLabel: string;
  options: GroupedSelectOption[];
}

export interface SearchableGroupedSelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  groups: SelectOptionGroup[];
  placeholder?: string;
  emptyOptionLabel?: string;
  searchPlaceholder?: string;
  emptyResultText?: string;
  helperText?: string;
}

const DEFAULT_TEXTS = {
  PLACEHOLDER: '-- Chọn một mục --',
  SEARCH_PLACEHOLDER: 'Gõ từ khóa để lọc nhanh (VD: 1954, Hồ Chí Minh, Văn hóa)...',
  EMPTY_RESULT: 'Không tìm thấy mục nào khớp từ khóa',
  CLEAR_BUTTON: 'Bỏ chọn',
} as const;

/**
 * Component tái sử dụng chuẩn SOLID (SRP/OCP) cho Combobox có ô tìm kiếm + phân nhóm đề mục (<optgroup>) + phân cấp cây cha-con:
 * - Bấm vào ô -> hiện ngay ô Search ở đỉnh dropdown để lọc tức thì trong hàng trăm mục.
 * - Các mục được gom nhóm rõ ràng dưới các tiêu đề in đậm (tương đương <optgroup>).
 * - Hỗ trợ hiển thị phân cấp cha - con (depth = 0, 1, 2 -> └──).
 * - Có thuộc tính native `title` (Tooltip) hiển thị trọn vẹn tên dài 60-80 ký tự khi rê chuột.
 */
export function SearchableGroupedSelectField({
  label,
  value,
  onChange,
  groups,
  placeholder = DEFAULT_TEXTS.PLACEHOLDER,
  emptyOptionLabel,
  searchPlaceholder = DEFAULT_TEXTS.SEARCH_PLACEHOLDER,
  emptyResultText = DEFAULT_TEXTS.EMPTY_RESULT,
  helperText,
}: SearchableGroupedSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 20);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Tìm option đang được chọn để hiển thị tên đầy đủ và gắn vào native tooltip `title`
  let selectedOption: (GroupedSelectOption & { groupLabel: string }) | null = null;
  for (const grp of groups) {
    const found = grp.options.find((opt) => opt.id === value);
    if (found) {
      selectedOption = { ...found, groupLabel: grp.groupLabel };
      break;
    }
  }

  // Lọc các nhóm theo từ khóa tìm kiếm
  const kw = searchQuery.trim().toLowerCase();
  const filteredGroups = !kw
    ? groups.filter((g) => g.options.length > 0)
    : groups
        .map((grp) => ({
          groupLabel: grp.groupLabel,
          options: grp.options.filter(
            (opt) =>
              opt.label.toLowerCase().includes(kw) ||
              (opt.subtitle || '').toLowerCase().includes(kw) ||
              (opt.badge || '').toLowerCase().includes(kw) ||
              grp.groupLabel.toLowerCase().includes(kw),
          ),
        }))
        .filter((grp) => grp.options.length > 0);

  const tooltipTitle = selectedOption
    ? `${selectedOption.label}${
        selectedOption.subtitle ? ` (${selectedOption.subtitle})` : ''
      }`
    : emptyOptionLabel || placeholder;

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700 block">
          {label}
        </span>
        {helperText && (
          <span className="text-[11px] text-slate-400">{helperText}</span>
        )}
      </div>

      <div className="relative">
        {/* Nút bấm mở Combobox (Full-width 100% + Native Tooltip title) */}
        <button
          type="button"
          title={tooltipTitle}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full text-left text-xs px-3.5 py-2.5 bg-slate-50/80 border rounded-xl transition flex items-center justify-between gap-2 cursor-pointer ${
            isOpen
              ? 'bg-white border-amber-500 ring-2 ring-amber-500/15'
              : 'border-slate-200 hover:border-slate-300 hover:bg-white'
          }`}
        >
          <div className="min-w-0 flex-1 flex items-center gap-2">
            {selectedOption ? (
              <>
                {selectedOption.badge && (
                  <span className="px-2 py-0.5 rounded bg-amber-100/80 text-amber-900 font-semibold text-[10px] shrink-0">
                    {selectedOption.badge}
                  </span>
                )}
                <span className="font-semibold text-slate-900 truncate">
                  {selectedOption.label}
                </span>
                {selectedOption.subtitle && (
                  <span className="text-[11px] text-slate-500 font-mono shrink-0">
                    ({selectedOption.subtitle})
                  </span>
                )}
              </>
            ) : (
              <span className="text-slate-500 truncate">
                {emptyOptionLabel || placeholder}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {value && (
              <span
                role="button"
                tabIndex={0}
                title={DEFAULT_TEXTS.CLEAR_BUTTON}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                  setIsOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === KeyboardKey.ENTER || e.key === KeyboardKey.SPACE) {
                    e.stopPropagation();
                    onChange('');
                    setIsOpen(false);
                  }
                }}
                className="w-4 h-4 rounded-full hover:bg-slate-200 text-slate-400 hover:text-rose-600 flex items-center justify-center font-bold"
              >
                ×
              </span>
            )}
            <span className="text-slate-400 text-[10px]">
              {isOpen ? '▲' : '▼'}
            </span>
          </div>
        </button>

        {/* Dropdown Panel có Ô tìm kiếm + Các nhóm đề mục (<optgroup> UI) */}
        {isOpen && (
          <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-40 overflow-hidden">
            {/* Thanh Search cố định trên đỉnh dropdown */}
            <div className="p-2 bg-slate-50 border-b border-slate-200">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {/* Lựa chọn mặc định / Không chọn */}
              {emptyOptionLabel && !searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs transition cursor-pointer flex items-center justify-between ${
                    !value
                      ? 'bg-amber-50/80 text-amber-950 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{emptyOptionLabel}</span>
                  {!value && <span className="text-amber-700 font-bold">✓</span>}
                </button>
              )}

              {filteredGroups.length === 0 ? (
                <div className="px-3.5 py-4 text-xs text-slate-400 text-center italic">
                  {emptyResultText}
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <div key={group.groupLabel} className="py-1">
                    {/* Tiêu đề nhóm (Tương đương <optgroup label="...">) */}
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100/80 sticky top-0">
                      {group.groupLabel}
                    </div>

                    {group.options.map((opt) => {
                      const isSelected = opt.id === value;
                      const depth = opt.depth || 0;
                      const fullOptionTitle = `${opt.label}${
                        opt.subtitle ? ` (${opt.subtitle})` : ''
                      }`;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          title={fullOptionTitle}
                          onClick={() => {
                            onChange(opt.id);
                            setIsOpen(false);
                          }}
                          style={{
                            paddingLeft: `${14 + depth * 18}px`,
                          }}
                          className={`w-full text-left pr-3.5 py-2 text-xs transition cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-amber-50 text-amber-950 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0 flex items-center gap-1.5">
                            {depth > 0 && (
                              <span className="text-slate-400 font-mono text-[11px] shrink-0">
                                └──
                              </span>
                            )}
                            <span className="truncate">{opt.label}</span>
                            {opt.subtitle && (
                              <span className="text-[11px] text-slate-400 font-mono shrink-0">
                                ({opt.subtitle})
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <span className="text-amber-700 font-bold shrink-0">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
