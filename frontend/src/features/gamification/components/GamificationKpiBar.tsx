'use client';

import React from 'react';
import { Award, Flame, Pencil, Plus, Target } from 'lucide-react';
import { GOAL_TARGET_UNIT, GoalStatus } from '../constants/gamification.constants';
import { type GamificationOverview } from '../services/gamification.service';
import { CircularProgressRing } from './CircularProgressRing';

interface GamificationKpiBarProps {
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
        {/* 1. Vòng tròn Chuỗi ngày & tuần */}
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

        {/* 2. Vòng tròn Mục tiêu học tập (Goal Aim) */}
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

        {/* 3. Vòng tròn Huy hiệu & Cấp bậc XP */}
        <button
          type="button"
          onClick={onOpenGamificationTab}
          className="flex items-center gap-3.5 md:pl-4 text-left transition hover:opacity-90 cursor-pointer"
        >
          <CircularProgressRing
            percent={badgePercent}
            size={56}
            strokeColor="#7A1F24"
          >
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
