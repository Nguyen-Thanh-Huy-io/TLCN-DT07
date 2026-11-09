'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { CalendarDays, Sparkles, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

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
