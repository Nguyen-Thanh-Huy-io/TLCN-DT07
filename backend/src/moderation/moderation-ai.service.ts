import { Injectable } from '@nestjs/common';

export type ModerationCategory =
  | 'PROFANITY'
  | 'HISTORICAL_REVISIONISM'
  | 'SPAM'
  | 'REGIONAL_DISCRIMINATION'
  | 'NONE';

export type ModerationRiskLevel =
  'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ModerationAction = 'ALLOW' | 'FLAG_FOR_REVIEW' | 'AUTO_HIDE';

export interface ModerationAssessment {
  isSafe: boolean;
  riskLevel: ModerationRiskLevel;
  action: ModerationAction;
  confidence: number;
  detectedCategories: ModerationCategory[];
  violationReasonVi: string;
  matchedExcerpt?: string;
  engine: 'GEMINI_FLASH' | 'HYBRID_SENTINEL';
}

const SYSTEM_PROMPT = `Bạn là "HISGO History Safety & Moderation Sentinel" — Trợ lý AI kiểm duyệt nội dung cộng đồng Lịch sử Việt Nam.

Nhiệm vụ của bạn là thẩm định văn bản bài viết hoặc bình luận và trả về kết quả định dạng JSON thuần túy (không markdown, không giải thích ngoài JSON).

TIÊU CHÍ PHÂN TÍCH:
1. TOXICITY: Chửi bới thô tục, xúc phạm nhân phẩm, lăng mạ người khác, phân biệt vùng miền, kích động bạo lực.
2. HISTORICAL_INTEGRITY: Xuyên tạc lịch sử nghiêm trọng, phủ nhận chủ quyền biển đảo Việt Nam (Hoàng Sa, Trường Sa), bôi nhọ anh hùng dân tộc. (LƯU Ý: Cho phép tranh luận học thuật đa chiều nếu có dẫn chứng lịch sử lịch thiệp).
3. SPAM_SCAM: Quảng cáo cờ bạc, link lừa đảo, phát tán mã độc, ký tự rác vô nghĩa.

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
{
  "isSafe": boolean,
  "riskLevel": "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "action": "ALLOW" | "FLAG_FOR_REVIEW" | "AUTO_HIDE",
  "confidence": number,
  "detectedCategories": ["PROFANITY" | "HISTORICAL_REVISIONISM" | "SPAM" | "REGIONAL_DISCRIMINATION" | "NONE"],
  "violationReasonVi": "Giải thích ngắn gọn 1 câu bằng tiếng Việt lý do vi phạm nếu có"
}`;

interface RulePattern {
  category: Exclude<ModerationCategory, 'NONE'>;
  tier: 'AUTO_HIDE' | 'FLAG_FOR_REVIEW';
  riskLevel: ModerationRiskLevel;
  confidence: number;
  reasonVi: string;
  regex: RegExp;
}

