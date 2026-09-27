import { Test, TestingModule } from '@nestjs/testing';
import { QuizService } from './quiz.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { QuestionEvaluatorFactory } from './evaluators/question-evaluator.factory';
import { MultipleChoiceEvaluator } from './evaluators/multiple-choice.evaluator';
import { MultipleSelectEvaluator } from './evaluators/multiple-select.evaluator';
import { TrueFalseEvaluator } from './evaluators/true-false.evaluator';
import { ScoringStrategyContext } from './strategies/scoring/scoring-strategy.context';
import { StandardScoringStrategy } from './strategies/scoring/standard-scoring.strategy';
import { WeightedScoringStrategy } from './strategies/scoring/weighted-scoring.strategy';
import { ContentStatus, QuestionType, AttemptStatus } from '@prisma/client';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

describe('QuizService Comprehensive Unit Tests', () => {
  let service: QuizService;

  const mockPrismaService = {
    quiz: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
    },
    topic: {
      findUnique: jest.fn(),
    },
    quizAttempt: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    quizAttemptAnswer: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  };

  const mockRedisService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    deleteByPattern: jest.fn().mockResolvedValue(true),
  };

  const mockLoggerService = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: CustomLoggerService, useValue: mockLoggerService },
        MultipleChoiceEvaluator,
        MultipleSelectEvaluator,
        TrueFalseEvaluator,
        QuestionEvaluatorFactory,
        StandardScoringStrategy,
        WeightedScoringStrategy,
        ScoringStrategyContext,
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // 1. CREATE QUIZ
  // ==========================================
  describe('create', () => {
    it('thành công tạo mới bài kiểm tra khi dữ liệu hợp lệ', async () => {
      const createDto = {
        title: 'Quiz Chiến dịch Điện Biên Phủ',
        lessonId: 'lesson-uuid-1',
        topicId: 'topic-uuid-1',
        passingScore: 80,
        timeLimitMinutes: 20,
        xpReward: 50,
        questions: [
          {
            questionText: 'Chiến dịch Điện Biên Phủ diễn ra năm nào?',
            type: QuestionType.MULTIPLE_CHOICE,
            points: 10,
            options: [
              { optionText: 'Năm 1954', isCorrect: true },
              { optionText: 'Năm 1975', isCorrect: false },
            ],
          },
        ],
      };

      mockPrismaService.lesson.findUnique.mockResolvedValue({ id: 'lesson-uuid-1' });
      mockPrismaService.topic.findUnique.mockResolvedValue({ id: 'topic-uuid-1' });
      mockPrismaService.quiz.create.mockResolvedValue({
        id: 'quiz-uuid-1',
        ...createDto,
        status: ContentStatus.DRAFT,
      });

      const result = await service.create(createDto as any, 'creator-uuid-1');

      expect(mockPrismaService.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: 'lesson-uuid-1' },
      });
      expect(mockPrismaService.topic.findUnique).toHaveBeenCalledWith({
        where: { id: 'topic-uuid-1' },
      });
      expect(mockPrismaService.quiz.create).toHaveBeenCalled();
      expect(result.id).toBe('quiz-uuid-1');
    });

    it('ném lỗi NotFoundException nếu lessonId không tồn tại', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          { title: 'Quiz Test', lessonId: 'non-existent-lesson' } as any,
          'creator-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('ném lỗi NotFoundException nếu topicId không tồn tại', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });
      mockPrismaService.topic.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          { title: 'Quiz Test', topicId: 'non-existent-topic' } as any,
          'creator-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('ném lỗi BadRequestException nếu câu hỏi không có đáp án đúng nào', async () => {
      const invalidDto = {
        title: 'Quiz Lỗi',
        questions: [
          {
            questionText: 'Câu hỏi không có đáp án đúng?',
            type: QuestionType.MULTIPLE_CHOICE,
            options: [
              { optionText: 'Sai 1', isCorrect: false },
              { optionText: 'Sai 2', isCorrect: false },
            ],
          },
        ],
      };

      await expect(service.create(invalidDto as any, 'creator-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('ném lỗi BadRequestException nếu MULTIPLE_CHOICE có từ 2 đáp án đúng trở lên', async () => {
      const invalidDto = {
        title: 'Quiz Lỗi Single Choice',
        questions: [
          {
            questionText: 'Câu hỏi single choice bị gán 2 đáp án đúng?',
            type: QuestionType.MULTIPLE_CHOICE,
            options: [
              { optionText: 'Đúng 1', isCorrect: true },
              { optionText: 'Đúng 2', isCorrect: true },
            ],
          },
        ],
      };

      await expect(service.create(invalidDto as any, 'creator-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ==========================================
  // 2. FIND ALL QUIZZES
  // ==========================================
  describe('findAll', () => {
    it('trả về danh sách phân trang từ database khi cache miss', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.quiz.count.mockResolvedValue(1);
      mockPrismaService.quiz.findMany.mockResolvedValue([
        { id: 'quiz-1', title: 'Quiz 1', status: ContentStatus.PUBLISHED },
      ]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('trả về kết quả từ cache khi cache hit', async () => {
      const cachedData = {
        items: [{ id: 'quiz-cached', title: 'Quiz Cached' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockRedisService.get.mockResolvedValue(cachedData);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.items[0].id).toBe('quiz-cached');
      expect(mockPrismaService.quiz.findMany).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // 3. FIND ONE QUIZ
  // ==========================================
  describe('findOne', () => {
    it('trả về chi tiết Quiz kèm isCorrect khi isAuthorOrAdmin = true', async () => {
      const mockQuiz = {
        id: 'quiz-1',
        title: 'Quiz 1',
        questions: [
          {
            id: 'q-1',
            questionText: 'Câu hỏi 1',
            options: [{ id: 'opt-1', optionText: 'Đáp án 1', isCorrect: true }],
          },
        ],
      };

      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.quiz.findUnique.mockResolvedValue(mockQuiz);

      const result = await service.findOne('quiz-1', true);

      expect(result.id).toBe('quiz-1');
      expect(result.questions[0].options[0].isCorrect).toBe(true);
    });

    it('ném lỗi NotFoundException nếu Quiz không tồn tại', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.quiz.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-quiz')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ==========================================
  // 4. REVIEW QUIZ
  // ==========================================
  describe('review', () => {
    it('ném lỗi BadRequestException khi REJECTED mà không có rejectionReason', async () => {
      mockPrismaService.quiz.findUnique.mockResolvedValue({ id: 'quiz-1' });

      await expect(
        service.review(
          'quiz-1',
          { status: ContentStatus.REJECTED },
          'admin-user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('duyệt xuất bản PUBLISHED thành công', async () => {
      mockPrismaService.quiz.findUnique.mockResolvedValue({ id: 'quiz-1' });
      mockPrismaService.quiz.update.mockResolvedValue({
        id: 'quiz-1',
        status: ContentStatus.PUBLISHED,
      });

      const result = await service.review(
        'quiz-1',
        { status: ContentStatus.PUBLISHED },
        'admin-user-1',
      );

      expect(result.status).toBe(ContentStatus.PUBLISHED);
      expect(mockRedisService.del).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 5. START ATTEMPT
  // ==========================================
  describe('startAttempt', () => {
    it('ném lỗi ForbiddenException nếu Quiz chưa được PUBLISHED (ví dụ DRAFT)', async () => {
      mockPrismaService.quiz.findUnique.mockResolvedValue({
        id: 'quiz-draft',
        status: ContentStatus.DRAFT,
      });

      await expect(
        service.startAttempt('quiz-draft', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('ném lỗi BadRequestException khi đã đạt giới hạn maxAttempts', async () => {
      mockPrismaService.quiz.findUnique.mockResolvedValue({
        id: 'quiz-limited',
        status: ContentStatus.PUBLISHED,
        maxAttempts: 2,
      });
      mockPrismaService.quizAttempt.count.mockResolvedValue(2);

      await expect(
        service.startAttempt('quiz-limited', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('khởi tạo attempt thành công và che giấu isCorrect của câu hỏi', async () => {
      mockPrismaService.quiz.findUnique.mockResolvedValue({
        id: 'quiz-published',
        title: 'Quiz Thi',
        status: ContentStatus.PUBLISHED,
        maxAttempts: 3,
        passingScore: 70,
        xpReward: 50,
        questions: [
          {
            id: 'q-1',
            questionText: 'Câu hỏi thi?',
            type: QuestionType.MULTIPLE_CHOICE,
            points: 1,
            displayOrder: 0,
            options: [
              { id: 'opt-1', optionText: 'Đáp án A', displayOrder: 0 },
            ],
          },
        ],
      });
      mockPrismaService.quizAttempt.count.mockResolvedValue(0);
      mockPrismaService.quizAttempt.create.mockResolvedValue({
        id: 'attempt-uuid-new',
        quizId: 'quiz-published',
        userId: 'user-1',
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
      });

      const result = await service.startAttempt('quiz-published', 'user-1');

      expect(result.attemptId).toBe('attempt-uuid-new');
      expect(result.questions[0].options[0]).not.toHaveProperty('isCorrect');
    });
  });

  // ==========================================
  // 6. SUBMIT ATTEMPT
  // ==========================================
  describe('submitAttempt', () => {
    it('ném lỗi ForbiddenException nếu nộp thay cho người dùng khác', async () => {
      mockPrismaService.quizAttempt.findUnique.mockResolvedValue({
        id: 'attempt-1',
        userId: 'owner-user',
        status: AttemptStatus.IN_PROGRESS,
        quiz: { questions: [] },
      });

      await expect(
        service.submitAttempt('attempt-1', 'different-user', { answers: [] }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('ném lỗi BadRequestException nếu lượt làm bài đã hoàn thành trước đó', async () => {
      mockPrismaService.quizAttempt.findUnique.mockResolvedValue({
        id: 'attempt-1',
        userId: 'user-1',
        status: AttemptStatus.COMPLETED,
        quiz: { questions: [] },
      });

      await expect(
        service.submitAttempt('attempt-1', 'user-1', { answers: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('chấm điểm thành công và cấp XP khi đỗ', async () => {
      const mockAttempt = {
        id: 'attempt-1',
        userId: 'user-1',
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
        quiz: {
          id: 'quiz-1',
          title: 'Quiz 1',
          passingScore: 70,
          xpReward: 50,
          timeLimitMinutes: 30,
          questions: [
            {
              id: 'q-1',
              questionText: 'Câu 1',
              type: QuestionType.MULTIPLE_CHOICE,
              points: 10,
              explanation: 'Giải thích chi tiết',
              options: [
                { id: 'opt-correct', isCorrect: true },
                { id: 'opt-wrong', isCorrect: false },
              ],
            },
          ],
        },
      };

      mockPrismaService.quizAttempt.findUnique.mockResolvedValue(mockAttempt);
      mockPrismaService.quizAttemptAnswer.createMany.mockResolvedValue({ count: 1 });
      mockPrismaService.quizAttempt.update.mockResolvedValue({});

      const result = await service.submitAttempt('attempt-1', 'user-1', {
        answers: [
          {
            questionId: 'q-1',
            selectedOptionIds: ['opt-correct'],
          },
        ],
      });

      expect(result.score).toBe(100);
      expect(result.passed).toBe(true);
      expect(result.earnedXp).toBe(50);
      expect(result.answers).toHaveLength(1);
      expect(result.answers![0].isCorrect).toBe(true);
      expect(result.answers![0].explanation).toBe('Giải thích chi tiết');
    });
  });

  // ==========================================
  // 7. GET USER ATTEMPTS
  // ==========================================
  describe('getUserAttempts', () => {
    it('lấy danh sách các lượt làm bài của người dùng thành công', async () => {
      mockPrismaService.quizAttempt.findMany.mockResolvedValue([
        { id: 'att-1', userId: 'user-1', score: 90, passed: true },
        { id: 'att-2', userId: 'user-1', score: 60, passed: false },
      ]);

      const result = await service.getUserAttempts('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].score).toBe(90);
    });
  });
});
