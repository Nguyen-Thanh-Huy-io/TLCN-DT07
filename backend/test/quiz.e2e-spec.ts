import { INestApplication } from '@nestjs/common';
import { ContentStatus, UserRole } from '@prisma/client';
import request from 'supertest';
import { QuizQuestionType } from '../src/quiz/types/quiz-question.types';
import {
  E2E_MARK,
  E2eUser,
  createE2eApp,
  createE2eUser,
  itemsOf,
  removeE2eUsers,
} from './e2e-app';

interface PublicQuiz {
  id: string;
  questions: Array<{ id: string }>;
}

const CORRECT_OPTION = 'a';
const WRONG_OPTION = 'b';

const singleChoice = (prompt: string) => ({
  type: QuizQuestionType.SINGLE_CHOICE,
  prompt: `${E2E_MARK}${prompt}`,
  data: {
    options: [
      { id: CORRECT_OPTION, text: 'Đáp án đúng', isCorrect: true },
      { id: WRONG_OPTION, text: 'Đáp án sai', isCorrect: false },
    ],
  },
});

/**
 * Đề thi thuộc Chủ đề, câu hỏi chỉ lấy từ Ngân hàng; người học làm ở API công khai và server chấm điểm.
 */
describe('Quiz E2E — ngân hàng câu hỏi, đề theo chủ đề, chấm điểm', () => {
  let app: INestApplication;
  let editor: E2eUser;
  let reviewer: E2eUser;
  let learner: E2eUser;
  let topicId: string;
  let draftTopicId: string;
  const questionIds: string[] = [];
  const quizIds: string[] = [];

  jest.setTimeout(60000);

  const http = () => request(app.getHttpServer());

  const createQuiz = async (body: Record<string, unknown>) => {
    const res = await http()
      .post('/quizzes')
      .set('Authorization', editor.auth)
      .send({ title: `${E2E_MARK}de ${Date.now()}`, ...body });
    if (res.status === 201) quizIds.push(res.body.data.id);
    return res;
  };

  const publicQuizzes = async (topic: string) =>
    itemsOf<PublicQuiz>(
      (await http().get(`/public/quizzes?topicId=${topic}`)).body,
    );

  beforeAll(async () => {
    app = await createE2eApp();
    editor = await createE2eUser(app, UserRole.MODERATOR);
    reviewer = await createE2eUser(app, UserRole.ADMIN);
    learner = await createE2eUser(app, UserRole.USER);

    const topic = await http()
      .post('/topics')
      .set('Authorization', reviewer.auth)
      .send({
        name: `${E2E_MARK}chu de ${Date.now()}`,
        status: ContentStatus.PUBLISHED,
      });
    topicId = topic.body.data.id;
    const draft = await http()
      .post('/topics')
      .set('Authorization', reviewer.auth)
      .send({
        name: `${E2E_MARK}nhap ${Date.now()}`,
        status: ContentStatus.DRAFT,
      });
    draftTopicId = draft.body.data.id;
  });

  afterAll(async () => {
    for (const id of quizIds) {
      await http().delete(`/quizzes/${id}`).set('Authorization', reviewer.auth);
    }
    for (const id of questionIds) {
      await http()
        .delete(`/questions/${id}`)
        .set('Authorization', reviewer.auth);
    }
    for (const id of [topicId, draftTopicId]) {
      if (id) {
        await http()
          .delete(`/topics/${id}`)
          .set('Authorization', reviewer.auth);
      }
    }
    await removeE2eUsers(app);
    await app.close();
  });

  describe('ngân hàng câu hỏi', () => {
    it('người học không thêm câu hỏi được', async () => {
      const res = await http()
        .post('/questions')
        .set('Authorization', learner.auth)
        .send(singleChoice('cau cua nguoi hoc'));
      expect(res.status).toBe(403);
    });

    it('câu một đáp án mà không có đáp án đúng bị từ chối', async () => {
      const invalid = singleChoice('khong co dap an dung');
      invalid.data.options[0].isCorrect = false;
      const res = await http()
        .post('/questions')
        .set('Authorization', editor.auth)
        .send(invalid);
      expect(res.status).toBe(400);
    });

    it('biên tập viên thêm 2 câu hợp lệ', async () => {
      for (const prompt of ['cau 1', 'cau 2']) {
        const res = await http()
          .post('/questions')
          .set('Authorization', editor.auth)
          .send(singleChoice(prompt));
        expect(res.status).toBe(201);
        questionIds.push(res.body.data.id);
      }
    });
  });

  describe('đề thi theo chủ đề', () => {
    let quizId: string;

    it('đề gắn chủ đề, không còn trường bài học', async () => {
      const res = await createQuiz({ topicIds: [topicId], questionIds });
      expect(res.status).toBe(201);
      quizId = res.body.data.id;
      expect(res.body.data.topics.map((t: { id: string }) => t.id)).toEqual([
        topicId,
      ]);
      expect(res.body.data).not.toHaveProperty('lessonId');
    });

    it('gửi lessonId (kiểu cũ) bị từ chối', async () => {
      const res = await createQuiz({ lessonId: topicId });
      expect(res.status).toBe(400);
    });

    it('người học thấy đề trong chủ đề đã xuất bản, đủ câu hỏi', async () => {
      const quizzes = await publicQuizzes(topicId);
      expect(quizzes.map((q) => q.id)).toEqual([quizId]);
      expect(quizzes[0].questions).toHaveLength(questionIds.length);
    });

    it('đề công khai không lộ đáp án trước khi nộp', async () => {
      const [quiz] = await publicQuizzes(topicId);
      const raw = JSON.stringify(quiz.questions);
      expect(raw).not.toContain('isCorrect');
      expect(raw).not.toContain('explanation');
    });

    it('server chấm điểm và thống kê lượt làm', async () => {
      const [first, second] = questionIds;
      const res = await http()
        .post(`/public/quizzes/${quizId}/submit`)
        .send({
          timeSpentSeconds: 30,
          answers: { [first]: CORRECT_OPTION, [second]: WRONG_OPTION },
        });
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        correctCount: 1,
        totalQuestions: 2,
        scorePercent: 50,
        isPassed: false,
        results: { [first]: true, [second]: false },
      });
      // Nộp xong mới có đáp án để xem lại bài.
      expect(JSON.stringify(res.body.data.questions)).toContain('isCorrect');

      const stats = await http().get(`/public/quizzes/${quizId}/statistics`);
      expect(stats.status).toBe(200);
      expect(stats.body.data.summary.totalAttempts).toBe(1);
    });

    it('nộp bài cho đề không tồn tại → 404', async () => {
      const res = await http()
        .post('/public/quizzes/a0000000-0000-4000-8000-000000000000/submit')
        .send({ timeSpentSeconds: 1, answers: {} });
      expect(res.status).toBe(404);
    });

    it('gỡ hết chủ đề thì đề không còn hiện cho người học', async () => {
      const res = await http()
        .put(`/quizzes/${quizId}`)
        .set('Authorization', editor.auth)
        .send({ topicIds: [] });
      expect(res.status).toBe(200);
      expect(await publicQuizzes(topicId)).toHaveLength(0);
    });

    it('đề chỉ gắn chủ đề chưa xuất bản thì không hiện', async () => {
      const res = await createQuiz({ topicIds: [draftTopicId], questionIds });
      expect(res.status).toBe(201);
      expect(await publicQuizzes(draftTopicId)).toHaveLength(0);
    });
  });
});
