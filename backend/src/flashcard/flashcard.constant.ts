export const FLASHCARD_ROUTES = {
  ROOT: 'flashcards',
  DECKS: 'decks',
  DECKS_BATCH: 'decks/batch',
  GENERATE_PREVIEW: 'generate-preview',
  DECK: 'decks/:deckId',
  DECK_CARDS: 'decks/:deckId/cards',
  DECK_DUE: 'decks/:deckId/due',
  CARD: 'cards/:cardId',
  CARD_REVIEW: 'cards/:cardId/review',
} as const;

export enum FlashcardRating {
  AGAIN = 'AGAIN',
  HARD = 'HARD',
  GOOD = 'GOOD',
  EASY = 'EASY',
}

export enum AiGeneratorEngine {
  GEMINI_FLASH = 'GEMINI_FLASH',
  HEURISTIC = 'HEURISTIC',
}

export const FLASHCARD_LIMITS = {
  MAX_DECK_TITLE_LENGTH: 150,
  MAX_DECK_DESC_LENGTH: 400,
  MAX_CARD_SIDE_LENGTH: 4000,
  MAX_DECKS_PER_USER: 100,
  MAX_CARDS_PER_DECK: 500,
  DUE_BATCH_LIMIT: 50,
  MAX_AI_NOTES: 30,
  MAX_AI_ARTICLES: 10,
  MIN_AI_CARDS: 3,
  MAX_AI_CARDS: 30,
  DEFAULT_AI_CARDS: 10,
  MAX_TOPIC_HINT_LENGTH: 200,
  AI_TIMEOUT_MS: 35000,
  AI_MAX_OUTPUT_TOKENS: 8192,
  AI_TEMPERATURE: 0.4,
  AI_ARTICLE_EXCERPT_CHARS: 2400,
  HEURISTIC_ARTICLE_EXTRACT_CHARS: 4500,
  HEURISTIC_ARTICLE_CARD_CHARS: 900,
  MIN_SENTENCE_CHARS: 40,
  TARGET_HEURISTIC_CARD_CHARS: 260,
  MAX_ARTICLE_PARAGRAPHS: 12,
} as const;

export const SM2_DEFAULTS = {
  INITIAL_EASE_FACTOR: 2.5,
  MIN_EASE_FACTOR: 1.3,
  AGAIN_RETRY_MINUTES: 10,
} as const;

export const FLASHCARD_MESSAGES = {
  DECK_NOT_FOUND: 'Không tìm thấy bộ thẻ ghi nhớ này.',
  CARD_NOT_FOUND: 'Không tìm thấy thẻ ghi nhớ này.',
  TOO_MANY_DECKS: 'Bạn đã đạt giới hạn số bộ thẻ tối đa.',
  TOO_MANY_CARDS: 'Bộ thẻ này đã đạt giới hạn số thẻ tối đa.',
  NO_AI_SOURCES:
    'Chưa có chủ đề hoặc dữ liệu nguồn (ghi chú, bài đã lưu, câu làm sai) để tạo thẻ.',
} as const;

