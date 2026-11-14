import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import {
  ContentStatus,
  PostCommentStatus,
  NotificationType,
  ReportActionTaken,
  ReportRiskLevel,
  ReportSource,
  ReportTargetType,
  userRole,
  userStatus,
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
import {
  MODERATION_QUEUE,
  MODERATION_SCAN_JOB,
  ModerationResolveAction,
  ModerationTab,
} from './moderation.constant';

const PROTECTED_FROM_BAN = new Set<userRole>([
  userRole.SUPERADMIN,
  userRole.ADMIN,
]);

export interface ModerationScanJobData {
  targetType: ReportTargetType;
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
    @InjectQueue(MODERATION_QUEUE)
    private readonly moderationQueue?: Queue,
  ) {}

  /**
   * Đẩy tác vụ kiểm duyệt ngầm vào BullMQ để API tạo bài/bình luận phản hồi tức thì.
   * Chỉ tự quét trong tiến trình khi không có hàng đợi hoặc không đẩy được job — nếu không
   * `ModerationProcessor` đã quét, chạy thêm sẽ quét 2 lần.
   */
  enqueueScan(targetType: ReportTargetType, targetId: string): void {
    const scanInProcess = () => {
      setTimeout(() => {
        void this.scanTarget(targetType, targetId).catch(() => {
          // Không làm gián đoạn tiến trình chính nếu job ngầm lỗi
        });
      }, 350);
    };

    if (!this.moderationQueue) {
      scanInProcess();
      return;
    }

    this.moderationQueue
      .add(
        MODERATION_SCAN_JOB,
        { targetType, targetId } satisfies ModerationScanJobData,
        {
          attempts: 2,
          backoff: { type: 'exponential', delay: 1500 },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      )
      .catch(() => {
        scanInProcess();
      });
  }

  /**
   * Thực thi quét AI 3 cấp độ (Tier 1: ALLOW, Tier 2: FLAG_FOR_REVIEW, Tier 3: AUTO_HIDE)
   */
  async scanTarget(
    targetType: ReportTargetType,
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
            riskLevel: ReportRiskLevel.SAFE,
            action: 'ALLOW',
            confidence: 1,
            detectedCategories: ['NONE'],
            violationReasonVi: '',
            engine: 'HYBRID_SENTINEL',
          },
          reportId: null,
          actionTaken: ReportActionTaken.NONE,
        };
      }
    }
    this.recentScans.set(dedupeKey, now);

    if (targetType === ReportTargetType.POST) {
      return this.scanBlogPost(targetId);
    }
    return this.scanComment(targetId);
  }

  private extractBlockText(raw: unknown): string[] {
    if (!raw || typeof raw !== 'object') return [];
    const block = raw as Record<string, any>;
    const parts: string[] = [];
    if (typeof block.heading === 'string') parts.push(block.heading);
    if (typeof block.text === 'string') parts.push(block.text);
    if (typeof block.content === 'string') {
      parts.push(block.content.replace(/<[^>]*>/g, ' '));
    }
    if (typeof block.quoteText === 'string') parts.push(block.quoteText);
    if (typeof block.caption === 'string') parts.push(block.caption);
    return parts;
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
        parts.push(...this.extractBlockText(raw));
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
    if (isAutoHide && post.status !== ContentStatus.REJECTED) {
      await this.prisma.blogPost.update({
        where: { id: post.id },
        data: { status: ContentStatus.REJECTED },
      });
    }

    // Tạo bản ghi ContentReport trong hệ thống
    const report = await this.prisma.contentReport.create({
      data: {
        targetType: ReportTargetType.POST,
        targetId: post.id,
        reporterId: null,
        source: ReportSource.AI_SCAN,
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
    const comment = await this.prisma.blogPostComment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        postId: true,
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

    if (isAutoHide && comment.status !== PostCommentStatus.REMOVED) {
      await this.hideComment(comment);

      this.blogGateway.emitCommentUpdated(comment.postId, {
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
        targetType: ReportTargetType.COMMENT,
        targetId: comment.id,
        reporterId: null,
        source: ReportSource.AI_SCAN,
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
          .filter((r) => r.targetType === ReportTargetType.POST)
          .map((r) => r.targetId),
      ),
    );
    const commentIds = Array.from(
      new Set(
        allReports
          .filter((r) => r.targetType === ReportTargetType.COMMENT)
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
        ? this.prisma.blogPostComment.findMany({
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
        r.actionTaken === ReportActionTaken.AUTO_HIDDEN ||
        r.actionTaken === ReportActionTaken.CONFIRMED_REMOVED
      ) {
        const commentTarget = commentMap.get(r.targetId) as {
          authorId?: string | null;
          userId?: string | null;
        };
        const targetAuthorId: string | null | undefined =
          r.targetType === ReportTargetType.POST
            ? postMap.get(r.targetId)?.authorId
            : commentTarget?.authorId || commentTarget?.userId;
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

      if (report.targetType === ReportTargetType.POST) {
        return this.buildPostReportItem(
          report,
          postMap.get(report.targetId),
          rawReasons,
          authorViolationCounts,
        );
      }

      return this.buildCommentReportItem(
        report,
        commentMap.get(report.targetId),
        rawReasons,
        authorViolationCounts,
      );
    });

    const stats = {
      total: enriched.length,
      pending: enriched.filter(
        (r) =>
          r.actionTaken === ReportActionTaken.NONE ||
          r.actionTaken === ReportActionTaken.AUTO_HIDDEN,
      ).length,
      autoHidden: enriched.filter(
        (r) => r.actionTaken === ReportActionTaken.AUTO_HIDDEN,
      ).length,
      userReports: enriched.filter(
        (r) =>
          r.source === ReportSource.USER_REPORT &&
          r.actionTaken === ReportActionTaken.NONE,
      ).length,
      confirmedRemoved: enriched.filter(
        (r) => r.actionTaken === ReportActionTaken.CONFIRMED_REMOVED,
      ).length,
      dismissed: enriched.filter(
        (r) => r.actionTaken === ReportActionTaken.DISMISSED,
      ).length,
    };

    const filtered = enriched.filter((item) => {
      if (
        !this.matchesModerationTab(
          String(item.actionTaken),
          String(item.source),
          query.tab,
        )
      ) {
        return false;
      }
      if (query.source && item.source !== query.source) return false;
      if (query.riskLevel && item.riskLevel !== query.riskLevel) return false;
      if (query.targetType && item.targetType !== query.targetType) {
        return false;
      }
      return this.matchesModerationSearch(item, query.search);
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

    // Đồng bộ các report đang mở cùng targetId
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

    let targetAuthorId: string | null = null;
    let targetTitle = '';

    if (report.targetType === ReportTargetType.POST) {
      const post = await this.prisma.blogPost.findUnique({
        where: { id: report.targetId },
      });

      if (post) {
        const resolved = await this.resolvePostTarget(
          post,
          dto,
          report.actionTaken,
        );
        targetAuthorId = resolved.targetAuthorId;
        targetTitle = resolved.targetTitle;
      }
    } else if (report.targetType === ReportTargetType.COMMENT) {
      const comment = await this.prisma.blogPostComment.findUnique({
        where: { id: report.targetId },
      });

      if (comment) {
        const resolved = await this.resolveCommentTarget(comment, dto);
        targetAuthorId = resolved.targetAuthorId;
        targetTitle = resolved.targetTitle;
      }
    }

    // Nếu thao tác là BAN_USER: khóa tài khoản tác giả & thu hồi phiên đăng nhập
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

  private buildPostReportItem(
    report: any,
    post: any,
    rawReasons: Record<string, any>,
    authorViolationCounts: Map<string, number>,
  ) {
    const fullExcerpt = post
      ? this.extractPostText({
          title: post.title,
          excerpt: post.excerpt,
          contentBlocks: post.contentBlocks,
        }).slice(0, 320)
      : '';
    const author: {
      id: string;
      username: string;
      email: string;
      status: string;
      role: string;
    } | null = post?.author ?? null;

    return {
      id: report.id,
      targetType: ReportTargetType.POST,
      targetId: report.targetId,
      source: report.source,
      riskLevel: report.riskLevel,
      aiConfidence: report.aiConfidence,
      actionTaken: report.actionTaken,
      categories: Array.isArray(rawReasons.categories)
        ? rawReasons.categories
        : report.source === ReportSource.USER_REPORT
          ? ['USER_FLAGGED']
          : ['NONE'],
      reasonText:
        rawReasons.violationReasonVi ||
        rawReasons.userReason ||
        'Báo cáo nội dung cần kiểm duyệt viên xem xét.',
      matchedExcerpt: rawReasons.matchedExcerpt || post?.excerpt || fullExcerpt,
      engine:
        rawReasons.engine ||
        (report.source === ReportSource.AI_SCAN ? 'HYBRID_SENTINEL' : 'USER'),
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

  private buildCommentReportItem(
    report: any,
    comment: any,
    rawReasons: Record<string, any>,
    authorViolationCounts: Map<string, number>,
  ) {
    const author: {
      id: string;
      username: string;
      email: string;
      status: string;
      role: string;
    } | null = comment?.author ?? null;

    return {
      id: report.id,
      targetType: ReportTargetType.COMMENT,
      targetId: report.targetId,
      source: report.source,
      riskLevel: report.riskLevel,
      aiConfidence: report.aiConfidence,
      actionTaken: report.actionTaken,
      categories: Array.isArray(rawReasons.categories)
        ? rawReasons.categories
        : report.source === ReportSource.USER_REPORT
          ? ['USER_FLAGGED']
          : ['NONE'],
      reasonText:
        rawReasons.violationReasonVi ||
        rawReasons.userReason ||
        'Báo cáo bình luận cần kiểm duyệt viên xem xét.',
      matchedExcerpt: rawReasons.matchedExcerpt || comment?.content || '',
      engine:
        rawReasons.engine ||
        (report.source === ReportSource.AI_SCAN ? 'HYBRID_SENTINEL' : 'USER'),
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
  }

  private matchesModerationTab(
    actionTaken: string,
    source: string,
    tab?: string,
  ): boolean {
    switch (tab) {
      case ModerationTab.PENDING:
        return (
          actionTaken === ReportActionTaken.NONE ||
          actionTaken === ReportActionTaken.AUTO_HIDDEN
        );
      case ModerationTab.AUTO_HIDDEN:
        return actionTaken === ReportActionTaken.AUTO_HIDDEN;
      case ModerationTab.USER_REPORT:
        return source === ReportSource.USER_REPORT;
      case ModerationTab.REMOVED:
        return actionTaken === ReportActionTaken.CONFIRMED_REMOVED;
      case ModerationTab.DISMISSED:
        return actionTaken === ReportActionTaken.DISMISSED;
      default:
        return true;
    }
  }

  private matchesModerationSearch(item: any, search?: string): boolean {
    if (!search?.trim()) return true;
    const q = search.trim().toLowerCase();
    const inTitle = (item.target?.title || '').toLowerCase().includes(q);
    const inExcerpt = (item.matchedExcerpt || '').toLowerCase().includes(q);
    const inReason = (item.reasonText || '').toLowerCase().includes(q);
    const inAuthor = (item.target?.author?.username || '')
      .toLowerCase()
      .includes(q);
    return inTitle || inExcerpt || inReason || inAuthor;
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
    notifyAuthor: boolean = false,
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
      // Bác báo cáo trên bài nháp / chờ duyệt không được xuất bản nó, chỉ hiện lại bài đã bị gỡ.
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
          data: {
            status: PostCommentStatus.VISIBLE,
            deletedAt: null,
          },
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

  /** Ẩn bình luận và giảm số bình luận của bài cùng lúc (không để số đếm lệch). */
  private async hideComment(comment: { id: string; postId: string }) {
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

  private async handleBanUser(targetAuthorId: string): Promise<string | null> {
    const author = await this.prisma.authUser.findUnique({
      where: { id: targetAuthorId },
      select: { id: true, role: true },
    });
    if (author && !PROTECTED_FROM_BAN.has(author.role)) {
      await this.prisma.authUser.update({
        where: { id: author.id },
        data: {
          status: userStatus.BLOCKED,
          tokenVersion: { increment: 1 },
        },
      });
      return author.id;
    }
    return null;
  }
}
