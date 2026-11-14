import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  PostCommentStatus,
  ReportActionTaken,
  ReportTargetType,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { BlogGateway } from '../blog/blog.gateway';
import { PrismaService } from '../common/services/prisma.service';
import { tokenVersionCacheKey } from '../common/constants/cache-keys.constant';
import { RedisService } from '../common/services/redis.service';
import { NotificationService } from '../notification/notification.service';
import { ModerationAiService } from './moderation-ai.service';
import { ModerationResolveAction } from './moderation.constant';
import { ModerationService } from './moderation.service';

const COMMENT_REPORT = {
  id: 'report-1',
  targetType: ReportTargetType.COMMENT,
  targetId: 'comment-1',
  actionTaken: ReportActionTaken.NONE,
  aiReasons: null,
};

const VISIBLE_COMMENT = {
  id: 'comment-1',
  authorId: 'author-1',
  content: 'Bình luận vi phạm',
  status: PostCommentStatus.VISIBLE,
  postId: 'post-1',
};

describe('ModerationService — xử lý báo cáo bình luận Blog', () => {
  let service: ModerationService;

  const prisma = {
    contentReport: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    blogPostComment: { findUnique: jest.fn(), update: jest.fn() },
    blogPost: { findUnique: jest.fn(), updateMany: jest.fn() },
    authUser: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  const redisMock = { del: jest.fn() };
  const blogGateway = {
    emitModerationEvent: jest.fn(),
    emitCommentUpdated: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.contentReport.findUnique.mockResolvedValue(COMMENT_REPORT);
    prisma.contentReport.update.mockResolvedValue({
      id: COMMENT_REPORT.id,
      actionTaken: ReportActionTaken.CONFIRMED_REMOVED,
    });
    prisma.blogPostComment.findUnique.mockResolvedValue(VISIBLE_COMMENT);
    const moduleRef = await Test.createTestingModule({
      providers: [
        ModerationService,
        { provide: PrismaService, useValue: prisma },
        { provide: ModerationAiService, useValue: {} },
        { provide: NotificationService, useValue: {} },
        { provide: BlogGateway, useValue: blogGateway },
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();
    service = moduleRef.get(ModerationService);
  });

  it('báo NotFoundException khi báo cáo không tồn tại', async () => {
    prisma.contentReport.findUnique.mockResolvedValue(null);

    await expect(
      service.resolveReport('missing', 'reviewer-1', {
        action: ModerationResolveAction.CONFIRM_REMOVE,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('xác nhận gỡ: ẩn bình luận trong bảng blog_post_comments, giảm đếm và báo realtime', async () => {
    await service.resolveReport(COMMENT_REPORT.id, 'reviewer-1', {
      action: ModerationResolveAction.CONFIRM_REMOVE,
    });

    expect(prisma.blogPostComment.findUnique).toHaveBeenCalledWith({
      where: { id: VISIBLE_COMMENT.id },
    });
    expect(prisma.blogPostComment.update).toHaveBeenCalledWith({
      where: { id: VISIBLE_COMMENT.id },
      data: { status: PostCommentStatus.REMOVED, deletedAt: expect.any(Date) },
    });
    expect(prisma.blogPost.updateMany).toHaveBeenCalledWith({
      where: { id: VISIBLE_COMMENT.postId, commentCount: { gt: 0 } },
      data: { commentCount: { decrement: 1 } },
    });
    expect(blogGateway.emitCommentUpdated).toHaveBeenCalledWith(
      VISIBLE_COMMENT.postId,
      { type: 'deleted', commentId: VISIBLE_COMMENT.id },
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('bình luận đã bị gỡ trước đó thì không gỡ hay giảm đếm lần nữa', async () => {
    prisma.blogPostComment.findUnique.mockResolvedValue({
      ...VISIBLE_COMMENT,
      status: PostCommentStatus.REMOVED,
    });

    await service.resolveReport(COMMENT_REPORT.id, 'reviewer-1', {
      action: ModerationResolveAction.CONFIRM_REMOVE,
    });

    expect(prisma.blogPostComment.update).not.toHaveBeenCalled();
    expect(prisma.blogPost.updateMany).not.toHaveBeenCalled();
  });

  it('bác báo cáo trên bình luận vẫn đang hiện: không tăng đếm bình luận', async () => {
    await service.resolveReport(COMMENT_REPORT.id, 'reviewer-1', {
      action: ModerationResolveAction.RESTORE,
    });

    expect(prisma.blogPostComment.update).not.toHaveBeenCalled();
    expect(prisma.blogPost.updateMany).not.toHaveBeenCalled();
  });

  it('khôi phục (AI bắt nhầm): hiện lại bình luận, tăng đếm và đánh dấu báo cáo DISMISSED', async () => {
    prisma.blogPostComment.findUnique.mockResolvedValue({
      ...VISIBLE_COMMENT,
      status: PostCommentStatus.REMOVED,
    });

    await service.resolveReport(COMMENT_REPORT.id, 'reviewer-1', {
      action: ModerationResolveAction.RESTORE,
    });

    expect(prisma.blogPostComment.update).toHaveBeenCalledWith({
      where: { id: VISIBLE_COMMENT.id },
      data: { status: PostCommentStatus.VISIBLE, deletedAt: null },
    });
    expect(prisma.blogPost.updateMany).toHaveBeenCalledWith({
      where: { id: VISIBLE_COMMENT.postId },
      data: { commentCount: { increment: 1 } },
    });
    expect(prisma.contentReport.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actionTaken: ReportActionTaken.DISMISSED,
        }),
      }),
    );
  });

  it('khoá tác giả bình luận khi chọn BAN_USER', async () => {
    prisma.authUser.findUnique.mockResolvedValue({
      id: VISIBLE_COMMENT.authorId,
      role: UserRole.USER,
    });

    const result = await service.resolveReport(
      COMMENT_REPORT.id,
      'reviewer-1',
      {
        action: ModerationResolveAction.BAN_USER,
      },
    );

    expect(prisma.authUser.update).toHaveBeenCalledWith({
      where: { id: VISIBLE_COMMENT.authorId },
      data: { status: UserStatus.BLOCKED, tokenVersion: { increment: 1 } },
    });
    expect(result.bannedUserId).toBe(VISIBLE_COMMENT.authorId);
    expect(redisMock.del).toHaveBeenCalledWith(
      tokenVersionCacheKey(VISIBLE_COMMENT.authorId),
    );
  });

  it('không khoá tài khoản ADMIN dù chọn BAN_USER', async () => {
    prisma.authUser.findUnique.mockResolvedValue({
      id: VISIBLE_COMMENT.authorId,
      role: UserRole.ADMIN,
    });

    const result = await service.resolveReport(
      COMMENT_REPORT.id,
      'reviewer-1',
      {
        action: ModerationResolveAction.BAN_USER,
      },
    );

    expect(prisma.authUser.update).not.toHaveBeenCalled();
    expect(result.bannedUserId).toBeNull();
  });
});
