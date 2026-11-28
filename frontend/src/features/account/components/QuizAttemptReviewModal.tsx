'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  RotateCcw,
  Trophy,
  X,
  XCircle,
} from 'lucide-react';
import { KeyboardKey } from '@/constants/enums';
import { PracticeQuestionCard } from '@/features/quiz/components/PracticeQuizParts';
import { formatExamTime } from '@/features/quiz/utils/practice-quiz.helper';
import { extractErrorMessage } from '@/services/api';
import {
  LearnerApiService,
  type LearnerQuizAttemptDetail,
} from '@/services/entities/learner.service';

const noopSetAnswer = () => {};
const noopMoveOrdering = () => {};

function formatVnDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function AttemptReviewSummaryBar({
  detail,
  wrongCount,
  showWrongOnly,
  onToggleWrongOnly,
}: {
  detail: LearnerQuizAttemptDetail;
  wrongCount: number;
  showWrongOnly: boolean;
  onToggleWrongOnly: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2D5B8] bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold ${
            detail.isPassed
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-rose-100 text-rose-800'
          }`}
        >
          {detail.isPassed ? (
            <CheckCircle2 size={14} />
          ) : (
            <XCircle size={14} />
          )}
          {detail.isPassed ? 'Đạt chuẩn' : 'Chưa đạt'} · {detail.scorePercent}%
        </span>

        <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700">
          <Trophy size={14} className="text-[#B8893F]" />
          {detail.correctCount}/{detail.totalQuestions} câu đúng
        </span>

        <span className="inline-flex items-center gap-1 text-xs text-stone-500">
          <Clock size={13} />
          {formatExamTime(detail.timeSpentSeconds)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {wrongCount > 0 && (
          <button
            type="button"
            onClick={onToggleWrongOnly}
            aria-pressed={showWrongOnly}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              showWrongOnly
                ? 'border-rose-300 bg-rose-600 text-white'
                : 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <Filter size={12} />
            {showWrongOnly
              ? 'Xem tất cả câu'
              : `Chỉ xem câu sai (${wrongCount})`}
          </button>
        )}

        <Link
          href={`/luyen-tap?quizId=${encodeURIComponent(detail.quizId)}`}
          className="inline-flex items-center gap-1 rounded-xl bg-[#7A1F24] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#5E161A]"
        >
          Làm lại đề này <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

function AttemptReviewBody({
  loading,
  error,
  detail,
  showWrongOnly,
  onToggleWrongOnly,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  detail: LearnerQuizAttemptDetail | null;
  showWrongOnly: boolean;
  onToggleWrongOnly: () => void;
  onRetry: () => void;
}) {
  const wrongQuestions = useMemo(
    () => (detail ? detail.questions.filter((q) => !detail.results[q.id]) : []),
    [detail],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-stone-500">
        <Loader2 size={28} className="animate-spin text-[#7A1F24]" />
        <p className="mt-2 text-xs font-semibold">
          Đang tải đáp án & lời giải từng câu…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <AlertCircle size={28} className="mx-auto text-rose-500" />
        <p className="mt-2 text-sm font-semibold text-rose-800">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-rose-800 shadow-2xs hover:bg-rose-100 cursor-pointer"
        >
          <RotateCcw size={13} /> Thử lại
        </button>
      </div>
    );
  }

  if (!detail) return null;

  const visibleQuestions = showWrongOnly ? wrongQuestions : detail.questions;

  return (
    <div className="space-y-4">
      <AttemptReviewSummaryBar
        detail={detail}
        wrongCount={wrongQuestions.length}
        showWrongOnly={showWrongOnly}
        onToggleWrongOnly={onToggleWrongOnly}
      />

      {visibleQuestions.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-xs text-stone-500">
          Câu hỏi của đề này đã được cập nhật hoặc không còn khả dụng.
        </div>
      ) : (
        <div className="space-y-3.5">
          {visibleQuestions.map((q) => {
            const originalIdx = detail.questions.findIndex(
              (orig) => orig.id === q.id,
            );
            return (
              <PracticeQuestionCard
                key={q.id}
                question={q}
                domId={`review-q-${q.id}`}
                index={originalIdx >= 0 ? originalIdx : 0}
                answer={detail.answers[q.id]}
                submitted={true}
                isCorrect={detail.results[q.id]}
                setAnswer={noopSetAnswer}
                moveOrderingItem={noopMoveOrdering}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function QuizAttemptReviewModal({
  attemptId,
  onClose,
}: {
  attemptId: string | null;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<LearnerQuizAttemptDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWrongOnly, setShowWrongOnly] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!attemptId) return undefined;
    let cancelled = false;
    queueMicrotask(() => {
      setLoading(true);
      setError(null);
      setShowWrongOnly(false);
    });

    LearnerApiService.getQuizAttemptDetail(attemptId)
      .then((res) => {
        if (!cancelled) setDetail(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            extractErrorMessage(
              err,
              'Không tải được chi tiết bài làm. Vui lòng thử lại.',
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attemptId, reloadTick]);

  useEffect(() => {
    if (!attemptId) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.ESCAPE) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [attemptId, onClose]);

  if (!attemptId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Xem lại chi tiết bài làm"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#E2D5B8] bg-[#FAF7F2] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E2D5B8] bg-white px-5 py-4">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A1F24]">
              Xem lại bài làm khảo thí
            </span>
            <h3 className="mt-0.5 truncate font-[family-name:var(--font-heading)] text-base font-bold text-[#2D1A10] sm:text-lg">
              {detail?.quizTitle ?? 'Đang tải bài làm…'}
            </h3>
            {detail && (
              <p className="mt-0.5 text-xs text-[#7A6B57]">
                Nộp lúc {formatVnDateTime(detail.createdAt)} · Chuẩn đạt{' '}
                {detail.passingScorePercent}%
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-xl p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <AttemptReviewBody
            loading={loading}
            error={error}
            detail={detail}
            showWrongOnly={showWrongOnly}
            onToggleWrongOnly={() => setShowWrongOnly((v) => !v)}
            onRetry={() => setReloadTick((n) => n + 1)}
          />
        </div>
      </div>
    </div>
  );
}
