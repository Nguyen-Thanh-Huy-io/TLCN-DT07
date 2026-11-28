import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { buildDateLabel, buildNodeDateLabel } from './public-content.mapper';

const PUBLISHED = ContentStatus.PUBLISHED;
export const MAX_PREVIEW_NODES_PER_TIMELINE = 15;
const MAX_PREVIEW_QUERY_BATCH = 900;

const TIMELINE_NODE_ARTICLE_SELECT = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  status: true,
  coverImageUrl: true,
  dateText: true,
  startYear: true,
  endYear: true,
  metadata: true,
  topicId: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      parentId: true,
    },
  },
  articleTags: {
    select: {
      tag: { select: { id: true, name: true, colorHex: true } },
    },
  },
} satisfies Prisma.ArticleSelect;

const TIMELINE_TOPIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  eyebrow: true,
  displayOrder: true,
  parentId: true,
} satisfies Prisma.TopicSelect;

const TIMELINE_INCLUDE = {
  topic: { select: TIMELINE_TOPIC_SELECT },
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

type TimelineArticleRow = Prisma.ArticleGetPayload<{
  select: typeof TIMELINE_NODE_ARTICLE_SELECT;
}>;

function toPublicNodeArticle(a: TimelineArticleRow) {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    summary: a.summary ?? null,
    coverImageUrl: a.coverImageUrl,
    dateText: a.dateText ?? null,
    startYear: a.startYear ?? null,
    endYear: a.endYear ?? null,
    dateLabel: buildDateLabel(a),
    metadata: a.metadata ?? null,
    category: a.category,
    tags: Array.isArray(a.articleTags) ? a.articleTags.map((at) => at.tag) : [],
  };
}

function collectDescendantTopicIds(
  rootId: string,
  childrenByParent: ReadonlyMap<string, string[]>,
): string[] {
  const visited = new Set<string>([rootId]);
  const queue = [rootId];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const childId of childrenByParent.get(cur) ?? []) {
      if (!visited.has(childId)) {
        visited.add(childId);
        queue.push(childId);
      }
    }
  }
  return [...visited];
}

function aggregateTopicEnrichment(
  timelineTopicIds: string[],
  topicGroups: Array<{ topicId: string | null; _count: { id: number } }>,
  allTopics: Array<{ id: string; parentId: string | null }>,
  previewRows: TimelineArticleRow[],
): {
  branchCountByTopicId: Map<string, number>;
  previewByTopicId: Map<string, TimelineArticleRow[]>;
} {
  const branchCountByTopicId = new Map<string, number>();
  const previewByTopicId = new Map<string, TimelineArticleRow[]>();
  const directCounts = new Map<string, number>();

  for (const g of topicGroups) {
    if (g.topicId) directCounts.set(g.topicId, g._count.id);
  }

  const childrenByParent = new Map<string, string[]>();
  for (const t of allTopics) {
    if (!t.parentId) continue;
    const list = childrenByParent.get(t.parentId) ?? [];
    list.push(t.id);
    childrenByParent.set(t.parentId, list);
  }

  for (const tid of timelineTopicIds) {
    const branch = collectDescendantTopicIds(tid, childrenByParent);
    let sum = 0;
    for (const bid of branch) sum += directCounts.get(bid) ?? 0;
    branchCountByTopicId.set(tid, sum);
  }

  for (const row of previewRows) {
    if (!row.topicId) continue;
    const list = previewByTopicId.get(row.topicId) ?? [];
    if (list.length < MAX_PREVIEW_NODES_PER_TIMELINE) {
      list.push(row);
      previewByTopicId.set(row.topicId, list);
    }
  }

  return { branchCountByTopicId, previewByTopicId };
}

@Injectable()
export class PublicTimelineService {
  constructor(private readonly prisma: PrismaService) {}

