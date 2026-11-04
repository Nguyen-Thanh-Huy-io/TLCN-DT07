'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

export interface ComboboxOption {
  id: string;
  label: string;
  subLabel?: string | null;
  badge?: string | null;
}

interface HistoricalComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function HistoricalCombobox({
  options,
  value,
  onChange,
  placeholder = 'Tìm kiếm hoặc chọn...',
  emptyText = 'Không tìm thấy dữ liệu phù hợp',
  className = '',
  disabled = false,
}: HistoricalComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.id === value),
    [options, value],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return options.slice(0, 50);
    const q = search.toLowerCase().trim();
    return options
      .filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          (opt.subLabel && opt.subLabel.toLowerCase().includes(q)) ||
          (opt.badge && opt.badge.toLowerCase().includes(q)),
      )
      .slice(0, 50);
  }, [options, search]);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (!disabled) setIsOpen((prev) => !prev);
          }
        }}
        className={`w-full text-xs px-3 py-2 bg-slate-50 border rounded-xl flex items-center justify-between cursor-pointer transition select-none ${
          isOpen
            ? 'bg-white border-amber-500 ring-2 ring-amber-100'
            : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex-1 truncate mr-2">
          {selectedOption ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 truncate">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:text-rose-500 rounded transition"
              title="Xóa lựa chọn"
            >
              ✕
            </button>
          )}
          <Icon
            name={IconName.CHEVRON}
            size={14}
            className={`transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-amber-700' : ''
            }`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Gõ từ khóa để lọc nhanh..."
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 text-slate-800"
            />
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 italic">
                {emptyText}
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-amber-50/70 transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/90 text-amber-900 font-semibold'
                        : 'text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-medium">{opt.label}</div>
                      {opt.subLabel && (
                        <div className="text-[11px] text-slate-400 truncate">
                          {opt.subLabel}
                        </div>
                      )}
                    </div>
                    {opt.badge && (
                      <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {opt.badge}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
