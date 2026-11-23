import { generateKeyPairSync } from 'node:crypto';
import { ArticleKind } from '@prisma/client';
import config from '../common/config/app.config';
import { AssistantEngine, AssistantLinkKind } from './ai-assistant.constant';
import {
  extractGcsObjectPath,
  mergeAssistantSuggestedLinks,
  resolveRagGroundingAttachments,
} from './ai-assistant.rag';
import { shouldUseRagForMessage } from './ai-assistant.search';
import { AiAssistantService } from './ai-assistant.service';

describe('AiAssistantService & RAG Grounding', () => {
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  let service: AiAssistantService;
  const envSnapshot = {
    project: config.google_cloud_project_id,
    credsPath: config.google_application_credentials,
    credsJson: config.google_cloud_service_account_json,
    apiKey: config.gemini_api_key,
    ragCorpus: config.google_cloud_rag_corpus,
  };

  let mockPrisma: {
    category: { findMany: jest.Mock };
    article: { findFirst: jest.Mock; findMany: jest.Mock };
    lesson: { findFirst: jest.Mock; findMany: jest.Mock };
    blogPost: { findFirst: jest.Mock; findMany: jest.Mock };
    timelineNode: { findMany: jest.Mock };
    userLearningStats: { findUnique: jest.Mock };
    flashcard: { count: jest.Mock };
    studyMindmap: { count: jest.Mock };
    savedMaterial: { count: jest.Mock };
  };

  beforeEach(() => {
    config.google_cloud_project_id = '';
    config.google_application_credentials = '';
    config.google_cloud_service_account_json = '';
    config.gemini_api_key = '';
    config.google_cloud_rag_corpus = '';

    mockPrisma = {
      category: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'cat-event', parentId: null, kind: ArticleKind.EVENT },
          { id: 'cat-battle', parentId: 'cat-event', kind: null },
          { id: 'cat-person', parentId: null, kind: ArticleKind.PERSON },
        ]),
      },
      article: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      lesson: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      blogPost: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      timelineNode: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      userLearningStats: {
        findUnique: jest.fn().mockResolvedValue({
          totalXp: 350,
          currentDayStreak: 4,
        }),
      },
      flashcard: { count: jest.fn().mockResolvedValue(6) },
      studyMindmap: { count: jest.fn().mockResolvedValue(2) },
      savedMaterial: { count: jest.fn().mockResolvedValue(5) },
    };
    service = new AiAssistantService(mockPrisma as never);
  });

  afterAll(() => {
    config.google_cloud_project_id = envSnapshot.project;
    config.google_application_credentials = envSnapshot.credsPath;
    config.google_cloud_service_account_json = envSnapshot.credsJson;
    config.gemini_api_key = envSnapshot.apiKey;
    config.google_cloud_rag_corpus = envSnapshot.ragCorpus;
  });

  it('Intent Gate bỏ qua RAG cho câu tiến độ, hướng dẫn và tán gẫu; bật RAG cho câu tra cứu lịch sử', () => {
    expect(shouldUseRagForMessage('Nay ăn cơm chưa?')).toBe(false);
    expect(shouldUseRagForMessage('Hôm nay tôi cần ôn gì?')).toBe(false);
    expect(shouldUseRagForMessage('Hướng dẫn dùng Flashcard SM-2')).toBe(false);
    expect(
      shouldUseRagForMessage('Chiến thắng Bạch Đằng năm 938 diễn ra sao?'),
    ).toBe(true);
    expect(
      shouldUseRagForMessage('Cách mạng Công nghiệp lần thứ nhất ở Anh'),
    ).toBe(true);
  });

  it('hướng dẫn tính năng Thẻ ghi nhớ (Flashcards SM-2) và trả kèm nút điều hướng nhanh', async () => {
    const res = await service.chat(undefined, {
      message: 'Hướng dẫn tôi cách ôn thẻ ghi nhớ Flashcard trên HISGO',
    });

    expect(res.engine).toBe(AssistantEngine.HEURISTIC);
    expect(res.reply).toContain('Thẻ ghi nhớ (Flashcards SM-2)');
    expect(
      res.quickActions.some((a) => a.href === '/tai-khoan?tab=the-ghi-nho'),
    ).toBe(true);
    expect(mockPrisma.article.findMany).not.toHaveBeenCalled();
  });

  it('báo cáo tiến độ học tập cá nhân khi người dùng đã đăng nhập hỏi "Hôm nay tôi cần ôn gì?"', async () => {
    const res = await service.chat('user-1', {
      message: 'Kiểm tra tiến độ hôm nay tôi cần ôn gì?',
    });

    expect(res.reply).toContain('350 XP');
    expect(res.reply).toContain('4 ngày');
    expect(res.reply).toContain('6 thẻ');
    expect(res.quickActions).toHaveLength(3);
  });

  it('nhận diện bài Sự kiện qua Category.kind kế thừa và giữ đúng URL /su-kien/', async () => {
    mockPrisma.article.findFirst.mockResolvedValue({
      title: 'Chiến thắng Bạch Đằng năm 938',
      slug: 'chien-thang-bach-dang-938',
      summary: 'Ngô Quyền đánh tan quân Nam Hán trên sông Bạch Đằng.',
      dateText: '938',
      contentBlocks: [],
      categoryId: 'cat-battle',
    });

    const res = await service.chat('user-1', {
      message: 'Tóm tắt trang này giúp tôi',
      currentPath: '/su-kien/chien-thang-bach-dang-938',
    });

    expect(res.contextLabel).toBe('Chiến thắng Bạch Đằng năm 938');
    expect(res.suggestedLinks[0]).toEqual(
      expect.objectContaining({
        kind: AssistantLinkKind.EVENT,
        href: '/su-kien/chien-thang-bach-dang-938',
      }),
    );
  });

  it('tìm đa thực thể DB (Article Nhân vật, BlogPost, TimelineNode) và không gắn link bài sử cho tán gẫu', async () => {
    config.gemini_api_key = 'test-gemini-key';
    mockPrisma.article.findMany.mockResolvedValue([
      {
        title: 'Trần Hưng Đạo',
        slug: 'tran-hung-dao',
        dateText: '1228–1300',
        summary: 'Tổng chỉ huy kháng chiến chống Nguyên.',
        categoryId: 'cat-person',
      },
    ]);
    mockPrisma.blogPost.findMany.mockResolvedValue([
      {
        title: 'Bình Ngô & Hịch tướng sĩ',
        slug: 'binh-ngo-hich-tuong-si',
        excerpt: 'Phân tích văn học sử.',
      },
    ]);
    mockPrisma.timelineNode.findMany.mockResolvedValue([
      {
        title: 'Chiến thắng Bạch Đằng 1288',
        dateText: '1288',
        timeline: { title: 'Nhà Trần', slug: 'nha-tran-khang-chien' },
      },
    ]);

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    reply: 'Trần Hưng Đạo chỉ huy đại thắng Nguyên – Mông.',
                    quickActions: [{ label: 'Đọc thêm', href: '/bai-viet' }],
                  }),
                },
              ],
            },
          },
        ],
      }),
    } as Response);

    const res = await service.chat('user-1', {
      message:
        'Vai trò của Trần Hưng Đạo trong kháng chiến chống Nguyên là gì?',
    });

    expect(res.engine).toBe(AssistantEngine.GEMINI_FLASH);
    expect(res.suggestedLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: AssistantLinkKind.PERSON,
          href: '/nhan-vat/tran-hung-dao',
        }),
        expect.objectContaining({
          kind: AssistantLinkKind.BLOG,
          href: '/blog/binh-ngo-hich-tuong-si',
        }),
        expect.objectContaining({
          kind: AssistantLinkKind.TIMELINE,
          href: '/giai-doan/nha-tran-khang-chien',
        }),
      ]),
    );
    fetchSpy.mockRestore();
  });

  it('extractGcsObjectPath & resolveRagGroundingAttachments tách sách thành sourceCitations tĩnh và HISGO thành link', () => {
    expect(
      extractGcsObjectPath(
        'gs://hisgo-bucket/books/openstax-world-history-vol-1.pdf',
      ),
    ).toBe('books/openstax-world-history-vol-1.pdf');

    const attachments = resolveRagGroundingAttachments([
      {
        uri: 'gs://hisgo-bucket/hisgo/articles/su-kien--hoi-nghi-dien-hong.md',
        title: 'su-kien--hoi-nghi-dien-hong.md',
        text: 'Hội nghị Diên Hồng năm 1284.',
      },
      {
        uri: 'gs://hisgo-bucket/books/custom-history-book.pdf',
        title: 'custom-history-book.pdf',
        text: 'Đoạn trích sách lịch sử.',
      },
      {
        uri: 'gs://hisgo-bucket/wikipedia/Trận_thành_Đông_Quan.md',
        title: 'Trận_thành_Đông_Quan.md',
        text: 'Trận bao vây Đông Quan.',
      },
    ]);

    expect(attachments.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: AssistantLinkKind.EVENT,
          href: '/su-kien/hoi-nghi-dien-hong',
        }),
        expect.objectContaining({
          kind: AssistantLinkKind.WIKIPEDIA,
          title: 'Trận thành Đông Quan',
          external: true,
        }),
      ]),
    );
    expect(attachments.citations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'custom history book',
        }),
      ]),
    );

    const merged = mergeAssistantSuggestedLinks(null, attachments.links, [
      {
        kind: AssistantLinkKind.EVENT,
        title: 'Trùng',
        href: '/su-kien/hoi-nghi-dien-hong',
      },
    ]);
    expect(merged).toHaveLength(2);
    expect(merged.map((m) => m.href)).toEqual([
      '/su-kien/hoi-nghi-dien-hong',
      [
        'https',
        'vi.wikipedia.org/wiki/Tr%E1%BA%ADn_th%C3%A0nh_%C4%90%C3%B4ng_Quan',
      ].join('://'),
    ]);
  });

  it('gọi Vertex AI kèm vertexRagStore cho câu hỏi lịch sử -> engine VERTEX_RAG + gắn link & trích dẫn sách; bỏ qua RAG khi tán gẫu', async () => {
    config.google_cloud_service_account_json = JSON.stringify({
      project_id: 'hisgo-rag-e2e',
      client_email: 'sa@hisgo-rag-e2e.iam.gserviceaccount.com',
      private_key: privateKey,
    });
    config.google_cloud_rag_corpus =
      'projects/hisgo-rag-e2e/locations/us-central1/ragCorpora/777';

    const originalFetch = global.fetch;
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'ya29.rag-e2e', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      reply:
                        'Cách mạng Công nghiệp khởi đầu tại Anh thế kỷ XVIII với động cơ hơi nước.',
                      quickActions: [
                        { label: 'Xem Bài viết', href: '/bai-viet' },
                      ],
                    }),
                  },
                ],
              },
              groundingMetadata: {
                groundingChunks: [
                  {
                    retrievedContext: {
                      uri: 'gs://hisgo-rag/books/openstax-world-history-vol-2.pdf',
                      title: 'openstax-world-history-vol-2.pdf',
                      text: 'Industrial Revolution started in Britain.',
                    },
                  },
                ],
              },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      reply:
                        'Chào bạn, tôi là Sử Gia AI sẵn sàng hỗ trợ học sử!',
                      quickActions: [],
                    }),
                  },
                ],
              },
            },
          ],
        }),
      });
    global.fetch = fetchMock as typeof fetch;

    try {
      const historyRes = await service.chat('user-1', {
        message: 'Cách mạng Công nghiệp lần thứ nhất diễn ra như thế nào?',
      });

      expect(historyRes.engine).toBe(AssistantEngine.VERTEX_RAG);
      expect(historyRes.sourceCitations.length).toBeGreaterThanOrEqual(1);

      const chatBody = JSON.parse(
        String((fetchMock.mock.calls[1] as [string, RequestInit])[1].body),
      ) as { tools?: unknown[] };
      expect(Array.isArray(chatBody.tools)).toBe(true);

      const casualRes = await service.chat('user-1', {
        message: 'Nay ăn cơm chưa?',
      });
      expect(casualRes.engine).toBe(AssistantEngine.GEMINI_FLASH);
      expect(casualRes.suggestedLinks).toEqual([]);
      const casualBody = JSON.parse(
        String((fetchMock.mock.calls[2] as [string, RequestInit])[1].body),
      ) as { tools?: unknown[] };
      expect(casualBody.tools).toBeUndefined();
    } finally {
      global.fetch = originalFetch;
    }
  });
});
