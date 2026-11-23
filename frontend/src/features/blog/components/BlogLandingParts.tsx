'use client';

import Link from 'next/link';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Tag as TagIcon,
} from 'lucide-react';

// === BlogComposerBar.tsx ===
export function BlogComposerBar() {
  const currentUser = useAuthSession();
  const name = currentUser?.displayName?.trim() || currentUser?.username?.trim() || 'Bạn';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U';

  return (
    <div className="mb-8 rounded-[28px] border border-[#d8d0c5] bg-[#f4efe9] p-3 shadow-[0_12px_28px_rgba(32,29,20,0.06)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f3e2c8] to-[#d0d9d2] text-sm font-bold text-[#2a352f] shadow-inner">
          {initials}
        </div>

        <Link
          href="/blog/create"
          className="flex flex-1 items-center rounded-full border border-[#ddd2c5] bg-[#f7f2ea] px-4 py-3 text-left text-base text-[#6a6b69] transition hover:border-[#b9804b] hover:text-[#2d352f]"
        >
          What&apos;s on your mind, {name}?
        </Link>
      </div>
    </div>
  );
}

// === BlogFeaturedSlider.tsx ===
export interface BlogCardItem {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  image: string;
  accent: string;
  featured: boolean;
  viewCount?: number;
  tags: string[];
}

interface BlogFeaturedSliderProps {
  posts: BlogCardItem[];
  autoPlayInterval?: number; // 10000ms = 10s
}

