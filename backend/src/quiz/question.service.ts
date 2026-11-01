import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/create-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';
import { validateAndNormalizeQuestions } from './validators/quiz-question.validator';

@Injectable()
export class QuestionService {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Tự động đồng bộ các câu hỏi từ các đề Quiz đã có vào Ngân hàng câu hỏi nếu ngân hàng đang trống
    await this.backfillFromQuizzes();
  }

  async findAll(query: QueryQuestionDto) {
    const { search, type, difficulty, lessonId, topicId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (difficulty && difficulty !== 'all') where.difficulty = difficulty;
    if (lessonId) where.lessonId = lessonId;
    if (topicId) where.topicId = topicId;
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
          lesson: {
            select: { id: true, title: true },
          },
          topic: {
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
        lesson: {
          select: { id: true, title: true },
        },
        topic: {
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

    return this.prisma.question.create({
      data: {
        type: dto.type,
        prompt: dto.prompt,
        explanation: dto.explanation,
        difficulty: dto.difficulty || 'MEDIUM',
        points: dto.points || 10,
        data: dto.data || {},
        lessonId: dto.lessonId || null,
        topicId: dto.topicId || null,
      },
      include: {
        lesson: {
          select: { id: true, title: true },
        },
        topic: {
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

    return this.prisma.question.update({
      where: { id },
      data: {
        type: dto.type,
        prompt: dto.prompt,
        explanation: dto.explanation,
        difficulty: dto.difficulty || 'MEDIUM',
        points: dto.points || 10,
        data: dto.data || {},
        lessonId: dto.lessonId || null,
        topicId: dto.topicId || null,
      },
      include: {
        lesson: {
          select: { id: true, title: true },
        },
        topic: {
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
      for (const quiz of quizzes) {
        if (!Array.isArray(quiz.questions)) continue;
        for (const raw of quiz.questions as any[]) {
          if (!raw?.id || !raw?.type || !raw?.prompt) continue;
          const { id, type, prompt, explanation, ...restData } = raw;
          await this.prisma.question.create({
            data: {
              type,
              prompt,
              explanation: explanation || null,
              difficulty: 'MEDIUM',
              points: 10,
              data: restData,
              lessonId: quiz.lessonId,
            },
          });
        }
      }
    } catch (err) {
      console.warn('Lỗi khi backfill câu hỏi từ Quiz vào Question Bank:', err);
    }
  }
}
