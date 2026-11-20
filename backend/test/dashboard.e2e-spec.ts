import { INestApplication } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import {
  E2eUser,
  createE2eApp,
  createE2eUser,
  removeE2eUsers,
} from './e2e-app';

describe('Dashboard E2E — tổng quan CMS', () => {
  let app: INestApplication;
  let editor: E2eUser;
  let learner: E2eUser;
  let reviewer: E2eUser;

  jest.setTimeout(60000);

  beforeAll(async () => {
    app = await createE2eApp();
    editor = await createE2eUser(app, UserRole.MODERATOR);
    learner = await createE2eUser(app, UserRole.USER);
    reviewer = await createE2eUser(app, UserRole.ADMIN);
  });

  afterAll(async () => {
    await removeE2eUsers(app);
    await app.close();
  });

  it('chỉ nhân sự CMS xem được: khách 401, người học 403', async () => {
    await request(app.getHttpServer()).get('/dashboard/overview').expect(401);
    await request(app.getHttpServer())
      .get('/dashboard/overview')
      .set('Authorization', learner.auth)
      .expect(403);
  });

  it('trả kho nội dung theo loại / trạng thái, việc chờ duyệt, việc của tôi, hoạt động gần đây', async () => {
    const res = await request(app.getHttpServer())
      .get('/dashboard/overview')
      .set('Authorization', editor.auth)
      .expect(200);

    const { contentStats, reviewCounts, myWork, recentActivities } =
      res.body.data;
    expect(contentStats.map((s: { type: string }) => s.type)).toEqual([
      'ARTICLE',
      'LESSON',
      'TIMELINE',
      'QUIZ',
    ]);
    expect(typeof contentStats[0].byStatus.PUBLISHED).toBe('number');
    for (const key of ['REVISION', 'ARTICLE', 'LESSON', 'BLOG', 'REPORT']) {
      expect(typeof reviewCounts[key]).toBe('number');
    }
    expect(myWork).toEqual(
      expect.objectContaining({ drafts: 0, pending: 0, rejected: [] }),
    );
    expect(Array.isArray(recentActivities)).toBe(true);
  });

  it('hàng chờ duyệt chỉ dành cho người duyệt', async () => {
    await request(app.getHttpServer())
      .get('/dashboard/review-queue')
      .set('Authorization', learner.auth)
      .expect(403);
    const res = await request(app.getHttpServer())
      .get('/dashboard/review-queue')
      .set('Authorization', reviewer.auth)
      .expect(200);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        items: expect.any(Array),
      }),
    );
  });
});
