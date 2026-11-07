import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { BlogGateway } from './blog.gateway';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blogGateway: BlogGateway,
  ) {}

  async getComments(postId: string) {
    await this.ensurePostExists(postId);

    const comments = await this.prisma.articleComment.findMany({
      where: {
        articleId: postId,
        deletedAt: null,
        parentId: null,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { id: true, username: true },
        },
        replies: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });

    return comments.map((comment) => this.mapComment(comment));
  }

  async createComment(postId: string, dto: CreateCommentDto) {
    await this.ensurePostExists(postId);
    await this.ensureUserExists(dto.authorId);

    if (dto.parentId) {
      const parent = await this.prisma.articleComment.findFirst({
        where: {
          id: dto.parentId,
          articleId: postId,
          deletedAt: null,
        },
      });

      if (!parent) {
        throw new NotFoundException('Phản hồi cha không tồn tại');
      }
    }

    const comment = await this.prisma.articleComment.create({
      data: {
        articleId: postId,
        authorId: dto.authorId,
        parentId: dto.parentId ?? null,
        content: dto.content.trim(),
        status: 'VISIBLE',
      },
      include: {
        author: { select: { id: true, username: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, username: true } } },
        },
      },
    });

    this.blogGateway.emitCommentAdded(postId, this.mapComment(comment));
    return this.mapComment(comment);
  }

  async updateComment(postId: string, commentId: string, authorId: string, dto: UpdateCommentDto) {
    await this.ensurePostExists(postId);
    await this.ensureUserExists(authorId);

    const comment = await this.prisma.articleComment.findFirst({
      where: {
        id: commentId,
        articleId: postId,
        deletedAt: null,
      },
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
      throw new BadRequestException('Bạn không có quyền sửa bình luận này');
    }

    const updated = await this.prisma.articleComment.update({
      where: { id: commentId },
      data: {
        content: dto.content.trim(),
        status: 'VISIBLE',
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
      comment: this.mapComment(updated),
    });

    return this.mapComment(updated);
  }

  async deleteComment(postId: string, commentId: string, authorId: string) {
    await this.ensurePostExists(postId);
    await this.ensureUserExists(authorId);

    const comment = await this.prisma.articleComment.findFirst({
      where: {
        id: commentId,
        articleId: postId,
        deletedAt: null,
      },
    });

    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại hoặc đã bị xóa');
    }

    if (comment.authorId !== authorId) {
      throw new BadRequestException('Bạn không có quyền xóa bình luận này');
    }

    const deleted = await this.prisma.articleComment.update({
      where: { id: commentId },
      data: {
        deletedAt: new Date(),
        status: 'REMOVED',
      },
    });

    this.blogGateway.emitCommentUpdated(postId, {
      type: 'deleted',
      commentId,
      comment: deleted,
    });

    return {
      success: true,
      commentId,
      postId,
    };
  }

  async likeComment(postId: string, commentId: string, userId: string) {
    await this.ensurePostExists(postId);
    await this.ensureUserExists(userId);

    const comment = await this.prisma.articleComment.findFirst({
      where: {
        id: commentId,
        articleId: postId,
        deletedAt: null,
      },
    });

    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    const updated = await this.prisma.articleComment.update({
      where: { id: commentId },
      data: {
        likeCount: {
          increment: 1,
        },
      },
    });

    this.blogGateway.emitCommentUpdated(postId, {
      type: 'liked',
      commentId,
      likeCount: updated.likeCount,
    });

    return {
      success: true,
      commentId,
      likeCount: updated.likeCount,
    };
  }

  private async ensurePostExists(postId: string) {
    const article = await this.prisma.article.findUnique({ where: { id: postId } });
    if (!article) {
      throw new NotFoundException(`Bài viết ${postId} không tồn tại`);
    }
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.authUser.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Người dùng ${userId} không tồn tại`);
    }
  }

  private mapComment(comment: any) {
    return {
      id: comment.id,
      articleId: comment.articleId ?? null,
      authorId: comment.authorId,
      parentId: comment.parentId ?? null,
      content: comment.deletedAt ? '[Bình luận đã bị xóa]' : (comment.content ?? ''),
      status: comment.status ?? 'VISIBLE',
      likeCount: comment.likeCount ?? 0,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      deletedAt: comment.deletedAt ?? null,
      author: comment.author
        ? {
            id: comment.author.id,
            username: comment.author.username,
          }
        : null,
      replies: Array.isArray(comment.replies)
        ? comment.replies.map((reply: any) => ({
            id: reply.id,
            authorId: reply.authorId,
            parentId: reply.parentId,
            author: reply.author ? { id: reply.author.id, username: reply.author.username } : null,
            content: reply.deletedAt ? '[Bình luận đã bị xóa]' : (reply.content ?? ''),
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt,
            likeCount: reply.likeCount ?? 0,
          }))
        : [],
    };
  }
}
