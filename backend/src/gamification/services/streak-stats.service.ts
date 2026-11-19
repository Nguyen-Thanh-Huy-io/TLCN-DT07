import { Injectable } from '@nestjs/common';
import { GamificationActivityType, UserLearningStats } from '@prisma/client';
import {
  PrismaClientOrTx,
  PrismaService,
} from '../../common/services/prisma.service';
import { SCHOLAR_RANKS, ScholarRankSpec } from '../gamification.constant';
import {
  diffIsoWeekKeys,
  diffVnDateKeys,
  listCurrentWeekVnDateKeys,
  listRecentVnDateKeys,
  toVnDateKey,
  toVnWeekKey,
} from '../utils/vn-date.util';

export interface StreakCalculationSnapshot {
  currentDayStreak: number;
  longestDayStreak: number;
  currentWeekStreak: number;
  longestWeekStreak: number;
  studiedToday: boolean;
  studiedThisWeek: boolean;
}

export interface RankProgressSummary {
  current: ScholarRankSpec;
  next: ScholarRankSpec | null;
  progressPercent: number;
}

export function resolveScholarRank(totalXp: number): RankProgressSummary {
  let current = SCHOLAR_RANKS[0];
  let next: ScholarRankSpec | null = null;
  for (let i = 0; i < SCHOLAR_RANKS.length; i++) {
    if (totalXp >= SCHOLAR_RANKS[i].minXp) {
      current = SCHOLAR_RANKS[i];
      next = SCHOLAR_RANKS[i + 1] ?? null;
    }
  }
  if (!next) {
    return { current, next: null, progressPercent: 100 };
  }
  const span = Math.max(1, next.minXp - current.minXp);
  const progressPercent = Math.min(
    100,
    Math.round(((totalXp - current.minXp) / span) * 100),
  );
  return { current, next, progressPercent };
}

export function computeNextStreakCounters(
  prev: Pick<
    UserLearningStats,
    | 'currentDayStreak'
    | 'longestDayStreak'
    | 'currentWeekStreak'
    | 'longestWeekStreak'
    | 'lastActiveDate'
    | 'lastActiveWeekKey'
  > | null,
  activityDate: string,
  weekKey: string,
) {
  let nextDay = 1;
  if (prev?.lastActiveDate) {
    const dayDiff = diffVnDateKeys(prev.lastActiveDate, activityDate);
    if (dayDiff <= 0) nextDay = Math.max(1, prev.currentDayStreak);
    else if (dayDiff === 1) nextDay = prev.currentDayStreak + 1;
  }

  let nextWeek = 1;
  if (prev?.lastActiveWeekKey) {
    const weekDiff = diffIsoWeekKeys(prev.lastActiveWeekKey, weekKey);
    if (weekDiff <= 0) nextWeek = Math.max(1, prev.currentWeekStreak);
    else if (weekDiff === 1) nextWeek = prev.currentWeekStreak + 1;
  }

  return {
    currentDayStreak: nextDay,
    longestDayStreak: Math.max(prev?.longestDayStreak ?? 0, nextDay),
    currentWeekStreak: nextWeek,
    longestWeekStreak: Math.max(prev?.longestWeekStreak ?? 0, nextWeek),
  };
}

export function resolveEffectiveStreak(
  stats: UserLearningStats | null,
  now: Date = new Date(),
): StreakCalculationSnapshot {
  if (!stats) {
    return {
      currentDayStreak: 0,
      longestDayStreak: 0,
      currentWeekStreak: 0,
      longestWeekStreak: 0,
      studiedToday: false,
      studiedThisWeek: false,
    };
  }
  const today = toVnDateKey(now);
  const thisWeek = toVnWeekKey(now);
  const dayGap = stats.lastActiveDate
    ? diffVnDateKeys(stats.lastActiveDate, today)
    : 999;
  const weekGap = stats.lastActiveWeekKey
    ? diffIsoWeekKeys(stats.lastActiveWeekKey, thisWeek)
    : 999;

  return {
    currentDayStreak: dayGap <= 1 ? stats.currentDayStreak : 0,
    longestDayStreak: stats.longestDayStreak,
    currentWeekStreak: weekGap <= 1 ? stats.currentWeekStreak : 0,
    longestWeekStreak: stats.longestWeekStreak,
    studiedToday: dayGap === 0,
    studiedThisWeek: weekGap === 0,
  };
}

