'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, RotateCw } from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import { emitGamificationRefresh } from '@/features/gamification/services/gamification.service';
import { FLIP_KEY_CODE, FlashcardRating, RATING_OPTIONS } from '../constants/flashcard.constants';
import { FlashcardApiService, type FlashcardDeck, type FlashcardItem } from '../services/flashcard.service';

/** Phiên ôn tập thẻ đến hạn theo thuật toán SM-2 (lật thẻ + chấm 4 mức nhớ). */
export function FlashcardStudySession({
  deck,
  studyAll = false,
  onExit,
}: {
  deck: FlashcardDeck;
  studyAll?: boolean;
  onExit: () => void;
}) {
  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const loader = studyAll ? FlashcardApiService.listCards(deck.id) : FlashcardApiService.listDueCards(deck.id);
    loader
      .then((list) => {
        if (alive) setCards(list);
      })
      .catch((err) => {
        if (alive) setError(extractErrorMessage(err, 'Không tải được thẻ cần ôn.'));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [deck.id, studyAll]);

  const currentCard = cards[index] ?? null;
  const isFinished = !loading && (cards.length === 0 || index >= cards.length);

  const handleRate = useCallback(
    async (rating: FlashcardRating) => {
      if (!currentCard || submitting) return;
      setSubmitting(true);
      setError(null);
      try {
        const updated = await FlashcardApiService.reviewCard(currentCard.id, rating);
        emitGamificationRefresh();
        setReviewedCount((c) => c + 1);
        setFlipped(false);
        if (rating === FlashcardRating.AGAIN) {
          // Đưa thẻ vừa quên về cuối phiên để ôn lại ngay trong lượt này.
          setCards((prev) => [...prev.slice(0, index), ...prev.slice(index + 1), updated]);
        } else {
          setIndex((i) => i + 1);
        }
      } catch (err) {
        setError(extractErrorMessage(err, 'Không lưu được kết quả ôn tập.'));
      } finally {
        setSubmitting(false);
      }
    },
    [currentCard, index, submitting],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isFinished || !currentCard) return;
      if (event.code === FLIP_KEY_CODE) {
        event.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      if (!flipped) return;
      const option = RATING_OPTIONS.find((o) => o.shortcut === event.key);
      if (option) {
        event.preventDefault();
        void handleRate(option.rating);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentCard, flipped, handleRate, isFinished]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-[var(--text-muted,#7A6B57)]">
        <Loader2 size={16} className="animate-spin" /> Đang chuẩn bị phiên ôn tập…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border,#E2D5B8)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--text-body,#2D1A10)] hover:border-[var(--gold,#B8893F)] cursor-pointer"
        >
          <ArrowLeft size={14} /> Quay lại bộ thẻ
        </button>

        <div className="text-xs font-semibold text-[var(--text-muted,#7A6B57)]">
          <span className="font-bold text-[var(--text-body,#2D1A10)]">{deck.title}</span>
          {!isFinished && (
            <>
              {' · '}
              <span className="font-[family-name:var(--font-mono)]">
                {index + 1} / {cards.length}
              </span>
            </>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {error}
        </p>
      )}

      {isFinished ? (
        <div className="rounded-2xl border border-[var(--border,#E2D5B8)] bg-white p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-700">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="mt-4 font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--text-body,#2D1A10)]">
            {reviewedCount > 0 ? 'Hoàn thành phiên ôn tập!' : 'Không có thẻ nào đến hạn hôm nay'}
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted,#7A6B57)]">
            {reviewedCount > 0
              ? `Bạn vừa ôn xong ${reviewedCount} lượt thẻ. Thuật toán SM-2 đã tự động hẹn lịch ôn tiếp theo.`
              : 'Mọi thẻ trong bộ này đều đã được ôn đúng lịch. Hãy quay lại khi có thẻ đến hạn hoặc thêm thẻ mới.'}
          </p>
          <button
            type="button"
            onClick={onExit}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary,#7A1F24)] px-5 py-2.5 text-xs font-bold text-white hover:brightness-110 cursor-pointer"
          >
            Về danh sách bộ thẻ
          </button>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Thanh tiến độ */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#EAE0CB]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#B8893F] to-[#7A1F24] transition-all duration-300"
              style={{ width: `${Math.round(((index + (flipped ? 0.5 : 0)) / cards.length) * 100)}%` }}
            />
          </div>

          {/* Thẻ lật */}
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="group flex min-h-[240px] w-full flex-col items-center justify-center rounded-2xl border border-[var(--border,#E2D5B8)] bg-white p-8 text-center shadow-xs transition hover:border-[var(--gold,#B8893F)] cursor-pointer"
          >
            <span className="mb-3 rounded border border-[var(--border,#E2D5B8)] bg-[var(--bg-page,#F5EEDC)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--gold,#B8893F)]">
              {flipped ? 'Mặt sau · Đáp án' : 'Mặt trước · Câu hỏi'}
            </span>
            <p className="whitespace-pre-line font-serif text-lg font-bold leading-relaxed text-[var(--text-body,#2D1A10)] sm:text-xl">
              {flipped ? currentCard?.back : currentCard?.front}
            </p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted,#7A6B57)]">
              <RotateCw size={12} /> Bấm vào thẻ hoặc nhấn Space để lật
            </span>
          </button>

          {/* Nút chấm điểm SM-2 */}
          {flipped ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {RATING_OPTIONS.map((opt) => (
                <button
                  key={opt.rating}
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleRate(opt.rating)}
                  className={`flex flex-col items-center rounded-xl border px-3 py-2.5 transition disabled:opacity-50 cursor-pointer ${opt.buttonClass}`}
                >
                  <span className="text-xs font-extrabold">{opt.label}</span>
                  <span className="mt-0.5 text-[10px] opacity-80">
                    {opt.hint} · [{opt.shortcut}]
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setFlipped(true)}
                className="rounded-xl bg-gradient-to-r from-[#7A1F24] to-[#91252B] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-110 cursor-pointer"
              >
                Hiện đáp án
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
