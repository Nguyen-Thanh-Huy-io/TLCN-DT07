import config from '../common/config/app.config';
import { ModerationAiService } from './moderation-ai.service';

describe('ModerationAiService (3-Tier Safety Guardrails)', () => {
  let service: ModerationAiService;
  const originalKey = config.gemini_api_key;

  beforeEach(() => {
    config.gemini_api_key = '';
    service = new ModerationAiService();
  });

  afterAll(() => {
    config.gemini_api_key = originalKey;
  });

  it('Tier 1 (SAFE / ALLOW): cho phép bài thảo luận học thuật lịch sử văn minh', async () => {
    const result = await service.evaluateContent(
      'Chiến thắng Bạch Đằng năm 938 của Ngô Quyền đã chấm dứt hơn một thiên niên kỷ Bắc thuộc, mở ra kỷ nguyên độc lập tự chủ lâu dài cho dân tộc Việt Nam.',
    );

    expect(result.isSafe).toBe(true);
    expect(result.riskLevel).toBe('SAFE');
    expect(result.action).toBe('ALLOW');
    expect(result.detectedCategories).toEqual(['NONE']);
  });

  it('Tier 3 (CRITICAL / AUTO_HIDE): tự động chặn nội dung xuyên tạc chủ quyền Hoàng Sa, Trường Sa', async () => {
    const result = await service.evaluateContent(
      'Luận điệu xuyên tạc rằng Hoàng Sa không phải của Việt Nam mà là của nước ngoài.',
    );

    expect(result.isSafe).toBe(false);
    expect(result.riskLevel).toBe('CRITICAL');
    expect(result.action).toBe('AUTO_HIDE');
    expect(result.detectedCategories).toContain('HISTORICAL_REVISIONISM');
  });

  it('Tier 3 (HIGH / AUTO_HIDE): tự động ẩn nội dung chửi bới thô tục hoặc spam cờ bạc', async () => {
    const result = await service.evaluateContent(
      'Tham gia nhà cái uy tín cá độ bóng đá nhận thưởng 100% ngay hôm nay, lũ óc chó.',
    );

    expect(result.isSafe).toBe(false);
    expect(result.action).toBe('AUTO_HIDE');
    expect(result.detectedCategories).toEqual(
      expect.arrayContaining(['PROFANITY', 'SPAM']),
    );
  });

  it('Tier 2 (MEDIUM / FLAG_FOR_REVIEW): gắn cờ nghi vấn cần Admin rà soát với nội dung nhạy cảm', async () => {
    const result = await service.evaluateContent(
      'Đây là một giả thuyết chưa kiểm chứng và có người cho rằng sách giáo khoa nói dối về chi tiết này.',
    );

    expect(result.isSafe).toBe(false);
    expect(result.action).toBe('FLAG_FOR_REVIEW');
    expect(result.riskLevel).toBe('MEDIUM');
  });

  it('trả về SAFE ALLOW ngay lập tức với chuỗi rỗng hoặc toàn khoảng trắng', async () => {
    const result = await service.evaluateContent('    \n\t   ');
    expect(result.isSafe).toBe(true);
    expect(result.action).toBe('ALLOW');
    expect(result.engine).toBe('HYBRID_SENTINEL');
  });

  describe('Gemini Flash fallback & guardrails', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      config.gemini_api_key = '';
      global.fetch = originalFetch;
      jest.restoreAllMocks();
    });

    it('dùng kết quả GEMINI_FLASH khi API phản hồi JSON hợp lệ (kể cả bọc ```json)', async () => {
      config.gemini_api_key = 'fake-test-key';
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '```json\n{"isSafe":false,"riskLevel":"MEDIUM","action":"FLAG_FOR_REVIEW","confidence":0.87,"detectedCategories":["SPAM"],"violationReasonVi":"Quảng cáo trá hình"}\n```',
                  },
                ],
              },
            },
          ],
        }),
      }) as typeof fetch;

      const res = await service.evaluateContent(
        'Bài viết bàn về triều Nguyễn nhưng chèn đường dẫn bán hàng lạ.',
      );
      expect(res.engine).toBe('GEMINI_FLASH');
      expect(res.action).toBe('FLAG_FOR_REVIEW');
      expect(res.detectedCategories).toEqual(['SPAM']);
    });

    it('giữ nguyên AUTO_HIDE của Heuristic Sentinel nếu Gemini đánh giá nhẹ hơn', async () => {
      config.gemini_api_key = 'fake-test-key';
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '{"isSafe":true,"riskLevel":"SAFE","action":"ALLOW","confidence":0.95,"detectedCategories":["NONE"]}',
                  },
                ],
              },
            },
          ],
        }),
      }) as typeof fetch;

      const res = await service.evaluateContent(
        'Luận điệu xuyên tạc rằng Hoàng Sa không phải của Việt Nam.',
      );
      expect(res.engine).toBe('HYBRID_SENTINEL');
      expect(res.action).toBe('AUTO_HIDE');
    });

    it('fallback an toàn về HYBRID_SENTINEL khi Gemini API lỗi HTTP hoặc lỗi mạng', async () => {
      config.gemini_api_key = 'fake-test-key';
      global.fetch = jest.fn().mockResolvedValue({ ok: false }) as typeof fetch;

      const resHttpFail = await service.evaluateContent('Lịch sử thời Lý.');
      expect(resHttpFail.engine).toBe('HYBRID_SENTINEL');
      expect(resHttpFail.action).toBe('ALLOW');

      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error('network timeout')) as typeof fetch;
      const resNetFail = await service.evaluateContent('Lịch sử thời Trần.');
      expect(resNetFail.engine).toBe('HYBRID_SENTINEL');
    });
  });
});
