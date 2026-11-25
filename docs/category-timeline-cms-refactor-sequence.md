# Sequence Diagram — Tinh gọn Schema (`ArticleLink`, `ArticleKind`, `DatePrecision`), Cây `Category`, Timeline Đệ quy `Topic` & Shared Block Builder

## 1. Luồng Biên soạn Bài viết CMS (2 Tab: Thông tin & Nội dung) và Phân loại theo Cây `Category`

```mermaid
sequenceDiagram
    actor Editor as Biên tập viên (CMS)
    participant UI as ArticleEditor (2 Tabs: INFO / CONTENT)
    participant Builder as Shared BlockBuilder (components/block-builder)
    participant API as ArticleController / ArticleService
    participant CatSvc as CategoryService (Tree & Root Lock)
    participant DB as PostgreSQL (Prisma)

    Editor->>UI: Mở trang tạo/sửa Bài viết
    UI->>CatSvc: GET /categories (cây Category cha -> con)
    CatSvc->>DB: SELECT categories (5 slug gốc hệ thống + chuyên mục con)
    DB-->>UI: Danh sách Category (không dùng cột kind)
    Editor->>UI: Nhập Tiêu đề, Chuyên mục, Chủ đề, Niên đại (startYear/endYear/dateText), Nguồn (metadata.sources)
    Editor->>Builder: Soạn nội dung khối (chọn bài nội bộ qua HisgoArticlePickerModal)
    Editor->>UI: Lưu nháp / Gửi duyệt
    UI->>API: POST/PATCH /articles (không còn datePrecision, links, person/site profile)
    API->>DB: Lưu Article + ArticleTag trong $transaction
    DB-->>UI: Trả về ArticleItem đã lưu
```

## 2. Luồng Đọc Bài viết Công khai & Gợi ý Bài viết Liên quan (Thay thế `ArticleLink`)

```mermaid
sequenceDiagram
    actor Reader as Người đọc
    participant Page as EntityReader / PublicArticlePage
    participant Adapter as LandingService / CategoryTreeResolver
    participant PubAPI as PublicContentController / Service
    participant DB as PostgreSQL

    Reader->>Page: Truy cập /bai-viet/[slug]
    Page->>PubAPI: GET /public/articles/:slug + danh mục Category/Topic
    PubAPI->>DB: Truy vấn Article + Category + Tags + Adjacency (theo Timeline/Category)
    DB-->>Adapter: Dữ liệu bài viết (không truy vấn bảng article_links)
    Adapter->>Adapter: Suy nhánh chuyên mục gốc từ cây Category (SYSTEM_CATEGORY_ROOT_SLUGS)
    Adapter->>Adapter: Tự động gom Bài viết liên quan theo cùng Topic / Tag / Category
    Adapter-->>Page: Render nội dung + Nguồn sử liệu + Bài viết cùng chủ điểm
```

## 3. Luồng Dòng thời gian (`/dong-thoi-gian` & `/giai-doan/[slug]`) Gom Đệ quy Cây `Topic` (`Cha > Con > Cháu`)

```mermaid
sequenceDiagram
    actor User as Người học
    participant TLView as TimelineExplorer / PeriodDetailView
    participant SkAdapter as sk-adapter / landing-graph (Recursive Topic Tree)
    participant PubAPI as PublicContentService
    participant DB as PostgreSQL

    User->>TLView: Mở /dong-thoi-gian hoặc /giai-doan/[slug]
    TLView->>PubAPI: Tải Timelines, Topics (cây N cấp), Categories, Articles
    PubAPI->>DB: SELECT timelines (kèm timeline_node_articles), topics, categories, articles
    DB-->>SkAdapter: Dữ liệu thô
    SkAdapter->>SkAdapter: Duyệt đệ quy cây Topic (Cha -> Con -> Cháu N cấp)
    SkAdapter->>SkAdapter: Gom mốc từ TimelineNode + bài viết thuộc cây Topic con theo nhánh Category gốc (su-kien, nhan-vat, di-tich)
    SkAdapter->>SkAdapter: Hiển thị niên đại bài viết (bỏ liên kết ENDED_BY & mốc kết thúc kéo dài)
    SkAdapter-->>TLView: Render cây giai đoạn Cha > Con > Cháu kèm Sự kiện, Nhân vật, Địa danh
```
