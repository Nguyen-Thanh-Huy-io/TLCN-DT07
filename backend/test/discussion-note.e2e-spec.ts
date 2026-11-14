import { INestApplication } from '@nestjs/common';
import {
  ContentStatus,
  DiscussionTargetType,
  NoteTargetType,
  NotificationType,
  UserRole,
} from '@prisma/client';
import request from 'supertest';
import {
  E2E_MARK,
  E2eUser,
  createE2eApp,
  createE2eUser,
  itemsOf,
  removeE2eUsers,
} from './e2e-app';

const GUEST_HEADER = 'x-guest-id';

/**
 * Hỏi đáp (chỉ gắn Bài học, câu trả lời của ban biên soạn là "chính thức" và báo cho người hỏi)
 * và ghi chú cá nhân (Bài học / Bài viết — chỉ chủ ghi chú, kể cả khách theo guestId, mới thấy).
 */
describe('Discussion & Note E2E — hỏi đáp bài học, ghi chú cá nhân', () => {
  let app: INestApplication;
  let reviewer: E2eUser;
  let editor: E2eUser;
  let asker: E2eUser;
  let stranger: E2eUser;
  let topicId: string;
  let lessonId: string;
  let articleId: string;

  jest.setTimeout(60000);

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createE2eApp();
    reviewer = await createE2eUser(app, UserRole.ADMIN);
    editor = await createE2eUser(app, UserRole.MODERATOR);
    asker = await createE2eUser(app, UserRole.USER);
    stranger = await createE2eUser(app, UserRole.USER);

    const topic = await http()
      .post('/topics')
      .set('Authorization', reviewer.auth)
      .send({
        name: `${E2E_MARK}chu de hoi dap ${Date.now()}`,
        status: ContentStatus.PUBLISHED,
      });
    topicId = topic.body.data.id;
    const lesson = await http()
      .post('/lessons')
      .set('Authorization', editor.auth)
      .send({ title: `${E2E_MARK}bai hoi dap ${Date.now()}`, topicId });
    lessonId = lesson.body.data.id;
    const article = await http()
      .post('/articles')
      .set('Authorization', reviewer.auth)
      .send({
        title: `${E2E_MARK}bai viet ghi chu ${Date.now()}`,
        status: ContentStatus.PUBLISHED,
      });
    articleId = article.body.data.id;
  });

  afterAll(async () => {
    // Thread, reply, thông báo, ghi chú tự xoá theo tài khoản (Cascade); nội dung xoá tay.
    await removeE2eUsers(app);
    await http()
      .delete(`/articles/${articleId}`)
      .set('Authorization', reviewer.auth);
    await http()
      .delete(`/lessons/${lessonId}`)
      .set('Authorization', reviewer.auth);
    await http()
      .delete(`/topics/${topicId}`)
      .set('Authorization', reviewer.auth);
    await app.close();
  });

  describe('hỏi đáp', () => {
    let threadId: string;

    it('chưa đăng nhập không đặt câu hỏi được', async () => {
      const res = await http().post('/discussions').send({
        targetType: DiscussionTargetType.LESSON,
        targetId: lessonId,
        title: 'Câu hỏi',
        content: 'Nội dung',
      });
      expect(res.status).toBe(401);
    });

    it('không đặt câu hỏi cho Bài viết (hỏi đáp chỉ ở Bài học)', async () => {
      const res = await http()
        .post('/discussions')
        .set('Authorization', asker.auth)
        .send({
          targetType: 'ARTICLE',
          targetId: articleId,
          title: 'Câu hỏi',
          content: 'Nội dung',
        });
      expect(res.status).toBe(400);
    });

    it('người học hỏi trên bài học, ban biên soạn trả lời chính thức', async () => {
      const thread = await http()
        .post('/discussions')
        .set('Authorization', asker.auth)
        .send({
          targetType: DiscussionTargetType.LESSON,
          targetId: lessonId,
          title: `${E2E_MARK}Vì sao chọn sông Bạch Đằng?`,
          content: 'Em muốn hỏi về thuỷ triều.',
        });
      expect(thread.status).toBe(201);
      threadId = thread.body.data.id;

      const reply = await http()
        .post(`/discussions/${threadId}/replies`)
        .set('Authorization', editor.auth)
        .send({ content: 'Biên độ triều lớn, địa hình hiểm trở.' });
      expect(reply.status).toBe(201);
      expect(reply.body.data.isOfficial).toBe(true);

      const detail = await http().get(`/discussions/${threadId}`);
      expect(detail.status).toBe(200);
      expect(detail.body.data.isAnswered).toBe(true);
    });

    it('người hỏi nhận thông báo có câu trả lời chính thức', async () => {
      const res = await http()
        .get('/notifications')
        .set('Authorization', asker.auth);
      expect(res.status).toBe(200);
      const types = itemsOf<{ type: NotificationType }>(res.body).map(
        (n) => n.type,
      );
      expect(types).toContain(NotificationType.OFFICIAL_REPLY);
    });

    it('danh sách lọc theo bài học có câu hỏi vừa đặt', async () => {
      const res = await http().get(
        `/discussions?targetType=${DiscussionTargetType.LESSON}&targetId=${lessonId}`,
      );
      expect(res.status).toBe(200);
      expect(itemsOf<{ id: string }>(res.body).map((t) => t.id)).toContain(
        threadId,
      );
    });

    it('người khác không xoá được câu hỏi của người hỏi', async () => {
      const res = await http()
        .delete(`/discussions/${threadId}`)
        .set('Authorization', stranger.auth);
      expect(res.status).toBe(403);
    });
  });

  describe('ghi chú cá nhân', () => {
    let lessonNoteId: string;
    const guestId = `${E2E_MARK}guest_${Date.now()}`;

    const createNote = (
      targetType: NoteTargetType,
      targetId: string,
      user?: E2eUser,
    ) => {
      const req = http()
        .post('/notes')
        .send({ targetType, targetId, content: `${E2E_MARK}ghi chu` });
      return user
        ? req.set('Authorization', user.auth)
        : req.set(GUEST_HEADER, guestId);
    };

    it('người học ghi chú trên bài học và bài viết', async () => {
      const onLesson = await createNote(NoteTargetType.LESSON, lessonId, asker);
      expect(onLesson.status).toBe(201);
      lessonNoteId = onLesson.body.data.id;

      const onArticle = await createNote(
        NoteTargetType.ARTICLE,
        articleId,
        asker,
      );
      expect(onArticle.status).toBe(201);
    });

    it('chủ ghi chú thấy ghi chú của mình theo bài', async () => {
      const res = await http()
        .get(`/notes?targetType=${NoteTargetType.LESSON}&targetId=${lessonId}`)
        .set('Authorization', asker.auth);
      expect(itemsOf<{ id: string }>(res.body).map((n) => n.id)).toEqual([
        lessonNoteId,
      ]);
    });

    it('người khác không thấy, không sửa, không xoá được ghi chú', async () => {
      const list = await http()
        .get(`/notes?targetType=${NoteTargetType.LESSON}&targetId=${lessonId}`)
        .set('Authorization', stranger.auth);
      expect(itemsOf(list.body)).toHaveLength(0);

      for (const res of [
        await http()
          .get(`/notes/${lessonNoteId}`)
          .set('Authorization', stranger.auth),
        await http()
          .patch(`/notes/${lessonNoteId}`)
          .set('Authorization', stranger.auth)
          .send({ content: 'sửa trộm' }),
        await http()
          .delete(`/notes/${lessonNoteId}`)
          .set('Authorization', stranger.auth),
      ]) {
        expect(res.status).toBe(403);
      }
    });

    it('không đăng nhập và không có mã khách thì không xem được ghi chú của ai', async () => {
      const res = await http().get('/notes');
      expect(res.status).toBe(200);
      expect(itemsOf(res.body)).toHaveLength(0);
    });

    it('khách ghi chú theo mã khách, chỉ mã đó thấy', async () => {
      const created = await createNote(NoteTargetType.ARTICLE, articleId);
      expect(created.status).toBe(201);

      const own = await http().get('/notes').set(GUEST_HEADER, guestId);
      expect(itemsOf<{ id: string }>(own.body).map((n) => n.id)).toEqual([
        created.body.data.id,
      ]);

      const other = await http()
        .get('/notes')
        .set(GUEST_HEADER, `${guestId}_khac`);
      expect(itemsOf(other.body)).toHaveLength(0);

      const removed = await http()
        .delete(`/notes/${created.body.data.id}`)
        .set(GUEST_HEADER, guestId);
      expect(removed.status).toBe(200);
    });

    it('chủ ghi chú sửa và xoá được', async () => {
      const updated = await http()
        .patch(`/notes/${lessonNoteId}`)
        .set('Authorization', asker.auth)
        .send({ content: 'đã sửa' });
      expect(updated.status).toBe(200);
      expect(updated.body.data.content).toBe('đã sửa');

      const removed = await http()
        .delete(`/notes/${lessonNoteId}`)
        .set('Authorization', asker.auth);
      expect(removed.status).toBe(200);
    });
  });
});
