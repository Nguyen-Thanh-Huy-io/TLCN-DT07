# Danh sách cô lập 4 tính năng AI (HISGO)

Tài liệu này liệt kê toàn bộ các tệp thuộc **4 tính năng AI** và **hạ tầng AI dùng chung** để team có thể đóng băng / cô lập phạm vi, tránh chỉnh sửa nhầm trong quá trình phát triển các phân hệ khác.

> **Quy ước phân nhóm trong tài liệu:**
> - **Nhóm A — Tệp lõi AI thuần túy (Lock cứng):** Chứa toàn bộ logic AI/LLM/RAG. Không cần đụng vào khi làm các feature thường.
> - **Nhóm B — Điểm nối ở module dùng chung (Cảnh báo trước khi sửa):** Là các file module thường có import/nút mở AI hoặc schema/cấu hình dùng chung — nếu buộc phải sửa logic thường trong các file này, giữ nguyên các đoạn nối sang AI.

---

## 0. Hạ tầng AI dùng chung (Google Cloud Vertex AI / Gemini / RAG Config)

### Nhóm A — Tệp lõi AI thuần túy
- `backend/src/common/modules/google-ai.module.ts` (`@Global()` module cấp `GoogleAiService`)
- `backend/src/common/services/google-ai.service.ts` (client gọi Vertex AI / Gemini API / Vertex AI RAG Engine)
- `backend/src/common/services/google-ai.helper.ts` (OAuth2 JWT signing, URL builder, JSON parser)
- `backend/src/common/services/google-ai.types.ts` (types cho Vertex AI, Gemini, RAG grounding)
- `backend/src/common/services/google-ai.service.spec.ts` (unit tests `GoogleAiService`)

### Nhóm B — Điểm nối cấu hình dùng chung
- `backend/src/common/modules/index.ts` (re-export `google-ai.module`)
- `backend/src/common/config/app.config.ts` (các biến `google_cloud_*`, `gemini_*`)
- `backend/src/app.module.ts` (import `GoogleAiModule`, `AiAssistantModule`, `ModerationModule`)
- `backend/.env.example` (mẫu biến `GOOGLE_CLOUD_*`, `GEMINI_*`)

### Tệp nhạy cảm / Tài liệu liên quan
- `convo-f768e-5319231e1f90.json` *(Service Account JSON ở root đang untracked — **TUYỆT ĐỐI KHÔNG commit lên Git**)*
- `docs/AI_CHATBOX_PLAN.md`

---

## 1. Feature AI #1 — AI Chatbox / Trợ lý Lịch sử & Vertex RAG Engine

### Nhóm A — Tệp lõi AI thuần túy (100% thuộc tính năng AI)
**Backend Module (`backend/src/ai-assistant/`):**
- `backend/src/ai-assistant/ai-assistant.module.ts`
- `backend/src/ai-assistant/ai-assistant.controller.ts`
- `backend/src/ai-assistant/ai-assistant.service.ts`
- `backend/src/ai-assistant/ai-assistant.search.ts`
- `backend/src/ai-assistant/ai-assistant.rag.ts`
- `backend/src/ai-assistant/ai-assistant.guide.ts`
- `backend/src/ai-assistant/ai-assistant.constant.ts`
- `backend/src/ai-assistant/ai-assistant.types.ts`
- `backend/src/ai-assistant/dto/ai-assistant.dto.ts`
- `backend/src/ai-assistant/ai-assistant.controller.spec.ts`
- `backend/src/ai-assistant/ai-assistant.service.spec.ts`

**Pipeline dữ liệu RAG (`backend/prisma/rag/` & `backend/rag-sources/`):**
- `backend/prisma/rag/rag-export.ts`
- `backend/prisma/rag/rag-export.formatter.ts`
- `backend/prisma/rag/rag-export.formatter.spec.ts`
- `backend/prisma/rag/rag-export.types.ts`
- `backend/prisma/rag/rag-markdown.util.ts`
- `backend/prisma/rag/rag-wiki.ts`
- `backend/prisma/rag/rag-wiki.util.ts`
- `backend/prisma/rag/rag-wiki.util.spec.ts`
- `backend/prisma/rag/rag-cloud.ts`
- `backend/rag-sources/external-sources.json`
- `backend/rag-sources/files/.gitkeep`
- *(Thư mục dữ liệu sinh local đã gitignore: `backend/rag-export/`, `backend/rag-wiki/`, `backend/rag-sources/files/*`)*

