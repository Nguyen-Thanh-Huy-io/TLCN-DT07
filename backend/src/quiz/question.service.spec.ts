import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DifficultyLevel } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { QuestionService } from './question.service';
import { DEFAULT_QUESTION_POINTS } from './quiz.constant';
import { QuizQuestionType } from './types/quiz-question.types';

describe('QuestionService — Ngân hàng câu hỏi', () => {
  let service: QuestionService;
  const prisma = {
    question: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(({ data }: { data: object }) => ({ id: 'q-1', ...data })),
      update: jest.fn(({ data }: { data: object }) => ({ id: 'q-1', ...data })),
      delete: jest.fn(),
    },
  };

  const singleChoice = {
    type: QuizQuestionType.SINGLE_CHOICE,
    prompt: 'Chiến thắng Bạch Đằng diễn ra năm nào?',
    data: {
      options: [
        { id: 'a', text: '938', isCorrect: true },
        { id: 'b', text: '1288', isCorrect: false },
      ],
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.question.findUnique.mockResolvedValue({ id: 'q-1' });
    const moduleRef = await Test.createTestingModule({
      providers: [
        QuestionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(QuestionService);
  });

  it('tạo câu hợp lệ: điểm và độ khó mặc định, gắn bài học / chủ đề không trùng', async () => {
    await service.create({
      ...singleChoice,
      lessonIds: ['l-1', 'l-1'],
      topicIds: ['t-1'],
    });

    expect(prisma.question.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          difficulty: DifficultyLevel.MEDIUM,
          points: DEFAULT_QUESTION_POINTS,
          data: singleChoice.data,
          lessons: { connect: [{ id: 'l-1' }] },
          topics: { connect: [{ id: 't-1' }] },
        }),
      }),
    );
  });

  it('từ chối câu sai định dạng (lựa chọn là chuỗi trần) → 400, không ghi', async () => {
    await expect(
      service.create({
        type: QuizQuestionType.SINGLE_CHOICE,
        prompt: 'Câu định dạng cũ',
        data: { options: ['938', '1288'], correctAnswer: '938' },
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.question.create).not.toHaveBeenCalled();
  });

  it('từ chối chọn 1 đáp án nhưng có 2 đáp án đúng', async () => {
    await expect(
      service.create({
        ...singleChoice,
        data: {
          options: [
            { id: 'a', text: '938', isCorrect: true },
            { id: 'b', text: '939', isCorrect: true },
          ],
        },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('cập nhật thay toàn bộ liên kết bài học / chủ đề', async () => {
    await service.update('q-1', { ...singleChoice, lessonIds: ['l-2'] });

    expect(prisma.question.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'q-1' },
        data: expect.objectContaining({
          lessons: { set: [{ id: 'l-2' }] },
          topics: { set: [] },
        }),
      }),
    );
  });

  it('câu không tồn tại → 404', async () => {
    prisma.question.findUnique.mockResolvedValue(null);

    await expect(service.remove('khong-co')).rejects.toThrow(NotFoundException);
  });
});
