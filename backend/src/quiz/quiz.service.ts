import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { UpsertQuizDto } from './dto/upsert-quiz.dto';
import {
  CreateStandaloneQuizDto,
  QuizQuestionItemDto,
  UpdateStandaloneQuizDto,
} from './dto/create-standalone-quiz.dto';
import { QueryQuizDto } from './dto/query-quiz.dto';
import {
  DEFAULT_QUESTION_POINTS,
  DEFAULT_QUIZ_PASSING_SCORE_PERCENT,
  DEFAULT_QUIZ_TIME_LIMIT_MINUTES,
  QuizListStatus,
} from './quiz.constant';
import {
  bankDataOf,
  QUIZ_QUESTIONS_INCLUDE,
  QuizQuestionWithPoints,
  toQuizQuestions,
} from './quiz-question.mapper';
import { validateAndNormalizeQuestions } from './validators/quiz-question.validator';

const QUIZ_DETAIL_INCLUDE = {
  topics: { select: { id: true, name: true, slug: true } },
  lesson: {
    select: { id: true, title: true, slug: true, description: true },
  },
  ...QUIZ_QUESTIONS_INCLUDE,
} satisfies Prisma.QuizInclude;

type QuizWithDetail = Prisma.QuizGetPayload<{
  include: typeof QUIZ_DETAIL_INCLUDE;
}>;

