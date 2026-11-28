import { Injectable } from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import {
  BY_YEAR,
  PUBLIC_ARTICLE_SUMMARY_SELECT,
  toArticleSummary,
} from './public-content.mapper';
import {
  ARTICLE_CATALOG_LIMITS,
  ArticleCatalogSortEnum,
  ArticleCatalogTagFacetDto,
  PublicArticleCatalogQueryDto,
  PublicArticleCatalogResponseDto,
} from './dto/public-article-catalog.dto';

export interface IArticleCatalogSortStrategy {
  readonly key: ArticleCatalogSortEnum;
  buildOrderBy(): Prisma.ArticleOrderByWithRelationInput[];
}

const featuredSortStrategy: IArticleCatalogSortStrategy = {
  key: ArticleCatalogSortEnum.FEATURED,
  buildOrderBy: () => [
    { isFeatured: 'desc' },
    { updatedAt: 'desc' },
    { title: 'asc' },
  ],
};

const yearAscSortStrategy: IArticleCatalogSortStrategy = {
  key: ArticleCatalogSortEnum.YEAR_ASC,
  buildOrderBy: () => BY_YEAR,
};

const yearDescSortStrategy: IArticleCatalogSortStrategy = {
  key: ArticleCatalogSortEnum.YEAR_DESC,
  buildOrderBy: () => [
    { startYear: { sort: 'desc', nulls: 'last' } },
    { title: 'asc' },
  ],
};

const nameAscSortStrategy: IArticleCatalogSortStrategy = {
  key: ArticleCatalogSortEnum.NAME,
  buildOrderBy: () => [{ title: 'asc' }],
};

const SORT_STRATEGY_REGISTRY = new Map<
  ArticleCatalogSortEnum,
  IArticleCatalogSortStrategy
>([
  [featuredSortStrategy.key, featuredSortStrategy],
  [yearAscSortStrategy.key, yearAscSortStrategy],
  [yearDescSortStrategy.key, yearDescSortStrategy],
  [nameAscSortStrategy.key, nameAscSortStrategy],
]);

export function resolveCatalogOrderBy(
  sort?: ArticleCatalogSortEnum,
): Prisma.ArticleOrderByWithRelationInput[] {
  const strategy =
    (sort ? SORT_STRATEGY_REGISTRY.get(sort) : undefined) ??
    featuredSortStrategy;
  return strategy.buildOrderBy();
}

function splitCsv(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, ARTICLE_CATALOG_LIMITS.MAX_CSV_VALUES);
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function buildSearchCondition(q: string | undefined): Prisma.ArticleWhereInput {
  const trimmed = q?.trim();
  if (!trimmed) return {};
  const parsedYear = /^-?\d{1,4}$/.test(trimmed)
    ? Number.parseInt(trimmed, 10)
    : null;
  return {
    OR: [
      { title: { contains: trimmed, mode: 'insensitive' } },
      { summary: { contains: trimmed, mode: 'insensitive' } },
      { dateText: { contains: trimmed, mode: 'insensitive' } },
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
          some: { tag: { name: { contains: trimmed, mode: 'insensitive' } } },
        },
      },
    ],
  };
}

function buildTagCondition(tags: string[]): Prisma.ArticleWhereInput {
  if (tags.length === 0) return {};
  const tagIds = tags.filter((t) => UUID_PATTERN.test(t));
  const tagNames = tags.filter((t) => !UUID_PATTERN.test(t));
  return {
    articleTags: {
      some: {
        OR: [
          ...(tagIds.length > 0 ? [{ tagId: { in: tagIds } }] : []),
          ...tagNames.map((name) => ({
            tag: { name: { equals: name, mode: 'insensitive' as const } },
          })),
        ],
      },
    },
  };
}

interface ParsedCatalogCriteria {
  page: number;
  limit: number;
  orderBy: Prisma.ArticleOrderByWithRelationInput[];
  categoryIds: string[];
  topicIds: string[];
  tags: string[];
  baseAndClauses: Prisma.ArticleWhereInput[];
}

function parseCatalogCriteria(
  dto: PublicArticleCatalogQueryDto,
): ParsedCatalogCriteria {
  const page = dto.page ?? ARTICLE_CATALOG_LIMITS.DEFAULT_PAGE;
  const limit = dto.limit ?? ARTICLE_CATALOG_LIMITS.DEFAULT_LIMIT;
  const categoryIds = splitCsv(dto.categoryIds);
  const topicIds = splitCsv(dto.topicIds);
  const tags = splitCsv(dto.tags);

  const searchClause = buildSearchCondition(dto.q);
  const baseAndClauses: Prisma.ArticleWhereInput[] =
    Object.keys(searchClause).length > 0 ? [searchClause] : [];

  return {
    page,
    limit,
    orderBy: resolveCatalogOrderBy(dto.sort),
    categoryIds,
    topicIds,
    tags,
    baseAndClauses,
  };
}

