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

describe('Dashboard E2E Integration Tests', () => {
  let app: INestApplication;

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
    await app.close();
  });

  describe('1. GET /dashboard/overview - Lấy tổng quan thống kê CMS', () => {
    it('trả về 200 kèm đầy đủ các chỉ số thống kê, hoạt động và phân bổ nội dung', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/overview')
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data).toBeDefined();

      // Kiểm tra cấu trúc counts
      const counts = res.body.data.counts;
      expect(counts).toBeDefined();
      expect(typeof counts.periodsCount).toBe('number');
      expect(typeof counts.topicsCount).toBe('number');
      expect(typeof counts.lessonsCount).toBe('number');
      expect(typeof counts.pendingLessonsCount).toBe('number');
      expect(typeof counts.historicalEventsCount).toBe('number');

      // Kiểm tra danh sách hoạt động gần đây
      const activities = res.body.data.recentActivities;
      expect(Array.isArray(activities)).toBe(true);

      // Kiểm tra danh sách bài chờ duyệt
      const pendingLessons = res.body.data.pendingLessons;
      expect(Array.isArray(pendingLessons)).toBe(true);

      // Kiểm tra phân bổ nội dung
      const distribution = res.body.data.distribution;
      expect(distribution).toBeDefined();
      expect(typeof distribution.published).toBe('number');
      expect(typeof distribution.draft).toBe('number');
      expect(typeof distribution.pendingReview).toBe('number');
    });
  });
});
