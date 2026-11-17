import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { LessonContentStrategyContext } from '../lesson/strategies/content-normalizer.strategy';
import {
  DEFAULT_QUIZ_PASSING_SCORE_PERCENT,
  DEFAULT_QUIZ_TIME_LIMIT_MINUTES,
  PUBLIC_QUIZ_LIST_MAX_LIMIT,
} from '../quiz/quiz.constant';
import { gradeQuizAttempt, QuizGradingResult } from '../quiz/quiz-grading';
import { toPublicQuestion } from '../quiz/quiz-question.public';
import {
  QUIZ_QUESTIONS_INCLUDE,
  QuizQuestionWithPoints,
  toQuizQuestions,
} from '../quiz/quiz-question.mapper';
import { PublicQuizQueryDto } from './dto/public-quiz-query.dto';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';
import {
  buildDateLabel,
  buildNodeDateLabel,
  PUBLIC_ARTICLE_SUMMARY_SELECT,
  toArticleSummary,
} from './public-content.mapper';

const PUBLISHED = ContentStatus.PUBLISHED;
const RELATED_LIMIT = 6;

export const PUBLIC_MESSAGES = {
  CATEGORY_NOT_FOUND: (slug: string) => `Không tìm thấy chuyên mục "${slug}"`,
  ARTICLE_NOT_FOUND: (slug: string) => `Không tìm thấy bài viết "${slug}"`,
  TIMELINE_NOT_FOUND: (slug: string) =>
    `Không tìm thấy dòng thời gian "${slug}"`,
  TOPIC_NOT_FOUND: (slug: string) => `Không tìm thấy chủ đề "${slug}"`,
} as const;

/** Sắp bài viết theo niên đại (bài chưa có năm xuống cuối), rồi theo tiêu đề. */
const BY_YEAR: Prisma.ArticleOrderByWithRelationInput[] = [
  { startYear: { sort: 'asc', nulls: 'last' } },
  { title: 'asc' },
];

export interface PublicArticleQuery {
  category?: string;
  tag?: string;
  q?: string;
  featured?: boolean;
  limit?: number;
}

/**
 * Toàn bộ dữ liệu cho trang công khai. Mọi truy vấn chỉ lấy nội dung PUBLISHED — kể cả bài viết
 * được trỏ tới từ mốc timeline (mốc trỏ bài chưa xuất bản vẫn hiện nhưng không có link).
 */
export interface QuizAttemptResult extends QuizGradingResult {
  attemptId: string;
  isPassed: boolean;
  /** Bản đầy đủ (đáp án + lời giải) chỉ trả sau khi nộp — danh sách đề công khai không có. */
  questions: QuizQuestionWithPoints[];
}

