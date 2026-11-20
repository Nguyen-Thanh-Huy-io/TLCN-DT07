import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { BlogGateway } from './blog.gateway';
import { BlogCommentService } from './blog-comment.service';
import { BlogInteractionService } from './blog-interaction.service';
import {
  computeCommunityContributionStats,
  ensureAuthUserExists,
  formatUserDisplayName,
  mapBlogPost,
} from './blog-mappers.util';
import { UpdateCommunityProfileDto } from './dto/interact.dto';

const MEMBER_CARD_USER_SELECT = {
  id: true,
  username: true,
  role: true,
  userProfile: {
    select: {
      bio: true,
      avatarUrl: true,
      firstName: true,
      lastName: true,
    },
  },
  _count: {
    select: {
      blogPosts: { where: { status: 'PUBLISHED' as const } },
      followers: true,
      following: true,
    },
  },
};

@Injectable()
export class BlogFollowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blogGateway: BlogGateway,
    private readonly notificationService: NotificationService,
    private readonly interactionService: BlogInteractionService,
    private readonly commentService: BlogCommentService,
  ) {}

  async getFollowedAuthorSet(
    authorIds: string[],
    viewerId?: string,
  ): Promise<Set<string>> {
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

  async resolveUserByIdentifier(identifier: string) {
    const clean = decodeURIComponent(identifier || '').trim();
    if (!clean) {
      throw new NotFoundException('Không tìm thấy tài khoản thành viên');
    }

    const user = await this.prisma.authUser.findFirst({
      where: {
        OR: [
          { id: clean },
          { username: { equals: clean, mode: 'insensitive' } },
        ],
      },
      include: { userProfile: true },
    });

    if (!user) {
      throw new NotFoundException(`Thành viên "${clean}" không tồn tại`);
    }
    return user;
  }

  async getFollowStatus(identifier: string, viewerId?: string) {
    const targetUser = await this.resolveUserByIdentifier(identifier);
    const isMe = Boolean(viewerId && viewerId === targetUser.id);

    const [followerCount, followRows] = await Promise.all([
      this.prisma.userFollow.count({
        where: { followingId: targetUser.id },
      }),
      viewerId && !isMe
        ? this.prisma.userFollow.findMany({
            where: {
              followerId: viewerId,
              followingId: targetUser.id,
            },
            take: 1,
            select: { id: true },
          })
        : Promise.resolve([]),
    ]);

    return {
      targetUserId: targetUser.id,
      targetUsername: targetUser.username,
      followerCount,
      following: followRows.length > 0,
      isMe,
    };
  }

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
      throw new BadRequestException(
        'Bạn không thể tự theo dõi tài khoản của chính mình',
      );
    }

    const removed = await this.prisma.userFollow.deleteMany({
      where: { followerId: follower.id, followingId: targetUser.id },
    });

    let following = false;
    if (removed.count === 0) {
      await this.prisma.userFollow.create({
        data: { followerId: follower.id, followingId: targetUser.id },
      });
      following = true;
    }

    const followerCount = await this.prisma.userFollow.count({
      where: { followingId: targetUser.id },
    });

    this.blogGateway.emitFollowUpdated(targetUser.id, followerCount);
    if (following) {
      void this.notifyNewFollower(targetUser.id, follower.username);
    }

    return {
      following,
      followerCount,
      targetUserId: targetUser.id,
      targetUsername: targetUser.username,
    };
  }

  async getSuggestedMembers(viewerId?: string, limit = 6) {
    const users = await this.prisma.authUser.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      include: {
        userProfile: true,
        blogPosts: {
          where: { status: 'PUBLISHED' },
          select: {
            id: true,
            likeCount: true,
            commentCount: true,
            viewCount: true,
          },
        },
        _count: { select: { followers: true, following: true } },
      },
      take: 30,
    });

    const followedSet = await this.getFollowedAuthorSet(
      users.map((u) => u.id),
      viewerId,
    );

    return users
      .map((u) => {
        const postCount = u.blogPosts.length;
        const totalLikesReceived = u.blogPosts.reduce(
          (sum, p) => sum + (p.likeCount ?? 0),
          0,
        );
        const totalCommentsReceived = u.blogPosts.reduce(
          (sum, p) => sum + (p.commentCount ?? 0),
          0,
        );
        const followerCount = u._count.followers;
        const score = postCount * 5 + followerCount * 3 + totalLikesReceived;
        return {
          id: u.id,
          username: u.username,
          displayName: formatUserDisplayName(u),
          role: u.role,
          bio: u.userProfile?.bio ?? null,
          avatarUrl: u.userProfile?.avatarUrl ?? null,
          postCount,
          followerCount,
          followingCount: u._count.following,
          totalLikesReceived,
          totalCommentsReceived,
          followedByMe: followedSet.has(u.id),
          isMe: viewerId === u.id,
          _score: score,
        };
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, Math.min(Math.max(Number(limit) || 6, 1), 20))
      .map((item) => {
        const result = { ...item };
        delete (result as { _score?: number })._score;
        return result;
      });
  }

  async getCommunityProfile(identifier: string, viewerId?: string) {
    const user = await this.resolveUserByIdentifier(identifier);

    const [
      posts,
      followerRows,
      followingRows,
      publishedArticleRows,
      publishedLessonRows,
    ] = await Promise.all([
      this.prisma.blogPost.findMany({
        where: { authorId: user.id, status: 'PUBLISHED' },
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
      }),
      this.prisma.userFollow.findMany({
        where: { followingId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { follower: { select: MEMBER_CARD_USER_SELECT } },
      }),
      this.prisma.userFollow.findMany({
        where: { followerId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { following: { select: MEMBER_CARD_USER_SELECT } },
      }),
      this.prisma.article?.findMany
        ? this.prisma.article.findMany({
            where: { createdBy: user.id, status: ContentStatus.PUBLISHED },
            orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
            take: 30,
            select: {
              id: true,
              title: true,
              slug: true,
              summary: true,
              coverImageUrl: true,
              dateText: true,
              publishedAt: true,
              updatedAt: true,
              category: { select: { name: true } },
            },
          })
        : Promise.resolve([]),
      this.prisma.lesson?.findMany
        ? this.prisma.lesson.findMany({
            where: { createdBy: user.id, status: ContentStatus.PUBLISHED },
            orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
            take: 30,
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              thumbnailUrl: true,
              publishedAt: true,
              updatedAt: true,
              topic: { select: { name: true } },
            },
          })
        : Promise.resolve([]),
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
      this.interactionService.getViewerFlags(postIds, viewerId),
      this.commentService.getPreviewComments(postIds),
      this.getFollowedAuthorSet(relatedUserIds, viewerId),
    ]);

    const mappedPosts = posts.map((post) => {
      const base = mapBlogPost(post);
      return {
        ...base,
        ...flags(post.id),
        author: base.author
          ? {
              ...base.author,
              followedByMe: followedUserSet.has(String(base.author.id)),
            }
          : null,
        previewComment: previewMap.get(post.id) ?? null,
      };
    });

    const stats = computeCommunityContributionStats(mappedPosts);
    const toMemberCard = (
      member: {
        id: string;
        username: string;
        role?: string;
        userProfile?: {
          bio?: string | null;
          avatarUrl?: string | null;
          firstName?: string | null;
          lastName?: string | null;
        } | null;
        _count?: {
          blogPosts?: number;
          followers?: number;
          following?: number;
        };
      },
      followedAt: Date,
    ) => ({
      id: member.id,
      username: member.username,
      displayName: formatUserDisplayName(member),
      role: member.role,
      bio: member.userProfile?.bio ?? null,
      avatarUrl: member.userProfile?.avatarUrl ?? null,
      postCount: member._count?.blogPosts ?? 0,
      followerCount: member._count?.followers ?? 0,
      followingCount: member._count?.following ?? 0,
      followedByMe: followedUserSet.has(String(member.id)),
      isMe: viewerId === member.id,
      followedAt,
    });

    const followers = followerRows.map((r) =>
      toMemberCard(r.follower, r.createdAt),
    );
    const following = followingRows.map((r) =>
      toMemberCard(r.following, r.createdAt),
    );
    const isMe = Boolean(viewerId && viewerId === user.id);
    const bookmarkedPosts = isMe
      ? await this.interactionService.listMyBookmarks(user.id)
      : [];

    const publishedArticles = publishedArticleRows.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      summary: a.summary ?? null,
      coverImageUrl: a.coverImageUrl ?? null,
      dateLabel: a.dateText ?? null,
      categoryName: a.category?.name ?? null,
      publishedAt: a.publishedAt ?? null,
      updatedAt: a.updatedAt,
    }));
    const publishedLessons = publishedLessonRows.map((l) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      description: l.description ?? null,
      thumbnailUrl: l.thumbnailUrl ?? null,
      topicName: l.topic?.name ?? null,
      publishedAt: l.publishedAt ?? null,
      updatedAt: l.updatedAt,
    }));

    return {
      user: {
        id: user.id,
        username: user.username,
        displayName: formatUserDisplayName(user),
        firstName: user.userProfile?.firstName ?? null,
        lastName: user.userProfile?.lastName ?? null,
        role: user.role,
        bio: user.userProfile?.bio ?? null,
        avatarUrl: user.userProfile?.avatarUrl ?? null,
        joinedAt: user.createdAt,
      },
      stats: {
        postCount: stats.postCount,
        sharedBlogCount: stats.sharedBlogCount,
        questionPostCount: Math.max(0, stats.postCount - stats.sharedBlogCount),
        publishedArticlesCount: publishedArticles.length,
        publishedLessonsCount: publishedLessons.length,
        followerCount: followers.length,
        followingCount: following.length,
        totalLikesReceived: stats.totalLikesReceived,
        totalCommentsReceived: stats.totalCommentsReceived,
        totalViewsReceived: stats.totalViewsReceived,
      },
      topTopics: stats.topTopics,
      followedByMe: followedUserSet.has(user.id),
      isMe,
      posts: mappedPosts,
      bookmarkedPosts,
      followers,
      following,
      publishedArticles,
      publishedLessons,
    };
  }

  async updateMyCommunityProfile(
    userId: string,
    dto: UpdateCommunityProfileDto,
  ) {
    await ensureAuthUserExists(this.prisma, userId);

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
        ...(dto.firstName !== undefined
          ? { firstName: dto.firstName.trim() || null }
          : {}),
        ...(dto.lastName !== undefined
          ? { lastName: dto.lastName.trim() || null }
          : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio.trim() || null } : {}),
        ...(dto.avatarUrl !== undefined
          ? { avatarUrl: dto.avatarUrl.trim() || null }
          : {}),
      },
    });

    return this.getCommunityProfile(userId, userId);
  }

  private async notifyNewFollower(
    targetUserId: string,
    followerUsername: string,
  ): Promise<void> {
    try {
      await this.notificationService.notify(
        targetUserId,
        NotificationType.NEW_FOLLOWER,
        'Có thành viên mới theo dõi bạn',
        `${followerUsername} đã bắt đầu theo dõi các bài thảo luận lịch sử của bạn trên Cộng đồng HISGO.`,
        `/cong-dong/thanh-vien/${encodeURIComponent(followerUsername)}`,
      );
    } catch {
      // Không làm gián đoạn phản hồi follow nếu thông báo lỗi
    }
  }
}
