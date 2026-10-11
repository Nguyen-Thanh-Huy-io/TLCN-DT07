'use client';
import React from 'react';
import { DifficultyLevel } from '@/constants/enums';

export interface LessonDifficultySelectorProps {
  value: DifficultyLevel;
  onChange: (val: DifficultyLevel) => void;
  disabled?: boolean;
}

const DIFFICULTY_CONFIG: Record<
  DifficultyLevel,
  { label: string; activeClass: string; dotClass: string }
> = {
  [DifficultyLevel.EASY]: {
    label: 'Dễ',
    activeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400 font-bold',
    dotClass: 'bg-emerald-500',
  },
  [DifficultyLevel.MEDIUM]: {
    label: 'Trung bình',
    activeClass: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400 font-bold',
    dotClass: 'bg-amber-500',
  },
  [DifficultyLevel.HARD]: {
    label: 'Nâng cao',
    activeClass: 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-400 font-bold',
    dotClass: 'bg-rose-500',
  },
};

export function LessonDifficultySelector({
  value,
  onChange,
  disabled = false,
}: LessonDifficultySelectorProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
        Độ khó bài học
      </label>
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 border border-slate-200/80 rounded-lg">
        {(Object.keys(DIFFICULTY_CONFIG) as DifficultyLevel[]).map((level) => {
          const config = DIFFICULTY_CONFIG[level];
          const isSelected = value === level;

          return (
            <button
              key={level}
              type="button"
              disabled={disabled}
              onClick={() => onChange(level)}
              className={`py-1.5 px-2 rounded-md text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                isSelected
                  ? config.activeClass
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
