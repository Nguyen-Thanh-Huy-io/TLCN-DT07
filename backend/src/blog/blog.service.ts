import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PostStatus, PostType } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { BlogGateway } from './blog.gateway';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly blogGateway: BlogGateway,
  ) {}

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 300);
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.authUser.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} không tồn tại`);
    }
  }

  private async ensurePostExists(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.deletedAt) {
      throw new NotFoundException(`Bài viết ${postId} không tồn tại`);
    }

    return post;
  }

  async createPost(authorId: string, dto: CreatePostDto) {
    await this.ensureUserExists(authorId);

    const title = dto.title.trim();
    const baseSlug = dto.slug ? dto.slug.trim() : this.slugify(title);
    const slug = baseSlug || this.slugify(`post-${Date.now()}`);

    const existing = await this.prisma.post.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`Slug "${slug}" đã tồn tại`);
    }

    const post = await this.prisma.post.create({
      data: {
        authorId,
        title,
        slug,
        type: dto.type ?? PostType.BLOG,
        status: dto.status ?? PostStatus.DRAFT,
        summary: dto.summary,
        content: dto.content ?? [],
        contentRichText: dto.contentRichText,
        thumbnailUrl: dto.thumbnailUrl,
        coverImageUrl: dto.coverImageUrl,
      },
      include: {
        author: {
          select: { id: true, username: true },
        },
      },
    });

    return post;
  }

  async findAllPosts(query: QueryPostDto = {}) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const search = query.search?.trim();

    const where: Prisma.PostWhereInput = {
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          author: { select: { id: true, username: true } },
          _count: {
            select: {
              comments: true,
              reactions: true,
              bookmarks: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPostById(postId: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      include: {
        author: { select: { id: true, username: true } },
        media: true,
        postTags: { include: { tag: true } },
        historicalLinks: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
            bookmarks: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Bài viết ${postId} không tồn tại`);
    }

    return post;
  }

  async findPostBySlug(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      include: {
        author: { select: { id: true, username: true } },
        media: true,
        postTags: { include: { tag: true } },
        _count: {
          select: {
            comments: true,
            reactions: true,
            bookmarks: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Bài viết với slug ${slug} không tồn tại`);
    }

    return post;
  }

  async updatePost(postId: string, dto: UpdatePostDto) {
    const existing = await this.ensurePostExists(postId);

    if (dto.title && dto.title.trim() !== existing.title) {
      const newTitle = dto.title.trim();
      if (!newTitle) {
        throw new BadRequestException('Tiêu đề không được để trống');
      }
    }

    const nextSlug = dto.slug ? dto.slug.trim() : existing.slug;
    if (dto.slug && nextSlug !== existing.slug) {
      const duplicate = await this.prisma.post.findUnique({ where: { slug: nextSlug } });
      if (duplicate && duplicate.id !== postId) {
        throw new ConflictException(`Slug "${nextSlug}" đã tồn tại`);
      }
    }

    const updateData: Prisma.PostUpdateInput = {
      ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
      ...(dto.slug !== undefined ? { slug: nextSlug } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
      ...(dto.content !== undefined ? { content: dto.content as Prisma.InputJsonValue } : {}),
      ...(dto.contentRichText !== undefined ? { contentRichText: dto.contentRichText } : {}),
      ...(dto.thumbnailUrl !== undefined ? { thumbnailUrl: dto.thumbnailUrl } : {}),
      ...(dto.coverImageUrl !== undefined ? { coverImageUrl: dto.coverImageUrl } : {}),
    };

    return this.prisma.post.update({
      where: { id: postId },
      data: updateData,
      include: {
        author: { select: { id: true, username: true } },
      },
    });
  }

  async submitForReview(postId: string) {
    const post = await this.ensurePostExists(postId);

    if (post.status === PostStatus.PUBLISHED) {
      return post;
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.PENDING_REVIEW,
      },
    });
  }

  async reviewPost(postId: string, reviewerId: string, status: 'PUBLISHED' | 'REJECTED', reviewNote?: string) {
    await this.ensureUserExists(reviewerId);
    const post = await this.ensurePostExists(postId);

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: {
        reviewerId,
        reviewNote: reviewNote ?? null,
        reviewedAt: new Date(),
        rejectionReason: status === 'REJECTED' ? reviewNote ?? null : null,
        status,
        publishedAt: status === 'PUBLISHED' ? new Date() : post.publishedAt,
      },
    });

    this.blogGateway.emitPostModerated(postId, {
      postId,
      status,
      reviewerId,
      reviewNote,
      post: updatedPost,
    });

    return updatedPost;
  }

  async removePost(postId: string) {
    await this.ensurePostExists(postId);

    await this.prisma.post.update({
      where: { id: postId },
      data: {
        deletedAt: new Date(),
        status: PostStatus.REMOVED,
      },
    });

    return { message: 'Bài viết đã được xóa mềm thành công' };
  }

  async toggleLikePost(postId: string, userId: string) {
    await this.ensureUserExists(userId);
    await this.ensurePostExists(postId);

    const existing = await this.prisma.postReaction.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existing) {
      await this.prisma.$transaction(async (tx) => {
        await tx.postReaction.delete({
          where: {
            postId_userId: {
              postId,
              userId,
            },
          },
        });

        await tx.post.update({
          where: { id: postId },
          data: {
            likeCount: { decrement: 1 },
          },
        });
      });

      return { liked: false, postId, userId };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.postReaction.create({
        data: {
          postId,
          userId,
        },
      });

      const updatedPost = await tx.post.update({
        where: { id: postId },
        data: {
          likeCount: { increment: 1 },
        },
      });

      return updatedPost;
    });

    this.blogGateway.emitPostLiked(postId, {
      postId,
      userId,
      liked: true,
      likeCount: result.likeCount,
    });

    return { liked: true, postId, userId };
  }

  async toggleBookmarkPost(postId: string, userId: string) {
    await this.ensureUserExists(userId);
    await this.ensurePostExists(postId);

    const existing = await this.prisma.postBookmark.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existing) {
      await this.prisma.$transaction(async (tx) => {
        await tx.postBookmark.delete({
          where: {
            postId_userId: {
              postId,
              userId,
            },
          },
        });

        await tx.post.update({
          where: { id: postId },
          data: {
            bookmarkCount: { decrement: 1 },
          },
        });
      });

      return { bookmarked: false, postId, userId };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.postBookmark.create({
        data: {
          postId,
          userId,
        },
      });

      const updatedPost = await tx.post.update({
        where: { id: postId },
        data: {
          bookmarkCount: { increment: 1 },
        },
      });

      return updatedPost;
    });

    this.blogGateway.emitPostLiked(postId, {
      postId,
      userId,
      bookmarked: true,
      bookmarkCount: result.bookmarkCount,
      type: 'bookmark',
    });

    return { bookmarked: true, postId, userId };
  }

  async createComment(postId: string, authorId: string, dto: CreateCommentDto) {
    await this.ensureUserExists(authorId);
    await this.ensurePostExists(postId);

    if (dto.parentId) {
      const parent = await this.prisma.postComment.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent || parent.postId !== postId) {
        throw new BadRequestException('Comment cha không hợp lệ');
      }

      if (parent.parentId !== null) {
        throw new BadRequestException('Chỉ cho phép reply tối đa 2 cấp');
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const createdComment = await tx.postComment.create({
        data: {
          postId,
          authorId,
          parentId: dto.parentId ?? null,
          content: dto.content.trim(),
          status: 'VISIBLE',
        },
        include: {
          author: { select: { id: true, username: true } },
          parent: true,
        },
      });

      await tx.post.update({
        where: { id: postId },
        data: {
          commentCount: { increment: 1 },
        },
      });

      return createdComment;
    });

    this.blogGateway.emitCommentAdded(postId, {
      postId,
      comment: created,
    });

    return created;
  }

  async updateComment(postId: string, commentId: string, authorId: string, dto: { content: string }) {
    await this.ensureUserExists(authorId);
    await this.ensurePostExists(postId);

    const comment = await this.prisma.postComment.findFirst({
      where: {
        id: commentId,
        postId,
        deletedAt: null,
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment ${commentId} không tồn tại hoặc đã bị xóa`);
    }

    if (comment.authorId !== authorId) {
      throw new BadRequestException('Bạn không có quyền chỉnh sửa comment này');
    }

    const nextContent = dto.content?.trim();
    if (!nextContent) {
      throw new BadRequestException('Nội dung comment không được để trống');
    }

    const updated = await this.prisma.postComment.update({
      where: { id: commentId },
      data: {
        content: nextContent,
        status: 'VISIBLE',
      },
      include: {
        author: { select: { id: true, username: true } },
      },
    });

    this.blogGateway.emitCommentUpdated(postId, {
      type: 'updated',
      commentId,
      comment: updated,
    });

    return updated;
  }

  async deleteComment(postId: string, commentId: string, authorId: string) {
    await this.ensureUserExists(authorId);
    await this.ensurePostExists(postId);

    const comment = await this.prisma.postComment.findFirst({
      where: {
        id: commentId,
        postId,
        deletedAt: null,
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment ${commentId} không tồn tại hoặc đã bị xóa`);
    }

    if (comment.authorId !== authorId) {
      throw new BadRequestException('Bạn không có quyền xóa comment này');
    }

    const deleted = await this.prisma.$transaction(async (tx) => {
      const updatedComment = await tx.postComment.update({
        where: { id: commentId },
        data: {
          deletedAt: new Date(),
          status: 'REMOVED',
        },
      });

      await tx.post.update({
        where: { id: postId },
        data: {
          commentCount: { decrement: 1 },
        },
      });

      return updatedComment;
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

  async toggleCommentLike(postId: string, commentId: string, userId: string) {
    await this.ensureUserExists(userId);
    await this.ensurePostExists(postId);

    const comment = await this.prisma.postComment.findFirst({
      where: {
        id: commentId,
        postId,
        deletedAt: null,
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment ${commentId} không tồn tại hoặc đã bị xóa`);
    }

    const existing = await this.prisma.commentReaction.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    let liked = true;
    let nextLikeCount = comment.likeCount;

    if (existing) {
      await this.prisma.commentReaction.delete({
        where: {
          commentId_userId: {
            commentId,
            userId,
          },
        },
      });
      await this.prisma.postComment.update({
        where: { id: commentId },
        data: {
          likeCount: { decrement: 1 },
        },
      });
      liked = false;
      nextLikeCount = Math.max(comment.likeCount - 1, 0);
    } else {
      await this.prisma.commentReaction.create({
        data: {
          commentId,
          userId,
        },
      });
      await this.prisma.postComment.update({
        where: { id: commentId },
        data: {
          likeCount: { increment: 1 },
        },
      });
      nextLikeCount = comment.likeCount + 1;
    }

    this.blogGateway.emitCommentUpdated(postId, {
      type: 'liked',
      commentId,
      userId,
      liked,
      likeCount: nextLikeCount,
    });

    return {
      commentId,
      userId,
      liked,
      likeCount: nextLikeCount,
    };
  }

  async getComments(postId: string) {
    await this.ensurePostExists(postId);

    return this.prisma.postComment.findMany({
      where: {
        postId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, username: true } },
        replies: {
          where: {
            deletedAt: null,
          },
          include: {
            author: { select: { id: true, username: true } },
          },
        },
      },
    });
  }

  async clearCache() {
    await this.redis.set('blog:cache:clear', Date.now(), 1);
  }
}
