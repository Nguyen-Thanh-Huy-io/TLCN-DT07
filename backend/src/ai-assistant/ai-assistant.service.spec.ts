import { generateKeyPairSync } from 'node:crypto';
import config from '../common/config/app.config';
import { AssistantEngine, AssistantLinkKind } from './ai-assistant.constant';
import {
  extractGcsObjectPath,
  mergeAssistantSuggestedLinks,
  resolveRagGroundingAttachments,
} from './ai-assistant.rag';
import { shouldUseRagForMessage } from './ai-assistant.search';
import { AiAssistantService } from './ai-assistant.service';

describe('AiAssistantService — Strict RAG & Google Search Grounding', () => {
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
    article: { findFirst: jest.Mock; findMany: jest.Mock };
    lesson: { findFirst: jest.Mock; findMany: jest.Mock };
    blogPost: { findFirst: jest.Mock; findMany: jest.Mock };
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

  it('hướng dẫn tính năng Thẻ ghi nhớ (Flashcards SM-2) và không quét DB', async () => {
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

  it('nhận diện trang bài viết đang mở và giữ đường dẫn /bai-viet/<slug>', async () => {
    mockPrisma.article.findFirst.mockResolvedValue({
      title: 'Chiến thắng Bạch Đằng năm 938',
      slug: 'chien-thang-bach-dang-938',
      summary: 'Ngô Quyền đánh tan quân Nam Hán trên sông Bạch Đằng.',
      dateText: '938',
      contentBlocks: [],
    });

    const res = await service.chat('user-1', {
      message: 'Tóm tắt trang này giúp tôi',
      currentPath: '/su-kien/chien-thang-bach-dang-938',
    });

    expect(res.contextLabel).toBe('Chiến thắng Bạch Đằng năm 938');
    expect(res.suggestedLinks[0]).toEqual(
      expect.objectContaining({
        kind: AssistantLinkKind.ARTICLE,
        href: '/bai-viet/chien-thang-bach-dang-938',
      }),
    );
  });

  it('Google OFF + ngoài kho RAG (như "lịch sử Man Utd"): chặn cứng, KHÔNG quét ILIKE DB, KHÔNG gắn mác VERTEX_RAG', async () => {
    config.google_cloud_service_account_json = JSON.stringify({
      project_id: 'hisgo-rag-e2e',
      client_email: 'sa@hisgo-rag-e2e.iam.gserviceaccount.com',
      private_key: privateKey,
    });
    config.google_cloud_rag_corpus =
      'projects/hisgo-rag-e2e/locations/us-central1/ragCorpora/777';

    const originalFetch = global.fetch;
    global.fetch = jest
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
                      groundedInCorpus: false,
                      reply: '',
                      quickActions: [],
                    }),
                  },
                ],
              },
              groundingMetadata: { groundingChunks: [] },
            },
          ],
        }),
      }) as typeof fetch;

    try {
      const res = await service.chat('user-1', {
        message: 'Lịch sử CLB Man Utd như thế nào?',
        useGoogleSearch: false,
      });

      expect(res.engine).toBe(AssistantEngine.HEURISTIC);
      expect(res.reply).toContain('chưa có tư liệu trong kho');
      expect(res.suggestedLinks).toEqual([]);
      expect(mockPrisma.article.findMany).not.toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('Google ON: trả lời kèm webSources và webSearchQueries trích xuất từ groundingMetadata', async () => {
    config.google_cloud_service_account_json = JSON.stringify({
      project_id: 'hisgo-rag-e2e',
      client_email: 'sa@hisgo-rag-e2e.iam.gserviceaccount.com',
      private_key: privateKey,
    });

    const originalFetch = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'ya29.gg-e2e', expires_in: 3600 }),
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
                      isHistoricalScope: true,
                      reply:
                        'Manchester United thành lập năm 1878 với tên Newton Heath LYR Football Club.',
                      quickActions: [],
                    }),
                  },
                ],
              },
              groundingMetadata: {
                webSearchQueries: ['lịch sử hình thành Manchester United 1878'],
                groundingChunks: [
                  {
                    web: {
                      uri: 'https://vi.wikipedia.org/wiki/Manchester_United_F.C.',
                      title: 'Manchester United F.C. – Wikipedia tiếng Việt',
                      domain: 'vi.wikipedia.org',
                    },
                  },
                ],
                groundingSupports: [
                  {
                    segment: {
                      text: 'Thành lập năm 1878 với tên Newton Heath.',
                    },
                    groundingChunkIndices: [0],
                  },
                ],
              },
            },
          ],
        }),
      }) as typeof fetch;

    try {
      const res = await service.chat('user-1', {
        message: 'Lịch sử CLB Man Utd như thế nào?',
        useGoogleSearch: true,
      });

      expect(res.engine).toBe(AssistantEngine.GOOGLE_GROUNDED);
      expect(res.webSearchQueries).toEqual([
        'lịch sử hình thành Manchester United 1878',
      ]);
      expect(res.webSources).toEqual([
        expect.objectContaining({
          title: 'Manchester United F.C. – Wikipedia tiếng Việt',
          uri: 'https://vi.wikipedia.org/wiki/Manchester_United_F.C.',
          domain: 'vi.wikipedia.org',
          snippet: 'Thành lập năm 1878 với tên Newton Heath.',
        }),
      ]);
      expect(mockPrisma.article.findMany).not.toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('extractGcsObjectPath & resolveRagGroundingAttachments tách sách thành sourceCitations và HISGO thành link', () => {
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

    const merged = mergeAssistantSuggestedLinks(null, attachments.links, []);
    expect(merged).toHaveLength(2);
  });
});
