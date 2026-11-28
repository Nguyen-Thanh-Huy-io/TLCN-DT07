'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  GitBranch,
  Loader2,
  PanelRight,
  Plus,
  Printer,
  Redo2,
  Share2,
  Undo2,
} from 'lucide-react';

export enum MindmapSaveState {
  SAVED = 'SAVED',
  SAVING = 'SAVING',
  ERROR = 'ERROR',
}

const IDLE_BTN_CLS =
  'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300';
const ACTIVE_BTN_CLS = 'border-[#7A1F24]/50 bg-[#F6E9EA] text-[#7A1F24] font-semibold';

export interface MindmapTopBarProps {
  title: string;
  saveState: MindmapSaveState;
  canUndo: boolean;
  canRedo: boolean;
  hasSelectedNode: boolean;
  isLinking: boolean;
  isStudyMode?: boolean;
  recallTriggerSlot?: React.ReactNode;
  readerOpen: boolean;
  sidebarOpen: boolean;
  onBack: () => void;
  onTitleChange: (title: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddChild: () => void;
  onAddSibling: () => void;
  onToggleLink: () => void;
  onToggleReader: () => void;
  onToggleSidebar: () => void;
  onPrint: () => void;
  onShareToCommunity?: () => void;
}

export function MindmapTopBar({
  title,
  saveState,
  canUndo,
  canRedo,
  hasSelectedNode,
  isLinking,
  isStudyMode = false,
  recallTriggerSlot,
  readerOpen,
  sidebarOpen,
  onBack,
  onTitleChange,
  onUndo,
  onRedo,
  onAddChild,
  onAddSibling,
  onToggleLink,
  onToggleReader,
  onToggleSidebar,
  onPrint,
  onShareToCommunity,
}: MindmapTopBarProps) {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  return (
    <header className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200/90 bg-white px-3.5 py-2 shadow-2xs sm:px-5 sm:py-2.5 print:hidden">
      {/* =========================================================================
          CỤM 1: QUẢN LÝ TỆP & LỊCH SỬ (BÊN TRÁI)
      ========================================================================= */}
      <div className="flex min-w-0 max-w-full items-center gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold whitespace-nowrap text-slate-700 transition hover:bg-slate-100 hover:border-slate-300 cursor-pointer sm:px-3"
          title="Quay lại danh sách sơ đồ tư duy"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Danh sách</span>
        </button>

        {/* Ô sửa tên sơ đồ */}
        <div className="relative flex min-w-0 flex-1 max-w-[320px] sm:max-w-[480px] md:max-w-[640px] lg:max-w-[780px] items-center">
          <input
            aria-label="Tên sơ đồ tư duy"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            maxLength={150}
            className="w-full min-w-[140px] sm:min-w-[260px] rounded-lg px-2.5 py-1 font-[family-name:var(--font-heading)] text-xs font-bold text-slate-900 outline-none transition hover:bg-slate-50 focus:bg-slate-50 focus:ring-1 focus:ring-blue-400 sm:text-sm"
          />
        </div>

        {/* Chỉ báo trạng thái tự động lưu tinh gọn */}
        <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/80 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-slate-600 sm:px-2.5">
          {saveState === MindmapSaveState.SAVING ? (
            <>
              <Loader2 size={11} className="animate-spin text-blue-600" />
              <span className="hidden md:inline">Đang lưu…</span>
            </>
          ) : saveState === MindmapSaveState.ERROR ? (
            <>
              <AlertCircle size={11} className="text-rose-600" />
              <span className="text-rose-600">Lỗi lưu</span>
            </>
          ) : (
            <>
              <Check size={11} className="text-emerald-600" />
              <span className="hidden md:inline text-slate-600">Đã lưu</span>
            </>
          )}
        </div>

        {/* Cụm Undo / Redo */}
        <div className="inline-flex shrink-0 items-center rounded-xl border border-slate-200 bg-white p-0.5">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            title="Hoàn tác (Ctrl+Z)"
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            title="Làm lại (Ctrl+Y)"
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition"
          >
            <Redo2 size={14} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          CỤM 2: THAO TÁC VẼ CÂY MINDMAP (Ở GIỮA - TRỌNG TÂM)
      ========================================================================= */}
      <div className="flex items-center gap-1.5 text-xs">
        {!isStudyMode && (
          <>
            {/* Nút Primary: Thêm nhánh con */}
            <button
              type="button"
              onClick={onAddChild}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#7A1F24] px-3 py-1.5 font-bold whitespace-nowrap text-white shadow-xs transition hover:bg-[#5E161A] active:scale-98 cursor-pointer"
              title="Thêm nhánh con (Phím tắt: Tab)"
            >
              <Plus size={13} />
              <span>Nhánh con</span>
            </button>

            {/* Nút Secondary: Thêm nhánh ngang hàng */}
            <button
              type="button"
              disabled={!hasSelectedNode}
              onClick={onAddSibling}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 font-semibold whitespace-nowrap disabled:opacity-40 cursor-pointer transition ${IDLE_BTN_CLS}`}
              title="Thêm nhánh ngang hàng (Phím tắt: Enter)"
            >
              <Plus size={13} />
              <span>Anh em</span>
            </button>

            {/* Nút Nối dây / Nối quan hệ chéo */}
            <button
              type="button"
              onClick={onToggleLink}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 font-semibold whitespace-nowrap cursor-pointer transition ${
                isLinking ? ACTIVE_BTN_CLS : IDLE_BTN_CLS
              }`}
              title="Nối quan hệ chéo giữa 2 node bất kỳ"
            >
              <GitBranch size={13} />
              <span className="hidden sm:inline">{isLinking ? 'Chọn đích…' : 'Nối dây'}</span>
            </button>
          </>
        )}

