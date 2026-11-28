import { INestApplication } from '@nestjs/common';
import { ContentStatus, UserRole } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { LEARNER_ERROR_CODES } from '../src/learner/learner.constant';
import { QuizQuestionType } from '../src/quiz/types/quiz-question.types';
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
  let lesson2Id: string;
  let lesson2Slug: string;
  let pathId: string;
  let chapterId: string;
  let chapter2Id: string;
  const createdQuizIds: string[] = [];
  const createdQuestionIds: string[] = [];

  jest.setTimeout(60000);

  const http = () => request(app.getHttpServer() as App);
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

    const lesson2 = await http()
      .post('/lessons')
      .set('Authorization', editor.auth)
      .send({
        title: `${E2E_MARK}bai hoc chuong 2 ${Date.now()}`,
        topicId,
        status: ContentStatus.PENDING_REVIEW,
      });
    lesson2Id = lesson2.body.data.id;
    lesson2Slug = lesson2.body.data.slug;
    await http()
      .patch(`/lessons/${lesson2Id}/review`)
      .set('Authorization', reviewer.auth)
      .send({ status: ContentStatus.PUBLISHED });
  });

  afterAll(async () => {
    if (pathId) {
      await http()
        .delete(`/learning-paths/${pathId}`)
        .set('Authorization', reviewer.auth);
    }
    for (const qid of createdQuizIds) {
      await http()
        .delete(`/quizzes/${qid}`)
        .set('Authorization', reviewer.auth);
    }
    for (const qid of createdQuestionIds) {
      await http()
        .delete(`/questions/${qid}`)
        .set('Authorization', reviewer.auth);
    }
    for (const lid of [lessonId, lesson2Id]) {
      if (lid) {
        await http()
          .delete(`/lessons/${lid}`)
          .set('Authorization', reviewer.auth);
      }
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

  describe('đề kiểm tra cuối chương (ChapterQuiz 1..N)', () => {
    let q1Id: string;
    let q2Id: string;
    let requiredQuizId: string;
    let optionalQuizId: string;

    it('gắn nhiều đề (bắt buộc + tự chọn) vào Chương 1, chặn Chương 2 cho đến khi thi đạt passScore', async () => {
      // 1. Tạo 2 câu hỏi và 2 đề kiểm tra trong Ngân hàng đề
      for (const idx of [1, 2]) {
        const qRes = await http()
          .post('/questions')
          .set('Authorization', editor.auth)
          .send({
            type: QuizQuestionType.SINGLE_CHOICE,
            prompt: `${E2E_MARK}cau hoi chuong ${idx}`,
            data: {
              options: [
                { id: 'a', text: 'Đúng', isCorrect: true },
                { id: 'b', text: 'Sai', isCorrect: false },
              ],
            },
          });
        expect(qRes.status).toBe(201);
        createdQuestionIds.push(String(qRes.body.data.id));
      }
      [q1Id, q2Id] = createdQuestionIds;

      const reqQuizRes = await http()
        .post('/quizzes')
        .set('Authorization', editor.auth)
        .send({
          title: `${E2E_MARK}Kiểm tra bắt buộc Chương 1`,
          topicIds: [topicId],
          questionIds: [q1Id, q2Id],
          passingScorePercent: 60,
        });
      expect(reqQuizRes.status).toBe(201);
      requiredQuizId = reqQuizRes.body.data.id;
      createdQuizIds.push(requiredQuizId);

      const optQuizRes = await http()
        .post('/quizzes')
        .set('Authorization', editor.auth)
        .send({
          title: `${E2E_MARK}Đề luyện thêm Chương 1`,
          topicIds: [topicId],
          questionIds: [q1Id],
          passingScorePercent: 50,
        });
      expect(optQuizRes.status).toBe(201);
      optionalQuizId = optQuizRes.body.data.id;
      createdQuizIds.push(optionalQuizId);

      // 2. Gắn cả 2 đề vào Chương 1 (ghi đè passScore = 80 cho đề bắt buộc) + tạo Chương 2 chứa bài 2
      const syncRes = await http()
        .put(`/learning-paths/chapters/${chapterId}/quizzes`)
        .set('Authorization', editor.auth)
        .send({
          items: [
            { quizId: optionalQuizId, passScore: 50, isRequired: false },
            { quizId: requiredQuizId, passScore: 80, isRequired: true },
          ],
        });
      expect(syncRes.status).toBe(200);
      expect(syncRes.body.data.count).toBe(2);

      const ch2Res = await http()
        .post('/learning-paths/chapters')
        .set('Authorization', editor.auth)
        .send({ learningPathId: pathId, title: 'Chương 2' });
      expect(ch2Res.status).toBe(201);
      chapter2Id = ch2Res.body.data.id;

      await http()
        .post(`/learning-paths/chapters/${chapter2Id}/lessons`)
        .set('Authorization', editor.auth)
        .send({ lessonIds: [lesson2Id] });

      // 3. Bật tuần tự & xuất bản lại lộ trình, cho người học đăng ký lại
      const pubRes = await http()
        .put(`/learning-paths/${pathId}`)
        .set('Authorization', reviewer.auth)
        .send({ isSequential: true, status: ContentStatus.PUBLISHED });
      expect(pubRes.status).toBe(200);

      const reEnroll = await http()
        .post(learning(`/paths/${pathId}/enroll`))
        .set('Authorization', learner.auth);
      expect(reEnroll.status).toBe(200);

      // 4. Bài 1 đã hoàn thành từ trước nhưng đề bắt buộc Chương 1 chưa đạt 80% -> đọc bài 2 bị chặn CHAPTER_QUIZ_LOCKED
      const lockedRead = await http()
        .get(learning(`/lessons/${lesson2Slug}`))
        .set('Authorization', learner.auth);
      expect(lockedRead.status).toBe(403);
      expect(JSON.stringify(lockedRead.body)).toContain(
        LEARNER_ERROR_CODES.CHAPTER_QUIZ_LOCKED,
      );

      // 5. Thi lần 1 đạt 50% (< passScore 80%) -> vẫn bị chặn
      const failAttempt = await http()
        .post(`/public/quizzes/${requiredQuizId}/submit`)
        .set('Authorization', learner.auth)
        .send({
          timeSpentSeconds: 20,
          answers: { [q1Id]: 'a', [q2Id]: 'b' },
        });
      expect(failAttempt.status).toBe(201);
      expect(failAttempt.body.data.scorePercent).toBe(50);

      const stillLocked = await http()
        .get(learning(`/lessons/${lesson2Slug}`))
        .set('Authorization', learner.auth);
      expect(stillLocked.status).toBe(403);

      // 6. Thi lần 2 đạt 100% (>= 80%) -> mở khóa Chương 2 ngay cả khi đề tự chọn chưa làm!
      const passAttempt = await http()
        .post(`/public/quizzes/${requiredQuizId}/submit`)
        .set('Authorization', learner.auth)
        .send({
          timeSpentSeconds: 25,
          answers: { [q1Id]: 'a', [q2Id]: 'a' },
        });
      expect(passAttempt.status).toBe(201);
      expect(passAttempt.body.data.scorePercent).toBe(100);

      const overview = await http()
        .get(learning())
        .set('Authorization', learner.auth);
      expect(overview.status).toBe(200);
      expect(overview.body.data.bestQuizScores[requiredQuizId]).toBe(100);

      const progression = await http()
        .get(learning(`/paths/${pathId}/progression`))
        .set('Authorization', learner.auth);
      expect(progression.status).toBe(200);
      expect(progression.body.data.chapters[0].quizzes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            quizId: optionalQuizId,
            state: 'UNLOCKED',
          }),
          expect.objectContaining({ quizId: requiredQuizId, state: 'PASSED' }),
        ]),
      );

      const unlockedRead = await http()
        .get(learning(`/lessons/${lesson2Slug}`))
        .set('Authorization', learner.auth);
      expect(unlockedRead.status).toBe(200);
      expect(unlockedRead.body.data.lesson.id).toBe(lesson2Id);

      // 7. Nhật ký học tập cá nhân & Xem lại chi tiết lượt làm bài (chặn 403 người khác)
      const quizHist = await http()
        .get(learning('/history?kind=QUIZ_ATTEMPTS&page=1&limit=10'))
        .set('Authorization', learner.auth);
      expect(quizHist.status).toBe(200);
      expect(quizHist.body.data.items.length).toBeGreaterThanOrEqual(2);

      const lessonHist = await http()
        .get(learning('/history?kind=COMPLETED_LESSONS&page=1&limit=10'))
        .set('Authorization', learner.auth);
      expect(lessonHist.status).toBe(200);
      expect(lessonHist.body.data.items.length).toBeGreaterThanOrEqual(1);

      const passAttemptId = String(passAttempt.body.data.attemptId);
      const reviewMine = await http()
        .get(learning(`/quiz-attempts/${passAttemptId}`))
        .set('Authorization', learner.auth);
      expect(reviewMine.status).toBe(200);
      expect(reviewMine.body.data.scorePercent).toBe(100);
      expect(reviewMine.body.data.questions).toHaveLength(2);

      const reviewForbidden = await http()
        .get(learning(`/quiz-attempts/${passAttemptId}`))
        .set('Authorization', editor.auth);
      expect(reviewForbidden.status).toBe(403);
    });
  });
});
