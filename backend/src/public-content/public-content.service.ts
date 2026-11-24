import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import {
  resolveRootCategorySlug,
  SYSTEM_CATEGORY_ROOT_SLUGS,
} from '../category/category.service';
import { PrismaService } from '../common/services/prisma.service';
import { loadAuthorProfiles } from '../common/utils/author-names';
import { ArticleAdjacencyService } from './article-adjacency.service';
import {
  BY_YEAR,
  PUBLIC_ARTICLE_SUMMARY_SELECT,
  toArticleSummary,
} from './public-content.mapper';
import { PublicQuizQueryDto } from './dto/public-quiz-query.dto';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';
import { PublicQuizService, QuizAttemptResult } from './public-quiz.service';
import { PublicTimelineService } from './public-timeline.service';

const PUBLISHED = ContentStatus.PUBLISHED;
const RELATED_LIMIT = 6;

export type { QuizAttemptResult };

export const PUBLIC_MESSAGES = {
  CATEGORY_NOT_FOUND: (slug: string) => `Không tìm thấy chuyên mục "${slug}"`,
  ARTICLE_NOT_FOUND: (slug: string) => `Không tìm thấy bài viết "${slug}"`,
  TIMELINE_NOT_FOUND: (slug: string) =>
    `Không tìm thấy dòng thời gian "${slug}"`,
  TOPIC_NOT_FOUND: (slug: string) => `Không tìm thấy chủ đề "${slug}"`,
} as const;

export interface PublicArticleQuery {
  category?: string;
  tag?: string;
  q?: string;
  featured?: boolean;
  limit?: number;
}

