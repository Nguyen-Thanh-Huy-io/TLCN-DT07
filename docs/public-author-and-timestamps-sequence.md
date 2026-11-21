# Sequence Diagram: Hiển thị Tác giả & Thời gian đăng / cập nhật trên Bài viết & Bài học

Tài liệu mô tả luồng tải thông tin tác giả (`PublicAuthorSummary`) và mốc thời gian (`publishedAt`, `updatedAt`) cho hai trang đọc công khai: Bài viết (`/bai-viet/[slug]`) và Bài học (`/bai-hoc/[slug]`).

```mermaid
sequenceDiagram
    autonumber
    actor Reader as Độc giả / Học viên
    participant EntityPage as EntityHero (Bài viết)
    participant EntityAdapter as landing.service & entity-reader-adapter
    participant PublicSvc as PublicContentService.getArticleBySlug
    participant LessonPage as LessonReaderHeader (Bài học)
    participant LearnerSvc as LearnerService.getLessonForReading
    participant AuthorUtil as loadAuthorProfiles (author-names.ts)
    participant DB as PostgreSQL (Prisma)

    alt Đọc Bài viết (/bai-viet/[slug])
        Reader->>EntityPage: Truy cập trang bài viết
        EntityPage->>EntityAdapter: fetchEntityBySlug(slug) -> buildEntityReaderModel
        EntityAdapter->>PublicSvc: GET /public/articles/:slug
        PublicSvc->>DB: article.findFirst (select createdBy, publishedAt, updatedAt...)
        DB-->>PublicSvc: Article row (ẩn createdBy khi trả response)
        PublicSvc->>AuthorUtil: loadAuthorProfiles(prisma, [createdBy])
        AuthorUtil->>DB: authUser.findMany (username, userProfile firstName/lastName/avatarUrl)
        DB-->>AuthorUtil: Thông tin tác giả an toàn (PublicAuthorSummary)
        PublicSvc-->>EntityAdapter: { ..., author, publishedAt, updatedAt }
        EntityAdapter-->>EntityPage: EntityReaderModel { author, publishedAt, updatedAt }
        EntityPage-->>Reader: Hiển thị Byline (Biên soạn + Đăng ngày + Cập nhật nếu >= 24h)
    else Đọc Bài học (/bai-hoc/[slug])
        Reader->>LessonPage: Truy cập trang bài học
        LessonPage->>LearnerSvc: GET /me/learning/lessons/:slug
        LearnerSvc->>DB: Kiểm tra enrollment lộ trình + lesson
        LearnerSvc->>AuthorUtil: loadAuthorProfiles(prisma, [lesson.createdBy])
        AuthorUtil-->>LearnerSvc: PublicAuthorSummary | null
        LearnerSvc-->>LessonPage: { lesson: { ..., author } }
        LessonPage-->>Reader: Hiển thị Byline dưới phần mô tả bài học
    end
```