**Frontend Feature (`frontend/src/features/ai-assistant/`):**
- `frontend/src/features/ai-assistant/components/HisgoAiChatWidget.tsx`
- `frontend/src/features/ai-assistant/components/HisgoAiChatWidgetParts.tsx`
- `frontend/src/features/ai-assistant/constants/ai-assistant.constants.ts`
- `frontend/src/features/ai-assistant/services/ai-assistant.service.ts`

### Nhóm B — Điểm nối ở file dùng chung
- `backend/src/app.module.ts` (đăng ký `AiAssistantModule`)
- `backend/package.json` (các script `rag:export`, `rag:wiki`, `rag:setup`, `rag:sync`, `rag:status`)
- `backend/.gitignore` (rule bỏ qua `/rag-export/`, `/rag-wiki/`, `/rag-sources/files/*`)
- `frontend/src/components/layout/ClientLayout.tsx` (mount `<HisgoAiChatWidget />`)

---

## 2. Feature AI #2 — Flashcard AI Generator (Sinh bộ thẻ bằng AI)

### Nhóm A — Tệp lõi AI thuần túy
- `backend/src/flashcard/flashcard-ai.service.ts`
- `backend/src/flashcard/flashcard-ai.helper.ts`
- `backend/src/flashcard/flashcard-ai.service.spec.ts`
- `frontend/src/features/flashcards/components/AiFlashcardGeneratorModal.tsx`

### Nhóm B — Điểm nối trong module Flashcard (SM-2 dùng chung)
- `backend/src/flashcard/flashcard.constant.ts` (`AiGeneratorEngine`, `FLASHCARD_ROUTES.GENERATE_PREVIEW`, `FLASHCARD_AI_SYSTEM_PROMPT`, `FLASHCARD_TOPIC_ANGLES`, các limit `AI_*`)
- `backend/src/flashcard/dto/flashcard.dto.ts` (`GenerateFlashcardsDto`, `CreateDeckBatchDto`)
- `backend/src/flashcard/flashcard.module.ts` (cung cấp `FlashcardAiService`)
- `backend/src/flashcard/flashcard.controller.ts` (endpoint `POST generate-preview`, `POST decks/batch`)
- `backend/src/flashcard/flashcard.controller.spec.ts` (test gọi `FlashcardAiService.generatePreview`)
- `backend/src/flashcard/flashcard.service.ts` (`createDeckBatch` lưu loạt thẻ từ AI)
- `frontend/src/features/flashcards/constants/flashcard.constants.ts` (`AiGeneratorEngine`, `GENERATE_PREVIEW`, `AI_CARD_COUNT_OPTIONS`, `AI_SUGGESTED_TOPICS`)
- `frontend/src/features/flashcards/services/flashcard.service.ts` (`generatePreview`, `createDeckBatch`, `GeneratedCardDraft`, `GeneratedFlashcardPreview`)
- `frontend/src/features/flashcards/components/FlashcardsSection.tsx` (nút mở và render `<AiFlashcardGeneratorModal />`)
- `frontend/src/features/flashcards/components/FlashcardDeckDetail.tsx` & `frontend/src/features/flashcards/components/FlashcardStudySession.tsx` *(UI Flashcard SM-2 chung, có tinh chỉnh hiển thị cho đáp án dài sinh bởi AI)*

---

## 3. Feature AI #3 — Mindmap AI Generator (Sinh sơ đồ tư duy bằng AI)

### Nhóm A — Tệp lõi AI thuần túy
- `backend/src/mindmap/mindmap-ai.service.ts`
- `backend/src/mindmap/mindmap-ai.service.spec.ts`
- `frontend/src/features/mindmap/components/AiMindmapPromptModal.tsx`

