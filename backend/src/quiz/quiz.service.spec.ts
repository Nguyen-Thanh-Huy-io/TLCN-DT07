import { NotFoundException, BadRequestException } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { PrismaService } from '../common/services/prisma.service';

describe('QuizService (Automated Unit Tests)', () => {
  let service: QuizService;
  let prisma: Partial<Record<keyof PrismaService, any>>;

  beforeEach(() => {
    prisma = {
      quiz: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        upsert: jest.fn(),
      },
      quizQuestion: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      lesson: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((callback) =>
        typeof callback === 'function'
          ? callback(prisma)
          : Promise.all(callback),
      ),
    };

    service = new QuizService(prisma as unknown as PrismaService);
  });

  describe('findAll', () => {
    it('trả về danh sách đề quiz với trạng thái ACTIVE và DRAFT được tính toán chuẩn xác', async () => {
      const mockQuizzes = [
        {
          id: 'quiz-1',
          title: 'Đề kiểm tra 15 phút',
          description: 'Mô tả đề 1',
          lessonId: 'lesson-1',
          timeLimitMinutes: 15,
          passingScorePercent: 80,
          questions: [
            {
              id: 'q1',
              type: 'SINGLE_CHOICE',
              prompt: 'Chiến thắng Bạch Đằng năm nào?',
              options: [{ id: 'opt1', text: '938', isCorrect: true }],
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
          topics: [
            {
              id: 'topic-1',
              name: 'Lịch sử Trung Đại',
              slug: 'lich-su-trung-dai',
            },
          ],
          lesson: {
            id: 'lesson-1',
            title: 'Ngô Quyền và chiến thắng Bạch Đằng',
            slug: 'ngo-quyen-bach-dang',
            description: 'Tóm tắt bài học',
          },
        },
        {
          id: 'quiz-2',
          title: null,
          description: null,
          lessonId: null,
          timeLimitMinutes: 20,
          passingScorePercent: 70,
          questions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          topics: [],
          lesson: null,
        },
      ];

      (prisma.quiz.findMany as jest.Mock).mockResolvedValue(mockQuizzes);
      (prisma.quiz.count as jest.Mock).mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);

      // Đề 1 có câu hỏi -> ACTIVE
      expect(result.items[0].status).toBe('ACTIVE');
      expect(result.items[0].questionCount).toBe(1);
      expect(result.items[0].topicTitle).toBe('Lịch sử Trung Đại');

      // Đề 2 không có câu hỏi -> DRAFT
      expect(result.items[1].status).toBe('DRAFT');
      expect(result.items[1].questionCount).toBe(0);
      expect(result.items[1].title).toBe('Đề kiểm tra trắc nghiệm');
    });
  });

  describe('findById', () => {
    it('ném NotFoundException nếu không tìm thấy đề quiz', async () => {
      (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('trả về chi tiết đề quiz nếu tồn tại', async () => {
      const mockQuiz = {
        id: 'quiz-1',
        title: 'Đề thi lịch sử',
        questions: [{ id: 'q1' }],
        lesson: {
          id: 'l1',
          title: 'Bài học 1',
        },
      };
      (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockQuiz);

      const result = await service.findById('quiz-1');
      expect(result.id).toBe('quiz-1');
      expect(result.questionCount).toBe(1);
      expect(result.status).toBe('ACTIVE');
    });

    it('ánh xạ câu hỏi từ quizQuestions khi questions JSON rỗng', async () => {
      const mockQuiz = {
        id: 'quiz-from-bank',
        title: 'Đề tổng hợp ngân hàng',
        questions: [],
        quizQuestions: [
          {
            displayOrder: 0,
            points: 10,
            question: {
              id: 'q-1',
              type: 'SINGLE_CHOICE',
              prompt: 'Chiến dịch Điện Biên Phủ diễn ra năm nào?',
              explanation: 'Năm 1954',
              data: {
                options: [
                  { id: 'opt1', text: '1954', isCorrect: true },
                  { id: 'opt2', text: '1975', isCorrect: false },
                ],
              },
            },
          },
        ],
      };
      (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockQuiz);

      const result = await service.findById('quiz-from-bank');
      expect(result.id).toBe('quiz-from-bank');
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].id).toBe('q-1');
      expect((result.questions[0] as any).prompt).toBe(
        'Chiến dịch Điện Biên Phủ diễn ra năm nào?',
      );
      expect(result.questionCount).toBe(1);
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('createStandalone', () => {
    it('tạo đề quiz độc lập thành công', async () => {
      const dto = {
        title: 'Đề kiểm tra ôn tập',
        description: 'Mô tả',
        timeLimitMinutes: 15,
        passingScorePercent: 80,
        questions: [],
      };

      (prisma.quiz.create as jest.Mock).mockResolvedValue({
        id: 'quiz-new',
        ...dto,
      });

      const result = await service.createStandalone(dto);
      expect(result.id).toBe('quiz-new');
      expect(prisma.quiz.create).toHaveBeenCalled();
    });

    it('tạo đề quiz độc lập gắn nhiều Topic thành công', async () => {
      const dto = {
        title: 'Đề kiểm tra giai đoạn Lý - Trần',
        description: 'Mô tả',
        topicIds: ['topic-ly', 'topic-tran'],
        timeLimitMinutes: 20,
        passingScorePercent: 80,
        questions: [],
      };

      (prisma.quiz.create as jest.Mock).mockResolvedValue({
        id: 'quiz-multi-topic',
        ...dto,
        topics: [
          { id: 'topic-ly', name: 'Nhà Lý' },
          { id: 'topic-tran', name: 'Nhà Trần' },
        ],
      });

      const result = await service.createStandalone(dto);
      expect(result.id).toBe('quiz-multi-topic');
      expect(prisma.quiz.create).toHaveBeenCalled();
    });

    it('tạo đề quiz độc lập kèm câu hỏi từ Ngân hàng câu hỏi thành công', async () => {
      const dto = {
        title: 'Đề khảo thí chọn lọc',
        topicIds: ['topic-1'],
        questionIds: ['q-bank-1', 'q-bank-2'],
      };

      (prisma.quiz.create as jest.Mock).mockResolvedValue({
        id: 'quiz-with-bank-questions',
        title: dto.title,
        questions: [],
        quizQuestions: [
          {
            quizId: 'quiz-with-bank-questions',
            questionId: 'q-bank-1',
            displayOrder: 0,
            points: 10,
          },
          {
            quizId: 'quiz-with-bank-questions',
            questionId: 'q-bank-2',
            displayOrder: 1,
            points: 10,
          },
        ],
      });

      const result = await service.createStandalone(dto as any);
      expect(result.id).toBe('quiz-with-bank-questions');
      expect(prisma.quiz.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quizQuestions: {
              create: [
                { questionId: 'q-bank-1', displayOrder: 0, points: 10 },
                { questionId: 'q-bank-2', displayOrder: 1, points: 10 },
              ],
            },
          }),
        }),
      );
    });

    it('ném BadRequestException nếu bài học liên kết đã có đề quiz khác', async () => {
      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue({
        id: 'l1',
        title: 'Bài học 1',
      });
      (prisma.quiz.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-quiz',
      });

      await expect(
        service.createStandalone({
          title: 'Đề mới',
          lessonId: 'l1',
          questions: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStandalone', () => {
    it('cập nhật đề quiz và đồng bộ câu hỏi từ ngân hàng qua transaction', async () => {
      const mockExisting = { id: 'quiz-1', title: 'Cũ', questions: [] };
      (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockExisting);
      (prisma.quiz.update as jest.Mock).mockResolvedValue({
        id: 'quiz-1',
        title: 'Mới',
        questions: [],
      });

      const result = await service.updateStandalone('quiz-1', {
        title: 'Mới',
        questionIds: ['q-new-1', 'q-new-2'],
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.quizQuestion.deleteMany).toHaveBeenCalledWith({
        where: { quizId: 'quiz-1' },
      });
      expect(prisma.quizQuestion.createMany).toHaveBeenCalledWith({
        data: [
          {
            quizId: 'quiz-1',
            questionId: 'q-new-1',
            displayOrder: 0,
            points: 10,
          },
          {
            quizId: 'quiz-1',
            questionId: 'q-new-2',
            displayOrder: 1,
            points: 10,
          },
        ],
      });
      expect(result.id).toBe('quiz-1');
    });

    it('cập nhật thông tin thông thường khi không truyền questionIds', async () => {
      const mockExisting = { id: 'quiz-1', title: 'Cũ', questions: [] };
      (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockExisting);
      (prisma.quiz.update as jest.Mock).mockResolvedValue({
        id: 'quiz-1',
        title: 'Cập nhật tiêu đề',
      });

      const result = await service.updateStandalone('quiz-1', {
        title: 'Cập nhật tiêu đề',
      });

      expect(prisma.quiz.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'quiz-1' },
          data: expect.objectContaining({ title: 'Cập nhật tiêu đề' }),
        }),
      );
      expect(result.id).toBe('quiz-1');
    });
  });

  describe('removeById', () => {
    it('xóa đề quiz thành công', async () => {
      (prisma.quiz.findUnique as jest.Mock).mockResolvedValue({ id: 'quiz-1' });
      (prisma.quiz.delete as jest.Mock).mockResolvedValue({ id: 'quiz-1' });

      const result = await service.removeById('quiz-1');
      expect(result.success).toBe(true);
      expect(prisma.quiz.delete).toHaveBeenCalledWith({
        where: { id: 'quiz-1' },
      });
    });
  });

  describe('getQuizByTopic', () => {
    it('trả về đề thi của một topic nếu tồn tại', async () => {
      const mockQuiz = {
        id: 'quiz-topic-1',
        title: 'Khảo thí Nhà Trần',
        topics: [{ id: 'topic-tran', name: 'Nhà Trần' }],
      };
      (prisma.quiz.findFirst as jest.Mock).mockResolvedValue(mockQuiz);

      const result = await service.getQuizByTopic('topic-tran');
      expect(result).toBeDefined();
      expect(result?.id).toBe('quiz-topic-1');
    });
  });
});
