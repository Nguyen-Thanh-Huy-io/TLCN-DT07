import { Injectable } from '@nestjs/common';
import { ContentStatus, GamificationActivityType } from '@prisma/client';
import {
  PaginatedResponse,
  createPaginatedResponse,
} from '../../common/decorators/api-pagination.decorator';
import { PrismaService } from '../../common/services/prisma.service';
import { LessonContentStrategyContext } from '../../lesson/strategies/content-normalizer.strategy';
import { LearnerHistoryKind } from '../learner.constant';

export interface LearnerQuizAttemptHistoryItem {
  id: string;
  quizId: string;
  quizTitle: string;
  topics: Array<{ id: string; name: string; slug: string }>;
  scorePercent: number;
  passingScorePercent: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  isPassed: boolean;
  createdAt: Date;
}

export interface LearnerCompletedLessonHistoryItem {
  lessonId: string;
  title: string;
  slug: string;
  difficulty: string;
  estimatedReadMinutes: number;
  thumbnailUrl: string | null;
  topic: { id: string; name: string; slug: string } | null;
  completedAt: Date;
}

export interface LearnerReadArticleHistoryItem {
  activityId: string;
  articleId: string;
  title: string;
  slug: string | null;
  summary: string | null;
  thumbnailUrl: string | null;
  categoryName: string | null;
  xpEarned: number;
  readAt: Date;
}

export type LearnerHistoryItemUnion =
  | LearnerQuizAttemptHistoryItem
  | LearnerCompletedLessonHistoryItem
  | LearnerReadArticleHistoryItem;

export interface ILearnerHistoryStrategy<T = LearnerHistoryItemUnion> {
  readonly kind: LearnerHistoryKind;
  fetchPaginated(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<T>>;
}

const DEFAULT_QUIZ_PASS_SCORE = 70;

@Injectable()
export class QuizAttemptHistoryStrategy implements ILearnerHistoryStrategy<LearnerQuizAttemptHistoryItem> {
  readonly kind = LearnerHistoryKind.QUIZ_ATTEMPTS;

  constructor(private readonly prisma: PrismaService) {}

  async fetchPaginated(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<LearnerQuizAttemptHistoryItem>> {
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.quizAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          quizId: true,
          scorePercent: true,
          correctCount: true,
          totalQuestions: true,
          timeSpentSeconds: true,
          isPassed: true,
          createdAt: true,
          quiz: {
            select: {
              title: true,
              passingScorePercent: true,
              topics: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      }),
      this.prisma.quizAttempt.count({ where: { userId } }),
    ]);

    const items: LearnerQuizAttemptHistoryItem[] = rows.map((row) => ({
      id: row.id,
      quizId: row.quizId,
      quizTitle: row.quiz.title || 'Đề kiểm tra lịch sử',
      topics: row.quiz.topics,
      scorePercent: row.scorePercent,
      passingScorePercent:
        row.quiz.passingScorePercent ?? DEFAULT_QUIZ_PASS_SCORE,
      correctCount: row.correctCount,
      totalQuestions: row.totalQuestions,
      timeSpentSeconds: row.timeSpentSeconds,
      isPassed: row.isPassed,
      createdAt: row.createdAt,
    }));

    return createPaginatedResponse(items, total, page, limit);
  }
}

@Injectable()
export class CompletedLessonHistoryStrategy implements ILearnerHistoryStrategy<LearnerCompletedLessonHistoryItem> {
  readonly kind = LearnerHistoryKind.COMPLETED_LESSONS;

  constructor(private readonly prisma: PrismaService) {}

