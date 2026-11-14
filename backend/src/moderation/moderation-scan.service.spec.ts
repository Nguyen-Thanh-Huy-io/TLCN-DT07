import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  ContentStatus,
  NotificationType,
  PostCommentStatus,
  ReportActionTaken,
  ReportRiskLevel,
  ReportSource,
  ReportTargetType,
} from '@prisma/client';
import { BlogGateway } from '../blog/blog.gateway';
import { PrismaService } from '../common/services/prisma.service';
import { NotificationService } from '../notification/notification.service';
import {
  ModerationAiService,
  ModerationAssessment,
} from './moderation-ai.service';
import {
  MODERATION_QUEUE,
  MODERATION_SCAN_JOB,
  ModerationResolveAction,
  ModerationTab,
} from './moderation.constant';
import { ModerationService } from './moderation.service';

const assessment = (
  action: ModerationAssessment['action'],
): ModerationAssessment => ({
  isSafe: action === 'ALLOW',
  riskLevel: action === 'ALLOW' ? ReportRiskLevel.SAFE : ReportRiskLevel.HIGH,
  action,
  confidence: 0.9,
  detectedCategories: action === 'ALLOW' ? ['NONE'] : ['PROFANITY'],
  violationReasonVi: action === 'ALLOW' ? '' : 'Ngôn từ thù ghét',
  engine: 'HYBRID_SENTINEL',
});

const BLOG_POST = {
  id: 'post-1',
  authorId: 'author-1',
  title: 'Tiêu đề',
  slug: 'tieu-de',
  excerpt: 'Tóm tắt',
  contentBlocks: [
    { heading: 'Mở bài' },
    { content: '<p>Nội <b>dung</b></p>' },
    'khối lỗi',
  ],
  status: ContentStatus.PUBLISHED,
  publishedAt: null,
};

const COMMENT = {
  id: 'c-1',
  postId: 'post-1',
  authorId: 'commenter-1',
  content: 'Bình luận',
  status: PostCommentStatus.VISIBLE,
  deletedAt: null,
};

