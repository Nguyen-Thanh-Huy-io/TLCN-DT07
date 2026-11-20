import { Test } from '@nestjs/testing';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import {
  ArticleAdjacencyService,
  ArticleAdjacentSource,
} from './article-adjacency.service';

const article = (
  id: string,
  startYear: number,
  status: ContentStatus = ContentStatus.PUBLISHED,
) => ({
  id,
  slug: id,
  title: `Bài ${id}`,
  status,
  dateText: null,
  startYear,
  endYear: null,
});

const node = (
  main: ReturnType<typeof article> | null,
  extra: ReturnType<typeof article>[] = [],
) => ({
  article: main,
  articles: extra.map((a) => ({ article: a })),
});

describe('ArticleAdjacencyService — bài trước / sau', () => {
  const prisma = {
    timeline: { findFirst: jest.fn() },
    article: { findMany: jest.fn() },
  };
  let service: ArticleAdjacencyService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ArticleAdjacencyService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(ArticleAdjacencyService);
  });

  it('thuộc dòng thời gian: lấy mốc liền kề, bỏ qua mốc không có bài đã xuất bản', async () => {
    prisma.timeline.findFirst.mockResolvedValue({
      slug: 'nha-tran',
      title: 'Kháng chiến chống Nguyên Mông',
      nodes: [
        node(article('tran-thu-do', 1194)),
        node(null),
        node(article('ban-nhap', 1250, ContentStatus.DRAFT)),
        node(article('tran-hung-dao', 1228)),
        node(null, [article('bach-dang-1288', 1288)]),
      ],
    });

    const result = await service.findAdjacent({
      id: 'tran-hung-dao',
      categoryId: 'cat-person',
      timelineId: 'tl-1',
    });

    expect(result).toEqual({
      source: ArticleAdjacentSource.TIMELINE,
      timeline: { slug: 'nha-tran', title: 'Kháng chiến chống Nguyên Mông' },
      previous: {
        slug: 'tran-thu-do',
        title: 'Bài tran-thu-do',
        dateLabel: '1194',
      },
      next: {
        slug: 'bach-dang-1288',
        title: 'Bài bach-dang-1288',
        dateLabel: '1288',
      },
    });
    expect(prisma.article.findMany).not.toHaveBeenCalled();
  });

  it('dòng thời gian chỉ có mỗi bài này → dùng cùng chuyên mục', async () => {
    prisma.timeline.findFirst.mockResolvedValue({
      slug: 'tl',
      title: 'TL',
      nodes: [node(article('a2', 938))],
    });
    prisma.article.findMany.mockResolvedValue([
      article('a1', 905),
      article('a2', 938),
      article('a3', 968),
    ]);

    const result = await service.findAdjacent({
      id: 'a2',
      categoryId: 'cat',
      timelineId: 'tl-1',
    });

    expect(result).toMatchObject({
      source: ArticleAdjacentSource.CATEGORY,
      timeline: null,
      previous: { slug: 'a1' },
      next: { slug: 'a3' },
    });
  });

  it('không thuộc dòng thời gian, có chủ đề → chỉ lấy bài cùng chuyên mục và cùng chủ đề', async () => {
    prisma.article.findMany.mockResolvedValue([
      article('a1', 905),
      article('a2', 938),
    ]);

    const result = await service.findAdjacent({
      id: 'a2',
      categoryId: 'cat',
      topicId: 'topic-bac-thuoc',
      timelineId: null,
    });

    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          categoryId: 'cat',
          topicId: 'topic-bac-thuoc',
        }),
      }),
    );
    expect(result).toMatchObject({ previous: { slug: 'a1' }, next: null });
  });

  it('không thuộc dòng thời gian, không có chuyên mục → không có bài trước / sau', async () => {
    const result = await service.findAdjacent({
      id: 'a1',
      categoryId: null,
      timelineId: null,
    });

    expect(result).toEqual({
      source: ArticleAdjacentSource.CATEGORY,
      timeline: null,
      previous: null,
      next: null,
    });
    expect(prisma.timeline.findFirst).not.toHaveBeenCalled();
  });
});
