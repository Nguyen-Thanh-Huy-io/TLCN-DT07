import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QueryQuizDto } from './dto/query-quiz.dto';
import { ReviewQuizDto } from './dto/review-quiz.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { AttemptResultDto } from './dto/attempt-response.dto';
import { QuestionEvaluatorFactory } from './evaluators/question-evaluator.factory';
import {
  ScoringStrategyContext,
  ScoringMode,
} from './strategies/scoring/scoring-strategy.context';
import {
  QUIZ_CONSTANTS,
  QUIZ_ERROR_MESSAGES,
  QUIZ_SUCCESS_MESSAGES,
} from './constants/quiz.constant';
import { ContentStatus, QuestionType, AttemptStatus, Prisma } from '@prisma/client';

export interface IPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class QuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logger: CustomLoggerService,
    private readonly questionEvaluatorFactory: QuestionEvaluatorFactory,
    private readonly scoringStrategyContext: ScoringStrategyContext,
  ) {}

  /**
   * Kiểm tra tính hợp lệ của câu hỏi và đáp án
   */
  private validateQuestions(questions?: CreateQuizDto['questions']): void {
    if (!questions || questions.length === 0) return;

    for (const q of questions) {
      const correctOptions = q.options.filter((o) => o.isCorrect);

      if (correctOptions.length === 0) {
        throw new BadRequestException(
          `Câu hỏi "${q.questionText}": ${QUIZ_ERROR_MESSAGES.NO_CORRECT_OPTION}`,
        );
      }

      if (
        q.type === QuestionType.MULTIPLE_CHOICE &&
        correctOptions.length > 1
      ) {
        throw new BadRequestException(
          `Câu hỏi "${q.questionText}": ${QUIZ_ERROR_MESSAGES.MULTIPLE_CORRECT_FOR_SINGLE_CHOICE}`,
        );
      }
    }
  }

  /**
   * Tạo bài kiểm tra (Quiz) mới kèm câu hỏi & đáp án
   */
  async create(createQuizDto: CreateQuizDto, creatorUserId: string): Promise<any> {
    this.logger.log(`Creating quiz: ${createQuizDto.title}`, 'QuizService');

    if (createQuizDto.lessonId) {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: createQuizDto.lessonId },
      });
      if (!lesson) {
        throw new NotFoundException(
          `${QUIZ_ERROR_MESSAGES.LESSON_NOT_FOUND} ID: ${createQuizDto.lessonId}`,
        );
      }
    }

    if (createQuizDto.topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: createQuizDto.topicId },
      });
      if (!topic) {
        throw new NotFoundException(
          `${QUIZ_ERROR_MESSAGES.TOPIC_NOT_FOUND} ID: ${createQuizDto.topicId}`,
        );
      }
    }

    this.validateQuestions(createQuizDto.questions);

    const { questions, ...quizData } = createQuizDto;

    const quiz = await this.prisma.quiz.create({
      data: {
        ...quizData,
        createdBy: creatorUserId,
        status: ContentStatus.DRAFT,
        questions:
          questions && questions.length > 0
            ? {
                create: questions.map((q, qIndex) => ({
                  questionText: q.questionText,
                  explanation: q.explanation,
                  type: q.type,
                  points: q.points || 1,
                  displayOrder: q.displayOrder ?? qIndex,
                  options: {
                    create: q.options.map((opt, optIndex) => ({
                      optionText: opt.optionText,
                      isCorrect: opt.isCorrect,
                      displayOrder: opt.displayOrder ?? optIndex,
                    })),
                  },
                })),
              }
            : undefined,
      },
      include: {
        creator: { select: { id: true, email: true, username: true } },
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    await this.invalidateCache();
    return quiz;
  }

  /**
   * Lấy danh sách bài kiểm tra (phân trang, lọc theo topicId, lessonId, status, search)
   */
  async findAll(query: QueryQuizDto): Promise<IPaginatedResult<any>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.QuizWhereInput = {};

    if (query.lessonId) {
      where.lessonId = query.lessonId;
    }

    if (query.topicId) {
      where.topicId = query.topicId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const cacheKey = `${QUIZ_CONSTANTS.CACHE_PREFIX}:${JSON.stringify({ where, page, limit })}`;
    try {
      const cached = await this.redis.get<IPaginatedResult<any>>(cacheKey);
      if (cached) return cached;
    } catch (err) {
      this.logger.warn(`Redis get error: ${err.message}`, 'QuizService');
    }

    const [total, items] = await Promise.all([
      this.prisma.quiz.count({ where }),
      this.prisma.quiz.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          lesson: { select: { id: true, title: true } },
          topic: { select: { id: true, name: true } },
          creator: { select: { id: true, email: true, username: true } },
          _count: {
            select: { questions: true, attempts: true },
          },
        },
      }),
    ]);

    const result: IPaginatedResult<any> = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    try {
      await this.redis.set(cacheKey, result, QUIZ_CONSTANTS.CACHE_TTL);
    } catch (err) {
      this.logger.warn(`Redis set error: ${err.message}`, 'QuizService');
    }

    return result;
  }

  /**
   * Lấy chi tiết bài kiểm tra (bao gồm câu hỏi, che giấu isCorrect nếu là người học thông thường)
   */
  async findOne(id: string, isAuthorOrAdmin = false): Promise<any> {
    const cacheKey = `${QUIZ_CONSTANTS.CACHE_DETAIL_PREFIX}:${id}:${isAuthorOrAdmin}`;
    try {
      const cached = await this.redis.get<any>(cacheKey);
      if (cached) return cached;
    } catch (err) {
      this.logger.warn(`Redis get error: ${err.message}`, 'QuizService');
    }

    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        lesson: { select: { id: true, title: true } },
        topic: { select: { id: true, name: true } },
        creator: { select: { id: true, email: true, username: true } },
        approver: { select: { id: true, email: true, username: true } },
        questions: {
          orderBy: { displayOrder: 'asc' },
          include: {
            options: {
              orderBy: { displayOrder: 'asc' },
              select: {
                id: true,
                questionId: true,
                optionText: true,
                isCorrect: isAuthorOrAdmin, // Chỉ trả về isCorrect cho tác giả hoặc admin
                displayOrder: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`${QUIZ_ERROR_MESSAGES.QUIZ_NOT_FOUND} ID: ${id}`);
    }

    try {
      await this.redis.set(cacheKey, quiz, QUIZ_CONSTANTS.CACHE_TTL);
    } catch (err) {
      this.logger.warn(`Redis set error: ${err.message}`, 'QuizService');
    }

    return quiz;
  }

  /**
   * Cập nhật thông tin bài kiểm tra
   */
  async update(id: string, updateQuizDto: UpdateQuizDto): Promise<any> {
    await this.findOne(id, true);

    if (updateQuizDto.lessonId) {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: updateQuizDto.lessonId },
      });
      if (!lesson) {
        throw new NotFoundException(
          `${QUIZ_ERROR_MESSAGES.LESSON_NOT_FOUND} ID: ${updateQuizDto.lessonId}`,
        );
      }
    }

    if (updateQuizDto.topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: updateQuizDto.topicId },
      });
      if (!topic) {
        throw new NotFoundException(
          `${QUIZ_ERROR_MESSAGES.TOPIC_NOT_FOUND} ID: ${updateQuizDto.topicId}`,
        );
      }
    }

    this.validateQuestions(updateQuizDto.questions);

    const { questions, ...quizData } = updateQuizDto;

    const updated = await this.prisma.quiz.update({
      where: { id },
      data: {
        ...quizData,
      },
      include: {
        creator: { select: { id: true, email: true, username: true } },
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    await this.invalidateCache(id);
    return updated;
  }

  /**
   * Duyệt hoặc từ chối bài kiểm tra (Admin/Reviewer)
   */
  async review(id: string, reviewDto: ReviewQuizDto, adminUserId: string): Promise<any> {
    await this.findOne(id, true);

    if (
      reviewDto.status === ContentStatus.REJECTED &&
      !reviewDto.rejectionReason
    ) {
      throw new BadRequestException(QUIZ_ERROR_MESSAGES.REJECTION_REASON_REQUIRED);
    }

    const updated = await this.prisma.quiz.update({
      where: { id },
      data: {
        status: reviewDto.status,
        approver: { connect: { id: adminUserId } },
      },
      include: {
        creator: { select: { id: true, email: true, username: true } },
        approver: { select: { id: true, email: true, username: true } },
      },
    });

    await this.invalidateCache(id);
    return updated;
  }

  /**
   * Xóa một bài kiểm tra
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(id, true);

    await this.prisma.quiz.delete({
      where: { id },
    });

    await this.invalidateCache(id);

    return {
      success: true,
      message: `${QUIZ_SUCCESS_MESSAGES.QUIZ_DELETED} (ID: ${id})`,
    };
  }

  /**
   * Người học bắt đầu một lượt làm bài kiểm tra (Start Attempt)
   */
  async startAttempt(quizId: string, userId: string): Promise<any> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { displayOrder: 'asc' },
          include: {
            options: {
              orderBy: { displayOrder: 'asc' },
              select: {
                id: true,
                optionText: true,
                displayOrder: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`${QUIZ_ERROR_MESSAGES.QUIZ_NOT_FOUND} ID: ${quizId}`);
    }

    if (quiz.status !== ContentStatus.PUBLISHED) {
      throw new ForbiddenException(QUIZ_ERROR_MESSAGES.QUIZ_NOT_PUBLISHED);
    }

    // Kiểm tra giới hạn số lần làm bài (maxAttempts)
    if (quiz.maxAttempts) {
      const completedAttemptsCount = await this.prisma.quizAttempt.count({
        where: {
          quizId,
          userId,
          status: AttemptStatus.COMPLETED,
        },
      });

      if (completedAttemptsCount >= quiz.maxAttempts) {
        throw new BadRequestException(QUIZ_ERROR_MESSAGES.MAX_ATTEMPTS_REACHED);
      }
    }

    // Tạo bản ghi attempt mới
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        status: AttemptStatus.IN_PROGRESS,
      },
    });

    return {
      attemptId: attempt.id,
      quizId: quiz.id,
      title: quiz.title,
      description: quiz.description,
      timeLimitMinutes: quiz.timeLimitMinutes,
      passingScore: quiz.passingScore,
      xpReward: quiz.xpReward,
      startedAt: attempt.startedAt,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        type: q.type,
        points: q.points,
        displayOrder: q.displayOrder,
        options: q.options,
      })),
    };
  }

  /**
   * Nộp bài kiểm tra và chấm điểm tự động (Submit Attempt)
   */
  async submitAttempt(
    attemptId: string,
    userId: string,
    dto: SubmitAttemptDto,
  ): Promise<AttemptResultDto> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(
        `${QUIZ_ERROR_MESSAGES.ATTEMPT_NOT_FOUND} ID: ${attemptId}`,
      );
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền nộp bài cho lượt làm bài này');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException(QUIZ_ERROR_MESSAGES.ATTEMPT_ALREADY_COMPLETED);
    }

    const { quiz } = attempt;

    // Kiểm tra thời gian làm bài nếu có timeLimitMinutes (+1 phút bù trễ mạng)
    if (quiz.timeLimitMinutes) {
      const allowedTimeMs = (quiz.timeLimitMinutes + 1) * 60 * 1000;
      const elapsedTimeMs = Date.now() - new Date(attempt.startedAt).getTime();
      if (elapsedTimeMs > allowedTimeMs) {
        await this.prisma.quizAttempt.update({
          where: { id: attemptId },
          data: { status: AttemptStatus.TIMED_OUT, completedAt: new Date() },
        });
        throw new BadRequestException(
          'Đã quá thời gian quy định cho bài kiểm tra này (Timed Out)',
        );
      }
    }

    // Đánh giá từng câu hỏi bằng Factory Pattern
    const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));
    const evaluationResults: any[] = [];
    const answerRecords: any[] = [];
    const responseAnswersDetail: any[] = [];

    for (const question of quiz.questions) {
      const userAnswer = dto.answers.find((a) => a.questionId === question.id);
      const selectedOptionIds = userAnswer?.selectedOptionIds || [];
      const correctOptionIds = question.options
        .filter((o) => o.isCorrect)
        .map((o) => o.id);

      const evaluator = this.questionEvaluatorFactory.getEvaluator(question.type);
      const evalResult = evaluator.evaluate({
        questionId: question.id,
        userSelectedOptionIds: selectedOptionIds,
        correctOptionIds,
        points: question.points,
      });

      evaluationResults.push(evalResult);

      answerRecords.push({
        attemptId,
        questionId: question.id,
        selectedOptionIds,
        isCorrect: evalResult.isCorrect,
        earnedPoints: evalResult.earnedPoints,
      });

      responseAnswersDetail.push({
        questionId: question.id,
        questionText: question.questionText,
        selectedOptionIds,
        correctOptionIds,
        isCorrect: evalResult.isCorrect,
        earnedPoints: evalResult.earnedPoints,
        maxPoints: question.points,
        explanation: question.explanation,
      });
    }

    // Tính điểm tổng thể bằng Strategy Pattern
    this.scoringStrategyContext.setStrategy(ScoringMode.WEIGHTED);
    const scoreResult = this.scoringStrategyContext.executeStrategy({
      results: evaluationResults,
      passingScorePercentage: quiz.passingScore,
      xpReward: quiz.xpReward,
    });

    const completedAt = new Date();

    // Lưu vào database trong transaction
    await this.prisma.$transaction([
      this.prisma.quizAttemptAnswer.createMany({
        data: answerRecords,
      }),
      this.prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          score: scoreResult.scorePercentage,
          totalPoints: scoreResult.totalPoints,
          earnedPoints: scoreResult.earnedPoints,
          passed: scoreResult.passed,
          earnedXp: scoreResult.earnedXp,
          status: AttemptStatus.COMPLETED,
          completedAt,
        },
      }),
    ]);

    return {
      attemptId,
      quizId: quiz.id,
      quizTitle: quiz.title,
      score: scoreResult.scorePercentage,
      totalPoints: scoreResult.totalPoints,
      earnedPoints: scoreResult.earnedPoints,
      correctAnswersCount: scoreResult.correctAnswersCount,
      totalQuestionsCount: scoreResult.totalQuestionsCount,
      passed: scoreResult.passed,
      earnedXp: scoreResult.earnedXp,
      status: AttemptStatus.COMPLETED,
      startedAt: attempt.startedAt,
      completedAt,
      answers: responseAnswersDetail,
    };
  }

  /**
   * Lấy lịch sử làm bài kiểm tra của một người dùng
   */
  async getUserAttempts(userId: string, quizId?: string): Promise<any[]> {
    const where: Prisma.QuizAttemptWhereInput = { userId };
    if (quizId) {
      where.quizId = quizId;
    }

    return this.prisma.quizAttempt.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            xpReward: true,
          },
        },
      },
    });
  }

  /**
   * Xóa cache liên quan
   */
  private async invalidateCache(id?: string): Promise<void> {
    try {
      if (id) {
        await this.redis.del(`${QUIZ_CONSTANTS.CACHE_DETAIL_PREFIX}:${id}:true`);
        await this.redis.del(`${QUIZ_CONSTANTS.CACHE_DETAIL_PREFIX}:${id}:false`);
      }
      await this.redis.deleteByPattern(`${QUIZ_CONSTANTS.CACHE_PREFIX}:*`);
    } catch (err) {
      this.logger.warn(`Failed to clear quiz cache: ${err.message}`, 'QuizService');
    }
  }
}
