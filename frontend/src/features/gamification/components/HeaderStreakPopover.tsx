'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Flame, Sprout, Target } from 'lucide-react';
import { KeyboardKey } from '@/constants/enums';
import { useGamificationOverview } from '../services/gamification.service';

export function HeaderStreakPopover({ enabled }: { enabled: boolean }) {
  const { overview } = useGamificationOverview(enabled);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

  const headline =
    dayStreak === 0
      ? 'Chưa có chuỗi ngày học'
      : `${dayStreak} ngày liên tiếp`;

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
          {/* Phần đầu minh hoạ vòng tròn chuỗi kiểu Buffer */}
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
