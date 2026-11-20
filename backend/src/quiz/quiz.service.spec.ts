import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../common/services/prisma.service';
import {
  DEFAULT_QUESTION_POINTS,
  DEFAULT_QUIZ_PASSING_SCORE_PERCENT,
  QuizListStatus,
} from './quiz.constant';
import { QuizService } from './quiz.service';
import { QuizQuestionType } from './types/quiz-question.types';

const bankQuestion = (id: string, overrides: object = {}) => ({
  id,
  type: QuizQuestionType.TRUE_FALSE,
  prompt: `Câu ${id}`,
  explanation: null,
  data: { correctAnswer: true },
  ...overrides,
});

const storedQuiz = (overrides: object = {}) => ({
  id: 'quiz-1',
  title: null,
  description: null,
  passingScorePercent: null,
  timeLimitMinutes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  topics: [],
  quizQuestions: [],
  ...overrides,
});

const link = (
  id: string,
  displayOrder: number,
  question = bankQuestion(id),
) => ({
  quizId: 'quiz-1',
  questionId: id,
  displayOrder,
  points: 5,
  question,
});

describe('QuizService — đề thi theo chủ đề, câu hỏi lấy từ Ngân hàng', () => {
  let service: QuizService;
  const prisma = {
    quiz: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    quizQuestion: { deleteMany: jest.fn(), createMany: jest.fn() },
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn(prisma),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.quiz.findUnique.mockResolvedValue(storedQuiz());
    prisma.quiz.create.mockResolvedValue({ id: 'quiz-1' });
    const moduleRef = await Test.createTestingModule({
      providers: [QuizService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(QuizService);
  });

  describe('đọc đề', () => {
    it('câu hỏi dựng từ ngân hàng theo thứ tự trong đề, kèm điểm của đề', async () => {
      prisma.quiz.findUnique.mockResolvedValue(
        storedQuiz({ quizQuestions: [link('q1', 0), link('q2', 1)] }),
      );

      const quiz = await service.findById('quiz-1');

      expect(quiz.questions.map((q) => q.id)).toEqual(['q1', 'q2']);
      expect(quiz.questions[0]).toMatchObject({
        type: QuizQuestionType.TRUE_FALSE,
        correctAnswer: true,
        points: 5,
      });
      expect(quiz).toMatchObject({
        questionCount: 2,
        status: QuizListStatus.ACTIVE,
        passingScorePercent: DEFAULT_QUIZ_PASSING_SCORE_PERCENT,
      });
      expect(quiz).not.toHaveProperty('quizQuestions');
    });

    it('câu định dạng cũ được chuẩn hoá; câu không chấm được (MAP) bị bỏ qua', async () => {
      prisma.quiz.findUnique.mockResolvedValue(
        storedQuiz({
          quizQuestions: [
            link(
              'cu',
              0,
              bankQuestion('cu', {
                type: 'TRUE_FALSE',
                data: { options: ['Đúng', 'Sai'], correctAnswer: 'Sai' },
              }),
            ),
            link(
              'ban-do',
              1,
              bankQuestion('ban-do', { type: 'MAP', data: {} }),
            ),
          ],
        }),
      );

      const quiz = await service.findById('quiz-1');

      expect(quiz.questions).toHaveLength(1);
      expect(quiz.questions[0]).toMatchObject({
        id: 'cu',
        correctAnswer: false,
      });
    });

    it('tên và nhãn chủ đề dựng từ các chủ đề của đề', async () => {
      prisma.quiz.findUnique.mockResolvedValue(
        storedQuiz({
          topics: [
            { id: 't-1', name: 'Nhà Trần', slug: 'nha-tran' },
            { id: 't-2', name: 'Nhà Lý', slug: 'nha-ly' },
          ],
        }),
      );

      await expect(service.findById('quiz-1')).resolves.toMatchObject({
        title: 'Đề khảo thí: Nhà Trần',
        topicTitle: 'Nhà Trần, Nhà Lý',
      });
    });

    it('đề chưa có câu nào là bản nháp; đề không tồn tại → 404', async () => {
      await expect(service.findById('quiz-1')).resolves.toMatchObject({
        questionCount: 0,
        status: QuizListStatus.DRAFT,
      });

      prisma.quiz.findUnique.mockResolvedValue(null);
      await expect(service.findById('khong-co')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lọc trạng thái làm ngay trong truy vấn (không lọc sau khi đã phân trang)', async () => {
      prisma.quiz.findMany.mockResolvedValue([]);
      prisma.quiz.count.mockResolvedValue(0);

      await service.findAll({
        status: QuizListStatus.DRAFT,
        page: 2,
        limit: 10,
      });

      expect(prisma.quiz.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { quizQuestions: { none: {} } },
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('tạo / sửa đề — chỉ chọn câu từ ngân hàng', () => {
    it('tạo đề: gắn câu theo thứ tự, bỏ câu chọn trùng, điểm mặc định', async () => {
      await service.createStandalone({
        title: 'Đề 15 phút',
        topicIds: ['t-1'],
        questionIds: ['q2', 'q1', 'q2'],
      });

      expect(prisma.quiz.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            topics: { connect: [{ id: 't-1' }] },
            quizQuestions: {
              create: [
                {
                  questionId: 'q2',
                  displayOrder: 0,
                  points: DEFAULT_QUESTION_POINTS,
                },
                {
                  questionId: 'q1',
                  displayOrder: 1,
                  points: DEFAULT_QUESTION_POINTS,
                },
              ],
            },
          }),
        }),
      );
    });

    it('sửa đề kèm danh sách câu: thay toàn bộ câu trong 1 transaction', async () => {
      await service.updateStandalone('quiz-1', {
        questionItems: [{ questionId: 'q3', points: 20 }],
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.quizQuestion.deleteMany).toHaveBeenCalledWith({
        where: { quizId: 'quiz-1' },
      });
      expect(prisma.quizQuestion.createMany).toHaveBeenCalledWith({
        data: [
          { quizId: 'quiz-1', questionId: 'q3', displayOrder: 0, points: 20 },
        ],
      });
    });

    it('sửa đề không gửi câu hỏi thì giữ nguyên câu hiện có', async () => {
      await service.updateStandalone('quiz-1', { title: 'Tên mới' });

      expect(prisma.quizQuestion.deleteMany).not.toHaveBeenCalled();
      expect(prisma.quiz.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: 'Tên mới' }),
        }),
      );
    });
  });
});