describe('ModerationService — quét AI, danh sách báo cáo, xử lý báo cáo bài', () => {
  let service: ModerationService;
  const prisma = {
    blogPost: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    blogPostComment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    contentReport: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const ai = { evaluateContent: jest.fn() };
  const notifications = { notify: jest.fn() };
  const gateway = {
    emitPostHidden: jest.fn(),
    emitPostModerated: jest.fn(),
    emitPostRestored: jest.fn(),
    emitModerationEvent: jest.fn(),
    emitCommentUpdated: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((ops: Promise<unknown>[]) =>
      Promise.all(ops),
    );
    prisma.blogPost.findUnique.mockResolvedValue(BLOG_POST);
    prisma.blogPostComment.findUnique.mockResolvedValue(COMMENT);
    prisma.contentReport.create.mockResolvedValue({ id: 'rp-ai' });
    const moduleRef = await Test.createTestingModule({
      providers: [
        ModerationService,
        { provide: PrismaService, useValue: prisma },
        { provide: ModerationAiService, useValue: ai },
        { provide: NotificationService, useValue: notifications },
        { provide: BlogGateway, useValue: gateway },
      ],
    }).compile();
    service = moduleRef.get(ModerationService);
  });

  describe('quét bài viết 3 mức', () => {
    it('an toàn: không tạo báo cáo', async () => {
      ai.evaluateContent.mockResolvedValue(assessment('ALLOW'));

      const result = await service.scanTarget(ReportTargetType.POST, 'post-1');

      expect(result).toMatchObject({
        reportId: null,
        actionTaken: ReportActionTaken.NONE,
      });
      expect(prisma.contentReport.create).not.toHaveBeenCalled();
    });

    it('gửi AI cả tiêu đề, tóm tắt và chữ trong các khối (bỏ thẻ HTML)', async () => {
      ai.evaluateContent.mockResolvedValue(assessment('ALLOW'));

      await service.scanTarget(ReportTargetType.POST, 'post-1');

      const sentText: string = ai.evaluateContent.mock.calls[0][0];
      expect(sentText).toContain('Tiêu đề');
      expect(sentText).toContain('Tóm tắt');
      expect(sentText).toContain('Mở bài');
      expect(sentText).toContain('Nội  dung');
      expect(sentText).not.toContain('<p>');
    });

    it('nghi ngờ: tạo báo cáo AI chờ người xem, không ẩn bài', async () => {
      ai.evaluateContent.mockResolvedValue(assessment('FLAG_FOR_REVIEW'));

      const result = await service.scanTarget(ReportTargetType.POST, 'post-1');

      expect(result.actionTaken).toBe(ReportActionTaken.NONE);
      expect(prisma.blogPost.update).not.toHaveBeenCalled();
      expect(prisma.contentReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          source: ReportSource.AI_SCAN,
          reporterId: null,
          actionTaken: ReportActionTaken.NONE,
        }),
      });
      expect(gateway.emitModerationEvent).toHaveBeenCalled();
    });

    it('vi phạm nặng: tự ẩn bài, báo realtime và báo tác giả', async () => {
      ai.evaluateContent.mockResolvedValue(assessment('AUTO_HIDE'));

      const result = await service.scanTarget(ReportTargetType.POST, 'post-1');

      expect(result.actionTaken).toBe(ReportActionTaken.AUTO_HIDDEN);
      expect(prisma.blogPost.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { status: ContentStatus.REJECTED },
      });
      expect(gateway.emitPostHidden).toHaveBeenCalledWith('post-1');
      expect(notifications.notify).toHaveBeenCalledWith(
        'author-1',
        NotificationType.CONTENT_VIOLATION,
        expect.any(String),
        expect.stringContaining('Ngôn từ thù ghét'),
        '/cong-dong',
      );
    });

    it('quét lại cùng nội dung trong vài giây thì bỏ qua (chống quét trùng), trừ khi ép chạy', async () => {
      ai.evaluateContent.mockResolvedValue(assessment('ALLOW'));

      await service.scanTarget(ReportTargetType.POST, 'post-1');
      await service.scanTarget(ReportTargetType.POST, 'post-1');
      expect(ai.evaluateContent).toHaveBeenCalledTimes(1);

      await service.scanTarget(ReportTargetType.POST, 'post-1', {
        forceExecution: true,
      });
      expect(ai.evaluateContent).toHaveBeenCalledTimes(2);
    });

    it('bài không tồn tại → 404', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);

      await expect(
        service.scanTarget(ReportTargetType.POST, 'khong-co'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('quét bình luận', () => {
    it('vi phạm nặng: gỡ bình luận, giảm đếm, báo realtime và tác giả', async () => {
      ai.evaluateContent.mockResolvedValue(assessment('AUTO_HIDE'));

      await service.scanTarget(ReportTargetType.COMMENT, 'c-1');

      expect(prisma.blogPostComment.update).toHaveBeenCalledWith({
        where: { id: 'c-1' },
        data: {
          status: PostCommentStatus.REMOVED,
          deletedAt: expect.any(Date),
        },
      });
      expect(prisma.blogPost.updateMany).toHaveBeenCalledWith({
        where: { id: 'post-1', commentCount: { gt: 0 } },
        data: { commentCount: { decrement: 1 } },
      });
      expect(notifications.notify).toHaveBeenCalledWith(
        'commenter-1',
        NotificationType.CONTENT_VIOLATION,
        expect.any(String),
        expect.any(String),
        '/cong-dong',
      );
      expect(prisma.contentReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetType: ReportTargetType.COMMENT,
          actionTaken: ReportActionTaken.AUTO_HIDDEN,
        }),
      });
    });

    it('bình luận đã gỡ thì không gỡ / giảm đếm lần nữa nhưng vẫn ghi báo cáo', async () => {
      ai.evaluateContent.mockResolvedValue(assessment('AUTO_HIDE'));
      prisma.blogPostComment.findUnique.mockResolvedValue({
        ...COMMENT,
        status: PostCommentStatus.REMOVED,
      });

      await service.scanTarget(ReportTargetType.COMMENT, 'c-1');

      expect(prisma.blogPostComment.update).not.toHaveBeenCalled();
      expect(prisma.contentReport.create).toHaveBeenCalled();
    });

    it('bình luận không tồn tại → 404', async () => {
      prisma.blogPostComment.findUnique.mockResolvedValue(null);

      await expect(
        service.scanTarget(ReportTargetType.COMMENT, 'khong-co'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('danh sách báo cáo cho CMS', () => {
    beforeEach(() => {
      prisma.contentReport.findMany.mockResolvedValue([
        {
          id: 'r1',
          targetType: ReportTargetType.POST,
          targetId: 'post-1',
          source: ReportSource.AI_SCAN,
          riskLevel: ReportRiskLevel.HIGH,
          actionTaken: ReportActionTaken.AUTO_HIDDEN,
          aiReasons: { violationReasonVi: 'Thù ghét' },
        },
        {
          id: 'r2',
          targetType: ReportTargetType.COMMENT,
          targetId: 'c-1',
          source: ReportSource.USER_REPORT,
          riskLevel: ReportRiskLevel.LOW,
          actionTaken: ReportActionTaken.NONE,
          aiReasons: { userReason: 'Spam quảng cáo' },
        },
        {
          id: 'r3',
          targetType: ReportTargetType.POST,
          targetId: 'post-1',
          source: ReportSource.USER_REPORT,
          riskLevel: ReportRiskLevel.LOW,
          actionTaken: ReportActionTaken.DISMISSED,
          aiReasons: null,
        },
      ]);
      prisma.blogPost.findMany.mockResolvedValue([
        { ...BLOG_POST, author: { id: 'author-1', username: 'tac-gia' } },
      ]);
      prisma.blogPostComment.findMany.mockResolvedValue([
        { ...COMMENT, author: { id: 'commenter-1', username: 'doc-gia' } },
      ]);
    });

    it('thống kê theo trạng thái và đếm số lần vi phạm của tác giả', async () => {
      const { stats, items } = await service.listReports({});

      expect(stats).toEqual({
        total: 3,
        pending: 2,
        autoHidden: 1,
        userReports: 1,
        confirmedRemoved: 0,
        dismissed: 1,
      });
      expect(items[0].target?.author).toMatchObject({
        username: 'tac-gia',
        violationCount: 1,
      });
      expect(items[1]).toMatchObject({
        categories: ['USER_FLAGGED'],
        reasonText: 'Spam quảng cáo',
        engine: 'USER',
      });
    });

    it('lọc theo tab, loại đối tượng và từ khoá', async () => {
      const pending = await service.listReports({ tab: ModerationTab.PENDING });
      expect(pending.items.map((i) => i.id)).toEqual(['r1', 'r2']);

      const comments = await service.listReports({
        targetType: ReportTargetType.COMMENT,
      });
      expect(comments.items.map((i) => i.id)).toEqual(['r2']);

      const searched = await service.listReports({ search: 'TAC-GIA' });
      expect(searched.items.map((i) => i.id)).toEqual(['r1', 'r3']);
    });
  });

  describe('xử lý báo cáo bài viết', () => {
    const postReport = (actionTaken: ReportActionTaken) => {
      prisma.contentReport.findUnique.mockResolvedValue({
        id: 'r1',
        targetType: ReportTargetType.POST,
        targetId: 'post-1',
        actionTaken,
        aiReasons: { violationReasonVi: 'Thù ghét' },
      });
      prisma.contentReport.update.mockResolvedValue({
        id: 'r1',
        actionTaken: ReportActionTaken.CONFIRMED_REMOVED,
      });
    };

    it('xác nhận gỡ: ẩn bài, đóng các báo cáo mở cùng bài, báo tác giả khi bài chưa bị AI ẩn', async () => {
      postReport(ReportActionTaken.NONE);

      await service.resolveReport('r1', 'reviewer-1', {
        action: ModerationResolveAction.CONFIRM_REMOVE,
        note: ' Đã kiểm tra ',
      });

      expect(prisma.contentReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actionTaken: ReportActionTaken.CONFIRMED_REMOVED,
            reviewerId: 'reviewer-1',
            aiReasons: expect.objectContaining({ adminNote: 'Đã kiểm tra' }),
          }),
        }),
      );
      expect(prisma.contentReport.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            targetId: 'post-1',
            id: { not: 'r1' },
          }),
        }),
      );
      expect(prisma.blogPost.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { status: ContentStatus.REJECTED },
      });
      expect(notifications.notify).toHaveBeenCalledWith(
        'author-1',
        NotificationType.CONTENT_VIOLATION,
        expect.any(String),
        expect.stringContaining('Đã kiểm tra'),
        '/cong-dong',
      );
    });

    it('khôi phục bài bị AI ẩn nhầm: xuất bản lại và báo tác giả', async () => {
      postReport(ReportActionTaken.AUTO_HIDDEN);
      prisma.blogPost.findUnique.mockResolvedValue({
        ...BLOG_POST,
        status: ContentStatus.REJECTED,
      });

      await service.resolveReport('r1', 'reviewer-1', {
        action: ModerationResolveAction.RESTORE,
      });

      expect(prisma.blogPost.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: {
          status: ContentStatus.PUBLISHED,
          publishedAt: expect.any(Date),
        },
      });
      expect(gateway.emitPostRestored).toHaveBeenCalledWith('post-1');
      expect(notifications.notify).toHaveBeenCalledWith(
        'author-1',
        NotificationType.CONTENT_APPROVED,
        expect.any(String),
        expect.any(String),
        '/blog/tieu-de',
      );
    });

    it('bác báo cáo trên bài đang chờ duyệt không xuất bản bài đó', async () => {
      postReport(ReportActionTaken.NONE);
      prisma.blogPost.findUnique.mockResolvedValue({
        ...BLOG_POST,
        status: ContentStatus.PENDING_REVIEW,
      });

      await service.resolveReport('r1', 'reviewer-1', {
        action: ModerationResolveAction.RESTORE,
      });

      expect(prisma.blogPost.update).not.toHaveBeenCalled();
      expect(gateway.emitPostRestored).not.toHaveBeenCalled();
    });
  });
});

