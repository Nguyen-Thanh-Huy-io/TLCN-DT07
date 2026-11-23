import { ArticleKind, ContentStatus, PostType } from '@prisma/client';
import {
  ensureUniqueArtifactPath,
  formatArticleMarkdown,
  formatBlogPostMarkdown,
  formatLessonMarkdown,
  formatTimelineNodeDate,
  formatTimelineNodeMarkdown,
  resolveCategoryKind,
} from './rag-export.formatter';
import {
  CategoryHierarchyNode,
  ExportableArticle,
  ExportableBlogPost,
  ExportableLesson,
  ExportableTimelineNode,
  RagDocumentKind,
} from './rag-export.types';

describe('RAG Exporter Formatter', () => {
  const categories = new Map<string, CategoryHierarchyNode>([
    [
      'cat-event',
      {
        id: 'cat-event',
        parentId: null,
        name: 'Sự kiện',
        slug: 'su-kien',
        kind: ArticleKind.EVENT,
      },
    ],
    [
      'cat-battle',
      {
        id: 'cat-battle',
        parentId: 'cat-event',
        name: 'Trận đánh',
        slug: 'tran-danh',
        kind: null,
      },
    ],
    [
      'cat-person',
      {
        id: 'cat-person',
        parentId: null,
        name: 'Nhân vật',
        slug: 'nhan-vat',
        kind: ArticleKind.PERSON,
      },
    ],
  ]);

  it('kế thừa đúng Category.kind từ chuyên mục cha và gắn URL /su-kien/ cho Article trận đánh', () => {
    expect(resolveCategoryKind(categories, 'cat-battle')).toBe(
      ArticleKind.EVENT,
    );

    const article: ExportableArticle = {
      id: 'art-1',
      title: 'Chiến thắng Bạch Đằng năm 938',
      slug: 'chien-thang-bach-dang-938',
      summary: 'Ngô Quyền đánh tan quân Nam Hán.',
      dateText: '938',
      startYear: 938,
      endYear: 938,
      status: ContentStatus.PUBLISHED,
      categoryId: 'cat-battle',
      topic: { name: 'Thời Ngô – Đinh – Tiền Lê', slug: 'ngo-dinh-tien-le' },
      articleTags: [{ tag: { name: 'Bạch Đằng' } }],
      metadata: {
        aliases: ['Trận Bạch Đằng 938', 'Đại thắng Bạch Đằng'],
        sources: ['Đại Việt sử ký toàn thư', 'Việt Nam sử lược'],
      },
      contentBlocks: [
        { type: 'HEADING', level: 2, text: 'Diễn biến chính' },
        {
          type: 'TEXT',
          content:
            '<p>Quân dân Đại Việt cắm <strong>cọc gỗ bịt sắt</strong>.</p>',
        },
        {
          type: 'QUOTE',
          quoteText: 'Nước Nam ta có anh hùng Ngô Quyền.',
          author: 'Sử thần',
        },
      ],
      linksOut: [
        {
          label: 'Tổng chỉ huy',
          target: {
            slug: 'ngo-quyen',
            title: 'Ngô Quyền',
            status: ContentStatus.PUBLISHED,
            categoryId: 'cat-person',
          },
        },
      ],
      linksIn: [],
    };

    const result = formatArticleMarkdown(article, categories);
    expect(result.relativePath).toBe(
      'articles/su-kien--chien-thang-bach-dang-938.md',
    );
    expect(result.manifestEntry.kind).toBe(RagDocumentKind.EVENT);
    expect(result.manifestEntry.href).toBe(
      '/su-kien/chien-thang-bach-dang-938',
    );
    expect(result.manifestEntry.aliases).toEqual([
      'Trận Bạch Đằng 938',
      'Đại thắng Bạch Đằng',
    ]);
    expect(result.manifestEntry.sources).toEqual([
      'Đại Việt sử ký toàn thư',
      'Việt Nam sử lược',
    ]);
    expect(result.markdown).toContain(
      'hisgoUrl: "/su-kien/chien-thang-bach-dang-938"',
    );
    expect(result.markdown).toContain('categoryKind: "EVENT"');
    expect(result.markdown).toContain('## Diễn biến chính');
    expect(result.markdown).toContain('**cọc gỗ bịt sắt**');
    expect(result.markdown).toContain(
      '[Ngô Quyền](/nhan-vat/ngo-quyen) (Tổng chỉ huy)',
    );
  });

  it('xuất Lesson với Block SECTION_ROW và sourceReferenceNote sạch sẽ', () => {
    const lesson: ExportableLesson = {
      id: 'les-1',
      title: 'Kháng chiến chống Nguyên – Mông',
      slug: 'khang-chien-chong-nguyen-mong',
      description: 'Tổng quan ba lần thắng lợi thời Trần.',
      difficulty: 'MEDIUM',
      sourceReferenceNote: 'SGK Lịch sử 10 GDPT 2018',
      status: ContentStatus.PUBLISHED,
      topic: { name: 'Nhà Trần', slug: 'nha-tran' },
      lessonTags: [{ tag: { name: 'Hào khí Đông A' } }],
      contentRichText: null,
      content: [
        {
          type: 'SECTION_ROW',
          columns: [
            {
              blocks: [{ type: 'TEXT', content: '<p>Lần 1 năm 1258.</p>' }],
            },
          ],
        },
      ],
    };

    const result = formatLessonMarkdown(lesson);
    expect(result.relativePath).toBe(
      'lessons/bai-hoc--khang-chien-chong-nguyen-mong.md',
    );
    expect(result.manifestEntry.href).toBe(
      '/bai-hoc/khang-chien-chong-nguyen-mong',
    );
    expect(result.manifestEntry.sources).toEqual(['SGK Lịch sử 10 GDPT 2018']);
    expect(result.markdown).toContain('Lần 1 năm 1258.');
    expect(result.markdown).toContain('SGK Lịch sử 10 GDPT 2018');
  });

  it('xuất BlogPost trích xuất đúng block meta references & tags', () => {
    const post: ExportableBlogPost = {
      id: 'blog-1',
      title: 'Cổng La Mã cổ đại',
      slug: 'cong-la-ma-co-dai',
      excerpt: 'Kiến trúc quyền lực La Mã.',
      postType: PostType.LONG_FORM,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date('2026-11-05T08:00:00.000Z'),
      author: {
        username: 'suhoc',
        userProfile: { firstName: 'Minh', lastName: 'Anh' },
      },
      contentBlocks: [
        { type: 'heading', content: '<h2>Ý nghĩa biểu tượng</h2>' },
        { type: 'paragraph', content: '<p>Cổng thành thể hiện uy quyền.</p>' },
        {
          type: 'meta',
          kind: 'metadata',
          tags: ['La Mã', 'Kiến trúc'],
          references: [
            {
              title: 'The Roman Forum',
              source: 'UNESCO',
              url: '/tai-lieu/roman-forum',
            },
          ],
        },
      ],
    };

    const result = formatBlogPostMarkdown(post);
    expect(result.relativePath).toBe('blogs/blog--cong-la-ma-co-dai.md');
    expect(result.manifestEntry.href).toBe('/blog/cong-la-ma-co-dai');
    expect(result.manifestEntry.sources).toContain(
      'The Roman Forum — UNESCO — /tai-lieu/roman-forum',
    );
    expect(result.markdown).toContain('Minh Anh');
    expect(result.markdown).toContain('Cổng thành thể hiện uy quyền.');
  });

  it('xuất TimelineNode hỗ trợ năm TCN âm và nối link bài viết gắn mốc', () => {
    expect(
      formatTimelineNodeDate({
        dateText: null,
        year: -257,
        month: null,
        day: null,
        endYear: -179,
      }),
    ).toBe('257 TCN – 179 TCN');

    const node: ExportableTimelineNode = {
      id: 'node-12345678-abcd',
      title: 'Chiến thắng Bạch Đằng',
      description: 'Mốc mở đầu kỷ nguyên độc lập tự chủ.',
      dateText: 'Năm 938',
      year: 938,
      month: null,
      day: null,
      endYear: null,
      displayOrder: 2,
      timeline: {
        id: 'tl-1',
        title: 'Thời Ngô – Đinh – Tiền Lê',
        slug: 'ngo-dinh-tien-le',
        status: ContentStatus.PUBLISHED,
        topic: { name: 'Kỷ nguyên độc lập', slug: 'ky-nguyen-doc-lap' },
      },
      article: null,
      articles: [
        {
          article: {
            slug: 'chien-thang-bach-dang-938',
            title: 'Chiến thắng Bạch Đằng năm 938',
            status: ContentStatus.PUBLISHED,
            categoryId: 'cat-battle',
          },
        },
      ],
    };

    const result = formatTimelineNodeMarkdown(node, categories);
    expect(result.relativePath).toBe(
      'timelines/moc--ngo-dinh-tien-le--002-node-123.md',
    );
    expect(result.manifestEntry.href).toBe(
      '/su-kien/chien-thang-bach-dang-938',
    );
    expect(result.markdown).toContain('/giai-doan/ngo-dinh-tien-le');
    expect(result.markdown).toContain('/dong-thoi-gian');
  });

  it('xử lý chống trùng tên file khi slug sau chuẩn hóa bị trùng', () => {
    const used = new Set<string>(['articles/bai-viet--test.md']);
    const deduped = ensureUniqueArtifactPath(
      {
        relativePath: 'articles/bai-viet--test.md',
        markdown: 'body',
        manifestEntry: {
          relativePath: 'articles/bai-viet--test.md',
          gcsDefaultPath: 'hisgo/articles/bai-viet--test.md',
          kind: RagDocumentKind.ARTICLE,
          sourceModel: 'Article',
          sourceId: '12345678-9999',
          slug: 'test',
          title: 'Test',
          subtitle: 'Test',
          href: '/bai-viet/test',
          sources: [],
          aliases: [],
        },
      },
      used,
    );

    expect(deduped.relativePath).toBe('articles/bai-viet--test-12345678.md');
    expect(deduped.manifestEntry.gcsDefaultPath).toBe(
      'hisgo/articles/bai-viet--test-12345678.md',
    );
  });
});
