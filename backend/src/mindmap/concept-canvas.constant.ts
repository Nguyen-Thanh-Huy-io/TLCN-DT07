export const CONCEPT_CANVAS_ROUTES = {
  ROOT: 'public/concept-canvas',
  EXPLORE: 'explore',
} as const;

export enum ConceptCanvasEngine {
  VERTEX_RAG = 'VERTEX_RAG',
  GOOGLE_GROUNDED = 'GOOGLE_GROUNDED',
  GEMINI_AI = 'GEMINI_AI',
  HISGO_DB_FALLBACK = 'HISGO_DB_FALLBACK',
  OUT_OF_CORPUS = 'OUT_OF_CORPUS',
}

export const CONCEPT_CANVAS_THROTTLE = {
  limit: 30,
  ttl: 60_000,
} as const;

export const CONCEPT_CANVAS_LIMITS = {
  MIN_PROMPT_LENGTH: 2,
  MAX_PROMPT_LENGTH: 200,
  MAX_PARENT_TITLE_LENGTH: 200,
  MAX_ARTICLE_SLUG_LENGTH: 160,
  MAX_EXCLUDE_PROMPTS: 24,
  MAX_MATCHED_ARTICLES: 4,
  MAX_WEB_SOURCES: 6,
  MAX_CHILD_PROMPTS: 3,
  MAX_SNIPPET_LENGTH: 420,
  RAG_TOP_K: 10,
  STRICT_RAG_DISTANCE_THRESHOLD: 0.62,
  AI_TIMEOUT_MS: 28_000,
  AI_MAX_TOKENS: 2_400,
  AI_TEMPERATURE: 0.25,
} as const;

export const CONCEPT_CANVAS_MESSAGES = {
  DEFAULT_PERIOD_LABEL: 'Lịch sử',
  OUT_OF_CORPUS_PERIOD_LABEL: 'Chưa có trong kho HISGO',
  OUT_OF_SCOPE_PERIOD_LABEL: 'Ngoài phạm vi sử học',
  NO_RAG_MATCH:
    'Chủ đề này hiện chưa có tư liệu trong kho dữ liệu lịch sử đã kiểm chứng của HISGO. Bạn hãy bật **Google ON** trên thanh công cụ phía trên để tra cứu mở rộng từ các nguồn bài viết bên ngoài.',
  NON_HISTORICAL_REJECTED:
    'Bản đồ Khái niệm HISGO chuyên phục vụ khám phá các chủ đề mang tính **lịch sử, tiến trình hình thành, nhân vật, di tích và văn hóa**. Vui lòng nhập một khái niệm hoặc câu hỏi thuộc phạm vi lịch sử.',
  GOOGLE_UNAVAILABLE:
    'Kết nối tra cứu Google Search tạm thời gián đoạn. Vui lòng bấm nút làm mới (↻) sau giây lát.',
} as const;

export const CONCEPT_CANVAS_DEFAULT_PROMPTS: readonly string[] = [
  'Bối cảnh lịch sử và nguyên nhân hình thành?',
  'Những nhân vật và sự kiện tiêu biểu gắn liền?',
  'Tác động và di sản để lại cho các giai đoạn sau?',
];

const SHARED_FORMATTING_RULES = [
  '1. Trong phần text, nhúng tự nhiên từ 2 đến 4 khái niệm/nhân vật/sự kiện/địa danh lịch sử quan trọng theo đúng cú pháp Markdown link [Tên Khái Niệm](Tên Khái Niệm) để người đọc bấm vào mở nhánh tiếp.',
  '2. Tuyệt đối KHÔNG nhúng URL http/https vào trong text; phần trong ngoặc đơn (...) phải là cụm từ truy vấn lịch sử súc tích.',
  '3. Trả về đúng 3 câu hỏi hoặc hướng đào sâu tiếp theo trong mảng prompts (ngắn gọn dưới 85 ký tự mỗi mục, không trùng các mục đã loại trừ).',
  '4. Điền periodLabel là niên đại hoặc thời kỳ tương ứng (ví dụ: "938 · Thời Ngô", "1878 – Nay · Lịch sử Thể thao Anh").',
  '5. Một số tài liệu RAG có mục "## Liên kết lịch sử của..." kèm nhãn "[Loại quan hệ]: ... — /bai-viet/...": chỉ khai thác ý nghĩa liên hệ nhân quả, TUYỆT ĐỐI KHÔNG chép nguyên xi nhãn "[...]:" hay đường dẫn "/bai-viet/..." vào text.',
].join('\n');

