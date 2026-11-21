import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  NotificationType,
  PostCommentStatus,
  ReportTargetType,
} from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { NotificationService } from '../notification/notification.service';
import { BlogGateway } from './blog.gateway';
import {
  ensureAuthUserExists,
  ensureBlogPostExists,
  mapBlogComment,
} from './blog-mappers.util';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';

@Injectable()
export class BlogCommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blogGateway: BlogGateway,
    private readonly notificationService: NotificationService,
    @Optional()
    private readonly moderationService?: ModerationService,
  ) {}

  async getComments(postId: string) {
    await ensureBlogPostExists(this.prisma, postId);

    const comments = await this.prisma.blogPostComment.findMany({
      where: {
        postId,
        deletedAt: null,
        parentId: null,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, username: true } },
        replies: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, username: true } },
          },
        },
      },
    });

    return comments.map((comment) => mapBlogComment(comment));
  }

  async createComment(postId: string, dto: CreateCommentDto, authorId: string) {
    await ensureBlogPostExists(this.prisma, postId);
    await ensureAuthUserExists(this.prisma, authorId);

    if (dto.parentId) {
      const parent = await this.prisma.blogPostComment.findFirst({
        where: { id: dto.parentId, postId, deletedAt: null },
      });
      if (!parent) {
        throw new NotFoundException('Phản hồi cha không tồn tại');
      }
    }

    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.blogPostComment.create({
        data: {
          postId,
          authorId,
          parentId: dto.parentId ?? null,
          content: dto.content.trim(),
          status: PostCommentStatus.VISIBLE,
        },
        include: {
          author: { select: { id: true, username: true } },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: { author: { select: { id: true, username: true } } },
          },
        },
      });
      await tx.blogPost.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });
      return created;
    });

    this.blogGateway.emitCommentAdded(postId, mapBlogComment(comment));
    this.moderationService?.enqueueScan(ReportTargetType.COMMENT, comment.id);
    await this.notifyCommentRecipients(
      postId,
      authorId,
      comment.author?.username,
      dto.parentId,
    );

    return mapBlogComment(comment);
  }

  async updateComment(
    postId: string,
    commentId: string,
    authorId: string,
    dto: UpdateCommentDto,
  ) {
    await ensureBlogPostExists(this.prisma, postId);
    await ensureAuthUserExists(this.prisma, authorId);

    const comment = await this.prisma.blogPostComment.findFirst({
      where: { id: commentId, postId, deletedAt: null },
      include: {
        author: { select: { id: true, username: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, username: true } } },
        },
      },
    });
    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại hoặc đã bị xóa');
    }
    if (comment.authorId !== authorId) {
      throw new ForbiddenException('Bạn không có quyền sửa bình luận này');
    }

    const updated = await this.prisma.blogPostComment.update({
      where: { id: commentId },
      data: {
        content: dto.content.trim(),
        status: PostCommentStatus.VISIBLE,
      },
      include: {
        author: { select: { id: true, username: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, username: true } } },
        },
      },
    });

    this.blogGateway.emitCommentUpdated(postId, {
      type: 'updated',
      commentId,
      comment: mapBlogComment(updated),
    });
    this.moderationService?.enqueueScan(ReportTargetType.COMMENT, updated.id);

    return mapBlogComment(updated);
  }

  async deleteComment(postId: string, commentId: string, authorId: string) {
    await ensureBlogPostExists(this.prisma, postId);
    await ensureAuthUserExists(this.prisma, authorId);

    const comment = await this.prisma.blogPostComment.findFirst({
      where: { id: commentId, postId, deletedAt: null },
    });
    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại hoặc đã bị xóa');
    }
    if (comment.authorId !== authorId) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    const deleted = await this.prisma.$transaction(async (tx) => {
      const removed = await tx.blogPostComment.update({
        where: { id: commentId },
        data: { deletedAt: new Date(), status: PostCommentStatus.REMOVED },
      });
      await tx.blogPost.updateMany({
        where: { id: postId, commentCount: { gt: 0 } },
        data: { commentCount: { decrement: 1 } },
      });
      return removed;
    });

    this.blogGateway.emitCommentUpdated(postId, {
      type: 'deleted',
      commentId,
      comment: deleted,
    });

    return { success: true, commentId, postId };
  }

  async likeComment(postId: string, commentId: string, userId: string) {
    await ensureBlogPostExists(this.prisma, postId);
    await ensureAuthUserExists(this.prisma, userId);

    const comment = await this.prisma.blogPostComment.findFirst({
      where: { id: commentId, postId, deletedAt: null },
    });
    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    const existingLike = await this.prisma.postCommentLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    const updatedComment = await this.prisma.$transaction(async (tx) => {
      if (existingLike) {
        await tx.postCommentLike.delete({ where: { id: existingLike.id } });
        return tx.blogPostComment.update({
          where: { id: commentId },
          data: { likeCount: { decrement: 1 } },
        });
      }
      await tx.postCommentLike.create({ data: { commentId, userId } });
      return tx.blogPostComment.update({
        where: { id: commentId },
        data: { likeCount: { increment: 1 } },
      });
    });

    const likeCount = Math.max(0, Number(updatedComment.likeCount) || 0);
    const liked = !existingLike;
    this.blogGateway.emitCommentUpdated(postId, {
      type: 'liked',
      commentId,
      likeCount,
      liked,
    });

    return { success: true, commentId, likeCount, liked };
  }

  async getPreviewComments(postIds: string[]) {
    const map = new Map<
      string,
      { id: string; content: string; authorName: string; createdAt: Date }
    >();
    if (postIds.length === 0) return map;

    const comments = await this.prisma.blogPostComment.findMany({
      where: {
        postId: { in: postIds },
        deletedAt: null,
        status: PostCommentStatus.VISIBLE,
        parentId: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        postId: true,
        content: true,
        createdAt: true,
        author: { select: { username: true } },
      },
      take: postIds.length * 2,
    });

    for (const c of comments) {
      if (!map.has(c.postId)) {
        map.set(c.postId, {
          id: c.id,
          content: c.content,
          authorName: c.author?.username || 'Thành viên HISGO',
          createdAt: c.createdAt,
        });
      }
    }
    return map;
  }

  private async notifyCommentRecipients(
    postId: string,
    authorId: string,
    commentAuthorName?: string,
    parentId?: string,
  ): Promise<void> {
    try {
      const post = await this.prisma.blogPost.findUnique({
        where: { id: postId },
        select: { authorId: true, title: true, slug: true },
      });

      if (post?.authorId && post.authorId !== authorId) {
        await this.notificationService.notify(
          post.authorId,
          NotificationType.BLOG_COMMENT,
          'Bình luận mới trên bài viết',
          `${commentAuthorName || 'Một độc giả'} đã bình luận vào bài viết "${post.title}".`,
          `/blog/${post.slug}`,
        );
      }

      if (!parentId) return;
      const parentComment = await this.prisma.blogPostComment.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      });
      if (
        parentComment?.authorId &&
        parentComment.authorId !== authorId &&
        parentComment.authorId !== post?.authorId
      ) {
        await this.notificationService.notify(
          parentComment.authorId,
          NotificationType.NEW_REPLY,
          'Có phản hồi cho bình luận của bạn',
          `${commentAuthorName || 'Ai đó'} đã trả lời bình luận của bạn trên bài viết "${post?.title || ''}".`,
          `/blog/${post?.slug || postId}`,
        );
      }
    } catch {
      // Tránh gián đoạn phản hồi API bình luận nếu gửi thông báo lỗi
    }
  }
}
