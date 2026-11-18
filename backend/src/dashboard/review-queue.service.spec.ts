import { Test } from '@nestjs/testing';
import { ReportSource, ReportTargetType } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { ReviewQueueType } from './dashboard.constant';
import { ReviewQueueService } from './review-queue.service';

const day = (n: number) => new Date(Date.UTC(2026, 10, n));

describe('ReviewQueueService — hàng chờ duyệt gộp', () => {
  let service: ReviewQueueService;
  const prisma = {
    contentRevision: { count: jest.fn(), findMany: jest.fn() },
    article: { count: jest.fn(), findMany: jest.fn() },
    lesson: { count: jest.fn(), findMany: jest.fn() },
    blogPost: { count: jest.fn(), findMany: jest.fn() },
    contentReport: { count: jest.fn(), findMany: jest.fn() },
    authUser: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReviewQueueService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(ReviewQueueService);

    prisma.contentRevision.count.mockResolvedValue(1);
    prisma.article.count.mockResolvedValue(0);
    prisma.lesson.count.mockResolvedValue(60);
    prisma.blogPost.count.mockResolvedValue(0);
    prisma.contentReport.count.mockResolvedValue(2);
    prisma.contentRevision.findMany.mockResolvedValue([
      {
        id: 'rev-1',
        title: 'Văn hoá nhà Trần',
        updatedAt: day(5),
        authorId: 'u-editor',
      },
    ]);
    prisma.article.findMany.mockResolvedValue([]);
    prisma.lesson.findMany.mockResolvedValue([
      {
        id: 'les-1',
        title: 'Bạch Đằng 938',
        updatedAt: day(3),
        createdBy: null,
      },
    ]);
    prisma.blogPost.findMany.mockImplementation(({ where }) =>
      where?.id ? [{ id: 'post-9', title: 'Bài cộng đồng X' }] : [],
    );
    prisma.contentReport.findMany.mockResolvedValue([
      {
        id: 'rep-1',
        targetType: ReportTargetType.POST,
        targetId: 'post-9',
        reporterId: null,
        source: ReportSource.AI_SCAN,
        createdAt: day(4),
      },
      {
        id: 'rep-2',
        targetType: ReportTargetType.COMMENT,
        targetId: 'cmt-1',
        reporterId: 'u-learner',
        source: ReportSource.USER_REPORT,
        createdAt: day(6),
      },
    ]);
    prisma.authUser.findMany.mockResolvedValue([
      { id: 'u-editor', username: 'bien_tap_vien', userProfile: null },
      {
        id: 'u-learner',
        username: 'hoc_vien',
        userProfile: { firstName: 'Lan', lastName: 'Nguyễn' },
      },
    ]);
  });

  it('đếm đủ mọi loại (tổng thật, không bị giới hạn danh sách)', async () => {
    const queue = await service.getQueue();

    expect(queue.counts).toEqual({
      [ReviewQueueType.REVISION]: 1,
      [ReviewQueueType.ARTICLE]: 0,
      [ReviewQueueType.LESSON]: 60,
      [ReviewQueueType.BLOG]: 0,
      [ReviewQueueType.REPORT]: 2,
    });
    expect(queue.total).toBe(63);
  });

  it('gộp việc mọi loại, chờ lâu nhất trước; báo cáo lấy tiêu đề bài, người báo cáo hoặc AI', async () => {
    const { items } = await service.getQueue();

    expect(items.map((i) => [i.type, i.title, i.submitterName])).toEqual([
      [ReviewQueueType.LESSON, 'Bạch Đằng 938', '—'],
      [ReviewQueueType.REPORT, 'Bài cộng đồng X', 'AI kiểm duyệt'],
      [ReviewQueueType.REVISION, 'Văn hoá nhà Trần', 'bien_tap_vien'],
      [ReviewQueueType.REPORT, 'Bình luận bị báo cáo', 'Nguyễn Lan'],
    ]);
  });
});
