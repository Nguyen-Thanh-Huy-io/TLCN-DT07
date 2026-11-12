import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { UpsertQuizDto } from './dto/upsert-quiz.dto';
import {
  CreateStandaloneQuizDto,
  QuizQuestionItemDto,
  UpdateStandaloneQuizDto,
} from './dto/create-standalone-quiz.dto';
import { QueryQuizDto } from './dto/query-quiz.dto';
import { DEFAULT_QUIZ_PASSING_SCORE_PERCENT } from './quiz.constant';
import { validateAndNormalizeQuestions } from './validators/quiz-question.validator';

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  /** Chuẩn hóa danh sách câu hỏi gán từ Ngân hàng câu hỏi */
  private buildQuizQuestionsData(
    questionIds?: string[],
    questionItems?: QuizQuestionItemDto[],
  ): Array<{ questionId: string; displayOrder: number; points: number }> {
    if (questionItems && questionItems.length > 0) {
      return questionItems.map((item, idx) => ({
        questionId: item.questionId,
        displayOrder: item.displayOrder ?? idx,
        points: item.points ?? 10,
      }));
    }
    if (questionIds && questionIds.length > 0) {
      return questionIds.map((qid, idx) => ({
        questionId: qid,
        displayOrder: idx,
        points: 10,
      }));
    }
    return [];
  }

  /** Lấy danh sách đề Quiz độc lập (hỗ trợ tìm kiếm, phân trang) */
  async findAll(query: QueryQuizDto) {
    const { search, lessonId, topicId, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (lessonId) {
      where.lessonId = lessonId;
    }

    if (topicId) {
      where.topics = { some: { id: topicId } };
    }

    if (search && search.trim()) {
      const keyword = search.trim();
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { lesson: { title: { contains: keyword, mode: 'insensitive' } } },
        {
          topics: {
            some: { name: { contains: keyword, mode: 'insensitive' } },
          },
        },
      ];
    }

    const [rawItems, total] = await Promise.all([
      this.prisma.quiz.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          topics: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          lesson: {
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
            },
          },
          _count: {
            select: {
              quizQuestions: true,
            },
          },
        },
      }),
      this.prisma.quiz.count({ where }),
    ]);

    // Format kết quả chuẩn cho UI DataTable
    const items = rawItems
      .map((quiz) => {
        const questionsArray = Array.isArray(quiz.questions)
          ? (quiz.questions as any[])
          : [];
        const questionCount =
          questionsArray.length + (quiz._count?.quizQuestions ?? 0);
        const isDraft = questionCount === 0;

        const lesson = quiz.lesson;
        const topics = quiz.topics || [];
        const topicTitle =
          topics.length > 0
            ? topics.map((t) => t.name).join(', ')
            : lesson?.title
              ? `Bài học: ${lesson.title}`
              : 'Đề thi độc lập';

        return {
          id: quiz.id,
          title:
            quiz.title ||
            (topics.length > 0
              ? `Đề khảo thí: ${topics[0].name}`
              : lesson?.title
                ? `Đề ôn tập: ${lesson.title}`
                : 'Đề kiểm tra trắc nghiệm'),
          description: quiz.description,
          lessonId: quiz.lessonId,
          lessonTitle: lesson?.title || null,
          topicTitle,
          topics,
          lesson: lesson
            ? {
                id: lesson.id,
                title: lesson.title,
                slug: lesson.slug,
                description: lesson.description,
                topicTitle,
              }
            : null,
          timeLimitMinutes: quiz.timeLimitMinutes ?? 15,
          passingScorePercent:
            quiz.passingScorePercent ?? DEFAULT_QUIZ_PASSING_SCORE_PERCENT,
          questionCount,
          questions: quiz.questions,
          status: isDraft ? 'DRAFT' : 'ACTIVE',
          createdAt: quiz.createdAt,
          updatedAt: quiz.updatedAt,
        };
      })
      .filter((q) => {
        if (status && status !== 'all') {
          return q.status === status;
        }
        return true;
      });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Lấy chi tiết đề thi độc lập theo ID */
  async findById(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        topics: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
          },
        },
        quizQuestions: {
          include: {
            question: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Không tìm thấy đề Quiz với ID "${id}"`);
    }

    const rawQuestions = Array.isArray(quiz.questions)
      ? (quiz.questions as any[])
      : [];

    let finalQuestions = [...rawQuestions];
    if (
      finalQuestions.length === 0 &&
      quiz.quizQuestions &&
      quiz.quizQuestions.length > 0
    ) {
      finalQuestions = quiz.quizQuestions.map((qq) => {
        const q = qq.question;
        const dataObj =
          typeof q.data === 'object' && q.data !== null
            ? (q.data as Record<string, any>)
            : {};
        return {
          id: q.id,
          type: q.type,
          prompt: q.prompt,
          explanation: q.explanation,
          points: qq.points,
          displayOrder: qq.displayOrder,
          ...dataObj,
        };
      });
    }

    const lesson = quiz.lesson;
    const topics = quiz.topics || [];
    const topicTitle =
      topics.length > 0
        ? topics.map((t) => t.name).join(', ')
        : lesson?.title
          ? `Bài học: ${lesson.title}`
          : 'Đề thi độc lập';

    return {
      ...quiz,
      title:
        quiz.title ||
        (topics.length > 0
          ? `Đề khảo thí: ${topics[0].name}`
          : lesson?.title
            ? `Đề ôn tập: ${lesson.title}`
            : 'Đề kiểm tra trắc nghiệm'),
      lessonTitle: lesson?.title || null,
      topicTitle,
      topics,
      questions: finalQuestions,
      questionCount: finalQuestions.length,
      status: finalQuestions.length > 0 ? 'ACTIVE' : 'DRAFT',
      passingScorePercent:
        quiz.passingScorePercent ?? DEFAULT_QUIZ_PASSING_SCORE_PERCENT,
    };
  }

  /** Tạo mới một đề Quiz độc lập (hỗ trợ gắn nhiều Topic hoặc tổng hợp từ Ngân hàng câu hỏi) */
  async createStandalone(dto: CreateStandaloneQuizDto) {
    let normalizedQuestions: unknown[] = [];
    if (dto.questions && dto.questions.length > 0) {
      normalizedQuestions = validateAndNormalizeQuestions(dto.questions);
    }

    if (dto.lessonId) {
      const lesson = await this.findLessonOrThrow(dto.lessonId);
      const existing = await this.prisma.quiz.findUnique({
        where: { lessonId: dto.lessonId },
      });
      if (existing) {
        throw new BadRequestException(
          `Bài học "${lesson.title}" đã có một đề Quiz. Vui lòng cập nhật đề hiện có.`,
        );
      }
    }

    const topicIds = Array.from(new Set((dto.topicIds || []).filter(Boolean)));
    const quizQuestionCreates = this.buildQuizQuestionsData(
      dto.questionIds,
      dto.questionItems,
    );

    return this.prisma.quiz.create({
      data: {
        title: dto.title,
        description: dto.description,
        lessonId: dto.lessonId || null,
        timeLimitMinutes: dto.timeLimitMinutes ?? 15,
        passingScorePercent:
          dto.passingScorePercent ?? DEFAULT_QUIZ_PASSING_SCORE_PERCENT,
        questions: normalizedQuestions as any,
        ...(topicIds.length > 0
          ? { topics: { connect: topicIds.map((id) => ({ id })) } }
          : {}),
        ...(quizQuestionCreates.length > 0
          ? {
              quizQuestions: {
                create: quizQuestionCreates,
              },
            }
          : {}),
      },
      include: {
        topics: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        quizQuestions: {
          include: {
            question: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    });
  }

  private async findLessonOrThrow(
    lessonId: string,
  ): Promise<{ id: string; title: string }> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, title: true },
    });
    if (!lesson) {
      throw new NotFoundException(
        `Không tìm thấy bài học với ID "${lessonId}"`,
      );
    }
    return lesson;
  }

  /** Cập nhật một đề Quiz độc lập theo ID */
  async updateStandalone(id: string, dto: UpdateStandaloneQuizDto) {
    const existing = await this.prisma.quiz.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy đề Quiz với ID "${id}"`);
    }

    let normalizedQuestions = existing.questions;
    if (dto.questions !== undefined) {
      normalizedQuestions = (
        dto.questions.length > 0
          ? validateAndNormalizeQuestions(dto.questions)
          : []
      ) as any;
    }

    if (dto.lessonId && dto.lessonId !== existing.lessonId) {
      await this.findLessonOrThrow(dto.lessonId);
    }

    const topicIds =
      dto.topicIds !== undefined
        ? Array.from(new Set(dto.topicIds.filter(Boolean)))
        : undefined;

    const hasQuizQuestionsUpdate =
      dto.questionIds !== undefined || dto.questionItems !== undefined;
    const quizQuestionCreates = this.buildQuizQuestionsData(
      dto.questionIds,
      dto.questionItems,
    );

    if (hasQuizQuestionsUpdate) {
      return this.prisma.$transaction(async (tx) => {
        await tx.quizQuestion.deleteMany({ where: { quizId: id } });
        if (quizQuestionCreates.length > 0) {
          await tx.quizQuestion.createMany({
            data: quizQuestionCreates.map((qq) => ({
              quizId: id,
              questionId: qq.questionId,
              displayOrder: qq.displayOrder,
              points: qq.points,
            })),
          });
        }

        return tx.quiz.update({
          where: { id },
          data: {
            ...(dto.title !== undefined ? { title: dto.title } : {}),
            ...(dto.description !== undefined
              ? { description: dto.description }
              : {}),
            ...(dto.lessonId !== undefined
              ? { lessonId: dto.lessonId || null }
              : {}),
            ...(dto.timeLimitMinutes !== undefined
              ? { timeLimitMinutes: dto.timeLimitMinutes }
              : {}),
            ...(dto.passingScorePercent !== undefined
              ? { passingScorePercent: dto.passingScorePercent }
              : {}),
            questions: normalizedQuestions as any,
            ...(topicIds !== undefined
              ? { topics: { set: topicIds.map((tid) => ({ id: tid })) } }
              : {}),
          },
          include: {
            topics: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            lesson: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
            quizQuestions: {
              include: {
                question: true,
              },
              orderBy: {
                displayOrder: 'asc',
              },
            },
          },
        });
      });
    }

    return this.prisma.quiz.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.lessonId !== undefined
          ? { lessonId: dto.lessonId || null }
          : {}),
        ...(dto.timeLimitMinutes !== undefined
          ? { timeLimitMinutes: dto.timeLimitMinutes }
          : {}),
        ...(dto.passingScorePercent !== undefined
          ? { passingScorePercent: dto.passingScorePercent }
          : {}),
        questions: normalizedQuestions as any,
        ...(topicIds !== undefined
          ? { topics: { set: topicIds.map((tid) => ({ id: tid })) } }
          : {}),
      },
      include: {
        topics: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        quizQuestions: {
          include: {
            question: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    });
  }

  /** Lấy đề thi thuộc 1 Topic (ưu tiên đề mới nhất) */
  async getQuizByTopic(topicId: string) {
    const quiz = await this.prisma.quiz.findFirst({
      where: {
        topics: { some: { id: topicId } },
      },
      include: {
        topics: { select: { id: true, name: true, slug: true } },
        lesson: { select: { id: true, title: true, slug: true } },
        quizQuestions: {
          include: { question: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!quiz) return null;

    const rawQuestions = Array.isArray(quiz.questions)
      ? (quiz.questions as any[])
      : [];

    let finalQuestions = [...rawQuestions];
    if (
      finalQuestions.length === 0 &&
      quiz.quizQuestions &&
      quiz.quizQuestions.length > 0
    ) {
      finalQuestions = quiz.quizQuestions.map((qq) => {
        const q = qq.question;
        const dataObj =
          typeof q.data === 'object' && q.data !== null
            ? (q.data as Record<string, any>)
            : {};
        return {
          id: q.id,
          type: q.type,
          prompt: q.prompt,
          explanation: q.explanation,
          points: qq.points,
          displayOrder: qq.displayOrder,
          ...dataObj,
        };
      });
    }

    return {
      ...quiz,
      questions: finalQuestions,
      questionCount: finalQuestions.length,
      status: finalQuestions.length > 0 ? 'ACTIVE' : 'DRAFT',
    };
  }

  /** Xóa đề Quiz độc lập theo ID */
  async removeById(id: string) {
    const existing = await this.prisma.quiz.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy đề Quiz với ID "${id}"`);
    }
    await this.prisma.quiz.delete({ where: { id } });
    return { success: true, message: 'Đã xóa đề Quiz thành công.' };
  }

  /** Lấy đề ôn tập của 1 bài học (null nếu chưa có — hợp lệ, không phải lỗi) */
  async findByLessonId(lessonId: string) {
    return this.prisma.quiz.findUnique({ where: { lessonId } });
  }

  /** Tạo mới hoặc cập nhật nguyên đề theo Lesson (tương thích ngược với LessonEditor) */
  async upsert(lessonId: string, dto: UpsertQuizDto) {
    await this.findLessonOrThrow(lessonId);

    const questions = validateAndNormalizeQuestions(dto.questions);

    return this.prisma.quiz.upsert({
      where: { lessonId },
      create: {
        lessonId,
        title: dto.title,
        passingScorePercent: dto.passingScorePercent,
        questions: questions as any,
      },
      update: {
        title: dto.title,
        passingScorePercent: dto.passingScorePercent,
        questions: questions as any,
      },
    });
  }

  /** Xóa đề ôn tập của 1 bài học */
  async remove(lessonId: string) {
    const existing = await this.prisma.quiz.findUnique({ where: { lessonId } });
    if (!existing) {
      throw new NotFoundException(`Bài học này chưa có đề ôn tập.`);
    }
    await this.prisma.quiz.delete({ where: { lessonId } });
    return { success: true, message: 'Đã xóa đề ôn tập.' };
  }
}
