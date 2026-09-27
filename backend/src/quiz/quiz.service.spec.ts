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
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('QuizService', () => {
  let service: QuizService;
  let prisma: PrismaService;
  let redis: RedisService;

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
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('nên tạo Quiz thành công khi dữ liệu hợp lệ', async () => {
      const mockDto = {
        title: 'Quiz Lịch sử 1',
        lessonId: 'lesson-123',
        passingScore: 80,
        questions: [
          {
            questionText: 'Chiến thắng Bạch Đằng năm nào?',
            type: QuestionType.MULTIPLE_CHOICE,
            points: 1,
            options: [
              { optionText: 'Năm 938', isCorrect: true },
              { optionText: 'Năm 981', isCorrect: false },
            ],
          },
        ],
      };

      mockPrismaService.lesson.findUnique.mockResolvedValue({ id: 'lesson-123' });
      mockPrismaService.quiz.create.mockResolvedValue({
        id: 'quiz-123',
        ...mockDto,
        status: ContentStatus.DRAFT,
      });

      const result = await service.create(mockDto as any, 'user-creator-1');

      expect(mockPrismaService.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: 'lesson-123' },
      });
      expect(mockPrismaService.quiz.create).toHaveBeenCalled();
      expect(result.id).toBe('quiz-123');
    });

    it('nên ném lỗi khi câu hỏi không có đáp án đúng nào', async () => {
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

      await expect(service.create(invalidDto as any, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('startAttempt', () => {
    it('nên bắt đầu lượt làm bài và ẩn isCorrect của đáp án', async () => {
      const mockQuiz = {
        id: 'quiz-123',
        title: 'Quiz 1',
        status: ContentStatus.PUBLISHED,
        passingScore: 70,
        xpReward: 50,
        maxAttempts: null,
        questions: [
          {
            id: 'q-1',
            questionText: 'Câu 1',
            type: QuestionType.MULTIPLE_CHOICE,
            points: 1,
            displayOrder: 0,
            options: [
              { id: 'opt-1', optionText: 'Đáp án A', displayOrder: 0 },
            ],
          },
        ],
      };

      mockPrismaService.quiz.findUnique.mockResolvedValue(mockQuiz);
      mockPrismaService.quizAttempt.create.mockResolvedValue({
        id: 'attempt-1',
        quizId: 'quiz-123',
        userId: 'user-1',
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
      });

      const result = await service.startAttempt('quiz-123', 'user-1');

      expect(result.attemptId).toBe('attempt-1');
      expect(result.questions[0].options[0]).not.toHaveProperty('isCorrect');
    });
  });

  describe('submitAttempt', () => {
    it('nên chấm điểm và trả về kết quả đạt khi đủ passing score', async () => {
      const mockAttempt = {
        id: 'attempt-1',
        userId: 'user-1',
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
        quiz: {
          id: 'quiz-123',
          title: 'Quiz 1',
          passingScore: 50,
          xpReward: 100,
          timeLimitMinutes: 15,
          questions: [
            {
              id: 'q-1',
              questionText: 'Câu 1',
              type: QuestionType.MULTIPLE_CHOICE,
              points: 10,
              explanation: 'Giải thích 1',
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
      expect(result.earnedXp).toBe(100);
      expect(result.status).toBe(AttemptStatus.COMPLETED);
    });
  });
});
