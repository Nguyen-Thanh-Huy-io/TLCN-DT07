'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  X,
  Tag,
  Check,
  Swords,
  ShieldAlert,
  Flag,
  Scroll,
  Landmark,
  Users,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';
import { EVENT_CATEGORY_CODES } from '@/constants/enums';

export interface CategoryOption {
  code: string;
  label: string;
  group: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const CATEGORY_GROUPS: Array<{
  groupName: string;
  options: CategoryOption[];
}> = [
  {
    groupName: 'Quân sự & Xung đột',
    options: [
      {
        code: EVENT_CATEGORY_CODES.WAR,
        label: 'Chiến tranh / Kháng chiến',
        group: 'Quân sự & Xung đột',
        icon: ShieldAlert,
      },
      {
        code: EVENT_CATEGORY_CODES.BATTLE,
        label: 'Trận đánh / Chiến dịch',
        group: 'Quân sự & Xung đột',
        icon: Swords,
      },
    ],
  },
  {
    groupName: 'Phong trào & Đấu tranh',
    options: [
      {
        code: EVENT_CATEGORY_CODES.REVOLUTION,
        label: 'Cách mạng / Khởi nghĩa',
        group: 'Phong trào & Đấu tranh',
        icon: Flag,
      },
    ],
  },
  {
    groupName: 'Chính trị & Thể chế',
    options: [
      {
        code: EVENT_CATEGORY_CODES.TREATY,
        label: 'Hiệp ước / Văn kiện',
        group: 'Chính trị & Thể chế',
        icon: Scroll,
      },
      {
        code: EVENT_CATEGORY_CODES.POLITICAL_EVENT,
        label: 'Chính trị / Thể chế',
        group: 'Chính trị & Thể chế',
        icon: Landmark,
      },
      {
        code: EVENT_CATEGORY_CODES.SUMMIT_CONFERENCE,
        label: 'Hội nghị / Đại hội',
        group: 'Chính trị & Thể chế',
        icon: Users,
      },
    ],
  },
  {
    groupName: 'Văn hóa & Xã hội',
    options: [
      {
        code: EVENT_CATEGORY_CODES.CULTURE_SCIENCE,
        label: 'Văn hóa / Tư tưởng',
        group: 'Văn hóa & Xã hội',
        icon: BookOpen,
      },
      {
        code: EVENT_CATEGORY_CODES.NATURAL_DISASTER,
        label: 'Thiên tai / Nạn đói',
        group: 'Văn hóa & Xã hội',
        icon: AlertTriangle,
      },
    ],
  },
];

export interface CategorySearchableComboboxProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
}

export function CategorySearchableCombobox({
  selectedCategory,
  onSelect,
}: CategorySearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tìm option đang chọn
  const selectedOption = useMemo(() => {
    for (const group of CATEGORY_GROUPS) {
      const found = group.options.find((opt) => opt.code === selectedCategory);
      if (found) return found;
    }
    return null;
  }, [selectedCategory]);

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

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Lọc theo query
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return CATEGORY_GROUPS;

    return CATEGORY_GROUPS.map((group) => ({
      ...group,
      options: group.options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          opt.group.toLowerCase().includes(q) ||
          opt.code.toLowerCase().includes(q),
      ),
    })).filter((group) => group.options.length > 0);
  }, [searchQuery]);

  const handleSelect = (code: string) => {
    onSelect(code);
    setIsOpen(false);
    setSearchQuery('');
  };

  const SelectedIcon = selectedOption?.icon || Tag;

  return (
    <div className="relative min-w-[190px]" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-1.5 bg-white hover:bg-slate-50 border rounded-xl text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs transition-all ${
          isOpen
            ? 'border-amber-800 ring-2 ring-amber-100'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <SelectedIcon size={13} className="text-amber-800 shrink-0" />
          <span className="truncate text-slate-800">
            {selectedOption ? selectedOption.label : 'Tất cả phân loại'}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {selectedCategory !== 'all' && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleSelect('all');
              }}
              className="p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded"
              title="Bỏ lọc phân loại"
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

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-72 max-h-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 flex flex-col overflow-hidden animate-in fade-in duration-150">
          <div className="p-2 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
            <Search size={14} className="text-slate-400 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Gõ tên loại sự kiện (Trận, Khởi nghĩa...)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          <div className="overflow-y-auto p-1.5 space-y-2 flex-1">
            <div
              onClick={() => handleSelect('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-amber-50 text-amber-900 font-bold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>-- Tất cả phân loại --</span>
              {selectedCategory === 'all' && <Check size={13} className="text-amber-800" />}
            </div>

            {filteredGroups.map((group) => (
              <div key={group.groupName} className="space-y-0.5">
                <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {group.groupName}
                </div>
                {group.options.map((opt) => {
                  const isSelected = opt.code === selectedCategory;
                  const IconComp = opt.icon;
                  return (
                    <div
                      key={opt.code}
                      onClick={() => handleSelect(opt.code)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-amber-50 text-amber-900 font-bold'
                          : 'text-slate-700 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <IconComp size={13} className="text-slate-500 shrink-0" />
                        <span className="truncate">{opt.label}</span>
                      </div>
                      {isSelected && <Check size={13} className="text-amber-800 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
