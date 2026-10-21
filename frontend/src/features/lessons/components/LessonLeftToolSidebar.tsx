'use client';

import React from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { LessonBlockPalette } from './LessonBlockPalette';
import { LessonBlockType } from '../types/block-palette.types';
import { LeftSidebarMode } from '../types/editor.types';
import { TocItem } from './LessonPreviewContent';

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

        <button
          type="button"
          onClick={() => onInsertBlock(LessonBlockType.TEXT)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
          title="Thêm khối Văn bản"
        >
          <Icon name={IconName.EDIT} size={16} />
        </button>
        <button
          type="button"
          onClick={() => onInsertBlock(LessonBlockType.TIMELINE)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
          title="Thêm Dòng thời gian (Timeline)"
        >
          <Icon name={IconName.CLOCK} size={16} />
        </button>
        <button
          type="button"
          onClick={() => onInsertBlock(LessonBlockType.CHARACTER)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 transition cursor-pointer"
          title="Thêm Nhân vật lịch sử"
        >
          <Icon name={IconName.USERS} size={16} />
        </button>
        <button
          type="button"
          onClick={() => onInsertBlock(LessonBlockType.EVENT)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition cursor-pointer"
          title="Thêm Thẻ sự kiện"
        >
          <Icon name={IconName.CALENDAR} size={16} />
        </button>
        <button
          type="button"
          onClick={() => onInsertBlock(LessonBlockType.IMAGE)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
          title="Thêm Hình ảnh tư liệu"
        >
          <Icon name={IconName.GRID} size={16} />
        </button>
        <button
          type="button"
          onClick={() => onInsertBlock(LessonBlockType.SECTION_ROW)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition cursor-pointer"
          title="Thêm Hàng nhiều cột"
        >
          <Icon name={IconName.GRID} size={16} />
        </button>
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
        <LessonBlockPalette onSelectBlock={onInsertBlock} className="!w-full border-slate-200 !p-2.5 !shadow-2xs" />
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
