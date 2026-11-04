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
      const res = await request(app.getHttpServer()).post('/topics').send({
        periodId: 'a0000000-0000-4000-8000-000000000000',
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

  describe('2. Phân cấp Chủ đề Cha - Con & Giai đoạn tùy chọn (Composite Pattern)', () => {
    let parentTopicId: string;
    let childTopicId: string;

    afterAll(async () => {
      if (childTopicId) {
        await request(app.getHttpServer()).delete(`/topics/${childTopicId}`);
      }
      if (parentTopicId) {
        await request(app.getHttpServer()).delete(`/topics/${parentTopicId}`);
      }
    });

    it('tạo thành công chủ đề gốc KHÔNG CẦN periodId (Optional Period)', async () => {
      const res = await request(app.getHttpServer())
        .post('/topics')
        .send({
          name: `Chủ đề Độc lập Phi Niên Đại ${Date.now()}`,
          description: 'Chuyên đề lịch sử nghệ thuật không gắn giai đoạn',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.periodId).toBeNull();
      expect(res.body.data.parentId).toBeNull();
      parentTopicId = res.body.data.id;
    });

    it('tạo thành công chủ đề con gắn với chủ đề cha (parentId)', async () => {
      const res = await request(app.getHttpServer())
        .post('/topics')
        .send({
          parentId: parentTopicId,
          name: `Chủ đề Con ${Date.now()}`,
          description: 'Tiểu chủ đề trực thuộc',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.parentId).toBe(parentTopicId);
      childTopicId = res.body.data.id;
    });

    it('từ chối khi chủ đề tự gán chính mình làm cha (Anti-Cycle)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/topics/${parentTopicId}`)
        .send({
          parentId: parentTopicId,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('không thể làm chủ đề cha của chính nó');
    });

    it('lấy thành công cây chủ đề phân cấp qua GET /topics/tree', async () => {
      const res = await request(app.getHttpServer())
        .get('/topics/tree')
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const foundParent = res.body.data.find((n: any) => n.id === parentTopicId);
      expect(foundParent).toBeDefined();
      expect(Array.isArray(foundParent.children)).toBe(true);
      expect(foundParent.children.some((c: any) => c.id === childTopicId)).toBe(true);
    });
  });

  describe('3. GET /topics - Danh sách Topics', () => {
    it('lấy danh sách chủ đề theo periodId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/topics?periodId=${testPeriodId}`)
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. GET /topics/:id - Chi tiết Topic', () => {
    it('lấy chi tiết chủ đề vừa tạo', async () => {
      const res = await request(app.getHttpServer())
        .get(`/topics/${createdTopicId}`)
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data.id).toBe(createdTopicId);
    });
  });

  describe('5. PATCH /topics/:id - Cập nhật Topic & Phân cấp Inbound', () => {
    it('cập nhật thành công tên chủ đề', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/topics/${createdTopicId}`)
        .send({
          name: 'Khởi nghĩa Trưng Nữ Vương (Đã cập nhật)',
        })
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data.name).toBe(
        'Khởi nghĩa Trưng Nữ Vương (Đã cập nhật)',
      );
    });
  });

  describe('6. Topic Hierarchy Management (Cha - Con Outbound)', () => {
    let childTopicAId: string;
    let childTopicBId: string;

    beforeAll(async () => {
      // Tạo 2 chủ đề con độc lập
      const resA = await request(app.getHttpServer())
        .post('/topics')
        .send({
          name: `Topic Con A ${Date.now()}`,
          status: 'PUBLISHED',
        });
      childTopicAId = resA.body.data.id;

      const resB = await request(app.getHttpServer())
        .post('/topics')
        .send({
          name: `Topic Con B ${Date.now()}`,
          status: 'PUBLISHED',
        });
      childTopicBId = resB.body.data.id;
    });

    afterAll(async () => {
      if (childTopicAId) {
        await request(app.getHttpServer()).delete(`/topics/${childTopicAId}`);
      }
      if (childTopicBId) {
        await request(app.getHttpServer()).delete(`/topics/${childTopicBId}`);
      }
    });

    it('từ chối khi gắn chính chủ đề làm con của nó', async () => {
      const res = await request(app.getHttpServer())
        .post(`/topics/${createdTopicId}/children`)
        .send({
          childIds: [createdTopicId],
        });

      expect(res.status).toBe(400);
    });

    it('gắn thành công danh sách chủ đề con vào chủ đề cha', async () => {
      const res = await request(app.getHttpServer())
        .post(`/topics/${createdTopicId}/children`)
        .send({
          childIds: [childTopicAId, childTopicBId],
        })
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data.count).toBe(2);

      // Kiểm tra chi tiết topic cha phải có 2 children
      const detailRes = await request(app.getHttpServer())
        .get(`/topics/${createdTopicId}`)
        .expect(200);

      expect(detailRes.body.data.children.length).toBeGreaterThanOrEqual(2);
      const childIds = detailRes.body.data.children.map((c: any) => c.id);
      expect(childIds).toContain(childTopicAId);
      expect(childIds).toContain(childTopicBId);
    });

    it('tách thành công một chủ đề con thành chủ đề gốc độc lập qua DELETE /topics/:id/children/:childId', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/topics/${createdTopicId}/children/${childTopicAId}`)
        .expect(200);

      expect(res.body.statusCode).toBe(200);

      // Kiểm tra lại chi tiết childTopicAId xem parentId đã về null chưa
      const childRes = await request(app.getHttpServer())
        .get(`/topics/${childTopicAId}`)
        .expect(200);

      expect(childRes.body.data.parentId).toBeNull();
    });

    it('tách chủ đề con còn lại qua PATCH parentId: null', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/topics/${childTopicBId}`)
        .send({
          parentId: null,
        })
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data.parentId).toBeNull();
    });
  });

  describe('7. PATCH /topics/reorder - Sắp xếp lại thứ tự (Batch Reordering)', () => {
    let reorderTopic1Id: string;
    let reorderTopic2Id: string;

    beforeAll(async () => {
      const res1 = await request(app.getHttpServer())
        .post('/topics')
        .send({
          name: `Reorder Topic 1 ${Date.now()}`,
          displayOrder: 10,
          status: 'PUBLISHED',
        });
      reorderTopic1Id = res1.body.data.id;

      const res2 = await request(app.getHttpServer())
        .post('/topics')
        .send({
          name: `Reorder Topic 2 ${Date.now()}`,
          displayOrder: 20,
          status: 'PUBLISHED',
        });
      reorderTopic2Id = res2.body.data.id;
    });

    afterAll(async () => {
      if (reorderTopic1Id) {
        await request(app.getHttpServer()).delete(`/topics/${reorderTopic1Id}`);
      }
      if (reorderTopic2Id) {
        await request(app.getHttpServer()).delete(`/topics/${reorderTopic2Id}`);
      }
    });

    it('từ chối khi items rỗng', async () => {
      const res = await request(app.getHttpServer())
        .patch('/topics/reorder')
        .send({ items: [] });

      expect(res.status).toBe(400);
    });

    it('hoán đổi thành công thứ tự hiển thị của 2 chủ đề', async () => {
      const res = await request(app.getHttpServer())
        .patch('/topics/reorder')
        .send({
          items: [
            { id: reorderTopic1Id, displayOrder: 20 },
            { id: reorderTopic2Id, displayOrder: 10 },
          ],
        })
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data.count).toBe(2);

      // Kiểm tra lại chi tiết từng topic
      const check1 = await request(app.getHttpServer())
        .get(`/topics/${reorderTopic1Id}`)
        .expect(200);
      expect(check1.body.data.displayOrder).toBe(20);

      const check2 = await request(app.getHttpServer())
        .get(`/topics/${reorderTopic2Id}`)
        .expect(200);
      expect(check2.body.data.displayOrder).toBe(10);
    });
  });

  describe('8. DELETE /topics/:id - Xóa Topic', () => {
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