@Injectable()
export class PublicContentService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Chuyên mục ----------
  async getCategories() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { articles: { where: { status: PUBLISHED } } } },
      },
    });
    return categories.map(({ _count, ...c }) => ({
      ...c,
      articleCount: _count.articles,
    }));
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          orderBy: { displayOrder: 'asc' },
          select: { id: true, name: true, slug: true, icon: true },
        },
      },
    });
    if (!category)
      throw new NotFoundException(PUBLIC_MESSAGES.CATEGORY_NOT_FOUND(slug));
    // Bài của chuyên mục này VÀ các chuyên mục con trực tiếp.
    const categoryIds = [category.id, ...category.children.map((c) => c.id)];
    const articles = await this.prisma.article.findMany({
      where: { status: PUBLISHED, categoryId: { in: categoryIds } },
      orderBy: BY_YEAR,
      select: PUBLIC_ARTICLE_SUMMARY_SELECT,
    });
    return { ...category, articles: articles.map(toArticleSummary) };
  }

  // ---------- Bài viết ----------
  async getArticles(query: PublicArticleQuery) {
    const rows = await this.prisma.article.findMany({
      where: {
        status: PUBLISHED,
        ...(query.category ? { category: { slug: query.category } } : {}),
        ...(query.tag ? { articleTags: { some: { tagId: query.tag } } } : {}),
        ...(query.featured ? { isFeatured: true } : {}),
        ...(query.q
          ? {
              OR: [
                { title: { contains: query.q, mode: 'insensitive' } },
                { summary: { contains: query.q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: query.featured ? [{ displayOrder: 'asc' }, ...BY_YEAR] : BY_YEAR,
      take: query.limit,
      select: PUBLIC_ARTICLE_SUMMARY_SELECT,
    });
    return rows.map(toArticleSummary);
  }

  async getArticleBySlug(slug: string) {
    const article = await this.prisma.article.findFirst({
      where: { slug, status: PUBLISHED },
      select: {
        ...PUBLIC_ARTICLE_SUMMARY_SELECT,
        coverCaption: true,
        contentBlocks: true,
        datePrecision: true,
        categoryId: true,
        publishedAt: true,
        updatedAt: true,
        timelineNodes: {
          where: { timeline: { status: PUBLISHED } },
          select: {
            id: true,
            title: true,
            timeline: { select: { slug: true, title: true } },
          },
        },
        timelineNodeLinks: {
          where: { node: { timeline: { status: PUBLISHED } } },
          select: {
            node: {
              select: {
                id: true,
                title: true,
                timeline: { select: { slug: true, title: true } },
              },
            },
          },
        },
      },
    });
    if (!article)
      throw new NotFoundException(PUBLIC_MESSAGES.ARTICLE_NOT_FOUND(slug));

    const tagIds = article.articleTags.map((at) => at.tag.id);
    type Sibling = {
      id: string;
      slug: string;
      title: string;
      dateText: string | null;
      startYear: number | null;
      endYear: number | null;
    };
    const [related, siblings] = await Promise.all([
      // Bài liên quan: chung ít nhất 1 tag, ưu tiên nổi bật.
      tagIds.length
        ? this.prisma.article.findMany({
            where: {
              status: PUBLISHED,
              id: { not: article.id },
              articleTags: { some: { tagId: { in: tagIds } } },
            },
            orderBy: [{ isFeatured: 'desc' }, ...BY_YEAR],
            take: RELATED_LIMIT,
            select: PUBLIC_ARTICLE_SUMMARY_SELECT,
          })
        : [],
      // Bài trước / sau: cùng chuyên mục, theo niên đại.
      article.categoryId
        ? this.prisma.article.findMany({
            where: { status: PUBLISHED, categoryId: article.categoryId },
            orderBy: BY_YEAR,
            select: {
              id: true,
              slug: true,
              title: true,
              dateText: true,
              startYear: true,
              endYear: true,
            },
          })
        : Promise.resolve([] as Sibling[]),
    ]);
    const index = siblings.findIndex((s) => s.id === article.id);
    const neighbour = (i: number) => {
      const s = siblings[i];
      return s
        ? { slug: s.slug, title: s.title, dateLabel: buildDateLabel(s) }
        : null;
    };

    const { timelineNodes = [], timelineNodeLinks = [], ...rest } = article;
    const allNodesMap = new Map<
      string,
      { slug: string; title: string; nodeTitle: string }
    >();
    for (const n of timelineNodes) {
      allNodesMap.set(n.id ?? n.timeline.slug, {
        ...n.timeline,
        nodeTitle: n.title,
      });
    }
    for (const link of timelineNodeLinks) {
      const key = link.node.id ?? link.node.timeline.slug;
      if (!allNodesMap.has(key)) {
        allNodesMap.set(key, {
          ...link.node.timeline,
          nodeTitle: link.node.title,
        });
      }
    }
    return {
      ...toArticleSummary(rest),
      coverCaption: article.coverCaption,
      contentBlocks: article.contentBlocks,
      datePrecision: article.datePrecision,
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt,
      timelines: Array.from(allNodesMap.values()),
      related: related.map(toArticleSummary),
      previous: index > 0 ? neighbour(index - 1) : null,
      next: index >= 0 ? neighbour(index + 1) : null,
    };
  }

  async getBlogPosts() {
    const rows = await this.prisma.blogPost.findMany({
      where: { status: PUBLISHED },
      orderBy: [
        { isFeatured: 'desc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      include: { author: { select: { id: true, username: true } } },
    });

    return rows.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImageUrl: post.coverImageUrl,
      contentBlocks: post.contentBlocks ?? [],
      status: post.status,
      isFeatured: post.isFeatured,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      createdAt: post.createdAt,
      author: post.author
        ? { id: post.author.id, username: post.author.username }
        : null,
    }));
  }

  async getBlogPostBySlug(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug, status: PUBLISHED },
      include: { author: { select: { id: true, username: true } } },
    });

    if (!post) {
      throw new NotFoundException(`Không tìm thấy blog "${slug}"`);
    }

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImageUrl: post.coverImageUrl,
      contentBlocks: post.contentBlocks ?? [],
      status: post.status,
      isFeatured: post.isFeatured,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      createdAt: post.createdAt,
      author: post.author
        ? { id: post.author.id, username: post.author.username }
        : null,
    };
  }

  // ---------- Dòng thời gian ----------
  private readonly timelineNodeArticleSelect = {
    id: true,
    slug: true,
    title: true,
    status: true,
    coverImageUrl: true,
    category: { select: { name: true, slug: true, icon: true } },
  } satisfies Prisma.ArticleSelect;

  private readonly timelineInclude = {
    topic: { select: { id: true, name: true, slug: true, parentId: true } },
    nodes: {
      orderBy: { displayOrder: 'asc' },
      include: {
        article: {
          select: this.timelineNodeArticleSelect,
        },
        articles: {
          orderBy: { displayOrder: 'asc' },
          include: {
            article: {
              select: this.timelineNodeArticleSelect,
            },
          },
        },
      },
    },
  } satisfies Prisma.TimelineInclude;

  private toPublicTimeline(
    timeline: Prisma.TimelineGetPayload<{
      include: PublicContentService['timelineInclude'];
    }>,
  ) {
    const { nodes, ...rest } = timeline;
    return {
      ...rest,
      nodes: nodes.map(({ article, articles = [], ...node }) => {
        const publishedArticles = articles
          .map((link) => link.article)
          .filter((a) => a.status === PUBLISHED)
          .map((a) => ({
            id: a.id,
            slug: a.slug,
            title: a.title,
            coverImageUrl: a.coverImageUrl,
            category: a.category,
          }));
        const primaryArticle =
          publishedArticles[0] ??
          (article && article.status === PUBLISHED
            ? {
                id: article.id,
                slug: article.slug,
                title: article.title,
                coverImageUrl: article.coverImageUrl,
                category: article.category,
              }
            : null);
        return {
          ...node,
          dateLabel: buildNodeDateLabel(node),
          // Chỉ lộ bài viết đã xuất bản.
          article: primaryArticle,
          articles: publishedArticles.length
            ? publishedArticles
            : primaryArticle
              ? [primaryArticle]
              : [],
        };
      }),
    };
  }

  async getTimelines() {
    const timelines = await this.prisma.timeline.findMany({
      where: { status: PUBLISHED },
      orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }],
      include: this.timelineInclude,
    });
    return timelines.map((t) => this.toPublicTimeline(t));
  }

  async getTimelineBySlug(slug: string) {
    const timeline = await this.prisma.timeline.findFirst({
      where: { slug, status: PUBLISHED },
      include: this.timelineInclude,
    });
    if (!timeline)
      throw new NotFoundException(PUBLIC_MESSAGES.TIMELINE_NOT_FOUND(slug));
    return this.toPublicTimeline(timeline);
  }

  // ---------- Tag ----------
  /** Tag có ít nhất 1 bài viết đã xuất bản (dùng cho bộ lọc / mây tag). */
  private resolveCategoryKind(
    category: {
      id: string;
      kind?: string | null;
      parentId?: string | null;
      parent?: {
        id: string;
        kind?: string | null;
        parentId?: string | null;
      } | null;
    } | null,
    byId: Map<
      string,
      { id: string; kind?: string | null; parentId?: string | null }
    >,
  ): 'PERSON' | 'EVENT' | 'LOCATION' | 'DYNASTY' | 'OTHER' {
    let current = category;
    const seen = new Set<string>();
    while (current && !seen.has(current.id)) {
      if (current.kind)
        return current.kind as
          'PERSON' | 'EVENT' | 'LOCATION' | 'DYNASTY' | 'OTHER';
      seen.add(current.id);
      current = current.parentId ? (byId.get(current.parentId) ?? null) : null;
    }
    return 'OTHER';
  }

  private async getPublishedArticleListByKind(
    kind: 'PERSON' | 'EVENT' | 'LOCATION' | 'DYNASTY' | 'OTHER',
  ) {
    const [categories, articles] = await Promise.all([
      this.prisma.category.findMany({ include: { parent: true } }),
      this.prisma.article.findMany({
        where: { status: PUBLISHED },
        orderBy: BY_YEAR,
        include: {
          category: { include: { parent: true } },
          timelineNodes: {
            where: { timeline: { status: PUBLISHED } },
            orderBy: { displayOrder: 'asc' },
            include: { timeline: true },
          },
        },
      }),
    ]);

    const byId = new Map(categories.map((category) => [category.id, category]));
    return articles
      .filter(
        (article) => this.resolveCategoryKind(article.category, byId) === kind,
      )
      .map((article) => {
        const timeline = article.timelineNodes[0]?.timeline ?? null;
        const category = article.category ?? null;
        const categoryName = category?.name ?? 'Khác';
        const metadata =
          typeof article.metadata === 'object' && article.metadata
            ? (article.metadata as Record<string, any>)
            : {};
        const person =
          typeof metadata.person === 'object' && metadata.person
            ? (metadata.person as Record<string, any>)
            : {};
        const site =
          typeof metadata.site === 'object' && metadata.site
            ? (metadata.site as Record<string, any>)
            : {};
        return {
          id: article.id,
          slug: article.slug,
          title: article.title,
          name: article.title,
          startYear: article.startYear,
          endYear: article.endYear,
          dateText: article.dateText,
          description: article.summary,
          summary: article.summary,
          imageUrl: article.coverImageUrl,
          coverImageUrl: article.coverImageUrl,
          location: null,
          category: categoryName,
          categoryId: article.categoryId,
          periodSlug: timeline?.slug ?? null,
          eventDateNote: article.dateText,
          figures: [],
          locations: [],
          role: person?.titles?.[0] ?? null,
          siteType: site?.siteType ?? null,
          siteTypeLabel: site?.siteType ?? null,
          address: site?.address ?? null,
          metadata,
        };
      });
  }

  async getPeriods() {
    const timelines = await this.prisma.timeline.findMany({
      where: { status: PUBLISHED },
      orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }],
      include: { nodes: { orderBy: { displayOrder: 'asc' } } },
    });

    return timelines.map((timeline) => {
      const years = timeline.nodes
        .map((node) => node.year)
        .filter((year): year is number => typeof year === 'number');
      const startYear = years.length ? Math.min(...years) : 0;
      const endYear = years.length ? Math.max(...years) : null;
      return {
        id: timeline.id,
        parentId: null,
        slug: timeline.slug,
        name: timeline.title,
        timeLabel: timeline.title,
        startYear,
        endYear,
        description: timeline.description,
        coverImageUrl: timeline.coverImageUrl,
      };
    });
  }

  async getPeriodBySlug(slug: string) {
    const timeline = await this.prisma.timeline.findFirst({
      where: { slug, status: PUBLISHED },
      include: { nodes: { orderBy: { displayOrder: 'asc' } } },
    });
    if (!timeline)
      throw new NotFoundException(PUBLIC_MESSAGES.TIMELINE_NOT_FOUND(slug));

    const years = timeline.nodes
      .map((node) => node.year)
      .filter((year): year is number => typeof year === 'number');
    return {
      id: timeline.id,
      parentId: null,
      slug: timeline.slug,
      name: timeline.title,
      timeLabel: timeline.title,
      startYear: years.length ? Math.min(...years) : 0,
      endYear: years.length ? Math.max(...years) : null,
      description: timeline.description,
      coverImageUrl: timeline.coverImageUrl,
      topics: [],
      figures: [],
      events: [],
      parent: null,
      children: [],
      locations: [],
      concurrentPeriods: [],
      concurrentEvents: [],
    };
  }

  async getEvents() {
    return this.getPublishedArticleListByKind('EVENT');
  }

  async getEventBySlug(slug: string) {
    const article = await this.prisma.article.findFirst({
      where: { slug, status: PUBLISHED },
      include: {
        category: { include: { parent: true } },
        timelineNodes: {
          where: { timeline: { status: PUBLISHED } },
          orderBy: { displayOrder: 'asc' },
          include: { timeline: true },
        },
      },
    });
    if (!article)
      throw new NotFoundException(PUBLIC_MESSAGES.ARTICLE_NOT_FOUND(slug));
    const categories = await this.prisma.category.findMany({
      include: { parent: true },
    });
    const byId = new Map(categories.map((category) => [category.id, category]));
    if (this.resolveCategoryKind(article.category, byId) !== 'EVENT') {
      throw new NotFoundException(PUBLIC_MESSAGES.ARTICLE_NOT_FOUND(slug));
    }
    return this.getPublishedArticleListByKind('EVENT').then(
      (items) => items.find((item) => item.slug === slug) ?? article,
    );
  }

  async getFigureDirectory() {
    return this.getPublishedArticleListByKind('PERSON');
  }

  async getFigureBySlug(slug: string) {
    const article = await this.prisma.article.findFirst({
      where: { slug, status: PUBLISHED },
      include: {
        category: { include: { parent: true } },
        timelineNodes: {
          where: { timeline: { status: PUBLISHED } },
          orderBy: { displayOrder: 'asc' },
          include: { timeline: true },
        },
      },
    });
    if (!article)
      throw new NotFoundException(PUBLIC_MESSAGES.ARTICLE_NOT_FOUND(slug));
    const categories = await this.prisma.category.findMany({
      include: { parent: true },
    });
    const byId = new Map(categories.map((category) => [category.id, category]));
    if (this.resolveCategoryKind(article.category, byId) !== 'PERSON') {
      throw new NotFoundException(PUBLIC_MESSAGES.ARTICLE_NOT_FOUND(slug));
    }
    return this.getPublishedArticleListByKind('PERSON').then(
      (items) => items.find((item) => item.slug === slug) ?? article,
    );
  }

  async getLocations() {
    return this.getPublishedArticleListByKind('LOCATION');
  }

  async getLocationBySlug(slug: string) {
    const article = await this.prisma.article.findFirst({
      where: { slug, status: PUBLISHED },
      include: {
        category: { include: { parent: true } },
        timelineNodes: {
          where: { timeline: { status: PUBLISHED } },
          orderBy: { displayOrder: 'asc' },
          include: { timeline: true },
        },
      },
    });
    if (!article)
      throw new NotFoundException(PUBLIC_MESSAGES.ARTICLE_NOT_FOUND(slug));
    const categories = await this.prisma.category.findMany({
      include: { parent: true },
    });
    const byId = new Map(categories.map((category) => [category.id, category]));
    if (this.resolveCategoryKind(article.category, byId) !== 'LOCATION') {
      throw new NotFoundException(PUBLIC_MESSAGES.ARTICLE_NOT_FOUND(slug));
    }
    return this.getPublishedArticleListByKind('LOCATION').then(
      (items) => items.find((item) => item.slug === slug) ?? article,
    );
  }

  async getTags() {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        colorHex: true,
        description: true,
        _count: {
          select: {
            articleTags: { where: { article: { status: PUBLISHED } } },
          },
        },
      },
    });
    return tags
      .map(({ _count, ...t }) => ({ ...t, articleCount: _count.articleTags }))
      .filter((t) => t.articleCount > 0);
  }

  // ---------- Bài học & chủ đề (giữ từ public-content cũ) ----------
  async getLibraryLessons() {
    const lessons = await this.prisma.lesson.findMany({
      where: { status: ContentStatus.PUBLISHED },
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

  /** Dạng phẳng — FE tự ráp cây qua parentId. */
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
    if (!topic)
      throw new NotFoundException(PUBLIC_MESSAGES.TOPIC_NOT_FOUND(slug));
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

  // ---------- Khảo thí & Nộp bài Luyện tập (Quiz Attempt) ----------
  /** Đề luyện tập công khai: có ít nhất 1 câu và thuộc ít nhất 1 chủ đề đã xuất bản. */
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
        learnerName: dto.learnerName?.trim() || 'Thí sinh tự do',
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

    return { attemptId: attempt.id, ...graded, isPassed, questions };
  }
}
