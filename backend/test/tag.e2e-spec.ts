import { INestApplication } from '@nestjs/common';
import { userRole } from '@prisma/client';
import request from 'supertest';
import {
  E2E_MARK,
  E2eUser,
  createE2eApp,
  createE2eUser,
  removeE2eUsers,
} from './e2e-app';

describe('Tag E2E — tạo, gắn vào bài học, xoá', () => {
  let app: INestApplication;
  let editor: E2eUser;
  let learner: E2eUser;
  let topicId = '';
  let lessonId = '';
  let tagId = '';

  jest.setTimeout(60000);

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createE2eApp();
    editor = await createE2eUser(app, userRole.MODERATOR);
    learner = await createE2eUser(app, userRole.USER);

    const topic = await http()
      .post('/topics')
      .set('Authorization', editor.auth)
      .send({ name: `${E2E_MARK}chu_de_tag_${Date.now()}` });
    topicId = topic.body.data.id;

    const lesson = await http()
      .post('/lessons')
      .set('Authorization', editor.auth)
      .send({
        title: `${E2E_MARK}Bài học gắn tag ${Date.now()}`,
        contentRichText: 'Nội dung bài học thử tag',
        topicId,
      });
    lessonId = lesson.body.data.id;
  });

  afterAll(async () => {
    const remove = (path: string) =>
      http().delete(path).set('Authorization', editor.auth);
    if (tagId) await remove(`/tags/${tagId}`);
    if (lessonId) await remove(`/lessons/${lessonId}`);
    if (topicId) await remove(`/topics/${topicId}`);
    await removeE2eUsers(app);
    await app.close();
  });

  it('người học không tạo được tag → 403', async () => {
    await http()
      .post('/tags')
      .set('Authorization', learner.auth)
      .send({ name: `${E2E_MARK}khong_duoc` })
      .expect(403);
  });

  it('biên tập viên tạo tag; tên trùng → 409', async () => {
    const name = `${E2E_MARK}Kháng chiến chống Pháp ${Date.now()}`;
    const res = await http()
      .post('/tags')
      .set('Authorization', editor.auth)
      .send({ name, colorHex: '#FF5733' })
      .expect(201);
    tagId = res.body.data.id;

    await http()
      .post('/tags')
      .set('Authorization', editor.auth)
      .send({ name })
      .expect(409);
  });

  it('danh sách tag có phân trang', async () => {
    const res = await http().get('/tags?page=1&limit=5').expect(200);

    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBeLessThanOrEqual(5);
  });

  it('gắn tag vào bài học rồi đọc lại đúng tag đó', async () => {
    const assigned = await http()
      .post(`/lessons/${lessonId}/tags`)
      .set('Authorization', editor.auth)
      .send({ tagIds: [tagId] })
      .expect(201);
    expect(assigned.body.data.map((t: { id: string }) => t.id)).toEqual([
      tagId,
    ]);

    const listed = await http()
      .get(`/lessons/${lessonId}/tags`)
      .set('Authorization', editor.auth)
      .expect(200);
    expect(listed.body.data.map((t: { id: string }) => t.id)).toEqual([tagId]);
  });

  it('xoá tag', async () => {
    await http()
      .delete(`/tags/${tagId}`)
      .set('Authorization', editor.auth)
      .expect(200);
    tagId = '';
  });
});