export function BlogFeaturedSlider({
  posts,
  autoPlayInterval = 10000,
}: BlogFeaturedSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isManualPaused, setIsManualPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const total = posts.length;

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
    setProgress(0);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    setProgress(0);
  }, [total]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  // Bộ đếm thời gian 10s tự động chuyển bài
  useEffect(() => {
    if (total <= 1 || isPaused || isManualPaused) {
      return;
    }

    const stepMs = 100;
    const increment = (stepMs / autoPlayInterval) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => clearInterval(timer);
  }, [total, isPaused, isManualPaused, autoPlayInterval, handleNext]);

  // Hỗ trợ vuốt chạm (Touch Swipe) trên màn hình cảm ứng
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) {
      return;
    }
    const diff = touchStartXRef.current - touchEndXRef.current;
    const threshold = 40;
    if (diff > threshold) {
      handleNext();
    } else if (diff < -threshold) {
      handlePrev();
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  if (!posts || posts.length === 0) {
    return null;
  }

  const currentPost = posts[currentIndex] || posts[0];
  const canSlide = total > 1;

  return (
    <article
      className="group relative overflow-hidden rounded-[28px] border border-[#d7c7b2] bg-[#fffdf9] shadow-[0_24px_50px_rgba(31,42,43,0.08)] transition-all"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Vùng Ảnh bìa bài viết */}
      <div className="relative h-72 w-full overflow-hidden md:h-96">
        <Link href={`/blog/${currentPost.slug}`} className="block h-full w-full">
          {currentPost.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentPost.image}
              alt={currentPost.title}
              key={currentPost.slug}
              className="h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div
              key={currentPost.slug}
              className={`h-full w-full bg-gradient-to-br ${currentPost.accent} transition-all duration-700`}
            />
          )}
        </Link>

        {/* Lớp phủ Gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/20" />

        {/* Badge chuyên mục và chế độ tự động */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 md:p-6">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/30 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white backdrop-blur-sm">
              {currentPost.category}
            </span>
            {currentPost.tags.length > 0 ? (
              <span className="hidden sm:inline-block rounded-full border border-white/30 bg-black/30 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm">
                #{currentPost.tags[0]}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
              <Sparkles size={12} className="text-[#e2c79f]" />
              {canSlide ? `${currentIndex + 1} / ${total}` : 'Bài nổi bật'}
            </span>
          </div>
        </div>

        {/* Nút điều khiển Slide nhanh trên ảnh */}
        {canSlide ? (
          <div className="absolute inset-y-0 inset-x-3 flex items-center justify-between pointer-events-none">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handlePrev();
              }}
              className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/60 hover:scale-110 active:scale-95"
              title="Bài trước (trượt trái)"
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleNext();
              }}
              className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/60 hover:scale-110 active:scale-95"
              title="Bài kế tiếp (trượt phải)"
              aria-label="Next slide"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        ) : null}
      </div>

      {/* Thanh tiến trình chạy 10 giây đổi bài */}
      {canSlide && !isManualPaused ? (
        <div className="h-1 w-full overflow-hidden bg-[#efe3d8]">
          <div
            className="h-full bg-[#8a4d2d] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      {/* Vùng Thông tin nội dung */}
      <div className="p-6 md:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.12em] text-[#6d7a75]">
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={14} className="text-[#8a4d2d]" /> {currentPost.date}
          </span>

          {canSlide ? (
            <button
              type="button"
              onClick={() => setIsManualPaused((prev) => !prev)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#d7c7b2] bg-[#fffdf9] text-[#1f2a2b] transition hover:border-[#8a4d2d] hover:text-[#8a4d2d]"
              title={isManualPaused ? 'Bật tự động chuyển' : 'Tạm dừng tự động chuyển'}
              aria-label={isManualPaused ? 'Play' : 'Pause'}
            >
              {isManualPaused ? <Play size={10} className="ml-0.5" /> : <Pause size={10} />}
            </button>
          ) : null}
        </div>

        <h2 className="mb-4 max-w-3xl font-[family-name:var(--font-heading)] text-3xl leading-tight text-[#1d2b2a] transition hover:text-[#8a4d2d] md:text-5xl">
          <Link href={`/blog/${currentPost.slug}`}>{currentPost.title}</Link>
        </h2>

        <p className="mb-6 max-w-2xl text-base leading-8 text-[#465c59] line-clamp-3">
          {currentPost.excerpt}
        </p>

        <div className="flex flex-col gap-4 border-t border-[#efe3d8] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-[#536560]">
            Viết bởi{' '}
            <Link
              href={`/blog?author=${encodeURIComponent(currentPost.author)}`}
              className="font-semibold text-[#1f2a2b] transition hover:text-[#8a4d2d] hover:underline"
            >
              {currentPost.author}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Chấm tròn phân trang (Dots) */}
            {canSlide ? (
              <div className="flex items-center gap-1.5">
                {posts.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentIndex === idx
                        ? 'w-6 bg-[#8a4d2d]'
                        : 'w-2 bg-[#d7c7b2] hover:bg-[#8a4d2d]/60'
                    }`}
                    aria-label={`Trượt tới bài ${idx + 1}`}
                  />
                ))}
              </div>
            ) : null}

            <Link
              href={`/blog/${currentPost.slug}`}
              className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a4d2d] hover:underline"
            >
              Đọc toàn bộ →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

// === BlogBrowser Sub-components (Toolbar Filter & 1-Post-Per-Row List) ===
export const BLOG_INITIAL_TAG_LIMIT = 8;

export interface BlogTagFilterBarProps {
  availableTags: { name: string; count: number }[];
  visibleTags: { name: string; count: number }[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  isTagsExpanded: boolean;
  onToggleExpand: () => void;
  isFiltering: boolean;
  onResetFilters: () => void;
}

export function BlogTagFilterBar({
  availableTags,
  visibleTags,
  selectedTag,
  onSelectTag,
  isTagsExpanded,
  onToggleExpand,
  isFiltering,
  onResetFilters,
}: BlogTagFilterBarProps) {
  if (availableTags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <div className="mr-1 flex items-center gap-1.5 text-xs font-semibold text-[#7d5d3d]">
        <TagIcon size={14} />
        <span>Chủ đề:</span>
      </div>

      <button
        type="button"
        onClick={() => onSelectTag(null)}
        className={`rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide transition ${
          selectedTag === null
            ? 'bg-[#1f2a2b] text-[#f7f1e7] shadow-sm'
            : 'border border-[#d7c7b2] bg-[#fffdf9] text-[#536560] hover:border-[#8a4d2d] hover:text-[#1f2a2b]'
        }`}
      >
        Tất cả
      </button>

      {visibleTags.map((tag) => {
        const isSelected = selectedTag?.toLowerCase() === tag.name.toLowerCase();
        return (
          <button
            key={tag.name}
            type="button"
            onClick={() => onSelectTag(isSelected ? null : tag.name)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide transition ${
              isSelected
                ? 'bg-[#8a4d2d] text-white shadow-sm'
                : 'border border-[#d7c7b2] bg-[#fffdf9] text-[#536560] hover:border-[#8a4d2d] hover:text-[#1f2a2b]'
            }`}
          >
            <span>#{tag.name}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-[#efe3d8] text-[#7d5d3d]'
              }`}
            >
              {tag.count}
            </span>
          </button>
        );
      })}

      {availableTags.length > BLOG_INITIAL_TAG_LIMIT ? (
        <button
          type="button"
          onClick={onToggleExpand}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#d7c7b2] bg-[#fffdf9] px-3 py-1 text-xs font-semibold text-[#8a4d2d] transition hover:border-[#8a4d2d] hover:bg-[#efe3d8]/40"
        >
          {isTagsExpanded ? (
            <>
              <ChevronUp size={13} />
              <span>Thu gọn</span>
            </>
          ) : (
            <>
              <ChevronDown size={13} />
              <span>+{availableTags.length - BLOG_INITIAL_TAG_LIMIT} chủ đề khác</span>
            </>
          )}
        </button>
      ) : null}

      {isFiltering ? (
        <button
          type="button"
          onClick={onResetFilters}
          className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-[#8a4d2d] hover:underline"
        >
          <RotateCcw size={12} />
          <span>Đặt lại bộ lọc</span>
        </button>
      ) : null}
    </div>
  );
}

export function BlogPostRow({
  post,
  priorityImage,
}: {
  post: BlogCardItem;
  priorityImage: boolean;
}) {
  return (
    <article className="group flex flex-col gap-5 py-6 sm:flex-row sm:items-start sm:gap-7">
      <Link
        href={`/blog/${post.slug}`}
        className="relative block aspect-[16/10] w-full shrink-0 overflow-hidden rounded-[14px] border border-[#e6d9c7] bg-[#efe5d2] sm:w-[270px] md:w-[340px] lg:w-[370px]"
      >
        {post.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={post.image}
            alt={post.title}
            loading={priorityImage ? 'eager' : 'lazy'}
            decoding="async"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${post.accent}`} />
        )}
        {post.tags.length > 0 ? (
          <span className="absolute bottom-2.5 left-2.5 rounded-full border border-white/30 bg-black/45 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
            #{post.tags[0]}
          </span>
        ) : null}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#7d5d3d]">
          <time className="italic">{post.date}</time>
          <span>•</span>
          <span className="font-semibold uppercase tracking-[0.12em]">
            {post.category}
          </span>
        </div>

        <h3 className="mt-1.5 font-[family-name:var(--font-heading)] text-xl font-bold leading-snug text-[#1f2a2b] transition-colors group-hover:text-[#8a4d2d] md:text-[26px]">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>

        <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-[#4f5d59] md:text-[15px]">
          {post.excerpt}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            {typeof post.viewCount === 'number' ? (
              <span
                className="relative inline-flex items-center"
                title={`${post.viewCount} lượt đọc`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2d4bf] bg-[#f7f1e7] text-[#536560]">
                  <Eye size={14} />
                </span>
                <span className="-ml-2 -mt-5 rounded-full bg-[#68b62c] px-2 py-0.5 text-[11px] font-bold leading-none text-white tabular-nums shadow-xs">
                  {post.viewCount}
                </span>
              </span>
            ) : null}

            <Link
              href={`/blog?author=${encodeURIComponent(post.author)}`}
              className="text-xs font-medium uppercase tracking-[0.12em] text-[#536560] transition hover:text-[#8a4d2d] hover:underline"
            >
              {post.author}
            </Link>
          </div>

          <Link
            href={`/blog/${post.slug}`}
            className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a4d2d] hover:underline"
          >
            Đọc bài →
          </Link>
        </div>
      </div>
    </article>
  );
}

export function BlogRowSkeletonList({ count = 2 }: { count?: number }) {
  return (
    <div
      className="divide-y divide-[#e8dccb] border-t border-[#e8dccb]"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex animate-pulse flex-col gap-5 py-6 sm:flex-row sm:items-start sm:gap-7"
        >
          <div className="aspect-[16/10] w-full shrink-0 rounded-[14px] bg-[#efe5d2] sm:w-[270px] md:w-[340px] lg:w-[370px]" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-3.5 w-32 rounded bg-[#efe5d2]" />
            <div className="h-6 w-3/4 rounded bg-[#e8dccb]" />
            <div className="h-4 w-full rounded bg-[#f3eadc]" />
            <div className="h-4 w-2/3 rounded bg-[#f3eadc]" />
          </div>
        </div>
      ))}
    </div>
  );
}
