'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Layers,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  ChapterQuizProgressionStateEnum,
  LessonProgressionStateEnum,
} from '@/constants/enums';
import type {
  ChapterLessonItem,
  LearningPathItem,
  StageExamQuizRef,
} from '@/services/entities/learner.service';
import {
  PUBLIC_CURRICULUM_ROUTES,
  PUBLIC_DIFFICULTY_META,
} from '../../facades/usePublicCurriculumFacade';
import type {
  EvaluatedJourneyLesson,
  EvaluatedJourneyQuiz,
} from '../../utils/chapter-progression.util';

const PASSED_ICON_BADGE_CLASS = 'bg-emerald-600 text-white';
const LOCKED_ICON_BADGE_CLASS = 'bg-lh-surface-3 text-lh-muted';

export function buildPracticeExamHref(quizId: string, pathId: string): string {
  const returnTo = `${PUBLIC_CURRICULUM_ROUTES.CURRICULUM}?pathId=${encodeURIComponent(pathId)}`;
  return `/luyen-tap?quizId=${encodeURIComponent(quizId)}&returnTo=${encodeURIComponent(returnTo)}`;
}

export function PathRelationBanners({ path }: { path: LearningPathItem }) {
  const hasPrereq = Boolean(path.prerequisitePath);
  const firstSuccessor = path.successorPaths?.[0] ?? null;
  if (!hasPrereq && !firstSuccessor) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {path.prerequisitePath && (
        <div className="flex items-start gap-3 rounded-2xl border border-lh-gold/30 bg-lh-gold-soft/40 p-4">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-lh-gold text-white shadow-sm">
            <Layers className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-lh-gold">
              Khóa học tiên quyết
            </div>
            <div className="mt-0.5 text-sm font-bold text-lh-ink">
              {path.prerequisitePath.title}
            </div>
            <p className="mt-1 text-xs text-lh-muted">
              Nên hoàn thành lộ trình này trước để nắm vững bối cảnh lịch sử nền tảng.
            </p>
            <Link
              href={`${PUBLIC_CURRICULUM_ROUTES.CURRICULUM}?pathId=${path.prerequisitePath.id}`}
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-lh-brand hover:underline"
            >
              Xem khóa tiên quyết <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      )}

      {firstSuccessor && (
        <div className="flex items-start gap-3 rounded-2xl border border-lh-brand/30 bg-lh-brand-soft/40 p-4">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-lh-brand text-white shadow-sm">
            <Sparkles className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-lh-brand">
              Lộ trình tiếp nối gợi ý
            </div>
            <div className="mt-0.5 text-sm font-bold text-lh-ink">
              {firstSuccessor.title}
            </div>
            <p className="mt-1 text-xs text-lh-muted">
              Sau khi hoàn thành lộ trình hiện tại, bạn sẽ tiếp tục bước sang giai đoạn này.
            </p>
            <Link
              href={`${PUBLIC_CURRICULUM_ROUTES.CURRICULUM}?pathId=${firstSuccessor.id}`}
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-lh-brand hover:underline"
            >
              Xem lộ trình tiếp nối <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function resolveQuizCardTone(isPassed: boolean, isLocked: boolean): {
  cardClass: string;
  badgeIconClass: string;
} {
  if (isPassed) {
    return {
      cardClass: 'border-emerald-200 bg-emerald-50/70',
      badgeIconClass: PASSED_ICON_BADGE_CLASS,
    };
  }
  if (isLocked) {
    return {
      cardClass: 'border-lh-line/60 bg-lh-surface-2/40 opacity-65',
      badgeIconClass: LOCKED_ICON_BADGE_CLASS,
    };
  }
  return {
    cardClass: 'border-amber-300/80 bg-amber-50/50 shadow-2xs',
    badgeIconClass: 'bg-amber-600 text-white',
  };
}

function QuizStateIcon({
  isPassed,
  isLocked,
}: {
  isPassed: boolean;
  isLocked: boolean;
}) {
  if (isPassed) return <CheckCircle2 className="size-4" />;
  if (isLocked) return <Lock className="size-4" />;
  return <ClipboardCheck className="size-4" />;
}

function ChapterQuizCardRow({
  quiz,
  index,
  pathId,
}: {
  quiz: EvaluatedJourneyQuiz;
  index: number;
  pathId: string;
}) {
  const isPassed = quiz.state === ChapterQuizProgressionStateEnum.PASSED;
  const isLocked = quiz.state === ChapterQuizProgressionStateEnum.LOCKED;
  const examHref = buildPracticeExamHref(quiz.quizId, pathId);
  const { cardClass, badgeIconClass } = resolveQuizCardTone(isPassed, isLocked);

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all ${cardClass}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={`grid size-9 shrink-0 place-items-center rounded-xl font-bold ${badgeIconClass}`}
        >
          <QuizStateIcon isPassed={isPassed} isLocked={isLocked} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-amber-800">
              Đề {index + 1}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                quiz.isRequired
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-lh-surface-2 text-lh-muted'
              }`}
            >
              {quiz.isRequired ? 'Bắt buộc vượt qua' : 'Luyện tập mở rộng'}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-lh-muted">
              <Clock className="size-3" /> {quiz.timeLimitMinutes ?? 15} phút · Đạt &ge;{' '}
              {quiz.effectivePassScore}%
            </span>
            {quiz.bestScorePercent !== null && (
              <span
                className={`text-[11px] font-bold ${
                  isPassed ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                (Điểm cao nhất: {quiz.bestScorePercent}%)
              </span>
            )}
          </div>

          <div className="mt-0.5 font-[family-name:var(--font-heading)] text-sm font-bold text-lh-ink">
            {quiz.title}
          </div>

          {isLocked && quiz.lockedReason && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-amber-800">
              <AlertCircle className="size-3 shrink-0" />
              <span>{quiz.lockedReason}</span>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0">
        {isLocked ? (
          <span className="inline-flex items-center gap-1 rounded-xl bg-lh-surface-3 px-3 py-1.5 text-xs font-semibold text-lh-muted">
            <Lock className="size-3.5" /> Chưa mở
          </span>
        ) : (
          <Link
            href={examHref}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              isPassed
                ? 'border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50'
                : 'bg-amber-600 text-white shadow-2xs hover:bg-amber-700'
            }`}
          >
            {isPassed ? 'Thi lại' : 'Làm đề kiểm tra'}{' '}
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function ChapterQuizStation({
  quizzes,
  pathId,
}: {
  quizzes: EvaluatedJourneyQuiz[];
  pathId: string;
}) {
  if (quizzes.length === 0) return null;

  return (
    <div className="mt-4 space-y-2.5 pl-4 sm:pl-6">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
        <ClipboardCheck className="size-3.5" />
        <span>Trạm kiểm tra chương ({quizzes.length} đề)</span>
      </div>

      {quizzes.map((qz, idx) => (
        <ChapterQuizCardRow
          key={qz.id || qz.quizId}
          quiz={qz}
          index={idx}
          pathId={pathId}
        />
      ))}
    </div>
  );
}

function resolveLessonCardClass(
  isLocked: boolean,
  isActive: boolean,
  isSelected: boolean,
): string {
  if (isLocked) return 'border-lh-line/60 bg-lh-surface-2/40 opacity-60';
  if (isActive) {
    return 'border-lh-brand bg-lh-surface ring-2 ring-lh-brand/20 shadow-md';
  }
  if (isSelected) return 'border-lh-gold bg-lh-gold-soft/30';
  return 'border-lh-line bg-lh-surface hover:border-lh-brand/40 hover:shadow-lh-card';
}

export function JourneyLessonRow({
  lesson,
  lessonIndex,
  pathId,
  statusInfo,
  activeLessonId,
}: {
  lesson: ChapterLessonItem['lesson'];
  lessonIndex: number;
  pathId: string;
  statusInfo: EvaluatedJourneyLesson;
  activeLessonId?: string;
}) {
  const isDone = statusInfo.state === LessonProgressionStateEnum.COMPLETED;
  const isLocked =
    statusInfo.state === LessonProgressionStateEnum.LOCKED_PREREQUISITE;
  const isActive =
    statusInfo.state === LessonProgressionStateEnum.CURRENT_UNLOCKED;
  const isSelected = lesson.id === activeLessonId;

  const difficulty = lesson.difficulty
    ? PUBLIC_DIFFICULTY_META[lesson.difficulty]
    : null;

  const lessonUrl = PUBLIC_CURRICULUM_ROUTES.LESSON_DETAIL(lesson.slug, pathId);
  const iconToneClass = isDone
    ? 'bg-emerald-500 text-white'
    : isLocked
      ? LOCKED_ICON_BADGE_CLASS
      : 'bg-lh-brand text-white ring-2 ring-lh-brand/30 animate-pulse';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`group relative flex items-center gap-4 rounded-2xl border p-4 transition-all ${resolveLessonCardClass(
        isLocked,
        isActive,
        isSelected,
      )}`}
    >
      <div
        className={`grid size-10 shrink-0 place-items-center rounded-xl font-bold shadow-sm transition-transform group-hover:scale-105 ${iconToneClass}`}
      >
        {isDone ? (
          <CheckCircle2 className="size-5" />
        ) : isLocked ? (
          <Lock className="size-4" />
        ) : (
          <BookOpen className="size-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-lh-muted">
            Bài {lessonIndex + 1}
          </span>
          {difficulty && (
            <span className="rounded bg-lh-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-lh-muted">
              {difficulty.label}
            </span>
          )}
          {isDone && (
            <span className="text-xs font-semibold text-emerald-600">
              Đã hoàn thành
            </span>
          )}
          {isActive && (
            <span className="text-xs font-bold text-lh-brand">
              Bài tiếp theo
            </span>
          )}
        </div>
        <div className="mt-1 font-[family-name:var(--font-heading)] text-base font-bold text-lh-ink">
          {lesson.title}
        </div>
        {isLocked && statusInfo.lockedReason && (
          <div className="mt-1 flex items-center gap-1 text-xs text-amber-700">
            <AlertCircle className="size-3 shrink-0" />
            <span>{statusInfo.lockedReason}</span>
          </div>
        )}
      </div>

      <div className="shrink-0">
        {isLocked ? (
          <span className="inline-flex items-center gap-1 rounded-xl bg-lh-surface-3 px-3 py-1.5 text-xs font-semibold text-lh-muted">
            <Lock className="size-3.5" /> Khóa
          </span>
        ) : (
          <Link
            href={lessonUrl}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              isActive
                ? 'bg-lh-brand text-white shadow hover:bg-lh-brand-strong'
                : 'bg-lh-surface-2 text-lh-ink hover:bg-lh-brand hover:text-white'
            }`}
          >
            {isDone ? 'Ôn lại' : 'Vào học'} <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}

export function StageExamStation({
  stageExam,
  pathId,
  passScore,
  isPassed,
  isLocked,
}: {
  stageExam: StageExamQuizRef;
  pathId: string;
  passScore: number;
  isPassed: boolean;
  isLocked: boolean;
}) {
  const iconToneClass = isPassed
    ? PASSED_ICON_BADGE_CLASS
    : isLocked
      ? LOCKED_ICON_BADGE_CLASS
      : 'bg-indigo-600 text-white';

  return (
    <div className="relative">
      <div className="relative flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50/60 p-5">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`grid size-11 shrink-0 place-items-center rounded-2xl font-bold shadow-sm ${iconToneClass}`}
          >
            {isPassed ? (
              <CheckCircle2 className="size-5" />
            ) : isLocked ? (
              <Lock className="size-5" />
            ) : (
              <Award className="size-5" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Bài thi tổng kết cuối chặng · Đạt &ge; {passScore}%
            </div>
            <div className="mt-0.5 font-[family-name:var(--font-heading)] text-base font-bold text-lh-ink">
              {stageExam.title || 'Bài kiểm tra tổng kết khóa học'}
            </div>
            {isLocked && (
              <p className="mt-0.5 text-xs text-indigo-900/80">
                Hoàn thành toàn bộ chương và đề bắt buộc phía trên để mở bài thi tổng kết.
              </p>
            )}
          </div>
        </div>

        {isLocked ? (
          <span className="inline-flex items-center gap-1 rounded-xl bg-lh-surface-3 px-3.5 py-2 text-xs font-semibold text-lh-muted">
            <Lock className="size-3.5" /> Đang khóa
          </span>
        ) : (
          <Link
            href={buildPracticeExamHref(stageExam.id, pathId)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
          >
            {isPassed ? 'Thi lại cuối chặng' : 'Làm bài thi cuối chặng'}{' '}
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
