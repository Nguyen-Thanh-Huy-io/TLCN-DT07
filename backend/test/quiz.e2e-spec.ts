import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/all-exception.filter';
import { EmailQueueService } from '../src/common/queues/email/email.queue';
import { CustomThrottlerGuard } from '../src/common/guards/custom-throttler.guard';
import { AuthGuard } from '../src/common/guards/auth.guard';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

describe('Quiz E2E Integration Tests', () => {
  let app: INestApplication;
  let testPeriodId: string;
  let testTopicId: string;
  let testLessonId: string;
  let createdQuizId: string;
  let createdAttemptId: string;
  let question1Id: string;
  let option1CorrectId: string;
  let option1WrongId: string;

  const mockEmailQueueService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockAuthGuard = {
    canActivate: (context: any) => {
      const req = context.switchToHttp().getRequest();
      req.user = { userId: 'admin-test-id', role: 'ADMIN', tokenVersion: 1 };
      return true;
    },
  };

  jest.setTimeout(60000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailQueueService)
      .useValue(mockEmailQueueService)
      .overrideGuard(CustomThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();

    const winstonLogger = app.get(WINSTON_MODULE_PROVIDER);
    app.useGlobalFilters(new AllExceptionsFilter(winstonLogger));
    app.useGlobalInterceptors(new TransformInterceptor(winstonLogger));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // 1. Tạo Period mẫu
    const periodRes = await request(app.getHttpServer())
      .post('/periods')
      .send({
        name: `Period Cho Quiz Test ${Date.now()}`,
        region: 'Việt Nam',
        startYear: 938,
        status: 'PUBLISHED',
      });
    testPeriodId = periodRes.body.data.id;

    // 2. Tạo Topic mẫu
    const topicRes = await request(app.getHttpServer())
      .post('/topics')
      .send({
        periodId: testPeriodId,
        name: `Topic Cho Quiz Test ${Date.now()}`,
        status: 'PUBLISHED',
      });
    testTopicId = topicRes.body.data.id;

    // 3. Tạo Lesson mẫu
    const lessonRes = await request(app.getHttpServer())
      .post('/lessons')
      .send({
        topicId: testTopicId,
        title: `Lesson Cho Quiz Test ${Date.now()}`,
        status: 'PUBLISHED',
      });
    testLessonId = lessonRes.body.data.id;
  });

  afterAll(async () => {
    if (createdQuizId) {
      await request(app.getHttpServer()).delete(`/quizzes/${createdQuizId}`);
    }
    if (testLessonId) {
      await request(app.getHttpServer()).delete(`/lessons/${testLessonId}`);
    }
    if (testTopicId) {
      await request(app.getHttpServer()).delete(`/topics/${testTopicId}`);
    }
    if (testPeriodId) {
      await request(app.getHttpServer()).delete(`/periods/${testPeriodId}`);
    }
    await app.close();
  });

  describe('1. POST /quizzes - Tạo mới Quiz', () => {
    it('thất bại với 400 nếu câu hỏi trắc nghiệm không có đáp án đúng nào', async () => {
      const res = await request(app.getHttpServer())
        .post('/quizzes')
        .send({
          lessonId: testLessonId,
          title: 'Quiz Lỗi Không Đáp Án Đúng',
          questions: [
            {
              questionText: 'Ai là người chiến thắng trận Bạch Đằng năm 938?',
              type: 'MULTIPLE_CHOICE',
              points: 1,
              options: [
                { optionText: 'Ngô Quyền', isCorrect: false },
                { optionText: 'Trần Hưng Đạo', isCorrect: false },
              ],
            },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('thành công tạo mới Quiz hợp lệ kèm câu hỏi và đáp án', async () => {
      const res = await request(app.getHttpServer())
        .post('/quizzes')
        .send({
          lessonId: testLessonId,
          topicId: testTopicId,
          title: `Trắc nghiệm Chiến thắng Bạch Đằng - E2E ${Date.now()}`,
          description: 'Kiểm tra kiến thức cơ bản về chiến thắng Bạch Đằng năm 938.',
          passingScore: 70,
          timeLimitMinutes: 10,
          xpReward: 30,
          questions: [
            {
              questionText: 'Năm 938 diễn ra sự kiện lịch sử nào nổi bật?',
              explanation: 'Năm 938, Ngô Quyền lãnh đạo nhân dân đánh tan quân Nam Hán trên sông Bạch Đằng.',
              type: 'MULTIPLE_CHOICE',
              points: 10,
              options: [
                { optionText: 'Chiến thắng Bạch Đằng của Ngô Quyền', isCorrect: true },
                { optionText: 'Chiến thắng Như Nguyệt của Lý Thường Kiệt', isCorrect: false },
                { optionText: 'Chiến thắng Rạch Gầm - Xoài Mút của Quang Trung', isCorrect: false },
              ],
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.statusCode).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.questions).toHaveLength(1);

      createdQuizId = res.body.data.id;
      question1Id = res.body.data.questions[0].id;
      const opts = res.body.data.questions[0].options;
      option1CorrectId = opts.find((o: any) => o.isCorrect === true).id;
      option1WrongId = opts.find((o: any) => o.isCorrect === false).id;
    });
  });

  describe('2. GET /quizzes - Lấy danh sách Quiz', () => {
    it('lấy danh sách Quiz theo lessonId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/quizzes?lessonId=${testLessonId}`)
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. PATCH /quizzes/:id/review - Duyệt xuất bản Quiz', () => {
    it('thành công duyệt xuất bản Quiz sang trạng thái PUBLISHED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/quizzes/${createdQuizId}/review`)
        .send({
          status: 'PUBLISHED',
        })
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data.status).toBe('PUBLISHED');
    });
  });

  describe('4. POST /quizzes/:id/attempts & POST /quizzes/attempts/:attemptId/submit', () => {
    it('bắt đầu lượt làm bài kiểm tra (Start Attempt)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/quizzes/${createdQuizId}/attempts`)
        .expect(201);

      expect(res.body.statusCode).toBe(201);
      expect(res.body.data.attemptId).toBeDefined();
      expect(res.body.data.questions).toHaveLength(1);
      // Đảm bảo không lộ đáp án đúng khi nhận đề bài
      expect(res.body.data.questions[0].options[0].isCorrect).toBeUndefined();

      createdAttemptId = res.body.data.attemptId;
    });

    it('nộp bài và chấm điểm tự động (Submit Attempt)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/quizzes/attempts/${createdAttemptId}/submit`)
        .send({
          answers: [
            {
              questionId: question1Id,
              selectedOptionIds: [option1CorrectId],
            },
          ],
        })
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data.score).toBe(100);
      expect(res.body.data.passed).toBe(true);
      expect(res.body.data.earnedXp).toBe(30);
      expect(res.body.data.answers).toHaveLength(1);
      expect(res.body.data.answers[0].isCorrect).toBe(true);
    });
  });

  describe('5. GET /quizzes/user/attempts - Lấy lịch sử làm bài', () => {
    it('lấy danh sách các lượt làm bài của user', async () => {
      const res = await request(app.getHttpServer())
        .get(`/quizzes/user/attempts?quizId=${createdQuizId}`)
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('6. DELETE /quizzes/:id - Xóa Quiz', () => {
    it('xóa thành công Quiz', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/quizzes/${createdQuizId}`)
        .expect(200);

      expect(res.body.statusCode).toBe(200);

      await request(app.getHttpServer())
        .get(`/quizzes/${createdQuizId}`)
        .expect(404);

      createdQuizId = '';
    });
  });
});
