'use client';

import { useCallback, useEffect, useState } from 'react';

/** Bố cục 3 cột của trang đọc bài viết (mục lục / bài / tiến trình), nhớ lựa chọn trong localStorage. */
const READING_LAYOUT_STORAGE_KEY = 'hisgo_reading_layout_mode_v1';

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

interface SavedReadingLayout {
  isTocOpen?: boolean;
  isTimelineOpen?: boolean;
}

function readSavedLayout(): SavedReadingLayout | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(READING_LAYOUT_STORAGE_KEY) ?? 'null');
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      isTocOpen: 'isTocOpen' in parsed && typeof parsed.isTocOpen === 'boolean' ? parsed.isTocOpen : undefined,
      isTimelineOpen:
        'isTimelineOpen' in parsed && typeof parsed.isTimelineOpen === 'boolean' ? parsed.isTimelineOpen : undefined,
    };
  } catch {
    // Storage bị chặn hoặc dữ liệu hỏng → dùng bố cục mặc định.
    return null;
  }
}

/** Ít hơn bấy nhiêu đề mục thì mục lục không giúp gì → ẩn cột mục lục. */
export const MIN_TOC_ENTRIES = 2;

export function useReadingLayout(hasTimeline: boolean = true, hasToc: boolean = true): ReadingLayoutState {
  const [tocPreferred, setIsTocOpen] = useState<boolean>(true);
  const isTocOpen = hasToc && tocPreferred;
  const [isTimelineOpen, setIsTimelineOpen] = useState<boolean>(hasTimeline);

  // Khôi phục tuỳ chọn SAU khi hydrate: đọc localStorage ngay trong useState khiến HTML server
  // (bố cục mặc định) lệch với lần render đầu ở client → lỗi hydration.
  useEffect(() => {
    const saved = readSavedLayout();
    if (!saved) return;
    void Promise.resolve().then(() => {
      if (saved.isTocOpen !== undefined) setIsTocOpen(saved.isTocOpen);
      if (saved.isTimelineOpen !== undefined) setIsTimelineOpen(saved.isTimelineOpen);
    });
  }, []);

  // Đồng bộ lại khi `hasTimeline` thay đổi
  useEffect(() => {
    if (!hasTimeline) {
      void Promise.resolve().then(() => {
        setIsTimelineOpen(false);
      });
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
