import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import {
  ContentStatus,
  NotificationType,
  PostCommentStatus,
  ReportActionTaken,
  ReportRiskLevel,
  ReportSource,
  ReportTargetType,
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
import { ModerationReportService } from './moderation-report.service';
import { ModerationResolutionService } from './moderation-resolution.service';
import { extractModerationPostText } from './moderation-text.util';
import { MODERATION_QUEUE, MODERATION_SCAN_JOB } from './moderation.constant';

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
    private readonly reportService: ModerationReportService,
    private readonly resolutionService: ModerationResolutionService,
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

  listReports(query: ListModerationReportsQueryDto) {
    return this.reportService.listReports(query);
  }

  resolveReport(
    reportId: string,
    reviewerId: string,
    dto: ResolveModerationReportDto,
  ) {
    return this.resolutionService.resolveReport(reportId, reviewerId, dto);
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

    const fullText = extractModerationPostText(post);
    const assessment = await this.aiService.evaluateContent(fullText);
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

    if (isAutoHide && post.status !== ContentStatus.REJECTED) {
      await this.prisma.blogPost.update({
        where: { id: post.id },
        data: { status: ContentStatus.REJECTED },
      });
    }

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

    return { assessment, reportId: report.id, actionTaken };
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
      await this.resolutionService.hideComment(comment);
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

    return { assessment, reportId: report.id, actionTaken };
  }
}