const SENTINEL_RULES: RulePattern[] = [
  // 1. HISTORICAL_INTEGRITY (Tier 3 - Critical)
  {
    category: 'HISTORICAL_REVISIONISM',
    tier: 'AUTO_HIDE',
    riskLevel: 'CRITICAL',
    confidence: 0.97,
    reasonVi:
      'Nội dung xuyên tạc chủ quyền biển đảo Việt Nam (Hoàng Sa, Trường Sa) hoặc phủ nhận lịch sử dân tộc.',
    regex:
      /(?:^|[^\p{L}\p{N}])(hoàng sa\s+(không phải|đâu phải)\s+của\s+việt nam|trường sa\s+(không phải|đâu phải)\s+của\s+việt nam|hoàng sa\s+(không phải|đâu phải|là)\s+của\s+(trung quốc|nước ngoài)|trường sa\s+(không phải|đâu phải|là)\s+của\s+(trung quốc|nước ngoài)|đường lưỡi bò\s+hợp pháp|phủ nhận chủ quyền\s+(hoàng sa|trường sa)|bôi nhọ\s+anh hùng dân tộc)(?=$|[^\p{L}\p{N}])/iu,
  },
  // 2. PROFANITY / TOXICITY (Tier 3 - High/Critical)
  {
    category: 'PROFANITY',
    tier: 'AUTO_HIDE',
    riskLevel: 'HIGH',
    confidence: 0.94,
    reasonVi:
      'Sử dụng ngôn từ thô tục, chửi bới hoặc xúc phạm nghiêm trọng danh dự thành viên trong cộng đồng.',
    regex:
      /(?:^|[^\p{L}\p{N}])(đm|đkm|đcm|vcl|vl|đéo|đĩ|chó đẻ|súc vật|thằng ngu|đồ ngu dốt|óc chó|cút mẹ|mẹ mày|bố láo|vô học)(?=$|[^\p{L}\p{N}])/iu,
  },
  // 3. REGIONAL_DISCRIMINATION (Tier 3 - High)
  {
    category: 'REGIONAL_DISCRIMINATION',
    tier: 'AUTO_HIDE',
    riskLevel: 'HIGH',
    confidence: 0.93,
    reasonVi:
      'Nội dung mang tính kỳ thị, phân biệt vùng miền gây chia rẽ khối đại đoàn kết dân tộc.',
    regex:
      /(?:^|[^\p{L}\p{N}])(bắc kỳ\s+(chó|keo|lừa)|nam kỳ\s+(ngu|lười)|trung kỳ\s+keo kiệt|bọn\s+thanh nghệ tĩnh|phân biệt vùng miền)(?=$|[^\p{L}\p{N}])/iu,
  },
  // 4. SPAM_SCAM (Tier 3 - High)
  {
    category: 'SPAM',
    tier: 'AUTO_HIDE',
    riskLevel: 'HIGH',
    confidence: 0.96,
    reasonVi:
      'Nội dung quảng cáo cờ bạc, cá độ trực tuyến, tín dụng đen hoặc phát tán liên kết lừa đảo.',
    regex:
      /(?:^|[^\p{L}\p{N}])(nhà cái\s+uy tín|cá độ\s+bóng đá|nổ hũ|tài xỉu\s+online|casino\s+trực tuyến|vay tiền\s+nhanh\s+không thế chấp|nhận thưởng\s+100%|link\s+cá cược|kubet|fun88|w88|fb88)(?=$|[^\p{L}\p{N}])/iu,
  },
  // 5. Tier 2 - FLAG_FOR_REVIEW (Warning / Needs Human Review)
  {
    category: 'HISTORICAL_REVISIONISM',
    tier: 'FLAG_FOR_REVIEW',
    riskLevel: 'MEDIUM',
    confidence: 0.72,
    reasonVi:
      'Nội dung có nhận định lịch sử nhạy cảm hoặc thiếu dẫn chứng sử liệu chuẩn xác, cần Ban biên tập đối chiếu.',
    regex:
      /(?:^|[^\p{L}\p{N}])(lịch sử\s+bịa đặt|sách giáo khoa\s+nói dối|ngụy tạo\s+sử liệu|giả thuyết\s+chưa kiểm chứng|xét lại\s+lịch sử)(?=$|[^\p{L}\p{N}])/iu,
  },
  {
    category: 'PROFANITY',
    tier: 'FLAG_FOR_REVIEW',
    riskLevel: 'LOW',
    confidence: 0.65,
    reasonVi:
      'Ngôn từ tranh luận có dấu hiệu căng thẳng hoặc công kích cá nhân nhẹ, cần kiểm duyệt viên theo dõi.',
    regex:
      /(?:^|[^\p{L}\p{N}])(kém hiểu biết|dốt sử|mù lịch sử|ngụy biện rẻ tiền|thiếu não)(?=$|[^\p{L}\p{N}])/iu,
  },
];

@Injectable()
export class ModerationAiService {
  /**
   * Thẩm định nội dung bằng kết hợp Gemini Flash LLM (nếu có GEMINI_API_KEY)
   * và bộ quy tắc Sentinel tiếng Việt.
   */
  async evaluateContent(rawText: string): Promise<ModerationAssessment> {
    const cleanText = (rawText || '').replace(/\s+/g, ' ').trim();
    if (!cleanText) {
      return {
        isSafe: true,
        riskLevel: 'SAFE',
        action: 'ALLOW',
        confidence: 0.99,
        detectedCategories: ['NONE'],
        violationReasonVi: '',
        engine: 'HYBRID_SENTINEL',
      };
    }

    // 1. Quét nhanh bằng Deterministic Sentinel trước để bắt tức thì các vi phạm rõ ràng
    const heuristicResult = this.evaluateWithHeuristics(cleanText);

    // 2. Nếu có cấu hình GEMINI_API_KEY, gọi Gemini Flash để phân tích ngữ cảnh sâu
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (apiKey) {
      try {
        const geminiResult = await this.callGeminiFlash(cleanText, apiKey);
        if (geminiResult) {
          // Nếu Heuristic đã phát hiện vi phạm nghiêm trọng (AUTO_HIDE), ưu tiên mức an toàn cao nhất
          if (
            heuristicResult.action === 'AUTO_HIDE' &&
            geminiResult.action !== 'AUTO_HIDE'
          ) {
            return heuristicResult;
          }
          return {
            ...geminiResult,
            matchedExcerpt:
              geminiResult.matchedExcerpt ||
              heuristicResult.matchedExcerpt ||
              cleanText.slice(0, 220),
          };
        }
      } catch {
        // Fallback an toàn về Heuristic Sentinel khi mạng hoặc API quota gián đoạn
      }
    }

    return heuristicResult;
  }

