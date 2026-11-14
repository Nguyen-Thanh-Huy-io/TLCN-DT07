import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ContentStatus, LessonStatus } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { PublicContentService } from './public-content.service';

const PUBLISHED = ContentStatus.PUBLISHED;

const summaryRow = (id: string, overrides: object = {}) => ({
  id,
  slug: id,
  title: `Bài ${id}`,
  summary: null,
  coverImageUrl: null,
  dateText: null,
  startYear: 938,
  endYear: null,
  isFeatured: false,
  metadata: null,
  topicId: null,
  categoryId: 'cat-event',
  linksOut: [],
  category: null,
  articleTags: [],
  ...overrides,
});

const PERSON_ROOT = { id: 'cat-person', kind: 'PERSON', parentId: null };
const PERSON_CHILD = { id: 'cat-king', kind: null, parentId: 'cat-person' };
const EVENT_ROOT = { id: 'cat-event', kind: 'EVENT', parentId: null };

describe('PublicContentService — dữ liệu trang công khai', () => {
  let service: PublicContentService;
  const prisma = {
    category: { findMany: jest.fn(), findUnique: jest.fn() },
    article: { findMany: jest.fn(), findFirst: jest.fn() },
    blogPost: { findMany: jest.fn(), findFirst: jest.fn() },
    timeline: { findMany: jest.fn(), findFirst: jest.fn() },
    tag: { findMany: jest.fn() },
    lesson: { findMany: jest.fn() },
    topic: { findFirst: jest.fn() },
    quiz: { findUnique: jest.fn() },
    quizAttempt: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PublicContentService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(PublicContentService);
  });

  describe('chuyên mục', () => {
    it('đếm số bài đã xuất bản của mỗi chuyên mục', async () => {
      prisma.category.findMany.mockResolvedValue([
        { id: 'c1', name: 'Nhân vật', _count: { articles: 4 } },
      ]);

      await expect(service.getCategories()).resolves.toEqual([
        { id: 'c1', name: 'Nhân vật', articleCount: 4 },
      ]);
    });

    it('trang chuyên mục gồm bài của chính nó và chuyên mục con, chỉ bài đã xuất bản', async () => {
      prisma.category.findUnique.mockResolvedValue({
        id: 'c1',
        children: [{ id: 'c1a' }, { id: 'c1b' }],
      });
      prisma.article.findMany.mockResolvedValue([summaryRow('a1')]);

      const result = await service.getCategoryBySlug('nhan-vat');

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: PUBLISHED,
            categoryId: { in: ['c1', 'c1a', 'c1b'] },
          },
        }),
      );
      expect(result.articles[0]).toMatchObject({ id: 'a1', dateLabel: '938' });
    });

    it('chuyên mục không tồn tại → 404', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.getCategoryBySlug('khong-co')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('bài viết', () => {
    it('lọc theo chuyên mục, tag, từ khoá và chỉ lấy bài đã xuất bản', async () => {
      prisma.article.findMany.mockResolvedValue([]);

      await service.getArticles({
        category: 'su-kien',
        tag: 't-1',
        q: 'Bạch Đằng',
        limit: 5,
      });

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: PUBLISHED,
            category: { slug: 'su-kien' },
            articleTags: { some: { tagId: 't-1' } },
            OR: [
              { title: { contains: 'Bạch Đằng', mode: 'insensitive' } },
              { summary: { contains: 'Bạch Đằng', mode: 'insensitive' } },
            ],
          },
          take: 5,
        }),
      );
    });

    it('bài chưa xuất bản / không tồn tại → 404', async () => {
      prisma.article.findFirst.mockResolvedValue(null);

      await expect(service.getArticleBySlug('ban-nhap')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.article.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: 'ban-nhap', status: PUBLISHED },
        }),
      );
    });

    it('chi tiết bài: bài liên quan theo tag, bài trước / sau cùng chuyên mục, dòng thời gian chứa bài', async () => {
      prisma.article.findFirst.mockResolvedValue({
        ...summaryRow('a2', {
          articleTags: [{ tag: { id: 't-1', name: 'Nhà Ngô' } }],
        }),
        coverCaption: null,
        contentBlocks: [],
        datePrecision: null,
        publishedAt: null,
        updatedAt: null,
        timelineNodes: [
          {
            title: 'Trận Bạch Đằng',
            timeline: { slug: 'bac-thuoc', title: 'Bắc thuộc' },
          },
        ],
      });
      prisma.article.findMany
        .mockResolvedValueOnce([summaryRow('lien-quan')])
        .mockResolvedValueOnce([
          { id: 'a1', slug: 'a1', title: 'Trước', startYear: 905 },
          { id: 'a2', slug: 'a2', title: 'Giữa', startYear: 938 },
          { id: 'a3', slug: 'a3', title: 'Sau', startYear: 968 },
        ]);

      const result = await service.getArticleBySlug('a2');

      expect(result.related.map((r) => r.id)).toEqual(['lien-quan']);
      expect(result.previous).toEqual({
        slug: 'a1',
        title: 'Trước',
        dateLabel: '905',
      });
      expect(result.next).toMatchObject({ slug: 'a3' });
      expect(result.timelines).toEqual([
        { slug: 'bac-thuoc', title: 'Bắc thuộc', nodeTitle: 'Trận Bạch Đằng' },
      ]);
      expect(result.tags).toEqual([{ id: 't-1', name: 'Nhà Ngô' }]);
    });

    it('bài không có tag thì không truy vấn bài liên quan', async () => {
      prisma.article.findFirst.mockResolvedValue({
        ...summaryRow('a1', { categoryId: null }),
        timelineNodes: [],
      });

      const result = await service.getArticleBySlug('a1');

      expect(prisma.article.findMany).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        related: [],
        previous: null,
        next: null,
      });
    });
  });

  describe('dòng thời gian', () => {
    it('mốc trỏ tới bài chưa xuất bản vẫn hiện nhưng không có link bài', async () => {
      prisma.timeline.findFirst.mockResolvedValue({
        id: 'tl-1',
        slug: 'nha-tran',
        nodes: [
          {
            id: 'n1',
            year: 1288,
            month: 4,
            day: 9,
            article: {
              slug: 'bach-dang-1288',
              title: 'Bạch Đằng 1288',
              status: PUBLISHED,
            },
          },
          {
            id: 'n2',
            year: -179,
            article: {
              slug: 'nhap',
              title: 'Bản nháp',
              status: ContentStatus.DRAFT,
            },
          },
        ],
      });

      const { nodes } = await service.getTimelineBySlug('nha-tran');

      expect(nodes[0]).toMatchObject({
        dateLabel: '9/4/1288',
        article: { slug: 'bach-dang-1288' },
      });
      expect(nodes[1]).toMatchObject({ dateLabel: '179 TCN', article: null });
    });

    it('dòng thời gian chưa xuất bản → 404', async () => {
      prisma.timeline.findFirst.mockResolvedValue(null);

      await expect(service.getTimelineBySlug('nhap')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getPeriodBySlug('nhap')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('giai đoạn lấy năm đầu / cuối từ các mốc', async () => {
      prisma.timeline.findMany.mockResolvedValue([
        {
          id: 'tl-1',
          slug: 'nha-tran',
          title: 'Nhà Trần',
          nodes: [{ year: 1288 }, { year: 1226 }, { year: null }],
        },
        { id: 'tl-2', slug: 'trong', title: 'Chưa có mốc', nodes: [] },
      ]);

      const periods = await service.getPeriods();

      expect(periods[0]).toMatchObject({ startYear: 1226, endYear: 1288 });
      expect(periods[1]).toMatchObject({ startYear: 0, endYear: null });
    });
  });

  describe('danh bạ theo loại chuyên mục (nhân vật / sự kiện / địa danh)', () => {
    beforeEach(() => {
      prisma.category.findMany.mockResolvedValue([
        PERSON_ROOT,
        PERSON_CHILD,
        EVENT_ROOT,
      ]);
    });

    it('chuyên mục con kế thừa loại của chuyên mục cha', async () => {
      prisma.article.findMany.mockResolvedValue([
        {
          ...summaryRow('tran-hung-dao'),
          categoryId: 'cat-king',
          category: { ...PERSON_CHILD, name: 'Vua chúa' },
          metadata: { person: { occupation: 'Tướng' } },
          timelineNodes: [{ timeline: { slug: 'nha-tran' } }],
        },
        {
          ...summaryRow('bach-dang'),
          category: { ...EVENT_ROOT, name: 'Sự kiện' },
          timelineNodes: [],
        },
      ]);

      const figures = await service.getFigureDirectory();

      expect(figures).toHaveLength(1);
      expect(figures[0]).toMatchObject({
        slug: 'tran-hung-dao',
        category: 'Vua chúa',
        role: 'Tướng',
        periodSlug: 'nha-tran',
      });
    });

    it('địa danh có toạ độ thì trả geo', async () => {
      prisma.category.findMany.mockResolvedValue([
        { id: 'cat-loc', kind: 'LOCATION', parentId: null },
      ]);
      prisma.article.findMany.mockResolvedValue([
        {
          ...summaryRow('hoang-thanh'),
          category: { id: 'cat-loc', kind: 'LOCATION', name: 'Di tích' },
          metadata: { site: { latitude: 21.03, longitude: 105.84 } },
          timelineNodes: [],
        },
      ]);

      const [site] = await service.getLocations();

      expect(site.geo).toEqual({ latitude: 21.03, longitude: 105.84 });
    });

    it('mở bài sự kiện bằng đường dẫn nhân vật → 404', async () => {
      prisma.article.findFirst.mockResolvedValue({
        ...summaryRow('bach-dang'),
        category: EVENT_ROOT,
      });

      await expect(service.getFigureBySlug('bach-dang')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('chi tiết sự kiện trả mục trong danh bạ sự kiện', async () => {
      const eventRow = {
        ...summaryRow('bach-dang'),
        category: { ...EVENT_ROOT, name: 'Sự kiện' },
        timelineNodes: [],
      };
      prisma.article.findFirst.mockResolvedValue(eventRow);
      prisma.article.findMany.mockResolvedValue([eventRow]);

      await expect(service.getEventBySlug('bach-dang')).resolves.toMatchObject({
        slug: 'bach-dang',
        category: 'Sự kiện',
      });
    });
  });

  it('tag chỉ hiện khi có bài đã xuất bản', async () => {
    prisma.tag.findMany.mockResolvedValue([
      { id: 't-1', name: 'Nhà Trần', _count: { articleTags: 2 } },
      { id: 't-2', name: 'Trống', _count: { articleTags: 0 } },
    ]);

    await expect(service.getTags()).resolves.toEqual([
      { id: 't-1', name: 'Nhà Trần', articleCount: 2 },
    ]);
  });

  it('blog công khai chỉ tìm bài đã xuất bản', async () => {
    prisma.blogPost.findFirst.mockResolvedValue(null);

    await expect(service.getBlogPostBySlug('nhap')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.blogPost.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'nhap', status: PUBLISHED } }),
    );
  });

  it('thư viện bài học: chỉ bài đã xuất bản, ước lượng phút đọc tối thiểu 1, đề có ngưỡng đạt mặc định', async () => {
    prisma.lesson.findMany.mockResolvedValue([
      {
        id: 'l-1',
        title: 'Ngô Quyền',
        slug: 'ngo-quyen',
        content: [],
        topic: null,
        lessonTags: [],
        quiz: {
          id: 'q-1',
          title: 'Đề 1',
          passingScorePercent: null,
          quizQuestions: [],
        },
      },
    ]);

    const [lesson] = await service.getLibraryLessons();

    expect(prisma.lesson.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: LessonStatus.PUBLISHED } }),
    );
    expect(lesson.estimatedReadMinutes).toBe(1);
    expect(lesson.quiz?.passingScorePercent).toEqual(expect.any(Number));
  });

  it('chủ đề chưa xuất bản → 404; chủ đề có chủ đề con đã xuất bản', async () => {
    prisma.topic.findFirst.mockResolvedValueOnce(null);
    await expect(service.getTopicBySlug('nhap')).rejects.toThrow(
      NotFoundException,
    );

    prisma.topic.findFirst.mockResolvedValueOnce({
      id: 'tp-1',
      slug: 'trung-dai',
      name: 'Trung đại',
      children: [{ id: 'tp-2', slug: 'nha-tran', name: 'Nhà Trần' }],
    });
    const topic = await service.getTopicBySlug('trung-dai');
    expect(topic.children.map((c) => c.slug)).toEqual(['nha-tran']);
  });

  describe('thống kê đề', () => {
    it('tính tỉ lệ đạt, điểm và thời gian trung bình', async () => {
      prisma.quiz.findUnique.mockResolvedValue({
        id: 'q-1',
        title: 'Đề 1',
        lesson: { title: 'Ngô Quyền' },
      });
      prisma.quizAttempt.findMany.mockResolvedValue([
        { id: 'a1', scorePercent: 80, timeSpentSeconds: 120, isPassed: true },
        {
          id: 'a2',
          scorePercent: 40,
          timeSpentSeconds: 60,
          isPassed: false,
          user: { username: 'hoc-vien' },
        },
      ]);

      const stats = await service.getQuizStatistics('q-1');

      expect(stats.summary).toEqual({
        totalAttempts: 2,
        passedAttempts: 1,
        passRatePercent: 50,
        averageScore: 60,
        averageTimeMinutes: '1.5',
      });
      expect(stats.recentAttempts.map((a) => a.learnerName)).toEqual([
        'Thí sinh tự do',
        'hoc-vien',
      ]);
    });

    it('chưa có lượt nộp → toàn số 0', async () => {
      prisma.quiz.findUnique.mockResolvedValue({ id: 'q-1', title: 'Đề 1' });
      prisma.quizAttempt.findMany.mockResolvedValue([]);

      const stats = await service.getQuizStatistics('q-1');

      expect(stats.summary).toMatchObject({
        totalAttempts: 0,
        passRatePercent: 0,
        averageScore: 0,
      });
    });

    it('đề không tồn tại → 404', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(service.getQuizStatistics('khong-co')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
