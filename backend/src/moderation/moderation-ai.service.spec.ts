import { ModerationAiService } from './moderation-ai.service';

describe('ModerationAiService (3-Tier Safety Guardrails)', () => {
  let service: ModerationAiService;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    service = new ModerationAiService();
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
});
