'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Search, X } from 'lucide-react';
import { useInfiniteScrollObserver } from '@/features/community/hooks/useCommunityFeedHooks';
import {
  BLOG_INITIAL_TAG_LIMIT,
  BlogPostRow,
  BlogRowSkeletonList,
  BlogTagFilterBar,
  type BlogCardItem,
} from './BlogLandingParts';

export type BlogPostCardItem = BlogCardItem;

interface BlogBrowserProps {
  posts: BlogPostCardItem[];
  eyebrowLabel?: string;
  headingTitle?: string;
}

const BLOG_LIST_PAGE_SIZE = 6;
const LAZY_REVEAL_DELAY_MS = 180;

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function computeAvailableTags(posts: BlogPostCardItem[]) {
  const tagCounts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      const trimmed = tag.trim();
      if (trimmed) {
        tagCounts.set(trimmed, (tagCounts.get(trimmed) ?? 0) + 1);
      }
    }
  }

  return Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function computeVisibleTags(
  availableTags: { name: string; count: number }[],
  isTagsExpanded: boolean,
  selectedTag: string | null,
) {
  if (isTagsExpanded || availableTags.length <= BLOG_INITIAL_TAG_LIMIT) {
    return availableTags;
  }

  const topSlice = availableTags.slice(0, BLOG_INITIAL_TAG_LIMIT);

  if (
    selectedTag &&
    !topSlice.some((t) => t.name.toLowerCase() === selectedTag.toLowerCase())
  ) {
    const activeTag = availableTags.find(
      (t) => t.name.toLowerCase() === selectedTag.toLowerCase(),
    );
    if (activeTag) {
      return [...topSlice, activeTag];
    }
  }

  return topSlice;
}

function matchesBlogPost(
  post: BlogPostCardItem,
  selectedTag: string | null,
  normalizedQuery: string,
): boolean {
  if (selectedTag) {
    const hasTag = post.tags.some(
      (t) => t.toLowerCase() === selectedTag.toLowerCase(),
    );
    if (!hasTag) return false;
  }

  if (normalizedQuery) {
    const postSearchContent = `${post.title} ${post.excerpt} ${post.author}`;
    if (!normalizeSearch(postSearchContent).includes(normalizedQuery)) {
      return false;
    }
  }

  return true;
}

function filterBlogPosts(
  posts: BlogPostCardItem[],
  query: string,
  selectedTag: string | null,
): BlogPostCardItem[] {
  const normalizedQuery = normalizeSearch(query.trim());
  return posts.filter((post) =>
    matchesBlogPost(post, selectedTag, normalizedQuery),
  );
}

