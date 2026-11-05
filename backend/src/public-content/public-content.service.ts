import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, LessonStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { LessonContentStrategyContext } from '../lesson/strategies/content-normalizer.strategy';
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
  TIMELINE_NOT_FOUND: (slug: string) => `Không tìm thấy dòng thời gian "${slug}"`,
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
@Injectable()
export class PublicContentService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Chuyên mục ----------
  async getCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { articles: { where: { status: PUBLISHED } } } } },
    });
    return categories.map(({ _count, ...c }) => ({ ...c, articleCount: _count.articles }));
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { orderBy: { displayOrder: 'asc' }, select: { id: true, name: true, slug: true, icon: true } },
      },
    });
    if (!category) throw new NotFoundException(PUBLIC_MESSAGES.CATEGORY_NOT_FOUND(slug));
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
          select: { title: true, timeline: { select: { slug: true, title: true } } },
        },
      },
    });
    if (!article) throw new NotFoundException(PUBLIC_MESSAGES.ARTICLE_NOT_FOUND(slug));

    const tagIds = article.articleTags.map((at) => at.tag.id);
    type Sibling = { id: string; slug: string; title: string; dateText: string | null; startYear: number | null; endYear: number | null };
    const [related, siblings] = await Promise.all([
      // Bài liên quan: chung ít nhất 1 tag, ưu tiên nổi bật.
      tagIds.length
        ? this.prisma.article.findMany({
            where: { status: PUBLISHED, id: { not: article.id }, articleTags: { some: { tagId: { in: tagIds } } } },
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
            select: { id: true, slug: true, title: true, dateText: true, startYear: true, endYear: true },
          })
        : Promise.resolve([] as Sibling[]),
    ]);
    const index = siblings.findIndex((s) => s.id === article.id);
    const neighbour = (i: number) => {
      const s = siblings[i];
      return s ? { slug: s.slug, title: s.title, dateLabel: buildDateLabel(s) } : null;
    };

    const { timelineNodes, categoryId: _categoryId, ...rest } = article;
    return {
      ...toArticleSummary(rest),
      coverCaption: article.coverCaption,
      contentBlocks: article.contentBlocks,
      datePrecision: article.datePrecision,
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt,
      timelines: timelineNodes.map((n) => ({ ...n.timeline, nodeTitle: n.title })),
      related: related.map(toArticleSummary),
      previous: index > 0 ? neighbour(index - 1) : null,
      next: index >= 0 ? neighbour(index + 1) : null,
    };
  }

  // ---------- Dòng thời gian ----------
  private readonly timelineInclude = {
    nodes: {
      orderBy: { displayOrder: 'asc' },
      include: {
        article: {
          select: {
            slug: true,
            title: true,
            status: true,
            coverImageUrl: true,
            category: { select: { name: true, slug: true, icon: true } },
          },
        },
      },
    },
  } satisfies Prisma.TimelineInclude;

  private toPublicTimeline(timeline: Prisma.TimelineGetPayload<{ include: PublicContentService['timelineInclude'] }>) {
    const { nodes, status: _status, ...rest } = timeline;
    return {
      ...rest,
      nodes: nodes.map(({ article, timelineId: _t, articleId: _a, ...node }) => ({
        ...node,
        dateLabel: buildNodeDateLabel(node),
        // Chỉ lộ bài viết đã xuất bản.
        article:
          article && article.status === PUBLISHED
            ? { slug: article.slug, title: article.title, coverImageUrl: article.coverImageUrl, category: article.category }
            : null,
      })),
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
    if (!timeline) throw new NotFoundException(PUBLIC_MESSAGES.TIMELINE_NOT_FOUND(slug));
    return this.toPublicTimeline(timeline);
  }

  // ---------- Tag ----------
  /** Tag có ít nhất 1 bài viết đã xuất bản (dùng cho bộ lọc / mây tag). */
  async getTags() {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        colorHex: true,
        description: true,
        _count: { select: { articleTags: { where: { article: { status: PUBLISHED } } } } },
      },
    });
    return tags
      .map(({ _count, ...t }) => ({ ...t, articleCount: _count.articleTags }))
      .filter((t) => t.articleCount > 0);
  }

  // ---------- Bài học & chủ đề (giữ từ public-content cũ) ----------
  async getLibraryLessons() {
    const lessons = await this.prisma.lesson.findMany({
      where: { status: LessonStatus.PUBLISHED },
      include: { lessonTags: { include: { tag: true } } },
      orderBy: [{ displayOrder: 'asc' }, { publishedAt: 'desc' }],
    });
    return lessons.map((lesson) => {
      const words = LessonContentStrategyContext.extractPlainText(lesson.content)
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
        tags: lesson.lessonTags.map((lt) => ({ id: lt.tag.id, name: lt.tag.name, colorHex: lt.tag.colorHex })),
      };
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
    if (!topic) throw new NotFoundException(PUBLIC_MESSAGES.TOPIC_NOT_FOUND(slug));
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
}
