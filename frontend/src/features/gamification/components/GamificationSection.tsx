'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Flame,
  Lock,
  Plus,
  Target,
  Trash2,
  Trophy,
} from 'lucide-react';
import { GOAL_TARGET_UNIT, GoalPeriod, GoalStatus } from '../constants/gamification.constants';
import {
  GamificationApiService,
  type AchievementProgressItem,
  type GamificationOverview,
  type LearningGoalItem,
} from '../services/gamification.service';
import { AchievementBadgeAvatar, CircularProgressRing } from './GoalAimModal';

function formatShortVnDate(dateKey: string): string {
  const [, month, day] = dateKey.split('-');
  return `${day}/${month}`;
}

function GoalCard({
  goal,
  onDelete,
}: {
  goal: LearningGoalItem;
  onDelete: (id: string) => void;
}) {
  const percent = Math.min(
    100,
    Math.round((goal.currentValue / Math.max(1, goal.targetValue)) * 100),
  );
  const done = goal.status === GoalStatus.COMPLETED || percent >= 100;
  const periodText = goal.period === GoalPeriod.DAILY ? 'Hằng ngày' : 'Hằng tuần';

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E2D5B8] bg-white p-4 shadow-2xs">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <CircularProgressRing
          percent={percent}
          size={52}
          strokeColor={done ? '#16A34A' : '#B8893F'}
        >
          <span className="text-[11px] font-extrabold text-[#2D1A10]">{percent}%</span>
        </CircularProgressRing>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[#2D1A10]">{goal.title}</span>
            <span className="rounded-full bg-[#F5EEDC] px-2 py-0.5 text-[10px] font-bold text-[#7A6B57]">
              {periodText}
            </span>
            {goal.isPrimary && (
              <span className="rounded-full bg-[#7A1F24]/10 px-2 py-0.5 text-[10px] font-bold text-[#7A1F24]">
                Cam kết chính
              </span>
            )}
            {done && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <CheckCircle2 size={10} /> Hoàn thành
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-[#7A6B57]">
            Tiến độ: <strong className="text-[#2D1A10]">{goal.currentValue}</strong> / {goal.targetValue}{' '}
            {GOAL_TARGET_UNIT[goal.targetType]}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDelete(goal.id)}
        title="Xoá mục tiêu"
        aria-label="Xoá mục tiêu"
        className="grid size-8 shrink-0 place-items-center rounded-xl text-stone-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function AchievementCard({ item }: { item: AchievementProgressItem }) {
  const unlocked = Boolean(item.unlockedAt);

  return (
    <div
      className={`flex h-full flex-col rounded-2xl border p-4 transition ${
        unlocked
          ? 'border-[#D4AE67] bg-gradient-to-br from-[#FFFDF7] to-[#F9EFE0] shadow-xs'
          : 'border-[#E2D5B8] bg-white/75 opacity-80'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <AchievementBadgeAvatar
          title={item.title}
          iconKey={item.iconKey}
          imageUrl={item.imageUrl}
          sizeClass="size-11"
          iconSize={20}
          dimmed={!unlocked}
          containerClass={
            unlocked
              ? 'bg-gradient-to-br from-[#C99C48] to-[#7A1F24] text-white shadow-xs'
              : 'bg-[#EFE3C7] text-[#7A6B57]'
          }
        />
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            unlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
          }`}
        >
          {unlocked ? `+${item.xpReward} XP` : <Lock size={10} />}
        </span>
      </div>

      <h4 className="mt-3 text-sm font-bold text-[#2D1A10]">{item.title}</h4>
      <p className="mt-1 text-xs leading-relaxed text-[#7A6B57]">{item.description}</p>

      <div className="mt-auto pt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-[#7A6B57]">
          <span>
            {Math.min(item.currentValue, item.threshold)}/{item.threshold}
          </span>
          <span>{item.progressPercent}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#EFE3C7]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              unlocked ? 'bg-emerald-600' : 'bg-[#B8893F]'
            }`}
            style={{ width: `${item.progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function GamificationSection({
  overview,
  onOpenGoalModal,
  onRefresh,
}: {
  overview: GamificationOverview | null;
  onOpenGoalModal: (defaultPrimary: boolean) => void;
  onRefresh: () => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteGoal = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await GamificationApiService.deleteGoal(id);
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  if (!overview) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-2xl bg-[#EAE0CB]" />
        <div className="h-64 animate-pulse rounded-2xl bg-[#EAE0CB]" />
      </div>
    );
  }

  const allGoals = [
    ...(overview.primaryGoal ? [overview.primaryGoal] : []),
    ...overview.secondaryGoals,
  ];
  const unlockedCount = overview.achievements.filter((a) => Boolean(a.unlockedAt)).length;

  return (
    <div className="space-y-6">
      {/* 1. Nhịp học 14 ngày gần nhất */}
      <section className="rounded-2xl border border-[#E2D5B8] bg-[#FAF6EA] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2D1A10] flex items-center gap-2">
              <Flame size={18} className="text-[#B8893F]" />
              Nhịp học 14 ngày gần đây
            </h3>
            <p className="mt-0.5 text-xs text-[#7A6B57]">
              Kỷ lục chuỗi dài nhất: <strong>{overview.streak.longestDayStreak} ngày</strong> · Chuỗi tuần: <strong>{overview.streak.currentWeekStreak} tuần</strong>
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#7A1F24]">
            <span>{overview.rank.current.label}</span>
            <span className="rounded-full bg-[#EFE3C7] px-2.5 py-1 text-[#2D1A10]">
              {overview.stats.totalXp} XP
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 sm:grid-cols-14 gap-2">
          {overview.recentDays.map((day) => {
            const active = day.count > 0;
            return (
              <div
                key={day.date}
                title={`${formatShortVnDate(day.date)}: ${day.count} hoạt động (+${day.xp} XP)`}
                className={`flex flex-col items-center rounded-xl border py-2 text-center ${
                  active
                    ? 'border-[#C99C48] bg-gradient-to-b from-[#FFF4D8] to-[#F3DFB1] text-[#3D0A0E]'
                    : day.isCurrentWeek
                      ? 'border-[#E2D5B8] bg-white text-[#7A6B57]'
                      : 'border-transparent bg-[#EFE8D5]/70 text-stone-400'
                }`}
              >
                <span className="text-[10px] font-bold">{formatShortVnDate(day.date)}</span>
                <span className="mt-1 text-xs font-extrabold">{active ? day.count : '·'}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Mục tiêu học tập */}
      <section className="rounded-2xl border border-[#E2D5B8] bg-[#FAF6EA] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2D1A10] flex items-center gap-2">
              <Target size={18} className="text-emerald-700" />
              Mục tiêu học tập
            </h3>
            <p className="mt-0.5 text-xs text-[#7A6B57]">
              Giữ 1 cam kết nhịp học tuần chính và tối đa 3 chỉ tiêu chi tiết tự chọn.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenGoalModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 cursor-pointer"
            >
              <Target size={14} /> {overview.primaryGoal ? 'Đổi cam kết tuần' : 'Đặt cam kết tuần'}
            </button>
            <button
              type="button"
              onClick={() => onOpenGoalModal(false)}
              className="inline-flex items-center gap-1 rounded-xl border border-[#D4AE67] bg-white px-3.5 py-2 text-xs font-bold text-[#7A1F24] hover:bg-[#F5EEDC] cursor-pointer"
            >
              <Plus size={14} /> Thêm chỉ tiêu riêng
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {allGoals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D4AE67] bg-white/70 p-6 text-center text-xs text-[#7A6B57]">
              Bạn chưa đặt mục tiêu học tập nào. Hãy chọn nhanh gói <strong>1x / 3x / 5x ngày/tuần</strong> để giữ động lực học đều đặn!
            </div>
          ) : (
            allGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onDelete={(id) => void handleDeleteGoal(id)}
              />
            ))
          )}
        </div>
      </section>

      {/* 3. Bộ sưu tập Huy hiệu */}
      <section className="rounded-2xl border border-[#E2D5B8] bg-[#FAF6EA] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#2D1A10] flex items-center gap-2">
              <Trophy size={18} className="text-[#C99C48]" />
              <span>Huy hiệu thành tựu</span>
              <span className="rounded-full bg-[#EFE3C7] px-2.5 py-0.5 text-xs font-extrabold text-[#7A1F24]">
                {unlockedCount}/{overview.achievements.length}
              </span>
            </h3>
            <p className="mt-0.5 text-xs text-[#7A6B57]">
              Tự động mở khóa và cộng XP thưởng khi bạn hoàn thành các cột mốc học tập.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {overview.achievements.map((item) => (
            <AchievementCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
