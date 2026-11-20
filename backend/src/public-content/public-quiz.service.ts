import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { GamificationEventName } from '../gamification/gamification.constant';
import { LessonContentStrategyContext } from '../lesson/strategies/content-normalizer.strategy';
import {
  DEFAULT_QUIZ_PASSING_SCORE_PERCENT,
  DEFAULT_QUIZ_TIME_LIMIT_MINUTES,
  PUBLIC_QUIZ_LIST_MAX_LIMIT,
} from '../quiz/quiz.constant';
import { gradeQuizAttempt, QuizGradingResult } from '../quiz/quiz-grading';
import {
  QUIZ_QUESTIONS_INCLUDE,
  QuizQuestionWithPoints,
  toQuizQuestions,
} from '../quiz/quiz-question.mapper';
import { toPublicQuestion } from '../quiz/quiz-question.public';
import { PublicQuizQueryDto } from './dto/public-quiz-query.dto';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';

const PUBLISHED = ContentStatus.PUBLISHED;

export interface QuizAttemptResult extends QuizGradingResult {
  attemptId: string;
  isPassed: boolean;
  /** Bản đầy đủ (đáp án + lời giải) chỉ trả sau khi nộp — danh sách đề công khai không có. */
  questions: QuizQuestionWithPoints[];
}

@Injectable()
export class PublicQuizService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly eventEmitter?: EventEmitter2,
  ) {}

  async getLibraryLessons() {
    const lessons = await this.prisma.lesson.findMany({
      where: { status: PUBLISHED },
      include: {
        topic: { select: { id: true, name: true, slug: true, parentId: true } },
        lessonTags: { include: { tag: true } },
      },
      orderBy: [{ displayOrder: 'asc' }, { publishedAt: 'desc' }],
    });
    return lessons.map((lesson) => {
      const words = LessonContentStrategyContext.extractPlainText(
        lesson.content,
      )
        .split(/\s+/)
        .filter(Boolean).length;
      return {
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        description: lesson.description,
        thumbnailUrl: lesson.thumbnailUrl,
        difficulty: lesson.difficulty,
        estimatedReadMinutes: Math.max(1, Math.ceil(words / 200)),
        topicId: lesson.topicId,
        topic: lesson.topic
          ? {
              id: lesson.topic.id,
              name: lesson.topic.name,
              slug: lesson.topic.slug,
              parentId: lesson.topic.parentId,
            }
          : null,
        tags: lesson.lessonTags.map((lt) => ({
          id: lt.tag.id,
          name: lt.tag.name,
          colorHex: lt.tag.colorHex,
        })),
      };
    });
  }

  async getTopics() {
    return this.prisma.topic.findMany({
      where: { status: PUBLISHED },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true, parentId: true },
    });
  }

  async getTopicBySlug(slug: string) {
    const topic = await this.prisma.topic.findFirst({
      where: { slug, status: PUBLISHED },
      include: {
        children: {
          where: { status: PUBLISHED },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });
    if (!topic) {
      throw new NotFoundException(`Không tìm thấy chủ đề "${slug}"`);
    }
    const pick = (t: typeof topic | (typeof topic.children)[number]) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      eyebrow: t.eyebrow,
      icon: t.icon,
      description: t.description,
      coverImageUrl: t.coverImageUrl,
    });
    return { ...pick(topic), children: topic.children.map(pick) };
  }

  async listPracticeQuizzes(query: PublicQuizQueryDto) {
    const publishedTopic = query.topicId
      ? { id: query.topicId, status: PUBLISHED }
      : { status: PUBLISHED };
    const quizzes = await this.prisma.quiz.findMany({
      where: {
        topics: { some: publishedTopic },
        quizQuestions: { some: {} },
      },
      orderBy: { updatedAt: 'desc' },
      take: query.limit ?? PUBLIC_QUIZ_LIST_MAX_LIMIT,
      select: {
        id: true,
        title: true,
        description: true,
        timeLimitMinutes: true,
        passingScorePercent: true,
        topics: {
          where: { status: PUBLISHED },
          select: { id: true, name: true, slug: true },
        },
        ...QUIZ_QUESTIONS_INCLUDE,
      },
    });
    return quizzes.map(({ quizQuestions, ...quiz }) => ({
      ...quiz,
      title: quiz.title || `Đề luyện tập: ${quiz.topics[0]?.name ?? ''}`,
      timeLimitMinutes:
        quiz.timeLimitMinutes ?? DEFAULT_QUIZ_TIME_LIMIT_MINUTES,
      passingScorePercent:
        quiz.passingScorePercent ?? DEFAULT_QUIZ_PASSING_SCORE_PERCENT,
      questions: toQuizQuestions(quizQuestions).map(toPublicQuestion),
    }));
  }

  async submitQuizAttempt(
    quizId: string,
    dto: SubmitQuizAttemptDto,
    userId?: string,
  ): Promise<QuizAttemptResult> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: { passingScorePercent: true, ...QUIZ_QUESTIONS_INCLUDE },
    });
    if (!quiz) throw new NotFoundException('Không tìm thấy đề thi này');

    const questions = toQuizQuestions(quiz.quizQuestions);
    const graded = gradeQuizAttempt(questions, dto.answers);
    const isPassed =
      graded.scorePercent >=
      (quiz.passingScorePercent ?? DEFAULT_QUIZ_PASSING_SCORE_PERCENT);

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        userId: userId ?? null,
        learnerName: userId ? null : dto.learnerName?.trim() || null,
        scorePercent: graded.scorePercent,
        correctCount: graded.correctCount,
        totalQuestions: graded.totalQuestions,
        timeSpentSeconds: dto.timeSpentSeconds,
        isPassed,
        answers: dto.answers as Prisma.InputJsonValue,
        questionResults: {
          create: questions.map((q) => ({
            questionId: q.id,
            isCorrect: graded.results[q.id] ?? false,
            answer:
              dto.answers[q.id] === undefined || dto.answers[q.id] === null
                ? Prisma.DbNull
                : (dto.answers[q.id] as Prisma.InputJsonValue),
          })),
        },
      },
      select: { id: true },
    });

    if (userId) {
      this.eventEmitter?.emit(GamificationEventName.QUIZ_SUBMITTED, {
        userId,
        attemptId: attempt.id,
        quizId,
        scorePercent: graded.scorePercent,
        isPassed,
      });
    }

    return { attemptId: attempt.id, ...graded, isPassed, questions };
  }
}
