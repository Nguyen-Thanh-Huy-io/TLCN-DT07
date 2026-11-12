import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { AuthGuard } from '../common/guards/auth.guard';

type TestAuthedRequest = Request & { user: { userId: string; role: string } };
const TEST_POST_ID = 'post-1';
const TEST_COMMENT_ID = 'comment-1';

// Mock AuthGuard để tránh inject RedisService + PrismaService trong unit test
const mockAuthGuard = { canActivate: jest.fn(() => true) };

describe('BlogController', () => {
  let controller: BlogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlogController],
      providers: [
        {
          provide: BlogService,
          useValue: {
            getComments: jest.fn(),
            createComment: jest.fn(),
            updateComment: jest.fn(),
            deleteComment: jest.fn(),
            likeComment: jest.fn(),
            reviewPost: jest.fn(),
            updatePost: jest.fn(),
            deletePost: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<BlogController>(BlogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate review to blog service', async () => {
    const reviewPost = jest.fn().mockResolvedValue({
      id: TEST_POST_ID,
      status: 'PUBLISHED',
    });
    const service = (
      controller as unknown as { blogService?: { reviewPost: jest.Mock } }
    ).blogService ?? { reviewPost };

    Object.defineProperty(controller, 'blogService', {
      value: service,
      configurable: true,
    });

    await controller.review(TEST_POST_ID, { status: 'PUBLISHED' });

    expect(service.reviewPost).toHaveBeenCalledWith(TEST_POST_ID, {
      status: 'PUBLISHED',
    });
  });

  it('should pass requester userId/role from the token to updatePost (ownership check lives in the service)', async () => {
    const updatePost = jest.fn().mockResolvedValue({
      id: TEST_POST_ID,
      title: 'Updated',
    });
    Object.defineProperty(controller, 'blogService', {
      value: { updatePost },
      configurable: true,
    });

    const req = {
      user: { userId: 'user-1', role: 'USER' },
    } as unknown as TestAuthedRequest;
    await controller.updatePost(TEST_POST_ID, { title: 'Updated' }, req);

    expect(updatePost).toHaveBeenCalledWith(
      TEST_POST_ID,
      { title: 'Updated' },
      'user-1',
      'USER',
    );
  });

  it('should pass requester userId/role from the token to deletePost (ownership check lives in the service)', async () => {
    const deletePost = jest.fn().mockResolvedValue({
      success: true,
      id: TEST_POST_ID,
    });
    Object.defineProperty(controller, 'blogService', {
      value: { deletePost },
      configurable: true,
    });

    const req = {
      user: { userId: 'user-1', role: 'USER' },
    } as unknown as TestAuthedRequest;
    await controller.deletePost(TEST_POST_ID, req);

    expect(deletePost).toHaveBeenCalledWith(TEST_POST_ID, 'user-1', 'USER');
  });

  it('should pass authenticated userId from req.user to createComment, updateComment, deleteComment, and likeComment', async () => {
    const createComment = jest.fn().mockResolvedValue({ id: TEST_COMMENT_ID });
    const updateComment = jest.fn().mockResolvedValue({ id: TEST_COMMENT_ID });
    const deleteComment = jest.fn().mockResolvedValue({ success: true });
    const likeComment = jest.fn().mockResolvedValue({ success: true });

    Object.defineProperty(controller, 'blogService', {
      value: { createComment, updateComment, deleteComment, likeComment },
      configurable: true,
    });

    const req = {
      user: { userId: 'auth-user-99', role: 'USER' },
    } as unknown as TestAuthedRequest;

    await controller.createComment(TEST_POST_ID, { content: 'Xin chào' }, req);
    expect(createComment).toHaveBeenCalledWith(
      TEST_POST_ID,
      { content: 'Xin chào' },
      'auth-user-99',
    );

    await controller.updateComment(
      TEST_POST_ID,
      TEST_COMMENT_ID,
      { content: 'Đã sửa' },
      req,
    );
    expect(updateComment).toHaveBeenCalledWith(
      TEST_POST_ID,
      TEST_COMMENT_ID,
      'auth-user-99',
      { content: 'Đã sửa' },
    );

    await controller.deleteComment(TEST_POST_ID, TEST_COMMENT_ID, req);
    expect(deleteComment).toHaveBeenCalledWith(
      TEST_POST_ID,
      TEST_COMMENT_ID,
      'auth-user-99',
    );

    await controller.likeComment(TEST_POST_ID, TEST_COMMENT_ID, req);
    expect(likeComment).toHaveBeenCalledWith(
      TEST_POST_ID,
      TEST_COMMENT_ID,
      'auth-user-99',
    );
  });
});
