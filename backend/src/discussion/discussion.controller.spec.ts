import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DiscussionTargetType, UserRole } from '@prisma/client';
import request from 'supertest';
import { AuthGuard } from '../common/guards/auth.guard';
import { DiscussionController } from './discussion.controller';
import { DiscussionService } from './discussion.service';

describe('DiscussionController (HTTP Integration)', () => {
  let app: INestApplication;
  const discussionMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    createReply: jest.fn(),
    remove: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DiscussionController],
      providers: [{ provide: DiscussionService, useValue: discussionMock }],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = { userId: 'user-test-1', role: UserRole.USER };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const threadId = '11111111-1111-4111-8111-111111111111';

  it('GET /discussions không cần đăng nhập, uỷ quyền truy vấn lọc cho service', async () => {
    discussionMock.findAll.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await request(app.getHttpServer())
      .get('/discussions')
      .query({ targetType: DiscussionTargetType.LESSON, targetId: threadId })
      .expect(200);

    expect(discussionMock.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: DiscussionTargetType.LESSON,
        targetId: threadId,
      }),
    );
  });

  it('GET /discussions/:id từ chối id không phải UUID (400)', async () => {
    await request(app.getHttpServer())
      .get('/discussions/not-a-uuid')
      .expect(400);
    expect(discussionMock.findOne).not.toHaveBeenCalled();
  });

  it('GET /discussions/:id trả chi tiết khi id hợp lệ', async () => {
    discussionMock.findOne.mockResolvedValue({ id: threadId, title: 'Hỏi' });

    const res = await request(app.getHttpServer())
      .get(`/discussions/${threadId}`)
      .expect(200);

    expect(discussionMock.findOne).toHaveBeenCalledWith(threadId);
    expect(res.body.title).toBe('Hỏi');
  });

  it('POST /discussions từ chối payload thiếu trường bắt buộc (400)', async () => {
    await request(app.getHttpServer())
      .post('/discussions')
      .send({})
      .expect(400);
    expect(discussionMock.create).not.toHaveBeenCalled();
  });

  it('POST /discussions tạo chủ đề mới, lấy userId từ token', async () => {
    discussionMock.create.mockResolvedValue({ id: threadId });

    await request(app.getHttpServer())
      .post('/discussions')
      .send({
        targetType: DiscussionTargetType.LESSON,
        targetId: threadId,
        title: 'Câu hỏi về Bạch Đằng',
        content: 'Nội dung câu hỏi',
      })
      .expect(201);

    expect(discussionMock.create).toHaveBeenCalledWith(
      'user-test-1',
      expect.objectContaining({ title: 'Câu hỏi về Bạch Đằng' }),
    );
  });

  it('POST /discussions/:id/replies trả lời, lấy userId+role từ token chứ không từ body', async () => {
    discussionMock.createReply.mockResolvedValue({
      id: 'reply-1',
      isOfficial: false,
    });

    await request(app.getHttpServer())
      .post(`/discussions/${threadId}/replies`)
      .send({
        content: 'Trả lời',
        userId: 'ke-gia-mao',
        role: UserRole.SUPERADMIN,
      })
      .expect(201);

    expect(discussionMock.createReply).toHaveBeenCalledWith(
      'user-test-1',
      UserRole.USER,
      threadId,
      expect.objectContaining({ content: 'Trả lời' }),
    );
  });

  it('DELETE /discussions/:id xoá chủ đề, uỷ quyền kiểm tra quyền cho service', async () => {
    discussionMock.remove.mockResolvedValue({ success: true });

    const res = await request(app.getHttpServer())
      .delete(`/discussions/${threadId}`)
      .expect(200);

    expect(discussionMock.remove).toHaveBeenCalledWith(
      'user-test-1',
      UserRole.USER,
      threadId,
    );
    expect(res.body.success).toBe(true);
  });
});
