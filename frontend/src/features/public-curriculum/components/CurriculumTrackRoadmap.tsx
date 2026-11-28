'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ListTree,
  BookOpen,
  CheckCircle2,
  Lock,
  Unlock,
  ChevronRight,
  ArrowDown,
  Layers,
  Sparkles,
  BookmarkPlus,
  LogIn,
} from 'lucide-react';
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
import { isChapterQuizPassedByContext } from '../utils/chapter-progression.util';

interface CurriculumTrackRoadmapProps {
  paths: LearningPathItem[];
  selectedPathId: string | null;
  onSelectPath: (path: LearningPathItem) => void;
  isCompleted: (lessonId: string) => boolean;
  isEnrolled: (pathId: string) => boolean;
  isQuizPassed?: (quizId: string) => boolean;
  bestQuizScores?: Record<string, number>;
  onEnroll: (pathId: string) => Promise<void>;
  loggedIn: boolean;
  selectedTopicId?: string | null;
}

export function CurriculumTrackRoadmap({
  paths,
  selectedPathId,
  onSelectPath,
  isCompleted,
  isEnrolled,
  isQuizPassed = () => false,
  bestQuizScores,
  onEnroll,
  loggedIn,
  selectedTopicId,
}: CurriculumTrackRoadmapProps) {
  if (!paths.length) {
    return (
      <div className="rounded-2xl border border-lh-line bg-lh-surface p-12 text-center">
        <Layers className="mx-auto size-10 text-lh-muted" />
        <h3 className="mt-3 font-[family-name:var(--font-heading)] text-lg font-bold text-lh-ink">
          Không tìm thấy lộ trình tiến trình lịch sử
        </h3>
        <p className="mt-1 text-sm text-lh-muted">
          Thử thay đổi từ khóa hoặc đặt lại bộ lọc chủ đề.
        </p>
      </div>
    );
  }

  // Giữ nguyên thứ tự topo (chặng gốc -> chặng phụ thuộc) đã được chuẩn hoá từ groupPathsIntoTracks
  const sortedPaths = paths;

  return (
    <div className="relative mx-auto max-w-4xl py-4">
      {/* Đường nối trục đứng giữa các khóa học */}
      <div className="absolute left-8 top-12 bottom-12 hidden w-0.5 bg-gradient-to-b from-lh-brand/40 via-lh-gold/40 to-lh-line sm:block md:left-12" />

      <div className="space-y-8">
        {sortedPaths.map((path, idx) => {
          const lessons = pathLessons(path);
          const completedCount = lessons.filter((l) => isCompleted(l.id)).length;
          const percent = lessons.length
            ? Math.round((completedCount / lessons.length) * 100)
            : 0;
          const isDone = lessons.length > 0 && completedCount === lessons.length;
          const enrolled = isEnrolled(path.id);
          const isSelected = selectedPathId === path.id;

          // Kiểm tra điều kiện tiên quyết của khóa này (100% bài học + Stage Exam nếu có)
          let isLockedByPrereq = false;
          let prereqPathTitle = '';
          let prereqNeedsExam = false;
          if (path.prerequisitePath) {
            prereqPathTitle = path.prerequisitePath.title;
            const prereqFull = paths.find((p) => p.id === path.prerequisitePathId);
            if (prereqFull) {
              const prereqLessons = pathLessons(prereqFull);
              const prereqDone = prereqLessons.filter((l) => isCompleted(l.id)).length;
              const prereqCompleted =
                prereqLessons.length === 0 || prereqDone === prereqLessons.length;
              const prereqChapterQuizzesPassed = (prereqFull.chapters || []).every((ch) =>
                (ch.chapterQuizzes || [])
                  .filter((cq) => cq.isRequired)
                  .every((cq) =>
                    isChapterQuizPassedByContext(cq, {
                      isCompleted,
                      isQuizPassed,
                      bestQuizScores,
                    }),
                  ),
              );
              const prereqExamPassed =
                !prereqFull.stageExamQuizId || isQuizPassed(prereqFull.stageExamQuizId);
              if (!prereqCompleted || !prereqChapterQuizzesPassed || !prereqExamPassed) {
                isLockedByPrereq = true;
                prereqNeedsExam =
                  prereqCompleted && (!prereqChapterQuizzesPassed || !prereqExamPassed);
              }
            }
          }

          const hasStageExam = Boolean(path.stageExamQuizId && path.stageExamQuiz);
          const stageExamPassed =
            !path.stageExamQuizId || isQuizPassed(path.stageExamQuizId);
          const stageExamPassScore =
            path.stageExamPassScore ?? path.stageExamQuiz?.passingScorePercent ?? 70;

          const nextLesson =
            lessons.find((l) => !isCompleted(l.id)) ?? lessons[0] ?? null;
          const topics = pathTopics(path);

          return (
            <div key={path.id} className="relative">
              <div className="flex items-start gap-4 sm:gap-6">
                {/* Node số chặng trên trục thời gian */}
                <div
                  className={`relative z-10 grid size-12 shrink-0 place-items-center rounded-2xl border-2 font-bold shadow-md transition sm:size-14 ${
                    isDone
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-emerald-600/20'
                      : isLockedByPrereq
                        ? 'border-lh-line bg-lh-surface-2 text-lh-muted'
                        : isSelected
                          ? 'border-lh-brand bg-lh-brand text-white shadow-lh-brand/20 ring-4 ring-lh-brand/15'
                          : 'border-lh-brand/40 bg-lh-surface text-lh-brand'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="size-6" />
                  ) : isLockedByPrereq ? (
                    <Lock className="size-5" />
                  ) : (
                    <span className="text-base sm:text-lg">0{idx + 1}</span>
                  )}
                </div>

                {/* Card nội dung lộ trình */}
                <motion.article
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex-1 overflow-hidden rounded-2xl border bg-lh-surface shadow-lh-card transition hover:shadow-lh-card-hover ${
                    isSelected
                      ? 'border-lh-brand/60 ring-2 ring-lh-brand/15'
                      : 'border-lh-line'
                  }`}
                >
                  <div className="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
                    {/* Ảnh đại diện */}
                    <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          path.coverImageUrl ||
                          DEFAULT_COVER_IMAGES[idx % DEFAULT_COVER_IMAGES.length]
                        }
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute left-3 top-3 flex gap-1.5">
                        <HubBadge tone="brand">Chặng 0{idx + 1}</HubBadge>
                        {path.isSequential && (
                          <HubBadge tone="neutral">Học tuần tự</HubBadge>
                        )}
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        <ListTree className="size-3.5" /> {(path.chapters || []).length} chương
                        <span>•</span>
                        <BookOpen className="size-3.5" /> {lessons.length} bài
                      </div>
                    </div>

                    {/* Thông tin & Tác vụ */}
                    <div className="flex flex-col p-5 md:pl-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            {topics.length > 0 ? (
                              topics.map((top) => {
                                const isCurrentFilter = selectedTopicId === top.id;
                                return (
                                  <span
                                    key={top.id}
                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide transition ${
                                      isCurrentFilter
                                        ? 'bg-lh-brand text-white shadow-2xs'
                                        : 'bg-lh-brand/10 text-lh-brand hover:bg-lh-brand/15'
                                    }`}
                                  >
                                    {top.name}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-xs font-bold uppercase tracking-wider text-lh-brand">
                                Tiến trình lịch sử
                              </span>
                            )}
                          </div>
                          <h3 className="mt-1 font-[family-name:var(--font-heading)] text-xl font-bold leading-snug text-lh-ink">
                            {path.title}
                          </h3>
                        </div>
                        {isDone && (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            ✓ Đã hoàn thành
                          </span>
                        )}
                      </div>

                      {path.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-lh-muted">
                          {path.description}
                        </p>
                      )}

                      {/* Huy hiệu điều kiện tiên quyết */}
                      {prereqPathTitle && (
                        <div
                          className={`mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium ${
                            isLockedByPrereq
                              ? 'border border-amber-300 bg-amber-50 text-amber-900'
                              : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {isLockedByPrereq ? (
                            <>
                              <Lock className="size-3.5 shrink-0 text-amber-700" />
                              <span>
                                {prereqNeedsExam ? (
                                  <>
                                    Cần vượt qua <strong>bài kiểm tra cuối chặng</strong> của{' '}
                                    <strong className="font-bold underline">{prereqPathTitle}</strong>
                                  </>
                                ) : (
                                  <>
                                    Yêu cầu tiên quyết: Hoàn thành khóa{' '}
                                    <strong className="font-bold underline">{prereqPathTitle}</strong>
                                  </>
                                )}
                              </span>
                            </>
                          ) : (
                            <>
                              <Unlock className="size-3.5 shrink-0 text-emerald-600" />
                              <span>
                                Đã mở khóa (Kế thừa từ: <strong>{prereqPathTitle}</strong>)
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Thanh tiến độ */}
                      <div className="mt-4">
                        <div className="mb-1.5 flex justify-between text-xs font-semibold text-lh-ink">
                          <span>
                            {!enrolled
                              ? 'Chưa đăng ký'
                              : completedCount
                                ? `Đã hoàn thành ${completedCount}/${lessons.length} bài`
                                : 'Đã đăng ký · Chưa bắt đầu'}
                          </span>
                          <span className="font-bold text-lh-brand">{percent}%</span>
                        </div>
                        <HubProgress value={percent} />
                      </div>

                      {/* Bài kiểm tra cuối chặng (Stage Exam) */}
                      {hasStageExam && path.stageExamQuiz && (
                        <div
                          className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${
                            stageExamPassed
                              ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
                              : 'border-indigo-200 bg-indigo-50/70 text-indigo-950'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-medium">
                            {stageExamPassed ? (
                              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                            ) : (
                              <Layers className="size-4 shrink-0 text-indigo-600" />
                            )}
                            <span>
                              {stageExamPassed ? (
                                <>
                                  Đã vượt qua kiểm tra cuối chặng:{' '}
                                  <strong>{path.stageExamQuiz.title || 'Stage Exam'}</strong>
                                </>
                              ) : (
                                <>
                                  Kiểm tra cuối chặng:{' '}
                                  <strong>{path.stageExamQuiz.title || 'Stage Exam'}</strong>{' '}
                                  (đạt &ge; {stageExamPassScore}%)
                                </>
                              )}
                            </span>
                          </div>
                          {!stageExamPassed && (
                            <Link
                              href={`/luyen-tap?quizId=${encodeURIComponent(path.stageExamQuiz.id)}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-indigo-700"
                            >
                              Làm bài thi <ChevronRight className="size-3.5" />
                            </Link>
                          )}
                        </div>
                      )}

                      {/* Các nút bấm hành động */}
                      <div className="mt-5 flex flex-wrap items-center gap-2 pt-2">
                        {!loggedIn ? (
                          <Link
                            href={`/login?redirect=${encodeURIComponent(`${PUBLIC_CURRICULUM_ROUTES.CURRICULUM}?pathId=${path.id}`)}`}
                            className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.outline}`}
                          >
                            <LogIn className="size-4" /> Đăng nhập để học
                          </Link>
                        ) : !enrolled ? (
                          isLockedByPrereq ? (
                            <span
                              aria-disabled="true"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-lh-line bg-lh-surface-2 px-3.5 py-2 text-xs font-semibold text-lh-muted cursor-not-allowed"
                            >
                              <Lock className="size-3.5" />
                              {prereqNeedsExam ? 'Đậu bài thi chặng trước để mở' : 'Hoàn thành chặng trước để mở'}
                            </span>
                          ) : (
                            <HubButton onClick={() => void onEnroll(path.id).catch(() => {})}>
                              <BookmarkPlus className="size-4" /> Đăng ký học
                            </HubButton>
                          )
                        ) : nextLesson ? (
                          <Link
                            href={PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(nextLesson.slug, path.id)}
                            className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS.primary}`}
                          >
                            {completedCount > 0 ? 'Học tiếp' : 'Bắt đầu học'}{' '}
                            <ChevronRight className="size-4" />
                          </Link>
                        ) : null}

                        <HubButton
                          variant={isSelected ? 'secondary' : 'ghost'}
                          onClick={() => onSelectPath(path)}
                        >
                          <ListTree className="size-4" />
                          {isSelected ? 'Đang xem đề cương' : 'Xem đề cương'}
                        </HubButton>
                      </div>
                    </div>
                  </div>
                </motion.article>
              </div>

              {/* Mũi tên chỉ hướng sang chặng tiếp theo */}
              {idx < sortedPaths.length - 1 && (
                <div className="my-2 ml-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-lh-muted sm:ml-7">
                  <div className="grid size-6 place-items-center rounded-full bg-lh-surface-2 text-lh-brand">
                    <ArrowDown className="size-3.5" />
                  </div>
                  <span>Tiếp nối chặng 0{idx + 2}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