### Nhóm B — Điểm nối trong module Mindmap (Canvas dùng chung)
- `backend/src/mindmap/mindmap.constant.ts` (`GENERATE_PREVIEW`, `MindmapAiEngine`, `MAX_AI_*`, `AI_TIMEOUT_MS`, `NO_AI_SOURCES`)
- `backend/src/mindmap/dto/mindmap.dto.ts` (`GenerateMindmapDto`)
- `backend/src/mindmap/mindmap.module.ts` (cung cấp `MindmapAiService`)
- `backend/src/mindmap/mindmap.controller.ts` (endpoint `POST generate-preview`)
- `backend/src/mindmap/mindmap.controller.spec.ts` (test gọi `MindmapAiService.generatePreview`)
- `frontend/src/features/mindmap/constants/mindmap.constants.ts` (`GENERATE_PREVIEW`, `MindmapAiEngine`, `AI_MINDMAP_PROMPT_EXAMPLES`)
- `frontend/src/features/mindmap/services/mindmap.service.ts` (`generatePreview`, `GeneratedMindmapPreview`)
- `frontend/src/features/mindmap/components/MindmapCanvas.tsx` (mount `<AiMindmapPromptModal />`)
- `frontend/src/features/mindmap/components/MindmapsSection.tsx` (nhắc hộp thoại AI ở màn hình rỗng)

---

## 4. Feature AI #4 — Moderation AI Sentinel (Kiểm duyệt vi phạm tự động bằng AI)

### Nhóm A — Tệp lõi AI & Worker quét ngầm
- `backend/src/moderation/moderation-ai.service.ts` (AI Sentinel phân tích nội dung + luật fallback)
- `backend/src/moderation/moderation-ai.service.spec.ts`
- `backend/src/moderation/moderation.processor.ts` (BullMQ worker chạy `scanTarget`)
- `backend/src/moderation/moderation-scan.service.spec.ts`
- `backend/src/moderation/moderation-text.util.ts` (rút trích text đưa vào AI quét)

### Toàn bộ module Moderation & UI Dashboard (dùng chung luồng `AI_SCAN` + `USER_REPORT`)
- `backend/src/moderation/moderation.module.ts`
- `backend/src/moderation/moderation.controller.ts`
- `backend/src/moderation/moderation.service.ts`
- `backend/src/moderation/moderation.service.spec.ts`
- `backend/src/moderation/moderation-report.service.ts`
- `backend/src/moderation/moderation-resolution.service.ts`
- `backend/src/moderation/moderation.constant.ts`
- `backend/src/moderation/dto/moderation.dto.ts`
- `frontend/src/features/moderation/api.ts`
- `frontend/src/features/moderation/components/ModerationDashboardView.tsx`
- `frontend/src/features/moderation/components/ModerationDashboardParts.tsx`
- `frontend/src/features/moderation/components/useModerationDashboard.ts`

### Nhóm B — Điểm nối ở file dùng chung
- `backend/src/app.module.ts` (đăng ký `ModerationModule`)
- `backend/src/blog/blog.module.ts` (import `ModerationModule`)
- `backend/src/blog/blog.service.ts` & `backend/src/blog/blog-comment.service.ts` (gọi `moderationService?.enqueueScan(...)` khi tạo/sửa bài viết & bình luận)
- `backend/src/blog/blog.service.interactions.spec.ts`
- `backend/prisma/schema/blog.prisma` (`ContentReport`) & `backend/prisma/schema/enums.prisma` (`ReportSource.AI_SCAN`, `ReportRiskLevel`, `ReportActionTaken`)
- `frontend/src/features/review/components/ReviewHubView.tsx` (tab `REPORT` nhúng `ModerationDashboardView`)
- `frontend/src/app/moderation/page.tsx` & `frontend/src/app/review/page.tsx`
- `backend/test/learning-tools.e2e-spec.ts` (e2e test các endpoint `/flashcards/*`, `/mindmaps/*`, `/moderation/*`)

---

## Gợi ý cách cô lập nhanh cho cả nhóm & AI Agent

1. **Nếu dùng GitHub (`CODEOWNERS`)**: gán toàn bộ các file **Nhóm A** ở trên cho riêng bạn review bắt buộc trước khi merge.
2. **Nếu muốn AI coding agent (Antigravity / Claude / Cursor) không đụng vào**: thêm 1 dòng quy tắc vào `AGENTS.md`:
   > Không tự ý sửa các tệp liệt kê trong `AI_FEATURES_ISOLATION.md` nếu người dùng không yêu cầu trực tiếp về tính năng AI đó.
3. **Bảo mật khóa GCP**: cân nhắc di chuyển `convo-f768e-5319231e1f90.json` ra ngoài thư mục repo (và trỏ `GOOGLE_APPLICATION_CREDENTIALS` trong `backend/.env` tới đường dẫn ngoài repo) hoặc thêm vào `.gitignore` ở root để tránh lộ key khi push.
