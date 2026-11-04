# Phase 1 — Public Content API cho Landing Page

## 1. Mục tiêu
Landing page (Timeline, Khám phá theo giai đoạn, Chặng sử đáng nhớ, Kiến thức lịch sử) lấy dữ liệu từ DB thay cho `frontend/src/data/*.ts`.
Endpoint public **không cần đăng nhập**, chỉ trả nội dung `status = PUBLISHED`.

## 2. Thay đổi schema

| Model | Cột mới | Ghi chú |
|---|---|---|
| `Period` | `slug` (unique), `timeLabel?` | `timeLabel` VD: "(thế kỷ VII TCN - thế kỷ II TCN)"; nếu rỗng thì tự sinh từ `startYear/endYear` |
| `Topic` | `slug` (unique), `eyebrow?`, `icon?`, `isFeatured` (default false) | `icon` lưu tên enum `TopicIcon` (Landmark, Castle, Swords, Scale, BookOpen, MapPin), không dùng chuỗi tự do |

`slug` được sinh tự động từ `name` (bỏ dấu tiếng Việt) bởi `SlugService` dùng chung; trùng thì thêm hậu tố `-2`, `-3`.

## 3. Endpoint

| Method | Path | Dùng cho section |
|---|---|---|
| GET | `/public/landing` | Toàn bộ landing trong **1 request** |
| GET | `/public/periods` | Timeline + Khám phá theo giai đoạn |
| GET | `/public/topics?section=CHAPTERS\|KNOWLEDGE` | Chặng sử / Kiến thức |

## 4. Thiết kế (SOLID + Pattern)
- **Facade** `LandingContentFacade`: gom dữ liệu từ `PeriodService`, `TopicService` → controller không phụ thuộc nhiều service.
- **Strategy** `LandingSectionStrategy` (mỗi section 1 strategy: `ChaptersSectionStrategy` = Topic CHRONOLOGICAL + `isFeatured`; `KnowledgeSectionStrategy` = Topic THEMATIC gốc). Thêm section mới = thêm 1 class + đăng ký vào registry, không sửa code cũ (OCP).
- **Hằng số** `LandingSection` enum, `PUBLIC_CONTENT_STATUS = PUBLISHED` → không magic string.
- **Mapper** riêng cho response public (không lộ cột nội bộ như `status`, `createdAt`).
- **Cache**: Redis TTL 5 phút cho `/public/landing` (đã có `RedisService`). Xóa cache khi Period/Topic thay đổi.

## 5. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor V as Khách truy cập
    participant FE as Next.js (page.tsx - Server Component)
    participant API as PublicContentController
    participant F as LandingContentFacade
    participant C as RedisService
    participant R as LandingSectionRegistry
    participant S as SectionStrategy (Chapters / Knowledge)
    participant PS as PeriodService
    participant DB as PostgreSQL (Prisma)

    V->>FE: Mở trang chủ "/"
    FE->>API: GET /public/landing
    API->>F: getLanding()
    F->>C: get("landing:v1")
    alt Có cache
        C-->>F: LandingDto
    else Không có cache
        F->>PS: findPublished()
        PS->>DB: periods WHERE status=PUBLISHED ORDER BY displayOrder
        DB-->>PS: Period[]
        loop Mỗi LandingSection
            F->>R: resolve(section)
            R-->>F: strategy
            F->>S: fetch()
            S->>DB: topics WHERE status=PUBLISHED AND (điều kiện riêng của strategy)
            DB-->>S: Topic[]
            S-->>F: SectionItemDto[]
        end
        F->>C: set("landing:v1", dto, 300s)
    end
    F-->>API: LandingDto { periods, chapters, knowledge }
    API-->>FE: 200 OK
    alt API lỗi / timeout
        FE->>FE: Fallback về dữ liệu tĩnh data/*.ts
    end
    FE-->>V: Render các section
```

## 6. Kiểm thử
- **Unit (Jest)**: `SlugService` (bỏ dấu, chống trùng), từng strategy, facade (cache hit/miss).
- **E2E API (Supertest — tương đương MockMvc bên NestJS)**: `/public/landing` không cần token; nội dung DRAFT không xuất hiện.
- **E2E UI (Playwright)**: trang chủ hiển thị đúng tên Period/Topic lấy từ seed.
