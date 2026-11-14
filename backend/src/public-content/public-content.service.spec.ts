import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../common/services/prisma.service';
import { PublicContentService } from './public-content.service';

const STORED_QUESTIONS = [
  {
    id: 'q1',
    type: 'SINGLE_CHOICE',
    prompt: 'Ai thắng trận Bạch Đằng 938?',
    options: [
      { id: 'a', text: 'Ngô Quyền', isCorrect: true },
      { id: 'b', text: 'Lý Bí', isCorrect: false },
    ],
  },
  {
    id: 'q2',
    type: 'TRUE_FALSE',
    prompt: 'Kinh đô năm 939 là Cổ Loa',
    correctAnswer: true,
  },
];

describe('PublicContentService — nộp bài quiz', () => {
  let service: PublicContentService;
  const prisma = {
    quiz: { findUnique: jest.fn() },
    quizAttempt: { create: jest.fn().mockResolvedValue({ id: 'attempt-1' }) },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.quiz.findUnique.mockResolvedValue({
      questions: STORED_QUESTIONS,
      passingScorePercent: 60,
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        PublicContentService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(PublicContentService);
  });

  it('chấm theo đáp án lưu trong đề và lưu điểm do server tính', async () => {
    const result = await service.submitQuizAttempt('quiz-1', {
      timeSpentSeconds: 30,
      answers: { q1: 'a', q2: false },
    });

    expect(result).toMatchObject({
      attemptId: 'attempt-1',
      correctCount: 1,
      totalQuestions: 2,
      scorePercent: 50,
      isPassed: false,
      results: { q1: true, q2: false },
    });
    expect(prisma.quizAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ scorePercent: 50, isPassed: false }),
      }),
    );
  });

  it('đạt khi điểm bằng hoặc vượt ngưỡng của đề', async () => {
    const result = await service.submitQuizAttempt('quiz-1', {
      timeSpentSeconds: 30,
      answers: { q1: 'a', q2: true },
    });

    expect(result.scorePercent).toBe(100);
    expect(result.isPassed).toBe(true);
  });

  it('đề không tồn tại → NotFoundException', async () => {
    prisma.quiz.findUnique.mockResolvedValue(null);

    await expect(
      service.submitQuizAttempt('khong-co', {
        timeSpentSeconds: 1,
        answers: {},
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
