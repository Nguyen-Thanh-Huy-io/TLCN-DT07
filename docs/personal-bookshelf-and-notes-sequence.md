# Sequence Diagram: Tủ sách cá nhân & Xem lại Ghi chú đã lưu

Tài liệu mô tả luồng tải và quản lý **Tủ sách cá nhân** (`/tai-khoan`, tab `Tư liệu đã lưu`) gồm:
1. Giải mã ID tư liệu đã lưu trong `localStorage` (`hisgo:saved-articles`, `hisgo.saved`) thành tên, thời kỳ và liên kết thực qua `/public/articles` & `/public/timelines`.
2. Tải toàn bộ ghi chú & đánh dấu đã lưu của người học qua `GET /notes` (không truyền `targetId`), backend gắn kèm thông tin bài viết / bài học gốc (`target: { title, slug }`).

```mermaid
sequenceDiagram
    autonumber
    actor User as Người học
    participant UI as SavedBookmarksSection / SavedNotesPanel
    participant LS as localStorage
    participant Pub as Public API (/public/articles, /public/timelines)
    participant NoteAPI as NoteController (GET /notes)
    participant NoteSvc as NoteService
    participant DB as PostgreSQL (notes, articles, lessons)

    User->>UI: Mở tab "Tư liệu đã lưu" (/tai-khoan)
    par Giải mã tư liệu & dấu mốc đã ghim
        UI->>LS: Đọc hisgo:saved-articles & hisgo.saved
        UI->>Pub: GET /public/articles & GET /public/timelines
        Pub-->>UI: Danh sách bài viết & dòng thời gian
        UI-->>User: Hiển thị tên, trích đoạn, link mở & nút Bỏ ghim
    and Tải toàn bộ ghi chú đã lưu
        UI->>NoteAPI: GET /notes?guestId=...
        NoteAPI->>NoteSvc: findAll(userId, { guestId })
        NoteSvc->>DB: prisma.note.findMany(where: { userId | guestId })
        DB-->>NoteSvc: Note[]
        NoteSvc->>DB: Batch lookup articles & lessons theo targetId
        DB-->>NoteSvc: title, slug
        NoteSvc-->>NoteAPI: Note[] kèm target { title, slug }
        NoteAPI-->>UI: Danh sách ghi chú đã lưu
        UI-->>User: Lọc theo loại / nhãn / từ khoá & link về bài gốc
    end

    User->>UI: Bấm "Xoá ghi chú" hoặc "Bỏ ghim"
    alt Xoá ghi chú
        UI->>NoteAPI: DELETE /notes/:id
        NoteAPI-->>UI: 200 OK -> gỡ khỏi danh sách
    else Bỏ ghim tư liệu
        UI->>LS: Cập nhật hisgo:saved-articles / hisgo.saved
        UI-->>User: Cập nhật số lượng đã ghim
    end
```
