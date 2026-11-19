# Sequence Diagram: Thẻ ghi nhớ Flashcards & Lặp lại ngắt quãng (SM-2)

Tài liệu mô tả luồng **Flashcards SM-2** (chỉ tạo mới 2 bảng độc lập `flashcard_decks` và `flashcards`, không sửa các bảng cũ):
1. Tạo / xem danh sách bộ thẻ (`GET /flashcards/decks`, `POST /flashcards/decks`).
2. Tạo thẻ mới (nhập tay hoặc chuyển từ **Ghi chú & Đánh dấu** ở Tủ sách cá nhân).
3. Phiên ôn tập SM-2: lấy thẻ đến hạn (`GET /flashcards/decks/:deckId/due`), lật thẻ và chấm mức nhớ (`AGAIN | HARD | GOOD | EASY`) qua `POST /flashcards/cards/:id/review`.

```mermaid
sequenceDiagram
    autonumber
    actor User as Người học
    participant UI as FlashcardsSection / SavedNotesPanel
    participant API as FlashcardController (/flashcards)
    participant Svc as FlashcardService
    participant SM2 as Sm2Scheduler (Strategy)
    participant DB as PostgreSQL (flashcard_decks, flashcards)

    User->>UI: Mở tab "Thẻ ghi nhớ" (/tai-khoan)
    UI->>API: GET /flashcards/decks
    API->>Svc: listDecks(ownerId)
    Svc->>DB: đếm tổng thẻ & thẻ đến hạn (next_review_at <= now)
    DB-->>Svc: DeckSummary[]
    Svc-->>UI: Hiển thị danh sách bộ thẻ

    opt Tạo thẻ từ Ghi chú đã lưu
        User->>UI: Bấm "Tạo thẻ ghi nhớ" trên 1 ghi chú
        UI->>API: POST /flashcards/decks/:deckId/cards (front, back, sourceNoteId)
        API->>Svc: createCard(ownerId, deckId, dto)
        Svc->>DB: INSERT flashcards
        DB-->>UI: Thẻ mới (next_review_at = now)
    end

    User->>UI: Bấm "Ôn ngay" trên 1 bộ thẻ
    UI->>API: GET /flashcards/decks/:deckId/due
    API->>Svc: listDueCards(ownerId, deckId)
    Svc->>DB: SELECT flashcards WHERE deck_id = :deckId AND next_review_at <= now
    DB-->>UI: Flashcard[]

    loop Từng thẻ đến hạn
        User->>UI: Lật thẻ & chọn mức nhớ (AGAIN | HARD | GOOD | EASY)
        UI->>API: POST /flashcards/cards/:id/review { rating }
        API->>Svc: reviewCard(ownerId, cardId, rating)
        Svc->>SM2: schedule(cardState, rating, now)
        SM2-->>Svc: { repetitions, intervalDays, easeFactor, nextReviewAt }
        Svc->>DB: UPDATE flashcards SET ...
        DB-->>UI: Flashcard đã cập nhật lịch ôn
    end
```
