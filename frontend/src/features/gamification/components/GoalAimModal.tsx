'use client';

import React, { useState } from 'react';
import { Loader2, Target, X } from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import {
  GOAL_PERIOD_OPTIONS,
  GOAL_PRESET_CARDS,
  GOAL_TARGET_OPTIONS,
  GoalPeriod,
  GoalPresetKey,
  GoalTargetType,
} from '../constants/gamification.constants';
import { GamificationApiService } from '../services/gamification.service';

interface GoalAimModalProps {
  open: boolean;
  defaultIsPrimary?: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function GoalAimModal({
  open,
  defaultIsPrimary = true,
  onClose,
  onCreated,
}: GoalAimModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<GoalPresetKey>(
    defaultIsPrimary ? GoalPresetKey.PRESET_3X : GoalPresetKey.CUSTOM,
  );
  const [isPrimary, setIsPrimary] = useState(defaultIsPrimary);
  const [targetType, setTargetType] = useState<GoalTargetType>(
    defaultIsPrimary ? GoalTargetType.STUDY_DAYS : GoalTargetType.COMPLETE_LESSONS,
  );
  const [period, setPeriod] = useState<GoalPeriod>(GoalPeriod.WEEKLY);
  const [targetValue, setTargetValue] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const isCustom = selectedPreset === GoalPresetKey.CUSTOM;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await GamificationApiService.createGoal({
        presetKey: selectedPreset,
        isPrimary: isCustom ? isPrimary : true,
        ...(isCustom
          ? {
              targetType,
              period,
              targetValue: Math.max(1, Math.min(200, Math.floor(targetValue) || 1)),
            }
          : {}),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Không lưu được mục tiêu học tập.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-aim-modal-title"
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-[#E2D5B8] bg-[#FAF6EA] p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng hộp thoại mục tiêu"
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-[#7A6B57] hover:bg-[#EFE3C7] hover:text-[#2D1A10] cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl border border-[#D4AE67]/50 bg-gradient-to-br from-[#FFF6E3] to-[#F3DEAB] text-[#7A1F24] shadow-xs">
          <Target size={24} />
        </div>

        <h2
          id="goal-aim-modal-title"
          className="text-center font-[family-name:var(--font-heading)] text-xl sm:text-2xl font-bold text-[#2D1A10]"
        >
          Giữ nhịp học sử đều đặn mỗi tuần
        </h2>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-[#7A6B57]">
          Chọn mức cam kết phù hợp để HISGO theo dõi tiến độ và giúp bạn giữ vững chuỗi học tập.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-2.5">
          {GOAL_PRESET_CARDS.map((card) => {
            const active = selectedPreset === card.key;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => {
                  setSelectedPreset(card.key);
                  if (card.key !== GoalPresetKey.CUSTOM) setIsPrimary(true);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition cursor-pointer ${
                  active
                    ? 'border-[#16A34A] bg-white ring-1 ring-[#16A34A]/30 shadow-xs'
                    : 'border-[#E2D5B8] bg-white/80 hover:border-[#C99C48]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-xl border text-xs font-extrabold ${card.badgeBgClass} ${card.badgeTextClass}`}
                  >
                    {card.badgeText}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#2D1A10]">
                      {card.title}{' '}
                      <span className="font-normal text-[#7A6B57]">· {card.subtitle}</span>
                    </div>
                  </div>
                </div>
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                    active ? 'border-[#16A34A] bg-emerald-50' : 'border-stone-300 bg-white'
                  }`}
                >
                  {active && <span className="size-2.5 rounded-full bg-[#16A34A]" />}
                </span>
              </button>
            );
          })}

          {isCustom && (
            <div className="rounded-2xl border border-[#E2D5B8] bg-white p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-xs">
                  <span className="font-bold text-[#2D1A10]">Loại chỉ tiêu</span>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as GoalTargetType)}
                    className="mt-1 w-full rounded-xl border border-[#E2D5B8] bg-[#FAF6EA] px-3 py-2 text-xs font-medium text-[#2D1A10] outline-none focus:border-[#7A1F24]"
                  >
                    {GOAL_TARGET_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs">
                  <span className="font-bold text-[#2D1A10]">Chu kỳ</span>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as GoalPeriod)}
                    className="mt-1 w-full rounded-xl border border-[#E2D5B8] bg-[#FAF6EA] px-3 py-2 text-xs font-medium text-[#2D1A10] outline-none focus:border-[#7A1F24]"
                  >
                    {GOAL_PERIOD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <label className="block text-xs">
                  <span className="font-bold text-[#2D1A10]">Số lượng mục tiêu</span>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#E2D5B8] bg-[#FAF6EA] px-3 py-2 text-xs font-bold text-[#2D1A10] outline-none focus:border-[#7A1F24]"
                  />
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-[#E2D5B8] bg-[#FAF6EA] px-3 py-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="accent-[#7A1F24]"
                  />
                  <span className="font-semibold text-[#2D1A10]">Đặt làm cam kết chính</span>
                </label>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="pt-2 flex flex-col items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full sm:w-auto min-w-56 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-50 cursor-pointer"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              Cam kết mục tiêu này
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-[#7A6B57] hover:text-[#2D1A10] py-1 cursor-pointer"
            >
              Huỷ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
