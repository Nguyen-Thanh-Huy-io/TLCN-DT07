'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ListTree,
  BookOpen,
  ChevronRight,
  BookmarkPlus,
  LogIn,
  Sparkles,
} from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import type { LearningPathItem } from '@/services/entities/learner.service';
import {
  DEFAULT_COVER_IMAGES,
  PUBLIC_CURRICULUM_ROUTES,
} from '../facades/usePublicCurriculumFacade';
import {
  HUB_BUTTON_BASE,
  HUB_BUTTON_VARIANTS,
  HubBadge,
  HubButton,
  HubProgress,
  pathLessons,
  pathTopics,
} from './hub/HubReaderParts';

interface CurriculumThematicGridProps {
  paths: LearningPathItem[];
  selectedPathId: string | null;
  onSelectPath: (path: LearningPathItem) => void;
  isCompleted: (lessonId: string) => boolean;
  isEnrolled: (pathId: string) => boolean;
  onEnroll: (pathId: string) => Promise<void>;
  loggedIn: boolean;
  selectedTopicId?: string | null;
}

export function CurriculumThematicGrid({
  paths,
  selectedPathId,
  onSelectPath,
  isCompleted,
  isEnrolled,
  onEnroll,
  loggedIn,
  selectedTopicId,
}: CurriculumThematicGridProps) {
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  if (!paths.length) {
    return (
      <div className="rounded-2xl border border-lh-line bg-lh-surface p-12 text-center">
        <Sparkles className="mx-auto size-10 text-lh-muted" />
        <h3 className="mt-3 font-[family-name:var(--font-heading)] text-lg font-bold text-lh-ink">
          Không tìm thấy khóa học chuyên đề phù hợp
        </h3>
        <p className="mt-1 text-sm text-lh-muted">
          Thử thay đổi từ khóa hoặc bộ lọc chủ đề của bạn.
        </p>
      </div>
    );
  }

  const handleEnroll = async (pathId: string) => {
    setEnrollingId(pathId);
    setEnrollError(null);
    try {
      await onEnroll(pathId);
    } catch (err) {
      setEnrollError(extractErrorMessage(err, 'Không thể đăng ký lộ trình. Vui lòng thử lại.'));
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {enrollError && (
        <div className="rounded-xl border border-lh-red/30 bg-lh-red-soft p-4 text-sm text-lh-red">
          {enrollError}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {paths.map((path, idx) => {
          const lessons = pathLessons(path);
          const completedCount = lessons.filter((l) => isCompleted(l.id)).length;
          const percent = lessons.length
            ? Math.round((completedCount / lessons.length) * 100)
            : 0;
          const enrolled = isEnrolled(path.id);
          const isSelected = selectedPathId === path.id;
          const nextLesson =
            lessons.find((l) => !isCompleted(l.id)) ?? lessons[0] ?? null;

          return (
            <motion.article
              key={path.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col overflow-hidden rounded-2xl border bg-lh-surface shadow-lh-card transition hover:shadow-lh-card-hover ${
                isSelected
                  ? 'border-lh-gold/60 ring-2 ring-lh-gold/20'
                  : 'border-lh-line'
              }`}
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    path.coverImageUrl ||
                    DEFAULT_COVER_IMAGES[idx % DEFAULT_COVER_IMAGES.length]
                  }
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute left-4 top-4 flex gap-2">
                  <HubBadge tone="gold">Chuyên đề chuyên sâu</HubBadge>
                  <HubBadge tone="neutral">Học tự do</HubBadge>
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 text-sm font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                  <ListTree className="size-3.5" /> {(path.chapters || []).length} chương
                  <span>•</span>
                  <BookOpen className="size-3.5" /> {lessons.length} bài
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  {pathTopics(path).length > 0 ? (
                    pathTopics(path).map((top) => {
                      const isCurrentFilter = selectedTopicId === top.id;
                      return (
                        <span
                          key={top.id}
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide transition ${
                            isCurrentFilter
                              ? 'bg-lh-gold text-white shadow-2xs'
                              : 'bg-lh-gold/15 text-lh-gold-dark hover:bg-lh-gold/25'
                          }`}
                        >
                          {top.name}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-wider text-lh-gold-dark">
                      Chuyên đề lịch sử
                    </span>
                  )}
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold leading-snug text-lh-ink">
                  {path.title}
                </h3>
                {path.description && (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-lh-muted">
                    {path.description}
                  </p>
                )}

                <div className="mt-5">
                  <div className="mb-1.5 flex justify-between text-xs font-semibold text-lh-ink">
                    <span>
                      {!enrolled
                        ? 'Chưa đăng ký'
                        : completedCount
                          ? `Đã học ${completedCount}/${lessons.length} bài`
                          : 'Đã đăng ký · Chưa bắt đầu'}
                    </span>
                    <span className="font-bold text-lh-gold">{percent}%</span>
                  </div>
                  <HubProgress value={percent} />
                </div>

                <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-[1fr_auto]">
                  {!loggedIn ? (
                    <Link
                      href={`/login?redirect=${encodeURIComponent(`${PUBLIC_CURRICULUM_ROUTES.CURRICULUM}?pathId=${path.id}`)}`}
                      className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.outline}`}
                    >
                      <LogIn className="size-4" /> Đăng nhập để học
                    </Link>
                  ) : !enrolled ? (
                    <HubButton
                      onClick={() => handleEnroll(path.id)}
                      disabled={enrollingId === path.id}
                    >
                      <BookmarkPlus className="size-4" />{' '}
                      {enrollingId === path.id ? 'Đang đăng ký...' : 'Đăng ký học (miễn phí)'}
                    </HubButton>
                  ) : nextLesson ? (
                    <Link
                      href={PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(nextLesson.slug, path.id)}
                      className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.primary}`}
                    >
                      {completedCount > 0 ? 'Tiếp tục học' : 'Vào bài đầu tiên'}{' '}
                      <ChevronRight className="size-4" />
                    </Link>
                  ) : null}

                  <HubButton
                    variant={isSelected ? 'secondary' : 'ghost'}
                    onClick={() => onSelectPath(path)}
                  >
                    <ListTree className="size-4" /> Đề cương
                  </HubButton>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
