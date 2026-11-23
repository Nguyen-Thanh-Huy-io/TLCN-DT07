'use client';

import React from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  GitBranch,
  Loader2,
  PanelRight,
  Plus,
  Printer,
  Redo2,
  Share2,
  StickyNote,
  Undo2,
} from 'lucide-react';

export enum MindmapSaveState {
  SAVED = 'SAVED',
  SAVING = 'SAVING',
  ERROR = 'ERROR',
}

const IDLE_BTN_CLS = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

export function MindmapTopBar({
  title,
  saveState,
  canUndo,
  canRedo,
  hasSelectedNode,
  isLinking,
  readerOpen,
  sidebarOpen,
  onBack,
  onTitleChange,
  onUndo,
  onRedo,
  onAddChild,
  onAddSibling,
  onAddSticky,
  onToggleLink,
  onToggleReader,
  onToggleSidebar,
  onPrint,
  onShareToCommunity,
}: {
  title: string;
  saveState: MindmapSaveState;
  canUndo: boolean;
  canRedo: boolean;
  hasSelectedNode: boolean;
  isLinking: boolean;
  readerOpen: boolean;
  sidebarOpen: boolean;
  onBack: () => void;
  onTitleChange: (title: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddChild: () => void;
  onAddSibling: () => void;
  onAddSticky: () => void;
  onToggleLink: () => void;
  onToggleReader: () => void;
  onToggleSidebar: () => void;
  onPrint: () => void;
  onShareToCommunity?: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-4 py-2.5 shadow-2xs print:hidden">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          <ArrowLeft size={14} /> Danh sách
        </button>

        <input
          aria-label="Tên sơ đồ tư duy"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          maxLength={150}
          className="min-w-[150px] max-w-[320px] rounded-lg px-2 py-1 font-[family-name:var(--font-heading)] text-base font-bold text-slate-900 outline-none hover:bg-slate-50 focus:bg-slate-50 focus:ring-1 focus:ring-blue-400"
        />

        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
          {saveState === MindmapSaveState.SAVING ? (
            <>
              <Loader2 size={11} className="animate-spin text-blue-600" /> Đang lưu…
            </>
          ) : saveState === MindmapSaveState.ERROR ? (
            <span className="text-rose-600">Lỗi lưu</span>
          ) : (
            <>
              <Check size={11} className="text-emerald-600" /> Đã lưu
            </>
          )}
        </span>

        <div className="ml-1 inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            title="Hoàn tác (Ctrl+Z)"
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            title="Làm lại (Ctrl+Y)"
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
          >
            <Redo2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={onAddChild}
          className="inline-flex items-center gap-1 rounded-xl bg-[#16357B] px-3 py-1.5 font-bold text-white hover:brightness-110 cursor-pointer"
          title="Thêm nhánh con (Tab)"
        >
          <Plus size={13} /> Nhánh con
        </button>

        <button
          type="button"
          disabled={!hasSelectedNode}
          onClick={onAddSibling}
          className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 font-semibold disabled:opacity-45 cursor-pointer ${IDLE_BTN_CLS}`}
          title="Thêm nhánh ngang hàng (Enter)"
        >
          <Plus size={13} /> Anh em
        </button>

        <button
          type="button"
          onClick={onAddSticky}
          className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1.5 font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
          title="Thêm ghi chú dán tự do lên bảng"
        >
          <StickyNote size={13} /> Ghi chú dán
        </button>

        <button
          type="button"
          onClick={onToggleLink}
          className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 font-semibold cursor-pointer ${
            isLinking ? 'border-blue-500 bg-blue-50 text-blue-700' : IDLE_BTN_CLS
          }`}
          title="Nối chéo giữa 2 node bất kỳ"
        >
          <GitBranch size={13} /> {isLinking ? 'Chọn node đích…' : 'Nối dây'}
        </button>

        <button
          type="button"
          onClick={onToggleReader}
          className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 font-semibold cursor-pointer ${
            readerOpen ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : IDLE_BTN_CLS
          }`}
          title="Mở Bài viết / Bài học bên cạnh để vừa xem vừa làm"
        >
          <BookOpen size={13} /> Tài liệu học
        </button>

        {onShareToCommunity && (
          <button
            type="button"
            onClick={onShareToCommunity}
            className="inline-flex items-center gap-1 rounded-xl border border-[#B8893F]/70 bg-[#FAF5E6] px-2.5 py-1.5 font-bold text-[#7A1F24] transition-colors hover:bg-[#7A1F24] hover:text-[#FAF5E6] cursor-pointer"
            title="Chia sẻ sơ đồ tư duy này lên Cộng đồng HISGO"
          >
            <Share2 size={13} /> Chia sẻ
          </button>
        )}

        <button
          type="button"
          onClick={onPrint}
          className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 font-semibold cursor-pointer ${IDLE_BTN_CLS}`}
          title="In / Xuất PDF"
        >
          <Printer size={14} />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 font-semibold cursor-pointer ${
            sidebarOpen ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : IDLE_BTN_CLS
          }`}
          title="Ẩn / Hiện bảng thiết kế bên phải"
        >
          <PanelRight size={14} />
        </button>
      </div>
    </header>
  );
}