        {recallTriggerSlot}
      </div>

      {/* =========================================================================
          CỤM 3: TIỆN ÍCH & XUẤT BẢN (BÊN PHẢI)
      ========================================================================= */}
      <div className="flex items-center gap-1.5 text-xs">
        {/* Nút Mở bảng tài liệu tham khảo bài viết */}
        <button
          type="button"
          onClick={onToggleReader}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 font-semibold whitespace-nowrap cursor-pointer transition ${
            readerOpen ? 'border-[#7A1F24]/50 bg-[#F6E9EA] text-[#7A1F24]' : IDLE_BTN_CLS
          }`}
          title="Mở Tư liệu / Bài viết để vừa đọc vừa vẽ sơ đồ"
        >
          <BookOpen size={13} />
          <span className="hidden md:inline">Tài liệu học</span>
        </button>

        {/* Menu Xuất file (In / PDF) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setExportMenuOpen((prev) => !prev)}
            className={`inline-flex shrink-0 items-center gap-1 rounded-xl border px-2.5 py-1.5 font-semibold whitespace-nowrap cursor-pointer transition ${IDLE_BTN_CLS}`}
            title="Tuỳ chọn xuất sơ đồ"
          >
            <Printer size={13} />
            <span className="hidden lg:inline">Xuất</span>
            <ChevronDown size={11} className="text-slate-400" />
          </button>

          {exportMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setExportMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1.5 w-44 rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setExportMenuOpen(false);
                    onPrint();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-medium text-slate-700 hover:bg-slate-100 cursor-pointer transition"
                >
                  <Printer size={14} className="text-slate-500" />
                  <span>In / Lưu PDF</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Nút Chia sẻ lên Cộng đồng HISGO */}
        {onShareToCommunity && (
          <button
            type="button"
            onClick={onShareToCommunity}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#B8893F]/70 bg-[#FAF5E6] px-2.5 py-1.5 font-bold whitespace-nowrap text-[#7A1F24] transition hover:bg-[#7A1F24] hover:text-[#FAF5E6] cursor-pointer shadow-2xs"
            title="Chia sẻ sơ đồ tư duy này lên Cộng đồng HISGO"
          >
            <Share2 size={13} />
            <span className="hidden sm:inline">Chia sẻ</span>
          </button>
        )}

        {/* Nút Đóng / Mở Bảng thuộc tính bên phải */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`inline-flex shrink-0 items-center gap-1 rounded-xl border p-1.5 font-semibold cursor-pointer transition sm:px-2 ${
            sidebarOpen ? 'border-[#7A1F24]/40 bg-[#F6E9EA] text-[#7A1F24]' : IDLE_BTN_CLS
          }`}
          title="Ẩn / Hiện bảng tuỳ chỉnh phong cách và thuộc tính"
        >
          <PanelRight size={14} />
        </button>
      </div>
    </header>
  );
}
