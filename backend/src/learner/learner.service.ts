import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContentStatus } from '@prisma/client';
import { loadAuthorProfiles } from '../common/utils/author-names';
import { PrismaService } from '../common/services/prisma.service';
import { GamificationEventName } from '../gamification/gamification.constant';
import { LessonService } from '../lesson/lesson.service';
import { PathPrerequisitePolicy } from '../learning-path/policies/path-prerequisite.policy';
import {
  ChapterProgressionEvaluator,
  EvaluableChapter,
  ProgressionGateKind,
} from '../learning-path/strategies/chapter-progression.evaluator';
import { ProgressionStrategyFactory } from '../learning-path/strategies/progression-strategy.factory';
import { LessonProgressionState } from '../learning-path/strategies/progression-strategy.interface';
import { gradeQuizAttempt } from '../quiz/quiz-grading';
import {
  QUIZ_QUESTIONS_INCLUDE,
  toQuizQuestions,
} from '../quiz/quiz-question.mapper';
import { LearnerHistoryQueryDto } from './dto/learner-history.dto';
import {
  LEARNER_ERROR_CODES,
  LEARNER_HISTORY_LIMITS,
  LEARNER_MESSAGES,
  LearnerHistoryKind,
} from './learner.constant';
import {
  CompletedLessonHistoryStrategy,
  LearnerHistoryStrategyRegistry,
  QuizAttemptHistoryStrategy,
  ReadArticleHistoryStrategy,
} from './strategies/learner-history.strategy';

@Injectable()
export class LearnerService {
  private readonly chapterEvaluator: ChapterProgressionEvaluator;
  private readonly historyRegistry: LearnerHistoryStrategyRegistry;

  constructor(
    private readonly prisma: PrismaService,
    private readonly lessonService: LessonService,
    private readonly prerequisitePolicy: PathPrerequisitePolicy,
    private readonly strategyFactory: ProgressionStrategyFactory,
    @Optional() private readonly eventEmitter?: EventEmitter2,
    @Optional() chapterEvaluator?: ChapterProgressionEvaluator,
    @Optional() historyRegistry?: LearnerHistoryStrategyRegistry,
  ) {
    this.chapterEvaluator =
      chapterEvaluator ?? new ChapterProgressionEvaluator();
    this.historyRegistry =
      historyRegistry ??
      new LearnerHistoryStrategyRegistry(
        new QuizAttemptHistoryStrategy(this.prisma),
        new CompletedLessonHistoryStrategy(this.prisma),
        new ReadArticleHistoryStrategy(this.prisma),
      );
  }

  /** Lộ trình đã đăng ký + bài đã hoàn thành + các bài kiểm tra (Quiz) đã đậu & điểm cao nhất của người học. */
  async getOverview(userId: string) {
    const [enrollments, progress, quizAttempts] = await Promise.all([
      this.prisma.learningPathEnrollment.findMany({
        where: { userId },
        select: { learningPathId: true, enrolledAt: true },
        orderBy: { enrolledAt: 'asc' },
      }),
      this.prisma.lessonProgress.findMany({
        where: { userId },
        select: { lessonId: true, completedAt: true },
      }),
      this.prisma.quizAttempt
        ? this.prisma.quizAttempt.findMany({
            where: { userId },
            select: { quizId: true, scorePercent: true, isPassed: true },
          })
        : Promise.resolve(
            [] as Array<{
              quizId: string;
              scorePercent?: number;
              isPassed?: boolean;
            }>,
          ),
    ]);

    const passedSet = new Set<string>();
    const bestQuizScores: Record<string, number> = {};
    for (const attempt of quizAttempts) {
      if (attempt.isPassed !== false) {
        passedSet.add(attempt.quizId);
      }
      if (typeof attempt.scorePercent === 'number') {
        const prev = bestQuizScores[attempt.quizId] ?? -1;
        if (attempt.scorePercent > prev) {
          bestQuizScores[attempt.quizId] = attempt.scorePercent;
        }
      }
    }

    return {
      enrolledPathIds: enrollments.map((e) => e.learningPathId),
      completedLessonIds: progress.map((p) => p.lessonId),
      passedQuizIds: Array.from(passedSet),
      ...(Object.keys(bestQuizScores).length > 0 ? { bestQuizScores } : {}),
    };
  }

