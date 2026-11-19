'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { NodeRectSize } from '../utils/mindmap-layout.strategy';

/** Theo dõi kích thước logic (chưa nhân zoom) của từng Node DOM bằng ResizeObserver. */
export function useMeasuredNodeSizes(nodeSignature: string) {
  const [sizes, setSizes] = useState<Map<string, NodeRectSize>>(() => new Map());
  const elementMapRef = useRef<Map<string, HTMLElement>>(new Map());
  const observerRef = useRef<ResizeObserver | null>(null);

  const measureElement = useCallback((id: string, el: HTMLElement) => {
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    if (width <= 0 || height <= 0) return;

    setSizes((prev) => {
      const curr = prev.get(id);
      if (curr && Math.abs(curr.width - width) <= 1 && Math.abs(curr.height - height) <= 1) {
        return prev;
      }
      const next = new Map(prev);
      next.set(id, { width, height });
      return next;
    });
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const id = el.dataset.mindmapNodeId;
        if (id) measureElement(id, el);
      }
    });
    observerRef.current = observer;

    for (const [id, el] of elementMapRef.current.entries()) {
      observer.observe(el);
      measureElement(id, el);
    }

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [measureElement, nodeSignature]);

  const registerNodeRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      const prevEl = elementMapRef.current.get(id);
      if (prevEl && prevEl !== el) {
        observerRef.current?.unobserve(prevEl);
      }
      if (!el) {
        elementMapRef.current.delete(id);
        return;
      }
      elementMapRef.current.set(id, el);
      observerRef.current?.observe(el);
      measureElement(id, el);
    },
    [measureElement],
  );

  return { sizes, registerNodeRef };
}
