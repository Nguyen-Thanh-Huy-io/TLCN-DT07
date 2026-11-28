import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { LessonService } from '../lesson/lesson.service';
import { PathPrerequisitePolicy } from '../learning-path/policies/path-prerequisite.policy';
import { SequentialProgressionStrategy } from '../learning-path/strategies/sequential-progression.strategy';
import { FreePacedProgressionStrategy } from '../learning-path/strategies/free-paced-progression.strategy';
import { ProgressionStrategyFactory } from '../learning-path/strategies/progression-strategy.factory';
import { LessonProgressionState } from '../learning-path/strategies/progression-strategy.interface';
import { LEARNER_ERROR_CODES, LearnerHistoryKind } from './learner.constant';
import { LearnerService } from './learner.service';

describe('LearnerService', () => {
  let service: LearnerService;
  const mockPrerequisitePolicy = {
    validateEnrollmentEligibility: jest
      .fn()
      .mockResolvedValue({ isEligible: true }),
  };
  const prisma = {
    learningPath: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    learningPathEnrollment: {
      findMany: jest.fn().mockResolvedValue([{ learningPathId: 'path-1' }]),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    lessonProgress: {
      findMany: jest.fn().mockResolvedValue([{ lessonId: 'lesson-1' }]),
      count: jest.fn().mockResolvedValue(0),
      upsert: jest.fn(),
    },
    quizAttempt: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    learningActivity: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    article: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    lesson: { findFirst: jest.fn() },
    authUser: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const lessonService = { findBySlug: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrerequisitePolicy.validateEnrollmentEligibility.mockResolvedValue({
      isEligible: true,
    });
    lessonService.findBySlug.mockResolvedValue({
      id: 'lesson-1',
      status: ContentStatus.PUBLISHED,
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        LearnerService,
        SequentialProgressionStrategy,
        FreePacedProgressionStrategy,
        ProgressionStrategyFactory,
        { provide: PathPrerequisitePolicy, useValue: mockPrerequisitePolicy },
        { provide: PrismaService, useValue: prisma },
        { provide: LessonService, useValue: lessonService },
      ],
    }).compile();
    service = moduleRef.get(LearnerService);
  });

  describe('enroll', () => {
    it('chỉ đăng ký được lộ trình đã xuất bản', async () => {
      prisma.learningPath.findFirst.mockResolvedValue(null);

      await expect(service.enroll('u-1', 'path-nhap')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.learningPath.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'path-nhap', status: ContentStatus.PUBLISHED },
        }),
      );
      expect(prisma.learningPathEnrollment.upsert).not.toHaveBeenCalled();
    });

    it('không cho phép đăng ký nếu chưa hoàn thành lộ trình tiên quyết', async () => {
      prisma.learningPath.findFirst.mockResolvedValue({
        id: 'path-2',
        title: 'Khóa nâng cao',
      });
      mockPrerequisitePolicy.validateEnrollmentEligibility.mockResolvedValueOnce(
        {
          isEligible: false,
          prerequisitePathId: 'path-1',
          prerequisitePathTitle: 'Khóa cơ bản',
          completedLessons: 1,
          totalLessons: 3,
          reason: 'Cần hoàn thành Khóa cơ bản trước',
        },
      );

      await expect(service.enroll('u-1', 'path-2')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.learningPathEnrollment.upsert).not.toHaveBeenCalled();
    });

    it('đăng ký dùng upsert (gọi lại không tạo bản ghi trùng) và trả tiến độ', async () => {
      prisma.learningPath.findFirst.mockResolvedValue({ id: 'path-1' });

      const result = await service.enroll('u-1', 'path-1');

      expect(prisma.learningPathEnrollment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_learningPathId: { userId: 'u-1', learningPathId: 'path-1' },
          },
          update: {},
        }),
      );
      expect(result).toEqual({
        enrolledPathIds: ['path-1'],
        completedLessonIds: ['lesson-1'],
        passedQuizIds: [],
      });
    });
  });

  describe('getLessonForReading', () => {
    it('bài thuộc lộ trình mà chưa đăng ký → 403 NOT_ENROLLED kèm id lộ trình', async () => {
      prisma.learningPath.findMany.mockResolvedValue([
        { id: 'path-1', enrollments: [] },
      ]);

      const error = await service
        .getLessonForReading('u-1', 'bai-1')
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).getResponse()).toMatchObject({
        code: LEARNER_ERROR_CODES.NOT_ENROLLED,
        learningPathIds: ['path-1'],
      });
    });

    it('bài thuộc lộ trình tuần tự bị khóa khi bài trước đó chưa xong → 403 LESSON_LOCKED_SEQUENTIAL', async () => {
      lessonService.findBySlug.mockResolvedValue({
        id: 'lesson-2',
        status: ContentStatus.PUBLISHED,
      });

      prisma.learningPath.findMany.mockResolvedValue([
        {
          id: 'path-1',
          title: 'Khóa học',
          isSequential: true,
          enrollments: [{ id: 'e-1' }],
          chapters: [
            {
              displayOrder: 1,
              chapterLessons: [
                {
                  lessonId: 'lesson-1',
                  lesson: {
                    id: 'lesson-1',
                    title: 'Bài 1 Khởi đầu',
                    status: ContentStatus.PUBLISHED,
                  },
                },
                {
                  lessonId: 'lesson-2',
                  lesson: {
                    id: 'lesson-2',
                    title: 'Bài 2 Kế tiếp',
                    status: ContentStatus.PUBLISHED,
                  },
                },
              ],
            },
          ],
        },
      ]);

      // User chưa học bài nào (completedIds rỗng)
      prisma.lessonProgress.findMany.mockResolvedValue([]);

      const error = await service
        .getLessonForReading('u-1', 'bai-2', 'path-1')
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).getResponse()).toMatchObject({
        code: LEARNER_ERROR_CODES.LESSON_LOCKED_SEQUENTIAL,
        prerequisiteLesson: { id: 'lesson-1', title: 'Bài 1 Khởi đầu' },
      });
    });

    it('chặn mở bài của Chương 2 với CHAPTER_QUIZ_LOCKED khi chưa vượt đề bắt buộc của Chương 1', async () => {
      lessonService.findBySlug.mockResolvedValue({
        id: 'lesson-ch2',
        status: ContentStatus.PUBLISHED,
      });

      prisma.learningPath.findMany.mockResolvedValue([
        {
          id: 'path-1',
          title: 'Lịch sử 12',
          isSequential: true,
          enrollments: [{ id: 'e-1' }],
          chapters: [
            {
              id: 'ch-1',
              title: 'Chương 1: Thế giới hiện đại',
              displayOrder: 1,
              chapterLessons: [
                {
                  lessonId: 'lesson-ch1',
                  lesson: {
                    id: 'lesson-ch1',
                    title: 'Bài 1 Liên Hợp Quốc',
                    status: ContentStatus.PUBLISHED,
                  },
                },
              ],
              chapterQuizzes: [
                {
                  id: 'cq-1',
                  quizId: 'quiz-ch1',
                  displayOrder: 1,
                  passScore: 75,
                  isRequired: true,
                  quiz: {
                    id: 'quiz-ch1',
                    title: 'Kiểm tra 15p Chương 1',
                    passingScorePercent: 70,
                    timeLimitMinutes: 15,
                  },
                },
              ],
            },
            {
              id: 'ch-2',
              title: 'Chương 2: ASEAN',
              displayOrder: 2,
              chapterLessons: [
                {
                  lessonId: 'lesson-ch2',
                  lesson: {
                    id: 'lesson-ch2',
                    title: 'Bài 2 Sự ra đời ASEAN',
                    status: ContentStatus.PUBLISHED,
                  },
                },
              ],
              chapterQuizzes: [],
            },
          ],
        },
      ]);

      prisma.lessonProgress.findMany.mockResolvedValue([
        { lessonId: 'lesson-ch1' },
      ]);
      prisma.quizAttempt.findMany.mockResolvedValue([
        { quizId: 'quiz-ch1', scorePercent: 60, isPassed: false },
      ]);

      const error = await service
        .getLessonForReading('u-1', 'bai-2-asean', 'path-1')
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).getResponse()).toMatchObject({
        code: LEARNER_ERROR_CODES.CHAPTER_QUIZ_LOCKED,
        prerequisiteQuiz: {
          quizId: 'quiz-ch1',
          title: 'Kiểm tra 15p Chương 1',
          chapterTitle: 'Chương 1: Thế giới hiện đại',
          passScore: 75,
        },
      });

      // Khi đạt >= 75% thì đọc được ngay bài Chương 2
      prisma.quizAttempt.findMany.mockResolvedValueOnce([
        { quizId: 'quiz-ch1', scorePercent: 80, isPassed: true },
      ]);
      const unlocked = await service.getLessonForReading(
        'u-1',
        'bai-2-asean',
        'path-1',
      );
      expect(unlocked.lesson.id).toBe('lesson-ch2');
    });

    it('đã đăng ký 1 trong các lộ trình chứa bài thì đọc được', async () => {
      prisma.learningPath.findMany.mockResolvedValue([
        { id: 'path-1', enrollments: [] },
        { id: 'path-2', enrollments: [{ id: 'e-1' }], isSequential: false },
      ]);

      const result = await service.getLessonForReading('u-1', 'bai-1');

      expect(result.lesson.id).toBe('lesson-1');
    });

    it('bài chỉ có trong thư viện (không thuộc lộ trình nào) thì đăng nhập là đọc được', async () => {
      prisma.learningPath.findMany.mockResolvedValue([]);

      await expect(
        service.getLessonForReading('u-1', 'bai-1'),
      ).resolves.toBeDefined();
    });

    it('bài chưa xuất bản → 404, không lộ nội dung nháp', async () => {
      lessonService.findBySlug.mockResolvedValue({
        id: 'lesson-1',
        status: ContentStatus.DRAFT,
      });

      await expect(service.getLessonForReading('u-1', 'bai-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.learningPath.findMany).not.toHaveBeenCalled();
    });

    it('trả về lesson.author đầy đủ khi có createdBy và null khi không có', async () => {
      prisma.learningPath.findMany.mockResolvedValue([]);
      lessonService.findBySlug.mockResolvedValueOnce({
        id: 'lesson-1',
        status: ContentStatus.PUBLISHED,
        createdBy: 'u-teacher-1',
      });
      prisma.authUser.findMany.mockResolvedValueOnce([
        {
          id: 'u-teacher-1',
          username: 'co_giao_lan',
          userProfile: {
            firstName: 'Lan',
            lastName: 'Trần',
            avatarUrl: null,
          },
        },
      ]);

      const resWithAuthor = await service.getLessonForReading('u-1', 'bai-1');
      expect(resWithAuthor.lesson.author).toEqual({
        id: 'u-teacher-1',
        username: 'co_giao_lan',
        displayName: 'Trần Lan',
        avatarUrl: null,
      });

      lessonService.findBySlug.mockResolvedValueOnce({
        id: 'lesson-2',
        status: ContentStatus.PUBLISHED,
        createdBy: null,
      });

      const resNoAuthor = await service.getLessonForReading('u-1', 'bai-2');
      expect(resNoAuthor.lesson.author).toBeNull();
    });
  });

  describe('getPathProgression', () => {
    it('trả về tiến trình chi tiết của lộ trình với các node trạng thái đúng', async () => {
      prisma.learningPath.findUnique.mockResolvedValue({
        id: 'path-1',
        title: 'Khóa lịch sử',
        slug: 'khoa-lich-su',
        isSequential: true,
        prerequisitePath: null,
        successorPaths: [],
        chapters: [
          {
            id: 'ch-1',
            title: 'Chương 1',
            slug: 'chuong-1',
            displayOrder: 1,
            chapterLessons: [
              {
                lesson: {
                  id: 'l-1',
                  title: 'Bài 1',
                  slug: 'bai-1',
                  status: ContentStatus.PUBLISHED,
                  difficulty: 'BEGINNER',
                },
              },
              {
                lesson: {
                  id: 'l-2',
                  title: 'Bài 2',
                  slug: 'bai-2',
                  status: ContentStatus.PUBLISHED,
                  difficulty: 'INTERMEDIATE',
                },
              },
            ],
          },
        ],
      });

      // User đã hoàn thành bài 1
      prisma.lessonProgress.findMany.mockResolvedValue([{ lessonId: 'l-1' }]);

      const progression = await service.getPathProgression('u-1', 'path-1');

      expect(progression.pathId).toBe('path-1');
      expect(progression.completedLessons).toBe(1);
      expect(progression.totalLessons).toBe(2);
      expect(progression.chapters[0].lessons[0].state).toBe(
        LessonProgressionState.COMPLETED,
      );
      expect(progression.chapters[0].lessons[1].state).toBe(
        LessonProgressionState.CURRENT_UNLOCKED,
      );
    });
  });

  describe('completeLesson', () => {
    it('bài không tồn tại hoặc chưa xuất bản → 404', async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);

      await expect(service.completeLesson('u-1', 'khong-co')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.lessonProgress.upsert).not.toHaveBeenCalled();
    });

    it('đánh dấu hoàn thành bằng upsert', async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: 'lesson-1' });

      await service.completeLesson('u-1', 'lesson-1');

      expect(prisma.lessonProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_lessonId: { userId: 'u-1', lessonId: 'lesson-1' } },
        }),
      );
    });
  });

  it('huỷ đăng ký chỉ xoá bản ghi của chính người học', async () => {
    await service.unenroll('u-1', 'path-1');

    expect(prisma.learningPathEnrollment.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u-1', learningPathId: 'path-1' },
    });
  });

  describe('getHistory & getQuizAttemptDetail', () => {
    it('phân trang đúng cho cả 3 chiến lược: QUIZ_ATTEMPTS, COMPLETED_LESSONS, READ_ARTICLES', async () => {
      prisma.quizAttempt.findMany.mockResolvedValueOnce([
        {
          id: 'att-1',
          quizId: 'q-1',
          scorePercent: 90,
          correctCount: 9,
          totalQuestions: 10,
          timeSpentSeconds: 180,
          isPassed: true,
          createdAt: new Date('2026-11-28T06:00:00Z'),
          quiz: {
            title: 'Đề Điện Biên Phủ',
            passingScorePercent: 70,
            topics: [
              { id: 't-1', name: 'Kháng chiến chống Pháp', slug: 'kc-phap' },
            ],
          },
        },
      ]);
      prisma.quizAttempt.count.mockResolvedValueOnce(1);

      const quizPage = await service.getHistory('u-1', {
        kind: LearnerHistoryKind.QUIZ_ATTEMPTS,
        page: 1,
        limit: 10,
      });
      expect(quizPage.items).toHaveLength(1);
      expect(quizPage.meta.total).toBe(1);

      prisma.lessonProgress.findMany.mockResolvedValueOnce([
        {
          lessonId: 'les-1',
          completedAt: new Date('2026-11-28T06:10:00Z'),
          lesson: {
            title: 'Bài 1: Tuyên ngôn Độc lập',
            slug: 'tuyen-ngon-doc-lap',
            difficulty: 'MEDIUM',
            content: [],
            thumbnailUrl: null,
            topic: { id: 't-1', name: 'Năm 1945', slug: 'nam-1945' },
          },
        },
      ]);
      prisma.lessonProgress.count.mockResolvedValueOnce(1);

      const lessonPage = await service.getHistory('u-1', {
        kind: LearnerHistoryKind.COMPLETED_LESSONS,
        page: 1,
        limit: 10,
      });
      expect(lessonPage.items).toHaveLength(1);

      prisma.learningActivity.findMany.mockResolvedValueOnce([
        {
          id: 'act-1',
          entityId: 'art-1',
          xpEarned: 20,
          metadata: { title: 'Võ Nguyên Giáp' },
          occurredAt: new Date('2026-11-28T06:20:00Z'),
        },
      ]);
      prisma.learningActivity.count.mockResolvedValueOnce(1);
      prisma.article.findMany.mockResolvedValueOnce([
        {
          id: 'art-1',
          title: 'Đại tướng Võ Nguyên Giáp',
          slug: 'dai-tuong-vo-nguyen-giap',
          summary: 'Tổng Tư lệnh Quân đội nhân dân Việt Nam',
          coverImageUrl: null,
          category: { name: 'Nhân vật' },
        },
      ]);

      const articlePage = await service.getHistory('u-1', {
        kind: LearnerHistoryKind.READ_ARTICLES,
        page: 1,
        limit: 10,
      });
      expect(articlePage.items).toHaveLength(1);
      expect(articlePage.items[0]).toMatchObject({
        articleId: 'art-1',
        slug: 'dai-tuong-vo-nguyen-giap',
        xpEarned: 20,
      });
    });

    it('getQuizAttemptDetail chặn 403 nếu xem bài của người khác và trả chi tiết nếu chính chủ', async () => {
      prisma.quizAttempt.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.getQuizAttemptDetail('u-1', 'missing'),
      ).rejects.toThrow(NotFoundException);

      prisma.quizAttempt.findUnique.mockResolvedValueOnce({
        id: 'att-other',
        quizId: 'q-1',
        userId: 'u-other',
      });
      await expect(
        service.getQuizAttemptDetail('u-1', 'att-other'),
      ).rejects.toThrow(ForbiddenException);

      prisma.quizAttempt.findUnique.mockResolvedValueOnce({
        id: 'att-mine',
        quizId: 'q-1',
        userId: 'u-1',
        scorePercent: 100,
        correctCount: 1,
        totalQuestions: 1,
        timeSpentSeconds: 30,
        isPassed: true,
        answers: { 'question-1': 'a' },
        createdAt: new Date('2026-11-28T06:00:00Z'),
        questionResults: [
          { questionId: 'question-1', isCorrect: true, answer: 'a' },
        ],
        quiz: {
          id: 'q-1',
          title: 'Đề kiểm tra nhanh',
          passingScorePercent: 70,
          timeLimitMinutes: 15,
          topics: [],
          quizQuestions: [
            {
              points: 10,
              question: {
                id: 'question-1',
                type: 'SINGLE_CHOICE',
                prompt: 'Năm thành lập nước VNDCCH?',
                explanation: 'Ngày 2/9/1945 tại Quảng trường Ba Đình.',
                data: {
                  options: [
                    { id: 'a', text: '1945', isCorrect: true },
                    { id: 'b', text: '1954', isCorrect: false },
                  ],
                },
              },
            },
          ],
        },
      });

      const detail = await service.getQuizAttemptDetail('u-1', 'att-mine');
      expect(detail.attemptId).toBe('att-mine');
      expect(detail.results['question-1']).toBe(true);
      expect(detail.questions).toHaveLength(1);
    });
  });
});
