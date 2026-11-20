import {
  computeNextStreakCounters,
  resolveEffectiveStreak,
  resolveScholarRank,
} from './streak-stats.service';

describe('StreakStats helpers', () => {
  it('tính chuỗi ngày & chuỗi tuần liên tiếp chính xác khi học nhiều ngày', () => {
    const day1 = computeNextStreakCounters(null, '2026-11-18', '2026-W47');
    expect(day1).toEqual({
      currentDayStreak: 1,
      longestDayStreak: 1,
      currentWeekStreak: 1,
      longestWeekStreak: 1,
    });

    const sameDay = computeNextStreakCounters(
      { ...day1, lastActiveDate: '2026-11-18', lastActiveWeekKey: '2026-W47' },
      '2026-11-18',
      '2026-W47',
    );
    expect(sameDay.currentDayStreak).toBe(1);

    const nextDay = computeNextStreakCounters(
      { ...day1, lastActiveDate: '2026-11-18', lastActiveWeekKey: '2026-W47' },
      '2026-11-19',
      '2026-W47',
    );
    expect(nextDay.currentDayStreak).toBe(2);
    expect(nextDay.longestDayStreak).toBe(2);

    // Nhảy cóc qua 2 ngày -> reset chuỗi ngày về 1 nhưng tuần sau liên tiếp vẫn tăng
    const skippedDayNextWeek = computeNextStreakCounters(
      {
        ...nextDay,
        lastActiveDate: '2026-11-19',
        lastActiveWeekKey: '2026-W47',
      },
      '2026-11-23',
      '2026-W48',
    );
    expect(skippedDayNextWeek.currentDayStreak).toBe(1);
    expect(skippedDayNextWeek.longestDayStreak).toBe(2);
    expect(skippedDayNextWeek.currentWeekStreak).toBe(2);
  });

  it('resolveEffectiveStreak giữ hiển thị chuỗi nếu mới học hôm qua, reset 0 nếu quá hạn', () => {
    const stats = {
      id: 's1',
      userId: 'u1',
      totalXp: 150,
      currentDayStreak: 5,
      longestDayStreak: 7,
      currentWeekStreak: 2,
      longestWeekStreak: 2,
      lastActiveDate: '2026-11-18',
      lastActiveWeekKey: '2026-W47',
      completedLessonsCount: 2,
      passedQuizzesCount: 1,
      reviewedFlashcardsCount: 10,
      readArticlesCount: 1,
      createdMindmapsCount: 0,
      createdNotesCount: 0,
      totalActivitiesCount: 14,
      updatedAt: new Date(),
    };

    const yesterdayActive = resolveEffectiveStreak(
      stats,
      new Date('2026-11-19T12:00:00.000Z'),
    );
    expect(yesterdayActive.currentDayStreak).toBe(5);
    expect(yesterdayActive.studiedToday).toBe(false);

    const brokenAfter2Days = resolveEffectiveStreak(
      stats,
      new Date('2026-11-20T12:00:00.000Z'),
    );
    expect(brokenAfter2Days.currentDayStreak).toBe(0);
    expect(brokenAfter2Days.longestDayStreak).toBe(7);
  });

  it('xếp cấp bậc sử học theo mốc XP', () => {
    expect(resolveScholarRank(0).current.label).toBe('Mầm sử học');
    expect(resolveScholarRank(350).current.label).toBe('Học giả');
    expect(resolveScholarRank(3500).next).toBeNull();
  });
});
