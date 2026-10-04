import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { ContentStatus } from '@prisma/client';
import {
  DashboardOverviewResponseDto,
  RecentActivityItemDto,
  PendingLessonItemDto,
} from './dto/dashboard-overview.dto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
  ) {}

  /**
   * Facade method tập hợp toàn bộ số liệu thống kê và hoạt động gần đây của CMS
   */
  async getOverview(): Promise<DashboardOverviewResponseDto> {
    this.logger.log('Fetching CMS dashboard overview statistics', 'DashboardService');

    const [
      periodsCount,
      topicsCount,
      lessonsCount,
      pendingLessonsCount,
      historicalEventsCount,
      publishedLessons,
      draftLessons,
      archivedLessons,
      rejectedLessons,
      recentLessons,
      recentTopics,
      recentPeriods,
      pendingLessonsRaw,
    ] = await Promise.all([
      this.prisma.period.count(),
      this.prisma.topic.count(),
      this.prisma.lesson.count(),
      this.prisma.lesson.count({
        where: { status: ContentStatus.PENDING_REVIEW },
      }),
      this.prisma.historicalEvent.count(),
      this.prisma.lesson.count({
        where: { status: ContentStatus.PUBLISHED },
      }),
      this.prisma.lesson.count({
        where: { status: ContentStatus.DRAFT },
      }),
      this.prisma.lesson.count({
        where: { status: ContentStatus.ARCHIVED },
      }),
      this.prisma.lesson.count({
        where: { status: ContentStatus.REJECTED },
      }),
      this.prisma.lesson.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          creator: {
            select: { username: true, email: true },
          },
        },
      }),
      this.prisma.topic.findMany({
        take: 3,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.period.findMany({
        take: 3,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.lesson.findMany({
        where: { status: ContentStatus.PENDING_REVIEW },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: { username: true, email: true },
          },
          topic: {
            select: { name: true },
          },
        },
      }),
    ]);

    // Chuyển đổi dữ liệu các thực thể thành danh sách hoạt động gần đây
    const activities: RecentActivityItemDto[] = [
      ...recentLessons.map((l) => ({
        id: l.id,
        title: l.title,
        type: 'LESSON' as const,
        status: l.status,
        authorName: l.creator?.username || l.creator?.email || 'Quản trị viên',
        updatedAt: l.updatedAt,
        route: `/lessons?highlight=${l.id}`,
      })),
      ...recentTopics.map((t) => ({
        id: t.id,
        title: t.name,
        type: 'TOPIC' as const,
        status: t.status,
        authorName: 'Hệ thống',
        updatedAt: t.updatedAt,
        route: `/topics?highlight=${t.id}`,
      })),
      ...recentPeriods.map((p) => ({
        id: p.id,
        title: p.name,
        type: 'PERIOD' as const,
        status: p.status,
        authorName: 'Hệ thống',
        updatedAt: p.updatedAt,
        route: `/periods?highlight=${p.id}`,
      })),
    ];

    // Sắp xếp theo thời gian mới nhất và lấy tối đa 6 hoạt động
    activities.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    const recentActivities = activities.slice(0, 6);

    const pendingLessons: PendingLessonItemDto[] = pendingLessonsRaw.map((pl) => ({
      id: pl.id,
      title: pl.title,
      topicName: pl.topic?.name || 'Chủ đề chung',
      creatorName: pl.creator?.username || pl.creator?.email || 'Người soạn thảo',
      createdAt: pl.createdAt,
    }));

    return {
      counts: {
        periodsCount,
        topicsCount,
        lessonsCount,
        pendingLessonsCount,
        historicalEventsCount,
        totalKnowledgeCount:
          periodsCount + topicsCount + lessonsCount + historicalEventsCount,
      },
      recentActivities,
      pendingLessons,
      distribution: {
        published: publishedLessons,
        draft: draftLessons,
        pendingReview: pendingLessonsCount,
        archived: archivedLessons,
        rejected: rejectedLessons,
      },
    };
  }
}
