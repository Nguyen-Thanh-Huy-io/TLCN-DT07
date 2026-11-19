'use client';

import { useCallback, useState } from 'react';
import { MINDMAP_CANVAS } from '../constants/mindmap.constants';
import type { MindmapGraph } from '../services/mindmap.service';

export function useMindmapHistory() {
  const [past, setPast] = useState<MindmapGraph[]>([]);
  const [future, setFuture] = useState<MindmapGraph[]>([]);

  const recordSnapshot = useCallback((snapshot: MindmapGraph) => {
    setPast((prev) => [...prev.slice(-(MINDMAP_CANVAS.MAX_HISTORY - 1)), snapshot]);
    setFuture([]);
  }, []);

  const stepUndo = useCallback(
    (current: MindmapGraph): MindmapGraph | null => {
      if (past.length === 0) return null;
      const previous = past[past.length - 1];
      setPast((prev) => prev.slice(0, -1));
      setFuture((prev) => [current, ...prev.slice(0, MINDMAP_CANVAS.MAX_HISTORY - 1)]);
      return previous;
    },
    [past],
  );

  const stepRedo = useCallback(
    (current: MindmapGraph): MindmapGraph | null => {
      if (future.length === 0) return null;
      const next = future[0];
      setFuture((prev) => prev.slice(1));
      setPast((prev) => [...prev.slice(-(MINDMAP_CANVAS.MAX_HISTORY - 1)), current]);
      return next;
    },
    [future],
  );

  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    recordSnapshot,
    stepUndo,
    stepRedo,
  };
}