describe('ModerationService.enqueueScan — mỗi nội dung chỉ quét 1 lần', () => {
  const queue = { add: jest.fn() };
  const ai = { evaluateContent: jest.fn() };

  const build = async (withQueue: boolean) => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ModerationService,
        { provide: PrismaService, useValue: {} },
        { provide: ModerationAiService, useValue: ai },
        { provide: NotificationService, useValue: {} },
        { provide: BlogGateway, useValue: {} },
        ...(withQueue
          ? [{ provide: getQueueToken(MODERATION_QUEUE), useValue: queue }]
          : []),
      ],
    }).compile();
    const service = moduleRef.get(ModerationService);
    const scan = jest.spyOn(service, 'scanTarget').mockResolvedValue({
      assessment: assessment('ALLOW'),
      reportId: null,
      actionTaken: ReportActionTaken.NONE,
    });
    return { service, scan };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    queue.add.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('đẩy được job vào hàng đợi thì không tự quét thêm trong tiến trình', async () => {
    queue.add.mockResolvedValue({ id: 'job-1' });
    const { service, scan } = await build(true);

    service.enqueueScan(ReportTargetType.COMMENT, 'c-1');
    await jest.runAllTimersAsync();

    expect(queue.add).toHaveBeenCalledWith(
      MODERATION_SCAN_JOB,
      { targetType: ReportTargetType.COMMENT, targetId: 'c-1' },
      expect.any(Object),
    );
    expect(scan).not.toHaveBeenCalled();
  });

  it('hàng đợi lỗi thì tự quét 1 lần trong tiến trình', async () => {
    queue.add.mockRejectedValue(new Error('redis down'));
    const { service, scan } = await build(true);

    service.enqueueScan(ReportTargetType.POST, 'post-1');
    await jest.runAllTimersAsync();

    expect(scan).toHaveBeenCalledTimes(1);
    expect(scan).toHaveBeenCalledWith(ReportTargetType.POST, 'post-1');
  });

  it('không cấu hình hàng đợi thì tự quét 1 lần', async () => {
    const { service, scan } = await build(false);

    service.enqueueScan(ReportTargetType.POST, 'post-1');
    await jest.runAllTimersAsync();

    expect(scan).toHaveBeenCalledTimes(1);
  });
});
