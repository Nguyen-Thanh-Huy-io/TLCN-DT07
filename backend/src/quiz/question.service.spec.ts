import { DifficultyLevel } from '@prisma/client';
import { QuestionService } from './question.service';
import { PrismaService } from '../common/services/prisma.service';
import { DEFAULT_QUESTION_POINTS } from './quiz.constant';

describe('QuestionService', () => {
  let service: QuestionService;
  let prisma: {
    question: {
      count: jest.Mock;
      create: jest.Mock;
    };
    quiz: {
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      question: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn((args) => args),
      },
      quiz: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'quiz-1',
            lessonId: 'lesson-1',
            questions: [
              {
                id: 'q-1',
                type: 'SINGLE_CHOICE',
                prompt: 'Chiến thắng Bạch Đằng diễn ra năm nào?',
                explanation: 'Năm 938',
                options: [{ id: 'o1', text: '938', isCorrect: true }],
              },
              {
                id: 'q-2',
                type: 'TRUE_FALSE',
                prompt: 'Ngô Quyền xưng vương năm 939.',
                correctAnswer: true,
              },
            ],
          },
        ]),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };

    service = new QuestionService(prisma as unknown as PrismaService);
  });

  it('backfillFromQuizzes gộp các lệnh tạo câu hỏi vào một $transaction thay vì N+1 tuần tự', async () => {
    await service.backfillFromQuizzes();

    expect(prisma.question.count).toHaveBeenCalledTimes(1);
    expect(prisma.quiz.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.question.create).toHaveBeenCalledTimes(2);
    expect(prisma.question.create).toHaveBeenCalledWith({
      data: {
        type: 'SINGLE_CHOICE',
        prompt: 'Chiến thắng Bạch Đằng diễn ra năm nào?',
        explanation: 'Năm 938',
        difficulty: DifficultyLevel.MEDIUM,
        points: DEFAULT_QUESTION_POINTS,
        data: {
          options: [{ id: 'o1', text: '938', isCorrect: true }],
        },
        lessons: { connect: [{ id: 'lesson-1' }] },
      },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction.mock.calls[0][0]).toHaveLength(2);
  });

  it('backfillFromQuizzes bỏ qua nếu ngân hàng câu hỏi đã có dữ liệu', async () => {
    prisma.question.count.mockResolvedValueOnce(5);

    await service.backfillFromQuizzes();

    expect(prisma.quiz.findMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
