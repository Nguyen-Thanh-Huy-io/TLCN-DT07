'use client';

import type React from 'react';
import { UserRole } from '@/constants/enums';
import type { CommunityMemberProfile } from '../../api';

export enum ProfileTabKey {
  POSTS = 'posts',
  SHARED_BLOG = 'shared_blog',
  FOLLOWERS = 'followers',
  FOLLOWING = 'following',
  SAVED = 'saved',
}

export interface ProfileComputedStats {
  postCount: number;
  sharedBlogCount: number;
  questionPostCount: number;
  followerCount: number;
  followingCount: number;
  totalLikesReceived: number;
  totalCommentsReceived: number;
  totalViewsReceived: number;
  topTopics: Array<{ tag: string; count: number }>;
}

export interface ProfileTabItem {
  key: ProfileTabKey;
  label: string;
  count: number;
  icon: React.ElementType;
}

export function formatJoinDate(iso?: string | null): string {
  if (!iso) return 'Tháng 8, 2026';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Tháng 8, 2026';
  return `Tham gia tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
}

export function getRoleLabel(role?: string): string {
  if (role === UserRole.ADMIN || role === UserRole.SUPERADMIN) return 'Hội đồng Thẩm định';
  if (role === UserRole.MODERATOR) return 'Biên tập viên Sử học';
  return 'Thành viên Cộng đồng';
}

export interface CommunityProfileViewProps {
  initialProfile: CommunityMemberProfile;
  identifier: string;
  isPersonalRoute?: boolean;
}
