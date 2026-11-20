import { INestApplication } from '@nestjs/common';
import { ContentStatus, UserRole } from '@prisma/client';
import request from 'supertest';
import {
  E2E_MARK,
  E2eUser,
  createE2eApp,
  createE2eUser,
  itemsOf,
  removeE2eUsers,
} from './e2e-app';

interface TagRow {
  id: string;
  _count: { articleTags: number };
}

/**
 * Bài viết: biên tập viên soạn → người duyệt khác duyệt → hiện công khai → lưu trữ → khôi phục.
 * Kèm cache danh sách Tag (số bài dùng tag phải đổi ngay khi gắn/xoá).
 */
describe('Article E2E — duyệt 2 người, công khai, lưu trữ', () => {
  let app: INestApplication;
  let editor: E2eUser;
  let reviewer: E2eUser;
  let tagId: string;
  const articleIds: string[] = [];

  jest.setTimeout(60000);

  const http = () => request(app.getHttpServer());

  const createArticle = async (
    user: E2eUser,
    body: Record<string, unknown>,
  ) => {
    const res = await http()
      .post('/articles')
      .set('Authorization', user.auth)
      .send({ title: `${E2E_MARK}bai ${Date.now()}`, ...body });
    if (res.status === 201) articleIds.push(res.body.data.id);
    return res;
  };

  const tagUsage = async (): Promise<number | undefined> => {
    const res = await http()
      .get('/tags?limit=100')
      .set('Authorization', editor.auth);
    return itemsOf<TagRow>(res.body).find((t) => t.id === tagId)?._count
      .articleTags;
  };

  beforeAll(async () => {
    app = await createE2eApp();
    editor = await createE2eUser(app, UserRole.MODERATOR);
    reviewer = await createE2eUser(app, UserRole.ADMIN);
    const tag = await http()
      .post('/tags')
      .set('Authorization', reviewer.auth)
      .send({ name: `${E2E_MARK}tag ${Date.now()}` });
    tagId = tag.body.data.id;
  });

  afterAll(async () => {
    for (const id of articleIds) {
      await http()
        .delete(`/articles/${id}`)
        .set('Authorization', reviewer.auth);
    }
    if (tagId) {
      await http().delete(`/tags/${tagId}`).set('Authorization', reviewer.auth);
    }
    await removeE2eUsers(app);
    await app.close();
  });

  describe('quy trình duyệt', () => {
    let articleId: string;
    let slug: string;

    it('biên tập viên không tạo thẳng bài đã xuất bản', async () => {
      const res = await createArticle(editor, {
        status: ContentStatus.PUBLISHED,
      });
      expect(res.status).toBe(403);
    });

    it('biên tập viên tạo bản nháp, bản nháp không hiện công khai', async () => {
      const res = await createArticle(editor, { status: ContentStatus.DRAFT });
      expect(res.status).toBe(201);
      articleId = res.body.data.id;
      slug = res.body.data.slug;

      const pub = await http().get(`/public/articles/${slug}`);
      expect(pub.status).toBe(404);
    });

    it('người duyệt không duyệt bài chưa gửi duyệt', async () => {
      const res = await http()
        .patch(`/articles/${articleId}/review`)
        .set('Authorization', reviewer.auth)
        .send({ status: ContentStatus.PUBLISHED });
      expect(res.status).toBe(403);
    });

    it('biên tập viên gửi duyệt, người duyệt khác xuất bản → hiện công khai', async () => {
      const sent = await http()
        .patch(`/articles/${articleId}`)
        .set('Authorization', editor.auth)
        .send({ status: ContentStatus.PENDING_REVIEW });
      expect(sent.status).toBe(200);

      const reviewed = await http()
        .patch(`/articles/${articleId}/review`)
        .set('Authorization', reviewer.auth)
        .send({ status: ContentStatus.PUBLISHED });
      expect(reviewed.status).toBe(200);

      const pub = await http().get(`/public/articles/${slug}`);
      expect(pub.status).toBe(200);
      expect(pub.body.data.title).toContain(E2E_MARK);
    });

    it('người duyệt không tự duyệt bài của chính mình', async () => {
      const own = await createArticle(reviewer, {
        status: ContentStatus.PENDING_REVIEW,
      });
      const res = await http()
        .patch(`/articles/${own.body.data.id}/review`)
        .set('Authorization', reviewer.auth)
        .send({ status: ContentStatus.PUBLISHED });
      expect(res.status).toBe(403);
    });

    it('từ chối bắt buộc có lý do', async () => {
      const pending = await createArticle(editor, {
        status: ContentStatus.PENDING_REVIEW,
      });
      const res = await http()
        .patch(`/articles/${pending.body.data.id}/review`)
        .set('Authorization', reviewer.auth)
        .send({ status: ContentStatus.REJECTED });
      expect(res.status).toBe(400);
    });
  });

  describe('lưu trữ: PUBLISHED → ARCHIVED → DRAFT', () => {
    let articleId: string;
    let slug: string;

    beforeAll(async () => {
      const res = await createArticle(reviewer, {
        status: ContentStatus.PUBLISHED,
      });
      articleId = res.body.data.id;
      slug = res.body.data.slug;
    });

    const setStatus = (user: E2eUser, status: ContentStatus) =>
      http()
        .patch(`/articles/${articleId}`)
        .set('Authorization', user.auth)
        .send({ status });

    it('biên tập viên không lưu trữ được', async () => {
      expect((await setStatus(editor, ContentStatus.ARCHIVED)).status).toBe(
        403,
      );
    });

    it('người duyệt lưu trữ → biến khỏi trang và danh sách công khai, vẫn còn trong CMS', async () => {
      const res = await setStatus(reviewer, ContentStatus.ARCHIVED);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(ContentStatus.ARCHIVED);

      expect((await http().get(`/public/articles/${slug}`)).status).toBe(404);
      const publicList = await http().get('/public/articles?limit=100');
      expect(
        itemsOf<{ id: string }>(publicList.body).some(
          (a) => a.id === articleId,
        ),
      ).toBe(false);

      const cms = await http()
        .get(`/articles?status=${ContentStatus.ARCHIVED}&limit=100`)
        .set('Authorization', reviewer.auth);
      expect(
        itemsOf<{ id: string }>(cms.body).some((a) => a.id === articleId),
      ).toBe(true);
    });

    it('biên tập viên không sửa bài đang lưu trữ', async () => {
      const res = await http()
        .patch(`/articles/${articleId}`)
        .set('Authorization', editor.auth)
        .send({ summary: 'sửa thử' });
      expect(res.status).toBe(403);
    });

    it('từ lưu trữ không xuất bản lại thẳng', async () => {
      expect((await setStatus(reviewer, ContentStatus.PUBLISHED)).status).toBe(
        400,
      );
    });

    it('khôi phục về nháp, rồi không lưu trữ được bản nháp', async () => {
      const restored = await setStatus(reviewer, ContentStatus.DRAFT);
      expect(restored.status).toBe(200);
      expect(restored.body.data.status).toBe(ContentStatus.DRAFT);

      expect((await setStatus(reviewer, ContentStatus.ARCHIVED)).status).toBe(
        400,
      );
    });

    it('không tạo mới thẳng ở trạng thái lưu trữ', async () => {
      const res = await createArticle(reviewer, {
        status: ContentStatus.ARCHIVED,
      });
      expect(res.status).toBe(400);
    });
  });

  describe('cache danh sách Tag', () => {
    it('gắn tag rồi xoá bài thì số bài dùng tag đổi ngay', async () => {
      const before = await tagUsage();
      expect(before).toBe(0);

      const article = await createArticle(editor, {
        status: ContentStatus.DRAFT,
      });
      const tagged = await http()
        .patch(`/articles/${article.body.data.id}`)
        .set('Authorization', editor.auth)
        .send({ tagIds: [tagId] });
      expect(tagged.status).toBe(200);
      expect(await tagUsage()).toBe(1);

      const removed = await http()
        .delete(`/articles/${article.body.data.id}`)
        .set('Authorization', editor.auth);
      expect(removed.status).toBe(200);
      expect(await tagUsage()).toBe(0);
    });
  });
});
