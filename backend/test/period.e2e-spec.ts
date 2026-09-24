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

describe('Period E2E Integration Tests', () => {
  let app: INestApplication;
  let createdPeriodId: string;

  const mockEmailQueueService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  };

  // Mock AuthGuard to bypass JWT authentication for admin tests
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
    if (createdPeriodId) {
      await request(app.getHttpServer()).delete(`/periods/${createdPeriodId}`);
    }
    await app.close();
  });

  describe('1. POST /periods - Tạo mới Period', () => {
    it('thất bại với 400 nếu endYear < startYear', async () => {
      const res = await request(app.getHttpServer())
        .post('/periods')
        .send({
          name: 'Giai đoạn không hợp lệ',
          startYear: 2000,
          endYear: 1000,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('thành công tạo mới một giai đoạn hợp lệ', async () => {
      const res = await request(app.getHttpServer())
        .post('/periods')
        .send({
          name: `Thời kỳ đồ đồng - E2E ${Date.now()}`,
          region: 'Việt Nam',
          startYear: -2000,
          endYear: -1000,
          description: 'Thời đại kim khí và hình thành nhà nước Văn Lang sơ khai',
          displayOrder: 1,
          status: 'PUBLISHED',
        });

      expect(res.status).toBe(201);
      expect(res.body.statusCode).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      createdPeriodId = res.body.data.id;
    });
  });

  describe('2. GET /periods - Danh sách Periods', () => {
    it('lấy danh sách periods có phân trang', async () => {
      const res = await request(app.getHttpServer())
        .get('/periods?page=1&limit=5')
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.page).toBe(1);
    });

    it('lọc periods theo region', async () => {
      const res = await request(app.getHttpServer())
        .get('/periods?region=Việt Nam')
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('3. GET /periods/:id - Chi tiết Period', () => {
    it('lấy chi tiết giai đoạn vừa tạo', async () => {
      const res = await request(app.getHttpServer())
        .get(`/periods/${createdPeriodId}`)
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data.id).toBe(createdPeriodId);
    });

    it('trả về 404 cho id không tồn tại', async () => {
      const res = await request(app.getHttpServer())
        .get('/periods/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('4. PATCH /periods/:id - Cập nhật Period', () => {
    it('cập nhật thành công tên giai đoạn', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/periods/${createdPeriodId}`)
        .send({
          name: 'Thời kỳ đồ đồng (Đã cập nhật)',
        })
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Thời kỳ đồ đồng (Đã cập nhật)');
    });
  });

  describe('5. DELETE /periods/:id - Xóa Period', () => {
    it('xóa thành công giai đoạn', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/periods/${createdPeriodId}`)
        .expect(200);

      expect(res.body.statusCode).toBe(200);

      // Verify xóa xong get lại phải 404
      await request(app.getHttpServer())
        .get(`/periods/${createdPeriodId}`)
        .expect(404);

      createdPeriodId = '';
    });
  });
});
