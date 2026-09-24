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

describe('Topic E2E Integration Tests', () => {
  let app: INestApplication;
  let testPeriodId: string;
  let createdTopicId: string;

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

    // 1. Tạo 1 Period mẫu để làm khóa ngoại cho Topic
    const periodRes = await request(app.getHttpServer())
      .post('/periods')
      .send({
        name: `Period Cho Topic Test ${Date.now()}`,
        region: 'Việt Nam',
        startYear: 40,
        endYear: 43,
        status: 'PUBLISHED',
      });

    testPeriodId = periodRes.body.data.id;
  });

  afterAll(async () => {
    if (createdTopicId) {
      await request(app.getHttpServer()).delete(`/topics/${createdTopicId}`);
    }
    if (testPeriodId) {
      await request(app.getHttpServer()).delete(`/periods/${testPeriodId}`);
    }
    await app.close();
  });

  describe('1. POST /topics - Tạo mới Topic', () => {
    it('thất bại với 404 nếu periodId không tồn tại', async () => {
      const res = await request(app.getHttpServer())
        .post('/topics')
        .send({
          periodId: '00000000-0000-0000-0000-000000000000',
          name: 'Chủ đề không có giai đoạn',
        });

      expect(res.status).toBe(404);
    });

    it('thành công tạo mới chủ đề hợp lệ', async () => {
      const res = await request(app.getHttpServer())
        .post('/topics')
        .send({
          periodId: testPeriodId,
          name: `Khởi nghĩa Trưng Nữ Vương ${Date.now()}`,
          description: 'Cuộc khởi nghĩa đánh đuổi Thái thú Tô Định',
          isSequential: true,
          displayOrder: 1,
          status: 'PUBLISHED',
        });

      expect(res.status).toBe(201);
      expect(res.body.statusCode).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.periodId).toBe(testPeriodId);
      createdTopicId = res.body.data.id;
    });
  });

  describe('2. GET /topics - Danh sách Topics', () => {
    it('lấy danh sách chủ đề theo periodId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/topics?periodId=${testPeriodId}`)
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. GET /topics/:id - Chi tiết Topic', () => {
    it('lấy chi tiết chủ đề vừa tạo', async () => {
      const res = await request(app.getHttpServer())
        .get(`/topics/${createdTopicId}`)
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data.id).toBe(createdTopicId);
    });
  });

  describe('4. PATCH /topics/:id - Cập nhật Topic', () => {
    it('cập nhật thành công tên chủ đề', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/topics/${createdTopicId}`)
        .send({
          name: 'Khởi nghĩa Trưng Nữ Vương (Đã cập nhật)',
        })
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Khởi nghĩa Trưng Nữ Vương (Đã cập nhật)');
    });
  });

  describe('5. DELETE /topics/:id - Xóa Topic', () => {
    it('xóa thành công chủ đề', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/topics/${createdTopicId}`)
        .expect(200);

      expect(res.body.statusCode).toBe(200);

      await request(app.getHttpServer())
        .get(`/topics/${createdTopicId}`)
        .expect(404);

      createdTopicId = '';
    });
  });
});
