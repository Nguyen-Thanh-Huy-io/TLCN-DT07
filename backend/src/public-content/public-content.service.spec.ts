import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../common/services/prisma.service';
import { PublicContentService } from './public-content.service';

/** Câu hỏi của đề lấy từ Ngân hàng qua `quiz_questions` (đã sắp theo thứ tự trong đề). */
const bankLink = (id: string, type: string, prompt: string, data: object) => ({
  quizId: 'quiz-1',
  questionId: id,
  displayOrder: 0,
  points: 10,
  question: { id, type, prompt, explanation: null, data },
});

const QUIZ_LINKS = [
  bankLink('q1', 'SINGLE_CHOICE', 'Ai thắng trận Bạch Đằng 938?', {
    options: [
      { id: 'a', text: 'Ngô Quyền', isCorrect: true },
      { id: 'b', text: 'Lý Bí', isCorrect: false },
    ],
  }),
  bankLink('q2', 'TRUE_FALSE', 'Kinh đô năm 939 là Cổ Loa', {
    correctAnswer: true,
  }),
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
      quizQuestions: QUIZ_LINKS,
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
    // Sau khi nộp mới trả đáp án để người học xem lại bài.
    expect(result.questions).toEqual([
      expect.objectContaining({
        id: 'q1',
        options: expect.arrayContaining([
          expect.objectContaining({ id: 'a', isCorrect: true }),
        ]),
      }),
      expect.objectContaining({ id: 'q2', correctAnswer: true }),
    ]);
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

  it('câu định dạng cũ trong ngân hàng vẫn chấm được (trước đây cả đề trả 400)', async () => {
    prisma.quiz.findUnique.mockResolvedValue({
      passingScorePercent: 60,
      quizQuestions: [
        bankLink('legacy', 'MULTIPLE_CHOICE', 'Ai chỉ huy khiêu chiến?', {
          options: ['Trần Khánh Dư', 'Nguyễn Khoái'],
          correctAnswer: 'Nguyễn Khoái',
        }),
      ],
    });

    const result = await service.submitQuizAttempt('quiz-1', {
      timeSpentSeconds: 5,
      answers: { legacy: 'b' },
    });

    expect(result).toMatchObject({ totalQuestions: 1, correctCount: 1 });
  });
});