  private evaluateWithHeuristics(text: string): ModerationAssessment {
    const matchedRules: Array<{ rule: RulePattern; snippet: string }> = [];

    for (const rule of SENTINEL_RULES) {
      const match = rule.regex.exec(text);
      if (match) {
        const idx = match.index;
        const start = Math.max(0, idx - 45);
        const end = Math.min(text.length, idx + match[0].length + 65);
        const snippet = text.slice(start, end).trim();
        matchedRules.push({ rule, snippet });
      }
    }

    if (matchedRules.length === 0) {
      return {
        isSafe: true,
        riskLevel: 'SAFE',
        action: 'ALLOW',
        confidence: 0.98,
        detectedCategories: ['NONE'],
        violationReasonVi: '',
        engine: 'HYBRID_SENTINEL',
      };
    }

    const hasAutoHide = matchedRules.some((m) => m.rule.tier === 'AUTO_HIDE');
    const primary =
      matchedRules.find((m) => m.rule.riskLevel === 'CRITICAL') ??
      matchedRules.find((m) => m.rule.tier === 'AUTO_HIDE') ??
      matchedRules[0];

    const categories = Array.from(
      new Set(matchedRules.map((m) => m.rule.category)),
    );

    return {
      isSafe: false,
      riskLevel: primary.rule.riskLevel,
      action: hasAutoHide ? 'AUTO_HIDE' : 'FLAG_FOR_REVIEW',
      confidence: primary.rule.confidence,
      detectedCategories: categories,
      violationReasonVi: primary.rule.reasonVi,
      matchedExcerpt: primary.snippet,
      engine: 'HYBRID_SENTINEL',
    };
  }

  private async callGeminiFlash(
    text: string,
    apiKey: string,
  ): Promise<ModerationAssessment | null> {
    const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Hãy thẩm định nội dung sau:\n"""\n${text.slice(0, 6000)}\n"""`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data: any = await response.json();
      const rawOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawOutput || typeof rawOutput !== 'string') {
        return null;
      }

      const cleanedJson = rawOutput
        .replace(/^```json\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      const parsed = JSON.parse(cleanedJson);

      const riskLevel: ModerationRiskLevel = [
        'SAFE',
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL',
      ].includes(parsed.riskLevel)
        ? parsed.riskLevel
        : 'SAFE';

      const action: ModerationAction = [
        'ALLOW',
        'FLAG_FOR_REVIEW',
        'AUTO_HIDE',
      ].includes(parsed.action)
        ? parsed.action
        : riskLevel === 'HIGH' || riskLevel === 'CRITICAL'
          ? 'AUTO_HIDE'
          : riskLevel === 'MEDIUM' || riskLevel === 'LOW'
            ? 'FLAG_FOR_REVIEW'
            : 'ALLOW';

      const validCats: ModerationCategory[] = Array.isArray(
        parsed.detectedCategories,
      )
        ? parsed.detectedCategories.filter((c: string) =>
            [
              'PROFANITY',
              'HISTORICAL_REVISIONISM',
              'SPAM',
              'REGIONAL_DISCRIMINATION',
              'NONE',
            ].includes(c),
          )
        : ['NONE'];

      return {
        isSafe: Boolean(parsed.isSafe ?? action === 'ALLOW'),
        riskLevel,
        action,
        confidence:
          typeof parsed.confidence === 'number'
            ? Math.max(0, Math.min(1, parsed.confidence))
            : 0.9,
        detectedCategories: validCats.length > 0 ? validCats : ['NONE'],
        violationReasonVi:
          typeof parsed.violationReasonVi === 'string'
            ? parsed.violationReasonVi.trim()
            : '',
        matchedExcerpt: text.slice(0, 220),
        engine: 'GEMINI_FLASH',
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
