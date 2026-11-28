import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
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
  topicIds?: string[];
  ids?: string[];
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
    const allCategories = await this.prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, parentId: true },
    });
    const expandedIds = new Set<string>([
      category.id,
      ...category.children.map((c) => c.id),
    ]);
    if (Array.isArray(allCategories) && allCategories.length > 0) {
      let added = true;
      while (added) {
        added = false;
        for (const c of allCategories) {
          if (
            c.parentId &&
            expandedIds.has(c.parentId) &&
            !expandedIds.has(c.id)
          ) {
            expandedIds.add(c.id);
            added = true;
          }
        }
      }
    }
    const articles = await this.prisma.article.findMany({
      where: { status: PUBLISHED, categoryId: { in: [...expandedIds] } },
      orderBy: BY_YEAR,
      select: PUBLIC_ARTICLE_SUMMARY_SELECT,
    });
    return { ...category, articles: articles.map(toArticleSummary) };
  }

  async getArticles(query: PublicArticleQuery) {
    const tagQuery = query.tag?.trim();
    const q = query.q?.trim();
    const parsedYear =
      q && /^-?\d{1,4}$/.test(q) ? Number.parseInt(q, 10) : null;
    const rows = await this.prisma.article.findMany({
      where: {
        status: PUBLISHED,
        ...(query.ids && query.ids.length > 0 ? { id: { in: query.ids } } : {}),
        ...(query.category ? { category: { slug: query.category } } : {}),
        ...(query.topicIds && query.topicIds.length > 0
          ? { topicId: { in: query.topicIds } }
          : {}),
        ...(tagQuery
          ? {
              articleTags: {
                some: {
                  OR: [
                    { tagId: tagQuery },
                    {
                      tag: { name: { equals: tagQuery, mode: 'insensitive' } },
                    },
                  ],
                },
              },
            }
          : {}),
        ...(query.featured ? { isFeatured: true } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { summary: { contains: q, mode: 'insensitive' } },
                { dateText: { contains: q, mode: 'insensitive' } },
                ...(parsedYear !== null && !Number.isNaN(parsedYear)
                  ? [
                      { startYear: parsedYear },
                      { endYear: parsedYear },
                      {
                        AND: [
                          { startYear: { lte: parsedYear } },
                          { endYear: { gte: parsedYear } },
                        ],
                      },
                    ]
                  : []),
                {
                  articleTags: {
                    some: {
                      tag: { name: { contains: q, mode: 'insensitive' } },
                    },
                  },
                },
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

  async getTags(query?: { q?: string; limit?: number }) {
    const q = query?.q?.trim();
    const tags = await this.prisma.tag.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: [{ articleTags: { _count: 'desc' } }, { name: 'asc' }],
      take: query?.limit,
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
}
