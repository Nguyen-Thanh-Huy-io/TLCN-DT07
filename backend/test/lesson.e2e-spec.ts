import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/all-exception.filter';
import { EmailQueueService } from '../src/common/queues/email/email.queue';
import { CustomThrottlerGuard } from '../src/common/guards/custom-throttler.guard';
import { AuthGuard } from '../src/common/guards/auth.guard';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

describe('Lesson E2E Integration Tests', () => {
  let app: INestApplication;
  let createdLessonId: string;

  const mockEmailQueueService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockAuthGuard = {
    canActivate: (context: any) => {
      const req = context.switchToHttp().getRequest();
      req.user = { userId: 'admin-test-id', role: 'ADMIN', tokenVersion: 1 };
      return true;
    },
  };

  jest.setTimeout(60000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailQueueService)
      .useValue(mockEmailQueueService)
      .overrideGuard(CustomThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();

    const winstonLogger = app.get(WINSTON_MODULE_PROVIDER);
    app.useGlobalFilters(new AllExceptionsFilter(winstonLogger));
    app.useGlobalInterceptors(new TransformInterceptor(winstonLogger));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (createdLessonId) {
      await request(app.getHttpServer()).delete(`/lessons/${createdLessonId}`);
    }
    await app.close();
  });

  describe('1. POST /lessons - Tạo mới Lesson', () => {
    it('thành công tạo mới bài học hợp lệ (độc lập với Topic)', async () => {
      const res = await request(app.getHttpServer())
        .post('/lessons')
        .send({
          title: `Trận Bạch Đằng năm 938 - E2E ${Date.now()}`,
          contentRichText:
            '<p>Chi tiết diễn biến trận đánh cọc gỗ trên sông Bạch Đằng...</p>',
          difficulty: 'MEDIUM',
          displayOrder: 1,
          status: 'DRAFT',
        });

      expect(res.status).toBe(201);
      expect(res.body.statusCode).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.estimatedReadMinutes).toBeDefined();
      createdLessonId = res.body.data.id;
    });
  });

  describe('2. GET /lessons - Danh sách Lessons', () => {
    it('lấy danh sách bài học có phân trang', async () => {
      const res = await request(app.getHttpServer())
        .get('/lessons?page=1&limit=10')
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. GET /lessons/:id - Chi tiết Lesson', () => {
    it('lấy chi tiết bài học vừa tạo', async () => {
      const res = await request(app.getHttpServer())
        .get(`/lessons/${createdLessonId}`)
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data.id).toBe(createdLessonId);
      expect(res.body.data.estimatedReadMinutes).toBe(1);
    });
  });

  describe('4. PATCH /lessons/:id/review - Duyệt bài học', () => {
    it('thất bại với 400 nếu REJECTED mà không có rejectionReason', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/lessons/${createdLessonId}/review`)
        .send({
          status: 'REJECTED',
        });

      expect(res.status).toBe(400);
    });

    it('thành công duyệt xuất bản bài học (PUBLISHED)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/lessons/${createdLessonId}/review`)
        .send({
          status: 'PUBLISHED',
        })
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data.status).toBe('PUBLISHED');
      expect(res.body.data.publishedAt).toBeDefined();
    });
  });

  describe('5. DELETE /lessons/:id - Xóa Lesson', () => {
    it('xóa thành công bài học', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/lessons/${createdLessonId}`)
        .expect(200);

      expect(res.body.statusCode).toBe(200);

      await request(app.getHttpServer())
        .get(`/lessons/${createdLessonId}`)
        .expect(404);

      createdLessonId = '';
    });
  });
});
