import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
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
  QUIZ_QUESTIONS_INCLUDE,
  QuizQuestionWithPoints,
  toQuizQuestions,
} from './quiz-question.mapper';

const QUIZ_DETAIL_INCLUDE = {
  topics: { select: { id: true, name: true, slug: true } },
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

const NO_TOPIC_LABEL = 'Chưa gắn chủ đề';
const UNTITLED_QUIZ = 'Đề kiểm tra trắc nghiệm';

/**
 * Đề thi thuộc Chủ đề (nhiều–nhiều), câu hỏi lấy từ Ngân hàng. Đề không gắn Bài học — ôn tập trong bài
 * học dùng khối QUIZ của Block Builder.
 */
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

  /** Đề kèm câu hỏi dựng từ ngân hàng (`questions` là mảng câu hỏi theo thứ tự trong đề). */
  private toQuizResponse(quiz: QuizWithDetail) {
    const { quizQuestions, ...rest } = quiz;
    const questions: QuizQuestionWithPoints[] = toQuizQuestions(quizQuestions);
    const topicNames = quiz.topics.map((t) => t.name);
    return {
      ...rest,
      title:
        quiz.title ||
        (topicNames.length > 0
          ? `Đề khảo thí: ${topicNames[0]}`
          : UNTITLED_QUIZ),
      topicTitle:
        topicNames.length > 0 ? topicNames.join(', ') : NO_TOPIC_LABEL,
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

  /** Danh sách đề cho CMS (tìm kiếm, lọc chủ đề / trạng thái, phân trang) */
  async findAll(query: QueryQuizDto) {
    const { search, topicId, status, page = 1, limit = 20 } = query;
    const keyword = search?.trim();

    const where: Prisma.QuizWhereInput = {
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

  /** Tạo đề: gắn các Chủ đề và chọn câu hỏi từ Ngân hàng */
  async createStandalone(dto: CreateStandaloneQuizDto) {
    const topicIds = Array.from(new Set((dto.topicIds || []).filter(Boolean)));
    const links = this.buildQuizQuestionLinks(
      dto.questionIds,
      dto.questionItems,
    );

    const created = await this.prisma.quiz.create({
      data: {
        title: dto.title,
        description: dto.description,
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

  /** Cập nhật đề; gửi `questionIds` / `questionItems` thì thay toàn bộ câu hỏi của đề */
  async updateStandalone(id: string, dto: UpdateStandaloneQuizDto) {
    const existing = await this.prisma.quiz.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy đề Quiz với ID "${id}"`);
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

  /** Xóa đề theo ID (câu hỏi vẫn ở lại Ngân hàng) */
  async removeById(id: string) {
    const existing = await this.prisma.quiz.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy đề Quiz với ID "${id}"`);
    }
    await this.prisma.quiz.delete({ where: { id } });
    return { success: true, message: 'Đã xóa đề Quiz thành công.' };
  }
}
