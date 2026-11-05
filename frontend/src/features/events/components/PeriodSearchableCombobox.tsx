'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, X, BookOpen, Check, CornerDownRight } from 'lucide-react';
import type { PeriodItem } from '@/types/models/period.type';

export interface PeriodSearchableComboboxProps {
  periods: PeriodItem[];
  selectedPeriodId: string;
  onSelect: (periodId: string) => void;
}

export function PeriodSearchableCombobox({
  periods,
  selectedPeriodId,
  onSelect,
}: PeriodSearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Đóng khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tự động focus ô tìm kiếm khi mở dropdown
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Sắp xếp danh sách Thời kỳ theo thứ tự niên đại từ CSDL (startYear / displayOrder)
  // Tuyệt đối không hardcode, không tự chế enum giai đoạn
  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => {
      const orderA = a.displayOrder ?? a.orderIndex ?? 0;
      const orderB = b.displayOrder ?? b.orderIndex ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      const yA = a.startYear ?? 9999;
      const yB = b.startYear ?? 9999;
      return yA - yB;
    });
  }, [periods]);

  // Lọc theo từ khóa tìm kiếm người dùng gõ
  const filteredPeriods = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedPeriods;
    return sortedPeriods.filter((p) => {
      const nameMatch = (p.name || '').toLowerCase().includes(q);
      const yearMatch =
        (p.startYear !== null && p.startYear !== undefined && String(p.startYear).includes(q)) ||
        (p.endYear !== null && p.endYear !== undefined && String(p.endYear).includes(q));
      return nameMatch || yearMatch;
    });
  }, [sortedPeriods, searchQuery]);

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative min-w-[190px]" ref={wrapperRef}>
      {/* Nút kích hoạt Dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 bg-white hover:bg-slate-50 border rounded-xl text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs transition-all ${
          isOpen
            ? 'border-amber-800 ring-2 ring-amber-100'
            : selectedPeriodId !== 'all'
              ? 'border-amber-800 text-amber-900 bg-amber-50/50'
              : 'border-slate-300 hover:border-slate-400 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <BookOpen
            size={13}
            className={`shrink-0 ${
              selectedPeriodId !== 'all' ? 'text-amber-800' : 'text-slate-400'
            }`}
          />
          <span className="truncate">
            {selectedPeriod ? selectedPeriod.name : 'Tất cả thời kỳ'}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {selectedPeriodId !== 'all' && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleSelect('all');
              }}
              className="p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded"
              title="Bỏ lọc thời kỳ"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={13}
            className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Menu thả xuống có Search & Danh sách phẳng chuẩn hóa */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-76 max-h-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 flex flex-col overflow-hidden animate-in fade-in duration-150">
          {/* Ô gõ tìm kiếm bên trong Combobox */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
            <Search size={14} className="text-slate-400 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Gõ tên thời kỳ hoặc năm (VD: Trần, 1945)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
              className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 font-medium focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Danh sách các thời kỳ */}
          <div className="overflow-y-auto p-1.5 space-y-0.5 flex-1 divide-y divide-slate-50">
            {/* Lựa chọn: Tất cả thời kỳ */}
            <div
              onClick={() => handleSelect('all')}
              className={`px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors ${
                selectedPeriodId === 'all'
                  ? 'bg-amber-50 text-amber-900 font-bold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>-- Tất cả thời kỳ lịch sử --</span>
              {selectedPeriodId === 'all' && <Check size={13} className="text-amber-800" />}
            </div>

            {filteredPeriods.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Không tìm thấy thời kỳ nào khớp với &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredPeriods.map((period) => {
                const isSelected = period.id === selectedPeriodId;
                const isSubPeriod = Boolean(period.parentId);

                const dateRange =
                  period.startYear !== null &&
                  period.startYear !== undefined &&
                  period.endYear !== null &&
                  period.endYear !== undefined
                    ? `${period.startYear} – ${period.endYear}`
                    : period.startYear !== null && period.startYear !== undefined
                      ? `Từ ${period.startYear}`
                      : '';

                return (
                  <div
                    key={period.id}
                    onClick={() => handleSelect(period.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isSubPeriod ? 'pl-6 text-slate-600' : 'text-slate-800 font-medium'
                    } ${
                      isSelected
                        ? 'bg-amber-50 text-amber-900 font-bold'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="min-w-0 pr-2 flex items-center gap-1.5">
                      {isSubPeriod && (
                        <CornerDownRight size={11} className="text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{period.name}</span>
                      {dateRange && (
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          ({dateRange})
                        </span>
                      )}
                    </div>
                    {isSelected && <Check size={13} className="text-amber-800 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