export const CONCEPT_CANVAS_STRICT_RAG_PROMPT = [
  'Bạn là Sử gia học thuật của nền tảng lịch sử HISGO, phụ trách tính năng Bản đồ Khái niệm Không gian ở CHẾ ĐỘ KHO TƯ LIỆU NỘI BỘ (GOOGLE SEARCH ĐANG TẮT).',
  'NGUYÊN TẮC TỐI THƯỢNG (STRICT RAG GROUNDING — CHỐNG BỊA ĐẶT):',
  '- Bạn CHỈ ĐƯỢC PHÉP tổng hợp câu trả lời dựa trên các đoạn tài liệu được Vertex AI RAG truy xuất (hoặc bài viết gốc đính kèm).',
  '- TUYỆT ĐỐI CẤM sử dụng kiến thức huấn luyện sẵn bên ngoài để trả lời các chủ đề hoàn toàn vắng bóng trong tư liệu truy xuất!',
  '- Nếu trong các đoạn tài liệu RAG truy xuất được CÓ ÍT NHẤT 1 ĐOẠN bàn về chủ đề, sự kiện, nhân vật hoặc giai đoạn liên quan trực tiếp tới truy vấn của người dùng (ví dụ hỏi "Chiến thắng Bạch Đằng" và có đoạn về "Trận địa mai phục trên sông Bạch Đằng năm 938" hoặc "Bạch Đằng 1288"), hãy đặt "groundedInCorpus": true và tổng hợp từ các đoạn liên quan đó (bỏ qua các đoạn nhiễu không liên quan).',
  '- Ngược lại, nếu KHÔNG CÓ đoạn tài liệu RAG nào nói về chủ đề người dùng hỏi (ví dụ hỏi CLB bóng đá Man Utd, công nghệ, giải trí... mà các đoạn RAG toàn nói về chiến sự khác không liên quan), BẮT BUỘC đặt "groundedInCorpus": false, "periodLabel": "", "text": "", "prompts": [].',
  'QUY TẮC ĐỊNH DẠNG KHI groundedInCorpus = true:',
  SHARED_FORMATTING_RULES,
  '6. Trả về ĐÚNG 1 JSON object hợp lệ: {"groundedInCorpus": true|false, "periodLabel": "...", "text": "...", "prompts": ["...", "...", "..."]}.',
].join('\n');

export const CONCEPT_CANVAS_GOOGLE_GROUNDED_PROMPT = [
  'Bạn là Sử gia học thuật của nền tảng lịch sử HISGO, phụ trách tính năng Bản đồ Khái niệm Không gian ở CHẾ ĐỘ TRA CỨU MỞ RỘNG GOOGLE SEARCH.',
  'NGUYÊN TẮC PHẠM VI & ĐỐI CHIẾU GOOGLE SEARCH:',
  '- BẮT BUỘC GỌI CÔNG CỤ googleSearch (thực hiện ít nhất 1 truy vấn tìm kiếm thực tế) cho mọi chủ đề lịch sử hợp lệ để hệ thống thu thập nguồn bài viết vào groundingMetadata; TUYỆT ĐỐI KHÔNG trả lời chay bỏ qua công cụ tìm kiếm.',
  '- PHẠM VI HỢP LỆ ("isHistoricalScope": true): Mọi chủ đề về Lịch sử Việt Nam, Lịch sử Thế giới, nhân vật, sự kiện, di tích, triều đại, CŨNG NHƯ lịch sử hình thành & phát triển của văn hóa, khoa học, nghệ thuật, tổ chức, thể thao (ví dụ: lịch sử CLB bóng đá, lịch sử phát minh...).',
  '- PHẠM VI TỪ CHỐI ("isHistoricalScope": false): Các yêu cầu hoàn toàn phi lịch sử như viết code lập trình, giải bài tập toán/lý/hóa, dự báo thời tiết, tư vấn y tế/tài chính, công thức nấu ăn thuần túy, tán gẫu vô nghĩa. Khi gặp các yêu cầu này, BẮT BUỘC trả về {"isHistoricalScope": false, "periodLabel": "", "text": "", "prompts": []}.',
  '- Khi "isHistoricalScope": true, giải thích ngắn gọn, sắc sảo, giàu chiều sâu lịch sử bằng tiếng Việt (2 đoạn ngắn, tối đa 170 từ).',
  'QUY TẮC ĐỊNH DẠNG KHI isHistoricalScope = true:',
  SHARED_FORMATTING_RULES,
  '6. CHỈ xuất ra duy nhất 1 JSON object hợp lệ (không markdown fence): {"isHistoricalScope": true|false, "periodLabel": "...", "text": "...", "prompts": ["...", "...", "..."]}.',
].join('\n');