@Injectable()
export class StreakStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateStats(userId: string): Promise<UserLearningStats> {
    return this.prisma.userLearningStats.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  /**
   * Gọi bên trong `prisma.$transaction` của GamificationFacadeService để cùng atomically
   * với recordActivity/syncGoalsOnActivity; `client` mặc định `this.prisma` chỉ dùng cho test đơn lẻ.
   */
  async applyActivityToStats(
    params: {
      userId: string;
      activityType: GamificationActivityType;
      activityDate: string;
      weekKey: string;
      xpEarned: number;
      isPassed?: boolean;
    },
    client: PrismaClientOrTx = this.prisma,
  ): Promise<UserLearningStats> {
    await client.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM user_learning_stats WHERE user_id = ${params.userId} FOR UPDATE
    `;
    const existing = await client.userLearningStats.findUnique({
      where: { userId: params.userId },
    });
    const streaks = computeNextStreakCounters(
      existing,
      params.activityDate,
      params.weekKey,
    );

    const increments = this.buildCounterIncrements(
      params.activityType,
      params.isPassed,
    );
    const lastActiveDate =
      existing?.lastActiveDate && existing.lastActiveDate > params.activityDate
        ? existing.lastActiveDate
        : params.activityDate;
    const lastActiveWeekKey =
      existing?.lastActiveWeekKey && existing.lastActiveWeekKey > params.weekKey
        ? existing.lastActiveWeekKey
        : params.weekKey;

    return client.userLearningStats.upsert({
      where: { userId: params.userId },
      create: {
        userId: params.userId,
        totalXp: params.xpEarned,
        ...streaks,
        lastActiveDate: params.activityDate,
        lastActiveWeekKey: params.weekKey,
        totalActivitiesCount: 1,
        completedLessonsCount: increments.completedLessonsCount,
        passedQuizzesCount: increments.passedQuizzesCount,
        reviewedFlashcardsCount: increments.reviewedFlashcardsCount,
        readArticlesCount: increments.readArticlesCount,
        createdMindmapsCount: increments.createdMindmapsCount,
        createdNotesCount: increments.createdNotesCount,
      },
      update: {
        totalXp: { increment: params.xpEarned },
        ...streaks,
        lastActiveDate,
        lastActiveWeekKey,
        totalActivitiesCount: { increment: 1 },
        ...(increments.completedLessonsCount > 0
          ? { completedLessonsCount: { increment: 1 } }
          : {}),
        ...(increments.passedQuizzesCount > 0
          ? { passedQuizzesCount: { increment: 1 } }
          : {}),
        ...(increments.reviewedFlashcardsCount > 0
          ? { reviewedFlashcardsCount: { increment: 1 } }
          : {}),
        ...(increments.readArticlesCount > 0
          ? { readArticlesCount: { increment: 1 } }
          : {}),
        ...(increments.createdMindmapsCount > 0
          ? { createdMindmapsCount: { increment: 1 } }
          : {}),
        ...(increments.createdNotesCount > 0
          ? { createdNotesCount: { increment: 1 } }
          : {}),
      },
    });
  }

  async addBonusXp(
    userId: string,
    xp: number,
    client: PrismaClientOrTx = this.prisma,
  ): Promise<UserLearningStats> {
    return client.userLearningStats.upsert({
      where: { userId },
      create: { userId, totalXp: xp },
      update: { totalXp: { increment: xp } },
    });
  }

  async getRecentDaysActivity(
    userId: string,
    days: number,
    now: Date = new Date(),
  ): Promise<
    Array<{ date: string; count: number; xp: number; isCurrentWeek: boolean }>
  > {
    const keys = listRecentVnDateKeys(days, now);
    const weekSet = new Set(listCurrentWeekVnDateKeys(now));
    const rows = await this.prisma.learningActivity.findMany({
      where: { userId, activityDate: { in: keys } },
      select: { activityDate: true, xpEarned: true },
    });
    const byDate = new Map<string, { count: number; xp: number }>();
    for (const row of rows) {
      const curr = byDate.get(row.activityDate) ?? { count: 0, xp: 0 };
      curr.count += 1;
      curr.xp += row.xpEarned;
      byDate.set(row.activityDate, curr);
    }
    return keys.map((date) => ({
      date,
      count: byDate.get(date)?.count ?? 0,
      xp: byDate.get(date)?.xp ?? 0,
      isCurrentWeek: weekSet.has(date),
    }));
  }

  private buildCounterIncrements(
    type: GamificationActivityType,
    isPassed?: boolean,
  ) {
    return {
      completedLessonsCount:
        type === GamificationActivityType.LESSON_COMPLETED ? 1 : 0,
      passedQuizzesCount:
        type === GamificationActivityType.QUIZ_SUBMITTED && isPassed ? 1 : 0,
      reviewedFlashcardsCount:
        type === GamificationActivityType.FLASHCARD_REVIEWED ? 1 : 0,
      readArticlesCount:
        type === GamificationActivityType.ARTICLE_READ_COMPLETED ? 1 : 0,
      createdMindmapsCount:
        type === GamificationActivityType.MINDMAP_CREATED ? 1 : 0,
      createdNotesCount: type === GamificationActivityType.NOTE_CREATED ? 1 : 0,
    };
  }
}
