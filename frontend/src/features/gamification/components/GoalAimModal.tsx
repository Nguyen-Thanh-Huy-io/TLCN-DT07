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
  const targetOptions =
    period === GoalPeriod.DAILY
      ? GOAL_TARGET_OPTIONS.filter((opt) => opt.value !== GoalTargetType.STUDY_DAYS)
      : GOAL_TARGET_OPTIONS;
  const activeUnit =
    GOAL_TARGET_OPTIONS.find((opt) => opt.value === targetType)?.unitLabel ?? 'lần';

  const handlePeriodChange = (nextPeriod: GoalPeriod) => {
    setPeriod(nextPeriod);
    if (nextPeriod === GoalPeriod.DAILY && targetType === GoalTargetType.STUDY_DAYS) {
      setTargetType(GoalTargetType.COMPLETE_LESSONS);
    }
  };

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
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#E2D5B8] bg-[#FAF6EA] p-5 sm:p-6 shadow-2xl"
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

        <div className="mx-auto mb-2.5 grid size-10 place-items-center rounded-2xl border border-[#D4AE67]/50 bg-gradient-to-br from-[#FFF6E3] to-[#F3DEAB] text-[#7A1F24] shadow-xs">
          <Target size={20} />
        </div>

        <h2
          id="goal-aim-modal-title"
          className="text-center font-[family-name:var(--font-heading)] text-lg sm:text-xl font-bold text-[#2D1A10]"
        >
          Giữ nhịp học sử đều đặn mỗi tuần
        </h2>
        <p className="mt-1 text-center text-xs text-[#7A6B57]">
          Chọn mức cam kết phù hợp để HISGO theo dõi tiến độ và giữ vững chuỗi học tập.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-2">
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
                    className={`grid size-8 shrink-0 place-items-center rounded-xl border text-xs font-extrabold ${card.badgeBgClass} ${card.badgeTextClass}`}
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
                    className="mt-1.5 h-9 w-full rounded-xl border border-[#E2D5B8] bg-[#FAF6EA] px-3 text-xs font-semibold text-[#2D1A10] outline-none focus:border-[#7A1F24]"
                  >
                    {targetOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="block text-xs">
                  <span className="font-bold text-[#2D1A10]">Chu kỳ theo dõi</span>
                  <div className="mt-1.5 grid h-9 grid-cols-2 gap-1 rounded-xl border border-[#E2D5B8] bg-[#FAF6EA] p-1">
                    {GOAL_PERIOD_OPTIONS.map((opt) => {
                      const activePeriod = period === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          title={opt.hint}
                          onClick={() => handlePeriodChange(opt.value)}
                          className={`rounded-lg text-xs font-bold transition cursor-pointer ${
                            activePeriod
                              ? 'bg-[#7A1F24] text-white shadow-2xs'
                              : 'text-[#7A6B57] hover:text-[#2D1A10]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <label className="block text-xs">
                  <span className="font-bold text-[#2D1A10]">Số lượng mục tiêu</span>
                  <div className="mt-1.5 flex h-9 items-center overflow-hidden rounded-xl border border-[#E2D5B8] bg-[#FAF6EA] focus-within:border-[#7A1F24]">
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={targetValue}
                      onChange={(e) => setTargetValue(Number(e.target.value))}
                      className="h-full w-full bg-transparent px-3 text-xs font-bold text-[#2D1A10] outline-none"
                    />
                    <span className="shrink-0 border-l border-[#E2D5B8] bg-[#F5EEDC] px-2.5 text-[11px] font-semibold text-[#7A6B57] h-full flex items-center">
                      {activeUnit}
                    </span>
                  </div>
                </label>

                <label className="flex h-9 items-center gap-2 rounded-xl border border-[#E2D5B8] bg-[#FAF6EA] px-3 text-xs cursor-pointer hover:border-[#C99C48]">
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
