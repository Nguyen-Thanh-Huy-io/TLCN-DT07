'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/services/api';
import {
  GAMIFICATION_API,
  GAMIFICATION_CHANGE_EVENT,
  GoalPeriod,
  GoalPresetKey,
  GoalStatus,
  GoalTargetType,
} from '../constants/gamification.constants';

export interface GamificationStreak {
  currentDayStreak: number;
  longestDayStreak: number;
  currentWeekStreak: number;
  longestWeekStreak: number;
  studiedToday: boolean;
  studiedThisWeek: boolean;
}

export interface GamificationStats {
  totalXp: number;
  completedLessonsCount: number;
  passedQuizzesCount: number;
  reviewedFlashcardsCount: number;
  readArticlesCount: number;
  createdMindmapsCount: number;
  createdNotesCount: number;
  totalActivitiesCount: number;
}

export interface GamificationRankSummary {
  current: { code: string; label: string; minXp: number };
  next: { code: string; label: string; minXp: number } | null;
  progressPercent: number;
}

export interface LearningGoalItem {
  id: string;
  title: string;
  isPrimary: boolean;
  presetKey: GoalPresetKey;
  targetType: GoalTargetType;
  period: GoalPeriod;
  targetValue: number;
  currentValue: number;
  periodKey: string;
  status: GoalStatus;
  completedAt: string | null;
}

export interface RecentDayActivity {
  date: string;
  count: number;
  xp: number;
  isCurrentWeek: boolean;
}

export interface AchievementProgressItem {
  id: string;
  code: string;
  title: string;
  description: string;
  iconKey: string;
  imageUrl?: string | null;
  threshold: number;
  xpReward: number;
  currentValue: number;
  progressPercent: number;
  unlockedAt: string | null;
}

export interface GamificationOverview {
  streak: GamificationStreak;
  stats: GamificationStats;
  rank: GamificationRankSummary;
  primaryGoal: LearningGoalItem | null;
  secondaryGoals: LearningGoalItem[];
  recentDays: RecentDayActivity[];
  achievements: AchievementProgressItem[];
  readArticleIds: string[];
}

export interface CreateGoalPayload {
  presetKey: GoalPresetKey;
  isPrimary?: boolean;
  targetType?: GoalTargetType;
  period?: GoalPeriod;
  targetValue?: number;
  title?: string;
}

export function emitGamificationRefresh(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(GAMIFICATION_CHANGE_EVENT));
}

export const GamificationApiService = {
  async getOverview(): Promise<GamificationOverview> {
    const res = await api.get<{ data: GamificationOverview }>(GAMIFICATION_API.OVERVIEW);
    return res.data.data;
  },

  async createGoal(payload: CreateGoalPayload): Promise<LearningGoalItem> {
    const res = await api.post<{ data: LearningGoalItem }>(GAMIFICATION_API.GOALS, payload);
    emitGamificationRefresh();
    return res.data.data;
  },

  async updateGoalStatus(id: string, status: GoalStatus): Promise<LearningGoalItem> {
    const res = await api.patch<{ data: LearningGoalItem }>(
      GAMIFICATION_API.GOAL_BY_ID(id),
      { status },
    );
    emitGamificationRefresh();
    return res.data.data;
  },

  async deleteGoal(id: string): Promise<{ deleted: true }> {
    const res = await api.delete<{ data: { deleted: true } }>(GAMIFICATION_API.GOAL_BY_ID(id));
    emitGamificationRefresh();
    return res.data.data;
  },

  async markArticleReadComplete(articleId: string): Promise<{
    alreadyCompleted: boolean;
    xpEarned: number;
    overview: GamificationOverview;
  }> {
    const res = await api.post<{
      data: { alreadyCompleted: boolean; xpEarned: number; overview: GamificationOverview };
    }>(GAMIFICATION_API.ARTICLE_READ_COMPLETE(articleId));
    emitGamificationRefresh();
    return res.data.data;
  },

  async getArticleReadStatus(articleId: string): Promise<{
    completed: boolean;
    completedAt: string | null;
  }> {
    const res = await api.get<{ data: { completed: boolean; completedAt: string | null } }>(
      GAMIFICATION_API.ARTICLE_READ_STATUS(articleId),
    );
    return res.data.data;
  },
};

export function useGamificationOverview(enabled: boolean) {
  const [overview, setOverview] = useState<GamificationOverview | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const data = await GamificationApiService.getOverview();
      setOverview(data);
    } catch {
      // Bỏ qua lỗi im lặng khi token hết hạn hoặc offline
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      void reload();
    }, 0);
    const onRefresh = () => void reload();
    window.addEventListener(GAMIFICATION_CHANGE_EVENT, onRefresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(GAMIFICATION_CHANGE_EVENT, onRefresh);
    };
  }, [enabled, reload]);

  return { overview, loading, reload };
}