@Injectable()
export class PublicContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adjacency: ArticleAdjacencyService,
    private readonly publicTimeline: PublicTimelineService,
    private readonly publicQuiz: PublicQuizService,
  ) {}

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
    const categoryIds = [category.id, ...category.children.map((c) => c.id)];
    const articles = await this.prisma.article.findMany({
      where: { status: PUBLISHED, categoryId: { in: categoryIds } },
      orderBy: BY_YEAR,
      select: PUBLIC_ARTICLE_SUMMARY_SELECT,
    });
    return { ...category, articles: articles.map(toArticleSummary) };
  }

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
        categoryId: true,
        createdBy: true,
        publishedAt: true,
        updatedAt: true,
        timelineNodes: {
          where: { timeline: { status: PUBLISHED } },
          orderBy: { timeline: { displayOrder: 'asc' } },
          select: {
            id: true,
            title: true,
            timelineId: true,
            timeline: { select: { slug: true, title: true } },
          },
        },
        timelineNodeLinks: {
          where: { node: { timeline: { status: PUBLISHED } } },
          orderBy: { node: { timeline: { displayOrder: 'asc' } } },
          select: {
            node: {
              select: {
                id: true,
                title: true,
                timelineId: true,
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
    const timelineId =
      article.timelineNodes[0]?.timelineId ??
      article.timelineNodeLinks[0]?.node.timelineId ??
      null;
    const [related, adjacency, authorOf] = await Promise.all([
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
      this.adjacency.findAdjacent({
        id: article.id,
        categoryId: article.categoryId,
        topicId: article.topicId,
        timelineId,
      }),
      loadAuthorProfiles(this.prisma, [article.createdBy]),
    ]);

    const {
      timelineNodes = [],
      timelineNodeLinks = [],
      createdBy,
      ...rest
    } = article;
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
      author: authorOf(createdBy),
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt,
      timelines: Array.from(allNodesMap.values()),
      related: related.map(toArticleSummary),
      previous: adjacency.previous,
      next: adjacency.next,
      adjacentSource: adjacency.source,
      adjacentTimeline: adjacency.timeline,
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
    return rows.map((post) => this.mapPublicBlogPost(post));
  }

  async getBlogPostBySlug(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug, status: PUBLISHED },
      include: { author: { select: { id: true, username: true } } },
    });
    if (!post) throw new NotFoundException(`Không tìm thấy blog "${slug}"`);
    return this.mapPublicBlogPost(post);
  }

  private mapPublicBlogPost(post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    contentBlocks: unknown;
    status: ContentStatus;
    isFeatured: boolean;
    viewCount?: number | null;
    publishedAt: Date | null;
    updatedAt: Date;
    createdAt: Date;
    author: { id: string; username: string } | null;
  }) {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImageUrl: post.coverImageUrl,
      contentBlocks: post.contentBlocks ?? [],
      status: post.status,
      isFeatured: post.isFeatured,
      viewCount: post.viewCount ?? 0,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      createdAt: post.createdAt,
      author: post.author
        ? { id: post.author.id, username: post.author.username }
        : null,
    };
  }

  getTimelines() {
    return this.publicTimeline.getTimelines();
  }

  getTimelineBySlug(slug: string) {
    return this.publicTimeline.getTimelineBySlug(slug);
  }

  getPeriods() {
    return this.publicTimeline.getPeriods();
  }

  getPeriodBySlug(slug: string) {
    return this.publicTimeline.getPeriodBySlug(slug);
  }

  async getEvents() {
    return this.getPublishedArticleListByRootSlug(
      SYSTEM_CATEGORY_ROOT_SLUGS.EVENT,
    );
  }

  async getEventBySlug(slug: string) {
    return this.getPublishedArticleByRootSlugAndSlug(
      SYSTEM_CATEGORY_ROOT_SLUGS.EVENT,
      slug,
    );
  }

  async getFigureDirectory() {
    return this.getPublishedArticleListByRootSlug(
      SYSTEM_CATEGORY_ROOT_SLUGS.PERSON,
    );
  }

  async getFigureBySlug(slug: string) {
    return this.getPublishedArticleByRootSlugAndSlug(
      SYSTEM_CATEGORY_ROOT_SLUGS.PERSON,
      slug,
    );
  }

  async getLocations() {
    return this.getPublishedArticleListByRootSlug(
      SYSTEM_CATEGORY_ROOT_SLUGS.LOCATION,
    );
  }

  async getLocationBySlug(slug: string) {
    return this.getPublishedArticleByRootSlugAndSlug(
      SYSTEM_CATEGORY_ROOT_SLUGS.LOCATION,
      slug,
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

  getLibraryLessons() {
    return this.publicQuiz.getLibraryLessons();
  }

  getTopics() {
    return this.publicQuiz.getTopics();
  }

  getTopicBySlug(slug: string) {
    return this.publicQuiz.getTopicBySlug(slug);
  }

  listPracticeQuizzes(query: PublicQuizQueryDto) {
    return this.publicQuiz.listPracticeQuizzes(query);
  }

  submitQuizAttempt(
    quizId: string,
    dto: SubmitQuizAttemptDto,
    userId?: string,
  ): Promise<QuizAttemptResult> {
    return this.publicQuiz.submitQuizAttempt(quizId, dto, userId);
  }

  private async getPublishedArticleByRootSlugAndSlug(
    rootSlug: string,
    slug: string,
  ) {
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
    if (!article) {
      throw new NotFoundException(PUBLIC_MESSAGES.ARTICLE_NOT_FOUND(slug));
    }
    const categories = await this.prisma.category.findMany({
      include: { parent: true },
    });
    const byId = new Map(categories.map((category) => [category.id, category]));
    if (resolveRootCategorySlug(article.category, byId) !== rootSlug) {
      throw new NotFoundException(PUBLIC_MESSAGES.ARTICLE_NOT_FOUND(slug));
    }
    const items = await this.getPublishedArticleListByRootSlug(rootSlug);
    return items.find((item) => item.slug === slug) ?? article;
  }

  private async getPublishedArticleListByRootSlug(rootSlug: string) {
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
        (article) =>
          resolveRootCategorySlug(article.category, byId) === rootSlug,
      )
      .map((article) => {
        const timeline = article.timelineNodes[0]?.timeline ?? null;
        const categoryName = article.category?.name ?? 'Khác';
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
          role: (person?.titles as unknown[] | undefined)?.[0] ?? null,
          siteType: site?.siteType ?? null,
          siteTypeLabel: site?.siteType ?? null,
          address: site?.address ?? null,
          metadata,
        };
      });
  }
}
