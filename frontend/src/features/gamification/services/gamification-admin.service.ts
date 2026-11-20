'use client';

import api from '@/services/api';
import {
  AchievementMetricType,
  AdminLearnerSortField,
  GAMIFICATION_ADMIN_API,
} from '../constants/gamification-admin.constants';

export interface AdminAchievementItem {
  id: string;
  code: string;
  title: string;
  description: string;
  iconKey: string;
  imageUrl?: string | null;
  metricType: AchievementMetricType;
  threshold: number;
  xpReward: number;
  sortOrder: number;
  isActive: boolean;
  unlockedCount: number;
}

export interface AdminGamificationSummary {
  activeStreakTodayCount: number;
  weeklyActiveLearnersCount: number;
  activitiesLast7DaysCount: number;
  activeGoalsCount: number;
  completedGoalsCount: number;
  totalUnlockedBadgesCount: number;
}

export interface AdminGamificationOverview {
  summary: AdminGamificationSummary;
  achievements: AdminAchievementItem[];
}

export interface AdminLearnerRow {
  userId: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  totalXp: number;
  rankLabel: string;
  currentDayStreak: number;
  longestDayStreak: number;
  currentWeekStreak: number;
  studiedToday: boolean;
  totalActivitiesCount: number;
  completedLessonsCount: number;
  passedQuizzesCount: number;
  readArticlesCount: number;
  unlockedBadgesCount: number;
  goalsCount: number;
}

export interface CreateAdminAchievementPayload {
  title: string;
  description: string;
  iconKey: string;
  imageUrl?: string | null;
  metricType: AchievementMetricType;
  threshold: number;
  xpReward: number;
  isActive: boolean;
}

export type UpdateAdminAchievementPayload = Partial<CreateAdminAchievementPayload>;

export const GamificationAdminApiService = {
  async getOverview(): Promise<AdminGamificationOverview> {
    const res = await api.get<{ data: AdminGamificationOverview }>(
      GAMIFICATION_ADMIN_API.OVERVIEW,
    );
    return res.data.data;
  },

  async listLearners(params: {
    q?: string;
    sortBy?: AdminLearnerSortField;
    limit?: number;
  }): Promise<AdminLearnerRow[]> {
    const res = await api.get<{ data: AdminLearnerRow[] }>(
      GAMIFICATION_ADMIN_API.LEARNERS,
      { params },
    );
    return Array.isArray(res.data.data) ? res.data.data : [];
  },

  async createAchievement(
    payload: CreateAdminAchievementPayload,
  ): Promise<AdminAchievementItem> {
    const res = await api.post<{ data: AdminAchievementItem }>(
      GAMIFICATION_ADMIN_API.ACHIEVEMENTS,
      payload,
    );
    return res.data.data;
  },

  async updateAchievement(
    id: string,
    payload: Partial<UpdateAdminAchievementPayload>,
  ): Promise<AdminAchievementItem> {
    const res = await api.patch<{ data: AdminAchievementItem }>(
      GAMIFICATION_ADMIN_API.ACHIEVEMENT_BY_ID(id),
      payload,
    );
    return res.data.data;
  },

  async deleteAchievement(id: string): Promise<{ deleted: true }> {
    const res = await api.delete<{ data: { deleted: true } }>(
      GAMIFICATION_ADMIN_API.ACHIEVEMENT_BY_ID(id),
    );
    return res.data.data;
  },
};
