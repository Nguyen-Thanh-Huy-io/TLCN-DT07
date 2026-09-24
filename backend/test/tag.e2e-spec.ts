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

describe('Tag E2E Integration Tests', () => {
  let app: INestApplication;
  let createdPeriodId: string;
  let createdTopicId: string;
  let createdLessonId: string;
  let createdTagId: string;

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

    // 1. Tạo Period
    const periodRes = await request(app.getHttpServer())
      .post('/periods')
      .send({
        name: `Thời kỳ Tag E2E ${Date.now()}`,
        startYear: 1945,
        endYear: 1954,
      });
    createdPeriodId = periodRes.body.data.id;

    // 2. Tạo Topic
    const topicRes = await request(app.getHttpServer())
      .post('/topics')
      .send({
        periodId: createdPeriodId,
        title: `Chủ đề Tag E2E ${Date.now()}`,
      });
    createdTopicId = topicRes.body.data.id;

    // 3. Tạo Lesson
    const lessonRes = await request(app.getHttpServer())
      .post('/lessons')
      .send({
        topicId: createdTopicId,
        title: `Bài học Tag E2E ${Date.now()}`,
        contentRichText: 'Nội dung bài học test tag',
      });
    createdLessonId = lessonRes.body.data.id;
  });

  afterAll(async () => {
    if (createdTagId) {
      await request(app.getHttpServer()).delete(`/tags/${createdTagId}`);
    }
    if (createdLessonId) {
      await request(app.getHttpServer()).delete(`/lessons/${createdLessonId}`);
    }
    if (createdTopicId) {
      await request(app.getHttpServer()).delete(`/topics/${createdTopicId}`);
    }
    if (createdPeriodId) {
      await request(app.getHttpServer()).delete(`/periods/${createdPeriodId}`);
    }
    await app.close();
  });

  describe('1. POST /tags - Tạo mới Tag', () => {
    it('thành công tạo mới một Tag hợp lệ', async () => {
      const res = await request(app.getHttpServer())
        .post('/tags')
        .send({
          name: `Kháng chiến chống Pháp E2E ${Date.now()}`,
          description: 'Tag cho các bài học chống Pháp',
          colorHex: '#FF5733',
        });

      expect(res.status).toBe(201);
      expect(res.body.statusCode).toBe(201);
      expect(res.body.data.id).toBeDefined();
      createdTagId = res.body.data.id;
    });
  });

  describe('2. GET /tags - Danh sách Tag', () => {
    it('lấy danh sách tags có phân trang', async () => {
      const res = await request(app.getHttpServer())
        .get('/tags?page=1&limit=5')
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('3. POST /lessons/:id/tags - Gán Tag vào Lesson', () => {
    it('gán tag vào bài học thành công', async () => {
      const res = await request(app.getHttpServer())
        .post(`/lessons/${createdLessonId}/tags`)
        .send({
          tagIds: [createdTagId],
        })
        .expect(201);

      expect(res.body.statusCode).toBe(201);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].id).toBe(createdTagId);
    });
  });

  describe('4. GET /lessons/:id/tags - Lấy danh sách Tag của Lesson', () => {
    it('lấy danh sách tag của bài học thành công', async () => {
      const res = await request(app.getHttpServer())
        .get(`/lessons/${createdLessonId}/tags`)
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].id).toBe(createdTagId);
    });
  });

  describe('5. DELETE /tags/:id - Xóa Tag', () => {
    it('xóa tag thành công', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/tags/${createdTagId}`)
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      createdTagId = '';
    });
  });
});
