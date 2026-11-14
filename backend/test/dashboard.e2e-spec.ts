import { INestApplication } from '@nestjs/common';
import { userRole } from '@prisma/client';
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

  jest.setTimeout(60000);

  beforeAll(async () => {
    app = await createE2eApp();
    editor = await createE2eUser(app, userRole.MODERATOR);
    learner = await createE2eUser(app, userRole.USER);
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

  it('trả đủ số liệu, hoạt động gần đây, bài chờ duyệt và phân bổ nội dung', async () => {
    const res = await request(app.getHttpServer())
      .get('/dashboard/overview')
      .set('Authorization', editor.auth)
      .expect(200);

    const { counts, recentActivities, pendingLessons, distribution } =
      res.body.data;
    for (const key of [
      'articlesCount',
      'topicsCount',
      'lessonsCount',
      'pendingLessonsCount',
      'timelinesCount',
      'totalKnowledgeCount',
    ]) {
      expect(typeof counts[key]).toBe('number');
    }
    expect(Array.isArray(recentActivities)).toBe(true);
    expect(Array.isArray(pendingLessons)).toBe(true);
    for (const key of ['published', 'draft', 'pendingReview']) {
      expect(typeof distribution[key]).toBe('number');
    }
  });
});