export function BlogBrowser({
  posts,
  eyebrowLabel = 'Bài mới nhất',
  headingTitle = 'Câu chuyện đang được đọc',
}: BlogBrowserProps) {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);

  const filterKey = `${query.trim().toLowerCase()}::${selectedTag ?? ''}::${posts.length}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  const [visibleCount, setVisibleCount] = useState(BLOG_LIST_PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(BLOG_LIST_PAGE_SIZE);
    setIsLoadingMore(false);
  }

  useEffect(() => {
    return () => {
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
        loadTimerRef.current = null;
      }
    };
  }, [filterKey]);

  const availableTags = useMemo(() => computeAvailableTags(posts), [posts]);

  const visibleTags = useMemo(
    () => computeVisibleTags(availableTags, isTagsExpanded, selectedTag),
    [availableTags, isTagsExpanded, selectedTag],
  );

  const filteredPosts = useMemo(
    () => filterBlogPosts(posts, query, selectedTag),
    [posts, query, selectedTag],
  );

  const isFiltering = query.trim().length > 0 || selectedTag !== null;
  const hasMore = visibleCount < filteredPosts.length;
  const remainingCount = Math.max(0, filteredPosts.length - visibleCount);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || visibleCount >= filteredPosts.length) return;
    setIsLoadingMore(true);
    loadTimerRef.current = setTimeout(() => {
      setVisibleCount((prev) =>
        Math.min(prev + BLOG_LIST_PAGE_SIZE, filteredPosts.length),
      );
      setIsLoadingMore(false);
      loadTimerRef.current = null;
    }, LAZY_REVEAL_DELAY_MS);
  }, [filteredPosts.length, isLoadingMore, visibleCount]);

  const sentinelRef = useInfiniteScrollObserver({
    enabled: hasMore,
    isLoading: isLoadingMore,
    triggerKey: visibleCount,
    rootMargin: '400px 0px',
    onLoadMore: handleLoadMore,
  });

  const handleResetFilters = () => {
    setQuery('');
    setSelectedTag(null);
  };

  const visiblePosts = filteredPosts.slice(0, visibleCount);

  return (
    <section className="space-y-6">
      {/* Tiêu đề & Ô tìm kiếm */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a4d2d]">
            {eyebrowLabel}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-heading)] text-3xl text-[#1f2a2b] md:text-4xl">
            {headingTitle}
          </h2>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="relative w-full md:w-80">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7d5d3d]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên bài viết, tóm tắt..."
            className="w-full rounded-full border border-[#d7c7b2] bg-[#fffdf9] py-2.5 pl-10 pr-10 text-sm text-[#1f2a2b] placeholder-[#8a7a6c] outline-none transition focus:border-[#8a4d2d] focus:ring-1 focus:ring-[#8a4d2d]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a7a6c] transition hover:text-[#1f2a2b]"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Thanh lọc thẻ Tag */}
      <BlogTagFilterBar
        availableTags={availableTags}
        visibleTags={visibleTags}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        isTagsExpanded={isTagsExpanded}
        onToggleExpand={() => setIsTagsExpanded((prev) => !prev)}
        isFiltering={isFiltering}
        onResetFilters={handleResetFilters}
      />

      {/* Thông tin số lượng bài viết khi có tìm kiếm / lọc */}
      {isFiltering ? (
        <div className="flex items-center justify-between text-xs text-[#536560]">
          <p>
            Tìm thấy{' '}
            <strong className="font-semibold text-[#1f2a2b]">
              {filteredPosts.length}
            </strong>{' '}
            bài viết{' '}
            {selectedTag ? (
              <span>
                với thẻ{' '}
                <span className="font-semibold text-[#8a4d2d]">
                  #{selectedTag}
                </span>
              </span>
            ) : null}
            {query.trim() ? (
              <span>
                {' '}
                cho từ khóa &ldquo;
                <span className="font-semibold text-[#1f2a2b]">
                  {query.trim()}
                </span>
                &rdquo;
              </span>
            ) : null}
          </p>
        </div>
      ) : null}

      {/* Danh sách 1 bài / 1 hàng + Lazy Loading */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[#d7c7b2] bg-[#fffdf9]/80 p-12 text-center shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#8a4d2d]">
            Không tìm thấy
          </p>
          <h3 className="mb-3 font-[family-name:var(--font-heading)] text-2xl text-[#1f2a2b]">
            Không có bài viết nào phù hợp
          </h3>
          <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-[#536560]">
            Không tìm thấy bài viết nào khớp với điều kiện tìm kiếm hoặc thẻ tag
            hiện tại. Bạn vui lòng thử lại với từ khóa khác.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 rounded-full bg-[#1f2a2b] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-[#f7f1e7] transition hover:bg-[#8a4d2d]"
          >
            <RotateCcw size={14} />
            <span>Xóa bộ lọc & Xem tất cả</span>
          </button>
        </div>
      ) : (
        <div className="rounded-[24px] border border-[#d7c7b2] bg-[#fffdf9] px-5 shadow-[0_16px_30px_rgba(31,42,43,0.05)] md:px-7">
          <div className="divide-y divide-[#e8dccb]">
            {visiblePosts.map((post, index) => (
              <BlogPostRow
                key={post.slug}
                post={post}
                priorityImage={index === 0}
              />
            ))}
          </div>

          {hasMore || isLoadingMore ? (
            <div ref={sentinelRef}>
              {isLoadingMore ? (
                <BlogRowSkeletonList count={Math.min(2, remainingCount || 2)} />
              ) : (
                <div className="border-t border-[#e8dccb] py-5 text-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="inline-flex h-10 items-center rounded-full border border-[#d7c7b2] bg-[#f7f1e7] px-6 text-xs font-bold uppercase tracking-[0.14em] text-[#1f2a2b] transition hover:border-[#8a4d2d] hover:text-[#8a4d2d] cursor-pointer"
                  >
                    Tải thêm bài viết ({remainingCount} bài còn lại)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="border-t border-[#e8dccb] py-4 text-center text-xs text-[#7d5d3d]">
              Đã hiển thị tất cả {filteredPosts.length} bài viết.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
