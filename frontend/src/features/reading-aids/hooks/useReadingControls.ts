'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  readSavedReadingPrefs,
  READING_PREFS_STORAGE_KEY,
  type ReadingDisplayControls,
  type ReadingPreferences,
} from '../components/ReadingAidsParts';

export interface UseReadingControlsResult {
  prefs: ReadingPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<ReadingPreferences>>;
  handleChangePrefs: (updates: Partial<ReadingPreferences>) => void;
  focusMode: boolean;
  setFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
  readProgress: number;
  handlePrint: () => void;
  readingControls: ReadingDisplayControls;
}

export function useReadingControls(): UseReadingControlsResult {
  const [prefs, setPrefs] = useState<ReadingPreferences>(() => readSavedReadingPrefs());
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [readProgress, setReadProgress] = useState<number>(0);

  useEffect(() => {
    document.body.classList.toggle('ue-focus-mode-body', focusMode);
    return () => {
      document.body.classList.remove('ue-focus-mode-body');
    };
  }, [focusMode]);

  const handleChangePrefs = useCallback((updates: Partial<ReadingPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(READING_PREFS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Bỏ qua lỗi storage ở chế độ ẩn danh.
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setReadProgress(Math.round(currentProgress));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePrint = useCallback(() => window.print(), []);

  const readingControls: ReadingDisplayControls = useMemo(
    () => ({
      prefs,
      onChangePrefs: handleChangePrefs,
      focusMode,
      onToggleFocusMode: () => setFocusMode((v) => !v),
      readProgress,
      onPrint: handlePrint,
    }),
    [prefs, handleChangePrefs, focusMode, readProgress, handlePrint],
  );

  return {
    prefs,
    setPrefs,
    handleChangePrefs,
    focusMode,
    setFocusMode,
    readProgress,
    handlePrint,
    readingControls,
  };
}
