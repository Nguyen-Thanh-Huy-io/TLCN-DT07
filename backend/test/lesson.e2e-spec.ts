import { INestApplication } from '@nestjs/common';
import { LessonStatus, userRole } from '@prisma/client';
import request from 'supertest';
import {
  E2E_MARK,
  E2eUser,
  createE2eApp,
  createE2eUser,
  removeE2eUsers,
} from './e2e-app';

describe('Lesson E2E — tạo, xem, duyệt 2 người, xoá', () => {
  let app: INestApplication;
  let editor: E2eUser;
  let reviewer: E2eUser;
  let learner: E2eUser;
  let topicId = '';
  let lessonId = '';

  jest.setTimeout(60000);

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createE2eApp();
    editor = await createE2eUser(app, userRole.MODERATOR);
    reviewer = await createE2eUser(app, userRole.ADMIN);
    learner = await createE2eUser(app, userRole.USER);

    const topic = await http()
      .post('/topics')
      .set('Authorization', editor.auth)
      .send({ name: `${E2E_MARK}chu_de_${Date.now()}` });
    topicId = topic.body.data.id;
  });

  afterAll(async () => {
    if (lessonId) {
      await http()
        .delete(`/lessons/${lessonId}`)
        .set('Authorization', reviewer.auth);
    }
    if (topicId) {
      await http()
        .delete(`/topics/${topicId}`)
        .set('Authorization', reviewer.auth);
    }
    await removeE2eUsers(app);
    await app.close();
  });

  describe('POST /lessons', () => {
    const body = () => ({
      title: `${E2E_MARK}Trận Bạch Đằng năm 938 ${Date.now()}`,
      contentRichText: '<p>Diễn biến trận đánh cọc gỗ trên sông Bạch Đằng.</p>',
      difficulty: 'MEDIUM',
      topicId,
    });

    it('chưa đăng nhập → 401; người học → 403', async () => {
      await http().post('/lessons').send(body()).expect(401);
      await http()
        .post('/lessons')
        .set('Authorization', learner.auth)
        .send(body())
        .expect(403);
    });

    it('thiếu chủ đề → 400', async () => {
      await http()
        .post('/lessons')
        .set('Authorization', editor.auth)
        .send({ ...body(), topicId: undefined })
        .expect(400);
    });

    it('biên tập viên tạo bài nháp thành công', async () => {
      const res = await http()
        .post('/lessons')
        .set('Authorization', editor.auth)
        .send(body())
        .expect(201);

      expect(res.body.data).toMatchObject({
        status: LessonStatus.DRAFT,
        topicId,
      });
      expect(res.body.data.estimatedReadMinutes).toBeDefined();
      lessonId = res.body.data.id;
    });
  });

  describe('GET /lessons', () => {
    it('danh sách có phân trang và có bài vừa tạo', async () => {
      const res = await http()
        .get('/lessons?page=1&limit=50')
        .set('Authorization', editor.auth)
        .expect(200);

      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.map((l: { id: string }) => l.id)).toContain(
        lessonId,
      );
    });

    it('chi tiết bài học; người học không xem được bản CMS', async () => {
      const res = await http()
        .get(`/lessons/${lessonId}`)
        .set('Authorization', editor.auth)
        .expect(200);
      expect(res.body.data.id).toBe(lessonId);

      await http()
        .get(`/lessons/${lessonId}`)
        .set('Authorization', learner.auth)
        .expect(403);
    });
  });

  describe('PATCH /lessons/:id/review — duyệt 2 người', () => {
    it('bài chưa gửi duyệt thì không duyệt được', async () => {
      await http()
        .patch(`/lessons/${lessonId}/review`)
        .set('Authorization', reviewer.auth)
        .send({ status: LessonStatus.PUBLISHED })
        .expect(403);
    });

    it('biên tập viên gửi duyệt', async () => {
      const res = await http()
        .patch(`/lessons/${lessonId}`)
        .set('Authorization', editor.auth)
        .send({ status: LessonStatus.REVIEW })
        .expect(200);
      expect(res.body.data.status).toBe(LessonStatus.REVIEW);
    });

    it('biên tập viên không có quyền duyệt', async () => {
      await http()
        .patch(`/lessons/${lessonId}/review`)
        .set('Authorization', editor.auth)
        .send({ status: LessonStatus.PUBLISHED })
        .expect(403);
    });

    it('từ chối không kèm lý do → 400', async () => {
      await http()
        .patch(`/lessons/${lessonId}/review`)
        .set('Authorization', reviewer.auth)
        .send({ status: LessonStatus.REJECTED })
        .expect(400);
    });

    it('người duyệt xuất bản thành công', async () => {
      const res = await http()
        .patch(`/lessons/${lessonId}/review`)
        .set('Authorization', reviewer.auth)
        .send({ status: LessonStatus.PUBLISHED })
        .expect(200);

      expect(res.body.data.status).toBe(LessonStatus.PUBLISHED);
      expect(res.body.data.publishedAt).toBeTruthy();
    });
  });

  describe('DELETE /lessons/:id', () => {
    it('xoá xong thì không còn tìm thấy', async () => {
      await http()
        .delete(`/lessons/${lessonId}`)
        .set('Authorization', reviewer.auth)
        .expect(200);
      await http()
        .get(`/lessons/${lessonId}`)
        .set('Authorization', reviewer.auth)
        .expect(404);
      lessonId = '';
    });
  });
});
