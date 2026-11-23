import { BadRequestException } from '@nestjs/common';
import config from '../common/config/app.config';
import { GoogleAiService } from '../common/services/google-ai.service';
import { GoogleAiProviderMode } from '../common/services/google-ai.types';
import { QuizQuestionType } from '../quiz/types/quiz-question.types';
import { buildHeuristicFlashcardPreview } from './flashcard-ai.helper';
import { FlashcardAiService } from './flashcard-ai.service';
import {
  AiGeneratorEngine,
  FLASHCARD_AI_SYSTEM_PROMPT,
  FLASHCARD_LIMITS,
} from './flashcard.constant';

describe('FlashcardAiService', () => {
  let service: FlashcardAiService;
  let mockPrisma: {
    note: { findMany: jest.Mock };
    article: { findMany: jest.Mock };
    savedMaterial: { findMany: jest.Mock };
    quizAttemptAnswer: { findMany: jest.Mock };
  };

  beforeEach(() => {
    config.gemini_api_key = '';
    config.google_cloud_rag_corpus = '';
    config.google_application_credentials = '';
    config.google_cloud_service_account_json = '';
    mockPrisma = {
      note: { findMany: jest.fn().mockResolvedValue([]) },
      article: { findMany: jest.fn().mockResolvedValue([]) },
      savedMaterial: { findMany: jest.fn().mockResolvedValue([]) },
      quizAttemptAnswer: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new FlashcardAiService(mockPrisma as never);
  });

  it('ném BadRequestException khi không có topicHint lẫn nguồn dữ liệu nào', async () => {
    await expect(
      service.generatePreview('user-1', {
        includeNotes: true,
        includeWrongQuizzes: true,
        articleIds: [],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('tổng hợp thẻ bằng Heuristic từ ghi chú, bài viết và câu làm sai khi chưa cấu hình Gemini key', async () => {
    mockPrisma.note.findMany.mockResolvedValue([
      {
        id: 'note-1',
        kind: 'DEFINITION',
        title: 'Chiếu dời đô',
        content: 'Lý Công Uẩn ban hành năm 1010 dời đô về Đại La (Thăng Long).',
        highlightText: 'Chiếu dời đô (1010)',
      },
    ]);
    mockPrisma.article.findMany.mockResolvedValue([
      {
        id: 'art-1',
        title: 'Nhà Lý thành lập',
        summary: 'Mở ra kỷ nguyên văn minh Đại Việt hưng thịnh.',
        dateText: '1009',
        contentBlocks: [],
      },
    ]);
    mockPrisma.quizAttemptAnswer.findMany.mockResolvedValue([
      {
        question: {
          id: 'q-1',
          type: QuizQuestionType.SINGLE_CHOICE,
          prompt: 'Ai là vị vua đầu tiên của triều Lý?',
          explanation: 'Lý Thái Tổ (Lý Công Uẩn) lên ngôi năm 1009.',
          data: {
            options: [
              { id: 'o1', text: 'Lý Công Uẩn', isCorrect: true },
              { id: 'o2', text: 'Lý Thường Kiệt', isCorrect: false },
            ],
          },
        },
      },
    ]);

    const res = await service.generatePreview('user-1', {
      includeNotes: true,
      includeWrongQuizzes: true,
      articleIds: ['11111111-1111-4111-8111-111111111111'],
      maxCards: 10,
    });

    expect(res.engine).toBe(AiGeneratorEngine.HEURISTIC);
    expect(res.noteCount).toBe(1);
    expect(res.articleCount).toBe(1);
    expect(res.wrongQuizCount).toBe(1);
    expect(res.cards).toHaveLength(4);
    expect(res.cards[0].front).toContain('Ai là vị vua đầu tiên');
    expect(res.cards[1].sourceNoteId).toBe('note-1');
    expect(res.cards[2].front).toContain('Nhà Lý thành lập');
  });

  it('tạo được thẻ từ topicHint kèm khung ôn tập chi tiết nhiều ý ngay cả khi chưa có DB/AI', async () => {
    const res = await service.generatePreview('user-1', {
      topicHint: 'Chiến thắng Bạch Đằng năm 938',
      includeNotes: false,
      includeWrongQuizzes: false,
      articleIds: [],
      maxCards: 5,
    });

    expect(res.engine).toBe(AiGeneratorEngine.HEURISTIC);
    expect(res.deckTitle).toContain('Chiến thắng Bạch Đằng năm 938');
    expect(res.cards.length).toBeGreaterThanOrEqual(3);
    expect(res.cards[0].back).toContain('•');
  });

  it('yêu cầu câu trả lời mặt sau chi tiết (3–5 câu, không cụt ngủn) và không cắt đoạn bài viết ở 400 ký tự', () => {
    expect(FLASHCARD_AI_SYSTEM_PROMPT).toContain('3–5 câu');
    expect(FLASHCARD_AI_SYSTEM_PROMPT).toContain('KHÔNG viết cụt ngủn');

    const longSentenceOne =
      'Ngô Quyền đã chỉ huy quân dân Đại Việt bố trí trận địa cọc gỗ bịt sắt nhọn tại cửa biển sông Bạch Đằng vào cuối năm 938, tận dụng quy luật lên xuống của con nước thuỷ triều để đánh úp hạm đội thuyền chiến của Hoằng Tháo.';
    const longSentenceTwo =
      'Khi thuỷ triều dâng cao che lấp bãi cọc, thuỷ quân ta nhử chiến thuyền quân Nam Hán tiến sâu vào trận địa mai phục rồi đồng loạt phản công lúc nước rút khiến phần lớn binh lực địch bị tiêu diệt hoàn toàn.';
    const preview = buildHeuristicFlashcardPreview(
      undefined,
      [],
      [
        {
          id: 'art-long',
          title: 'Trận Bạch Đằng 938',
          summary: null,
          dateText: '938',
          contentBlocks: [{ text: `${longSentenceOne} ${longSentenceTwo}` }],
        },
      ],
      [],
      5,
    );

    const paragraphCard = preview.cards.find((c) =>
      c.front.includes('Luận điểm trọng tâm #1'),
    );
    expect(paragraphCard).toBeDefined();
    expect(paragraphCard?.back.length).toBeGreaterThan(400);
  });

  it('gọi Gemini Flash khi có gemini_api_key với prompt chi tiết và trả về thẻ AI', async () => {
    config.gemini_api_key = 'test-gemini-key';
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    deckTitle: 'Khởi nghĩa Lam Sơn (1418–1427)',
                    cards: [
                      {
                        front: 'Khởi nghĩa Lam Sơn bùng nổ vào năm nào?',
                        back: '• Khởi nghĩa bùng nổ đầu năm 1418 tại vùng núi Lam Sơn (Thanh Hoá) dưới ngọn cờ của Lê Lợi và Nguyễn Trãi.\n• Trong buổi đầu, nghĩa quân trải qua nhiều lần rút lên núi Chí Linh với lực lượng còn mỏng.\n• Thắng lợi sau 10 năm đã chấm dứt ách đô hộ nhà Minh và mở ra triều Hậu Lê.',
                      },
                    ],
                  }),
                },
              ],
            },
          },
        ],
      }),
    } as Response);

    const res = await service.generatePreview('user-1', {
      topicHint: 'Khởi nghĩa Lam Sơn',
      includeNotes: false,
      includeWrongQuizzes: false,
      maxCards: 5,
    });

    expect(res.engine).toBe(AiGeneratorEngine.GEMINI_FLASH);
    expect(res.deckTitle).toBe('Khởi nghĩa Lam Sơn (1418–1427)');
    expect(res.cards).toHaveLength(5);
    expect(res.cards[0].front).toBe('Khởi nghĩa Lam Sơn bùng nổ vào năm nào?');
    fetchSpy.mockRestore();
  });

  it('truyền ragCorpus và timeout 35s vào GoogleAiService.generateGroundedJson khi cấu hình RAG', async () => {
    config.google_cloud_rag_corpus =
      'projects/demo/locations/us-central1/ragCorpora/999';
    const googleAi = new GoogleAiService();
    jest.spyOn(googleAi, 'isConfigured').mockReturnValue(true);
    const ragSpy = jest
      .spyOn(googleAi, 'generateGroundedJson')
      .mockResolvedValue({
        data: {
          deckTitle: 'Ôn tập Trận Đông Quan',
          cards: [
            {
              front: 'Kết cục của vây thành Đông Quan (1426–1427) là gì?',
              back: 'Sau chiến thắng Chi Lăng – Xương Giang cuối năm 1427, Vương Thông buộc phải chấp nhận Hội thề Đông Quan, rút toàn bộ quân Minh về nước mà vẫn bảo toàn tính mạng cho hàng vạn tù binh theo tinh thần nhân nghĩa.',
            },
          ],
        },
        groundingChunks: [],
        usedRag: true,
        providerMode: GoogleAiProviderMode.VERTEX_SERVICE_ACCOUNT,
      });

    const ragService = new FlashcardAiService(mockPrisma as never, googleAi);
    const res = await ragService.generatePreview('user-1', {
      topicHint: 'Trận thành Đông Quan',
      includeNotes: false,
      includeWrongQuizzes: false,
      maxCards: 3,
    });

    expect(res.engine).toBe(AiGeneratorEngine.GEMINI_FLASH);
    expect(ragSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        ragCorpus: 'projects/demo/locations/us-central1/ragCorpora/999',
        timeoutMs: FLASHCARD_LIMITS.AI_TIMEOUT_MS,
      }),
    );
    expect(FLASHCARD_LIMITS.AI_TIMEOUT_MS).toBeGreaterThanOrEqual(35000);
  });
});
