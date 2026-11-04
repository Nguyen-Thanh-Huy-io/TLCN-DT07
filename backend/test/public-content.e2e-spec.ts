import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ContentStatus, LearningPathType } from '@prisma/client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AppModule } from './../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/all-exception.filter';
import { EmailQueueService } from '../src/common/queues/email/email.queue';
import { CustomThrottlerGuard } from '../src/common/guards/custom-throttler.guard';
import { PrismaService } from '../src/common/services/prisma.service';
import { RedisService } from '../src/common/services/redis.service';
import { PUBLIC_LANDING_CACHE_KEY } from '../src/common/constants/cache-keys.constant';

describe('Public Content E2E Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  let draftPeriodId: string;
  let draftTopicId: string;

  const mockEmailQueueService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
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
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    redis = app.get(RedisService);

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

    // Tạo bản nháp (DRAFT) để kiểm chứng API public không làm lộ nội dung chưa xuất bản
    const draftPeriod = await prisma.period.create({
      data: {
        name: 'Giai đoạn Nháp E2E',
        slug: `giai-doan-nhap-e2e-${Date.now()}`,
        startYear: 1800,
        endYear: 1850,
        status: ContentStatus.DRAFT,
      },
    });
    draftPeriodId = draftPeriod.id;

    const draftTopic = await prisma.topic.create({
      data: {
        name: 'Chương sử Nháp E2E',
        slug: `chuong-su-nhap-e2e-${Date.now()}`,
        pathType: LearningPathType.CHRONOLOGICAL,
        isFeatured: true,
        status: ContentStatus.DRAFT,
      },
    });
    draftTopicId = draftTopic.id;

    await redis.del(PUBLIC_LANDING_CACHE_KEY);
  });

  afterAll(async () => {
    if (draftTopicId) {
      await prisma.topic.delete({ where: { id: draftTopicId } }).catch(() => null);
    }
    if (draftPeriodId) {
      await prisma.period.delete({ where: { id: draftPeriodId } }).catch(() => null);
    }
    await redis.del(PUBLIC_LANDING_CACHE_KEY);
    await app.close();
  });

  it('GET /public/landing - trả về dữ liệu công khai không cần JWT và ẩn bản DRAFT', async () => {
    const res = await request(app.getHttpServer()).get('/public/landing');

    expect(res.status).toBe(200);
    expect(res.body.statusCode).toBe(200);
    const data = res.body.data;
    expect(Array.isArray(data.periods)).toBe(true);
    expect(Array.isArray(data.chapters)).toBe(true);
    expect(Array.isArray(data.knowledge)).toBe(true);
    expect(Array.isArray(data.figures)).toBe(true);

    expect(data.periods.length).toBeGreaterThanOrEqual(1);
    expect(data.chapters.length).toBeGreaterThanOrEqual(5);
    expect(data.knowledge.length).toBeGreaterThanOrEqual(6);
    expect(data.figures.length).toBeGreaterThanOrEqual(6);

    // Không chứa bản DRAFT
    expect(data.periods.some((p: { id: string }) => p.id === draftPeriodId)).toBe(
      false,
    );
    expect(data.chapters.some((t: { id: string }) => t.id === draftTopicId)).toBe(
      false,
    );
    // Không lộ trường status nội bộ
    expect(data.periods[0].status).toBeUndefined();
  });

  it('GET /public/topics - lọc đúng theo section CHAPTERS và KNOWLEDGE, trả 400 nếu sai enum', async () => {
    const chaptersRes = await request(app.getHttpServer()).get(
      '/public/topics?section=CHAPTERS',
    );
    expect(chaptersRes.status).toBe(200);
    expect(chaptersRes.body.data.length).toBeGreaterThanOrEqual(5);

    const knowledgeRes = await request(app.getHttpServer()).get(
      '/public/topics?section=KNOWLEDGE',
    );
    expect(knowledgeRes.status).toBe(200);
    expect(knowledgeRes.body.data.length).toBeGreaterThanOrEqual(6);

    const invalidRes = await request(app.getHttpServer()).get(
      '/public/topics?section=INVALID',
    );
    expect(invalidRes.status).toBe(400);
  });

  it('GET /public/figures & GET /historical-entities - trả về danh sách nhân vật tiêu biểu và thực thể CMS', async () => {
    const figuresRes = await request(app.getHttpServer()).get('/public/figures');
    expect(figuresRes.status).toBe(200);
    expect(figuresRes.body.data.length).toBeGreaterThanOrEqual(6);
    expect(
      figuresRes.body.data.some(
        (f: { name: string }) => f.name === 'Chủ tịch Hồ Chí Minh',
      ),
    ).toBe(true);

    const entitiesRes = await request(app.getHttpServer()).get(
      '/historical-entities?limit=20',
    );
    expect(entitiesRes.status).toBe(200);
    expect(entitiesRes.body.data.items.length).toBeGreaterThanOrEqual(8);
    expect(entitiesRes.body.data.items[0]).toHaveProperty('birthYear');

    const locationsRes = await request(app.getHttpServer()).get(
      '/historical-locations?limit=20',
    );
    expect(locationsRes.status).toBe(200);
    expect(locationsRes.body.data.items.length).toBeGreaterThanOrEqual(6);
    expect(
      locationsRes.body.data.items.some(
        (l: { name: string }) =>
          l.name === 'Dinh Độc Lập (Hội trường Thống Nhất)',
      ),
    ).toBe(true);

    const eventsRes = await request(app.getHttpServer()).get(
      '/historical-events?limit=20',
    );
    expect(eventsRes.status).toBe(200);
    expect(eventsRes.body.data.items.length).toBeGreaterThanOrEqual(13);
    expect(eventsRes.body.data.items[0]).toHaveProperty('entities');

    const lessonsRes = await request(app.getHttpServer()).get(
      '/lessons?limit=20',
    );
    expect(lessonsRes.status).toBe(200);
    expect(lessonsRes.body.data.items.length).toBeGreaterThanOrEqual(9);
    const dongKhoiLesson = lessonsRes.body.data.items.find((l: { title: string }) =>
      l.title.includes('Phong trào Đồng Khởi'),
    );
    expect(dongKhoiLesson).toBeDefined();
    expect(dongKhoiLesson.lessonEvents.length).toBeGreaterThanOrEqual(1);
    expect(dongKhoiLesson.lessonEntities.length).toBeGreaterThanOrEqual(1);
    expect(dongKhoiLesson.lessonLocations.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /public/periods/:slug, /public/topics/:slug, /public/figures/:slug - trả về trang chi tiết kèm Đồ thị Tri thức', async () => {
    const periodRes = await request(app.getHttpServer()).get(
      '/public/periods/khang-chien-chong-my-cuu-nuoc-1954-1975',
    );
    expect(periodRes.status).toBe(200);
    expect(periodRes.body.data.name).toContain('Kháng chiến chống Mỹ');
    expect(periodRes.body.data.topics.length).toBeGreaterThanOrEqual(5);
    expect(periodRes.body.data.events.length).toBeGreaterThanOrEqual(10);
    expect(periodRes.body.data.figures.length).toBeGreaterThanOrEqual(6);

    const topicRes = await request(app.getHttpServer()).get(
      '/public/topics/giai-doan-1954-1960-giu-gin-luc-luong-va-phong-trao-dong-khoi',
    );
    expect(topicRes.status).toBe(200);
    expect(topicRes.body.data.lessons.length).toBeGreaterThanOrEqual(1);
    expect(topicRes.body.data.lessons[0].entities.length).toBeGreaterThanOrEqual(
      1,
    );

    const figureRes = await request(app.getHttpServer()).get(
      '/public/figures/nu-tuong-nguyen-thi-dinh',
    );
    expect(figureRes.status).toBe(200);
    expect(figureRes.body.data.name).toBe('Nữ tướng Nguyễn Thị Định');
    expect(figureRes.body.data.lessons.length).toBeGreaterThanOrEqual(1);
  });
});


