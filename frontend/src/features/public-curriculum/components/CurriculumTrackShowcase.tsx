'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Layers,
  ListTree,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Milestone,
} from 'lucide-react';
import type { CurriculumTrackGroup } from '../utils/curriculum-track.util';
import { DEFAULT_COVER_IMAGES } from '../facades/usePublicCurriculumFacade';
import { HubBadge, HubProgress } from './hub/HubReaderParts';

export interface CurriculumTrackShowcaseProps {
  tracks: CurriculumTrackGroup[];
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
}

export function CurriculumTrackShowcase({
  tracks,
  selectedTrackId,
  onSelectTrack,
}: CurriculumTrackShowcaseProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  if (!tracks.length) {
    return null;
  }

  const scrollByCards = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 460, behavior: 'smooth' });
  };

  return (
    <section aria-label="Mạch tiến trình lịch sử" className="mb-6 space-y-3">
      {/* Header gọn 1 dòng + nút điều hướng lướt ngang */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Compass className="size-4 text-lh-gold" />
          <h2 className="font-[family-name:var(--font-heading)] text-base font-bold text-lh-ink sm:text-lg">
            Mạch tiến trình ({tracks.length})
          </h2>
        </div>

        {tracks.length > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              aria-label="Mạch trước"
              className="grid size-8 cursor-pointer place-items-center rounded-lg border border-lh-line bg-lh-surface text-lh-ink transition hover:border-lh-brand/50 hover:text-lh-brand"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              aria-label="Mạch tiếp theo"
              className="grid size-8 cursor-pointer place-items-center rounded-lg border border-lh-line bg-lh-surface text-lh-ink transition hover:border-lh-brand/50 hover:text-lh-brand"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Carousel lướt ngang — mỗi thẻ là card ngang gọn (ảnh trái + nội dung phải) */}
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden pb-2 [scrollbar-width:thin]"
      >
        {tracks.map((track, idx) => {
          const isSelected = selectedTrackId === track.id;
          const coverImg =
            track.coverImageUrl ||
            DEFAULT_COVER_IMAGES[idx % DEFAULT_COVER_IMAGES.length];

          return (
            <motion.article
              key={track.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onSelectTrack(track.id)}
              aria-pressed={isSelected}
              className={`group flex w-[min(100%,460px)] shrink-0 snap-start cursor-pointer flex-col overflow-hidden rounded-2xl border bg-lh-surface shadow-lh-card transition-all hover:shadow-lh-card-hover sm:flex-row ${
                isSelected
                  ? 'border-lh-brand ring-2 ring-lh-brand/20 bg-lh-brand/[0.02]'
                  : 'border-lh-line hover:border-lh-brand/40'
              }`}
            >
              {/* Ảnh nhỏ bên trái */}
              <div className="relative h-32 w-full shrink-0 overflow-hidden sm:h-auto sm:w-40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImg}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                <div className="absolute left-2.5 top-2.5 flex flex-wrap items-center gap-1">
                  <span className="inline-flex items-center gap-1 rounded-md bg-black/65 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                    <Milestone className="size-3 text-lh-gold" /> Mạch 0{idx + 1}
                  </span>
                </div>
              </div>

              {/* Thông tin & tiến độ bên phải */}
              <div className="flex min-w-0 flex-1 flex-col justify-between p-3.5 sm:p-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 font-[family-name:var(--font-heading)] text-sm font-bold leading-snug text-lh-ink group-hover:text-lh-brand sm:text-[15px]">
                      {track.title}
                    </h3>
                    {isSelected && <HubBadge tone="brand">Đang xem</HubBadge>}
                  </div>

                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-lh-muted">
                    {track.description}
                  </p>
                </div>

                <div className="mt-3 space-y-2 border-t border-lh-line/60 pt-2.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-lh-muted">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="size-3 text-amber-600" />
                        {track.totalStages} chặng
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ListTree className="size-3 text-sky-600" />
                        {track.totalChapters} chương
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="size-3 text-emerald-600" />
                        {track.totalLessons} bài
                      </span>
                    </div>
                    <span className="font-bold text-lh-ink">{track.progressPercent}%</span>
                  </div>
                  <HubProgress value={track.progressPercent} />
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
