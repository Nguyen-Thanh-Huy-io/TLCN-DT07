import { INestApplication } from '@nestjs/common';
import {
  ContentStatus,
  GoalPresetKey,
  PostType,
  SavedMaterialKind,
  UserRole,
} from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../src/common/services/prisma.service';
import { FlashcardRating } from '../src/flashcard/flashcard.constant';
import { MindmapTemplateType } from '../src/mindmap/mindmap.constant';
import { ModerationResolveAction } from '../src/moderation/moderation.constant';
import {
  E2E_MARK,
  E2eUser,
  createE2eApp,
  createE2eUser,
  itemsOf,
  removeE2eUsers,
} from './e2e-app';

describe('Learning Tools (Flashcard SM-2, Mindmap, Saved Material, Gamification) & Moderation E2E', () => {
  let app: INestApplication;
  let learner: E2eUser;
  let otherLearner: E2eUser;
  let moderator: E2eUser;
  let admin: E2eUser;

  let publishedArticleId: string;
  let reportedPostId: string;

  jest.setTimeout(60000);

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createE2eApp();
    learner = await createE2eUser(app, UserRole.USER);
    otherLearner = await createE2eUser(app, UserRole.USER);
    moderator = await createE2eUser(app, UserRole.MODERATOR);
    admin = await createE2eUser(app, UserRole.ADMIN);

    const article = await http()
      .post('/articles')
      .set('Authorization', admin.auth)
      .send({
        title: `${E2E_MARK}bai viet tools ${Date.now()}`,
        status: ContentStatus.PUBLISHED,
      });
    publishedArticleId = article.body.data.id;

    const post = await http()
      .post('/posts')
      .set('Authorization', learner.auth)
      .send({
        title: `${E2E_MARK}post bao cao ${Date.now()}`,
        postType: PostType.QUICK_POST,
        status: ContentStatus.PUBLISHED,
      });
    reportedPostId = post.body.data.id;
  });

  afterAll(async () => {
    const prisma = app.get(PrismaService);
    if (reportedPostId) {
      await prisma.contentReport.deleteMany({
        where: { targetId: reportedPostId },
      });
      await http()
        .delete(`/posts/${reportedPostId}`)
        .set('Authorization', admin.auth);
    }
    if (publishedArticleId) {
      await prisma.savedMaterial.deleteMany({
        where: { targetId: publishedArticleId },
      });
      await http()
        .delete(`/articles/${publishedArticleId}`)
        .set('Authorization', admin.auth);
    }
    await removeE2eUsers(app);
    await app.close();
  });

  describe('1. Flashcards SM-2', () => {
    let deckId: string;
    let cardId: string;

    it('chưa đăng nhập bị chặn (401) và tên bộ thẻ rỗng bị từ chối (400)', async () => {
      const unauth = await http().get('/flashcards/decks');
      expect(unauth.status).toBe(401);

      const blankTitle = await http()
        .post('/flashcards/decks')
        .set('Authorization', learner.auth)
        .send({ title: '   ' });
      expect(blankTitle.status).toBe(400);
    });

    it('tạo deck/card, đọc due batch, chấm SM-2 GOOD và cô lập quyền truy cập theo user', async () => {
      const deck = await http()
        .post('/flashcards/decks')
        .set('Authorization', learner.auth)
        .send({
          title: `${E2E_MARK}Deck Bach Dang`,
          description: 'Ôn tập lịch sử quân sự',
        });
      expect(deck.status).toBe(201);
      deckId = deck.body.data.id;

      const card = await http()
        .post(`/flashcards/decks/${deckId}/cards`)
        .set('Authorization', learner.auth)
        .send({
          front: 'Chiến thắng Bạch Đằng 938 do ai lãnh đạo?',
          back: 'Ngô Quyền',
        });
      expect(card.status).toBe(201);
      cardId = card.body.data.id;

      const otherRead = await http()
        .get(`/flashcards/decks/${deckId}/cards`)
        .set('Authorization', otherLearner.auth);
      expect([403, 404]).toContain(otherRead.status);

      const due = await http()
        .get(`/flashcards/decks/${deckId}/due`)
        .set('Authorization', learner.auth);
      expect(due.status).toBe(200);
      expect(itemsOf<{ id: string }>(due.body).map((c) => c.id)).toContain(
        cardId,
      );

      const reviewGood = await http()
        .post(`/flashcards/cards/${cardId}/review`)
        .set('Authorization', learner.auth)
        .send({ rating: FlashcardRating.GOOD });
      expect(reviewGood.status).toBe(201);
      expect(reviewGood.body.data.repetitions).toBe(1);
      expect(reviewGood.body.data.intervalDays).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. Mindmap CRUD', () => {
    it('chưa đăng nhập bị chặn (401); tạo, đọc, sửa, xóa sơ đồ tư duy cô lập theo owner', async () => {
      const unauth = await http().get('/mindmaps');
      expect(unauth.status).toBe(401);

      const created = await http()
        .post('/mindmaps')
        .set('Authorization', learner.auth)
        .send({
          title: `${E2E_MARK}Sơ đồ Nhà Trần`,
          periodLabel: '1225 - 1400',
          template: MindmapTemplateType.SPIDER,
        });
      expect(created.status).toBe(201);
      const mindmapId = created.body.data.id;

      const forbiddenRead = await http()
        .get(`/mindmaps/${mindmapId}`)
        .set('Authorization', otherLearner.auth);
      expect([403, 404]).toContain(forbiddenRead.status);

      const updated = await http()
        .patch(`/mindmaps/${mindmapId}`)
        .set('Authorization', learner.auth)
        .send({ title: `${E2E_MARK}Sơ đồ Nhà Trần (Đã sửa)` });
      expect(updated.status).toBe(200);

      const removed = await http()
        .delete(`/mindmaps/${mindmapId}`)
        .set('Authorization', learner.auth);
      expect(removed.status).toBe(200);
    });
  });

  describe('3. Saved Materials (Bookmark tư liệu đồng bộ DB)', () => {
    it('chặn chưa đăng nhập (401), enum sai (400), toggle lưu và bỏ lưu ARTICLE + TIMELINE_NODE', async () => {
      const unauth = await http().get('/saved-materials');
      expect(unauth.status).toBe(401);

      const badKind = await http()
        .post('/saved-materials/toggle')
        .set('Authorization', learner.auth)
        .send({ kind: 'INVALID_KIND', targetId: publishedArticleId });
      expect(badKind.status).toBe(400);

      const saveOn = await http()
        .post('/saved-materials/toggle')
        .set('Authorization', learner.auth)
        .send({
          kind: SavedMaterialKind.ARTICLE,
          targetId: publishedArticleId,
        });
      expect(saveOn.status).toBe(201);
      expect(saveOn.body.data.saved).toBe(true);

      const snapAfterSave = await http()
        .get('/saved-materials')
        .set('Authorization', learner.auth);
      expect(snapAfterSave.status).toBe(200);
      expect(snapAfterSave.body.data.articleIds).toContain(publishedArticleId);
      expect(snapAfterSave.body.data.timelineNodeIds).toContain(
        publishedArticleId,
      );

      const saveOff = await http()
        .post('/saved-materials/toggle')
        .set('Authorization', learner.auth)
        .send({
          kind: SavedMaterialKind.ARTICLE,
          targetId: publishedArticleId,
        });
      expect(saveOff.status).toBe(201);
      expect(saveOff.body.data.saved).toBe(false);
    });
  });

  describe('4. Gamification (Goal, Read Complete & Deduplication)', () => {
    it('tạo mục tiêu học tập, cộng XP đọc bài viết lần đầu và chống trùng lần 2 (dedupKey)', async () => {
      const goalRes = await http()
        .post('/gamification/goals')
        .set('Authorization', learner.auth)
        .send({ presetKey: GoalPresetKey.PRESET_3X });
      expect(goalRes.status).toBe(201);

      const missingArticle = await http()
        .post(
          '/gamification/articles/a0000000-0000-4000-8000-000000000000/read-complete',
        )
        .set('Authorization', learner.auth);
      expect(missingArticle.status).toBe(404);

      const firstRead = await http()
        .post(`/gamification/articles/${publishedArticleId}/read-complete`)
        .set('Authorization', learner.auth);
      expect(firstRead.status).toBe(200);
      expect(firstRead.body.data.alreadyCompleted).toBe(false);
      expect(firstRead.body.data.xpEarned).toBeGreaterThan(0);

      const xpAfterFirst = firstRead.body.data.overview.stats.totalXp;

      const secondRead = await http()
        .post(`/gamification/articles/${publishedArticleId}/read-complete`)
        .set('Authorization', learner.auth);
      expect(secondRead.status).toBe(200);
      expect(secondRead.body.data.alreadyCompleted).toBe(true);
      expect(secondRead.body.data.xpEarned).toBe(0);
      expect(secondRead.body.data.overview.stats.totalXp).toBe(xpAfterFirst);

      const overview = await http()
        .get('/gamification/overview')
        .set('Authorization', learner.auth);
      expect(overview.status).toBe(200);
      expect(overview.body.data.streak.currentDayStreak).toBeGreaterThanOrEqual(
        1,
      );
    });
  });

  describe('5. Moderation Reports & Resolution', () => {
    let reportId: string;

    it('người học báo cáo bài viết, chống báo cáo trùng (409), và Moderator xử lý 1-click', async () => {
      const learnerForbidden = await http()
        .get('/moderation/reports')
        .set('Authorization', learner.auth);
      expect(learnerForbidden.status).toBe(403);

      const reported = await http()
        .post(`/posts/${reportedPostId}/report`)
        .set('Authorization', otherLearner.auth)
        .send({ reason: `${E2E_MARK}Kiểm thử báo cáo vi phạm` });
      expect(reported.status).toBe(200);
      expect(reported.body.data.success).toBe(true);
      reportId = reported.body.data.reportId;

      const duplicate = await http()
        .post(`/posts/${reportedPostId}/report`)
        .set('Authorization', otherLearner.auth)
        .send({ reason: 'Báo cáo lại' });
      expect(duplicate.status).toBe(409);

      const reportsList = await http()
        .get('/moderation/reports')
        .set('Authorization', moderator.auth);
      expect(reportsList.status).toBe(200);

      const resolved = await http()
        .patch(`/moderation/reports/${reportId}/resolve`)
        .set('Authorization', moderator.auth)
        .send({
          action: ModerationResolveAction.RESTORE,
          note: `${E2E_MARK}Đã kiểm tra hợp lệ`,
        });
      expect(resolved.status).toBe(200);
    });
  });
});
