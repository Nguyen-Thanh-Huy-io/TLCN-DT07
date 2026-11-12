import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BlogService } from './blog.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { BlogGateway } from './blog.gateway';
import { NotificationService } from '../notification/notification.service';

describe('BlogService — assertCanModifyPost (quyền sửa/xóa bài viết)', () => {
  let service: BlogService;
  let prisma: { blogPost: { findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock } };

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
        update: jest.fn().mockResolvedValue({ ...existingPost, author: { id: 'author-1', username: 'author' } }),
        delete: jest.fn().mockResolvedValue(existingPost),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        { provide: PrismaService, useValue: prisma },
        { provide: BlogGateway, useValue: { emitCommentAdded: jest.fn(), emitCommentUpdated: jest.fn() } },
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
      service.updatePost('post-1', { title: 'Sửa lại' }, 'another-user', 'USER'),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.blogPost.update).not.toHaveBeenCalled();
  });

  it('cho phép MODERATOR (STAFF) cập nhật bài viết của người khác', async () => {
    await expect(
      service.updatePost('post-1', { title: 'Biên tập lại' }, 'moderator-1', 'MODERATOR'),
    ).resolves.toBeDefined();
  });

  it('chặn người không phải tác giả và không phải STAFF xóa bài viết', async () => {
    await expect(
      service.deletePost('post-1', 'another-user', 'USER'),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.blogPost.delete).not.toHaveBeenCalled();
  });

  it('cho phép chính tác giả xóa bài viết của mình', async () => {
    await expect(service.deletePost('post-1', 'author-1', 'USER')).resolves.toEqual({
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
});
