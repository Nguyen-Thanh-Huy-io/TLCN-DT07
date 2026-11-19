import { FlashcardRating, SM2_DEFAULTS } from './flashcard.constant';
import { Sm2Scheduler } from './sm2.scheduler';

describe('Sm2Scheduler', () => {
  const scheduler = new Sm2Scheduler();
  const baseDate = new Date('2026-11-19T12:00:00.000Z');

  it('AGAIN đặt lại repetitions = 0, interval = 0 và hẹn ôn lại sau 10 phút', () => {
    const res = scheduler.schedule(
      { repetitions: 3, intervalDays: 15, easeFactor: 2.5 },
      FlashcardRating.AGAIN,
      baseDate,
    );

    expect(res.repetitions).toBe(0);
    expect(res.intervalDays).toBe(0);
    expect(res.easeFactor).toBe(2.3);
    expect(res.nextReviewAt.getTime()).toBe(
      baseDate.getTime() + SM2_DEFAULTS.AGAIN_RETRY_MINUTES * 60 * 1000,
    );
  });

  it('GOOD tăng dần khoảng cách 1 ngày → 6 ngày → round(interval * easeFactor)', () => {
    const r1 = scheduler.schedule(
      { repetitions: 0, intervalDays: 0, easeFactor: 2.5 },
      FlashcardRating.GOOD,
      baseDate,
    );
    expect(r1.repetitions).toBe(1);
    expect(r1.intervalDays).toBe(1);

    const r2 = scheduler.schedule(r1, FlashcardRating.GOOD, baseDate);
    expect(r2.repetitions).toBe(2);
    expect(r2.intervalDays).toBe(6);

    const r3 = scheduler.schedule(r2, FlashcardRating.GOOD, baseDate);
    expect(r3.repetitions).toBe(3);
    expect(r3.intervalDays).toBe(15);
  });

  it('EASY cho thẻ mới đặt interval 4 ngày và tăng easeFactor', () => {
    const res = scheduler.schedule(
      { repetitions: 0, intervalDays: 0, easeFactor: 2.5 },
      FlashcardRating.EASY,
      baseDate,
    );

    expect(res.repetitions).toBe(1);
    expect(res.intervalDays).toBe(4);
    expect(res.easeFactor).toBe(2.65);
  });

  it('easeFactor không giảm thấp hơn MIN_EASE_FACTOR (1.3)', () => {
    const res = scheduler.schedule(
      { repetitions: 1, intervalDays: 1, easeFactor: 1.35 },
      FlashcardRating.AGAIN,
      baseDate,
    );
    expect(res.easeFactor).toBe(SM2_DEFAULTS.MIN_EASE_FACTOR);
  });
});
