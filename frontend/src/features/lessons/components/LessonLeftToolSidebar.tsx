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
  HelpCircle,
  Link2,
  Search,
  X,
  LucideIcon,
} from 'lucide-react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/enums';
import { getBlockLabel, LESSON_BLOCK_DRAG_MIME, LESSON_BLOCK_ITEMS } from '../constants/lesson.constants';
import { LessonBlockGroup, LessonBlockType, LeftSidebarMode } from '../types/editor.types';
import { TocItem } from './LessonPreviewContent';

// === Merged from BlockLibraryPalette.tsx ===
export interface BlockLibraryPaletteProps {
  onAddBlock: (type: LessonBlockType) => void;
  className?: string;
  allowedBlockTypes?: LessonBlockType[];
  accentColor?: string;
  includeLessonOnly?: boolean;
}

export const BLOCK_TYPE_ICONS: Record<string, LucideIcon> = {
  [LessonBlockType.TEXT]: FileText,
  [LessonBlockType.HEADING]: Heading,
  [LessonBlockType.IMAGE]: ImageIcon,
  [LessonBlockType.VIDEO]: Video,
  [LessonBlockType.RESOURCE_LINK]: Link2,
  [LessonBlockType.QUOTE]: Quote,
  [LessonBlockType.DIVIDER]: Minus,
  [LessonBlockType.CALLOUT]: AlertCircle,
  [LessonBlockType.CHARACTER]: UserSquare2,
  [LessonBlockType.TIMELINE]: GitCommitHorizontal,
  [LessonBlockType.RELATED_PEOPLE]: Users,
  [LessonBlockType.RELATED_EVENTS]: CalendarRange,
  [LessonBlockType.EVENT]: Sparkles,
  [LessonBlockType.MAP]: MapPin,
  [LessonBlockType.COMPARISON_TABLE]: Table2,
  [LessonBlockType.QUIZ]: HelpCircle,
  [LessonBlockType.SECTION_ROW]: Columns3,
};

