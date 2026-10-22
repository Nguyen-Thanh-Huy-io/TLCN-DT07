'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'hisgo:curriculum:completed-lessons';
const EMPTY = '[]';
const listeners = new Set<() => void>();

function readRaw(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

function parse(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * Bài đã hoàn thành của người đọc hiện tại. Trang công khai không có tài khoản người học,
 * nên tiến độ chỉ lưu trên trình duyệt này (localStorage) — mất khi xóa dữ liệu trang.
 */
export function useLessonProgress() {
  // Server snapshot is empty so server and first client render match.
  const raw = useSyncExternalStore(subscribe, readRaw, () => EMPTY);
  const completedIds = useMemo(() => parse(raw), [raw]);

  const markCompleted = useCallback((lessonId: string) => {
    const current = parse(readRaw());
    if (current.includes(lessonId)) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, lessonId]));
    } catch {
      return; // Trình duyệt chặn lưu trữ: không ghi được tiến độ.
    }
    listeners.forEach((notify) => notify());
  }, []);

  const isCompleted = useCallback((lessonId: string) => completedIds.includes(lessonId), [completedIds]);

  return { completedIds, isCompleted, markCompleted };
}