  async enroll(userId: string, learningPathId: string) {
    const path = await this.prisma.learningPath.findFirst({
      where: { id: learningPathId, status: ContentStatus.PUBLISHED },
      select: { id: true, title: true },
    });
    if (!path) {
      throw new NotFoundException(
        LEARNER_MESSAGES.PATH_NOT_FOUND(learningPathId),
      );
    }

    const prerequisiteCheck =
      await this.prerequisitePolicy.validateEnrollmentEligibility(
        userId,
        learningPathId,
      );

    if (!prerequisiteCheck.isEligible) {
      throw new BadRequestException({
        code: LEARNER_ERROR_CODES.PREREQUISITE_NOT_MET,
        message:
          prerequisiteCheck.reason ||
          LEARNER_MESSAGES.PREREQUISITE_NOT_MET(
            prerequisiteCheck.prerequisitePathTitle || 'tiên quyết',
            prerequisiteCheck.completedLessons,
            prerequisiteCheck.totalLessons,
          ),
        details: prerequisiteCheck,
      });
    }

    await this.prisma.learningPathEnrollment.upsert({
      where: { userId_learningPathId: { userId, learningPathId } },
      update: {},
      create: { userId, learningPathId },
    });
    return this.getOverview(userId);
  }

  async unenroll(userId: string, learningPathId: string) {
    await this.prisma.learningPathEnrollment.deleteMany({
      where: { userId, learningPathId },
    });
    return this.getOverview(userId);
  }

