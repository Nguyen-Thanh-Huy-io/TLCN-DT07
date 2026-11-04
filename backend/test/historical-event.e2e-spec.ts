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

describe('HistoricalEvent E2E Integration Tests', () => {
  let app: INestApplication;
  let createdPeriodId: string;
  let createdTopicId: string;
  let createdEventId: string;

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

    // 1. Tạo Period để gán Topic
    const periodRes = await request(app.getHttpServer())
      .post('/periods')
      .send({
        name: `Thời Lý - E2E Event ${Date.now()}`,
        startYear: 1009,
        endYear: 1225,
      });
    createdPeriodId = periodRes.body.data.id;

    // 2. Tạo Topic để gán Event
    const topicRes = await request(app.getHttpServer())
      .post('/topics')
      .send({
        periodId: createdPeriodId,
        title: `Chống Tống lần 2 - E2E Event ${Date.now()}`,
      });
    createdTopicId = topicRes.body.data.id;
  });

  afterAll(async () => {
    if (createdEventId) {
      await request(app.getHttpServer()).delete(
        `/historical-events/${createdEventId}`,
      );
    }
    if (createdTopicId) {
      await request(app.getHttpServer()).delete(`/topics/${createdTopicId}`);
    }
    if (createdPeriodId) {
      await request(app.getHttpServer()).delete(`/periods/${createdPeriodId}`);
    }
    await app.close();
  });

  describe('1. POST /historical-events - Tạo mới Sự kiện', () => {
    it('thành công tạo mới một sự kiện hợp lệ', async () => {
      const res = await request(app.getHttpServer())
        .post('/historical-events')
        .send({
          topicId: createdTopicId,
          title: 'Trận Như Nguyệt',
          year: 1077,
          location: 'Sông Như Nguyệt',
          significance: 'Đánh tan quân Tống xâm lược lần 2',
          status: 'PUBLISHED',
        });

      expect(res.status).toBe(201);
      expect(res.body.statusCode).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      createdEventId = res.body.data.id;
    });
  });

  describe('2. GET /historical-events - Danh sách Sự kiện', () => {
    it('lấy danh sách sự kiện có phân trang', async () => {
      const res = await request(app.getHttpServer())
        .get('/historical-events?page=1&limit=5')
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('3. GET /historical-events/:id - Chi tiết Sự kiện', () => {
    it('lấy chi tiết sự kiện vừa tạo', async () => {
      const res = await request(app.getHttpServer())
        .get(`/historical-events/${createdEventId}`)
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data.id).toBe(createdEventId);
    });
  });

  describe('4. PATCH /historical-events/:id - Cập nhật Sự kiện', () => {
    it('cập nhật tiêu đề sự kiện', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/historical-events/${createdEventId}`)
        .send({
          title: 'Trận Như Nguyệt (Đã cập nhật)',
        })
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data.title).toBe('Trận Như Nguyệt (Đã cập nhật)');
    });
  });

  describe('5. DELETE /historical-events/:id - Xóa Sự kiện', () => {
    it('xóa sự kiện thành công', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/historical-events/${createdEventId}`)
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      createdEventId = '';
    });
  });
});
