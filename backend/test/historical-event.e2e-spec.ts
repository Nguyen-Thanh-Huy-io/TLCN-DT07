import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('HistoricalEventController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let createdPeriodId: string;
  let createdTopicId: string;
  let createdEventId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean DB
    await prisma.historicalEvent.deleteMany({});
    await prisma.lesson.deleteMany({});
    await prisma.topic.deleteMany({});
    await prisma.period.deleteMany({});
    await prisma.authUser.deleteMany({});

    // Register Admin User
    const regRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'eventadmin@example.com',
        password: 'Password123!',
        fullName: 'Event Admin',
        role: 'ADMIN',
      });
    adminToken = regRes.body.accessToken;

    // Create Period
    const periodRes = await request(app.getHttpServer())
      .post('/periods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Thời kỳ e2e Event',
        startYear: 1000,
        endYear: 1100,
        description: 'Mô tả thời kỳ e2e',
      });
    createdPeriodId = periodRes.body.id;

    // Create Topic
    const topicRes = await request(app.getHttpServer())
      .post('/topics')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Chủ đề e2e Event',
        periodId: createdPeriodId,
        orderIndex: 1,
      });
    createdTopicId = topicRes.body.id;
  });

  afterAll(async () => {
    await prisma.historicalEvent.deleteMany({});
    await prisma.topic.deleteMany({});
    await prisma.period.deleteMany({});
    await prisma.authUser.deleteMany({});
    await app.close();
  });

  it('POST /historical-events - should create a new historical event', async () => {
    const res = await request(app.getHttpServer())
      .post('/historical-events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Trận Như Nguyệt',
        year: 1077,
        location: 'Sông Như Nguyệt (Sông Cầu)',
        significance: 'Chống quân Tống xâm lược lần 2',
        topicId: createdTopicId,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Trận Như Nguyệt');
    expect(res.body.topicId).toBe(createdTopicId);
    createdEventId = res.body.id;
  });

  it('GET /historical-events - should return list of events', async () => {
    const res = await request(app.getHttpServer())
      .get('/historical-events')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /historical-events/:id - should return event details', async () => {
    const res = await request(app.getHttpServer())
      .get(`/historical-events/${createdEventId}`)
      .expect(200);

    expect(res.body.id).toBe(createdEventId);
    expect(res.body.title).toBe('Trận Như Nguyệt');
  });

  it('PATCH /historical-events/:id - should update event', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/historical-events/${createdEventId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Trận Như Nguyệt (Cập nhật)',
      })
      .expect(200);

    expect(res.body.title).toBe('Trận Như Nguyệt (Cập nhật)');
  });

  it('DELETE /historical-events/:id - should delete event', async () => {
    await request(app.getHttpServer())
      .delete(`/historical-events/${createdEventId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/historical-events/${createdEventId}`)
      .expect(404);
  });
});