  /**
   * Nội dung bài để đọc. Bài nằm trong lộ trình đã xuất bản thì phải đăng ký một trong các
   * lộ trình đó; bài chỉ có trong thư viện (không thuộc lộ trình nào) thì đăng nhập là đủ.
   * Nếu bài học nằm trong lộ trình học tuần tự (isSequential = true), kiểm tra cả bài học
   * lẫn đề kiểm tra bắt buộc của chương trước.
   */
  async getLessonForReading(userId: string, slug: string, pathId?: string) {
    const lesson = await this.lessonService.findBySlug(slug);
    if (lesson.status !== ContentStatus.PUBLISHED) {
      throw new NotFoundException(LEARNER_MESSAGES.LESSON_NOT_FOUND(slug));
    }

    const containingPaths = await this.prisma.learningPath.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        chapters: {
          some: { chapterLessons: { some: { lessonId: lesson.id } } },
        },
      },
      select: {
        id: true,
        title: true,
        isSequential: true,
        enrollments: { where: { userId }, select: { id: true } },
        chapters: {
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            title: true,
            chapterLessons: {
              orderBy: { displayOrder: 'asc' },
              select: {
                lessonId: true,
                lesson: { select: { id: true, title: true, status: true } },
              },
            },
            chapterQuizzes: {
              orderBy: { displayOrder: 'asc' },
              select: {
                id: true,
                quizId: true,
                displayOrder: true,
                passScore: true,
                isRequired: true,
                quiz: {
                  select: {
                    id: true,
                    title: true,
                    passingScorePercent: true,
                    timeLimitMinutes: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const enrolled = containingPaths.some((p) => p.enrollments.length > 0);
    if (containingPaths.length > 0 && !enrolled) {
      throw new ForbiddenException({
        code: LEARNER_ERROR_CODES.NOT_ENROLLED,
        message: LEARNER_MESSAGES.NOT_ENROLLED,
        learningPathIds: containingPaths.map((p) => p.id),
      });
    }

    const targetPath = pathId
      ? containingPaths.find((p) => p.id === pathId)
      : containingPaths.find((p) => p.isSequential && p.enrollments.length > 0);

    if (targetPath && targetPath.isSequential) {
      const { completedSet, passedQuizSet, bestScoreMap } =
        await this.loadUserProgressState(userId);

      const evaluableChapters: EvaluableChapter[] = targetPath.chapters.map(
        (ch, idx) => ({
          id: ch.id || `ch-${idx}`,
          title: ch.title || `Chương ${idx + 1}`,
          lessons: (ch.chapterLessons ?? [])
            .filter((cl) => cl.lesson.status === ContentStatus.PUBLISHED)
            .map((cl) => ({ id: cl.lesson.id, title: cl.lesson.title })),
          quizzes: ch.chapterQuizzes ?? [],
        }),
      );

      const access = this.chapterEvaluator.checkLessonAccess({
        targetLessonId: lesson.id,
        chapters: evaluableChapters,
        isSequential: true,
        completedLessonIds: completedSet,
        passedQuizIds: passedQuizSet,
        bestQuizScores: bestScoreMap,
      });

      if (!access.allowed) {
        if (
          access.gateKind === ProgressionGateKind.CHAPTER_QUIZ &&
          access.prerequisiteQuiz
        ) {
          throw new ForbiddenException({
            code: LEARNER_ERROR_CODES.CHAPTER_QUIZ_LOCKED,
            message: LEARNER_MESSAGES.CHAPTER_QUIZ_LOCKED(
              access.prerequisiteQuiz.title,
              access.prerequisiteQuiz.chapterTitle,
              access.prerequisiteQuiz.passScore,
            ),
            prerequisiteQuiz: access.prerequisiteQuiz,
          });
        }

        throw new ForbiddenException({
          code: LEARNER_ERROR_CODES.LESSON_LOCKED_SEQUENTIAL,
          message: LEARNER_MESSAGES.LESSON_LOCKED_SEQUENTIAL(
            access.prerequisiteLesson?.title,
          ),
          prerequisiteLesson: access.prerequisiteLesson,
        });
      }
    }

    const authorOf = await loadAuthorProfiles(this.prisma, [lesson.createdBy]);
    return {
      lesson: {
        ...lesson,
        author: authorOf(lesson.createdBy),
      },
    };
  }

  /**
   * Lấy sơ đồ tiến trình học tập (Roadmap nodes) của một lộ trình kèm trạng thái
   * khóa/mở/hoàn thành của từng bài học và đề kiểm tra chương cho học viên.
   */
  async getPathProgression(userId: string, learningPathId: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { id: learningPathId },
      include: {
        prerequisitePath: {
          select: { id: true, title: true, slug: true },
        },
        successorPaths: {
          select: { id: true, title: true, slug: true },
        },
        chapters: {
          orderBy: { displayOrder: 'asc' },
          include: {
            chapterLessons: {
              orderBy: { displayOrder: 'asc' },
              include: {
                lesson: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    status: true,
                    difficulty: true,
                  },
                },
              },
            },
            chapterQuizzes: {
              orderBy: { displayOrder: 'asc' },
              include: {
                quiz: {
                  select: {
                    id: true,
                    title: true,
                    passingScorePercent: true,
                    timeLimitMinutes: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!path) {
      throw new NotFoundException(
        LEARNER_MESSAGES.PATH_NOT_FOUND(learningPathId),
      );
    }

    const { completedSet, passedQuizSet, bestScoreMap } =
      await this.loadUserProgressState(userId);

    const evaluableChapters: EvaluableChapter[] = path.chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      lessons: ch.chapterLessons
        .filter((cl) => cl.lesson.status === ContentStatus.PUBLISHED)
        .map((cl) => ({ id: cl.lesson.id, title: cl.lesson.title })),
      quizzes: ch.chapterQuizzes ?? [],
    }));

    const evaluated = this.chapterEvaluator.evaluateChapters({
      chapters: evaluableChapters,
      isSequential: path.isSequential,
      completedLessonIds: completedSet,
      passedQuizIds: passedQuizSet,
      bestQuizScores: bestScoreMap,
    });
    const evalByChapterId = new Map(evaluated.map((e) => [e.chapterId, e]));

    let totalLessons = 0;
    let completedLessons = 0;

    const chapters = path.chapters.map((chapter) => {
      const chEval = evalByChapterId.get(chapter.id);
      const lessonEvalMap = new Map(
        (chEval?.lessons ?? []).map((le) => [le.lessonId, le]),
      );

      const publishedLessons = chapter.chapterLessons
        .filter((cl) => cl.lesson.status === ContentStatus.PUBLISHED)
        .map((cl) => {
          totalLessons++;
          if (completedSet.has(cl.lesson.id)) completedLessons++;
          const evalResult = lessonEvalMap.get(cl.lesson.id);
          return {
            id: cl.lesson.id,
            title: cl.lesson.title,
            slug: cl.lesson.slug,
            difficulty: cl.lesson.difficulty,
            state: evalResult?.state ?? LessonProgressionState.CURRENT_UNLOCKED,
            prerequisiteLessonId: evalResult?.prerequisiteLessonId,
            lockedReason: evalResult?.lockedReason,
          };
        });

      return {
        id: chapter.id,
        title: chapter.title,
        slug: chapter.slug,
        displayOrder: chapter.displayOrder,
        lessons: publishedLessons,
        quizzes: chEval?.quizzes ?? [],
      };
    });

    return {
      pathId: path.id,
      title: path.title,
      slug: path.slug,
      isSequential: path.isSequential,
      prerequisitePath: path.prerequisitePath,
      successorPaths: path.successorPaths,
      totalLessons,
      completedLessons,
      chapters,
    };
  }

  async completeLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, status: ContentStatus.PUBLISHED },
      select: { id: true },
    });
    if (!lesson) {
      throw new NotFoundException(LEARNER_MESSAGES.LESSON_NOT_FOUND(lessonId));
    }
    const alreadyCompleted = await this.prisma.lessonProgress.findUnique?.({
      where: { userId_lessonId: { userId, lessonId } },
      select: { id: true },
    });
    await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {},
      create: { userId, lessonId },
    });
    if (!alreadyCompleted) {
      this.eventEmitter?.emit(GamificationEventName.LESSON_COMPLETED, {
        userId,
        lessonId,
      });
    }
    return this.getOverview(userId);
  }

