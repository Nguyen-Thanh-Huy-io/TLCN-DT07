'use client';

import { useState, useCallback, useEffect } from 'react';

export enum ReadingLayoutMode {
  DEFAULT = 'DEFAULT',           // 3 cột (TOC + Bài đọc + Tiến trình)
  FOCUS = 'FOCUS',               // Đọc tập trung (Ẩn cả 2, bài đọc bung tối đa)
  TOC_ONLY = 'TOC_ONLY',         // Chỉ hiển thị Mục lục + Bài đọc
  TIMELINE_ONLY = 'TIMELINE_ONLY'// Chỉ hiển thị Tiến trình + Bài đọc
}

export const READING_LAYOUT_STORAGE_KEY = 'hisgo_reading_layout_mode_v1';

export interface ReadingLayoutState {
  isTocOpen: boolean;
  isTimelineOpen: boolean;
  isFocusMode: boolean;
  layoutClass: string;
  toggleToc: () => void;
  toggleTimeline: () => void;
  toggleFocusMode: () => void;
  resetDefault: () => void;
}

export function useReadingLayout(hasTimeline: boolean = true): ReadingLayoutState {
  const [isTocOpen, setIsTocOpen] = useState<boolean>(true);
  const [isTimelineOpen, setIsTimelineOpen] = useState<boolean>(hasTimeline);

  // Khôi phục tùy chọn đọc từ localStorage nếu có
  useEffect(() => {
    try {
      const saved = localStorage.getItem(READING_LAYOUT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.isTocOpen === 'boolean') {
          setIsTocOpen(parsed.isTocOpen);
        }
        if (typeof parsed.isTimelineOpen === 'boolean') {
          setIsTimelineOpen(hasTimeline && parsed.isTimelineOpen);
        }
      }
    } catch {
      // Bỏ qua lỗi truy cập storage
    }
  }, [hasTimeline]);

  // Lưu tùy chọn đọc
  const persistState = useCallback((toc: boolean, timeline: boolean) => {
    try {
      localStorage.setItem(
        READING_LAYOUT_STORAGE_KEY,
        JSON.stringify({ isTocOpen: toc, isTimelineOpen: timeline })
      );
    } catch {
      // Bỏ qua lỗi quota/storage
    }
  }, []);

  const toggleToc = useCallback(() => {
    setIsTocOpen((prev) => {
      const next = !prev;
      persistState(next, isTimelineOpen);
      return next;
    });
  }, [isTimelineOpen, persistState]);

  const toggleTimeline = useCallback(() => {
    if (!hasTimeline) return;
    setIsTimelineOpen((prev) => {
      const next = !prev;
      persistState(isTocOpen, next);
      return next;
    });
  }, [hasTimeline, isTocOpen, persistState]);

  const isFocusMode = !isTocOpen && (!hasTimeline || !isTimelineOpen);

  const toggleFocusMode = useCallback(() => {
    if (isFocusMode) {
      // Thoát chế độ tập trung: Phục hồi 3 cột mặc định
      setIsTocOpen(true);
      if (hasTimeline) setIsTimelineOpen(true);
      persistState(true, hasTimeline);
    } else {
      // Bật chế độ tập trung: Ẩn cả 2 bên để bài đọc bung cực đại
      setIsTocOpen(false);
      setIsTimelineOpen(false);
      persistState(false, false);
    }
  }, [isFocusMode, hasTimeline, persistState]);

  const resetDefault = useCallback(() => {
    setIsTocOpen(true);
    if (hasTimeline) setIsTimelineOpen(true);
    persistState(true, hasTimeline);
  }, [hasTimeline, persistState]);

  // Tính toán dynamic CSS class cho Grid Container
  let layoutClass = 'ue-layout-with-both';
  if (!isTocOpen && !isTimelineOpen) {
    layoutClass = 'ue-layout-focus-mode';
  } else if (!isTocOpen && isTimelineOpen) {
    layoutClass = 'ue-layout-timeline-only';
  } else if (isTocOpen && !isTimelineOpen) {
    layoutClass = 'ue-layout-toc-only';
  }

  return {
    isTocOpen,
    isTimelineOpen: hasTimeline && isTimelineOpen,
    isFocusMode,
    layoutClass,
    toggleToc,
    toggleTimeline,
    toggleFocusMode,
    resetDefault,
  };
}
