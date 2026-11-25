import appConfig from '../common/config/app.config';
import { GoogleAiProviderMode } from '../common/services/google-ai.types';
import { ConceptCanvasEngine } from './concept-canvas.constant';
import { ConceptCanvasService } from './concept-canvas.service';

describe('ConceptCanvasService — Pure RAG & Google Search Grounding', () => {
  const originalCorpus = appConfig.google_cloud_rag_corpus;

  let mockPrisma: {
    article: { findFirst: jest.Mock; findMany: jest.Mock };
  };
  let mockGoogleAi: {
    isConfigured: jest.Mock;
    generateGroundedJson: jest.Mock;
  };
  let service: ConceptCanvasService;

  beforeEach(() => {
    appConfig.google_cloud_rag_corpus =
      'projects/hisgo/locations/us-central1/ragCorpora/123';
    mockPrisma = {
      article: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    mockGoogleAi = {
      isConfigured: jest.fn().mockReturnValue(true),
      generateGroundedJson: jest.fn(),
    };
    service = new ConceptCanvasService(
      mockPrisma as never,
      mockGoogleAi as never,
    );
  });

  afterAll(() => {
    appConfig.google_cloud_rag_corpus = originalCorpus;
  });

  it('Google OFF + chủ đề ngoài kho ("lịch sử Man Utd"): trả OUT_OF_CORPUS, KHÔNG quét DB và KHÔNG lấy ảnh bài rác', async () => {
    mockGoogleAi.generateGroundedJson.mockResolvedValue({
      data: {
        groundedInCorpus: false,
        periodLabel: '',
        text: '',
        prompts: [],
      },
      groundingChunks: [],
      webSearchQueries: [],
      usedRag: false,
      providerMode: GoogleAiProviderMode.VERTEX_SERVICE_ACCOUNT,
    });

    const res = await service.explore({
      prompt: 'lịch sử Man Utd',
      useGoogleSearch: false,
    });

    expect(res.engine).toBe(ConceptCanvasEngine.OUT_OF_CORPUS);
    expect(res.matchedArticles).toEqual([]);
    expect(res.imageUrl).toBeNull();
    expect(res.prompts).toEqual([]);
    expect(mockPrisma.article.findMany).not.toHaveBeenCalled();
  });

  it('Google OFF + chủ đề có trong Vertex RAG: chỉ hydrate theo đúng slug bài viết từ groundingChunks', async () => {
    mockGoogleAi.generateGroundedJson.mockResolvedValue({
      data: {
        groundedInCorpus: true,
        periodLabel: '938 · Thời Ngô',
        text: '**[Ngô Quyền](Ngô Quyền)** đại phá quân Nam Hán trên sông Bạch Đằng.',
        prompts: ['Trận địa cọc gỗ Bạch Đằng vận hành thế nào?'],
      },
      groundingChunks: [
        {
          uri: 'gs://hisgo-rag/hisgo/articles/chien-thang-bach-dang-938.md',
          title: 'chien-thang-bach-dang-938.md',
          text: 'Chiến thắng Bạch Đằng năm 938.',
        },
      ],
      webSearchQueries: [],
      usedRag: true,
      providerMode: GoogleAiProviderMode.VERTEX_SERVICE_ACCOUNT,
    });

    mockPrisma.article.findMany.mockResolvedValue([
      {
        id: 'art-938',
        slug: 'chien-thang-bach-dang-938',
        title: 'Chiến thắng Bạch Đằng năm 938',
        summary: 'Chấm dứt hơn 1.000 năm Bắc thuộc.',
        dateText: '938',
        coverImageUrl: 'https://cdn.example.com/bach-dang.jpg',
        contentBlocks: [],
        category: { name: 'Chiến dịch & Trận đánh' },
        topic: { name: 'Buổi đầu độc lập' },
      },
    ]);

    const res = await service.explore({
      prompt: 'Chiến thắng Bạch Đằng 938',
      useGoogleSearch: false,
    });

    expect(res.engine).toBe(ConceptCanvasEngine.VERTEX_RAG);
    expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: { in: ['chien-thang-bach-dang-938'] },
          status: 'PUBLISHED',
        },
      }),
    );
    expect(res.matchedArticles).toHaveLength(1);
    expect(res.imageUrl).toBe('https://cdn.example.com/bach-dang.jpg');
  });

  it('Google ON: trả về đầy đủ webSources & webSearchQueries từ groundingMetadata và chặn câu hỏi phi lịch sử', async () => {
    mockGoogleAi.generateGroundedJson.mockResolvedValueOnce({
      data: {
        isHistoricalScope: true,
        periodLabel: '1878 – Nay · Lịch sử Bóng đá Anh',
        text: 'Khởi đầu từ **[Newton Heath](Newton Heath LYR 1878)** năm 1878.',
        prompts: ['Thảm họa Munich 1958 đã thay đổi CLB thế nào?'],
      },
      groundingChunks: [
        {
          uri: 'https://www.manutd.com/en/history',
          title: 'History by Decade | Manchester United',
          domain: 'manutd.com',
          text: 'Founded in 1878 as Newton Heath LYR.',
          isWeb: true,
        },
      ],
      webSearchQueries: ['history of Manchester United 1878'],
      usedRag: false,
      usedGoogleSearch: true,
      providerMode: GoogleAiProviderMode.VERTEX_SERVICE_ACCOUNT,
    });

    const validRes = await service.explore({
      prompt: 'lịch sử Man Utd',
      useGoogleSearch: true,
    });

    expect(validRes.engine).toBe(ConceptCanvasEngine.GOOGLE_GROUNDED);
    expect(validRes.webSearchQueries).toEqual([
      'history of Manchester United 1878',
    ]);
    expect(validRes.webSources).toEqual([
      {
        title: 'History by Decade | Manchester United',
        uri: 'https://www.manutd.com/en/history',
        domain: 'manutd.com',
        snippet: 'Founded in 1878 as Newton Heath LYR.',
      },
    ]);

    mockGoogleAi.generateGroundedJson.mockResolvedValueOnce({
      data: {
        isHistoricalScope: false,
        periodLabel: '',
        text: '',
        prompts: [],
      },
      groundingChunks: [],
      webSearchQueries: [],
      usedRag: false,
      usedGoogleSearch: true,
      providerMode: GoogleAiProviderMode.VERTEX_SERVICE_ACCOUNT,
    });

    const rejectedRes = await service.explore({
      prompt: 'viết code quicksort bằng python',
      useGoogleSearch: true,
    });

    expect(rejectedRes.engine).toBe(ConceptCanvasEngine.OUT_OF_CORPUS);
    expect(rejectedRes.prompts).toEqual([]);
  });
});
