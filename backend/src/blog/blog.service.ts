import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { BlogGateway } from './blog.gateway';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { CreateBlogPostDto, ReviewBlogPostDto, UpdateBlogPostDto } from './dto/blog-post.dto';

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blogGateway: BlogGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async listPosts() {
    const posts = await this.prisma.blogPost.findMany({
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: { select: { id: true, username: true } },
      },
    });

    return posts.map((post) => this.mapPost(post));
  }

  async getPostById(postId: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, username: true } },
      },
    });

    if (!post) {
      throw new NotFoundException(`Blog ${postId} không tồn tại`);
    }

    return this.mapPost(post);
  }

  async getPostBySlug(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug },
      include: {
        author: { select: { id: true, username: true } },
      },
    });

    if (!post) {
      throw new NotFoundException(`Blog "${slug}" không tồn tại`);
    }

    return this.mapPost(post);
  }

  async createPost(dto: CreateBlogPostDto) {
    const authorId = dto.authorId;
    if (!authorId) {
      throw new BadRequestException('Thiếu authorId để tạo blog');
    }

    await this.ensureUserExists(authorId);

    const normalizedSlug = (dto.slug ?? this.slugify(dto.title)).trim();
    const existing = await this.prisma.blogPost.findUnique({ where: { slug: normalizedSlug } });
    if (existing) {
      throw new BadRequestException(`Slug blog "${normalizedSlug}" đã tồn tại`);
    }

    const post = await this.prisma.blogPost.create({
      data: {
        authorId,
        title: dto.title.trim(),
        slug: normalizedSlug,
        excerpt: dto.excerpt?.trim() ?? null,
        coverImageUrl: dto.coverImageUrl ?? null,
        contentBlocks: (dto.contentBlocks as any) ?? [],
        status: (dto.status ?? 'DRAFT') as any,
        isFeatured: dto.isFeatured ?? false,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
      },
      include: {
        author: { select: { id: true, username: true } },
      },
    });

    return this.mapPost(post);
  }

  async updatePost(postId: string, dto: UpdateBlogPostDto) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id: postId } });
    if (!existing) {
      throw new NotFoundException(`Blog ${postId} không tồn tại`);
    }

    const nextSlug = dto.slug ? dto.slug.trim() : existing.slug;
    if (dto.slug && dto.slug.trim() !== existing.slug) {
      const duplicate = await this.prisma.blogPost.findUnique({ where: { slug: nextSlug } });
      if (duplicate && duplicate.id !== postId) {
        throw new BadRequestException(`Slug blog "${nextSlug}" đã tồn tại`);
      }
    }

    const updated = await this.prisma.blogPost.update({
      where: { id: postId },
      data: {
        title: dto.title?.trim() ?? existing.title,
        slug: nextSlug,
        excerpt: dto.excerpt !== undefined ? (dto.excerpt?.trim() ?? null) : existing.excerpt,
        coverImageUrl: dto.coverImageUrl ?? existing.coverImageUrl,
        contentBlocks:
          dto.contentBlocks !== undefined
            ? ((dto.contentBlocks as any) ?? [])
            : existing.contentBlocks,
        status: dto.status ? (dto.status as any) : existing.status,
        isFeatured: dto.isFeatured ?? existing.isFeatured,
        publishedAt: dto.publishedAt !== undefined ? (dto.publishedAt ? new Date(dto.publishedAt) : null) : existing.publishedAt,
      },
      include: {
        author: { select: { id: true, username: true } },
      },
    });

    return this.mapPost(updated);
  }

  async reviewPost(postId: string, dto: ReviewBlogPostDto) {
    const current = await this.prisma.blogPost.findUnique({
      where: { id: postId },
      select: { id: true, status: true },
    });

    if (!current) {
      throw new NotFoundException(`Blog ${postId} không tồn tại`);
    }

    if (current.status !== 'PENDING_REVIEW') {
      throw new BadRequestException('Chỉ duyệt được bài viết đang ở trạng thái chờ duyệt (PENDING_REVIEW).');
    }

    if (dto.status === 'REJECTED' && !dto.rejectionReason?.trim()) {
      throw new BadRequestException('Vui lòng nhập lý do từ chối bài viết.');
    }

    const updated = await this.prisma.blogPost.update({
      where: { id: postId },
      data: {
        status: dto.status,
        publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
      },
      include: {
        author: { select: { id: true, username: true } },
      },
    });

    // Gửi thông báo kết quả duyệt bài viết tới tác giả
    if (updated.authorId) {
      try {
        if (dto.status === 'PUBLISHED') {
          await this.notificationService.notify(
            updated.authorId,
            NotificationType.CONTENT_APPROVED,
            'Bài viết đã được duyệt xuất bản',
            `Chúc mừng! Bài viết "${updated.title}" của bạn đã được kiểm duyệt và xuất bản công khai.`,
            `/blog/${updated.slug}`,
          );
        } else if (dto.status === 'REJECTED') {
          await this.notificationService.notify(
            updated.authorId,
            NotificationType.CONTENT_REJECTED,
            'Bài viết chưa được duyệt',
            `Bài viết "${updated.title}" của bạn chưa được duyệt. Lý do: ${dto.rejectionReason?.trim() || 'Chưa đạt yêu cầu'}`,
            `/blog/${updated.slug}`,
          );
        }
      } catch {
        // Tránh gián đoạn luồng duyệt bài nếu gửi thông báo lỗi
      }
    }

    return this.mapPost(updated);
  }

  async deletePost(postId: string) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id: postId } });
    if (!existing) {
      throw new NotFoundException(`Blog ${postId} không tồn tại`);
    }

    await this.prisma.blogPost.delete({ where: { id: postId } });
    return { success: true, id: postId };
  }

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

    // Gửi thông báo đến tác giả bài viết và người được phản hồi
    try {
      const post = await this.prisma.blogPost.findUnique({
        where: { id: postId },
        select: { authorId: true, title: true, slug: true },
      });

      // 1. Thông báo cho tác giả bài viết nếu người bình luận không phải là tác giả
      if (post && post.authorId && post.authorId !== dto.authorId) {
        await this.notificationService.notify(
          post.authorId,
          NotificationType.BLOG_COMMENT,
          'Bình luận mới trên bài viết',
          `${comment.author?.username || 'Một độc giả'} đã bình luận vào bài viết "${post.title}".`,
          `/blog/${post.slug}`,
        );
      }

      // 2. Nếu là phản hồi (reply), thông báo cho người viết bình luận cha
      if (dto.parentId) {
        const parentComment = await this.prisma.articleComment.findUnique({
          where: { id: dto.parentId },
          select: { authorId: true },
        });

        if (
          parentComment &&
          parentComment.authorId &&
          parentComment.authorId !== dto.authorId &&
          parentComment.authorId !== post?.authorId
        ) {
          await this.notificationService.notify(
            parentComment.authorId,
            NotificationType.NEW_REPLY,
            'Có phản hồi cho bình luận của bạn',
            `${comment.author?.username || 'Ai đó'} đã trả lời bình luận của bạn trên bài viết "${post?.title || ''}".`,
            `/blog/${post?.slug || postId}`,
          );
        }
      }
    } catch {
      // Tránh gián đoạn phản hồi API bình luận nếu gửi thông báo lỗi
    }

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
    const post = await this.prisma.blogPost.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Bài viết ${postId} không tồn tại`);
    }
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.authUser.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Người dùng ${userId} không tồn tại`);
    }
  }

  private mapPost(post: any) {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? null,
      coverImageUrl: post.coverImageUrl ?? null,
      contentBlocks: post.contentBlocks ?? [],
      status: post.status,
      isFeatured: post.isFeatured ?? false,
      publishedAt: post.publishedAt ?? null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author
        ? {
            id: post.author.id,
            username: post.author.username,
          }
        : null,
    };
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
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
