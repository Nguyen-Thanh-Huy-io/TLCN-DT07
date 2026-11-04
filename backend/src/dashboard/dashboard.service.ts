import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { LessonStatus } from '@prisma/client';
import {
  DashboardOverviewResponseDto,
  RecentActivityItemDto,
  PendingLessonItemDto,
} from './dto/dashboard-overview.dto';

/** Chủ đề / giai đoạn chưa lưu người tạo; bài học tạo trước khi có cột created_by. */
const UNKNOWN_AUTHOR = '—';
const NOT_IN_PATH = 'Chưa gắn vào lộ trình nào';

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
        orderBy: { updatedAt: 'desc' },
        include: {
          chapterLessons: {
            take: 1,
            include: {
              chapter: { select: { title: true, learningPath: { select: { title: true } } } },
            },
          },
        },
      }),
    ]);

    // Tên người soạn thật (lesson.createdBy là id tài khoản) — chỉ bài học có cột này.
    const authorIds = [...new Set([...recentLessons, ...pendingLessonsRaw].map((l) => l.createdBy).filter((id): id is string => Boolean(id)))];
    const authors = await this.prisma.authUser.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, username: true, userProfile: { select: { firstName: true, lastName: true } } },
    });
    const authorName = (id: string | null) => {
      const user = authors.find((a) => a.id === id);
      if (!user) return UNKNOWN_AUTHOR;
      const full = [user.userProfile?.lastName, user.userProfile?.firstName].filter(Boolean).join(' ');
      return full || user.username;
    };

    // Chuyển đổi dữ liệu các thực thể thành danh sách hoạt động gần đây
    const activities: RecentActivityItemDto[] = [
      ...recentLessons.map((l) => ({
        id: l.id,
        title: l.title,
        type: 'LESSON' as const,
        status: l.status,
        authorName: authorName(l.createdBy),
        updatedAt: l.updatedAt,
        route: `/lessons?highlight=${l.id}`,
      })),
      ...recentTopics.map((t) => ({
        id: t.id,
        title: t.name,
        type: 'TOPIC' as const,
        status: t.status,
        authorName: UNKNOWN_AUTHOR,
        updatedAt: t.updatedAt,
        route: `/topics?highlight=${t.id}`,
      })),
      ...recentPeriods.map((p) => ({
        id: p.id,
        title: p.name,
        type: 'PERIOD' as const,
        status: p.status,
        authorName: UNKNOWN_AUTHOR,
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
      topicName: pl.chapterLessons[0]
        ? `${pl.chapterLessons[0].chapter.learningPath.title} › ${pl.chapterLessons[0].chapter.title}`
        : NOT_IN_PATH,
      creatorName: authorName(pl.createdBy),
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