interface QuizQuestionLinkInput {
  questionId: string;
  displayOrder: number;
  points: number;
}

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  /** Câu hỏi chọn từ Ngân hàng (kèm thứ tự / điểm) → dòng liên kết đề ↔ câu hỏi. */
  private buildQuizQuestionLinks(
    questionIds?: string[],
    questionItems?: QuizQuestionItemDto[],
  ): QuizQuestionLinkInput[] {
    const items: QuizQuestionItemDto[] =
      questionItems ??
      (questionIds ?? []).map((questionId) => ({ questionId }));
    const seen = new Set<string>();
    return items
      .filter((item) => !seen.has(item.questionId) && seen.add(item.questionId))
      .map((item, idx) => ({
        questionId: item.questionId,
        displayOrder: item.displayOrder ?? idx,
        points: item.points ?? DEFAULT_QUESTION_POINTS,
      }));
  }

  private describeQuiz(quiz: QuizWithDetail) {
    const topics = quiz.topics;
    const lesson = quiz.lesson;
    const topicTitle =
      topics.length > 0
        ? topics.map((t) => t.name).join(', ')
        : lesson?.title
          ? `Bài học: ${lesson.title}`
          : 'Đề thi độc lập';
    const title =
      quiz.title ||
      (topics.length > 0
        ? `Đề khảo thí: ${topics[0].name}`
        : lesson?.title
          ? `Đề ôn tập: ${lesson.title}`
          : 'Đề kiểm tra trắc nghiệm');
    return { topicTitle, title };
  }

  /** Đề kèm câu hỏi dựng từ ngân hàng — hình dạng response giữ như trước (`questions` là mảng câu hỏi). */
  private toQuizResponse(quiz: QuizWithDetail) {
    const { quizQuestions, ...rest } = quiz;
    const questions: QuizQuestionWithPoints[] = toQuizQuestions(quizQuestions);
    const { topicTitle, title } = this.describeQuiz(quiz);
    return {
      ...rest,
      title,
      lessonTitle: quiz.lesson?.title ?? null,
      topicTitle,
      lesson: quiz.lesson ? { ...quiz.lesson, topicTitle } : null,
      timeLimitMinutes:
        quiz.timeLimitMinutes ?? DEFAULT_QUIZ_TIME_LIMIT_MINUTES,
      passingScorePercent:
        quiz.passingScorePercent ?? DEFAULT_QUIZ_PASSING_SCORE_PERCENT,
      questions,
      questionCount: questions.length,
      status:
        questions.length > 0 ? QuizListStatus.ACTIVE : QuizListStatus.DRAFT,
    };
  }

  /** Lấy danh sách đề Quiz độc lập (hỗ trợ tìm kiếm, phân trang) */
  async findAll(query: QueryQuizDto) {
    const { search, lessonId, topicId, status, page = 1, limit = 20 } = query;
    const keyword = search?.trim();

    const where: Prisma.QuizWhereInput = {
      ...(lessonId ? { lessonId } : {}),
      ...(topicId ? { topics: { some: { id: topicId } } } : {}),
      ...(status === QuizListStatus.ACTIVE
        ? { quizQuestions: { some: {} } }
        : {}),
      ...(status === QuizListStatus.DRAFT
        ? { quizQuestions: { none: {} } }
        : {}),
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword, mode: 'insensitive' } },
              { description: { contains: keyword, mode: 'insensitive' } },
              {
                lesson: { title: { contains: keyword, mode: 'insensitive' } },
              },
              {
                topics: {
                  some: { name: { contains: keyword, mode: 'insensitive' } },
                },
              },
            ],
          }
        : {}),
    };

    const [rawItems, total] = await Promise.all([
      this.prisma.quiz.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: QUIZ_DETAIL_INCLUDE,
      }),
      this.prisma.quiz.count({ where }),
    ]);

    return {
      items: rawItems.map((quiz) => this.toQuizResponse(quiz)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Lấy chi tiết đề thi theo ID */
  async findById(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: QUIZ_DETAIL_INCLUDE,
    });
    if (!quiz) {
      throw new NotFoundException(`Không tìm thấy đề Quiz với ID "${id}"`);
    }
    return this.toQuizResponse(quiz);
  }

  /** Tạo mới một đề Quiz độc lập: gắn Topic và chọn câu hỏi từ Ngân hàng */
  async createStandalone(dto: CreateStandaloneQuizDto) {
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
    const links = this.buildQuizQuestionLinks(
      dto.questionIds,
      dto.questionItems,
    );

    const created = await this.prisma.quiz.create({
      data: {
        title: dto.title,
        description: dto.description,
        lessonId: dto.lessonId || null,
        timeLimitMinutes:
          dto.timeLimitMinutes ?? DEFAULT_QUIZ_TIME_LIMIT_MINUTES,
        passingScorePercent:
          dto.passingScorePercent ?? DEFAULT_QUIZ_PASSING_SCORE_PERCENT,
        ...(topicIds.length > 0
          ? { topics: { connect: topicIds.map((id) => ({ id })) } }
          : {}),
        ...(links.length > 0 ? { quizQuestions: { create: links } } : {}),
      },
      select: { id: true },
    });
    return this.findById(created.id);
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

  /** Cập nhật một đề Quiz độc lập; gửi `questionIds` / `questionItems` thì thay toàn bộ câu hỏi của đề */
  async updateStandalone(id: string, dto: UpdateStandaloneQuizDto) {
    const existing = await this.prisma.quiz.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy đề Quiz với ID "${id}"`);
    }
    if (dto.lessonId && dto.lessonId !== existing.lessonId) {
      await this.findLessonOrThrow(dto.lessonId);
    }

    const topicIds =
      dto.topicIds !== undefined
        ? Array.from(new Set(dto.topicIds.filter(Boolean)))
        : undefined;
    const replacesQuestions =
      dto.questionIds !== undefined || dto.questionItems !== undefined;
    const links = this.buildQuizQuestionLinks(
      dto.questionIds,
      dto.questionItems,
    );

    await this.prisma.$transaction(async (tx) => {
      if (replacesQuestions) {
        await tx.quizQuestion.deleteMany({ where: { quizId: id } });
        if (links.length > 0) {
          await tx.quizQuestion.createMany({
            data: links.map((link) => ({ quizId: id, ...link })),
          });
        }
      }
      await tx.quiz.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
          ...(dto.lessonId !== undefined
            ? { lessonId: dto.lessonId || null }
            : {}),
          timeLimitMinutes: dto.timeLimitMinutes,
          passingScorePercent: dto.passingScorePercent,
          ...(topicIds !== undefined
            ? { topics: { set: topicIds.map((tid) => ({ id: tid })) } }
            : {}),
        },
      });
    });
    return this.findById(id);
  }

  /** Lấy đề thi thuộc 1 Topic (ưu tiên đề mới nhất) */
  async getQuizByTopic(topicId: string) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { topics: { some: { id: topicId } } },
      include: QUIZ_DETAIL_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
    return quiz ? this.toQuizResponse(quiz) : null;
  }

  /** Xóa đề Quiz độc lập theo ID (câu hỏi vẫn ở lại Ngân hàng) */
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
    const quiz = await this.prisma.quiz.findUnique({
      where: { lessonId },
      include: QUIZ_DETAIL_INCLUDE,
    });
    return quiz ? this.toQuizResponse(quiz) : null;
  }

  /**
   * Lưu đề ôn tập của bài học từ trình soạn bài (soạn câu ngay tại chỗ): câu đã có trong Ngân hàng
   * thì cập nhật nội dung, câu mới thì tạo vào Ngân hàng (gắn với bài học), rồi gắn vào đề theo thứ tự.
   */
  async upsert(lessonId: string, dto: UpsertQuizDto) {
    await this.findLessonOrThrow(lessonId);
    const questions = validateAndNormalizeQuestions(dto.questions);

    await this.prisma.$transaction(async (tx) => {
      const known = await tx.question.findMany({
        where: { id: { in: questions.map((q) => q.id) } },
        select: { id: true },
      });
      const knownIds = new Set(known.map((q) => q.id));
      const lessonLink = { lessons: { connect: { id: lessonId } } };

      // Mỗi câu có nội dung khác nhau nên phải ghi từng câu (Prisma không cập nhật hàng loạt khác giá trị).
      const bankIds: string[] = [];
      for (const question of questions) {
        const content = {
          type: question.type,
          prompt: question.prompt,
          explanation: question.explanation ?? null,
          data: bankDataOf(question),
        };
        const saved = knownIds.has(question.id)
          ? await tx.question.update({
              where: { id: question.id },
              data: { ...content, ...lessonLink },
              select: { id: true },
            })
          : await tx.question.create({
              data: { ...content, ...lessonLink },
              select: { id: true },
            });
        bankIds.push(saved.id);
      }

      const quiz = await tx.quiz.upsert({
        where: { lessonId },
        create: {
          lessonId,
          title: dto.title,
          passingScorePercent: dto.passingScorePercent,
        },
        update: {
          title: dto.title,
          passingScorePercent: dto.passingScorePercent,
        },
        select: { id: true },
      });
      const links = this.buildQuizQuestionLinks(bankIds);
      await tx.quizQuestion.deleteMany({ where: { quizId: quiz.id } });
      await tx.quizQuestion.createMany({
        data: links.map((link) => ({ quizId: quiz.id, ...link })),
      });
    });
    return this.findByLessonId(lessonId);
  }

  /** Xóa đề ôn tập của 1 bài học (câu hỏi vẫn ở lại Ngân hàng) */
  async remove(lessonId: string) {
    const existing = await this.prisma.quiz.findUnique({ where: { lessonId } });
    if (!existing) {
      throw new NotFoundException(`Bài học này chưa có đề ôn tập.`);
    }
    await this.prisma.quiz.delete({ where: { lessonId } });
    return { success: true, message: 'Đã xóa đề ôn tập.' };
  }
}
