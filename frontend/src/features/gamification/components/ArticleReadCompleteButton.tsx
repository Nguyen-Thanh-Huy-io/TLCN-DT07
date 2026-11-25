'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Award, CheckCircle2, Flame, Loader2, Pencil, Plus, Sparkles, Sprout, Target } from 'lucide-react';
import { KeyboardKey } from '@/constants/enums';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { GOAL_TARGET_UNIT, GoalStatus } from '../constants/gamification.constants';
import { GamificationApiService, useGamificationOverview, type GamificationOverview } from '../services/gamification.service';
import { CircularProgressRing } from './GoalAimModal';

export function ArticleReadCompleteButton({ articleId }: { articleId: string }) {
  const user = useAuthSession();
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [xpBanner, setXpBanner] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !articleId) return;
    let alive = true;
    GamificationApiService.getArticleReadStatus(articleId)
      .then((res) => {
        if (alive && res.completed) setCompleted(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [articleId, user]);

  const handleComplete = async () => {
    if (!articleId || completed || submitting) return;
    setSubmitting(true);
    try {
      const res = await GamificationApiService.markArticleReadComplete(articleId);
      setCompleted(true);
      if (res.xpEarned > 0) setXpBanner(res.xpEarned);
    } finally {
      setSubmitting(false);
    }
  };

  if (user === undefined) return null;

  if (user === null) {
    return (
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2D5B8] bg-[#FAF6EA] px-5 py-4 text-xs text-[#7A6B57]">
        <span>Đăng nhập để ghi nhận hoàn thành đọc bài, tích luỹ chuỗi ngày học và +20 XP.</span>
        <Link
          href="/login"
          className="rounded-xl bg-[#7A1F24] px-4 py-2 font-bold text-white hover:brightness-110"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2D5B8] bg-[#FAF6EA] px-5 py-4">
      <div className="flex items-center gap-2.5 text-sm font-bold text-[#2D1A10]">
        {completed ? (
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
        ) : (
          <Sparkles size={20} className="text-[#C99C48] shrink-0" />
        )}
        <div>
          <div>
            {completed
              ? 'Đã hoàn thành đọc bài viết này'
              : 'Đã đọc xong tư liệu lịch sử này?'}
          </div>
          {xpBanner !== null && (
            <div className="text-xs font-semibold text-emerald-700">
              +{xpBanner} XP đã được cộng vào hồ sơ sử học của bạn!
            </div>
          )}
        </div>
      </div>

      {!completed ? (
        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleComplete()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 disabled:opacity-50 cursor-pointer"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          Đánh dấu đã đọc xong (+20 XP)
        </button>
      ) : (
        <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          Đã ghi nhận
        </span>
      )}
    </div>
  );
}

// --- Merged from GamificationKpiBar.tsx ---
export interface GamificationKpiBarProps {
  overview: GamificationOverview | null;
  onOpenGoalModal: () => void;
  onOpenGamificationTab: () => void;
}

export function GamificationKpiBar({
  overview,
  onOpenGoalModal,
  onOpenGamificationTab,
}: GamificationKpiBarProps) {
  const streak = overview?.streak;
  const primaryGoal = overview?.primaryGoal ?? null;
  const achievements = overview?.achievements ?? [];
  const unlockedCount = achievements.filter((a) => Boolean(a.unlockedAt)).length;
  const rank = overview?.rank;
  const totalXp = overview?.stats.totalXp ?? 0;

  const dayStreak = streak?.currentDayStreak ?? 0;
  const weekStreak = streak?.currentWeekStreak ?? 0;
  const studiedToday = streak?.studiedToday ?? false;

  const goalPercent = primaryGoal
    ? Math.min(100, Math.round((primaryGoal.currentValue / Math.max(1, primaryGoal.targetValue)) * 100))
    : 0;
  const goalDone = primaryGoal?.status === GoalStatus.COMPLETED || goalPercent >= 100;
  const badgePercent =
    achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  return (
    <div className="mt-4 rounded-2xl border border-[#E2D5B8] bg-[#FAF6EA] p-4 sm:p-5 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:divide-x md:divide-[#E2D5B8]">
        <button
          type="button"
          onClick={onOpenGamificationTab}
          className="flex items-center gap-3.5 text-left transition hover:opacity-90 cursor-pointer"
        >
          <CircularProgressRing
            percent={studiedToday ? 100 : dayStreak > 0 ? 55 : 0}
            size={56}
            strokeColor={studiedToday ? '#C99C48' : '#7A1F24'}
          >
            <div className="flex flex-col items-center leading-none">
              <Flame
                size={14}
                className={studiedToday ? 'text-[#B8893F] fill-[#C99C48]' : 'text-[#7A1F24]'}
              />
              <span className="mt-0.5 text-xs font-extrabold text-[#2D1A10]">{dayStreak}</span>
            </div>
          </CircularProgressRing>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-extrabold text-[#2D1A10]">
                {dayStreak > 0 ? `${dayStreak} ngày chuỗi` : 'Chuỗi ngày học'}
              </span>
              <span className="rounded-full bg-[#EFE3C7] px-2 py-0.5 text-[10px] font-bold text-[#7A1F24]">
                {weekStreak} tuần
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#7A6B57] line-clamp-1">
              {studiedToday
                ? 'Đã hoàn thành hoạt động hôm nay!'
                : 'Học 1 bài hoặc ôn thẻ hôm nay để giữ chuỗi'}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-3.5 md:pl-4">
          <CircularProgressRing
            percent={goalPercent}
            size={56}
            strokeColor={primaryGoal ? '#16A34A' : '#CBD5E1'}
          >
            <span className="text-xs font-extrabold text-[#2D1A10]">
              {primaryGoal ? `${goalPercent}%` : <Target size={16} className="text-[#7A6B57]" />}
            </span>
          </CircularProgressRing>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 text-sm font-extrabold text-[#2D1A10]">
                <span>Mục tiêu tuần</span>
                {goalDone && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Đạt!
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onOpenGoalModal}
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-[#D4AE67] bg-white px-2.5 py-1 text-[11px] font-bold text-[#7A1F24] hover:bg-[#F5EEDC] transition cursor-pointer"
              >
                {primaryGoal ? <Pencil size={11} /> : <Plus size={11} />}
                {primaryGoal ? 'Đổi' : 'Đặt mục tiêu'}
              </button>
            </div>
            <p className="mt-1 text-xs text-[#7A6B57] line-clamp-1">
              {primaryGoal
                ? `${primaryGoal.currentValue}/${primaryGoal.targetValue} ${GOAL_TARGET_UNIT[primaryGoal.targetType]} · ${primaryGoal.title}`
                : 'Chọn 1x, 3x, 5x ngày học/tuần'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenGamificationTab}
          className="flex items-center gap-3.5 md:pl-4 text-left transition hover:opacity-90 cursor-pointer"
        >
          <CircularProgressRing percent={badgePercent} size={56} strokeColor="#7A1F24">
            <div className="flex flex-col items-center leading-none">
              <Award size={14} className="text-[#7A1F24]" />
              <span className="mt-0.5 text-[10px] font-extrabold text-[#2D1A10]">
                {unlockedCount}/{achievements.length}
              </span>
            </div>
          </CircularProgressRing>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-[#2D1A10]">
              {rank?.current.label ?? 'Mầm sử học'}{' '}
              <span className="font-bold text-[#B8893F]">· {totalXp} XP</span>
            </div>
            <p className="mt-0.5 text-xs text-[#7A6B57] line-clamp-1">
              {rank?.next
                ? `Còn ${Math.max(0, rank.next.minXp - totalXp)} XP lên ${rank.next.label}`
                : 'Đã mở khóa cấp bậc sử học cao nhất!'}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

// --- Merged from HeaderStreakPopover.tsx ---
export function HeaderStreakPopover({ enabled }: { enabled: boolean }) {
  const { overview } = useGamificationOverview(enabled);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.ESCAPE) setOpen(false);
    };
    window.addEventListener('mousedown', onOutside);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('mousedown', onOutside);
      window.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  if (!enabled) return null;

  const dayStreak = overview?.streak.currentDayStreak ?? 0;
  const weekStreak = overview?.streak.currentWeekStreak ?? 0;
  const studiedToday = overview?.streak.studiedToday ?? false;
  const goal = overview?.primaryGoal ?? null;
  const headline = dayStreak === 0 ? 'Chưa có chuỗi ngày học' : `${dayStreak} ngày liên tiếp`;
  const subMessage =
    dayStreak === 0
      ? 'Hoàn thành 1 bài học, bài viết, Quiz hoặc ôn Flashcard hôm nay để mở chuỗi đầu tiên!'
      : studiedToday
        ? 'Tuyệt vời! Bạn đã giữ lửa học sử hôm nay. Tiếp tục phát huy nhé.'
        : 'Hôm nay bạn chưa học bài nào. Học ngay 1 hoạt động để giữ vững chuỗi!';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Chuỗi ngày học tập"
        title="Chuỗi ngày học tập & Mục tiêu"
        className={`relative flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-extrabold transition cursor-pointer ${
          studiedToday
            ? 'border-[#F3DEAB]/70 bg-gradient-to-r from-[#C99C48] to-[#B8893F] text-[#3D0A0E] shadow-xs'
            : 'border-[#D4AE67]/35 bg-white/10 text-[#FFF6E3] hover:bg-white/20'
        }`}
      >
        {studiedToday ? <Flame size={14} className="fill-current" /> : <Sprout size={14} />}
        <span>{dayStreak}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2.5 w-72 overflow-hidden rounded-2xl border border-[#E2D5B8] bg-[#FAF6EA] text-[#2D1A10] shadow-2xl z-50">
          <div className="relative flex flex-col items-center bg-gradient-to-br from-[#F4E6C8] via-[#F9F0DC] to-[#EED9AE] px-4 pt-5 pb-4 border-b border-[#E2D5B8]">
            <div className="relative grid size-20 place-items-center rounded-full border-2 border-[#7A1F24] bg-white shadow-sm">
              <span className="font-[family-name:var(--font-heading)] text-3xl font-extrabold text-[#7A1F24]">
                {dayStreak}
              </span>
              <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border border-[#D4AE67] bg-[#FFF6E3] text-[#B8893F] shadow-2xs">
                <Sprout size={14} />
              </span>
            </div>
            <div className="mt-3 text-base font-extrabold text-[#2D1A10]">{headline}</div>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-[#D4AE67]/60 bg-white/80 px-2.5 py-0.5 text-[11px] font-bold text-[#7A1F24]">
              {weekStreak} tuần năng nổ · {overview?.rank.current.label ?? 'Mầm sử học'}
            </span>
          </div>

          <div className="p-4 text-center">
            <p className="text-xs leading-relaxed text-[#7A6B57]">{subMessage}</p>
            {goal && (
              <div className="mt-3 rounded-xl border border-[#E2D5B8] bg-white px-3 py-2 text-left text-xs">
                <div className="flex items-center justify-between font-bold text-[#2D1A10]">
                  <span className="inline-flex items-center gap-1 truncate">
                    <Target size={12} className="text-emerald-600 shrink-0" />
                    <span className="truncate">{goal.title}</span>
                  </span>
                  <span className="shrink-0 text-emerald-700">
                    {goal.currentValue}/{goal.targetValue}
                  </span>
                </div>
              </div>
            )}
            <div className="mt-3.5 flex items-center gap-2">
              <Link
                href="/chuong-trinh-hoc"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-3 py-2 text-xs font-bold text-white hover:brightness-110 transition"
              >
                Học ngay hôm nay
              </Link>
              <Link
                href="/tai-khoan?tab=muc-tieu"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-[#E2D5B8] bg-white px-3 py-2 text-xs font-bold text-[#2D1A10] hover:border-[#C99C48] transition"
              >
                Mục tiêu
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
