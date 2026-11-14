import { INestApplication } from '@nestjs/common';
import { ContentStatus, UserRole } from '@prisma/client';
import request from 'supertest';
import { LEARNER_ERROR_CODES } from '../src/learner/learner.constant';
import {
  E2E_MARK,
  E2eUser,
  createE2eApp,
  createE2eUser,
  removeE2eUsers,
} from './e2e-app';

/**
 * Lộ trình học: dựng lộ trình → chương → gom bài; người học đăng ký mới đọc được bài, đánh dấu hoàn thành;
 * đổi trạng thái chỉ gửi `status`; lưu trữ thì không đăng ký mới được nữa.
 */
describe('Learning path E2E — dựng lộ trình, người học đăng ký và đọc bài', () => {
  let app: INestApplication;
  let editor: E2eUser;
  let reviewer: E2eUser;
  let learner: E2eUser;
  let topicId: string;
  let lessonId: string;
  let lessonSlug: string;
  let pathId: string;
  let chapterId: string;

  jest.setTimeout(60000);

  const http = () => request(app.getHttpServer());
  const learning = (path = '') => `/me/learning${path}`;
  const setPathStatus = (user: E2eUser, status: ContentStatus) =>
    http()
      .put(`/learning-paths/${pathId}`)
      .set('Authorization', user.auth)
      .send({ status });

  beforeAll(async () => {
    app = await createE2eApp();
    editor = await createE2eUser(app, UserRole.MODERATOR);
    reviewer = await createE2eUser(app, UserRole.ADMIN);
    learner = await createE2eUser(app, UserRole.USER);

    const topic = await http()
      .post('/topics')
      .set('Authorization', reviewer.auth)
      .send({
        name: `${E2E_MARK}chu de lo trinh ${Date.now()}`,
        status: ContentStatus.PUBLISHED,
      });
    topicId = topic.body.data.id;

    const lesson = await http()
      .post('/lessons')
      .set('Authorization', editor.auth)
      .send({
        title: `${E2E_MARK}bai hoc lo trinh ${Date.now()}`,
        topicId,
        status: ContentStatus.PENDING_REVIEW,
      });
    lessonId = lesson.body.data.id;
    lessonSlug = lesson.body.data.slug;
    await http()
      .patch(`/lessons/${lessonId}/review`)
      .set('Authorization', reviewer.auth)
      .send({ status: ContentStatus.PUBLISHED });
  });

  afterAll(async () => {
    if (pathId) {
      await http()
        .delete(`/learning-paths/${pathId}`)
        .set('Authorization', reviewer.auth);
    }
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

  describe('dựng lộ trình', () => {
    it('biên tập viên tạo lộ trình nháp, chương và gom bài', async () => {
      const path = await http()
        .post('/learning-paths')
        .set('Authorization', editor.auth)
        .send({ title: `${E2E_MARK}lo trinh ${Date.now()}` });
      expect(path.status).toBe(201);
      expect(path.body.data.status).toBe(ContentStatus.DRAFT);
      pathId = path.body.data.id;

      const chapter = await http()
        .post('/learning-paths/chapters')
        .set('Authorization', editor.auth)
        .send({ learningPathId: pathId, title: 'Chương 1' });
      expect(chapter.status).toBe(201);
      chapterId = chapter.body.data.id;

      const added = await http()
        .post(`/learning-paths/chapters/${chapterId}/lessons`)
        .set('Authorization', editor.auth)
        .send({ lessonIds: [lessonId] });
      expect(added.status).toBe(201);
    });

    it('biên tập viên không tự xuất bản lộ trình', async () => {
      expect(
        (await setPathStatus(editor, ContentStatus.PUBLISHED)).status,
      ).toBe(403);
    });

    it('lộ trình nháp thì người học không đăng ký được', async () => {
      const res = await http()
        .post(learning(`/paths/${pathId}/enroll`))
        .set('Authorization', learner.auth);
      expect(res.status).toBe(404);
    });

    it('người duyệt xuất bản chỉ bằng `status` (không gửi lại tiêu đề)', async () => {
      const res = await setPathStatus(reviewer, ContentStatus.PUBLISHED);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(ContentStatus.PUBLISHED);
      expect(res.body.data.title).toContain(E2E_MARK);
    });
  });

  describe('người học', () => {
    it('chưa đăng nhập thì không đọc được bài', async () => {
      expect(
        (await http().get(learning(`/lessons/${lessonSlug}`))).status,
      ).toBe(401);
    });

    it('chưa đăng ký lộ trình → 403 NOT_ENROLLED', async () => {
      const res = await http()
        .get(learning(`/lessons/${lessonSlug}`))
        .set('Authorization', learner.auth);
      expect(res.status).toBe(403);
      expect(JSON.stringify(res.body)).toContain(
        LEARNER_ERROR_CODES.NOT_ENROLLED,
      );
    });

    it('đăng ký rồi đọc được bài và đánh dấu hoàn thành', async () => {
      const enrolled = await http()
        .post(learning(`/paths/${pathId}/enroll`))
        .set('Authorization', learner.auth);
      expect(enrolled.status).toBe(200);
      expect(enrolled.body.data.enrolledPathIds).toContain(pathId);

      const read = await http()
        .get(learning(`/lessons/${lessonSlug}`))
        .set('Authorization', learner.auth);
      expect(read.status).toBe(200);
      expect(read.body.data.lesson.id).toBe(lessonId);

      const done = await http()
        .post(learning(`/lessons/${lessonId}/complete`))
        .set('Authorization', learner.auth);
      expect(done.status).toBe(200);
      expect(done.body.data.completedLessonIds).toContain(lessonId);
    });

    it('huỷ đăng ký thì không đọc được nữa', async () => {
      const left = await http()
        .delete(learning(`/paths/${pathId}/enroll`))
        .set('Authorization', learner.auth);
      expect(left.status).toBe(200);
      expect(left.body.data.enrolledPathIds).not.toContain(pathId);

      const read = await http()
        .get(learning(`/lessons/${lessonSlug}`))
        .set('Authorization', learner.auth);
      expect(read.status).toBe(403);
    });
  });

  describe('lưu trữ lộ trình', () => {
    it('lưu trữ thì không đăng ký mới được; khôi phục chỉ về nháp', async () => {
      const archived = await setPathStatus(reviewer, ContentStatus.ARCHIVED);
      expect(archived.status).toBe(200);

      const enroll = await http()
        .post(learning(`/paths/${pathId}/enroll`))
        .set('Authorization', learner.auth);
      expect(enroll.status).toBe(404);

      expect(
        (await setPathStatus(reviewer, ContentStatus.PUBLISHED)).status,
      ).toBe(400);
      expect((await setPathStatus(reviewer, ContentStatus.DRAFT)).status).toBe(
        200,
      );
    });
  });
});
