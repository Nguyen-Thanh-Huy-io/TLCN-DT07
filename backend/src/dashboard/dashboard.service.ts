import { Injectable } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { loadAuthorNames, UNKNOWN_AUTHOR } from './author-names';
import {
  DashboardContentType,
  MY_REJECTED_LIMIT,
  RECENT_ACTIVITY_LIMIT,
  RecentActivityType,
  ReviewQueueType,
} from './dashboard.constant';
import {
  ContentStatDto,
  DashboardOverviewResponseDto,
  MyWorkDto,
  RecentActivityItemDto,
} from './dto/dashboard-overview.dto';
import { ReviewQueueService } from './review-queue.service';

type StatusGroup = { status: ContentStatus; _count: { _all: number } };

/** Số lượng theo đủ mọi trạng thái (trạng thái không có bản ghi = 0). */
function toStat(
  type: DashboardContentType,
  groups: StatusGroup[],
): ContentStatDto {
  const countOf = (status: ContentStatus) =>
    groups.find((g) => g.status === status)?._count._all ?? 0;
  const byStatus: Record<ContentStatus, number> = {
    [ContentStatus.DRAFT]: countOf(ContentStatus.DRAFT),
    [ContentStatus.PENDING_REVIEW]: countOf(ContentStatus.PENDING_REVIEW),
    [ContentStatus.PUBLISHED]: countOf(ContentStatus.PUBLISHED),
    [ContentStatus.REJECTED]: countOf(ContentStatus.REJECTED),
    [ContentStatus.ARCHIVED]: countOf(ContentStatus.ARCHIVED),
  };
  const total = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
  return { type, total, byStatus };
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewQueue: ReviewQueueService,
  ) {}

  async getOverview(userId: string): Promise<DashboardOverviewResponseDto> {
    const [
      articleGroups,
      lessonGroups,
      timelineGroups,
      quizCount,
      reviewCounts,
      myWork,
      recentActivities,
    ] = await Promise.all([
      this.prisma.article.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.lesson.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.timeline.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.quiz.count(),
      this.reviewQueue.counts(),
      this.getMyWork(userId),
      this.getRecentActivities(),
    ]);

    return {
      contentStats: [
        toStat(DashboardContentType.ARTICLE, articleGroups),
        toStat(DashboardContentType.LESSON, lessonGroups),
        toStat(DashboardContentType.TIMELINE, timelineGroups),
        { type: DashboardContentType.QUIZ, total: quizCount, byStatus: null },
      ],
      reviewCounts,
      myWork,
      recentActivities,
    };
  }

  /** Bản nháp / chờ duyệt / bị từ chối của chính người đăng nhập (bài học + bài viết họ tạo). */
  private async getMyWork(userId: string): Promise<MyWorkDto> {
    const mine = (status: ContentStatus) => ({ createdBy: userId, status });
    const rejectedSelect = {
      id: true,
      title: true,
      rejectionReason: true,
      updatedAt: true,
    };
    const latestRejected = {
      take: MY_REJECTED_LIMIT,
      orderBy: { updatedAt: 'desc' as const },
      select: rejectedSelect,
    };
    const [
      articleDrafts,
      lessonDrafts,
      articlePending,
      lessonPending,
      articleRejectedCount,
      lessonRejectedCount,
      articleRejected,
      lessonRejected,
    ] = await Promise.all([
      this.prisma.article.count({ where: mine(ContentStatus.DRAFT) }),
      this.prisma.lesson.count({ where: mine(ContentStatus.DRAFT) }),
      this.prisma.article.count({ where: mine(ContentStatus.PENDING_REVIEW) }),
      this.prisma.lesson.count({ where: mine(ContentStatus.PENDING_REVIEW) }),
      this.prisma.article.count({ where: mine(ContentStatus.REJECTED) }),
      this.prisma.lesson.count({ where: mine(ContentStatus.REJECTED) }),
      this.prisma.article.findMany({
        where: mine(ContentStatus.REJECTED),
        ...latestRejected,
      }),
      this.prisma.lesson.findMany({
        where: mine(ContentStatus.REJECTED),
        ...latestRejected,
      }),
    ]);

    const rejected = [
      ...articleRejected.map((a) => ({
        ...a,
        type: ReviewQueueType.ARTICLE as const,
      })),
      ...lessonRejected.map((l) => ({
        ...l,
        type: ReviewQueueType.LESSON as const,
      })),
    ]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, MY_REJECTED_LIMIT);

    return {
      drafts: articleDrafts + lessonDrafts,
      pending: articlePending + lessonPending,
      rejectedCount: articleRejectedCount + lessonRejectedCount,
      rejected,
    };
  }

  /** Nội dung vừa cập nhật (bài học, chủ đề, bài viết), mới nhất trước. */
  private async getRecentActivities(): Promise<RecentActivityItemDto[]> {
    const latest = {
      take: RECENT_ACTIVITY_LIMIT,
      orderBy: { updatedAt: 'desc' as const },
    };
    const [lessons, topics, articles] = await Promise.all([
      this.prisma.lesson.findMany({
        ...latest,
        select: {
          id: true,
          title: true,
          status: true,
          createdBy: true,
          updatedAt: true,
        },
      }),
      this.prisma.topic.findMany({
        ...latest,
        select: { id: true, name: true, status: true, updatedAt: true },
      }),
      this.prisma.article.findMany({
        ...latest,
        select: {
          id: true,
          title: true,
          status: true,
          createdBy: true,
          updatedAt: true,
        },
      }),
    ]);
    const nameOf = await loadAuthorNames(this.prisma, [
      ...lessons.map((l) => l.createdBy),
      ...articles.map((a) => a.createdBy),
    ]);

    return [
      ...lessons.map((l) => ({
        id: l.id,
        title: l.title,
        type: RecentActivityType.LESSON,
        status: l.status,
        authorName: nameOf(l.createdBy),
        updatedAt: l.updatedAt,
      })),
      // Chủ đề chưa lưu người tạo.
      ...topics.map((t) => ({
        id: t.id,
        title: t.name,
        type: RecentActivityType.TOPIC,
        status: t.status,
        authorName: UNKNOWN_AUTHOR,
        updatedAt: t.updatedAt,
      })),
      ...articles.map((a) => ({
        id: a.id,
        title: a.title,
        type: RecentActivityType.ARTICLE,
        status: a.status,
        authorName: nameOf(a.createdBy),
        updatedAt: a.updatedAt,
      })),
    ]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, RECENT_ACTIVITY_LIMIT);
  }
}
