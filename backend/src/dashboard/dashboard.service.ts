import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { LessonStatus } from '@prisma/client';
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
      recentLessons,
      recentTopics,
      recentPeriods,
      pendingLessonsRaw,
    ] = await Promise.all([
      this.prisma.period.count(),
      this.prisma.topic.count(),
      this.prisma.lesson.count(),
      this.prisma.lesson.count({
        where: { status: LessonStatus.REVIEW },
      }),
      this.prisma.historicalEvent.count(),
      this.prisma.lesson.count({
        where: { status: LessonStatus.PUBLISHED },
      }),
      this.prisma.lesson.count({
        where: { status: LessonStatus.DRAFT },
      }),
      this.prisma.lesson.count({
        where: { status: LessonStatus.ARCHIVED },
      }),
      this.prisma.lesson.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
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
        where: { status: LessonStatus.REVIEW },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Chuyển đổi dữ liệu các thực thể thành danh sách hoạt động gần đây
    const activities: RecentActivityItemDto[] = [
      ...recentLessons.map((l) => ({
        id: l.id,
        title: l.title,
        type: 'LESSON' as const,
        status: l.status,
        authorName: 'Biên tập viên',
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
      topicName: 'Bài đọc độc lập',
      creatorName: 'Người soạn thảo',
      createdAt: pl.createdAt,
      submittedAt: pl.updatedAt,
      route: `/review?lessonId=${pl.id}`,
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
        rejected: 0,
      },
    };
  }
}
