'use client';

import React from 'react';
import {
  PanelLeft,
  Compass,
  Type,
  Printer,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export enum TextSizeLevel {
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
}

interface EntityReadingToolbarProps {
  isTocOpen: boolean;
  isTimelineOpen: boolean;
  isFocusMode: boolean;
  hasTimeline: boolean;
  readProgress: number;
  textSize: TextSizeLevel;
  onToggleToc: () => void;
  onToggleTimeline: () => void;
  onToggleFocusMode: () => void;
  onTextSizeChange: (size: TextSizeLevel) => void;
  onPrint: () => void;
}

export function EntityReadingToolbar({
  isTocOpen,
  isTimelineOpen,
  isFocusMode,
  hasTimeline,
  readProgress,
  textSize,
  onToggleToc,
  onToggleTimeline,
  onToggleFocusMode,
  onTextSizeChange,
  onPrint,
}: EntityReadingToolbarProps) {
  return (
    <div className="ue-reading-toolbar">
      <div className="ue-toolbar-group left">
        <span className="ue-toolbar-label">KHÔNG GIAN ĐỌC</span>

        <button
          type="button"
          onClick={onToggleToc}
          className={`ue-toolbar-btn ${isTocOpen ? 'active' : ''}`}
          title={isTocOpen ? 'Thu gọn mục lục để mở rộng bài đọc' : 'Mở mục lục tư liệu'}
        >
          <PanelLeft size={14} />
          <span>Mục lục</span>
          <span className={`ue-toolbar-dot ${isTocOpen ? 'on' : 'off'}`} />
        </button>

        {hasTimeline && (
          <button
            type="button"
            onClick={onToggleTimeline}
            className={`ue-toolbar-btn ${isTimelineOpen ? 'active' : ''}`}
            title={isTimelineOpen ? 'Thu gọn tiến trình' : 'Mở tiến trình lịch sử'}
          >
            <Compass size={14} />
            <span>Tiến trình</span>
            <span className={`ue-toolbar-dot ${isTimelineOpen ? 'on' : 'off'}`} />
          </button>
        )}
      </div>

      {/* TIẾN ĐỘ ĐỌC TRỰC QUAN */}
      <div className="ue-toolbar-group center hidden md:flex items-center gap-2">
        <div className="ue-progress-track">
          <div
            className="ue-progress-fill"
            style={{ width: `${readProgress}%` }}
          />
        </div>
        <span className="ue-progress-text">{readProgress}% hoàn thành</span>
      </div>

      <div className="ue-toolbar-group right">
        {/* BỘ CHỈNH CỠ CHỮ */}
        <div className="ue-font-size-ctrl" title="Tùy chỉnh cỡ chữ">
          <Type size={13} className="text-[#8C6239] mr-1" />
          <button
            type="button"
            onClick={() => onTextSizeChange(TextSizeLevel.SM)}
            className={`ue-size-btn ${textSize === TextSizeLevel.SM ? 'active' : ''}`}
            title="Cỡ chữ nhỏ"
          >
            A-
          </button>
          <button
            type="button"
            onClick={() => onTextSizeChange(TextSizeLevel.MD)}
            className={`ue-size-btn ${textSize === TextSizeLevel.MD ? 'active' : ''}`}
            title="Cỡ chữ tiêu chuẩn"
          >
            A
          </button>
          <button
            type="button"
            onClick={() => onTextSizeChange(TextSizeLevel.LG)}
            className={`ue-size-btn ${textSize === TextSizeLevel.LG ? 'active' : ''}`}
            title="Cỡ chữ lớn"
          >
            A+
          </button>
        </div>

        {/* IN ẤN TƯ LIỆU */}
        <button
          type="button"
          onClick={onPrint}
          className="ue-toolbar-btn hidden sm:inline-flex"
          title="In hoặc lưu hồ sơ dạng PDF"
        >
          <Printer size={14} />
          <span className="hidden lg:inline">In hồ sơ</span>
        </button>

        {/* CHẾ ĐỘ ĐỌC TOÀN CẢNH */}
        <button
          type="button"
          onClick={onToggleFocusMode}
          className={`ue-toolbar-btn focus-mode-btn ${isFocusMode ? 'focus-active' : ''}`}
          title={isFocusMode ? 'Trở về bố cục 3 cột chuẩn' : 'Bật chế độ đọc toàn cảnh'}
        >
          {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          <span>{isFocusMode ? 'Thu nhỏ' : 'Toàn cảnh'}</span>
        </button>
      </div>
    </div>
  );
}
