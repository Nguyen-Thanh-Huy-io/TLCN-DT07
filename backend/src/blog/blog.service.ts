import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { ROLE_GROUPS } from '../common/access/access.constant';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { ModerationService } from '../moderation/moderation.service';
import { NotificationService } from '../notification/notification.service';
import { BlogGateway } from './blog.gateway';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import {
  CreateBlogPostDto,
  ListBlogPostsQueryDto,
  ReviewBlogPostDto,
  UpdateBlogPostDto,
} from './dto/blog-post.dto';
import { ReportPostDto, UpdateCommunityProfileDto } from './dto/interact.dto';

const VIEW_DEDUPE_TTL_SECONDS = 3600;
const DEFAULT_PAGE_LIMIT = 12;

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blogGateway: BlogGateway,
    private readonly notificationService: NotificationService,
    private readonly redis: RedisService,
    @Optional()
    @Inject(forwardRef(() => ModerationService))
    private readonly moderationService?: ModerationService,
  ) {}

  async listPosts(viewerId?: string, query?: ListBlogPostsQueryDto) {
    const where: Record<string, any> = {};
    if (query?.type === 'QUICK_POST' || query?.type === 'LONG_FORM') {
      where.postType = query.type;
    }

    if (query?.author?.trim()) {
      const authorFilter = query.author.trim();
      where.OR = [
        { authorId: authorFilter },
        { author: { username: { equals: authorFilter, mode: 'insensitive' } } },
      ];
    }

    if (query?.followingOnly === 'true') {
      if (!viewerId) {
        return [];
      }
      const followedRows = await this.prisma.userFollow.findMany({
        where: { followerId: viewerId },
        select: { followingId: true },
      });
      const followedIds = followedRows.map((r) => r.followingId);
      if (followedIds.length === 0) {
        return [];
      }
      where.authorId = { in: followedIds };
    }

    const posts = await this.prisma.blogPost.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: {
          select: {
            id: true,
            username: true,
            userProfile: { select: { bio: true, avatarUrl: true, firstName: true, lastName: true } },
            _count: { select: { followers: true } },
          },
        },
      },
    });

    let ordered = posts;
    if (query?.sort === 'trending') {
      const now = Date.now();
      const computeTrendingScore = (post: any) => {
        const engagement =
          (post.likeCount ?? 0) * 2 +
          (post.commentCount ?? 0) * 3 +
          (post.viewCount ?? 0) * 0.1;
        const ts = new Date(post.publishedAt ?? post.createdAt).getTime();
        const ageDays = Math.max(0, (now - ts) / 86_400_000);
        // Giảm dần theo thời gian (time decay): bài sôi nổi gần đây ưu tiên hơn bài quá cũ
        return engagement / Math.pow(ageDays + 1, 0.5) - ageDays * 0.05;
      };

      ordered = [...posts].sort((a, b) => computeTrendingScore(b) - computeTrendingScore(a));
    }

    let sliced = ordered;
    const hasPagination = Boolean(query?.cursor || query?.limit);
    if (hasPagination) {
      const limit = Math.min(Math.max(Number(query?.limit) || DEFAULT_PAGE_LIMIT, 1), 50);
      let startIndex = 0;
      if (query?.cursor) {
        const cursorIdx = ordered.findIndex((p) => p.id === query.cursor);
        startIndex = cursorIdx >= 0 ? cursorIdx + 1 : ordered.length;
      }
      sliced = ordered.slice(startIndex, startIndex + limit);
    }

    const postIds = sliced.map((p) => p.id);
    const authorIds = Array.from(
      new Set(sliced.map((p) => p.author?.id).filter((id): id is string => Boolean(id))),
    );
    const [flags, previewMap, followedAuthorSet] = await Promise.all([
      this.getViewerFlags(postIds, viewerId),
      this.getPreviewComments(postIds),
      this.getFollowedAuthorSet(authorIds, viewerId),
    ]);
    return sliced.map((post) => {
      const mapped = this.mapPost(post);
      return {
        ...mapped,
        ...flags(post.id),
        author: mapped.author
          ? {
              ...mapped.author,
              followedByMe: followedAuthorSet.has(mapped.author.id),
            }
          : null,
        previewComment: previewMap.get(post.id) ?? null,
      };
    });
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

  async getPostBySlug(slug: string, viewerId?: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug },
      include: {
        author: { select: { id: true, username: true } },
      },
    });

    if (!post) {
      throw new NotFoundException(`Blog "${slug}" không tồn tại`);
    }

    const flags = await this.getViewerFlags([post.id], viewerId);
    return { ...this.mapPost(post), ...flags(post.id) };
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

    const nextStatus = (dto.status ?? 'DRAFT') as any;
    const post = await this.prisma.blogPost.create({
      data: {
        authorId,
        postType: (dto.postType ?? 'QUICK_POST') as any,
        title: dto.title.trim(),
        slug: normalizedSlug,
        excerpt: dto.excerpt?.trim() ?? null,
        coverImageUrl: dto.coverImageUrl ?? null,
        contentBlocks: (dto.contentBlocks as any) ?? [],
        status: nextStatus,
        isFeatured: dto.isFeatured ?? false,
        publishedAt: dto.publishedAt
          ? new Date(dto.publishedAt)
          : nextStatus === 'PUBLISHED'
            ? new Date()
            : null,
      },
      include: {
        author: { select: { id: true, username: true } },
      },
    });

    // Đẩy job kiểm duyệt tự động bằng AI Sentinel (xử lý ngầm không chặn phản hồi)
    this.moderationService?.enqueueScan('POST', post.id);

    return this.mapPost(post);
  }

  async updatePost(postId: string, dto: UpdateBlogPostDto, requesterId: string, requesterRole: string) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id: postId } });
    if (!existing) {
      throw new NotFoundException(`Blog ${postId} không tồn tại`);
    }
    this.assertCanModifyPost(existing.authorId, requesterId, requesterRole);

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
        postType: dto.postType ? (dto.postType as any) : existing.postType,
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

    // Quét lại bằng AI Sentinel khi bài viết được chỉnh sửa
    this.moderationService?.enqueueScan('POST', updated.id);

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

  async deletePost(postId: string, requesterId: string, requesterRole: string) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id: postId } });
    if (!existing) {
      throw new NotFoundException(`Blog ${postId} không tồn tại`);
    }
    this.assertCanModifyPost(existing.authorId, requesterId, requesterRole);

    await this.prisma.blogPost.delete({ where: { id: postId } });
    return { success: true, id: postId };
  }

  /** Chỉ tác giả bài viết hoặc biên tập viên (STAFF) mới được sửa/xóa. */
  private assertCanModifyPost(authorId: string, requesterId: string, requesterRole: string): void {
    const isOwner = authorId === requesterId;
    const isStaff = (ROLE_GROUPS.STAFF as readonly string[]).includes(requesterRole);
    if (!isOwner && !isStaff) {
      throw new ForbiddenException('Bạn không có quyền sửa hoặc xóa bài viết này.');
    }
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

    await this.prisma.blogPost.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    this.blogGateway.emitCommentAdded(postId, this.mapComment(comment));

    // Đẩy job kiểm duyệt tự động bình luận bằng AI Sentinel
    this.moderationService?.enqueueScan('COMMENT', comment.id);

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

    this.moderationService?.enqueueScan('COMMENT', updated.id);

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

    await this.prisma.blogPost.updateMany({
      where: { id: postId, commentCount: { gt: 0 } },
      data: { commentCount: { decrement: 1 } },
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

  // ============================================================
  // Community Interaction Methods
  // ============================================================

  /**
   * Trả về hàm tra cứu likedByMe/bookmarkedByMe cho danh sách bài.
   */
  private async getViewerFlags(postIds: string[], viewerId?: string) {
    if (!viewerId || postIds.length === 0) {
      return (_id: string) => ({ likedByMe: false, bookmarkedByMe: false });
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
    return (id: string) => ({ likedByMe: liked.has(id), bookmarkedByMe: saved.has(id) });
  }

  /**
   * Trả về bản đồ bình luận mới nhất cho mỗi bài viết trên Feed.
   */
  private async getPreviewComments(postIds: string[]) {
    const map = new Map<
      string,
      { id: string; content: string; authorName: string; createdAt: Date }
    >();
    if (postIds.length === 0) {
      return map;
    }

    const comments = await this.prisma.articleComment.findMany({
      where: {
        articleId: { in: postIds },
        deletedAt: null,
        status: 'VISIBLE',
        parentId: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        articleId: true,
        content: true,
        createdAt: true,
        author: { select: { username: true } },
      },
      take: postIds.length * 2,
    });

    for (const c of comments) {
      if (!map.has(c.articleId)) {
        map.set(c.articleId, {
          id: c.id,
          content: c.content,
          authorName: c.author?.username || 'Thành viên HISGO',
          createdAt: c.createdAt,
        });
      }
    }

    return map;
  }

  /** Danh sách bài viết người dùng đã lưu (mới nhất trước) */
  async listMyBookmarks(userId: string) {
    const rows = await this.prisma.postBookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        post: { include: { author: { select: { id: true, username: true } } } },
      },
    });

    const flags = await this.getViewerFlags(rows.map((r) => r.postId), userId);
    return rows.map((r) => ({ ...this.mapPost(r.post), ...flags(r.postId) }));
  }

  /**
   * Toggle like trên bài viết.
   * - Nếu chưa like → tạo PostLike + tăng likeCount
   * - Nếu đã like → xóa PostLike + giảm likeCount
   */
  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    await this.ensurePostExists(postId);

    // Transaction: tạo/xóa PostLike + cập nhật counter nguyên tử
    const result = await this.prisma.$transaction(async (tx) => {
      const removed = await tx.postLike.deleteMany({ where: { postId, userId } });

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

    // Gửi thông báo POST_LIKED tới tác giả bài viết khi có thành viên khác yêu thích
    if (result.liked) {
      void (async () => {
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
          if (post && post.authorId && post.authorId !== userId) {
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
      })();
    }

    return { liked: result.liked, likeCount };
  }

  /**
   * Toggle bookmark trên bài viết.
   * - Nếu chưa bookmark → tạo PostBookmark
   * - Nếu đã bookmark → xóa PostBookmark
   */
  async toggleBookmark(postId: string, userId: string): Promise<{ bookmarked: boolean }> {
    await this.ensurePostExists(postId);

    const removed = await this.prisma.postBookmark.deleteMany({ where: { postId, userId } });
    if (removed.count > 0) {
      return { bookmarked: false };
    }

    await this.prisma.postBookmark.create({ data: { postId, userId } });
    return { bookmarked: true };
  }

  /**
   * Tạo báo cáo vi phạm từ người dùng (source = USER_REPORT).
   * AI Moderation sẽ tạo report với source = AI_SCAN ở Giai đoạn 3.
   */
  async reportPost(
    postId: string,
    reporterId: string,
    dto: ReportPostDto,
  ): Promise<{ success: boolean; reportId: string }> {
    await this.ensurePostExists(postId);

    // Mỗi user chỉ báo cáo 1 bài 1 lần
    const duplicate = await this.prisma.contentReport.findFirst({
      where: { targetType: 'POST', targetId: postId, reporterId, source: 'USER_REPORT' },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException('Bạn đã báo cáo bài viết này rồi');
    }

    const report = await this.prisma.contentReport.create({
      data: {
        targetType: 'POST',
        targetId: postId,
        reporterId,
        source: 'USER_REPORT',
        riskLevel: 'LOW',
        actionTaken: 'NONE',
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

  /**
   * Tăng viewCount — fire-and-forget, không throw nếu lỗi.
   */
  async incrementViewCount(postId: string, viewerKey: string): Promise<void> {
    try {
      // Chống trùng: mỗi viewer chỉ được tính 1 view / bài / giờ
      const isNew = await this.redis.setNX(`view:${postId}:${viewerKey}`, 1, VIEW_DEDUPE_TTL_SECONDS);
      if (!isNew) {
        return;
      }

      await this.prisma.blogPost.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } },
      });
    } catch {
      // Không làm gián đoạn response khi view count lỗi
    }
  }

  // ============================================================
  // Community Follow & Member Profile Methods
  // ============================================================

  private async getFollowedAuthorSet(authorIds: string[], viewerId?: string): Promise<Set<string>> {
    if (!viewerId || authorIds.length === 0) {
      return new Set<string>();
    }
    const rows = await this.prisma.userFollow.findMany({
      where: {
        followerId: viewerId,
        followingId: { in: authorIds },
      },
      select: { followingId: true },
    });
    return new Set(rows.map((r) => r.followingId));
  }

  private async resolveUserByIdentifier(identifier: string) {
    const clean = decodeURIComponent(identifier || '').trim();
    if (!clean) {
      throw new NotFoundException('Không tìm thấy tài khoản thành viên');
    }

    const user = await this.prisma.authUser.findFirst({
      where: {
        OR: [{ id: clean }, { username: { equals: clean, mode: 'insensitive' } }],
      },
      include: {
        userProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Thành viên "${clean}" không tồn tại`);
    }
    return user;
  }

  /**
   * Toggle theo dõi / bỏ theo dõi một tài khoản trên Cộng đồng HISGO.
   */
  async toggleFollow(followerId: string, targetIdentifier: string) {
    const [follower, targetUser] = await Promise.all([
      this.prisma.authUser.findUnique({
        where: { id: followerId },
        select: { id: true, username: true },
      }),
      this.resolveUserByIdentifier(targetIdentifier),
    ]);

    if (!follower) {
      throw new NotFoundException('Tài khoản người dùng không hợp lệ');
    }

    if (follower.id === targetUser.id) {
      throw new BadRequestException('Bạn không thể tự theo dõi tài khoản của chính mình');
    }

    const removed = await this.prisma.userFollow.deleteMany({
      where: {
        followerId: follower.id,
        followingId: targetUser.id,
      },
    });

    let following = false;
    if (removed.count === 0) {
      await this.prisma.userFollow.create({
        data: {
          followerId: follower.id,
          followingId: targetUser.id,
        },
      });
      following = true;
    }

    const followerCount = await this.prisma.userFollow.count({
      where: { followingId: targetUser.id },
    });

    this.blogGateway.emitFollowUpdated(targetUser.id, followerCount);

    if (following) {
      void (async () => {
        try {
          await this.notificationService.notify(
            targetUser.id,
            NotificationType.NEW_FOLLOWER,
            'Có thành viên mới theo dõi bạn',
            `${follower.username} đã bắt đầu theo dõi các bài thảo luận lịch sử của bạn trên Cộng đồng HISGO.`,
            `/cong-dong/thanh-vien/${encodeURIComponent(follower.username)}`,
          );
        } catch {
          // Không làm gián đoạn phản hồi follow nếu thông báo lỗi
        }
      })();
    }

    return {
      following,
      followerCount,
      targetUserId: targetUser.id,
      targetUsername: targetUser.username,
    };
  }

  /**
   * Danh sách thành viên đóng góp tích cực trên Cộng đồng để gợi ý theo dõi.
   */
  async getSuggestedMembers(viewerId?: string, limit = 6) {
    const users = await this.prisma.authUser.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        userProfile: true,
        blogPosts: {
          where: { status: 'PUBLISHED' },
          select: { id: true, likeCount: true, commentCount: true, viewCount: true },
        },
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
      take: 30,
    });

    const followedSet = await this.getFollowedAuthorSet(
      users.map((u) => u.id),
      viewerId,
    );

    const mapped = users
      .map((u) => {
        const postCount = u.blogPosts.length;
        const totalLikesReceived = u.blogPosts.reduce((sum, p) => sum + (p.likeCount ?? 0), 0);
        const totalCommentsReceived = u.blogPosts.reduce(
          (sum, p) => sum + (p.commentCount ?? 0),
          0,
        );
        const followerCount = u._count.followers;
        const followingCount = u._count.following;
        const displayName =
          [u.userProfile?.firstName, u.userProfile?.lastName].filter(Boolean).join(' ').trim() ||
          u.username;

        const score = postCount * 5 + followerCount * 3 + totalLikesReceived;
        return {
          id: u.id,
          username: u.username,
          displayName,
          role: u.role,
          bio: u.userProfile?.bio ?? null,
          avatarUrl: u.userProfile?.avatarUrl ?? null,
          postCount,
          followerCount,
          followingCount,
          totalLikesReceived,
          totalCommentsReceived,
          followedByMe: followedSet.has(u.id),
          isMe: viewerId === u.id,
          _score: score,
        };
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, Math.min(Math.max(Number(limit) || 6, 1), 20))
      .map(({ _score, ...rest }) => rest);

    return mapped;
  }

  /**
   * Lấy hồ sơ chi tiết của một thành viên trên Cộng đồng (theo username hoặc id).
   */
  async getCommunityProfile(identifier: string, viewerId?: string) {
    const user = await this.resolveUserByIdentifier(identifier);

    const [posts, followerRows, followingRows] = await Promise.all([
      this.prisma.blogPost.findMany({
        where: {
          authorId: user.id,
          status: 'PUBLISHED',
        },
        orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          author: {
            select: {
              id: true,
              username: true,
              userProfile: { select: { bio: true, avatarUrl: true, firstName: true, lastName: true } },
              _count: { select: { followers: true } },
            },
          },
        },
      }),
      this.prisma.userFollow.findMany({
        where: { followingId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              role: true,
              userProfile: { select: { bio: true, avatarUrl: true, firstName: true, lastName: true } },
              _count: {
                select: {
                  blogPosts: { where: { status: 'PUBLISHED' } },
                  followers: true,
                  following: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.userFollow.findMany({
        where: { followerId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              role: true,
              userProfile: { select: { bio: true, avatarUrl: true, firstName: true, lastName: true } },
              _count: {
                select: {
                  blogPosts: { where: { status: 'PUBLISHED' } },
                  followers: true,
                  following: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const relatedUserIds = Array.from(
      new Set([
        user.id,
        ...followerRows.map((r) => r.follower.id),
        ...followingRows.map((r) => r.following.id),
      ]),
    );

    const postIds = posts.map((p) => p.id);
    const [flags, previewMap, followedUserSet] = await Promise.all([
      this.getViewerFlags(postIds, viewerId),
      this.getPreviewComments(postIds),
      this.getFollowedAuthorSet(relatedUserIds, viewerId),
    ]);

    const mappedPosts = posts.map((post) => {
      const base = this.mapPost(post);
      return {
        ...base,
        ...flags(post.id),
        author: base.author
          ? {
              ...base.author,
              followedByMe: followedUserSet.has(base.author.id),
            }
          : null,
        previewComment: previewMap.get(post.id) ?? null,
      };
    });

    // Tính toán thống kê đóng góp từ chính danh sách bài viết để đảm bảo khớp 100%
    const postCount = mappedPosts.length;
    let sharedBlogCount = 0;
    let totalLikesReceived = 0;
    let totalCommentsReceived = 0;
    let totalViewsReceived = 0;
    const topicCounts = new Map<string, number>();

    for (const p of mappedPosts) {
      totalLikesReceived += p.likeCount ?? 0;
      totalCommentsReceived += p.commentCount ?? 0;
      totalViewsReceived += p.viewCount ?? 0;

      if (Array.isArray(p.contentBlocks)) {
        for (const raw of p.contentBlocks) {
          if (!raw || typeof raw !== 'object') continue;
          const block = raw as Record<string, any>;
          if (block.type === 'meta' || block.kind === 'metadata') {
            const meta = (block.metadata && typeof block.metadata === 'object'
              ? block.metadata
              : block) as Record<string, any>;
            if (meta.sharedBlog && typeof meta.sharedBlog === 'object' && meta.sharedBlog.slug) {
              sharedBlogCount += 1;
            }
            if (Array.isArray(meta.tags)) {
              for (const t of meta.tags) {
                const tagStr = (typeof t === 'string' ? t : t?.name || '').trim().replace(/^#/, '');
                if (tagStr) {
                  topicCounts.set(tagStr, (topicCounts.get(tagStr) || 0) + 1);
                }
              }
            }
          }
        }
      }
    }

    const topTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }));

    const mapMemberCard = (member: any, followedAt: Date) => ({
      id: member.id,
      username: member.username,
      displayName:
        [member.userProfile?.firstName, member.userProfile?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim() || member.username,
      role: member.role,
      bio: member.userProfile?.bio ?? null,
      avatarUrl: member.userProfile?.avatarUrl ?? null,
      postCount: member._count?.blogPosts ?? 0,
      followerCount: member._count?.followers ?? 0,
      followingCount: member._count?.following ?? 0,
      followedByMe: followedUserSet.has(member.id),
      isMe: viewerId === member.id,
      followedAt,
    });

    const followers = followerRows.map((r) => mapMemberCard(r.follower, r.createdAt));
    const following = followingRows.map((r) => mapMemberCard(r.following, r.createdAt));

    const isMe = Boolean(viewerId && viewerId === user.id);
    const bookmarkedPosts = isMe ? await this.listMyBookmarks(user.id) : [];

    const displayName =
      [user.userProfile?.firstName, user.userProfile?.lastName].filter(Boolean).join(' ').trim() ||
      user.username;

    return {
      user: {
        id: user.id,
        username: user.username,
        displayName,
        firstName: user.userProfile?.firstName ?? null,
        lastName: user.userProfile?.lastName ?? null,
        role: user.role,
        bio: user.userProfile?.bio ?? null,
        avatarUrl: user.userProfile?.avatarUrl ?? null,
        joinedAt: user.createdAt,
      },
      stats: {
        postCount,
        sharedBlogCount,
        questionPostCount: Math.max(0, postCount - sharedBlogCount),
        followerCount: followers.length,
        followingCount: following.length,
        totalLikesReceived,
        totalCommentsReceived,
        totalViewsReceived,
      },
      topTopics,
      followedByMe: followedUserSet.has(user.id),
      isMe,
      posts: mappedPosts,
      bookmarkedPosts,
      followers,
      following,
    };
  }

  /**
   * Cập nhật thông tin hồ sơ cá nhân trên Cộng đồng của người dùng đang đăng nhập.
   */
  async updateMyCommunityProfile(userId: string, dto: UpdateCommunityProfileDto) {
    await this.ensureUserExists(userId);

    await this.prisma.userProfile.upsert({
      where: { authId: userId },
      create: {
        authId: userId,
        firstName: dto.firstName?.trim() ?? null,
        lastName: dto.lastName?.trim() ?? null,
        bio: dto.bio?.trim() ?? null,
        avatarUrl: dto.avatarUrl?.trim() ?? null,
      },
      update: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName.trim() || null } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName.trim() || null } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio.trim() || null } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl.trim() || null } : {}),
      },
    });

    return this.getCommunityProfile(userId, userId);
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
      postType: post.postType ?? 'QUICK_POST',
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? null,
      coverImageUrl: post.coverImageUrl ?? null,
      contentBlocks: post.contentBlocks ?? [],
      status: post.status,
      isFeatured: post.isFeatured ?? false,
      likeCount: post.likeCount ?? 0,
      commentCount: post.commentCount ?? 0,
      viewCount: post.viewCount ?? 0,
      publishedAt: post.publishedAt ?? null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author
        ? {
            id: post.author.id,
            username: post.author.username,
            bio: post.author.userProfile?.bio ?? null,
            avatarUrl: post.author.userProfile?.avatarUrl ?? null,
            followerCount: post.author._count?.followers ?? 0,
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
