import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DifficultyLevel, Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
} from './dto/create-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';
import { DEFAULT_QUESTION_POINTS } from './quiz.constant';
import { validateAndNormalizeQuestions } from './validators/quiz-question.validator';

@Injectable()
export class QuestionService {
  private readonly logger = new Logger(QuestionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Tự động đồng bộ các câu hỏi từ các đề Quiz đã có vào Ngân hàng câu hỏi nếu ngân hàng đang trống
    await this.backfillFromQuizzes();
  }

  async findAll(query: QueryQuestionDto) {
    const {
      search,
      type,
      difficulty,
      lessonId,
      topicId,
      page = 1,
      limit = 50,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.QuestionWhereInput = {};
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (lessonId) where.lessons = { some: { id: lessonId } };
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
        include: {
          lessons: {
            select: { id: true, title: true },
          },
          topics: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        lessons: {
          select: { id: true, title: true },
        },
        topics: {
          select: { id: true, name: true },
        },
      },
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

    const lessonIds = Array.from(
      new Set((dto.lessonIds || []).filter(Boolean)),
    );
    const topicIds = Array.from(new Set((dto.topicIds || []).filter(Boolean)));

    return this.prisma.question.create({
      data: {
        type: dto.type,
        prompt: dto.prompt,
        explanation: dto.explanation,
        difficulty: dto.difficulty || DifficultyLevel.MEDIUM,
        points: dto.points || DEFAULT_QUESTION_POINTS,
        data: (dto.data || {}) as Prisma.InputJsonValue,
        ...(lessonIds.length > 0
          ? { lessons: { connect: lessonIds.map((id) => ({ id })) } }
          : {}),
        ...(topicIds.length > 0
          ? { topics: { connect: topicIds.map((id) => ({ id })) } }
          : {}),
      },
      include: {
        lessons: {
          select: { id: true, title: true },
        },
        topics: {
          select: { id: true, name: true },
        },
      },
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

    const lessonIds = Array.from(
      new Set((dto.lessonIds || []).filter(Boolean)),
    );
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
        lessons: { set: lessonIds.map((itemId) => ({ id: itemId })) },
        topics: { set: topicIds.map((itemId) => ({ id: itemId })) },
      },
      include: {
        lessons: {
          select: { id: true, title: true },
        },
        topics: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.question.delete({ where: { id } });
    return { success: true, message: 'Đã xóa câu hỏi khỏi ngân hàng.' };
  }

  /**
   * Đồng bộ câu hỏi từ các đề Quiz có sẵn trong hệ thống vào Ngân hàng câu hỏi
   */
  async backfillFromQuizzes() {
    try {
      const count = await this.prisma.question.count();
      if (count > 0) return;

      const quizzes = await this.prisma.quiz.findMany();
      const createOperations = quizzes.flatMap((quiz) =>
        this.buildCreateOpsForQuiz(quiz.lessonId, quiz.questions),
      );

      if (createOperations.length > 0) {
        await this.prisma.$transaction(createOperations);
      }
    } catch (err) {
      this.logger.warn(
        `Lỗi khi backfill câu hỏi từ Quiz vào Question Bank: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private buildCreateOpsForQuiz(
    lessonId: string | null,
    questions: unknown,
  ): Prisma.PrismaPromise<unknown>[] {
    if (!Array.isArray(questions)) {
      return [];
    }

    const ops: Prisma.PrismaPromise<unknown>[] = [];
    for (const raw of questions as Array<Record<string, unknown>>) {
      if (
        typeof raw?.id !== 'string' ||
        typeof raw?.type !== 'string' ||
        typeof raw?.prompt !== 'string'
      ) {
        continue;
      }

      const restData: Record<string, unknown> = { ...raw };
      delete restData.id;
      delete restData.type;
      delete restData.prompt;
      delete restData.explanation;

      ops.push(
        this.prisma.question.create({
          data: {
            type: raw.type,
            prompt: raw.prompt,
            explanation:
              typeof raw.explanation === 'string' ? raw.explanation : null,
            difficulty: DifficultyLevel.MEDIUM,
            points: DEFAULT_QUESTION_POINTS,
            data: restData as Prisma.InputJsonValue,
            ...(lessonId ? { lessons: { connect: [{ id: lessonId }] } } : {}),
          },
        }),
      );
    }

    return ops;
  }
}
