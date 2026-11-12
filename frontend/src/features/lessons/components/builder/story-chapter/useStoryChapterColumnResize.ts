'use client';

import React from 'react';
import {
  EditorialColumnRatio,
} from '../../../types/block-builder.types';

interface UseStoryChapterColumnResizeProps {
  currentRatio?: EditorialColumnRatio;
  onUpdateColumnRatio: (nextRatio: EditorialColumnRatio) => void;
}

export function useStoryChapterColumnResize({
  currentRatio = '6_6',
  onUpdateColumnRatio,
}: UseStoryChapterColumnResizeProps) {
  const handleStartColumnResize = (
    e: React.MouseEvent<HTMLDivElement>,
    gridEl: HTMLElement | null
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!gridEl) return;
    const rect = gridEl.getBoundingClientRect();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const relX = (moveEvent.clientX - rect.left) / Math.max(1, rect.width);
      let nextRatio: EditorialColumnRatio = '6_6';
      if (relX < 0.38) nextRatio = '4_8';
      else if (relX < 0.46) nextRatio = '5_7';
      else if (relX < 0.54) nextRatio = '6_6';
      else if (relX < 0.62) nextRatio = '7_5';
      else nextRatio = '8_4';

      if (nextRatio !== currentRatio) {
        onUpdateColumnRatio(nextRatio);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return { handleStartColumnResize };
}