function composeArticleWhere(
  criteria: ParsedCatalogCriteria,
  opts: {
    includeCategory: boolean;
    includeTopic: boolean;
    includeTags: boolean;
  },
): Prisma.ArticleWhereInput {
  const andList: Prisma.ArticleWhereInput[] = [...criteria.baseAndClauses];
  if (opts.includeCategory && criteria.categoryIds.length > 0) {
    andList.push({ categoryId: { in: criteria.categoryIds } });
  }
  if (opts.includeTopic && criteria.topicIds.length > 0) {
    andList.push({ topicId: { in: criteria.topicIds } });
  }
  if (opts.includeTags && criteria.tags.length > 0) {
    andList.push(buildTagCondition(criteria.tags));
  }
  return {
    status: ContentStatus.PUBLISHED,
    ...(andList.length > 0 ? { AND: andList } : {}),
  };
}

@Injectable()
export class PublicArticleCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async queryCatalog(
    dto: PublicArticleCatalogQueryDto,
  ): Promise<PublicArticleCatalogResponseDto> {
    const criteria = parseCatalogCriteria(dto);
    const fullWhere = composeArticleWhere(criteria, {
      includeCategory: true,
      includeTopic: true,
      includeTags: true,
    });
    const whereWithoutCategory = composeArticleWhere(criteria, {
      includeCategory: false,
      includeTopic: true,
      includeTags: true,
    });
    const whereWithoutTopic = composeArticleWhere(criteria, {
      includeCategory: true,
      includeTopic: false,
      includeTags: true,
    });
    const whereWithoutTags = composeArticleWhere(criteria, {
      includeCategory: true,
      includeTopic: true,
      includeTags: false,
    });

    const skip = (criteria.page - 1) * criteria.limit;

    const [rows, total, categoryGroups, topicGroups, tagGroups] =
      await Promise.all([
        this.prisma.article.findMany({
          where: fullWhere,
          orderBy: criteria.orderBy,
          skip,
          take: criteria.limit,
          select: PUBLIC_ARTICLE_SUMMARY_SELECT,
        }),
        this.prisma.article.count({ where: fullWhere }),
        this.prisma.article.groupBy({
          by: ['categoryId'],
          where: whereWithoutCategory,
          _count: { id: true },
        }),
        this.prisma.article.groupBy({
          by: ['topicId'],
          where: whereWithoutTopic,
          _count: { id: true },
        }),
        this.prisma.articleTag.groupBy({
          by: ['tagId'],
          where: { article: whereWithoutTags },
          _count: { articleId: true },
          orderBy: { _count: { articleId: 'desc' } },
          take: ARTICLE_CATALOG_LIMITS.MAX_FACET_TAGS,
        }),
      ]);

    const categoryCounts: Record<string, number> = {};
    for (const g of categoryGroups) {
      if (g.categoryId) categoryCounts[g.categoryId] = g._count.id;
    }

    const topicCounts: Record<string, number> = {};
    for (const g of topicGroups) {
      if (g.topicId) topicCounts[g.topicId] = g._count.id;
    }

    const tags = await this.resolveTagFacetLabels(tagGroups);
    const totalPages = Math.max(1, Math.ceil(total / criteria.limit));

    return {
      items: rows.map(toArticleSummary),
      total,
      page: criteria.page,
      limit: criteria.limit,
      totalPages,
      facets: {
        categoryCounts,
        topicCounts,
        tags,
      },
    };
  }

  private async resolveTagFacetLabels(
    tagGroups: Array<{ tagId: string; _count: { articleId: number } }>,
  ): Promise<ArticleCatalogTagFacetDto[]> {
    if (tagGroups.length === 0) return [];
    const tagRecords = await this.prisma.tag.findMany({
      where: { id: { in: tagGroups.map((t) => t.tagId) } },
      select: { id: true, name: true },
    });
    const nameById = new Map(tagRecords.map((t) => [t.id, t.name]));
    return tagGroups
      .map((g) => {
        const name = nameById.get(g.tagId);
        return name ? { id: g.tagId, name, count: g._count.articleId } : null;
      })
      .filter((item): item is ArticleCatalogTagFacetDto => item !== null);
  }
}
