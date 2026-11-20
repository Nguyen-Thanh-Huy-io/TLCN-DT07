import { Injectable } from '@nestjs/common';
import { FlashcardRating, SM2_DEFAULTS } from './flashcard.constant';

export interface ReviewCardState {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
}

export interface ScheduledReviewResult extends ReviewCardState {
  nextReviewAt: Date;
}

export interface SpacedRepetitionStrategy {
  schedule(
    current: ReviewCardState,
    rating: FlashcardRating,
    now?: Date,
  ): ScheduledReviewResult;
}

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const RATING_HANDLERS: Record<
  FlashcardRating,
  (state: ReviewCardState) => ReviewCardState
> = {
  [FlashcardRating.AGAIN]: ({ easeFactor }) => ({
    repetitions: 0,
    intervalDays: 0,
    easeFactor: Math.max(SM2_DEFAULTS.MIN_EASE_FACTOR, easeFactor - 0.2),
  }),

  [FlashcardRating.HARD]: ({ repetitions, intervalDays, easeFactor }) => ({
    repetitions: repetitions + 1,
    intervalDays:
      repetitions === 0 ? 1 : Math.max(1, Math.round(intervalDays * 1.2)),
    easeFactor: Math.max(SM2_DEFAULTS.MIN_EASE_FACTOR, easeFactor - 0.15),
  }),

  [FlashcardRating.GOOD]: ({ repetitions, intervalDays, easeFactor }) => {
    let nextInterval: number;
    if (repetitions === 0) nextInterval = 1;
    else if (repetitions === 1) nextInterval = 6;
    else nextInterval = Math.max(1, Math.round(intervalDays * easeFactor));

    return {
      repetitions: repetitions + 1,
      intervalDays: nextInterval,
      easeFactor,
    };
  },

  [FlashcardRating.EASY]: ({ repetitions, intervalDays, easeFactor }) => ({
    repetitions: repetitions + 1,
    intervalDays:
      repetitions === 0
        ? 4
        : Math.max(
            intervalDays + 1,
            Math.round(intervalDays * easeFactor * 1.3),
          ),
    easeFactor: easeFactor + 0.15,
  }),
};

/** Bộ lập lịch lặp lại ngắt quãng theo thuật toán SM-2 (Strategy Pattern). */
@Injectable()
export class Sm2Scheduler implements SpacedRepetitionStrategy {
  schedule(
    current: ReviewCardState,
    rating: FlashcardRating,
    now: Date = new Date(),
  ): ScheduledReviewResult {
    const next = RATING_HANDLERS[rating](current);
    const delayMs =
      next.intervalDays === 0
        ? SM2_DEFAULTS.AGAIN_RETRY_MINUTES * MINUTE_MS
        : next.intervalDays * DAY_MS;

    return {
      ...next,
      easeFactor: Number(next.easeFactor.toFixed(2)),
      nextReviewAt: new Date(now.getTime() + delayMs),
    };
  }
}
