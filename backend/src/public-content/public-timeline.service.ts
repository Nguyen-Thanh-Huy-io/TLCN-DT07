import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { buildNodeDateLabel } from './public-content.mapper';

const PUBLISHED = ContentStatus.PUBLISHED;

const TIMELINE_NODE_ARTICLE_SELECT = {
  id: true,
  slug: true,
  title: true,
  status: true,
  coverImageUrl: true,
  category: { select: { name: true, slug: true, icon: true } },
} satisfies Prisma.ArticleSelect;

const TIMELINE_INCLUDE = {
  topic: { select: { id: true, name: true, slug: true, parentId: true } },
  nodes: {
    orderBy: { displayOrder: 'asc' },
    include: {
      article: { select: TIMELINE_NODE_ARTICLE_SELECT },
      articles: {
        orderBy: { displayOrder: 'asc' },
        include: { article: { select: TIMELINE_NODE_ARTICLE_SELECT } },
      },
    },
  },
} satisfies Prisma.TimelineInclude;

type PublicTimelinePayload = Prisma.TimelineGetPayload<{
  include: typeof TIMELINE_INCLUDE;
}>;

@Injectable()
export class PublicTimelineService {
  constructor(private readonly prisma: PrismaService) {}

  async getTimelines() {
    const timelines = await this.prisma.timeline.findMany({
      where: { status: PUBLISHED },
      orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }],
      include: TIMELINE_INCLUDE,
    });
    return timelines.map((t) => this.toPublicTimeline(t));
  }

  async getTimelineBySlug(slug: string) {
    const timeline = await this.prisma.timeline.findFirst({
      where: { slug, status: PUBLISHED },
      include: TIMELINE_INCLUDE,
    });
    if (!timeline) {
      throw new NotFoundException(`Không tìm thấy dòng thời gian "${slug}"`);
    }
    return this.toPublicTimeline(timeline);
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
    if (!timeline) {
      throw new NotFoundException(`Không tìm thấy dòng thời gian "${slug}"`);
    }

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

  private toPublicTimeline(timeline: PublicTimelinePayload) {
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
}
