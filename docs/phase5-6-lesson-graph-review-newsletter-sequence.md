# Sequence Diagram — Phase 5 & 6: Liên kết Bài học ↔ Kho Tri thức (Lesson Knowledge Graph), Kiểm duyệt bài học (`/review`) & Đăng ký nhận tin (`NewsletterSubscriber`)

## 1. Bối cảnh & Mục tiêu
Đây là chặng hoàn thiện cuối cùng trong lộ trình kết nối toàn diện giữa **Landing Page + CMS** và **Cơ sở dữ liệu**:
1. **Liên kết Bài học (`Lesson`) với Kho Tri thức dùng chung (`LessonEvent`, `LessonEntity`, `LessonLocation`)**:
   - Cho phép khi Tạo mới (`POST /lessons`) hoặc Cập nhật (`PATCH /lessons/:id`) một Bài học trong bất kỳ Chuyên đề nào, tác giả có thể đính kèm danh sách `eventIds`, `entityIds`, `locationIds` từ Kho dữ liệu lịch sử dùng chung.
   - Khi xem chi tiết hoặc lấy danh sách bài học (`GET /lessons`, `GET /lessons/:id`), API trả về đầy đủ các Sự kiện, Nhân vật/Hiện vật và Địa danh liên kết với bài học đó.
2. **Kiểm duyệt Bài học (`CMS /review` — `ReviewList.tsx`)**:
   - Hiện tại `ReviewList.tsx` chưa dùng `parsePaginatedResponse` nên không đọc được `res.data.data.items` từ `GET /lessons` mà rơi về `DEFAULT_REVIEW_LESSONS`.
   - Cần cập nhật `ReviewList.tsx` dùng `parsePaginatedResponse` và bổ sung 1 bài học ở trạng thái `PENDING_REVIEW` trong `seed.ts` để luồng kiểm duyệt (`Chờ duyệt` -> `Đã duyệt` / `Bị từ chối`) hoạt động với dữ liệu thực.
3. **Đăng ký Bản tin Lịch sử (`NewsletterSubscriber` — Section `#dang-ky` trên Landing Page)**:
   - Hiện tại `/api/subscribe` trên Next.js chỉ lưu vào `Set` trong RAM (`subscribedEmails`), mất sạch khi khởi động lại server.
   - Cần bổ sung bảng `NewsletterSubscriber` (`newsletter_subscribers`) trong Prisma và endpoint `POST /public/newsletter/subscribe` ở Backend để lưu trữ bền vững vào PostgreSQL, chống trùng lặp (idempotent) và kết nối trực tiếp với route `/api/subscribe`.

## 2. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Reader as Độc giả (Landing Page #dang-ky)
    actor Mod as Kiểm duyệt viên (CMS /review)
    participant FE as Next.js (/api/subscribe & ReviewList)
    participant PublicCtrl as PublicContentController (/public/newsletter/subscribe)
    participant LessonCtrl as LessonController (/lessons)
    participant LessonSvc as LessonService
    participant DB as PostgreSQL (Prisma)

    rect rgb(245, 248, 255)
    Note over Reader,DB: Luồng 1: Đăng ký nhận bản tin lịch sử (Newsletter)
    Reader->>FE: Nhập email & bấm "Đăng ký" tại #dang-ky
    FE->>PublicCtrl: POST /public/newsletter/subscribe { email }
    PublicCtrl->>DB: prisma.newsletterSubscriber.upsert(email)
    DB-->>PublicCtrl: NewsletterSubscriber (isNew / existing)
    PublicCtrl-->>FE: 201 Created { subscribed: true, message }
    FE-->>Reader: Hiển thị thông báo xác nhận từ DB
    end

    rect rgb(255, 248, 240)
    Note over Mod,DB: Luồng 2: Kiểm duyệt Bài học & Liên kết Tri thức (CMS /review)
    Mod->>FE: Mở trang /review (Tab "Chờ duyệt" / "Đã duyệt")
    FE->>LessonCtrl: GET /lessons?page=1&limit=100
    LessonCtrl->>LessonSvc: findAll(query)
    LessonSvc->>DB: findMany(include: { topic, creator, lessonEvents, lessonEntities, lessonLocations })
    DB-->>LessonSvc: Danh sách bài học thực tế từ DB
    LessonSvc-->>FE: 200 OK { data: { items, total } }
    FE-->>Mod: Hiển thị danh sách bài học Chờ duyệt & Đã duyệt thực tế
    Mod->>LessonCtrl: PATCH /lessons/:id/review { status: PUBLISHED }
    LessonCtrl->>LessonSvc: review(id, dto, adminId)
    LessonSvc->>DB: prisma.lesson.update({ status: PUBLISHED, approvedBy, publishedAt })
    DB-->>LessonSvc: Lesson đã xuất bản
    LessonSvc-->>FE: 200 OK
    end
```
