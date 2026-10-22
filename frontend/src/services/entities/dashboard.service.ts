import api from '../api';
import { ContentStatus } from '@/constants/enums';

export interface DashboardCounts {
  periodsCount: number;
  topicsCount: number;
  lessonsCount: number;
  pendingLessonsCount: number;
  historicalEventsCount: number;
  totalKnowledgeCount: number;
}

export interface RecentActivityItem {
  id: string;
  title: string;
  type: 'LESSON' | 'TOPIC' | 'PERIOD';
  status: ContentStatus;
  authorName: string;
  updatedAt: string;
  route: string;
}

export interface PendingLessonItem {
  id: string;
  title: string;
  topicName: string;
  creatorName: string;
  createdAt: string;
}

export interface ContentDistribution {
  published: number;
  draft: number;
  pendingReview: number;
  archived: number;
  rejected: number;
}

export interface DashboardOverviewData {
  counts: DashboardCounts;
  recentActivities: RecentActivityItem[];
  pendingLessons: PendingLessonItem[];
  distribution: ContentDistribution;
}

export class DashboardApiService {
  /**
   * Lấy số liệu tổng quan CMS. Không còn dữ liệu mẫu dự phòng: lỗi được ném ra để
   * màn hình báo lỗi thật, danh sách rỗng thì hiển thị trạng thái rỗng.
   */
  static async getOverview(): Promise<DashboardOverviewData> {
    const response = await api.get('/dashboard/overview');
    const data = response.data?.data || response.data;
    if (!data?.counts) throw new Error('Dữ liệu thống kê không hợp lệ.');
    return {
      counts: {
        periodsCount: data.counts.periodsCount ?? 0,
        topicsCount: data.counts.topicsCount ?? 0,
        lessonsCount: data.counts.lessonsCount ?? 0,
        pendingLessonsCount: data.counts.pendingLessonsCount ?? 0,
        historicalEventsCount: data.counts.historicalEventsCount ?? 0,
        totalKnowledgeCount: data.counts.totalKnowledgeCount ?? 0,
      },
      recentActivities: Array.isArray(data.recentActivities) ? data.recentActivities : [],
      pendingLessons: Array.isArray(data.pendingLessons) ? data.pendingLessons : [],
      distribution: data.distribution ?? { published: 0, draft: 0, pendingReview: 0, archived: 0, rejected: 0 },
    };
  }
}
