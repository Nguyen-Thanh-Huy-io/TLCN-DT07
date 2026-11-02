import { Test, TestingModule } from '@nestjs/testing';
import { BlogService } from './blog.service';
import { BlogGateway } from './blog.gateway';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';

describe('BlogService', () => {
  let service: BlogService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      post: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      postComment: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      postReaction: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      postBookmark: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      commentReaction: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
      authUser: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        {
          provide: BlogGateway,
          useValue: {
            emitCommentAdded: jest.fn(),
            emitCommentUpdated: jest.fn(),
            emitPostLiked: jest.fn(),
            emitPostModerated: jest.fn(),
          },
        },
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: { get: jest.fn(), set: jest.fn() } },
      ],
    }).compile();

    service = module.get<BlogService>(BlogService);
  });

  it('should create a draft post with generated slug', async () => {
    prisma.authUser.findUnique.mockResolvedValue({ id: 'user-1' });
    prisma.post.findUnique.mockResolvedValue(null);
    prisma.post.create.mockResolvedValue({
      id: 'post-1',
      title: 'Bài viết đầu tiên',
      slug: 'bai-viet-dau-tien',
      type: 'BLOG',
      status: 'DRAFT',
      authorId: 'user-1',
      content: [],
    });

    const result = await service.createPost('user-1', {
      title: 'Bài viết đầu tiên',
      type: 'BLOG',
      summary: 'Tóm tắt',
      content: [],
    });

    expect(result.slug).toBe('bai-viet-dau-tien');
    expect(prisma.post.create).toHaveBeenCalled();
  });

  it('should list public posts with pagination', async () => {
    prisma.post.findMany.mockResolvedValue([
      { id: 'post-1', title: 'A', slug: 'a', status: 'PUBLISHED' },
    ]);
    prisma.post.count.mockResolvedValue(1);

    const result = await service.findAllPosts({ page: 1, limit: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('should like a comment and increment comment likeCount', async () => {
    prisma.authUser.findUnique.mockResolvedValue({ id: 'user-1' });
    prisma.post.findUnique.mockResolvedValue({ id: 'post-1', deletedAt: null });
    prisma.postComment.findFirst.mockResolvedValue({
      id: 'comment-1',
      postId: 'post-1',
      authorId: 'user-2',
      deletedAt: null,
      likeCount: 0,
    });
    prisma.commentReaction.findUnique.mockResolvedValue(null);
    prisma.commentReaction.create.mockResolvedValue({ id: 'reaction-1' });
    prisma.postComment.update.mockResolvedValue({ id: 'comment-1', likeCount: 1 });

    const result = await service.toggleCommentLike('post-1', 'comment-1', 'user-1');

    expect(prisma.commentReaction.create).toHaveBeenCalledWith({
      data: {
        commentId: 'comment-1',
        userId: 'user-1',
      },
    });
    expect(prisma.postComment.update).toHaveBeenCalledWith({
      where: { id: 'comment-1' },
      data: { likeCount: { increment: 1 } },
    });
    expect(result).toEqual({
      commentId: 'comment-1',
      userId: 'user-1',
      liked: true,
      likeCount: 1,
    });
  });
});
