import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ContentStatus,
  NotificationType,
  PostCommentStatus,
  ReportActionTaken,
  ReportTargetType,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { BlogGateway } from '../blog/blog.gateway';
import { tokenVersionCacheKey } from '../common/constants/cache-keys.constant';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { NotificationService } from '../notification/notification.service';
import { ResolveModerationReportDto } from './dto/moderation.dto';
import { ModerationResolveAction } from './moderation.constant';

const PROTECTED_FROM_BAN = new Set<UserRole>([
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
]);

@Injectable()
export class ModerationResolutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly blogGateway: BlogGateway,
    private readonly redis: RedisService,
  ) {}

  async resolveReport(
    reportId: string,
    reviewerId: string,
    dto: ResolveModerationReportDto,
  ) {
    const report = await this.prisma.contentReport.findUnique({
      where: { id: reportId },
    });
    if (!report) {
      throw new NotFoundException(`Báo cáo ${reportId} không tồn tại`);
    }

    const nextActionTaken: ReportActionTaken =
      dto.action === ModerationResolveAction.RESTORE
        ? ReportActionTaken.DISMISSED
        : ReportActionTaken.CONFIRMED_REMOVED;

    const existingReasons =
      report.aiReasons && typeof report.aiReasons === 'object'
        ? (report.aiReasons as Record<string, any>)
        : {};

    const updatedReport = await this.prisma.contentReport.update({
      where: { id: reportId },
      data: {
        actionTaken: nextActionTaken,
        reviewerId,
        reviewedAt: new Date(),
        aiReasons: {
          ...existingReasons,
          adminNote: dto.note?.trim() || existingReasons.adminNote || null,
          resolvedAction: dto.action,
        },
      },
    });

    await this.prisma.contentReport.updateMany({
      where: {
        targetType: report.targetType,
        targetId: report.targetId,
        id: { not: reportId },
        actionTaken: {
          in: [ReportActionTaken.NONE, ReportActionTaken.AUTO_HIDDEN],
        },
      },
      data: {
        actionTaken: nextActionTaken,
        reviewerId,
        reviewedAt: new Date(),
      },
    });

    const { targetAuthorId, targetTitle } = await this.applyTargetResolution(
      report,
      dto,
    );

    const bannedUserId =
      dto.action === ModerationResolveAction.BAN_USER && targetAuthorId
        ? await this.handleBanUser(targetAuthorId)
        : null;

    this.blogGateway.emitModerationEvent({
      type: 'report-resolved',
      reportId: updatedReport.id,
      targetId: report.targetId,
    });

    return {
      success: true,
      reportId: updatedReport.id,
      actionTaken: updatedReport.actionTaken,
      bannedUserId,
      targetTitle,
    };
  }

  /** Ẩn bình luận và giảm số bình luận của bài cùng lúc (không để số đếm lệch). */
  async hideComment(comment: { id: string; postId: string }) {
    await this.prisma.$transaction([
      this.prisma.blogPostComment.update({
        where: { id: comment.id },
        data: {
          status: PostCommentStatus.REMOVED,
          deletedAt: new Date(),
        },
      }),
      this.prisma.blogPost.updateMany({
        where: { id: comment.postId, commentCount: { gt: 0 } },
        data: { commentCount: { decrement: 1 } },
      }),
    ]);
  }

  private async applyTargetResolution(
    report: {
      targetType: ReportTargetType;
      targetId: string;
      actionTaken: ReportActionTaken;
    },
    dto: ResolveModerationReportDto,
  ): Promise<{ targetAuthorId: string | null; targetTitle: string }> {
    if (report.targetType === ReportTargetType.POST) {
      const post = await this.prisma.blogPost.findUnique({
        where: { id: report.targetId },
      });
      return post
        ? this.resolvePostTarget(post, dto, report.actionTaken)
        : { targetAuthorId: null, targetTitle: '' };
    }

    if (report.targetType === ReportTargetType.COMMENT) {
      const comment = await this.prisma.blogPostComment.findUnique({
        where: { id: report.targetId },
      });
      return comment
        ? this.resolveCommentTarget(comment, dto)
        : { targetAuthorId: null, targetTitle: '' };
    }

    return { targetAuthorId: null, targetTitle: '' };
  }

  private async restorePost(post: {
    id: string;
    authorId?: string | null;
    title: string;
    slug: string;
    publishedAt?: Date | null;
  }) {
    await this.prisma.blogPost.update({
      where: { id: post.id },
      data: {
        status: ContentStatus.PUBLISHED,
        publishedAt: post.publishedAt ?? new Date(),
      },
    });
    this.blogGateway.emitPostRestored(post.id);

    if (post.authorId) {
      try {
        await this.notificationService.notify(
          post.authorId,
          NotificationType.CONTENT_APPROVED,
          'Bài viết đã được khôi phục hiển thị',
          `Sau khi rà soát, Ban quản trị HISGO đã khôi phục bài viết "${post.title}" của bạn lên dòng thời gian Cộng đồng.`,
          `/blog/${post.slug}`,
        );
      } catch {
        // ignore
      }
    }
  }

  private async rejectPost(
    post: {
      id: string;
      authorId?: string | null;
      title: string;
      status: string;
    },
    note?: string,
    notifyAuthor = false,
  ) {
    if (post.status !== ContentStatus.REJECTED) {
      await this.prisma.blogPost.update({
        where: { id: post.id },
        data: { status: ContentStatus.REJECTED },
      });
    }
    this.blogGateway.emitPostHidden(post.id);

    if (post.authorId && notifyAuthor) {
      try {
        await this.notificationService.notify(
          post.authorId,
          NotificationType.CONTENT_VIOLATION,
          'Bài viết đã bị gỡ do vi phạm quy tắc cộng đồng',
          `Bài viết "${post.title}" đã bị gỡ bỏ sau khi kiểm duyệt viên xác nhận vi phạm.${
            note ? ` Ghi chú: ${note}` : ''
          }`,
          '/cong-dong',
        );
      } catch {
        // ignore
      }
    }
  }

  private async resolvePostTarget(
    post: {
      id: string;
      authorId?: string | null;
      title: string;
      slug: string;
      status: string;
      publishedAt?: Date | null;
    },
    dto: ResolveModerationReportDto,
    initialActionTaken: string,
  ): Promise<{ targetAuthorId: string | null; targetTitle: string }> {
    const targetAuthorId = post.authorId ?? null;
    const targetTitle = post.title;

    if (dto.action === ModerationResolveAction.RESTORE) {
      if (post.status === ContentStatus.REJECTED) {
        await this.restorePost(post);
      }
    } else {
      await this.rejectPost(
        post,
        dto.note,
        initialActionTaken === ReportActionTaken.NONE,
      );
    }

    return { targetAuthorId, targetTitle };
  }

  private async resolveCommentTarget(
    comment: {
      id: string;
      authorId?: string | null;
      content: string;
      status: string;
      postId: string;
    },
    dto: ResolveModerationReportDto,
  ): Promise<{ targetAuthorId: string | null; targetTitle: string }> {
    const targetAuthorId = comment.authorId ?? null;
    const targetTitle = comment.content.slice(0, 60);

    const isRemoved = comment.status === PostCommentStatus.REMOVED;
    if (dto.action === ModerationResolveAction.RESTORE && isRemoved) {
      await this.prisma.$transaction([
        this.prisma.blogPostComment.update({
          where: { id: comment.id },
          data: { status: PostCommentStatus.VISIBLE, deletedAt: null },
        }),
        this.prisma.blogPost.updateMany({
          where: { id: comment.postId },
          data: { commentCount: { increment: 1 } },
        }),
      ]);
    } else if (dto.action !== ModerationResolveAction.RESTORE && !isRemoved) {
      await this.hideComment(comment);
      this.blogGateway.emitCommentUpdated(comment.postId, {
        type: 'deleted',
        commentId: comment.id,
      });
    }

    return { targetAuthorId, targetTitle };
  }

  private async handleBanUser(targetAuthorId: string): Promise<string | null> {
    const author = await this.prisma.authUser.findUnique({
      where: { id: targetAuthorId },
      select: { id: true, role: true },
    });
    if (author && !PROTECTED_FROM_BAN.has(author.role)) {
      await this.prisma.authUser.update({
        where: { id: author.id },
        data: {
          status: UserStatus.BLOCKED,
          tokenVersion: { increment: 1 },
        },
      });
      await this.redis.del(tokenVersionCacheKey(author.id));
      return author.id;
    }
    return null;
  }
}