export const FLASHCARD_AI_SYSTEM_PROMPT = `Bạn là trợ lý học tập Lịch sử Việt Nam học thuật của nền tảng HISGO.
Nhiệm vụ: biên soạn bộ thẻ ghi nhớ (Flashcards) chuyên sâu, chuẩn xác theo Sách giáo khoa Lịch sử Việt Nam (Chương trình GDPT 2018) và chính sử Việt Nam.

Nguyên tắc biên soạn bắt buộc:
1. Nếu có CHỦ ĐỀ (topicHint) và/hoặc tư liệu hệ thống, hãy kết hợp chặt chẽ tri thức sử học chuẩn xác với GHI CHÚ / BÀI VIẾT / CÂU LÀM SAI của người học (nếu có) để phủ đầy đủ các khía cạnh: niên đại, nhân vật, bối cảnh, nguyên nhân, diễn biến chính, kết quả và ý nghĩa lịch sử.
2. Nếu ghi chú của người học còn sơ sài hoặc viết tắt, tự động diễn giải và bổ sung bối cảnh sử học chuẩn xác để câu trả lời đầy đủ, tự trọn nghĩa khi ôn tập.
3. BẮT BUỘC tạo ĐÚNG số lượng thẻ được yêu cầu. Khi tư liệu ít, hãy mở rộng sang nhiều góc độ khác nhau của chủ đề (nguyên nhân sâu xa/trực tiếp, mốc thời gian, nhân vật chủ chốt, địa bàn, diễn biến từng bước, bước ngoặt, kết quả, ý nghĩa lịch sử, bài học kinh nghiệm, văn kiện/so sánh) — không lặp lại câu hỏi.
4. Mặt trước (front): câu hỏi tự luận ngắn gọn, rõ ràng, hỏi đúng một khía cạnh hoặc mốc/nhân vật/khái niệm trọng tâm để kích thích nhớ lại chủ động (Active Recall).
5. Mặt sau (back) — YÊU CẦU TRẢ LỜI ĐẦY ĐỦ, CHI TIẾT (tuyệt đối KHÔNG viết cụt ngủn 1 câu):
   - Trình bày 3–5 câu văn mạch lạc (hoặc 3–4 gạch đầu dòng "• ..." rõ ý, khoảng 60–150 từ), đảm bảo người học chỉ cần đọc mặt sau là nắm trọn bản chất mà không phải tra cứu lại.
   - Nêu đầy đủ các lớp thông tin phù hợp với câu hỏi: (a) Đáp án trực diện kèm mốc thời gian, địa danh, nhân vật chính xác; (b) Bối cảnh / nguyên nhân hoặc diễn biến cốt lõi; (c) Kết quả cụ thể và ý nghĩa lịch sử / tác động lâu dài.

Trả về đúng JSON thuần túy (không bọc markdown):
{
  "deckTitle": "Tên bộ thẻ ngắn gọn bằng tiếng Việt (tối đa 60 ký tự)",
  "cards": [
    { "front": "...", "back": "..." }
  ]
}`;

