'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  SlidersHorizontal,
  Search,
  RotateCcw,
  Tag,
  Check,
  Sparkles,
} from 'lucide-react';
import type { DataTableFilter, DataTableFilterOption } from '@/types/table.types';
import { KeyboardKey } from '@/constants/enums';

export const FILTER_ALL_VALUE = 'ALL';

export interface DataTableFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DataTableFilter[];
  totalCount: number;
}

interface FilterItemProps {
  filter: DataTableFilter;
}

/**
 * Component hiển thị một nhóm lọc có nhiều options:
 * - Hỗ trợ Chọn nhiều (Multi-Select) & Chọn đơn (Single-Select)
 * - MỚI: Hiển thị ngay 3-4 chip GỢI Ý NHANH để người dùng dễ hình dung
 * - MỚI: Click / Focus vào ô tìm kiếm là mở sẵn danh sách gợi ý (không bắt buộc phải gõ trước)
 */
function FilterInputSuggest({ filter }: FilterItemProps) {
  const [query, setQuery] = useState('');
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isMulti = Boolean(filter.isMultiSelect || filter.selectedValues);
  const options = useMemo(() => filter.options ?? [], [filter.options]);

  // Mảng các giá trị đang chọn
  const activeValues = useMemo<string[]>(() => {
    if (isMulti) {
      return filter.selectedValues || [];
    }
    const val = filter.selectedValue;
    return val && val !== FILTER_ALL_VALUE && val.length > 0
      ? [val]
      : [];
  }, [isMulti, filter.selectedValues, filter.selectedValue]);

  // Các đối tượng option tương ứng với các giá trị đang chọn
  const selectedOptions = useMemo<DataTableFilterOption[]>(() => {
    const set = new Set(activeValues);
    return options.filter((opt) => set.has(opt.value));
  }, [options, activeValues]);

  // Các mục gợi ý nhanh tiêu biểu (3-4 mục đầu tiên CHƯA được chọn) để người dùng dễ hình dung
  const quickSuggestions = useMemo<DataTableFilterOption[]>(() => {
    const activeSet = new Set(activeValues);
    return options
      .filter((opt) => opt.value !== FILTER_ALL_VALUE && !activeSet.has(opt.value))
      .slice(0, 4);
  }, [options, activeValues]);

  // Click ra ngoài để đóng menu gợi ý
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Danh sách gợi ý: Khi gõ thì lọc, khi chưa gõ thì hiển thị top 10 mục đầu tiên
  const suggestedOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const valid = options.filter((opt) => opt.value !== FILTER_ALL_VALUE);
    if (!q) {
      return valid.slice(0, 10);
    }
    return valid
      .filter((opt) => opt.label.toLowerCase().includes(q))
      .slice(0, 10);
  }, [options, query]);

  // Xử lý toggle hoặc chọn giá trị
  const handleSelectOption = (value: string) => {
    if (isMulti) {
      const exists = activeValues.includes(value);
      const updated = exists
        ? activeValues.filter((v) => v !== value)
        : [...activeValues, value];
      filter.onSelectMultiple?.(updated);
      setQuery('');
      setIsSuggestOpen(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      filter.onSelect?.(value);
      setQuery('');
      setIsSuggestOpen(false);
    }
  };

  const handleRemoveValue = (value: string) => {
    if (isMulti) {
      filter.onSelectMultiple?.(activeValues.filter((v) => v !== value));
    } else {
      filter.onSelect?.(FILTER_ALL_VALUE);
    }
  };

  const handleClearAll = () => {
    if (isMulti) {
      filter.onSelectMultiple?.([]);
    } else {
      filter.onSelect?.(FILTER_ALL_VALUE);
    }
  };

  return (
    <div ref={containerRef} className="space-y-2 relative">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
          <Tag size={13} className="text-amber-700" />
          {filter.label}
          {isMulti && activeValues.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
              {activeValues.length}
            </span>
          )}
        </span>
        {activeValues.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-amber-800 hover:text-amber-950 text-[11px] font-semibold underline cursor-pointer"
          >
            Bỏ chọn {filter.label.toLowerCase()}
          </button>
        )}
      </div>

      {/* Danh sách thẻ Tags/Badges các mục đã chọn */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-amber-50/50 border border-amber-200/80 rounded-xl">
          {selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-amber-950 font-medium text-xs shadow-2xs group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <span>{opt.label}</span>
              {opt.subLabel && (
                <span className="text-[10px] font-mono text-amber-800 opacity-70">
                  ({opt.subLabel})
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemoveValue(opt.value)}
                className="ml-0.5 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 p-0.5 transition cursor-pointer"
                title={`Gỡ bỏ ${opt.label}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Ô nhập tìm kiếm để add thêm lựa chọn */}
      {(isMulti || selectedOptions.length === 0) && (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder={
              isMulti && selectedOptions.length > 0
                ? `Gõ hoặc bấm gợi ý bên dưới để thêm ${filter.label.toLowerCase()}...`
                : `Gõ hoặc bấm chọn ${filter.label.toLowerCase()}...`
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsSuggestOpen(true);
            }}
            onFocus={() => {
              setIsSuggestOpen(true);
            }}
            className="w-full pl-8 pr-8 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-800 focus:outline-none placeholder:text-slate-400"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsSuggestOpen(true);
              }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          )}

          {/* Menu gợi ý xổ xuống khi focus hoặc khi gõ */}
          {isSuggestOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-52 overflow-y-auto py-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span>{query.trim() ? 'Kết quả tìm kiếm' : 'Danh sách gợi ý tiêu biểu'}</span>
                <span className="font-normal lowercase">({suggestedOptions.length} mục)</span>
              </div>
              {suggestedOptions.length > 0 ? (
                suggestedOptions.map((opt) => {
                  const isSelected = activeValues.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption(opt.value)}
                      className={`w-full px-3.5 py-2 text-left flex items-center justify-between text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-100/70 text-amber-950 font-bold'
                          : 'hover:bg-amber-50/70 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {isSelected && <Check size={13} className="text-amber-800 shrink-0" />}
                        <span className="font-semibold">{opt.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {opt.subLabel && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {opt.subLabel}
                          </span>
                        )}
                        {isSelected ? (
                          <span className="text-[10px] text-amber-800 font-bold">Đã chọn</span>
                        ) : (
                          <span className="text-[10px] text-slate-400">+ Thêm</span>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-3.5 py-3 text-center text-slate-400 italic text-[11px]">
                  Không tìm thấy {filter.label.toLowerCase()} nào khớp với &quot;{query}&quot;.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MỚI: Hàng GỢI Ý NHANH hiển thị ngay dưới ô input để người dùng dễ hình dung */}
      {quickSuggestions.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 pt-1">
          <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 shrink-0">
            <Sparkles size={11} className="text-amber-600" />
            Gợi ý nhanh:
          </span>
          {quickSuggestions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelectOption(opt.value)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-amber-50 hover:border-amber-300 border border-slate-200/80 text-[11px] text-slate-600 hover:text-amber-900 transition cursor-pointer"
              title={`Bấm để chọn nhanh ${opt.label}`}
            >
              <span>+</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Component hiển thị một nhóm lọc có ít options:
 * Hiển thị dạng các Chip / Pill Tag bấm chọn nhanh
 */
function FilterChipGroup({ filter }: FilterItemProps) {
  const options = useMemo(() => filter.options ?? [], [filter.options]);
  const isMulti = Boolean(filter.isMultiSelect || filter.selectedValues);

  const activeValues = useMemo<string[]>(() => {
    if (isMulti) {
      return filter.selectedValues || [];
    }
    return [filter.selectedValue || FILTER_ALL_VALUE];
  }, [isMulti, filter.selectedValues, filter.selectedValue]);

  const handleToggle = (value: string) => {
    if (isMulti) {
      if (value === FILTER_ALL_VALUE) {
        filter.onSelectMultiple?.([]);
        return;
      }
      const exists = activeValues.includes(value);
      const updated = exists
        ? activeValues.filter((v) => v !== value)
        : [...activeValues, value];
      filter.onSelectMultiple?.(updated);
    } else {
      filter.onSelect?.(value);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
          <Tag size={13} className="text-amber-700" />
          {filter.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = isMulti
            ? opt.value === FILTER_ALL_VALUE
              ? activeValues.length === 0
              : activeValues.includes(opt.value)
            : (filter.selectedValue || FILTER_ALL_VALUE) === opt.value;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleToggle(opt.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs transition cursor-pointer select-none ${
                isSelected
                  ? 'bg-amber-800 border-amber-800 text-white font-bold shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Modal Phễu lọc tổng quát dùng chung cho toàn bộ bảng DataTable trong CMS
 */
export function DataTableFilterModal({
  isOpen,
  onClose,
  filters,
  totalCount,
}: DataTableFilterModalProps) {
  // Khóa scroll khi mở modal
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === KeyboardKey.ESCAPE) onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  const hasActiveFilters = useMemo(() => {
    return filters.some((f) => {
      if (f.isMultiSelect || f.selectedValues) {
        return (f.selectedValues || []).length > 0;
      }
      const val = f.selectedValue;
      return val && val !== FILTER_ALL_VALUE && val.length > 0;
    });
  }, [filters]);

  const handleResetAll = () => {
    filters.forEach((f) => {
      if (f.isMultiSelect || f.selectedValues) {
        f.onSelectMultiple?.([]);
      } else {
        f.onSelect?.(FILTER_ALL_VALUE);
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] z-10"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-amber-50/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <SlidersHorizontal size={17} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Phễu lọc dữ liệu (Đa tiêu chí)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bấm chọn nhanh từ gợi ý hoặc gõ từ khóa để chọn nhiều tiêu chí
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                title="Đóng (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
              {filters.map((f, idx) => {
                const optionsCount = (f.options || []).length;
                // Nếu options > 5 hoặc là multi-select với search suggestions
                const isSuggestMode = optionsCount > 5 || f.isMultiSelect;

                return (
                  <div
                    key={f.label}
                    className={idx > 0 ? 'pt-4 border-t border-slate-100' : ''}
                  >
                    {isSuggestMode ? (
                      <FilterInputSuggest filter={f} />
                    ) : (
                      <FilterChipGroup filter={f} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetAll}
                disabled={!hasActiveFilters}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition ${
                  hasActiveFilters
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer'
                    : 'text-slate-400 cursor-not-allowed opacity-50'
                }`}
              >
                <RotateCcw size={13} />
                <span>Bỏ chọn tất cả</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition bg-amber-800 hover:bg-amber-900 text-white shadow-amber-900/10 cursor-pointer"
              >
                <span>Xem {totalCount.toLocaleString('vi-VN')} kết quả</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