  async getTimelines() {
    const timelines = await this.prisma.timeline.findMany({
      where: { status: PUBLISHED },
      orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }],
      include: TIMELINE_INCLUDE,
    });

    const enrichment = await this.loadTimelineTopicEnrichment(timelines);

    return timelines.map((t) => {
      const mapped = this.toPublicTimeline(t);
      const topicId = t.topicId;
      if (!topicId) {
        return {
          ...mapped,
          previewArticles: [],
          totalTopicArticles: mapped.nodes.length,
        };
      }

      const coveredSlugs = new Set<string>();
      for (const n of mapped.nodes) {
        if (n.article?.slug) coveredSlugs.add(n.article.slug);
        for (const sub of n.articles ?? []) {
          if (sub.slug) coveredSlugs.add(sub.slug);
        }
      }

      const remainingSlots = Math.max(
        0,
        MAX_PREVIEW_NODES_PER_TIMELINE - mapped.nodes.length,
      );
      const candidates = enrichment.previewByTopicId.get(topicId) ?? [];
      const previewArticles =
        remainingSlots > 0
          ? candidates
              .filter((c) => !coveredSlugs.has(c.slug))
              .slice(0, remainingSlots)
              .map(toPublicNodeArticle)
          : [];

      const totalTopicArticles = Math.max(
        enrichment.branchCountByTopicId.get(topicId) ?? 0,
        mapped.nodes.length + previewArticles.length,
      );

      return {
        ...mapped,
        previewArticles,
        totalTopicArticles,
      };
    });
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

  private async loadTimelineTopicEnrichment(
    timelines: PublicTimelinePayload[],
  ): Promise<{
    branchCountByTopicId: Map<string, number>;
    previewByTopicId: Map<string, TimelineArticleRow[]>;
  }> {
    const branchCountByTopicId = new Map<string, number>();
    const previewByTopicId = new Map<string, TimelineArticleRow[]>();

    const timelineTopicIds = [
      ...new Set(
        timelines
          .map((t) => t.topicId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (
      timelineTopicIds.length === 0 ||
      typeof this.prisma.article?.groupBy !== 'function' ||
      typeof this.prisma.topic?.findMany !== 'function'
    ) {
      return { branchCountByTopicId, previewByTopicId };
    }

    const needPreviewTopicIds = [
      ...new Set(
        timelines
          .filter(
            (t) =>
              Boolean(t.topicId) &&
              t.nodes.length < MAX_PREVIEW_NODES_PER_TIMELINE,
          )
          .map((t) => t.topicId!),
      ),
    ];

    const [topicGroups, allTopics, previewRows] = await Promise.all([
      this.prisma.article.groupBy({
        by: ['topicId'],
        where: { status: PUBLISHED, topicId: { not: null } },
        _count: { id: true },
      }),
      this.prisma.topic.findMany({
        where: { status: PUBLISHED },
        select: { id: true, parentId: true },
      }),
      needPreviewTopicIds.length > 0
        ? this.prisma.article.findMany({
            where: {
              status: PUBLISHED,
              topicId: { in: needPreviewTopicIds },
              startYear: { not: null },
            },
            orderBy: [
              { isFeatured: 'desc' },
              { startYear: 'asc' },
              { title: 'asc' },
            ],
            take: MAX_PREVIEW_QUERY_BATCH,
            select: TIMELINE_NODE_ARTICLE_SELECT,
          })
        : Promise.resolve([] as TimelineArticleRow[]),
    ]);

    return aggregateTopicEnrichment(
      timelineTopicIds,
      Array.isArray(topicGroups) ? topicGroups : [],
      Array.isArray(allTopics) ? allTopics : [],
      Array.isArray(previewRows) ? previewRows : [],
    );
  }

  private toPublicTimeline(timeline: PublicTimelinePayload) {
    const { nodes, ...rest } = timeline;
    return {
      ...rest,
      nodes: nodes.map(({ article, articles = [], ...node }) => {
        const publishedArticles = articles
          .map((link) => link.article)
          .filter((a) => a.status === PUBLISHED)
          .map(toPublicNodeArticle);
        const primaryArticle =
          publishedArticles[0] ??
          (article && article.status === PUBLISHED
            ? toPublicNodeArticle(article)
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
