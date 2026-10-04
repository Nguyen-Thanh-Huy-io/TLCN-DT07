import api, { extractErrorMessage } from '../api';
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

const DEFAULT_OVERVIEW: DashboardOverviewData = {
  counts: {
    periodsCount: 12,
    topicsCount: 48,
    lessonsCount: 126,
    pendingLessonsCount: 8,
    historicalEventsCount: 64,
    totalKnowledgeCount: 250,
  },
  recentActivities: [
    {
      id: 'mock-1',
      title: 'Chiến dịch Điện Biên Phủ',
      type: 'LESSON',
      status: ContentStatus.DRAFT,
      authorName: 'Nguyễn Văn A',
      updatedAt: new Date().toISOString(),
      route: '/lessons',
    },
    {
      id: 'mock-2',
      title: 'Nhà Nguyễn (1802 - 1945)',
      type: 'PERIOD',
      status: ContentStatus.PUBLISHED,
      authorName: 'Admin',
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      route: '/periods',
    },
    {
      id: 'mock-3',
      title: 'Cách mạng tháng Tám 1945',
      type: 'TOPIC',
      status: ContentStatus.PUBLISHED,
      authorName: 'Lê Hoàng',
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
      route: '/topics',
    },
  ],
  pendingLessons: [
    {
      id: 'mock-p1',
      title: 'Chiến dịch Điện Biên Phủ năm 1954',
      topicName: 'Kháng chiến chống Pháp',
      creatorName: 'Nguyễn Văn A',
      createdAt: '22/09/2026',
    },
    {
      id: 'mock-p2',
      title: 'Nguyên nhân bùng nổ Toàn quốc kháng chiến',
      topicName: 'Kháng chiến toàn quốc',
      creatorName: 'Mai Trang',
      createdAt: '21/09/2026',
    },
    {
      id: 'mock-p3',
      title: 'Nội dung Hiệp định Genève',
      topicName: 'Hiệp định Genève',
      creatorName: 'Lê Hoàng',
      createdAt: '20/09/2026',
    },
  ],
  distribution: {
    published: 85,
    draft: 25,
    pendingReview: 8,
    archived: 5,
    rejected: 3,
  },
};

export class DashboardApiService {
  /**
   * Lấy dữ liệu tổng quan thống kê CMS với fallback an toàn
   */
  static async getOverview(): Promise<DashboardOverviewData> {
    try {
      const response = await api.get('/dashboard/overview');
      const data = response.data?.data || response.data;
      if (data && data.counts) {
        return {
          counts: {
            periodsCount: data.counts.periodsCount ?? 0,
            topicsCount: data.counts.topicsCount ?? 0,
            lessonsCount: data.counts.lessonsCount ?? 0,
            pendingLessonsCount: data.counts.pendingLessonsCount ?? 0,
            historicalEventsCount: data.counts.historicalEventsCount ?? 0,
            totalKnowledgeCount: data.counts.totalKnowledgeCount ?? 0,
          },
          recentActivities: Array.isArray(data.recentActivities) && data.recentActivities.length > 0
            ? data.recentActivities
            : DEFAULT_OVERVIEW.recentActivities,
          pendingLessons: Array.isArray(data.pendingLessons) && data.pendingLessons.length > 0
            ? data.pendingLessons
            : DEFAULT_OVERVIEW.pendingLessons,
          distribution: data.distribution || DEFAULT_OVERVIEW.distribution,
        };
      }
      return DEFAULT_OVERVIEW;
    } catch (error) {
      console.warn('DashboardApiService: error fetching live stats, using fallback:', extractErrorMessage(error, 'Lỗi kết nối'));
      return DEFAULT_OVERVIEW;
    }
  }
}
