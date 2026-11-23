import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ContentStatus,
  NotificationType,
  PostType,
  ReportTargetType,
} from '@prisma/client';
import {
  AUTHOR_FOLLOW_EVENTS,
  AuthorPublishedContentType,
  type AuthorPublishedPayload,
} from '../common/constants/follow-events.constant';
import { PrismaService } from '../common/services/prisma.service';
import { toSlug } from '../common/utils/slug.util';
import { ModerationService } from '../moderation/moderation.service';
import { NotificationService } from '../notification/notification.service';
import { BlogCommentService } from './blog-comment.service';
import {
  BlogFollowService,
  type CommunityMemberDirectoryItem,
  type PaginatedCommunityMembersResult,
} from './blog-follow.service';
import { BlogInteractionService } from './blog-interaction.service';
import {
  assertCanModifyBlogPost,
  assertCanSetBlogPublication,
  ensureAuthUserExists,
  mapBlogPost,
  orderBlogPosts,
  sliceBlogPostsByCursor,
} from './blog-mappers.util';
import {
  BLOG_REVIEW_DEFAULT_LIMIT,
  CreateBlogPostDto,
  ListBlogPostsQueryDto,
  ListBlogReviewQueryDto,
  ReviewBlogPostDto,
  UpdateBlogPostDto,
} from './dto/blog-post.dto';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import {
  ListCommunityMembersQueryDto,
  ReportPostDto,
  UpdateCommunityProfileDto,
} from './dto/interact.dto';

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly commentService: BlogCommentService,
    private readonly interactionService: BlogInteractionService,
    private readonly followService: BlogFollowService,
    @Optional()
    private readonly moderationService?: ModerationService,
    @Optional()
    private readonly eventEmitter?: EventEmitter2,
  ) {}

  private emitAuthorBlogPublished(post: {
    authorId?: string | null;
    postType?: PostType;
    status?: ContentStatus;
    title: string;
    slug: string;
  }): void {
    if (
      !this.eventEmitter ||
      !post.authorId ||
      post.status !== ContentStatus.PUBLISHED ||
      post.postType !== PostType.LONG_FORM
    ) {
      return;
    }
    const payload: AuthorPublishedPayload = {
      authorId: post.authorId,
      contentType: AuthorPublishedContentType.BLOG,
      title: post.title,
      slug: post.slug,
    };
    this.eventEmitter.emit(AUTHOR_FOLLOW_EVENTS.CONTENT_PUBLISHED, payload);
  }

  async listPosts(viewerId?: string, query?: ListBlogPostsQueryDto) {
    const where: Record<string, any> = { status: ContentStatus.PUBLISHED };
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
      if (!viewerId) return [];
      const followedRows = await this.prisma.userFollow.findMany({
        where: { followerId: viewerId },
        select: { followingId: true },
      });
      const followedIds = followedRows.map((r) => r.followingId);
      if (followedIds.length === 0) return [];
      where.authorId = { in: followedIds };
    }

    const posts = await this.prisma.blogPost.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        author: {
          select: {
            id: true,
            username: true,
            userProfile: {
              select: {
                bio: true,
                avatarUrl: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: { select: { followers: true } },
          },
        },
      },
    });

    const ordered = orderBlogPosts(posts, query?.sort);
    const sliced = sliceBlogPostsByCursor(ordered, query);

    const postIds = sliced.map((p) => p.id);
    const authorIds = Array.from(
      new Set(
        sliced
          .map((p) => p.author?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const [flags, previewMap, followedAuthorSet] = await Promise.all([
      this.interactionService.getViewerFlags(postIds, viewerId),
      this.commentService.getPreviewComments(postIds),
      this.followService.getFollowedAuthorSet(authorIds, viewerId),
    ]);

    return sliced.map((post) => {
      const mapped = mapBlogPost(post);
      return {
        ...mapped,
        ...flags(post.id),
        author: mapped.author
          ? {
              ...mapped.author,
              followedByMe: followedAuthorSet.has(String(mapped.author.id)),
            }
          : null,
        previewComment: previewMap.get(post.id) ?? null,
      };
    });
  }

  async getPostById(postId: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id: postId },
      include: { author: { select: { id: true, username: true } } },
    });
    if (!post) {
      throw new NotFoundException(`Blog ${postId} không tồn tại`);
    }
    return mapBlogPost(post);
  }

  async getPostBySlug(slug: string, viewerId?: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug },
      include: { author: { select: { id: true, username: true } } },
    });

    const visibleToViewer =
      post?.status === ContentStatus.PUBLISHED ||
      (Boolean(viewerId) && post?.authorId === viewerId);
    if (!post || !visibleToViewer) {
      throw new NotFoundException(`Blog "${slug}" không tồn tại`);
    }

    const flags = await this.interactionService.getViewerFlags(
      [post.id],
      viewerId,
    );
    return { ...mapBlogPost(post), ...flags(post.id) };
  }

  async createPost(
    authorId: string,
    requesterRole: string,
    dto: CreateBlogPostDto,
  ) {
    assertCanSetBlogPublication(
      dto.postType ?? PostType.QUICK_POST,
      dto,
      requesterRole,
    );
    await ensureAuthUserExists(this.prisma, authorId);

    const normalizedSlug = (dto.slug ?? toSlug(dto.title)).trim();
    const existing = await this.prisma.blogPost.findUnique({
      where: { slug: normalizedSlug },
    });
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
      include: { author: { select: { id: true, username: true } } },
    });

    this.moderationService?.enqueueScan(ReportTargetType.POST, post.id);
    this.emitAuthorBlogPublished(post);

    return mapBlogPost(post);
  }

  async updatePost(
    postId: string,
    dto: UpdateBlogPostDto,
    requesterId: string,
    requesterRole: string,
  ) {
    const existing = await this.prisma.blogPost.findUnique({
      where: { id: postId },
    });
    if (!existing) {
      throw new NotFoundException(`Blog ${postId} không tồn tại`);
    }
    assertCanModifyBlogPost(existing.authorId, requesterId, requesterRole);
    assertCanSetBlogPublication(
      dto.postType ?? existing.postType,
      dto,
      requesterRole,
    );

    const nextSlug = dto.slug ? dto.slug.trim() : existing.slug;
    if (dto.slug && dto.slug.trim() !== existing.slug) {
      const duplicate = await this.prisma.blogPost.findUnique({
        where: { slug: nextSlug },
      });
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
        excerpt:
          dto.excerpt !== undefined
            ? (dto.excerpt?.trim() ?? null)
            : existing.excerpt,
        coverImageUrl: dto.coverImageUrl ?? existing.coverImageUrl,
        contentBlocks:
          dto.contentBlocks !== undefined
            ? ((dto.contentBlocks as any) ?? [])
            : existing.contentBlocks,
        status: dto.status ? (dto.status as any) : existing.status,
        isFeatured: dto.isFeatured ?? existing.isFeatured,
        publishedAt:
          dto.publishedAt !== undefined
            ? dto.publishedAt
              ? new Date(dto.publishedAt)
              : null
            : existing.publishedAt,
      },
      include: { author: { select: { id: true, username: true } } },
    });

    this.moderationService?.enqueueScan(ReportTargetType.POST, updated.id);
    return mapBlogPost(updated);
  }

  async listPostsForReview(query: ListBlogReviewQueryDto) {
    const posts = await this.prisma.blogPost.findMany({
      where: query.status ? { status: query.status } : {},
      orderBy: { updatedAt: 'desc' },
      take: query.limit ?? BLOG_REVIEW_DEFAULT_LIMIT,
      include: { author: { select: { id: true, username: true } } },
    });
    return posts.map((post) => mapBlogPost(post));
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
      throw new BadRequestException(
        'Chỉ duyệt được bài viết đang ở trạng thái chờ duyệt (PENDING_REVIEW).',
      );
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
      include: { author: { select: { id: true, username: true } } },
    });

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

    this.emitAuthorBlogPublished(updated);
    return mapBlogPost(updated);
  }

  async deletePost(postId: string, requesterId: string, requesterRole: string) {
    const existing = await this.prisma.blogPost.findUnique({
      where: { id: postId },
    });
    if (!existing) {
      throw new NotFoundException(`Blog ${postId} không tồn tại`);
    }
    assertCanModifyBlogPost(existing.authorId, requesterId, requesterRole);

    await this.prisma.blogPost.delete({ where: { id: postId } });
    return { success: true, id: postId };
  }

  getComments(postId: string) {
    return this.commentService.getComments(postId);
  }

  createComment(postId: string, dto: CreateCommentDto, authorId: string) {
    return this.commentService.createComment(postId, dto, authorId);
  }

  updateComment(
    postId: string,
    commentId: string,
    authorId: string,
    dto: UpdateCommentDto,
  ) {
    return this.commentService.updateComment(postId, commentId, authorId, dto);
  }

  deleteComment(postId: string, commentId: string, authorId: string) {
    return this.commentService.deleteComment(postId, commentId, authorId);
  }

  likeComment(postId: string, commentId: string, userId: string) {
    return this.commentService.likeComment(postId, commentId, userId);
  }

  listMyBookmarks(userId: string) {
    return this.interactionService.listMyBookmarks(userId);
  }

  toggleLike(postId: string, userId: string) {
    return this.interactionService.toggleLike(postId, userId);
  }

  toggleBookmark(postId: string, userId: string) {
    return this.interactionService.toggleBookmark(postId, userId);
  }

  reportPost(postId: string, reporterId: string, dto: ReportPostDto) {
    return this.interactionService.reportPost(postId, reporterId, dto);
  }

  incrementViewCount(postId: string, viewerKey: string) {
    return this.interactionService.incrementViewCount(postId, viewerKey);
  }

  getFollowStatus(identifier: string, viewerId?: string) {
    return this.followService.getFollowStatus(identifier, viewerId);
  }

  toggleFollow(followerId: string, targetIdentifier: string) {
    return this.followService.toggleFollow(followerId, targetIdentifier);
  }

  getSuggestedMembers(
    viewerId?: string,
    limit = 6,
  ): Promise<CommunityMemberDirectoryItem[]> {
    return this.followService.getSuggestedMembers(viewerId, limit);
  }

  listCommunityMembers(
    viewerId: string | undefined,
    query: ListCommunityMembersQueryDto,
  ): Promise<PaginatedCommunityMembersResult> {
    return this.followService.listCommunityMembers(viewerId, query);
  }

  getCommunityProfile(identifier: string, viewerId?: string) {
    return this.followService.getCommunityProfile(identifier, viewerId);
  }

  updateMyCommunityProfile(userId: string, dto: UpdateCommunityProfileDto) {
    return this.followService.updateMyCommunityProfile(userId, dto);
  }
}
