'use client';

import React from 'react';
import {
  BookOpen,
  Download,
  Globe,
  Loader2,
  Minus,
  Network,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react';

export const SPATIAL_TOOLBAR_CONSTANTS = {
  SEARCH_PLACEHOLDER: 'Đổi chủ đề khám phá…',
  GOOGLE_ACTIVE_TITLE:
    'Đang bật tra cứu Google Search (kết hợp tri thức mở với tư liệu HISGO)',
  GOOGLE_INACTIVE_TITLE:
    'Đang tắt Google Search (chỉ dùng tri thức nội bộ HISGO)',
  DRAWER_BTN_TEXT: 'Tư liệu',
  DRAWER_BTN_TITLE: 'Đóng/mở ngăn đọc tư liệu bài viết',
  ZOOM_RESET_TITLE: 'Đưa tỷ lệ hiển thị về mặc định (100%)',
  EXPORT_PNG_TEXT: 'Xuất PNG',
  SAVE_STUDIO_LOGGED_IN: 'Mở Studio',
  SAVE_STUDIO_GUEST: 'Lưu sơ đồ',
  SAVE_STUDIO_TOOLTIP_LOGGED_IN: 'Mở và biên tập trong Mindmap Studio cá nhân',
  SAVE_STUDIO_TOOLTIP_GUEST: 'Đăng nhập để lưu sơ đồ vào tài khoản',
  RESET_CONFIRM_TEXT: 'Bấm nữa để xoá',
  RESET_BTN_TEXT: 'Tạo mới',
  RESET_BTN_TITLE: 'Xoá các nhánh hiện tại để bắt đầu khám phá chủ đề mới',
} as const;

export interface SpatialCanvasToolbarProps {
  drawerOpen: boolean;
  quickPrompt: string;
  useGoogleSearch: boolean;
  zoom: number;
  hasReadyNodes: boolean;
  exportingPng: boolean;
  savingMindmap: boolean;
  isLoggedIn: boolean;
  confirmReset: boolean;
  onQuickPromptChange: (val: string) => void;
  onSubmitNewRoot: () => void;
  onToggleGoogleSearch: (next: boolean) => void;
  onToggleDrawer: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onExportPng: () => void;
  onSaveStudio: () => void;
  onResetCanvasClick: () => void;
}

export function SpatialCanvasToolbar({
  drawerOpen,
  quickPrompt,
  useGoogleSearch,
  zoom,
  hasReadyNodes,
  exportingPng,
  savingMindmap,
  isLoggedIn,
  confirmReset,
  onQuickPromptChange,
  onSubmitNewRoot,
  onToggleGoogleSearch,
  onToggleDrawer,
  onZoomIn,
  onZoomOut,
  onResetView,
  onExportPng,
  onSaveStudio,
  onResetCanvasClick,
}: SpatialCanvasToolbarProps) {
  return (
    <aside
      aria-label="Thanh công cụ Bản đồ Khái niệm"
      onPointerDown={(e) => e.stopPropagation()}
      className={`fixed top-[66px] right-2.5 left-2.5 z-30 mx-auto flex max-w-7xl items-center justify-between gap-1.5 rounded-2xl border border-[#D4AE67]/40 bg-[#FFFDF8]/95 px-2.5 py-1.5 shadow-[0_4px_20px_rgba(40,20,10,0.08)] backdrop-blur-md transition-all sm:top-20 sm:left-4 sm:gap-2.5 sm:px-3.5 sm:py-2 ${
        drawerOpen
          ? 'sm:right-4 md:right-[402px] xl:right-[452px]'
          : 'sm:right-4'
      }`}
    >
      {/* 1. Cụm Tìm kiếm chủ đề mới (Trái) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitNewRoot();
        }}
        className="flex min-w-[120px] flex-1 max-w-xs items-center gap-1.5 rounded-xl border border-[#E2D5B8] bg-white/90 px-2.5 py-1 shadow-2xs transition-all focus-within:border-[#7A1F24] focus-within:ring-1 focus-within:ring-[#7A1F24]/30 sm:min-w-[160px] sm:max-w-sm sm:gap-2 sm:px-3 sm:py-1.5"
      >
        <Search size={14} className="shrink-0 text-[#7A6B57]" />
        <input
          type="text"
          value={quickPrompt}
          onChange={(e) => onQuickPromptChange(e.target.value)}
          placeholder={SPATIAL_TOOLBAR_CONSTANTS.SEARCH_PLACEHOLDER}
          className="w-full bg-transparent text-xs font-medium text-[#1A120B] placeholder-[#8C775E] focus:outline-hidden"
        />
      </form>

      {/* 2. Cụm Tiện ích tra cứu & Điều khiển hiển thị (Giữa) */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        {/* Toggle Google Search */}
        <button
          type="button"
          role="switch"
          aria-checked={useGoogleSearch}
          data-testid="google-search-toggle"
          onClick={() => onToggleGoogleSearch(!useGoogleSearch)}
          title={
            useGoogleSearch
              ? SPATIAL_TOOLBAR_CONSTANTS.GOOGLE_ACTIVE_TITLE
              : SPATIAL_TOOLBAR_CONSTANTS.GOOGLE_INACTIVE_TITLE
          }
          className={`inline-flex cursor-pointer items-center gap-1 rounded-xl border px-2 py-1 text-xs font-semibold shadow-2xs transition-all sm:gap-1.5 sm:px-2.5 sm:py-1.5 ${
            useGoogleSearch
              ? 'border-[#B45309]/50 bg-[#FEF3C7] text-[#92400E]'
              : 'border-[#E2D5B8] bg-white/80 text-[#5C4632] hover:bg-[#F5EEDC]'
          }`}
        >
          <Globe
            size={13}
            className={useGoogleSearch ? 'text-[#D97706]' : 'text-[#8C775E]'}
          />
          <span className="hidden md:inline">Google</span>
          <span
            className={`rounded px-1 py-0.2 font-mono text-[9px] font-bold uppercase ${
              useGoogleSearch
                ? 'bg-[#B45309] text-white'
                : 'bg-[#E6D8BE] text-[#4A3520]'
            }`}
          >
            {useGoogleSearch ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Ngăn đọc tư liệu */}
        <button
          type="button"
          onClick={onToggleDrawer}
          title={SPATIAL_TOOLBAR_CONSTANTS.DRAWER_BTN_TITLE}
          className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#E2D5B8] bg-white/80 px-2 py-1 text-xs font-semibold text-[#14233F] shadow-2xs transition-all hover:bg-[#F5EEDC] sm:gap-1.5 sm:px-2.5 sm:py-1.5"
        >
          <BookOpen size={13} className="text-[#7A1F24]" />
          <span className="hidden sm:inline">
            {SPATIAL_TOOLBAR_CONSTANTS.DRAWER_BTN_TEXT}
          </span>
        </button>

        {/* Cụm Zoom Segmented Capsule */}
        <div className="flex items-center rounded-xl border border-[#E2D5B8] bg-white/80 px-1 py-0.5 shadow-2xs">
          <button
            type="button"
            aria-label="Thu nhỏ Canvas"
            onClick={onZoomOut}
            className="cursor-pointer rounded-lg p-1 text-[#5C4632] hover:bg-[#F5EEDC] transition-colors"
          >
            <Minus size={12} />
          </button>
          <button
            type="button"
            title={SPATIAL_TOOLBAR_CONSTANTS.ZOOM_RESET_TITLE}
            onClick={onResetView}
            className="min-w-[34px] cursor-pointer rounded-sm px-0.5 text-center font-mono text-[11px] font-bold text-[#14233F] hover:bg-[#F5EEDC] sm:min-w-[38px]"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            aria-label="Phóng to Canvas"
            onClick={onZoomIn}
            className="cursor-pointer rounded-lg p-1 text-[#5C4632] hover:bg-[#F5EEDC] transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* 3. Cụm Hành động: Xuất PNG, Mở Studio, Tạo mới (Phải) */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        {/* Nút Xuất PNG */}
        <button
          type="button"
          disabled={!hasReadyNodes || exportingPng}
          onClick={onExportPng}
          title={SPATIAL_TOOLBAR_CONSTANTS.EXPORT_PNG_TEXT}
          className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#E2D5B8] bg-white/80 px-2 py-1 text-xs font-semibold text-[#14233F] shadow-2xs transition-all hover:bg-[#F5EEDC] disabled:cursor-not-allowed disabled:opacity-40 sm:gap-1.5 sm:px-2.5 sm:py-1.5"
        >
          {exportingPng ? (
            <Loader2 size={13} className="animate-spin text-[#7A1F24]" />
          ) : (
            <Download size={13} className="text-[#7A1F24]" />
          )}
          <span className="hidden md:inline">
            {SPATIAL_TOOLBAR_CONSTANTS.EXPORT_PNG_TEXT}
          </span>
        </button>

        {/* Nút Mở Studio / Lưu */}
        <button
          type="button"
          disabled={!hasReadyNodes || savingMindmap}
          onClick={onSaveStudio}
          title={
            isLoggedIn
              ? SPATIAL_TOOLBAR_CONSTANTS.SAVE_STUDIO_TOOLTIP_LOGGED_IN
              : SPATIAL_TOOLBAR_CONSTANTS.SAVE_STUDIO_TOOLTIP_GUEST
          }
          className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#5E161A] px-2.5 py-1 text-xs font-bold text-[#FAF5E6] shadow-xs transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:gap-1.5 sm:px-3 sm:py-1.5"
        >
          {savingMindmap ? (
            <Loader2 size={13} className="animate-spin text-[#E7C77E]" />
          ) : (
            <Network size={13} className="text-[#E7C77E]" />
          )}
          <span>
            {isLoggedIn
              ? SPATIAL_TOOLBAR_CONSTANTS.SAVE_STUDIO_LOGGED_IN
              : SPATIAL_TOOLBAR_CONSTANTS.SAVE_STUDIO_GUEST}
          </span>
        </button>

        {/* Nút Tạo mới / Reset Canvas */}
        <button
          type="button"
          title={SPATIAL_TOOLBAR_CONSTANTS.RESET_BTN_TITLE}
          onClick={onResetCanvasClick}
          className={`inline-flex cursor-pointer items-center gap-1 rounded-xl border px-2 py-1 text-xs font-semibold shadow-2xs transition-all sm:px-2.5 sm:py-1.5 ${
            confirmReset
              ? 'border-[#B45309] bg-[#FEF08A] text-[#7A1F24] font-bold'
              : 'border-[#E2D5B8] bg-white/80 text-[#5C4632] hover:bg-[#F5EEDC]'
          }`}
        >
          <RotateCcw size={12} className={confirmReset ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">
            {confirmReset
              ? SPATIAL_TOOLBAR_CONSTANTS.RESET_CONFIRM_TEXT
              : SPATIAL_TOOLBAR_CONSTANTS.RESET_BTN_TEXT}
          </span>
        </button>
      </div>
    </aside>
  );
}
