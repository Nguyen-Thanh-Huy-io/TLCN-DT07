import { ContentStatus } from '@prisma/client';
import {
  ArticleCatalogSortEnum,
  ARTICLE_CATALOG_LIMITS,
} from './dto/public-article-catalog.dto';
import {
  PublicArticleCatalogService,
  resolveCatalogOrderBy,
} from './public-article-catalog.service';
import type { PrismaService } from '../common/services/prisma.service';

describe('PublicArticleCatalogService', () => {
  const makeMockPrisma = () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'art-1',
        slug: 'chien-thang-bach-dang-938',
        title: 'Chiến thắng Bạch Đằng năm 938',
        summary: 'Ngô Quyền đại phá quân Nam Hán trên sông Bạch Đằng.',
        coverImageUrl: null,
        dateText: '938',
        startYear: 938,
        endYear: null,
        isFeatured: true,
        metadata: null,
        topicId: 'topic-vn',
        category: {
          id: 'cat-battle',
          name: 'Chiến dịch & Trận đánh',
          slug: 'chien-dich-tran-danh',
          icon: null,
          parentId: 'cat-event',
        },
        articleTags: [
          { tag: { id: 'tag-1', name: 'Bạch Đằng', colorHex: null } },
        ],
      },
    ]);
    const count = jest.fn().mockResolvedValue(6281);
    const groupByArticle = jest
      .fn()
      .mockResolvedValueOnce([
        { categoryId: 'cat-event', _count: { id: 187 } },
        { categoryId: 'cat-battle', _count: { id: 406 } },
      ])
      .mockResolvedValueOnce([
        { topicId: 'topic-vn', _count: { id: 4953 } },
        { topicId: 'topic-world', _count: { id: 1328 } },
      ]);
    const groupByArticleTag = jest
      .fn()
      .mockResolvedValue([{ tagId: 'tag-1', _count: { articleId: 7 } }]);
    const findManyTag = jest
      .fn()
      .mockResolvedValue([{ id: 'tag-1', name: 'Bạch Đằng' }]);

    const prisma = {
      article: {
        findMany,
        count,
        groupBy: groupByArticle,
      },
      articleTag: {
        groupBy: groupByArticleTag,
      },
      tag: {
        findMany: findManyTag,
      },
    } as unknown as PrismaService;

    return {
      prisma,
      findMany,
      count,
      groupByArticle,
      groupByArticleTag,
      findManyTag,
    };
  };

  it('resolves orderBy strategies cleanly without fallback errors', () => {
    expect(resolveCatalogOrderBy(ArticleCatalogSortEnum.FEATURED)).toEqual([
      { isFeatured: 'desc' },
      { updatedAt: 'desc' },
      { title: 'asc' },
    ]);
    expect(resolveCatalogOrderBy(ArticleCatalogSortEnum.YEAR_DESC)[0]).toEqual({
      startYear: { sort: 'desc', nulls: 'last' },
    });
    expect(resolveCatalogOrderBy(ArticleCatalogSortEnum.NAME)).toEqual([
      { title: 'asc' },
    ]);
  });

  it('queries paginated articles alongside exact category, topic, and tag facets', async () => {
    const mocks = makeMockPrisma();
    const service = new PublicArticleCatalogService(mocks.prisma);

    const res = await service.queryCatalog({
      page: 2,
      limit: 48,
      sort: ArticleCatalogSortEnum.YEAR_ASC,
      categoryIds: 'cat-event,cat-battle',
      topicIds: 'topic-vn',
      q: '938',
    });

    expect(res.page).toBe(2);
    expect(res.limit).toBe(48);
    expect(res.total).toBe(6281);
    expect(res.totalPages).toBe(Math.ceil(6281 / 48));
    expect(res.items).toHaveLength(1);
    expect(res.items[0]?.dateLabel).toBe('938');
    expect(res.facets.categoryCounts).toEqual({
      'cat-event': 187,
      'cat-battle': 406,
    });
    expect(res.facets.topicCounts).toEqual({
      'topic-vn': 4953,
      'topic-world': 1328,
    });
    expect(res.facets.tags).toEqual([
      { id: 'tag-1', name: 'Bạch Đằng', count: 7 },
    ]);

    const findManyArg = mocks.findMany.mock.calls[0]?.[0];
    expect(findManyArg.skip).toBe(48);
    expect(findManyArg.take).toBe(48);
    expect(findManyArg.where.status).toBe(ContentStatus.PUBLISHED);

    // Category facet query must exclude categoryIds filter so sibling categories keep true counts
    const catGroupWhere = mocks.groupByArticle.mock.calls[0]?.[0]?.where;
    expect(JSON.stringify(catGroupWhere)).not.toContain('cat-battle');
    expect(JSON.stringify(catGroupWhere)).toContain('topic-vn');
  });

  it('applies default page and limit when omitted', async () => {
    const mocks = makeMockPrisma();
    const service = new PublicArticleCatalogService(mocks.prisma);

    const res = await service.queryCatalog({});
    expect(res.page).toBe(ARTICLE_CATALOG_LIMITS.DEFAULT_PAGE);
    expect(res.limit).toBe(ARTICLE_CATALOG_LIMITS.DEFAULT_LIMIT);
  });
});
