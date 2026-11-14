import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ContentStatus, PostType, UserRole } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { BlogService } from './blog.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { BlogGateway } from './blog.gateway';
import { NotificationService } from '../notification/notification.service';

describe('BlogService — assertCanModifyPost (quyền sửa/xóa bài viết)', () => {
  let service: BlogService;
  let prisma: {
    blogPost: {
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      create: jest.Mock;
    };
  };

  const existingPost = {
    id: 'post-1',
    authorId: 'author-1',
    slug: 'bai-viet-1',
    title: 'Bài viết 1',
    status: 'PUBLISHED',
    publishedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      blogPost: {
        findUnique: jest.fn().mockResolvedValue(existingPost),
        update: jest.fn().mockResolvedValue({
          ...existingPost,
          author: { id: 'author-1', username: 'author' },
        }),
        delete: jest.fn().mockResolvedValue(existingPost),
        create: jest.fn().mockImplementation(({ data }) => ({
          id: 'post-moi',
          ...data,
          author: { id: data.authorId, username: 'author' },
        })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      authUser: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'author-1', username: 'author' }),
      },
      blogPostComment: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'comment-1',
          postId: 'post-1',
          authorId: 'author-1',
          content: 'Bình luận cũ',
          author: { id: 'author-1', username: 'author' },
          replies: [],
        }),
        update: jest.fn().mockResolvedValue({
          id: 'comment-1',
          postId: 'post-1',
          authorId: 'author-1',
          content: 'Bình luận mới',
          author: { id: 'author-1', username: 'author' },
          replies: [],
        }),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: BlogGateway,
          useValue: {
            emitCommentAdded: jest.fn(),
            emitCommentUpdated: jest.fn(),
          },
        },
        { provide: NotificationService, useValue: { notify: jest.fn() } },
        { provide: RedisService, useValue: { get: jest.fn(), set: jest.fn() } },
      ],
    }).compile();

    service = module.get<BlogService>(BlogService);
  });

  it('cho phép chính tác giả cập nhật bài viết của mình', async () => {
    await expect(
      service.updatePost('post-1', { title: 'Sửa lại' }, 'author-1', 'USER'),
    ).resolves.toBeDefined();
  });

  it('chặn người không phải tác giả và không phải STAFF cập nhật bài viết', async () => {
    await expect(
      service.updatePost(
        'post-1',
        { title: 'Sửa lại' },
        'another-user',
        'USER',
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.blogPost.update).not.toHaveBeenCalled();
  });

  it('cho phép MODERATOR (STAFF) cập nhật bài viết của người khác', async () => {
    await expect(
      service.updatePost(
        'post-1',
        { title: 'Biên tập lại' },
        'moderator-1',
        'MODERATOR',
      ),
    ).resolves.toBeDefined();
  });

  it('chặn người không phải tác giả và không phải STAFF xóa bài viết', async () => {
    await expect(
      service.deletePost('post-1', 'another-user', 'USER'),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.blogPost.delete).not.toHaveBeenCalled();
  });

  it('cho phép chính tác giả xóa bài viết của mình', async () => {
    await expect(
      service.deletePost('post-1', 'author-1', 'USER'),
    ).resolves.toEqual({
      success: true,
      id: 'post-1',
    });
  });

  it('báo NotFoundException khi bài viết không tồn tại, bất kể quyền', async () => {
    prisma.blogPost.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.deletePost('post-khong-ton-tai', 'author-1', 'USER'),
    ).rejects.toThrow(NotFoundException);
  });

  it('ném ForbiddenException (403) khi người khác cố sửa hoặc xóa bình luận không phải của mình', async () => {
    await expect(
      service.updateComment('post-1', 'comment-1', 'intruder-user', {
        content: 'Sửa trái phép',
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      service.deleteComment('post-1', 'comment-1', 'intruder-user'),
    ).rejects.toThrow(ForbiddenException);
  });

  describe('quyền xuất bản khi tạo / sửa bài', () => {
    beforeEach(() => {
      prisma.blogPost.findUnique.mockResolvedValue(null);
    });

    it('lấy tác giả từ người đăng nhập, không từ body', async () => {
      await service.createPost('author-1', UserRole.USER, {
        title: 'Câu hỏi cộng đồng',
        postType: PostType.QUICK_POST,
        status: ContentStatus.PUBLISHED,
      });

      expect(prisma.blogPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            authorId: 'author-1',
            slug: 'cau-hoi-cong-dong',
          }),
        }),
      );
    });

    it('người dùng thường không tự xuất bản bài chuyên khảo', async () => {
      await expect(
        service.createPost('author-1', UserRole.USER, {
          title: 'Bài dài',
          postType: PostType.LONG_FORM,
          status: ContentStatus.PUBLISHED,
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.blogPost.create).not.toHaveBeenCalled();
    });

    it('người dùng thường gửi bài chuyên khảo chờ duyệt được', async () => {
      await expect(
        service.createPost('author-1', UserRole.USER, {
          title: 'Bài dài',
          postType: PostType.LONG_FORM,
          status: ContentStatus.PENDING_REVIEW,
        }),
      ).resolves.toBeDefined();
    });

    it('người dùng thường không tự đặt bài nổi bật', async () => {
      await expect(
        service.createPost('author-1', UserRole.USER, {
          title: 'Câu hỏi',
          isFeatured: true,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('người duyệt xuất bản thẳng bài chuyên khảo được', async () => {
      await expect(
        service.createPost('admin-1', UserRole.ADMIN, {
          title: 'Bài dài',
          postType: PostType.LONG_FORM,
          status: ContentStatus.PUBLISHED,
          isFeatured: true,
        }),
      ).resolves.toBeDefined();
    });

    it('tác giả không tự chuyển bài chuyên khảo của mình sang PUBLISHED khi sửa', async () => {
      prisma.blogPost.findUnique.mockResolvedValue({
        ...existingPost,
        status: ContentStatus.PENDING_REVIEW,
        postType: PostType.LONG_FORM,
      });

      await expect(
        service.updatePost(
          'post-1',
          { status: ContentStatus.PUBLISHED },
          'author-1',
          UserRole.USER,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.blogPost.update).not.toHaveBeenCalled();
    });
  });
});
