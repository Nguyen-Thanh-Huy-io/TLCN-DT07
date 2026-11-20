import api from '../api';
import { ContentStatus } from '@/constants/enums';

/** Khớp DashboardContentType ở backend/src/dashboard/dashboard.constant.ts. */
export enum DashboardContentType {
  ARTICLE = 'ARTICLE',
  LESSON = 'LESSON',
  TIMELINE = 'TIMELINE',
  QUIZ = 'QUIZ',
}

/** Khớp ReviewQueueType ở backend/src/dashboard/dashboard.constant.ts. */
export enum ReviewQueueType {
  REVISION = 'REVISION',
  ARTICLE = 'ARTICLE',
  LESSON = 'LESSON',
  BLOG = 'BLOG',
  REPORT = 'REPORT',
}

export enum DashboardActivityType {
  LESSON = 'LESSON',
  TOPIC = 'TOPIC',
  ARTICLE = 'ARTICLE',
}

export interface ContentStat {
  type: DashboardContentType;
  total: number;
  /** null với loại không có trạng thái (Đề thi). */
  byStatus: Record<ContentStatus, number> | null;
}

export interface MyRejectedItem {
  id: string;
  type: ReviewQueueType.ARTICLE | ReviewQueueType.LESSON;
  title: string;
  rejectionReason: string | null;
  updatedAt: string;
}

export interface MyWork {
  drafts: number;
  pending: number;
  rejectedCount: number;
  rejected: MyRejectedItem[];
}

export interface RecentActivityItem {
  id: string;
  title: string;
  type: DashboardActivityType;
  status: ContentStatus;
  authorName: string;
  updatedAt: string;
}

export type ReviewCounts = Record<ReviewQueueType, number>;

export interface DashboardOverviewData {
  contentStats: ContentStat[];
  reviewCounts: ReviewCounts;
  myWork: MyWork;
  recentActivities: RecentActivityItem[];
}

export interface ReviewQueueItem {
  id: string;
  type: ReviewQueueType;
  title: string;
  submitterName: string;
  submittedAt: string;
}

export interface ReviewQueueData {
  counts: ReviewCounts;
  total: number;
  /** Chờ lâu nhất trước. */
  items: ReviewQueueItem[];
}

export const statOf = (data: DashboardOverviewData | null, type: DashboardContentType) =>
  data?.contentStats.find((s) => s.type === type);

export class DashboardApiService {
  /** Lỗi được ném ra để màn hình báo lỗi thật (không có dữ liệu mẫu dự phòng). */
  static async getOverview(): Promise<DashboardOverviewData> {
    const res = await api.get<{ data: DashboardOverviewData }>('/dashboard/overview');
    return res.data.data;
  }

  /** Hàng chờ duyệt gộp mọi loại — chỉ người duyệt gọi được. */
  static async getReviewQueue(): Promise<ReviewQueueData> {
    const res = await api.get<{ data: ReviewQueueData }>('/dashboard/review-queue');
    return res.data.data;
  }
}
