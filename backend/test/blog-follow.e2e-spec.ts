import { INestApplication } from '@nestjs/common';
import {
  ContentStatus,
  NotificationType,
  PostType,
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

async function waitForNotificationType(
  getNotifications: () => Promise<request.Response>,
  expectedType: NotificationType,
  attempts = 10,
): Promise<NotificationType[]> {
  let types: NotificationType[] = [];
  for (let i = 0; i < attempts; i += 1) {
    const res = await getNotifications();
    types = itemsOf<{ type: NotificationType }>(res.body).map((n) => n.type);
    if (types.includes(expectedType)) {
      return types;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return types;
}

describe('Blog, Community & Author Follow E2E', () => {
  let app: INestApplication;
  let author: E2eUser;
  let follower: E2eUser;
  let reviewer: E2eUser;
  const createdPostIds: string[] = [];

  jest.setTimeout(60000);

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createE2eApp();
    author = await createE2eUser(app, UserRole.USER);
    follower = await createE2eUser(app, UserRole.USER);
    reviewer = await createE2eUser(app, UserRole.ADMIN);
  });

  afterAll(async () => {
    for (const postId of createdPostIds) {
      await http()
        .delete(`/posts/${postId}`)
        .set('Authorization', reviewer.auth);
    }
    await removeE2eUsers(app);
    await app.close();
  });

  describe('1. Quyền xuất bản Blog & Quy trình duyệt', () => {
    let longFormPostId: string;
    let longFormSlug: string;

    it('chưa đăng nhập không thể tạo bài viết (401)', async () => {
      const res = await http()
        .post('/posts')
        .send({
          title: `${E2E_MARK}unauth post`,
          postType: PostType.QUICK_POST,
        });
      expect(res.status).toBe(401);
    });

    it('người học không được tự xuất bản thẳng bài LONG_FORM (403)', async () => {
      const res = await http()
        .post('/posts')
        .set('Authorization', author.auth)
        .send({
          title: `${E2E_MARK}long form direct ${Date.now()}`,
          postType: PostType.LONG_FORM,
          status: ContentStatus.PUBLISHED,
        });
      expect(res.status).toBe(403);
    });

    it('người học gửi duyệt LONG_FORM, reviewer bắt buộc lý do nếu từ chối, và duyệt PUBLISHED thành công', async () => {
      const created = await http()
        .post('/posts')
        .set('Authorization', author.auth)
        .send({
          title: `${E2E_MARK}chuyen khao ${Date.now()}`,
          postType: PostType.LONG_FORM,
          status: ContentStatus.PENDING_REVIEW,
          excerpt: 'Tóm tắt chuyên khảo lịch sử.',
        });
      expect(created.status).toBe(201);
      longFormPostId = created.body.data.id;
      longFormSlug = created.body.data.slug;
      createdPostIds.push(longFormPostId);

      const nonReviewerAttempt = await http()
        .patch(`/posts/${longFormPostId}/review`)
        .set('Authorization', follower.auth)
        .send({ status: ContentStatus.PUBLISHED });
      expect(nonReviewerAttempt.status).toBe(403);

      const rejectWithoutReason = await http()
        .patch(`/posts/${longFormPostId}/review`)
        .set('Authorization', reviewer.auth)
        .send({ status: ContentStatus.REJECTED, rejectionReason: '   ' });
      expect(rejectWithoutReason.status).toBe(400);

      const approved = await http()
        .patch(`/posts/${longFormPostId}/review`)
        .set('Authorization', reviewer.auth)
        .send({ status: ContentStatus.PUBLISHED });
      expect(approved.status).toBe(200);
      expect(approved.body.data.status).toBe(ContentStatus.PUBLISHED);

      const detail = await http().get(`/posts/${longFormSlug}`);
      expect(detail.status).toBe(200);
      expect(detail.body.data.id).toBe(longFormPostId);
    });
  });

  describe('2. Tương tác Cộng đồng: Like, Bookmark, Comment', () => {
    let quickPostId: string;

    it('tạo QUICK_POST, like, bookmark và bình luận lồng nhánh thành công', async () => {
      const created = await http()
        .post('/posts')
        .set('Authorization', author.auth)
        .send({
          title: `${E2E_MARK}quick post ${Date.now()}`,
          postType: PostType.QUICK_POST,
          status: ContentStatus.PUBLISHED,
        });
      expect(created.status).toBe(201);
      quickPostId = created.body.data.id;
      createdPostIds.push(quickPostId);

      const likeRes = await http()
        .post(`/posts/${quickPostId}/like`)
        .set('Authorization', follower.auth);
      expect(likeRes.status).toBe(200);
      expect(likeRes.body.data).toMatchObject({ liked: true, likeCount: 1 });

      const bookmarkRes = await http()
        .post(`/posts/${quickPostId}/bookmark`)
        .set('Authorization', follower.auth);
      expect(bookmarkRes.status).toBe(200);
      expect(bookmarkRes.body.data.bookmarked).toBe(true);

      const bookmarks = await http()
        .get('/posts/bookmarks/me')
        .set('Authorization', follower.auth);
      expect(bookmarks.status).toBe(200);
      expect(
        itemsOf<{ id: string }>(bookmarks.body).map((p) => p.id),
      ).toContain(quickPostId);

      const commentRes = await http()
        .post(`/posts/${quickPostId}/comments`)
        .set('Authorization', follower.auth)
        .send({ content: `${E2E_MARK}Bình luận mở đầu` });
      expect(commentRes.status).toBe(201);
      const commentId = commentRes.body.data.id;

      const replyRes = await http()
        .post(`/posts/${quickPostId}/comments`)
        .set('Authorization', author.auth)
        .send({ content: `${E2E_MARK}Phản hồi`, parentId: commentId });
      expect(replyRes.status).toBe(201);

      const commentList = await http().get(`/posts/${quickPostId}/comments`);
      expect(commentList.status).toBe(200);
      expect(itemsOf<{ id: string }>(commentList.body).length).toBeGreaterThan(
        0,
      );
    });
  });

  describe('3. Author Follow & Hồ sơ Cộng đồng', () => {
    it('chưa đăng nhập không thể follow (401); không thể tự follow chính mình (400); target lạ trả 404', async () => {
      const unauth = await http().post(`/posts/users/${author.id}/follow`);
      expect(unauth.status).toBe(401);

      const selfFollow = await http()
        .post(`/posts/users/${author.id}/follow`)
        .set('Authorization', author.auth);
      expect(selfFollow.status).toBe(400);

      const missingFollow = await http()
        .post('/posts/users/non_existent_member_xyz_999/follow')
        .set('Authorization', follower.auth);
      expect(missingFollow.status).toBe(404);
    });

    it('follow / kiểm tra follow-status / nhận notification / cập nhật bio / unfollow', async () => {
      const bioText = `${E2E_MARK}Nghiên cứu triều Lý Trần`;
      const patchBio = await http()
        .patch('/posts/users/me/profile')
        .set('Authorization', author.auth)
        .send({ bio: bioText });
      expect(patchBio.status).toBe(200);

      const myProfile = await http()
        .get('/posts/users/me/profile')
        .set('Authorization', author.auth);
      expect(myProfile.status).toBe(200);
      expect(myProfile.body.data.user.bio).toBe(bioText);

      const followRes = await http()
        .post(`/posts/users/${author.id}/follow`)
        .set('Authorization', follower.auth);
      expect(followRes.status).toBe(200);
      expect(followRes.body.data.following).toBe(true);
      expect(followRes.body.data.followerCount).toBe(1);

      const statusRes = await http()
        .get(`/posts/users/${author.id}/follow-status`)
        .set('Authorization', follower.auth);
      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data).toMatchObject({
        targetUserId: author.id,
        following: true,
        followerCount: 1,
        isMe: false,
      });

      const suggested = await http()
        .get('/posts/users/suggested?limit=6')
        .set('Authorization', follower.auth);
      expect(suggested.status).toBe(200);

      const notifTypes = await waitForNotificationType(
        () => http().get('/notifications').set('Authorization', author.auth),
        NotificationType.NEW_FOLLOWER,
      );
      expect(notifTypes).toContain(NotificationType.NEW_FOLLOWER);

      const unfollowRes = await http()
        .post(`/posts/users/${author.id}/follow`)
        .set('Authorization', follower.auth);
      expect(unfollowRes.status).toBe(200);
      expect(unfollowRes.body.data).toMatchObject({
        following: false,
        followerCount: 0,
      });
    });
  });
});
