import { ConflictException, Injectable } from '@nestjs/common';
import {
  NotificationType,
  ReportActionTaken,
  ReportRiskLevel,
  ReportSource,
  ReportTargetType,
} from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { NotificationService } from '../notification/notification.service';
import { BlogGateway } from './blog.gateway';
import { ensureBlogPostExists, mapBlogPost } from './blog-mappers.util';
import { ReportPostDto } from './dto/interact.dto';

const VIEW_DEDUPE_TTL_SECONDS = 3600;

@Injectable()
export class BlogInteractionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blogGateway: BlogGateway,
    private readonly notificationService: NotificationService,
    private readonly redis: RedisService,
  ) {}

  async getViewerFlags(postIds: string[], viewerId?: string) {
    if (!viewerId || postIds.length === 0) {
      return () => ({ likedByMe: false, bookmarkedByMe: false });
    }

    const [likes, bookmarks] = await Promise.all([
      this.prisma.postLike.findMany({
        where: { userId: viewerId, postId: { in: postIds } },
        select: { postId: true },
      }),
      this.prisma.postBookmark.findMany({
        where: { userId: viewerId, postId: { in: postIds } },
        select: { postId: true },
      }),
    ]);

    const liked = new Set(likes.map((l) => l.postId));
    const saved = new Set(bookmarks.map((b) => b.postId));
    return (id: string) => ({
      likedByMe: liked.has(id),
      bookmarkedByMe: saved.has(id),
    });
  }

  async listMyBookmarks(userId: string) {
    const rows = await this.prisma.postBookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        post: { include: { author: { select: { id: true, username: true } } } },
      },
    });

    const flags = await this.getViewerFlags(
      rows.map((r) => r.postId),
      userId,
    );
    return rows.map((r) => ({ ...mapBlogPost(r.post), ...flags(r.postId) }));
  }

  async toggleLike(
    postId: string,
    userId: string,
  ): Promise<{ liked: boolean; likeCount: number }> {
    await ensureBlogPostExists(this.prisma, postId);

    const result = await this.prisma.$transaction(async (tx) => {
      const removed = await tx.postLike.deleteMany({
        where: { postId, userId },
      });

      if (removed.count > 0) {
        const post = await tx.blogPost.update({
          where: { id: postId },
          data: { likeCount: { decrement: removed.count } },
          select: { likeCount: true },
        });
        return { liked: false, likeCount: post.likeCount };
      }

      await tx.postLike.create({ data: { postId, userId } });
      const post = await tx.blogPost.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      });
      return { liked: true, likeCount: post.likeCount };
    });

    const likeCount = Math.max(0, result.likeCount);
    this.blogGateway.emitLikeUpdated(postId, likeCount);

    if (result.liked) {
      void this.notifyPostLiked(postId, userId);
    }

    return { liked: result.liked, likeCount };
  }

  async toggleBookmark(
    postId: string,
    userId: string,
  ): Promise<{ bookmarked: boolean }> {
    await ensureBlogPostExists(this.prisma, postId);

    const removed = await this.prisma.postBookmark.deleteMany({
      where: { postId, userId },
    });
    if (removed.count > 0) {
      return { bookmarked: false };
    }

    await this.prisma.postBookmark.create({ data: { postId, userId } });
    return { bookmarked: true };
  }

  async reportPost(
    postId: string,
    reporterId: string,
    dto: ReportPostDto,
  ): Promise<{ success: boolean; reportId: string }> {
    await ensureBlogPostExists(this.prisma, postId);

    const duplicate = await this.prisma.contentReport.findFirst({
      where: {
        targetType: ReportTargetType.POST,
        targetId: postId,
        reporterId,
        source: ReportSource.USER_REPORT,
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException('Bạn đã báo cáo bài viết này rồi');
    }

    const report = await this.prisma.contentReport.create({
      data: {
        targetType: ReportTargetType.POST,
        targetId: postId,
        reporterId,
        source: ReportSource.USER_REPORT,
        riskLevel: ReportRiskLevel.LOW,
        actionTaken: ReportActionTaken.NONE,
        aiReasons: dto.reason ? { userReason: dto.reason } : undefined,
      },
    });

    this.blogGateway.emitModerationEvent({
      type: 'report-created',
      reportId: report.id,
      targetId: postId,
    });

    return { success: true, reportId: report.id };
  }

  async incrementViewCount(postId: string, viewerKey: string): Promise<void> {
    try {
      const isNew = await this.redis.setNX(
        `view:${postId}:${viewerKey}`,
        1,
        VIEW_DEDUPE_TTL_SECONDS,
      );
      if (!isNew) return;

      await this.prisma.blogPost.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } },
      });
    } catch {
      // Không làm gián đoạn response khi view count lỗi
    }
  }

  private async notifyPostLiked(postId: string, userId: string): Promise<void> {
    try {
      const [post, liker] = await Promise.all([
        this.prisma.blogPost.findUnique({
          where: { id: postId },
          select: { authorId: true, title: true, slug: true },
        }),
        this.prisma.authUser.findUnique({
          where: { id: userId },
          select: { username: true },
        }),
      ]);
      if (post?.authorId && post.authorId !== userId) {
        await this.notificationService.notify(
          post.authorId,
          NotificationType.POST_LIKED,
          'Bài viết nhận được lượt thích mới',
          `${liker?.username || 'Một thành viên'} đã bày tỏ yêu thích bài viết "${post.title}" của bạn.`,
          `/blog/${post.slug}`,
        );
      }
    } catch {
      // Không chặn phản hồi like nếu lỗi gửi thông báo
    }
  }
}
