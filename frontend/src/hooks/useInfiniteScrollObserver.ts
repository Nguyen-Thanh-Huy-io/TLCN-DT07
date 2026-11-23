'use client';

import { useEffect, useRef, useState } from 'react';

const DEFAULT_INFINITE_SCROLL_ROOT_MARGIN = '450px 0px';

export interface UseInfiniteScrollObserverParams {
  enabled: boolean;
  isLoading?: boolean;
  triggerKey: string | number;
  rootMargin?: string;
  onLoadMore: () => void;
}

/**
 * Gắn IntersectionObserver theo callback ref node để không bị hụt sentinel
 * khi danh sách chuyển trạng thái hoặc thay đổi kích thước theo bộ lọc.
 */
export function useInfiniteScrollObserver({
  enabled,
  isLoading = false,
  triggerKey,
  rootMargin = DEFAULT_INFINITE_SCROLL_ROOT_MARGIN,
  onLoadMore,
}: UseInfiniteScrollObserverParams) {
  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!sentinelEl || !enabled || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMoreRef.current();
        }
      },
      { rootMargin },
    );

    observer.observe(sentinelEl);
    return () => observer.disconnect();
  }, [sentinelEl, enabled, isLoading, rootMargin, triggerKey]);

  return setSentinelEl;
}
