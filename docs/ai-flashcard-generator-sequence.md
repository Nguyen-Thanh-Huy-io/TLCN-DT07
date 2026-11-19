# Sequence Diagram: Tạo bộ Flashcards tự động bằng AI từ Ghi chú & Bài viết đã lưu

Tài liệu mô tả luồng **AI Flashcard Generator** (không sửa đổi schema DB):
1. Người học mở hộp thoại **Tạo bộ thẻ bằng AI** từ tab `Thẻ ghi nhớ` (`/tai-khoan`).
2. Frontend gửi danh sách `articleIds` (từ `localStorage` `hisgo:saved-articles`) + tuỳ chọn `includeNotes` lên `POST /flashcards/generate-preview`.
3. Backend tổng hợp nội dung từ `notes` và `articles` trong DB, gọi **Gemini Flash** (qua `GEMINI_API_KEY`) để sinh bộ câu hỏi/đáp án JSON; nếu chưa cấu hình API key hoặc lỗi mạng thì tự chuyển sang **HeuristicFlashcardGenerator** (Strategy Pattern).
4. Người học xem trước, chỉnh sửa/bỏ chọn từng thẻ rồi bấm **Lưu bộ thẻ** (`POST /flashcards/decks/batch`) trong 1 transaction.

```mermaid
sequenceDiagram
    autonumber
    actor User as Người học
    participant UI as AiFlashcardGeneratorModal
    participant API as FlashcardController
    participant AI as FlashcardAiService
    participant Gemini as GeminiFlashcardGenerator
    participant Fallback as HeuristicFlashcardGenerator
    participant DB as PostgreSQL

    User->>UI: Bấm "Tạo bộ thẻ bằng AI" & chọn nguồn (Ghi chú / Bài đã lưu)
    UI->>API: POST /flashcards/generate-preview { articleIds, includeNotes, maxCards }
    API->>AI: generatePreview(userId, dto)
    AI->>DB: Truy vấn notes của user & articles theo articleIds
    DB-->>AI: Dữ liệu nguồn (notes + articles)

    alt Có GEMINI_API_KEY
        AI->>Gemini: generate(sources, maxCards)
        Gemini-->>AI: { deckTitle, cards[] } (hoặc null nếu lỗi)
    end
    opt Gemini không khả dụng / trả null
        AI->>Fallback: generate(sources, maxCards)
        Fallback-->>AI: { deckTitle, cards[] }
    end

    AI-->>UI: { deckTitle, cards[], engine }
    User->>UI: Xem trước, sửa/bỏ chọn thẻ & bấm "Lưu bộ thẻ"
    UI->>API: POST /flashcards/decks/batch { title, cards }
    API->>DB: Transaction tạo FlashcardDeck + createMany Flashcards
    DB-->>UI: Bộ thẻ mới kèm số thẻ
```