export function BlockLibraryPalette({
  onAddBlock,
  className = '',
  allowedBlockTypes,
  includeLessonOnly = false,
  accentColor = '#7c4b2e',
}: BlockLibraryPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = LESSON_BLOCK_ITEMS.filter((item) => {
    const isAllowed =
      (!allowedBlockTypes || allowedBlockTypes.includes(item.type)) && (includeLessonOnly || !item.lessonOnly);
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
                data-testid={`btn-block-${item.type}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(LESSON_BLOCK_DRAG_MIME, item.type);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => onAddBlock(item.type)}
                title={`${item.label} — Bấm hoặc kéo thả vào vùng soạn thảo`}
                className="p-2.5 hover:bg-stone-50 rounded-lg text-left transition-colors duration-150 cursor-grab active:cursor-grabbing flex flex-col gap-1.5 group"
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
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
        <span className="text-sm font-bold text-stone-900 tracking-tight">Thư viện khối</span>
        <span className="text-xs font-medium text-stone-600">{filteredItems.length} khối</span>
      </div>

      <div className="relative mb-4">
        <Search className="w-4 h-4 text-stone-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.75} />
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

      <div className="space-y-5 overflow-y-auto pr-0.5 flex-1">
        {renderSection('CƠ BẢN', basicItems)}
        {renderSection('TRI THỨC LỊCH SỬ', specializedItems)}
        {renderSection('BỐ CỤC NÂNG CAO', advancedItems)}
      </div>
    </aside>
  );
}

const COLLAPSED_QUICK_BLOCKS: ReadonlyArray<{
  type: LessonBlockType;
  icon: IconName;
  hoverClass: string;
}> = [
  { type: LessonBlockType.TEXT, icon: IconName.EDIT, hoverClass: 'hover:text-emerald-700 hover:bg-emerald-50' },
  { type: LessonBlockType.CHARACTER, icon: IconName.USERS, hoverClass: 'hover:text-indigo-700 hover:bg-indigo-50' },
  { type: LessonBlockType.RELATED_EVENTS, icon: IconName.CALENDAR, hoverClass: 'hover:text-amber-700 hover:bg-amber-50' },
  { type: LessonBlockType.IMAGE, icon: IconName.GRID, hoverClass: 'hover:text-emerald-700 hover:bg-emerald-50' },
];

interface LessonLeftToolSidebarProps {
  isCollapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  mode: LeftSidebarMode;
  onChangeMode: (mode: LeftSidebarMode) => void;
  tocItems: TocItem[];
  onInsertBlock: (type: LessonBlockType) => void;
}

/** Cột trái "Thêm khối" / "Mục lục" của LessonEditor — có thể thu gọn thành thanh công
 * cụ icon mỏng (54px) hoặc mở rộng đầy đủ với 2 tab (Thêm khối | Mục lục). */
export function LessonLeftToolSidebar({
  isCollapsed,
  onCollapse,
  onExpand,
  mode,
  onChangeMode,
  tocItems,
  onInsertBlock,
}: LessonLeftToolSidebarProps) {
  if (isCollapsed) {
    return (
      <aside
        data-testid="left-sidebar-collapsed-toolstrip"
        className="w-14 shrink-0 flex flex-col items-center gap-1.5 max-h-[calc(100vh-80px)] overflow-y-auto lg:sticky lg:top-[68px] self-start py-2.5 px-1 bg-white border border-slate-200 rounded-xl shadow-2xs z-20 transition-all duration-150 select-none"
      >
        <button
          type="button"
          id="btn-expand-left-sidebar"
          onClick={onExpand}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer mb-1 border border-slate-200"
          title="Mở rộng danh mục khối nội dung"
        >
          <span className="text-sm font-bold">⇥</span>
        </button>

        <div className="w-8 h-px bg-slate-200 my-0.5" />

        {COLLAPSED_QUICK_BLOCKS.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => onInsertBlock(item.type)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 transition cursor-pointer ${item.hoverClass}`}
            title={`Thêm ${getBlockLabel(item.type)}`}
          >
            <Icon name={item.icon} size={16} />
          </button>
        ))}
      </aside>
    );
  }

  return (
    <aside
      data-testid="left-sidebar-expanded-panel"
      className="w-full lg:w-64 xl:w-72 shrink-0 flex flex-col gap-2 max-h-[calc(100vh-80px)] overflow-y-auto lg:sticky lg:top-[68px] self-start animate-in slide-in-from-left duration-150 z-20 custom-editor-scrollbar pr-0.5"
    >
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xs flex items-center justify-between gap-1">
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg text-xs flex-1">
          <button
            type="button"
            onClick={() => onChangeMode(LeftSidebarMode.BLOCKS)}
            data-testid="tab-left-blocks"
            className={`py-1 px-1.5 rounded-md font-bold transition text-center cursor-pointer ${
              mode === LeftSidebarMode.BLOCKS ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Thêm khối
          </button>
          <button
            type="button"
            onClick={() => onChangeMode(LeftSidebarMode.OUTLINE)}
            data-testid="tab-left-outline"
            className={`py-1 px-1.5 rounded-md font-bold transition text-center cursor-pointer ${
              mode === LeftSidebarMode.OUTLINE ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mục lục {tocItems.length > 0 ? `(${tocItems.length})` : ''}
          </button>
        </div>

        <button
          type="button"
          id="btn-collapse-left-sidebar"
          onClick={onCollapse}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
          title="Thu gọn thành thanh công cụ mỏng"
        >
          <span className="text-xs font-bold">⇤</span>
        </button>
      </div>

      {mode === LeftSidebarMode.BLOCKS ? (
        <BlockLibraryPalette onAddBlock={onInsertBlock} includeLessonOnly className="!w-full border-slate-200 !p-2.5 !shadow-2xs" />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col gap-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 px-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon name={IconName.BOOK} size={13} className="text-blue-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate">
                Mục lục ({tocItems.length})
              </span>
            </div>
          </div>

          {tocItems.length > 0 ? (
            <nav className="space-y-1 text-xs overflow-y-auto pr-0.5">
              {tocItems.map((item, idx) => {
                const displayText = item.text.replace(/^(\d+(\.\d+)*\s*[-–.]?\s*)/, '');
                return (
                  <button
                    key={item.id}
                    type="button"
                    style={{ paddingLeft: `${(item.level - 1) * 10 + 4}px` }}
                    onClick={() => {
                      let el = document.getElementById(item.id);
                      if (!el) {
                        const headings = document.querySelectorAll(
                          '.tiptap h1, .tiptap h2, .tiptap h3, .ProseMirror h1, .ProseMirror h2, .ProseMirror h3',
                        );
                        if (headings && headings[idx]) el = headings[idx] as HTMLElement;
                      }
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="w-full text-left py-1.5 px-1.5 rounded-lg hover:bg-blue-50/70 hover:text-blue-700 transition flex items-baseline gap-1.5 cursor-pointer group"
                    title={`Nhảy tới: ${displayText}`}
                  >
                    <span className="text-slate-400 group-hover:text-blue-600 font-mono text-[11px] font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-slate-700 group-hover:text-blue-800 font-medium leading-snug line-clamp-2">
                      {displayText}
                    </span>
                  </button>
                );
              })}
            </nav>
          ) : (
            <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200 space-y-1">
              <p className="font-semibold text-slate-600">Chưa có đề mục</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Chọn văn bản và bấm <strong>H1, H2, H3</strong> để tạo mục lục tự động.
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