  async fetchPaginated(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<LearnerCompletedLessonHistoryItem>> {
    const skip = (page - 1) * limit;
    const where = {
      userId,
      lesson: { status: ContentStatus.PUBLISHED },
    };

    const [rows, total] = await Promise.all([
      this.prisma.lessonProgress.findMany({
        where,
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit,
        select: {
          lessonId: true,
          completedAt: true,
          lesson: {
            select: {
              title: true,
              slug: true,
              difficulty: true,
              content: true,
              thumbnailUrl: true,
              topic: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      }),
      this.prisma.lessonProgress.count({ where }),
    ]);

    const items: LearnerCompletedLessonHistoryItem[] = rows.map((row) => {
      const words = LessonContentStrategyContext.extractPlainText(
        row.lesson.content,
      )
        .split(/\s+/)
        .filter(Boolean).length;
      return {
        lessonId: row.lessonId,
        title: row.lesson.title,
        slug: row.lesson.slug,
        difficulty: row.lesson.difficulty,
        estimatedReadMinutes: Math.max(1, Math.ceil(words / 200)),
        thumbnailUrl: row.lesson.thumbnailUrl,
        topic: row.lesson.topic,
        completedAt: row.completedAt,
      };
    });

    return createPaginatedResponse(items, total, page, limit);
  }
}

function readMetadataTitle(meta: unknown): string | null {
  if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) {
    return null;
  }
  const maybeTitle = (meta as Record<string, unknown>).title;
  return typeof maybeTitle === 'string' && maybeTitle.trim()
    ? maybeTitle.trim()
    : null;
}

@Injectable()
export class ReadArticleHistoryStrategy implements ILearnerHistoryStrategy<LearnerReadArticleHistoryItem> {
  readonly kind = LearnerHistoryKind.READ_ARTICLES;

  constructor(private readonly prisma: PrismaService) {}

  async fetchPaginated(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<LearnerReadArticleHistoryItem>> {
    const skip = (page - 1) * limit;
    const where = {
      userId,
      activityType: GamificationActivityType.ARTICLE_READ_COMPLETED,
    };

    const [activities, total] = await Promise.all([
      this.prisma.learningActivity.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          entityId: true,
          xpEarned: true,
          metadata: true,
          occurredAt: true,
        },
      }),
      this.prisma.learningActivity.count({ where }),
    ]);

    const articleIds = activities
      .map((a) => a.entityId)
      .filter((id): id is string => Boolean(id));

    const articles =
      articleIds.length > 0
        ? await this.prisma.article.findMany({
            where: {
              id: { in: articleIds },
              status: ContentStatus.PUBLISHED,
            },
            select: {
              id: true,
              title: true,
              slug: true,
              summary: true,
              coverImageUrl: true,
              category: { select: { name: true } },
            },
          })
        : [];

    const articleMap = new Map(articles.map((art) => [art.id, art]));

    const items: LearnerReadArticleHistoryItem[] = activities.map((act) => {
      const matched = act.entityId ? articleMap.get(act.entityId) : undefined;
      return {
        activityId: act.id,
        articleId: act.entityId ?? act.id,
        title:
          matched?.title ??
          readMetadataTitle(act.metadata) ??
          'Bài viết tư liệu lịch sử',
        slug: matched?.slug ?? null,
        summary: matched?.summary ?? null,
        thumbnailUrl: matched?.coverImageUrl ?? null,
        categoryName: matched?.category?.name ?? null,
        xpEarned: act.xpEarned,
        readAt: act.occurredAt,
      };
    });

    return createPaginatedResponse(items, total, page, limit);
  }
}

@Injectable()
export class LearnerHistoryStrategyRegistry {
  private readonly strategies: ReadonlyMap<
    LearnerHistoryKind,
    ILearnerHistoryStrategy
  >;

  constructor(
    quizStrategy: QuizAttemptHistoryStrategy,
    lessonStrategy: CompletedLessonHistoryStrategy,
    articleStrategy: ReadArticleHistoryStrategy,
  ) {
    this.strategies = new Map<LearnerHistoryKind, ILearnerHistoryStrategy>([
      [quizStrategy.kind, quizStrategy],
      [lessonStrategy.kind, lessonStrategy],
      [articleStrategy.kind, articleStrategy],
    ]);
  }

  resolve(kind: LearnerHistoryKind): ILearnerHistoryStrategy {
    return (
      this.strategies.get(kind) ??
      this.strategies.get(LearnerHistoryKind.QUIZ_ATTEMPTS)!
    );
  }
}
