'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Layers,
  Loader2,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { KeyboardKey } from '@/constants/enums';
import { AccountTabKey, accountTabRoute } from '@/features/account/components/AccountView';
import type { FlashcardDeck } from '@/features/flashcards/services/flashcard.service';
import {
  MINDMAP_RECALL_STRATEGY_OPTIONS,
  MindmapCollapsePreset,
  MindmapRecallMode,
  type MindmapRecallStrategyOption,
} from '../constants/mindmap.constants';
import type { RecallProgressStats } from '../hooks/use-mindmap-recall-session';

const COLLAPSE_PRESET_ACTIONS: ReadonlyArray<{
  preset: MindmapCollapsePreset;
  label: string;
  shortHint: string;
}> = [
  {
    preset: MindmapCollapsePreset.ROOT_ONLY,
    label: 'Về gốc',
    shortHint: 'Thu gọn về chủ đề gốc',
  },
  {
    preset: MindmapCollapsePreset.LEVEL_1,
    label: 'Tầng 1',
    shortHint: 'Chỉ hiện các nhánh chính',
  },
  {
    preset: MindmapCollapsePreset.EXPAND_ALL,
    label: 'Mở hết',
    shortHint: 'Mở rộng toàn bộ nhánh',
  },
];

function StrategyOptionItem({
  option,
  selected,
  onSelect,
}: {
  option: MindmapRecallStrategyOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition cursor-pointer ${
        selected
          ? 'border-[#7A1F24]/50 bg-[#FDF9F3] shadow-2xs ring-1 ring-[#7A1F24]/15'
          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70'
      }`}
    >
      <span
        className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg font-mono text-[11px] font-extrabold transition ${
          selected
            ? 'bg-[#7A1F24] text-white'
            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/80'
        }`}
      >
        {option.stepNumber}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-[family-name:var(--font-heading)] text-[13px] font-bold text-slate-900">
            {option.title}
          </span>
          {selected && (
            <Check size={14} className="shrink-0 text-[#7A1F24]" />
          )}
        </span>
        <span className="mt-0.5 block line-clamp-2 text-[11.5px] leading-relaxed text-slate-600">
          {option.summary}
        </span>
      </span>
    </button>
  );
}

export interface MindmapRecallTriggerProps {
  isOpen: boolean;
  isStudyMode: boolean;
  selectedMode: MindmapRecallMode;
  activeMode: MindmapRecallMode;
  stats: RecallProgressStats;
  onToggleOpen: () => void;
  onClose: () => void;
  onSelectMode: (mode: MindmapRecallMode) => void;
  onApplyStrategy: (mode: MindmapRecallMode) => void;
  onExitStudyMode: () => void;
  onApplyEditCollapsePreset: (preset: MindmapCollapsePreset) => void;
}

/**
 * Nút kích hoạt gọn trên thanh công cụ (`✨ Gợi ý ôn tập`) kèm Popover 320–380px (Desktop)
 * và tự động chuyển thành Bottom Sheet trên Mobile (< 640px).
 */
