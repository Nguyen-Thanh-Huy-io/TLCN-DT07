import { Test } from '@nestjs/testing';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import {
  DashboardContentType,
  RecentActivityType,
  ReviewQueueType,
} from './dashboard.constant';
import { DashboardService } from './dashboard.service';
import { ReviewQueueService } from './review-queue.service';

const group = (status: ContentStatus, n: number) => ({
  status,
  _count: { _all: n },
});
const day = (n: number) => new Date(Date.UTC(2026, 10, n));

describe('DashboardService — tổng quan CMS', () => {
  let service: DashboardService;
  const prisma = {
    article: { groupBy: jest.fn(), count: jest.fn(), findMany: jest.fn() },
    lesson: { groupBy: jest.fn(), count: jest.fn(), findMany: jest.fn() },
    timeline: { groupBy: jest.fn() },
    quiz: { count: jest.fn() },
    topic: { findMany: jest.fn() },
    authUser: { findMany: jest.fn() },
  };
  const reviewQueue = { counts: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
        { provide: ReviewQueueService, useValue: reviewQueue },
      ],
    }).compile();
    service = moduleRef.get(DashboardService);

    prisma.article.groupBy.mockResolvedValue([
      group(ContentStatus.PUBLISHED, 20),
      group(ContentStatus.DRAFT, 3),
    ]);
    prisma.lesson.groupBy.mockResolvedValue([
      group(ContentStatus.PUBLISHED, 5),
    ]);
    prisma.timeline.groupBy.mockResolvedValue([
      group(ContentStatus.PUBLISHED, 7),
    ]);
    prisma.quiz.count.mockResolvedValue(7);
    reviewQueue.counts.mockResolvedValue({ [ReviewQueueType.REVISION]: 1 });
    prisma.article.count.mockResolvedValue(1);
    prisma.lesson.count.mockResolvedValue(0);
    prisma.article.findMany.mockResolvedValue([]);
    prisma.lesson.findMany.mockResolvedValue([]);
    prisma.topic.findMany.mockResolvedValue([]);
    prisma.authUser.findMany.mockResolvedValue([]);
  });

  it('kho nội dung theo loại, đủ mọi trạng thái; đề thi chỉ có tổng', async () => {
    const overview = await service.getOverview('u-1');

    expect(overview.contentStats[0]).toEqual({
      type: DashboardContentType.ARTICLE,
      total: 23,
      byStatus: {
        [ContentStatus.DRAFT]: 3,
        [ContentStatus.PENDING_REVIEW]: 0,
        [ContentStatus.PUBLISHED]: 20,
        [ContentStatus.REJECTED]: 0,
        [ContentStatus.ARCHIVED]: 0,
      },
    });
    expect(overview.contentStats[3]).toEqual({
      type: DashboardContentType.QUIZ,
      total: 7,
      byStatus: null,
    });
    expect(overview.reviewCounts).toEqual({ [ReviewQueueType.REVISION]: 1 });
  });

  it('việc của tôi chỉ tính bài do người đăng nhập tạo; bài bị từ chối mới nhất trước', async () => {
    prisma.article.findMany.mockImplementation(({ where }) =>
      where?.status === ContentStatus.REJECTED
        ? [
            {
              id: 'a-1',
              title: 'Bài viết A',
              rejectionReason: 'Thiếu nguồn',
              updatedAt: day(2),
            },
          ]
        : [],
    );
    prisma.lesson.findMany.mockImplementation(({ where }) =>
      where?.status === ContentStatus.REJECTED
        ? [
            {
              id: 'l-1',
              title: 'Bài học B',
              rejectionReason: null,
              updatedAt: day(4),
            },
          ]
        : [],
    );

    const { myWork } = await service.getOverview('u-1');

    expect(prisma.article.count).toHaveBeenCalledWith({
      where: { createdBy: 'u-1', status: ContentStatus.DRAFT },
    });
    expect(myWork.rejected.map((r) => [r.type, r.id])).toEqual([
      [ReviewQueueType.LESSON, 'l-1'],
      [ReviewQueueType.ARTICLE, 'a-1'],
    ]);
  });

  it('hoạt động gần đây gộp bài học / chủ đề / bài viết, mới nhất trước', async () => {
    prisma.lesson.findMany.mockImplementation(({ where }) =>
      where
        ? []
        : [
            {
              id: 'l-1',
              title: 'Bài học',
              status: ContentStatus.PUBLISHED,
              createdBy: null,
              updatedAt: day(1),
            },
          ],
    );
    prisma.topic.findMany.mockResolvedValue([
      {
        id: 't-1',
        name: 'Chủ đề',
        status: ContentStatus.PUBLISHED,
        updatedAt: day(9),
      },
    ]);

    const { recentActivities } = await service.getOverview('u-1');

    expect(recentActivities.map((a) => a.type)).toEqual([
      RecentActivityType.TOPIC,
      RecentActivityType.LESSON,
    ]);
  });
});
