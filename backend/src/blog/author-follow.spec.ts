import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { ContentStatus, PostType } from '@prisma/client';
import {
  AUTHOR_FOLLOW_EVENTS,
  AuthorPublishedContentType,
} from '../common/constants/follow-events.constant';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { NotificationService } from '../notification/notification.service';
import { BlogGateway } from './blog.gateway';
import { BlogCommentService } from './blog-comment.service';
import { BlogFollowService } from './blog-follow.service';
import { BlogInteractionService } from './blog-interaction.service';
import { BlogService } from './blog.service';

describe('BlogService — Follow tác giả & hồ sơ tác phẩm biên soạn', () => {
  let service: BlogService;
  const prisma = {
    authUser: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    userProfile: { upsert: jest.fn() },
    userFollow: { count: jest.fn(), findMany: jest.fn() },
    blogPost: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    postBookmark: { findMany: jest.fn() },
    postLike: { findMany: jest.fn() },
    article: { findMany: jest.fn() },
    lesson: { findMany: jest.fn() },
  };
  const eventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        BlogService,
        BlogCommentService,
        BlogInteractionService,
        BlogFollowService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: BlogGateway,
          useValue: { emitFollowUpdated: jest.fn() },
        },
        { provide: NotificationService, useValue: { notify: jest.fn() } },
        { provide: RedisService, useValue: { get: jest.fn(), set: jest.fn() } },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = moduleRef.get(BlogService);
  });

  it('trả về trạng thái theo dõi nhẹ qua getFollowStatus (đã đăng nhập & đang follow)', async () => {
    prisma.authUser.findFirst.mockResolvedValue({
      id: 'author-1',
      username: 'su_gia',
      userProfile: null,
    });
    prisma.userFollow.count.mockResolvedValue(12);
    prisma.userFollow.findMany.mockResolvedValue([{ id: 'follow-1' }]);

    const status = await service.getFollowStatus('su_gia', 'reader-1');

    expect(status).toEqual({
      targetUserId: 'author-1',
      targetUsername: 'su_gia',
      followerCount: 12,
      following: true,
      isMe: false,
    });
  });

  it('getFollowStatus đánh dấu isMe=true và không truy vấn bảng userFollow cho bản thân', async () => {
    prisma.authUser.findFirst.mockResolvedValue({
      id: 'author-1',
      username: 'su_gia',
      userProfile: null,
    });
    prisma.userFollow.count.mockResolvedValue(8);

    const status = await service.getFollowStatus('author-1', 'author-1');

    expect(status).toEqual({
      targetUserId: 'author-1',
      targetUsername: 'su_gia',
      followerCount: 8,
      following: false,
      isMe: true,
    });
    expect(prisma.userFollow.findMany).not.toHaveBeenCalled();
  });

  it('getFollowStatus báo NotFoundException khi tác giả không tồn tại', async () => {
    prisma.authUser.findFirst.mockResolvedValue(null);

    await expect(
      service.getFollowStatus('khong-ton-tai', 'reader-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('getCommunityProfile trả thêm bài viết & bài học đã xuất bản của tác giả', async () => {
    prisma.authUser.findFirst.mockResolvedValue({
      id: 'author-1',
      username: 'su_gia',
      role: 'MODERATOR',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      userProfile: {
        firstName: 'An',
        lastName: 'Nguyễn',
        bio: 'Biên tập viên sử học',
        avatarUrl: null,
      },
    });
    prisma.blogPost.findMany.mockResolvedValue([]);
    prisma.userFollow.findMany.mockResolvedValue([]);
    prisma.article.findMany.mockResolvedValue([
      {
        id: 'art-1',
        title: 'Chiến thắng Bạch Đằng',
        slug: 'chien-thang-bach-dang',
        summary: 'Tóm tắt chiến thắng',
        coverImageUrl: null,
        dateText: '938',
        publishedAt: new Date('2026-11-10T00:00:00Z'),
        updatedAt: new Date('2026-11-10T00:00:00Z'),
        category: { name: 'Sự kiện' },
      },
    ]);
    prisma.lesson.findMany.mockResolvedValue([
      {
        id: 'les-1',
        title: 'Bài học Ngô Quyền',
        slug: 'bai-hoc-ngo-quyen',
        description: 'Mô tả bài học',
        thumbnailUrl: null,
        publishedAt: new Date('2026-11-12T00:00:00Z'),
        updatedAt: new Date('2026-11-12T00:00:00Z'),
        topic: { name: 'Thời kỳ độc lập' },
      },
    ]);

    const profile = await service.getCommunityProfile('su_gia', 'reader-1');

    expect(profile.publishedArticles).toHaveLength(1);
    expect(profile.publishedArticles[0].categoryName).toBe('Sự kiện');
    expect(profile.publishedLessons).toHaveLength(1);
    expect(profile.publishedLessons[0].topicName).toBe('Thời kỳ độc lập');
    expect(profile.stats.publishedArticlesCount).toBe(1);
    expect(profile.stats.publishedLessonsCount).toBe(1);
  });

  it('phát sự kiện AUTHOR_FOLLOW_EVENTS.CONTENT_PUBLISHED khi duyệt xuất bản Blog LONG_FORM', async () => {
    prisma.blogPost.findUnique.mockResolvedValue({
      id: 'blog-1',
      status: ContentStatus.PENDING_REVIEW,
    });
    prisma.blogPost.update.mockResolvedValue({
      id: 'blog-1',
      authorId: 'author-1',
      postType: PostType.LONG_FORM,
      status: ContentStatus.PUBLISHED,
      title: 'Khảo cứu Triều Trần',
      slug: 'khao-cuu-trieu-tran',
      contentBlocks: [],
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      author: { id: 'author-1', username: 'su_gia' },
    });

    await service.reviewPost('blog-1', { status: ContentStatus.PUBLISHED });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      AUTHOR_FOLLOW_EVENTS.CONTENT_PUBLISHED,
      {
        authorId: 'author-1',
        contentType: AuthorPublishedContentType.BLOG,
        title: 'Khảo cứu Triều Trần',
        slug: 'khao-cuu-trieu-tran',
      },
    );
  });

  it('getSuggestedMembers xếp hạng tác giả theo điểm tương tác + follower và giới hạn số lượng', async () => {
    prisma.authUser.findMany.mockResolvedValue([
      {
        id: 'u-low',
        username: 'thap',
        role: 'USER',
        userProfile: null,
        blogPosts: [],
        _count: { followers: 1, following: 0 },
      },
      {
        id: 'u-top',
        username: 'cao',
        role: 'MODERATOR',
        userProfile: {
          firstName: 'Minh',
          lastName: 'Trần',
          bio: 'Sử học',
          avatarUrl: null,
        },
        blogPosts: [
          { id: 'p1', likeCount: 10, commentCount: 2, viewCount: 50 },
        ],
        _count: { followers: 5, following: 2 },
      },
    ]);
    prisma.userFollow.findMany.mockResolvedValue([{ followingId: 'u-top' }]);

    const list = await service.getSuggestedMembers('viewer-1', 1);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('u-top');
    expect(list[0].followedByMe).toBe(true);
    expect(list[0].displayName).toBe('Minh Trần');
  });

  it('updateMyCommunityProfile cập nhật hồ sơ cộng đồng và trả về hồ sơ mới', async () => {
    prisma.authUser.findUnique.mockResolvedValue({ id: 'u-1' });
    prisma.authUser.findFirst.mockResolvedValue({
      id: 'u-1',
      username: 'su_gia',
      role: 'USER',
      createdAt: new Date(),
      userProfile: {
        firstName: 'An',
        lastName: 'Lê',
        bio: 'Tiểu sử mới',
        avatarUrl: null,
      },
      _count: { followers: 0, following: 0 },
    });
    prisma.blogPost.findMany.mockResolvedValue([]);
    prisma.postBookmark.findMany.mockResolvedValue([]);
    prisma.userFollow.findMany.mockResolvedValue([]);
    prisma.article.findMany.mockResolvedValue([]);
    prisma.lesson.findMany.mockResolvedValue([]);

    const profile = await service.updateMyCommunityProfile('u-1', {
      firstName: ' An ',
      lastName: ' Lê ',
      bio: ' Tiểu sử mới ',
    });
    expect(prisma.userProfile.upsert).toHaveBeenCalled();
    expect(profile.user.bio).toBe('Tiểu sử mới');
  });
});
