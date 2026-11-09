import { Test, TestingModule } from '@nestjs/testing';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';

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
          },
        },
      ],
    }).compile();

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
});
