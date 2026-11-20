import { Injectable } from '@nestjs/common';
import {
  ContentStatus,
  ReportActionTaken,
  ReportSource,
  ReportTargetType,
} from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import {
  REVISION_KIND,
  REVISION_STATUS,
} from '../content-revision/content-revision.constant';
import { loadAuthorNames } from '../common/utils/author-names';
import {
  REVIEW_QUEUE_ITEMS_PER_TYPE,
  ReviewQueueType,
} from './dashboard.constant';
import {
  ReviewQueueItemDto,
  ReviewQueueResponseDto,
} from './dto/review-queue.dto';

/** Báo cáo chưa xử lý xong: chưa ai xem, hoặc AI đã tạm ẩn và chờ người xác nhận (giống tab PENDING). */
const OPEN_REPORT_ACTIONS = [
  ReportActionTaken.NONE,
  ReportActionTaken.AUTO_HIDDEN,
];
const AI_SUBMITTER = 'AI kiểm duyệt';
const REPORT_TITLE: Record<ReportTargetType, string> = {
  [ReportTargetType.POST]: 'Bài cộng đồng bị báo cáo',
  [ReportTargetType.COMMENT]: 'Bình luận bị báo cáo',
};

const PENDING = ContentStatus.PENDING_REVIEW;
const pendingRevisions = {
  kind: REVISION_KIND.PROPOSAL,
  status: REVISION_STATUS.PENDING,
};
const openReports = { actionTaken: { in: OPEN_REPORT_ACTIONS } };
const oldestFirst = {
  take: REVIEW_QUEUE_ITEMS_PER_TYPE,
  orderBy: { updatedAt: 'asc' as const },
};

/**
 * Hàng chờ duyệt gộp mọi loại (bài học, bài viết, bản sửa, blog, báo cáo) để người duyệt xem một chỗ.
 * Thao tác duyệt vẫn dùng API riêng của từng loại.
 */
@Injectable()
export class ReviewQueueService {
  constructor(private readonly prisma: PrismaService) {}

  /** Số việc chờ duyệt theo loại (tổng thật, không giới hạn). */
  async counts(): Promise<Record<ReviewQueueType, number>> {
    const [revisions, articles, lessons, blogs, reports] = await Promise.all([
      this.prisma.contentRevision.count({ where: pendingRevisions }),
      this.prisma.article.count({ where: { status: PENDING } }),
      this.prisma.lesson.count({ where: { status: PENDING } }),
      this.prisma.blogPost.count({ where: { status: PENDING } }),
      this.prisma.contentReport.count({ where: openReports }),
    ]);
    return {
      [ReviewQueueType.REVISION]: revisions,
      [ReviewQueueType.ARTICLE]: articles,
      [ReviewQueueType.LESSON]: lessons,
      [ReviewQueueType.BLOG]: blogs,
      [ReviewQueueType.REPORT]: reports,
    };
  }

  async getQueue(): Promise<ReviewQueueResponseDto> {
    const titleOnly = { id: true, title: true, updatedAt: true };
    const [counts, revisions, articles, lessons, blogs, reports] =
      await Promise.all([
        this.counts(),
        this.prisma.contentRevision.findMany({
          where: pendingRevisions,
          ...oldestFirst,
          select: { ...titleOnly, authorId: true },
        }),
        this.prisma.article.findMany({
          where: { status: PENDING },
          ...oldestFirst,
          select: { ...titleOnly, createdBy: true },
        }),
        this.prisma.lesson.findMany({
          where: { status: PENDING },
          ...oldestFirst,
          select: { ...titleOnly, createdBy: true },
        }),
        this.prisma.blogPost.findMany({
          where: { status: PENDING },
          ...oldestFirst,
          select: { ...titleOnly, authorId: true },
        }),
        this.prisma.contentReport.findMany({
          where: openReports,
          take: REVIEW_QUEUE_ITEMS_PER_TYPE,
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            targetType: true,
            targetId: true,
            reporterId: true,
            source: true,
            createdAt: true,
          },
        }),
      ]);

    const reportedPostIds = reports
      .filter((r) => r.targetType === ReportTargetType.POST)
      .map((r) => r.targetId);
    const [nameOf, reportedPosts] = await Promise.all([
      loadAuthorNames(this.prisma, [
        ...revisions.map((r) => r.authorId),
        ...articles.map((a) => a.createdBy),
        ...lessons.map((l) => l.createdBy),
        ...blogs.map((b) => b.authorId),
        ...reports.map((r) => r.reporterId),
      ]),
      this.prisma.blogPost.findMany({
        where: { id: { in: reportedPostIds } },
        select: { id: true, title: true },
      }),
    ]);
    const postTitle = new Map(reportedPosts.map((p) => [p.id, p.title]));

    const item = (
      type: ReviewQueueType,
      row: { id: string; title: string; updatedAt: Date },
      authorId: string | null,
    ): ReviewQueueItemDto => ({
      id: row.id,
      type,
      title: row.title,
      submitterName: nameOf(authorId),
      submittedAt: row.updatedAt,
    });

    const items: ReviewQueueItemDto[] = [
      ...revisions.map((r) => item(ReviewQueueType.REVISION, r, r.authorId)),
      ...articles.map((a) => item(ReviewQueueType.ARTICLE, a, a.createdBy)),
      ...lessons.map((l) => item(ReviewQueueType.LESSON, l, l.createdBy)),
      ...blogs.map((b) => item(ReviewQueueType.BLOG, b, b.authorId)),
      ...reports.map((r) => ({
        id: r.id,
        type: ReviewQueueType.REPORT,
        title: postTitle.get(r.targetId) ?? REPORT_TITLE[r.targetType],
        submitterName:
          r.source === ReportSource.AI_SCAN
            ? AI_SUBMITTER
            : nameOf(r.reporterId),
        submittedAt: r.createdAt,
      })),
    ].sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());

    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    return { counts, total, items };
  }
}
