import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../common/services/prisma.service';
import { QuizStatisticsService } from './quiz-statistics.service';
import { QuizQuestionType } from './types/quiz-question.types';

const singleChoice = {
  id: 'q1',
  type: QuizQuestionType.SINGLE_CHOICE,
  prompt: '<p>Ai thắng trận <b>Bạch Đằng</b> 938?</p>',
  explanation: null,
  data: {
    options: [
      { id: 'a', text: 'Ngô Quyền', isCorrect: true },
      { id: 'b', text: 'Lê Hoàn', isCorrect: false },
      { id: 'c', text: 'Trần Hưng Đạo', isCorrect: false },
    ],
  },
};

const trueFalse = {
  id: 'q2',
  type: QuizQuestionType.TRUE_FALSE,
  prompt: 'Năm 938 là thế kỷ X',
  explanation: null,
  data: { correctAnswer: true },
};

const link = (
  question: typeof singleChoice | typeof trueFalse,
  order: number,
) => ({
  quizId: 'quiz-1',
  questionId: question.id,
  displayOrder: order,
  points: 10,
  question,
});

describe('QuizStatisticsService', () => {
  let service: QuizStatisticsService;
  const prisma = {
    quiz: { findUnique: jest.fn() },
    quizAttempt: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    quizAttemptAnswer: { groupBy: jest.fn() },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        QuizStatisticsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(QuizStatisticsService);
    prisma.quiz.findUnique.mockResolvedValue({
      id: 'quiz-1',
      title: 'Đề 1',
      topics: [{ name: 'Bạch Đằng 938' }],
      quizQuestions: [link(singleChoice, 0), link(trueFalse, 1)],
    });
  });

  it('tổng hợp trên mọi lượt làm, không chỉ danh sách gần đây', async () => {
    prisma.quizAttempt.aggregate.mockResolvedValue({
      _count: { _all: 120 },
      _avg: { scorePercent: 61.6, timeSpentSeconds: 90 },
    });
    prisma.quizAttempt.count.mockResolvedValue(30);
    prisma.quizAttempt.findMany.mockResolvedValue([
      { id: 'a1', learnerName: null, user: null, createdAt: new Date() },
      {
        id: 'a2',
        learnerName: null,
        user: { username: 'hoc-vien' },
        createdAt: new Date(),
      },
    ]);
    prisma.quizAttemptAnswer.groupBy.mockResolvedValue([]);
    prisma.$queryRaw.mockResolvedValue([]);

    const stats = await service.getQuizStatistics('quiz-1');

    expect(stats.summary).toEqual({
      totalAttempts: 120,
      passedAttempts: 30,
      passRatePercent: 25,
      averageScore: 62,
      averageTimeMinutes: '1.5',
    });
    expect(stats.topicTitle).toBe('Bạch Đằng 938');
    expect(stats.recentAttempts.map((a) => a.learnerName)).toEqual([
      'Thí sinh tự do',
      'hoc-vien',
    ]);
  });

  it('tỷ lệ đúng từng câu và đáp án sai hay bị chọn nhất', async () => {
    prisma.quizAttempt.aggregate.mockResolvedValue({
      _count: { _all: 4 },
      _avg: { scorePercent: 50, timeSpentSeconds: 60 },
    });
    prisma.quizAttempt.count.mockResolvedValue(2);
    prisma.quizAttempt.findMany.mockResolvedValue([]);
    prisma.quizAttemptAnswer.groupBy.mockResolvedValue([
      { questionId: 'q1', isCorrect: true, _count: { _all: 1 } },
      { questionId: 'q1', isCorrect: false, _count: { _all: 3 } },
      { questionId: 'q2', isCorrect: true, _count: { _all: 4 } },
    ]);
    prisma.$queryRaw.mockResolvedValue([
      { question_id: 'q1', answer: 'c', n: 2 },
      { question_id: 'q1', answer: 'b', n: 1 },
    ]);

    const stats = await service.getQuizStatistics('quiz-1');

    expect(stats.questions).toEqual([
      {
        questionId: 'q1',
        type: QuizQuestionType.SINGLE_CHOICE,
        prompt: 'Ai thắng trận Bạch Đằng 938?',
        answered: 4,
        correct: 1,
        correctRatePercent: 25,
        topWrongAnswer: { label: 'Trần Hưng Đạo', count: 2 },
      },
      expect.objectContaining({
        questionId: 'q2',
        answered: 4,
        correctRatePercent: 100,
        topWrongAnswer: null,
      }),
    ]);
  });

  it('chưa có lượt làm → toàn số 0', async () => {
    prisma.quizAttempt.aggregate.mockResolvedValue({
      _count: { _all: 0 },
      _avg: { scorePercent: null, timeSpentSeconds: null },
    });
    prisma.quizAttempt.count.mockResolvedValue(0);
    prisma.quizAttempt.findMany.mockResolvedValue([]);
    prisma.quizAttemptAnswer.groupBy.mockResolvedValue([]);
    prisma.$queryRaw.mockResolvedValue([]);

    const stats = await service.getQuizStatistics('quiz-1');

    expect(stats.summary).toMatchObject({
      totalAttempts: 0,
      passRatePercent: 0,
      averageScore: 0,
    });
    expect(stats.questions.every((q) => q.correctRatePercent === 0)).toBe(true);
  });

  it('đề không tồn tại → 404', async () => {
    prisma.quiz.findUnique.mockResolvedValue(null);

    await expect(service.getQuizStatistics('khong-co')).rejects.toThrow(
      NotFoundException,
    );
  });
});