export const FLASHCARD_TOPIC_ANGLES: ReadonlyArray<{
  front: string;
  back: string;
}> = [
  {
    front: 'Bối cảnh lịch sử dẫn đến "{t}" là gì?',
    back: '• Chính trị & triều chính trong nước trước khi "{t}" bùng nổ.\n• Tình hình kinh tế, đời sống xã hội và mâu thuẫn chủ yếu.\n• Tác động từ bối cảnh khu vực / ngoại xâm đối với "{t}".',
  },
  {
    front: 'Nguyên nhân sâu xa và nguyên nhân trực tiếp của "{t}"?',
    back: '• Nguyên nhân sâu xa: mâu thuẫn cơ bản kéo dài về chính trị, kinh tế hoặc độc lập dân tộc.\n• Nguyên nhân trực tiếp (duyên cớ): sự kiện châm ngòi bùng phát "{t}".\n• Sự chuẩn bị lực lượng và thời cơ lịch sử.',
  },
  {
    front: '"{t}" diễn ra trong khoảng thời gian và các mốc nào?',
    back: '• Mốc khởi phát (ngày/năm) và địa điểm mở đầu của "{t}".\n• Các cột mốc chuyển biến then chốt theo từng giai đoạn.\n• Mốc kết thúc chính thức và hệ quả ngay sau đó.',
  },
  {
    front: 'Nhân vật lãnh đạo tiêu biểu của "{t}" là ai và vai trò ra sao?',
    back: '• Người đứng đầu chỉ huy và các tướng lĩnh / sĩ phu đồng hành trong "{t}".\n• Quyết sách chiến lược, đường lối hoặc cải cách tiêu biểu đã đề ra.\n• Dấu ấn cá nhân quyết định cục diện "{t}".',
  },
  {
    front: 'Lực lượng tham gia và khối đại đoàn kết trong "{t}"?',
    back: '• Thành phần nòng cốt (quân đội chính quy, nghĩa quân, sĩ phu, nông dân...).\n• Sự ủng hộ và đóng góp hậu cần, nhân lực từ quần chúng nhân dân.\n• Cách tổ chức, tập hợp lực lượng để tạo ưu thế trong "{t}".',
  },
  {
    front: 'Địa bàn, căn cứ và chiến trường gắn với "{t}"?',
    back: '• Căn cứ địa ban đầu và lý do chọn địa bàn đó trong "{t}".\n• Các địa danh diễn ra trận đánh / sự kiện quyết định.\n• Ý nghĩa địa chiến lược của địa hình trong diễn biến "{t}".',
  },
  {
    front: 'Giai đoạn mở đầu của "{t}" diễn ra như thế nào?',
    back: '• Hoạt động khởi phát và mục tiêu bước đầu của "{t}".\n• Những khó khăn, thử thách lớn về lực lượng hoặc tương quan thế trận.\n• Cách vượt qua khủng hoảng ban đầu để củng cố lực lượng.',
  },
  {
    front: 'Bước ngoặt và sự kiện quyết định trong "{t}" là gì?',
    back: '• Chiến dịch / quyết sách xoay chuyển cục diện từ bị động sang chủ động.\n• Nghệ thuật quân sự hoặc chính trị nổi bật tạo nên bước ngoặt.\n• Tác động trực tiếp làm suy yếu đối phương / mở ra thắng lợi.',
  },
  {
    front: 'Kết quả trực tiếp của "{t}" đạt được những gì?',
    back: '• Kết quả về quân sự / chính trị (giành lại độc lập, lật đổ thế lực đối lập, ký kết hiệp định...).\n• Sự thay đổi về chủ quyền, lãnh thổ hoặc thể chế.\n• Chuyển giao sang giai đoạn lịch sử mới sau "{t}".',
  },
  {
    front: 'Ý nghĩa lịch sử sâu sắc của "{t}" đối với dân tộc?',
    back: '• Ý nghĩa đối với tiến trình dựng nước và giữ nước của dân tộc Việt Nam.\n• Khẳng định truyền thống yêu nước, ý chí tự chủ và bản lĩnh văn hoá.\n• Tầm vóc thời đại hoặc ảnh hưởng tới phong trào khu vực / thế giới.',
  },
  {
    front: 'Nguyên nhân thắng lợi (hoặc hạn chế) của "{t}"?',
    back: '• Nguyên nhân chủ quan: đường lối đúng đắn, tài thao lược lãnh đạo và tinh thần đoàn kết toàn dân.\n• Nguyên nhân khách quan: thời cơ lịch sử, tương quan lực lượng và sai lầm của đối phương.\n• Hạn chế lịch sử còn tồn tại (nếu có) và bối cảnh ràng buộc.',
  },
  {
    front: 'Bài học kinh nghiệm rút ra từ "{t}" là gì?',
    back: '• Bài học về xây dựng khối đại đoàn kết và phát huy sức mạnh toàn dân.\n• Bài học về nghệ thuật nắm bắt thời cơ, giữ vững tự chủ chiến lược.\n• Giá trị vận dụng trong công cuộc xây dựng và bảo vệ Tổ quốc.',
  },
  {
    front: 'Văn kiện, tác phẩm hoặc di sản tiêu biểu gắn với "{t}"?',
    back: '• Tên văn kiện / tác phẩm (chiếu, hịch, tuyên ngôn, hiệp định, sử sách) gắn với "{t}".\n• Tác giả, thời điểm ra đời và tư tưởng cốt lõi được thể hiện.\n• Giá trị pháp lý, chính trị và văn hoá lưu truyền hậu thế.',
  },
  {
    front: 'Điểm tương đồng và khác biệt của "{t}" với sự kiện cùng thời kỳ?',
    back: '• Điểm giống nhau về mục tiêu độc lập, bối cảnh lịch sử hoặc lực lượng.\n• Điểm khác biệt nổi bật về phương thức đấu tranh, quy mô và kết quả.\n• Bước phát triển mới mà "{t}" đóng góp cho lịch sử dân tộc.',
  },
];
