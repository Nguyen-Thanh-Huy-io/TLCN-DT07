import { Injectable } from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { BY_YEAR, buildDateLabel } from './public-content.mapper';

const PUBLISHED = ContentStatus.PUBLISHED;

/** Nguồn của "bài trước / sau" trên trang đọc bài viết. */
export enum ArticleAdjacentSource {
  /** Mốc liền kề trong Dòng thời gian chứa bài (biên tập viên xếp theo diễn biến). */
  TIMELINE = 'TIMELINE',
  /** Không thuộc dòng thời gian nào: bài cùng chuyên mục, theo năm bắt đầu. */
  CATEGORY = 'CATEGORY',
}

const NEIGHBOUR_SELECT = {
  id: true,
  slug: true,
  title: true,
  status: true,
  dateText: true,
  startYear: true,
  endYear: true,
} satisfies Prisma.ArticleSelect;

type NeighbourRow = Prisma.ArticleGetPayload<{
  select: typeof NEIGHBOUR_SELECT;
}>;

export interface ArticleNeighbour {
  slug: string;
  title: string;
  dateLabel: string | null;
}

export interface ArticleAdjacency {
  source: ArticleAdjacentSource;
  /** Dòng thời gian dùng làm nguồn; null khi nguồn là chuyên mục. */
  timeline: { slug: string; title: string } | null;
  previous: ArticleNeighbour | null;
  next: ArticleNeighbour | null;
}

const toNeighbour = (
  row: NeighbourRow | null | undefined,
): ArticleNeighbour | null =>
  row
    ? { slug: row.slug, title: row.title, dateLabel: buildDateLabel(row) }
    : null;

/** Bài trước / sau của một bài viết: ưu tiên Dòng thời gian, không có thì cùng chuyên mục theo niên đại. */
@Injectable()
export class ArticleAdjacencyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAdjacent(article: {
    id: string;
    categoryId: string | null;
    timelineId: string | null;
  }): Promise<ArticleAdjacency> {
    const byTimeline = article.timelineId
      ? await this.fromTimeline(article.id, article.timelineId)
      : null;
    return byTimeline ?? this.fromCategory(article.id, article.categoryId);
  }

  private async fromTimeline(
    articleId: string,
    timelineId: string,
  ): Promise<ArticleAdjacency | null> {
    const timeline = await this.prisma.timeline.findFirst({
      where: { id: timelineId, status: PUBLISHED },
      select: {
        slug: true,
        title: true,
        nodes: {
          orderBy: { displayOrder: 'asc' },
          select: {
            article: { select: NEIGHBOUR_SELECT },
            articles: {
              orderBy: { displayOrder: 'asc' },
              select: { article: { select: NEIGHBOUR_SELECT } },
            },
          },
        },
      },
    });
    if (!timeline) return null;

    // Mỗi mốc gồm bài chính + các bài gắn thêm (N-N); bài đại diện của mốc là bài đã xuất bản đầu tiên.
    const nodeArticles = timeline.nodes.map((node) => [
      node.article,
      ...node.articles.map((a) => a.article),
    ]);
    const index = nodeArticles.findIndex((articles) =>
      articles.some((a) => a?.id === articleId),
    );
    if (index < 0) return null;
    const representative = (articles: (NeighbourRow | null)[]) =>
      articles.find((a) => a?.status === PUBLISHED && a.id !== articleId) ??
      null;
    const previous = nodeArticles
      .slice(0, index)
      .map(representative)
      .findLast(Boolean);
    const next = nodeArticles
      .slice(index + 1)
      .map(representative)
      .find(Boolean);
    if (!previous && !next) return null;

    return {
      source: ArticleAdjacentSource.TIMELINE,
      timeline: { slug: timeline.slug, title: timeline.title },
      previous: toNeighbour(previous),
      next: toNeighbour(next),
    };
  }

  private async fromCategory(
    articleId: string,
    categoryId: string | null,
  ): Promise<ArticleAdjacency> {
    const siblings = categoryId
      ? await this.prisma.article.findMany({
          where: { status: PUBLISHED, categoryId },
          orderBy: BY_YEAR,
          select: NEIGHBOUR_SELECT,
        })
      : [];
    const index = siblings.findIndex((s) => s.id === articleId);
    return {
      source: ArticleAdjacentSource.CATEGORY,
      timeline: null,
      previous: index > 0 ? toNeighbour(siblings[index - 1]) : null,
      next: index >= 0 ? toNeighbour(siblings[index + 1]) : null,
    };
  }
}