  /**
   * Nhật ký học tập cá nhân có phân trang theo loại (Strategy Pattern: Đề đã làm / Bài học / Bài viết).
   */
  async getHistory(userId: string, query: LearnerHistoryQueryDto) {
    const kind = query.kind ?? LearnerHistoryKind.QUIZ_ATTEMPTS;
    const page = Math.max(1, query.page ?? LEARNER_HISTORY_LIMITS.DEFAULT_PAGE);
    const limit = Math.min(
      LEARNER_HISTORY_LIMITS.MAX_LIMIT,
      Math.max(1, query.limit ?? LEARNER_HISTORY_LIMITS.DEFAULT_LIMIT),
    );
    return this.historyRegistry
      .resolve(kind)
      .fetchPaginated(userId, page, limit);
  }

  /**
   * Xem lại chi tiết 1 lần nộp bài cũ của chính người học (gồm đáp án đã chọn, kết quả đúng/sai & lời giải).
   */
  async getQuizAttemptDetail(userId: string, attemptId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        quizId: true,
        userId: true,
        scorePercent: true,
        correctCount: true,
        totalQuestions: true,
        timeSpentSeconds: true,
        isPassed: true,
        answers: true,
        createdAt: true,
        questionResults: {
          select: {
            questionId: true,
            isCorrect: true,
            answer: true,
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
            passingScorePercent: true,
            timeLimitMinutes: true,
            topics: { select: { id: true, name: true, slug: true } },
            ...QUIZ_QUESTIONS_INCLUDE,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(LEARNER_MESSAGES.QUIZ_ATTEMPT_NOT_FOUND);
    }
    if (attempt.userId !== userId) {
      throw new ForbiddenException(LEARNER_MESSAGES.QUIZ_ATTEMPT_FORBIDDEN);
    }

    const questions = toQuizQuestions(attempt.quiz.quizQuestions);
    const fallbackAnswers =
      typeof attempt.answers === 'object' &&
      attempt.answers !== null &&
      !Array.isArray(attempt.answers)
        ? (attempt.answers as Record<string, unknown>)
        : {};

    const answers: Record<string, unknown> = { ...fallbackAnswers };
    const results: Record<string, boolean> = {};

    for (const qr of attempt.questionResults) {
      results[qr.questionId] = qr.isCorrect;
      if (qr.answer !== null && qr.answer !== undefined) {
        answers[qr.questionId] = qr.answer;
      }
    }

    if (attempt.questionResults.length === 0) {
      const graded = gradeQuizAttempt(questions, answers);
      Object.assign(results, graded.results);
    }

    return {
      attemptId: attempt.id,
      quizId: attempt.quizId,
      quizTitle: attempt.quiz.title || 'Đề kiểm tra lịch sử',
      passingScorePercent: attempt.quiz.passingScorePercent ?? 70,
      timeLimitMinutes: attempt.quiz.timeLimitMinutes ?? 15,
      topics: attempt.quiz.topics,
      scorePercent: attempt.scorePercent,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalQuestions,
      timeSpentSeconds: attempt.timeSpentSeconds,
      isPassed: attempt.isPassed,
      createdAt: attempt.createdAt,
      answers,
      results,
      questions,
    };
  }

  private async loadUserProgressState(userId: string): Promise<{
    completedSet: Set<string>;
    passedQuizSet: Set<string>;
    bestScoreMap: Map<string, number>;
  }> {
    const [progress, attempts] = await Promise.all([
      this.prisma.lessonProgress.findMany({
        where: { userId },
        select: { lessonId: true },
      }),
      this.prisma.quizAttempt
        ? this.prisma.quizAttempt.findMany({
            where: { userId },
            select: { quizId: true, scorePercent: true, isPassed: true },
          })
        : Promise.resolve(
            [] as Array<{
              quizId: string;
              scorePercent?: number;
              isPassed?: boolean;
            }>,
          ),
    ]);

    const completedSet = new Set(progress.map((p) => p.lessonId));
    const passedQuizSet = new Set<string>();
    const bestScoreMap = new Map<string, number>();

    for (const att of attempts) {
      if (att.isPassed !== false) {
        passedQuizSet.add(att.quizId);
      }
      if (typeof att.scorePercent === 'number') {
        const cur = bestScoreMap.get(att.quizId) ?? -1;
        if (att.scorePercent > cur) {
          bestScoreMap.set(att.quizId, att.scorePercent);
        }
      }
    }

    return { completedSet, passedQuizSet, bestScoreMap };
  }
}