export function MindmapRecallPopoverTrigger({
  isOpen,
  isStudyMode,
  selectedMode,
  activeMode,
  stats,
  onToggleOpen,
  onClose,
  onSelectMode,
  onApplyStrategy,
  onExitStudyMode,
  onApplyEditCollapsePreset,
}: MindmapRecallTriggerProps) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.ESCAPE) {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const activeOption = MINDMAP_RECALL_STRATEGY_OPTIONS.find(
    (item) => item.mode === activeMode,
  );

  return (
    <div className="relative">
      <button
        type="button"
        id="btn-mindmap-recall-popover"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={onToggleOpen}
        title="Mở gợi ý ôn tập"
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
          isStudyMode
            ? 'border-[#7A1F24] bg-[#7A1F24] text-white shadow-xs'
            : isOpen
              ? 'border-[#B8893F] bg-[#FAF5E6] text-[#7A1F24]'
              : 'border-[#E6D5B8] bg-[#FDF9F2] text-[#7A1F24] hover:border-[#B8893F] hover:bg-[#FAF5E6]'
        }`}
      >
        <Sparkles size={13} className={isStudyMode ? 'text-amber-200' : 'text-[#B8893F]'} />
        <span>Gợi ý ôn tập</span>
        {isStudyMode && stats.totalTestable > 0 && (
          <span className="ml-0.5 rounded-full bg-white/20 px-1.5 py-0.5 font-mono text-[10px] font-extrabold">
            {stats.rememberedCount}/{stats.totalTestable}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            aria-hidden="true"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px] sm:bg-transparent sm:backdrop-blur-none"
          />

          <section
            role="dialog"
            aria-modal="false"
            aria-label="Gợi ý ôn tập sơ đồ tư duy"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border border-slate-200/95 bg-white p-4 shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[360px] sm:rounded-2xl sm:p-4 sm:shadow-[0_18px_42px_-12px_rgba(15,23,42,0.22)]"
          >
            {/* Thanh nắm kéo đặc trưng của Bottom Sheet trên Mobile */}
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />

            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-[family-name:var(--font-heading)] text-sm font-bold text-slate-900">
                    Gợi ý ôn tập
                  </h3>
                  <span className="rounded-full border border-[#E6D5B8] bg-[#FAF5E6] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#8C5E1A]">
                    Recommended
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Có 3 chiến lược giúp bạn ghi nhớ dòng thời gian hiệu quả hơn.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng bảng gợi ý ôn tập"
                title="Đóng (Esc)"
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="mt-3.5 space-y-2">
              {MINDMAP_RECALL_STRATEGY_OPTIONS.map((option) => (
                <StrategyOptionItem
                  key={option.mode}
                  option={option}
                  selected={selectedMode === option.mode}
                  onSelect={() => onSelectMode(option.mode)}
                />
              ))}
            </div>

            <div className="mt-3.5 flex items-center gap-2">
              <button
                type="button"
                id="btn-apply-mindmap-recall"
                onClick={() => onApplyStrategy(selectedMode)}
                className="flex-1 rounded-xl bg-[#7A1F24] px-3.5 py-2.5 text-center text-xs font-bold text-white shadow-xs transition hover:bg-[#5E161A] cursor-pointer"
              >
                {isStudyMode && activeMode === selectedMode
                  ? `Làm mới chiến lược ${activeOption?.stepNumber ?? ''}`
                  : 'Áp dụng chiến lược ôn tập'}
              </button>

              {isStudyMode && (
                <button
                  type="button"
                  onClick={onExitStudyMode}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 cursor-pointer"
                >
                  Thoát ôn
                </button>
              )}
            </div>

            {!isStudyMode && (
              <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <span className="text-[11px] font-medium text-slate-500">
                  Thu gọn nhanh sơ đồ:
                </span>
                <div className="inline-flex items-center gap-1">
                  {COLLAPSE_PRESET_ACTIONS.map((item) => (
                    <button
                      key={item.preset}
                      type="button"
                      title={item.shortHint}
                      onClick={() => {
                        onApplyEditCollapsePreset(item.preset);
                        onClose();
                      }}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/**
 * Thanh trạng thái nổi siêu gọn góc trên phải Canvas khi đang trong phiên Ôn tập
 * (không che khuất trung tâm sơ đồ và các mốc thời gian).
 */
export function MindmapActiveStudyPill({
  activeMode,
  stats,
  creatingDeck,
  createdDeck,
  deckError,
  onOpenStrategyPopover,
  onReset,
  onRetryWeakOnly,
  onExportFlashcards,
  onExit,
}: {
  activeMode: MindmapRecallMode;
  stats: RecallProgressStats;
  creatingDeck: boolean;
  createdDeck: FlashcardDeck | null;
  deckError: string | null;
  onOpenStrategyPopover: () => void;
  onReset: () => void;
  onRetryWeakOnly: () => void;
  onExportFlashcards: () => void;
  onExit: () => void;
}) {
  const currentOption = MINDMAP_RECALL_STRATEGY_OPTIONS.find(
    (o) => o.mode === activeMode,
  );
  const weakTargetCount =
    stats.needsReviewCount > 0
      ? stats.needsReviewCount
      : Math.max(0, stats.totalTestable - stats.rememberedCount);

  return (
    <div className="pointer-events-auto absolute right-3.5 top-3.5 z-30 flex max-w-[calc(100vw-4.5rem)] flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#E6D5B8] bg-white/95 px-3 py-1.5 text-xs shadow-lg backdrop-blur-xs">
        <button
          type="button"
          onClick={onOpenStrategyPopover}
          title="Đổi chiến lược ôn tập"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF5E6] px-2 py-1 font-bold text-[#7A1F24] transition hover:bg-[#F3E9CE] cursor-pointer"
        >
          <Sparkles size={12} className="text-[#B8893F]" />
          <span>
            {currentOption
              ? `${currentOption.stepNumber} · ${currentOption.title}`
              : 'Đang ôn tập'}
          </span>
        </button>

        <span className="px-1.5 font-semibold text-slate-700">
          Đã nhớ{' '}
          <strong className="text-emerald-700">{stats.rememberedCount}</strong>/
          {stats.totalTestable}
        </span>

        {stats.needsReviewCount > 0 && (
          <button
            type="button"
            onClick={onRetryWeakOnly}
            title="Chỉ che lại các nhánh chưa thuộc"
            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-900 transition hover:bg-amber-100 cursor-pointer"
          >
            <RotateCcw size={11} />
            <span>Ôn lại ({stats.needsReviewCount})</span>
          </button>
        )}

        {weakTargetCount > 0 && !createdDeck && (
          <button
            type="button"
            disabled={creatingDeck}
            onClick={onExportFlashcards}
            title="Tạo thẻ ghi nhớ SM-2"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-[#7A1F24]/40 hover:text-[#7A1F24] disabled:opacity-50 cursor-pointer"
          >
            {creatingDeck ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Layers size={11} />
            )}
            <span>Tạo Flashcard ({weakTargetCount})</span>
          </button>
        )}

        <button
          type="button"
          onClick={onReset}
          title="Che lại toàn bộ từ đầu"
          aria-label="Che lại từ đầu"
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
        >
          <RotateCcw size={13} />
        </button>

        <button
          type="button"
          onClick={onExit}
          title="Thoát chế độ ôn tập (Esc)"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
        >
          <X size={12} />
          <span>Thoát</span>
        </button>
      </div>

      {createdDeck && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/95 px-3 py-1.5 text-[11px] font-semibold text-emerald-900 shadow-sm">
          <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
          <span>Đã tạo bộ thẻ &ldquo;{createdDeck.title}&rdquo;</span>
          <Link
            href={accountTabRoute(AccountTabKey.FLASHCARDS)}
            className="inline-flex items-center gap-1 font-bold text-emerald-800 underline hover:text-emerald-950"
          >
            Mở thẻ <ExternalLink size={11} />
          </Link>
        </div>
      )}

      {deckError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-medium text-rose-800 shadow-sm">
          {deckError}
        </div>
      )}
    </div>
  );
}
