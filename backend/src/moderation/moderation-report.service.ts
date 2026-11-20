import { Injectable } from '@nestjs/common';
import {
  ReportActionTaken,
  ReportSource,
  ReportTargetType,
} from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { ListModerationReportsQueryDto } from './dto/moderation.dto';
import {
  extractModerationPostText,
  matchesModerationSearch,
  matchesModerationTab,
} from './moderation-text.util';

const REPORTER_USER_SELECT = { id: true, username: true, email: true };
const TARGET_AUTHOR_SELECT = {
  id: true,
  username: true,
  email: true,
  status: true,
  role: true,
};

@Injectable()
export class ModerationReportService {
  constructor(private readonly prisma: PrismaService) {}

  async listReports(query: ListModerationReportsQueryDto) {
    const allReports = await this.prisma.contentReport.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: REPORTER_USER_SELECT },
        reviewer: { select: REPORTER_USER_SELECT },
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
      this.loadReportedPosts(postIds),
      this.loadReportedComments(commentIds),
    ]);

    const postMap = new Map(posts.map((p) => [p.id, p] as const));
    const commentMap = new Map(comments.map((c) => [c.id, c] as const));
    const authorViolationCounts = this.countAuthorViolations(
      allReports,
      postMap,
      commentMap,
    );

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

    const stats = this.buildReportStats(enriched);
    const filtered = enriched.filter((item) => {
      if (
        !matchesModerationTab(
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
      return matchesModerationSearch(item, query.search);
    });

    return { stats, items: filtered };
  }

  private countAuthorViolations(
    allReports: Array<{
      actionTaken: string;
      targetType: string;
      targetId: string;
    }>,
    postMap: Map<string, { authorId?: string | null }>,
    commentMap: Map<
      string,
      { authorId?: string | null; userId?: string | null }
    >,
  ): Map<string, number> {
    const counts = new Map<string, number>();
    for (const r of allReports) {
      if (
        r.actionTaken !== ReportActionTaken.AUTO_HIDDEN &&
        r.actionTaken !== ReportActionTaken.CONFIRMED_REMOVED
      ) {
        continue;
      }
      const commentTarget = commentMap.get(r.targetId);
      const targetAuthorId: string | null | undefined =
        r.targetType === ReportTargetType.POST
          ? postMap.get(r.targetId)?.authorId
          : commentTarget?.authorId || commentTarget?.userId;
      if (targetAuthorId) {
        counts.set(targetAuthorId, (counts.get(targetAuthorId) ?? 0) + 1);
      }
    }
    return counts;
  }

  private buildReportStats(enriched: Array<{ actionTaken: any; source: any }>) {
    return {
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
  }

  private buildPostReportItem(
    report: any,
    post: any,
    rawReasons: Record<string, any>,
    authorViolationCounts: Map<string, number>,
  ) {
    const fullExcerpt = post
      ? extractModerationPostText({
          title: post.title,
          excerpt: post.excerpt,
          contentBlocks: post.contentBlocks,
        }).slice(0, 320)
      : '';
    const author = (post?.author ?? null) as Record<string, any> | null;

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
                  violationCount:
                    authorViolationCounts.get(String(author.id)) ?? 0,
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
    const author = (comment?.author ?? null) as Record<string, any> | null;

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
                  violationCount:
                    authorViolationCounts.get(String(author.id)) ?? 0,
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

  private async loadReportedPosts(postIds: string[]) {
    if (postIds.length === 0) return [];
    return this.prisma.blogPost.findMany({
      where: { id: { in: postIds } },
      include: { author: { select: TARGET_AUTHOR_SELECT } },
    });
  }

  private async loadReportedComments(commentIds: string[]) {
    if (commentIds.length === 0) return [];
    return this.prisma.blogPostComment.findMany({
      where: { id: { in: commentIds } },
      include: { author: { select: TARGET_AUTHOR_SELECT } },
    });
  }
}
