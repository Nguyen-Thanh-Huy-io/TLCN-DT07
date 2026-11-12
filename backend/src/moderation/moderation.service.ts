import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import {
  NotificationType,
  ReportActionTaken,
  ReportRiskLevel,
} from '@prisma/client';
import { Queue } from 'bullmq';
import { BlogGateway } from '../blog/blog.gateway';
import { PrismaService } from '../common/services/prisma.service';
import { NotificationService } from '../notification/notification.service';
import {
  ListModerationReportsQueryDto,
  ResolveModerationReportDto,
} from './dto/moderation.dto';
import {
  ModerationAiService,
  ModerationAssessment,
} from './moderation-ai.service';

export interface ModerationScanJobData {
  targetType: 'POST' | 'COMMENT';
  targetId: string;
}

@Injectable()
export class ModerationService {
  private readonly recentScans = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: ModerationAiService,
    private readonly notificationService: NotificationService,
    private readonly blogGateway: BlogGateway,
    @Optional()
    @InjectQueue('moderation-queue')
    private readonly moderationQueue?: Queue,
  ) {}

  /**
   * Đẩy tác vụ kiểm duyệt ngầm vào BullMQ (kèm cơ chế fallback bất đồng bộ nếu Redis Queue bận)
   * để API tạo bài/bình luận phản hồi tức thì cho người dùng.
   */
  enqueueScan(targetType: 'POST' | 'COMMENT', targetId: string): void {
    const runFallback = () => {
      setTimeout(() => {
        void this.scanTarget(targetType, targetId).catch(() => {
          // Không làm gián đoạn tiến trình chính nếu job ngầm lỗi
        });
      }, 350);
    };

    if (this.moderationQueue) {
      this.moderationQueue
        .add(
          'scan-content',
          { targetType, targetId } satisfies ModerationScanJobData,
          {
            attempts: 2,
            backoff: { type: 'exponential', delay: 1500 },
            removeOnComplete: 100,
            removeOnFail: 200,
          },
        )
        .catch(() => {
          runFallback();
        });
      // Đảm bảo thực thi ngay cả khi BullMQ worker chưa khởi chạy trong môi trường dev đơn lẻ
      runFallback();
    } else {
      runFallback();
    }
  }

  /**
   * Thực thi quét AI 3 cấp độ (Tier 1: ALLOW, Tier 2: FLAG_FOR_REVIEW, Tier 3: AUTO_HIDE)
   */
  async scanTarget(
    targetType: 'POST' | 'COMMENT',
    targetId: string,
    options?: { forceExecution?: boolean },
  ): Promise<{
    assessment: ModerationAssessment;
    reportId: string | null;
    actionTaken: ReportActionTaken;
  }> {
    const dedupeKey = `${targetType}:${targetId}`;
    const now = Date.now();
    if (!options?.forceExecution) {
      const lastRun = this.recentScans.get(dedupeKey);
      if (lastRun && now - lastRun < 4000) {
        return {
          assessment: {
            isSafe: true,
            riskLevel: 'SAFE',
            action: 'ALLOW',
            confidence: 1,
            detectedCategories: ['NONE'],
            violationReasonVi: '',
            engine: 'HYBRID_SENTINEL',
          },
          reportId: null,
          actionTaken: 'NONE',
        };
      }
    }
    this.recentScans.set(dedupeKey, now);

    if (targetType === 'POST') {
      return this.scanBlogPost(targetId);
    }
    return this.scanComment(targetId);
  }

  private extractPostText(post: {
    title: string;
    excerpt?: string | null;
    contentBlocks?: unknown;
  }): string {
    const parts: string[] = [post.title];
    if (post.excerpt) {
      parts.push(post.excerpt);
    }

    if (Array.isArray(post.contentBlocks)) {
      for (const raw of post.contentBlocks) {
        if (!raw || typeof raw !== 'object') continue;
        const block = raw as Record<string, any>;
        if (typeof block.heading === 'string') parts.push(block.heading);
        if (typeof block.text === 'string') parts.push(block.text);
        if (typeof block.content === 'string') {
          parts.push(block.content.replace(/<[^>]*>/g, ' '));
        }
        if (typeof block.quoteText === 'string') parts.push(block.quoteText);
        if (typeof block.caption === 'string') parts.push(block.caption);
      }
    }

    return parts.filter(Boolean).join('\n');
  }

  private async scanBlogPost(postId: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        title: true,
        slug: true,
        excerpt: true,
        contentBlocks: true,
        status: true,
      },
    });

    if (!post) {
      throw new NotFoundException(`Bài viết ${postId} không tồn tại`);
    }

    const fullText = this.extractPostText(post);
    const assessment = await this.aiService.evaluateContent(fullText);

    // Tier 1: An toàn (ALLOW)
    if (assessment.action === 'ALLOW') {
      return {
        assessment,
        reportId: null,
        actionTaken: ReportActionTaken.NONE,
      };
    }

    const isAutoHide = assessment.action === 'AUTO_HIDE';
    const actionTaken: ReportActionTaken = isAutoHide
      ? ReportActionTaken.AUTO_HIDDEN
      : ReportActionTaken.NONE;

    // Nếu Tier 3 (AUTO_HIDE): Tự động ẩn bài ngay lập tức
    if (isAutoHide && post.status !== 'REJECTED') {
      await this.prisma.blogPost.update({
        where: { id: post.id },
        data: { status: 'REJECTED' },
      });
    }

    // Tạo bản ghi ContentReport trong hệ thống
    const report = await this.prisma.contentReport.create({
      data: {
        targetType: 'POST',
        targetId: post.id,
        reporterId: null,
        source: 'AI_SCAN',
        riskLevel: assessment.riskLevel as ReportRiskLevel,
        aiConfidence: assessment.confidence,
        actionTaken,
        aiReasons: {
          categories: assessment.detectedCategories,
          violationReasonVi:
            assessment.violationReasonVi ||
            'Nội dung có dấu hiệu vi phạm tiêu chuẩn cộng đồng HISGO.',
          matchedExcerpt: assessment.matchedExcerpt || fullText.slice(0, 220),
          engine: assessment.engine,
        },
      },
    });

    // Bắn sự kiện Real-time
    if (isAutoHide) {
      this.blogGateway.emitPostHidden(post.id);
      this.blogGateway.emitPostModerated(post.id, {
        status: 'REMOVED',
        reason: assessment.violationReasonVi,
      });

      if (post.authorId) {
        try {
          await this.notificationService.notify(
            post.authorId,
            NotificationType.CONTENT_VIOLATION,
            'Bài viết bị tạm ẩn do vi phạm tiêu chuẩn cộng đồng',
            `Bài viết "${post.title}" đã bị hệ thống AI Sentinel tạm ẩn. Lý do: ${
              assessment.violationReasonVi ||
              'Vi phạm quy tắc thảo luận lịch sử văn minh.'
            }`,
            '/cong-dong',
          );
        } catch {
          // Bỏ qua nếu lỗi gửi thông báo
        }
      }
    }

    this.blogGateway.emitModerationEvent({
      type: 'report-created',
      reportId: report.id,
      targetId: post.id,
    });

    return {
      assessment,
      reportId: report.id,
      actionTaken,
    };
  }

  private async scanComment(commentId: string) {
    const comment = await this.prisma.articleComment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        articleId: true,
        authorId: true,
        content: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!comment) {
      throw new NotFoundException(`Bình luận ${commentId} không tồn tại`);
    }

    const assessment = await this.aiService.evaluateContent(comment.content);

    if (assessment.action === 'ALLOW') {
      return {
        assessment,
        reportId: null,
        actionTaken: ReportActionTaken.NONE,
      };
    }

    const isAutoHide = assessment.action === 'AUTO_HIDE';
    const actionTaken: ReportActionTaken = isAutoHide
      ? ReportActionTaken.AUTO_HIDDEN
      : ReportActionTaken.NONE;

    if (isAutoHide && comment.status !== 'REMOVED') {
      await this.prisma.articleComment.update({
        where: { id: comment.id },
        data: {
          status: 'REMOVED',
          deletedAt: new Date(),
        },
      });

      await this.prisma.blogPost.updateMany({
        where: { id: comment.articleId, commentCount: { gt: 0 } },
        data: { commentCount: { decrement: 1 } },
      });

      this.blogGateway.emitCommentUpdated(comment.articleId, {
        type: 'deleted',
        commentId: comment.id,
        reason: assessment.violationReasonVi,
      });

      if (comment.authorId) {
        try {
          await this.notificationService.notify(
            comment.authorId,
            NotificationType.CONTENT_VIOLATION,
            'Bình luận bị ẩn do vi phạm tiêu chuẩn cộng đồng',
            `Bình luận của bạn đã bị hệ thống AI Sentinel ẩn tự động. Lý do: ${
              assessment.violationReasonVi ||
              'Ngôn từ không phù hợp tiêu chuẩn cộng đồng.'
            }`,
            '/cong-dong',
          );
        } catch {
          // ignore
        }
      }
    }

    const report = await this.prisma.contentReport.create({
      data: {
        targetType: 'COMMENT',
        targetId: comment.id,
        reporterId: null,
        source: 'AI_SCAN',
        riskLevel: assessment.riskLevel as ReportRiskLevel,
        aiConfidence: assessment.confidence,
        actionTaken,
        aiReasons: {
          categories: assessment.detectedCategories,
          violationReasonVi:
            assessment.violationReasonVi ||
            'Bình luận có dấu hiệu vi phạm tiêu chuẩn cộng đồng HISGO.',
          matchedExcerpt:
            assessment.matchedExcerpt || comment.content.slice(0, 220),
          engine: assessment.engine,
        },
      },
    });

    this.blogGateway.emitModerationEvent({
      type: 'report-created',
      reportId: report.id,
      targetId: comment.id,
    });

    return {
      assessment,
      reportId: report.id,
      actionTaken,
    };
  }

  /**
   * Danh sách báo cáo vi phạm cho trang quản trị CMS (/cms/moderation)
   */
  async listReports(query: ListModerationReportsQueryDto) {
    const allReports = await this.prisma.contentReport.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, username: true, email: true } },
        reviewer: { select: { id: true, username: true, email: true } },
      },
      take: 250,
    });

    const postIds = Array.from(
      new Set(
        allReports
          .filter((r) => r.targetType === 'POST')
          .map((r) => r.targetId),
      ),
    );
    const commentIds = Array.from(
      new Set(
        allReports
          .filter((r) => r.targetType === 'COMMENT')
          .map((r) => r.targetId),
      ),
    );

    const [posts, comments] = await Promise.all([
      postIds.length > 0
        ? this.prisma.blogPost.findMany({
            where: { id: { in: postIds } },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  status: true,
                  role: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      commentIds.length > 0
        ? this.prisma.articleComment.findMany({
            where: { id: { in: commentIds } },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  status: true,
                  role: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const postMap = new Map(posts.map((p) => [p.id, p] as const));
    const commentMap = new Map(comments.map((c) => [c.id, c] as const));

    // Đếm số lần vi phạm của từng tác giả để hỗ trợ Admin quyết định Ban user
    const authorViolationCounts = new Map<string, number>();
    for (const r of allReports) {
      if (
        r.actionTaken === 'AUTO_HIDDEN' ||
        r.actionTaken === 'CONFIRMED_REMOVED'
      ) {
        const targetAuthorId =
          r.targetType === 'POST'
            ? postMap.get(r.targetId)?.authorId
            : commentMap.get(r.targetId)?.authorId;
        if (targetAuthorId) {
          authorViolationCounts.set(
            targetAuthorId,
            (authorViolationCounts.get(targetAuthorId) ?? 0) + 1,
          );
        }
      }
    }

    const enriched = allReports.map((report) => {
      const rawReasons =
        report.aiReasons && typeof report.aiReasons === 'object'
          ? (report.aiReasons as Record<string, any>)
          : {};

      if (report.targetType === 'POST') {
        const post = postMap.get(report.targetId);
        const fullExcerpt = post
          ? this.extractPostText(post).slice(0, 320)
          : '';
        const author = post?.author ?? null;
        return {
          id: report.id,
          targetType: 'POST' as const,
          targetId: report.targetId,
          source: report.source,
          riskLevel: report.riskLevel,
          aiConfidence: report.aiConfidence,
          actionTaken: report.actionTaken,
          categories: Array.isArray(rawReasons.categories)
            ? rawReasons.categories
            : report.source === 'USER_REPORT'
              ? ['USER_FLAGGED']
              : ['NONE'],
          reasonText:
            rawReasons.violationReasonVi ||
            rawReasons.userReason ||
            'Báo cáo nội dung cần kiểm duyệt viên xem xét.',
          matchedExcerpt:
            rawReasons.matchedExcerpt || post?.excerpt || fullExcerpt,
          engine:
            rawReasons.engine ||
            (report.source === 'AI_SCAN' ? 'HYBRID_SENTINEL' : 'USER'),
          adminNote: rawReasons.adminNote || null,
          target: post
            ? {
                id: post.id,
                title: post.title,
                slug: post.slug,
                postType: post.postType,
                excerpt: post.excerpt || fullExcerpt,
                status: post.status,
                createdAt: post.createdAt,
                author: author
                  ? {
                      id: author.id,
                      username: author.username,
                      email: author.email,
                      status: author.status,
                      role: author.role,
                      violationCount: authorViolationCounts.get(author.id) ?? 0,
                    }
                  : null,
              }
            : null,
          reporter: report.reporter,
          reviewer: report.reviewer,
          reviewedAt: report.reviewedAt,
          createdAt: report.createdAt,
        };
      }

      const comment = commentMap.get(report.targetId);
      const author = comment?.author ?? null;
      return {
        id: report.id,
        targetType: 'COMMENT' as const,
        targetId: report.targetId,
        source: report.source,
        riskLevel: report.riskLevel,
        aiConfidence: report.aiConfidence,
        actionTaken: report.actionTaken,
        categories: Array.isArray(rawReasons.categories)
          ? rawReasons.categories
          : report.source === 'USER_REPORT'
            ? ['USER_FLAGGED']
            : ['NONE'],
        reasonText:
          rawReasons.violationReasonVi ||
          rawReasons.userReason ||
          'Báo cáo bình luận cần kiểm duyệt viên xem xét.',
        matchedExcerpt: rawReasons.matchedExcerpt || comment?.content || '',
        engine:
          rawReasons.engine ||
          (report.source === 'AI_SCAN' ? 'HYBRID_SENTINEL' : 'USER'),
        adminNote: rawReasons.adminNote || null,
        target: comment
          ? {
              id: comment.id,
              title: `Bình luận: "${comment.content.slice(0, 75)}${comment.content.length > 75 ? '...' : ''}"`,
              slug: null,
              postType: null,
              excerpt: comment.content,
              status: comment.status,
              createdAt: comment.createdAt,
              author: author
                ? {
                    id: author.id,
                    username: author.username,
                    email: author.email,
                    status: author.status,
                    role: author.role,
                    violationCount: authorViolationCounts.get(author.id) ?? 0,
                  }
                : null,
            }
          : null,
        reporter: report.reporter,
        reviewer: report.reviewer,
        reviewedAt: report.reviewedAt,
        createdAt: report.createdAt,
      };
    });

    const stats = {
      total: enriched.length,
      pending: enriched.filter(
        (r) => r.actionTaken === 'NONE' || r.actionTaken === 'AUTO_HIDDEN',
      ).length,
      autoHidden: enriched.filter((r) => r.actionTaken === 'AUTO_HIDDEN')
        .length,
      userReports: enriched.filter(
        (r) => r.source === 'USER_REPORT' && r.actionTaken === 'NONE',
      ).length,
      confirmedRemoved: enriched.filter(
        (r) => r.actionTaken === 'CONFIRMED_REMOVED',
      ).length,
      dismissed: enriched.filter((r) => r.actionTaken === 'DISMISSED').length,
    };

    const filtered = enriched.filter((item) => {
      if (query.tab === 'pending') {
        if (item.actionTaken !== 'NONE' && item.actionTaken !== 'AUTO_HIDDEN')
          return false;
      } else if (query.tab === 'auto_hidden') {
        if (item.actionTaken !== 'AUTO_HIDDEN') return false;
      } else if (query.tab === 'user_report') {
        if (item.source !== 'USER_REPORT') return false;
      } else if (query.tab === 'removed') {
        if (item.actionTaken !== 'CONFIRMED_REMOVED') return false;
      } else if (query.tab === 'dismissed') {
        if (item.actionTaken !== 'DISMISSED') return false;
      }

      if (query.source && item.source !== query.source) return false;
      if (query.riskLevel && item.riskLevel !== query.riskLevel) return false;
      if (query.targetType && item.targetType !== query.targetType)
        return false;

      if (query.search?.trim()) {
        const q = query.search.trim().toLowerCase();
        const inTitle = (item.target?.title || '').toLowerCase().includes(q);
        const inExcerpt = (item.matchedExcerpt || '').toLowerCase().includes(q);
        const inReason = (item.reasonText || '').toLowerCase().includes(q);
        const inAuthor = (item.target?.author?.username || '')
          .toLowerCase()
          .includes(q);
        return inTitle || inExcerpt || inReason || inAuthor;
      }

      return true;
    });

    return {
      stats,
      items: filtered,
    };
  }

  /**
   * Thao tác 1-Click xử lý báo cáo vi phạm trong CMS:
   * - CONFIRM_REMOVE: Xác nhận xóa vi phạm
   * - RESTORE: Khôi phục bài/bình luận (False Positive / AI bắt nhầm)
   * - BAN_USER: Khóa tài khoản tái phạm & xóa bài
   */
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
      dto.action === 'RESTORE'
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

    // Đồng bộ các report đang mở cùng targetId
    await this.prisma.contentReport.updateMany({
      where: {
        targetType: report.targetType,
        targetId: report.targetId,
        id: { not: reportId },
        actionTaken: { in: ['NONE', 'AUTO_HIDDEN'] },
      },
      data: {
        actionTaken: nextActionTaken,
        reviewerId,
        reviewedAt: new Date(),
      },
    });

    let targetAuthorId: string | null = null;
    let targetTitle = '';

    if (report.targetType === 'POST') {
      const post = await this.prisma.blogPost.findUnique({
        where: { id: report.targetId },
      });

      if (post) {
        targetAuthorId = post.authorId;
        targetTitle = post.title;

        if (dto.action === 'RESTORE') {
          await this.prisma.blogPost.update({
            where: { id: post.id },
            data: {
              status: 'PUBLISHED',
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
        } else {
          // CONFIRM_REMOVE hoặc BAN_USER
          if (post.status !== 'REJECTED') {
            await this.prisma.blogPost.update({
              where: { id: post.id },
              data: { status: 'REJECTED' },
            });
          }
          this.blogGateway.emitPostHidden(post.id);

          if (post.authorId && report.actionTaken === 'NONE') {
            try {
              await this.notificationService.notify(
                post.authorId,
                NotificationType.CONTENT_VIOLATION,
                'Bài viết đã bị gỡ do vi phạm quy tắc cộng đồng',
                `Bài viết "${post.title}" đã bị gỡ bỏ sau khi kiểm duyệt viên xác nhận vi phạm.${
                  dto.note ? ` Ghi chú: ${dto.note}` : ''
                }`,
                '/cong-dong',
              );
            } catch {
              // ignore
            }
          }
        }
      }
    } else if (report.targetType === 'COMMENT') {
      const comment = await this.prisma.articleComment.findUnique({
        where: { id: report.targetId },
      });

      if (comment) {
        targetAuthorId = comment.authorId;
        targetTitle = comment.content.slice(0, 60);

        if (dto.action === 'RESTORE') {
          await this.prisma.articleComment.update({
            where: { id: comment.id },
            data: {
              status: 'VISIBLE',
              deletedAt: null,
            },
          });
          await this.prisma.blogPost.updateMany({
            where: { id: comment.articleId },
            data: { commentCount: { increment: 1 } },
          });
        } else if (comment.status !== 'REMOVED') {
          await this.prisma.articleComment.update({
            where: { id: comment.id },
            data: {
              status: 'REMOVED',
              deletedAt: new Date(),
            },
          });
          await this.prisma.blogPost.updateMany({
            where: { id: comment.articleId, commentCount: { gt: 0 } },
            data: { commentCount: { decrement: 1 } },
          });
          this.blogGateway.emitCommentUpdated(comment.articleId, {
            type: 'deleted',
            commentId: comment.id,
          });
        }
      }
    }

    // Nếu thao tác là BAN_USER: khóa tài khoản tác giả & thu hồi phiên đăng nhập
    let bannedUserId: string | null = null;
    if (dto.action === 'BAN_USER' && targetAuthorId) {
      const author = await this.prisma.authUser.findUnique({
        where: { id: targetAuthorId },
        select: { id: true, role: true },
      });
      if (author && author.role !== 'SUPERADMIN' && author.role !== 'ADMIN') {
        await this.prisma.authUser.update({
          where: { id: author.id },
          data: {
            status: 'BLOCKED',
            tokenVersion: { increment: 1 },
          },
        });
        bannedUserId = author.id;
      }
    }

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
}
