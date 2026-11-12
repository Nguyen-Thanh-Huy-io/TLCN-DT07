import { Test, TestingModule } from '@nestjs/testing';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { AuthGuard } from '../common/guards/auth.guard';

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
    const reviewPost = jest.fn().mockResolvedValue({ id: 'post-1', status: 'PUBLISHED' });
    const service = (controller as any).blogService ?? { reviewPost };

    Object.defineProperty(controller, 'blogService', {
      value: service,
      configurable: true,
    });

    await controller.review('post-1', { status: 'PUBLISHED' });

    expect(service.reviewPost).toHaveBeenCalledWith('post-1', { status: 'PUBLISHED' });
  });

  it('should pass requester userId/role from the token to updatePost (ownership check lives in the service)', async () => {
    const updatePost = jest.fn().mockResolvedValue({ id: 'post-1', title: 'Updated' });
    Object.defineProperty(controller, 'blogService', {
      value: { updatePost },
      configurable: true,
    });

    const req = { user: { userId: 'user-1', role: 'USER' } } as any;
    await controller.updatePost('post-1', { title: 'Updated' }, req);

    expect(updatePost).toHaveBeenCalledWith('post-1', { title: 'Updated' }, 'user-1', 'USER');
  });

  it('should pass requester userId/role from the token to deletePost (ownership check lives in the service)', async () => {
    const deletePost = jest.fn().mockResolvedValue({ success: true, id: 'post-1' });
    Object.defineProperty(controller, 'blogService', {
      value: { deletePost },
      configurable: true,
    });

    const req = { user: { userId: 'user-1', role: 'USER' } } as any;
    await controller.deletePost('post-1', req);

    expect(deletePost).toHaveBeenCalledWith('post-1', 'user-1', 'USER');
  });
});
