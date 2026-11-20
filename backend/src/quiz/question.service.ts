import { Injectable, NotFoundException } from '@nestjs/common';
import { DifficultyLevel, Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
} from './dto/create-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';
import { DEFAULT_QUESTION_POINTS } from './quiz.constant';
import { validateAndNormalizeQuestions } from './validators/quiz-question.validator';

/** Chủ đề + số đề đang dùng câu hỏi (ngân hàng hiện "Đã dùng trong đề"). */
const QUESTION_INCLUDE = {
  topics: { select: { id: true, name: true } },
  _count: { select: { quizQuestions: true } },
} satisfies Prisma.QuestionInclude;

/** Số lượt người học trả lời câu này (mọi đề) và số lượt đúng. */
export interface QuestionAnswerStats {
  answered: number;
  correct: number;
}

@Injectable()
export class QuestionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryQuestionDto) {
    const { search, type, difficulty, topicId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.QuestionWhereInput = {};
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (topicId) where.topics = { some: { id: topicId } };
    if (search && search.trim()) {
      where.OR = [
        { prompt: { contains: search.trim(), mode: 'insensitive' } },
        { explanation: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: QUESTION_INCLUDE,
      }),
      this.prisma.question.count({ where }),
    ]);

    const results = await this.prisma.quizAttemptAnswer.groupBy({
      by: ['questionId', 'isCorrect'],
      where: { questionId: { in: items.map((q) => q.id) } },
      _count: { _all: true },
    });
    const statsOf = (questionId: string): QuestionAnswerStats => {
      const rows = results.filter((r) => r.questionId === questionId);
      return {
        answered: rows.reduce((n, r) => n + r._count._all, 0),
        correct: rows.find((r) => r.isCorrect)?._count._all ?? 0,
      };
    };

    return {
      items: items.map((q) => ({ ...q, answerStats: statsOf(q.id) })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: QUESTION_INCLUDE,
    });
    if (!question) {
      throw new NotFoundException(`Không tìm thấy câu hỏi với ID "${id}"`);
    }
    return question;
  }

  async create(dto: CreateQuestionDto) {
    // Validate cấu trúc câu hỏi theo đúng Strategy của type
    const rawToValidate = {
      id: 'temp_id',
      type: dto.type,
      prompt: dto.prompt,
      explanation: dto.explanation,
      ...(dto.data || {}),
    };
    validateAndNormalizeQuestions([rawToValidate]);
    const topicIds = Array.from(new Set((dto.topicIds || []).filter(Boolean)));

    return this.prisma.question.create({
      data: {
        type: dto.type,
        prompt: dto.prompt,
        explanation: dto.explanation,
        difficulty: dto.difficulty || DifficultyLevel.MEDIUM,
        points: dto.points || DEFAULT_QUESTION_POINTS,
        data: (dto.data || {}) as Prisma.InputJsonValue,
        ...(topicIds.length > 0
          ? { topics: { connect: topicIds.map((id) => ({ id })) } }
          : {}),
      },
      include: QUESTION_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateQuestionDto) {
    await this.findOne(id);

    const rawToValidate = {
      id,
      type: dto.type,
      prompt: dto.prompt,
      explanation: dto.explanation,
      ...(dto.data || {}),
    };
    validateAndNormalizeQuestions([rawToValidate]);
    const topicIds = Array.from(new Set((dto.topicIds || []).filter(Boolean)));

    return this.prisma.question.update({
      where: { id },
      data: {
        type: dto.type,
        prompt: dto.prompt,
        explanation: dto.explanation,
        difficulty: dto.difficulty || DifficultyLevel.MEDIUM,
        points: dto.points || DEFAULT_QUESTION_POINTS,
        data: (dto.data || {}) as Prisma.InputJsonValue,
        topics: { set: topicIds.map((itemId) => ({ id: itemId })) },
      },
      include: QUESTION_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.question.delete({ where: { id } });
    return { success: true, message: 'Đã xóa câu hỏi khỏi ngân hàng.' };
  }
}
