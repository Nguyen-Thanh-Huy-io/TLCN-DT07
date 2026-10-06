# Tài liệu Thiết kế & Quy trình Triển khai: Chuẩn hóa Mô hình Core Topic (Composite Pattern & Optional Period)

## 1. Mục tiêu kiến trúc
- **Chuẩn hóa Tầng Cốt lõi (Core Domain Model)**: Chuyển đổi mô hình `Topic` từ phẳng (Flat List) sang **Cây phân cấp tự quy chiếu (Self-referencing Tree / Composite Pattern)**.
- **Tự do hóa Giai đoạn (`Period`)**: Biến `Period` thành trường tùy chọn (100% Optional) ở cả Database, Backend API và Frontend CMS.
- **Hỗ trợ đa dạng loại hình lịch sử**: Cho phép xây dựng cây chủ đề cho Lịch sử Thế giới, Lịch sử Châu Âu, Lịch sử Chuyên đề (Quân sự, Nghệ thuật...), Thần thoại / Huyền sử mà không bị gò bó vào niên đại cố định của một quốc gia.
- **Sẵn sàng tích hợp AI (AI-ready)**: Dễ dàng để AI trích xuất và tự động gán metadata / period / timeline sau này.

---

## 2. Thiết kế Mô hình Dữ liệu (Prisma Schema)

```prisma
model Topic {
    id            String            @id @default(uuid())
    periodId      String?           @map("period_id")
    parentId      String?           @map("parent_id")
    pathType      LearningPathType  @default(CHRONOLOGICAL) @map("path_type")
    name          String            @db.VarChar(255)
    description   String?           @db.Text
    coverImageUrl String?           @map("cover_image_url") @db.VarChar(500)
    isSequential  Boolean           @default(false) @map("is_sequential")
    displayOrder  Int               @default(0) @map("display_order")
    status        ContentStatus     @default(DRAFT)
    createdAt     DateTime          @default(now()) @map("created_at")
    updatedAt     DateTime          @updatedAt @map("updated_at")

    // Relations
    period           Period?           @relation(fields: [periodId], references: [id], onDelete: Cascade)
    parent           Topic?            @relation("TopicHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
    children         Topic[]           @relation("TopicHierarchy")
    lessons          Lesson[]
    historicalEvents HistoricalEvent[]

    @@index([periodId])
    @@index([parentId])
    @@index([pathType])
    @@index([status])
    @@index([displayOrder])
    @@map("topics")
}
```

---

## 3. Sequence Diagrams (Biểu đồ Tuần tự)

### 3.1. Luồng Tạo mới / Cập nhật Topic (Kiểm tra Cha - Con & Chống Chu trình)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Biên tập viên (CMS)
    participant UI as TopicForm / TopicModal
    participant Ctrl as TopicController
    participant Svc as TopicService
    participant CycleGuard as TopicHierarchyValidator (Cycle & Depth Check)
    participant DB as PostgreSQL (Prisma)

    Admin->>UI: Nhập thông tin Topic (Tên, periodId?, parentId?)
    UI->>Ctrl: POST /topics (CreateTopicDto)
    Ctrl->>Svc: create(dto)

    alt periodId được cung cấp
        Svc->>DB: findUnique(periodId)
        DB-->>Svc: Period info (hoặc null -> ném NotFoundException)
    end

    alt parentId được cung cấp
        Svc->>CycleGuard: validateParent(parentId, targetId?)
        CycleGuard->>DB: findUnique(parentId)
        DB-->>CycleGuard: Parent Topic info
        CycleGuard->>CycleGuard: Kiểm tra tự gán chính mình (targetId == parentId)
        CycleGuard->>CycleGuard: Kiểm tra vòng lặp (Duyệt ngược chuỗi ancestor)
        CycleGuard->>CycleGuard: Kiểm tra giới hạn độ sâu (Max Depth = 3)
        CycleGuard-->>Svc: Hợp lệ (Passed)
    end

    Svc->>DB: prisma.topic.create(data)
    DB-->>Svc: Created Topic entity
    Svc-->>Ctrl: TopicResponseDto
    Ctrl-->>UI: 201 Created
    UI-->>Admin: Hiển thị thông báo thành công & Cập nhật Cây chủ đề
```

---

### 3.2. Luồng Lấy Cây Tri thức phân cấp (Hierarchy Tree Retrieval)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng / CMS
    participant UI as CurriculumExplorer
    participant Ctrl as TopicController
    participant Svc as TopicService
    participant TreeBuilder as TopicTreeCompositeBuilder
    participant DB as PostgreSQL (Prisma)

    User->>UI: Mở giao diện Cây Tri thức (Curriculum Explorer)
    UI->>Ctrl: GET /topics/tree
    Ctrl->>Svc: getTopicTree()
    Svc->>DB: findMany (kèm children, lessons, period)
    DB-->>Svc: Danh sách Topic phẳng kèm liên kết
    Svc->>TreeBuilder: buildCompositeTree(topics)
    TreeBuilder-->>Svc: Cấu trúc Cây đệ quy lồng nhau (Tree Hierarchy)
    Svc-->>Ctrl: TreeResponse
    Ctrl-->>UI: 200 OK (Root Topics kèm Children & Lessons)
    UI-->>User: Render giao diện Cây thư mục nhiều cấp trực quan
```

---

## 4. Kế hoạch triển khai kỹ thuật (Step-by-Step)
1. **Database Schema & Migration**:
   - Chỉnh sửa `backend/prisma/schema/topic.prisma` thêm `parentId`, `parent`, `children`.
   - Chạy `npx prisma db push` hoặc `npx prisma migrate dev`.
2. **Backend**:
   - `CreateTopicDto` & `UpdateTopicDto`: Thêm `@IsOptional() @IsUUID('4') parentId?: string`.
   - `TopicHierarchyValidator` hoặc Service method: Kiểm tra chu trình lặp (Anti-Cycle) và kiểm soát độ sâu tối đa.
   - Thêm endpoint `GET /topics/tree` phục vụ render cây phân cấp.
   - Viết bài test E2E `topic.e2e-spec.ts` kiểm thử việc tạo Topic cha - con và bắt lỗi chu trình.
3. **Frontend**:
   - Cập nhật Type `TopicItem` thêm `parentId?: string`, `parent?: TopicItem`, `children?: TopicItem[]`.
   - Mở khóa `TopicForm.tsx` & `TopicModal.tsx`:
     - Gỡ bỏ validate bắt buộc `periodId`. Cho phép chọn "Không thuộc giai đoạn".
     - Thêm trường chọn "Chủ đề cha (Parent Topic)" có lọc loại trừ chính nó.
   - Cập nhật `CurriculumTree.tsx` để hỗ trợ hiển thị đệ quy các cấp Topic con.
4. **Kiểm thử tự động**:
   - Chạy test Backend & Frontend xác minh hoạt động hoàn hảo.
