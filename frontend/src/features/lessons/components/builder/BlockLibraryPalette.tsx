'use client';

import React, { useState } from 'react';
import {
  FileText,
  Heading,
  Image as ImageIcon,
  Video,
  Quote,
  Minus,
  AlertCircle,
  UserSquare2,
  GitCommitHorizontal,
  Users,
  CalendarRange,
  Sparkles,
  MapPin,
  Table2,
  Columns3,
  BookOpen,
  Search,
  X,
  LucideIcon,
} from 'lucide-react';
import { LESSON_BLOCK_ITEMS } from '../../constants/block-palette.constants';
import { LessonBlockGroup, LessonBlockType } from '../../types/block-palette.types';

interface BlockLibraryPaletteProps {
  onAddBlock: (type: LessonBlockType) => void;
  className?: string;
  allowedBlockTypes?: LessonBlockType[];
  accentColor?: string;
}

export const BLOCK_TYPE_ICONS: Record<string, LucideIcon> = {
  [LessonBlockType.TEXT]: FileText,
  [LessonBlockType.HEADING]: Heading,
  [LessonBlockType.IMAGE]: ImageIcon,
  [LessonBlockType.VIDEO]: Video,
  [LessonBlockType.QUOTE]: Quote,
  [LessonBlockType.DIVIDER]: Minus,
  [LessonBlockType.CALLOUT]: AlertCircle,
  [LessonBlockType.STORY_CHAPTER]: BookOpen,
  [LessonBlockType.CHARACTER]: UserSquare2,
  [LessonBlockType.TIMELINE]: GitCommitHorizontal,
  [LessonBlockType.RELATED_PEOPLE]: Users,
  [LessonBlockType.RELATED_EVENTS]: CalendarRange,
  [LessonBlockType.EVENT]: Sparkles,
  [LessonBlockType.MAP]: MapPin,
  [LessonBlockType.COMPARISON_TABLE]: Table2,
  [LessonBlockType.SECTION_ROW]: Columns3,
};

export function BlockLibraryPalette({
  onAddBlock,
  className = '',
  allowedBlockTypes,
  accentColor = '#7c4b2e',
}: BlockLibraryPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = LESSON_BLOCK_ITEMS.filter((item) => {
    const isAllowed = !allowedBlockTypes || allowedBlockTypes.includes(item.type);
    if (!isAllowed) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q)
    );
  });

  const basicItems = filteredItems.filter((i) => i.group === LessonBlockGroup.BASIC);
  const specializedItems = filteredItems.filter((i) => i.group === LessonBlockGroup.SPECIALIZED);
  const advancedItems = filteredItems.filter((i) => i.group === LessonBlockGroup.ADVANCED);

  const renderSection = (title: string, items: typeof filteredItems) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-stone-700 px-1">
          {title}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {items.map((item) => {
            const BlockIcon = BLOCK_TYPE_ICONS[item.type] || FileText;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => onAddBlock(item.type)}
                className="p-2.5 hover:bg-stone-50 rounded-lg text-left transition-colors duration-150 cursor-pointer flex flex-col gap-1.5 group"
              >
                <span
                  className="w-7 h-7 rounded-md border flex items-center justify-center transition-colors duration-150"
                  style={{
                    backgroundColor: 'white',
                    borderColor: '#e7ddd4',
                    color: accentColor,
                  }}
                >
                  <BlockIcon className="w-4 h-4" strokeWidth={1.75} />
                </span>
                <span className="text-sm font-medium text-stone-800 group-hover:text-stone-950 truncate leading-snug">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside
      className={`w-full bg-white border-r border-stone-200 p-4 flex flex-col shrink-0 h-full overflow-y-auto select-none ${className}`}
    >
      {/* Header Palette */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
        <span className="text-sm font-bold text-stone-900 tracking-tight">Thư viện khối</span>
        <span className="text-xs font-medium text-stone-600">
          {filteredItems.length} khối
        </span>
      </div>

      {/* Ô tìm kiếm khối */}
      <div className="relative mb-4">
        <Search
          className="w-4 h-4 text-stone-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          strokeWidth={1.75}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm khối nội dung..."
          className="w-full text-sm pl-9 pr-8 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 text-stone-900 placeholder:text-stone-600 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-900 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Danh sách các nhóm khối */}
      <div className="space-y-5 overflow-y-auto pr-0.5 flex-1">
        {renderSection('CƠ BẢN', basicItems)}
        {renderSection('TRI THỨC LỊCH SỬ', specializedItems)}
        {renderSection('BỐ CỤC NÂNG CAO', advancedItems)}
      </div>
    </aside>
  );
}
