import { Test, TestingModule } from '@nestjs/testing';
import { BlogGateway } from './blog.gateway';

describe('BlogGateway', () => {
  let gateway: BlogGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlogGateway],
    }).compile();

    gateway = module.get<BlogGateway>(BlogGateway);
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;
  });

  it('should emit comment added event to post room', () => {
    gateway.emitCommentAdded('post-1', { commentId: 'c-1' });

    expect(gateway.server.to).toHaveBeenCalledWith('post:post-1');
  });

  it('should emit moderation event', () => {
    gateway.emitPostModerated('post-1', { status: 'PUBLISHED' });

    expect(gateway.server.to).toHaveBeenCalledWith('post:post-1');
  });
});
