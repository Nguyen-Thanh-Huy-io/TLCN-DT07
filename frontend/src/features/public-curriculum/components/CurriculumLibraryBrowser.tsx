'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Hash, Search, Tag as TagIcon } from 'lucide-react';
import type { LibraryLesson } from '@/services/entities/learner.service';
import {
  DEFAULT_COVER_IMAGES,
  PUBLIC_CURRICULUM_ROUTES,
  PUBLIC_DIFFICULTY_META,
} from '../facades/usePublicCurriculumFacade';
import { HubBadge, HubButton } from './hub/HubReaderParts';
import { TagSelectorModal } from './TagSelectorModal';

interface CurriculumLibraryBrowserProps {
  lessons: LibraryLesson[];
  availableTags: LibraryLesson['tags'];
  selectedTagId: string | null;
  onSelectTag: (tagId: string | null) => void;
  isCompleted: (lessonId: string) => boolean;
}

export function CurriculumLibraryBrowser({
  lessons,
  availableTags,
  selectedTagId,
  onSelectTag,
  isCompleted,
}: CurriculumLibraryBrowserProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Bộ lọc thẻ Tags tinh gọn: Dải cuộn ngang 1 dòng + Nút Tìm/Xem tất cả mở Modal tìm kiếm nhanh */}
      {availableTags.length > 0 && (
        <div className="rounded-2xl border border-lh-line bg-lh-surface p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            {/* Nhãn Thẻ từ khóa */}
            <div className="flex items-center gap-1.5 shrink-0 pl-1 text-xs font-bold text-lh-ink">
              <TagIcon className="size-3.5 text-lh-brand" />
              <span>Thẻ từ khóa:</span>
            </div>

            {/* Khung cuộn ngang 1 dòng cố định chiều cao */}
            <div className="relative flex flex-1 items-center min-w-0">
              {/* Nút cuộn trái */}
              <button
                type="button"
                onClick={() => scroll('left')}
                className="hidden sm:flex size-6 shrink-0 items-center justify-center rounded-full border border-lh-line bg-lh-surface text-lh-muted hover:text-lh-ink transition hover:bg-lh-surface-2 mr-1"
                aria-label="Cuộn sang trái"
              >
                <ChevronLeft className="size-3.5" />
              </button>

              {/* Danh sách cuộn ngang */}
              <div
                ref={scrollContainerRef}
                className="flex flex-1 items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-1"
              >
                <button
                  type="button"
                  onClick={() => onSelectTag(null)}
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    selectedTagId === null
                      ? 'bg-lh-brand text-white shadow-2xs'
                      : 'bg-lh-surface-2 text-lh-muted hover:bg-lh-surface-2/80 hover:text-lh-ink'
                  }`}
                >
                  Tất cả thẻ
                </button>

                {availableTags.map((tag) => {
                  const isSelected = selectedTagId === tag.id;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => onSelectTag(isSelected ? null : tag.id)}
                      className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        isSelected
                          ? 'bg-lh-brand text-white shadow-2xs font-semibold'
                          : 'bg-lh-surface-2/70 text-lh-ink/80 hover:bg-lh-surface-2 hover:text-lh-ink'
                      }`}
                    >
                      <Hash className="size-3 opacity-60" />
                      {tag.name}
                    </button>
                  );
                })}
              </div>

              {/* Nút cuộn phải */}
              <button
                type="button"
                onClick={() => scroll('right')}
                className="hidden sm:flex size-6 shrink-0 items-center justify-center rounded-full border border-lh-line bg-lh-surface text-lh-muted hover:text-lh-ink transition hover:bg-lh-surface-2 ml-1"
                aria-label="Cuộn sang phải"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>

            {/* Nút mở Modal tìm kiếm nhanh tất cả thẻ */}
            {availableTags.length > 5 && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-lh-line/80 bg-lh-surface-2/60 px-2.5 py-1.5 text-xs font-semibold text-lh-brand hover:border-lh-brand/40 hover:bg-lh-surface hover:text-lh-brand transition shadow-2xs"
              >
                <Search className="size-3.5" />
                <span>Xem tất cả ({availableTags.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal tìm kiếm và duyệt hàng trăm thẻ từ khóa an toàn */}
      <TagSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tags={availableTags}
        selectedTagId={selectedTagId}
        onSelectTag={onSelectTag}
      />

      {/* Grid danh sách bài đọc */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson, idx) => {
          const difficulty = lesson.difficulty
            ? PUBLIC_DIFFICULTY_META[lesson.difficulty]
            : null;
          const tags = lesson.tags;
          const done = isCompleted(lesson.id);

          return (
            <Link
              key={lesson.id}
              href={PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(lesson.slug)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-lh-line bg-lh-surface shadow-lh-card transition hover:-translate-y-1 hover:shadow-lh-card-hover"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    lesson.thumbnailUrl ||
                    DEFAULT_COVER_IMAGES[idx % DEFAULT_COVER_IMAGES.length]
                  }
                  alt=""
                  className="h-full w-full object-cover"
                />
                {done && (
                  <span className="absolute right-3 top-3">
                    <HubBadge tone="brand">
                      <CheckCircle2 className="size-3" /> Đã học
                    </HubBadge>
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-lh-muted">
                  <BookOpen className="size-3.5" /> ~{lesson.estimatedReadMinutes || 3} phút đọc
                  {difficulty && <HubBadge tone="gold">{difficulty.label}</HubBadge>}
                </div>

                <h3 className="mt-2 font-[family-name:var(--font-heading)] text-lg font-bold leading-snug text-lh-ink group-hover:text-lh-brand">
                  {lesson.title}
                </h3>

                {lesson.description && (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-lh-muted">
                    {lesson.description}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between pt-4">
                  <div className="flex flex-wrap gap-1">
                    {tags.slice(0, 2).map((tag) =>
                      tag ? (
                        <span
                          key={tag.id}
                          className="rounded-full bg-lh-surface-2 px-2.5 py-1 text-xs font-semibold text-lh-ink/80"
                        >
                          #{tag.name}
                        </span>
                      ) : null,
                    )}
                  </div>
                  <span className="text-sm font-semibold text-lh-brand">Vào đọc →</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {!lessons.length && (
        <div className="rounded-2xl border border-lh-line bg-lh-surface p-12 text-center text-sm text-lh-muted">
          <BookOpen className="mx-auto size-8 text-lh-muted" />
          <p className="mt-2 font-semibold text-lh-ink">
            Không tìm thấy bài học nào khớp với bộ lọc hiện tại.
          </p>
          <p className="mt-1 text-xs">Thử xóa bộ lọc từ khóa hoặc chọn chủ đề khác.</p>
        </div>
      )}
    </div>
  );
}
