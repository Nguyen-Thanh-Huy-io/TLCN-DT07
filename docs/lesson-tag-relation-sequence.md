# Thiết Kế Tính Năng: Quản Lý Nhãn Bài Học (Lesson - Tag Many-to-Many) & Độc Lập Hóa Bài Học Khỏi Topic

## 1. Mục tiêu kiến trúc
1. **Tách rời `Lesson` khỏi `Topic` (`Lesson` độc lập trong Thư viện)**:
   - Bỏ khóa ngoại `topicId` trên model `Lesson` (tạm thời chưa đụng vào logic cây `Topic`).
   - Bài học (`Lesson`) chỉ thuộc về Thư viện chung, được đóng gói vào các khóa học thông qua `LearningPath -> Chapter -> ChapterLesson` và được phân loại đa chiều thông qua `Tag`.
2. **Hoàn thiện liên kết `Lesson` ↔ `Tag` (Quan hệ N - N qua bảng `LessonTag`)**:
   - Bổ sung bảng trung gian `LessonTag` (`lesson_tags`) trong Prisma Schema, thay thế hoàn toàn các hàm stub `[]` trước đây trong `TagService`.
   - Hỗ trợ gán danh sách `Tag` cho `Lesson` (`POST /lessons/:id/tags`), lấy danh sách `Tag` của `Lesson` (`GET /lessons/:id/tags`), và lọc `Lesson` theo `tagId` (`GET /lessons?tagId=...`).

---

## 2. Sequence Diagram: Lưu Bài Học & Gán Nhãn Phân Loại (Lesson ↔ Tag)

```mermaid
sequenceDiagram
    autonumber
    actor Editor as Biên tập viên (CMS)
    participant UI as LessonEditor / LessonClassificationTab (Next.js)
    participant Facade as useLessonEditorFacade
    participant LessonApi as LessonApiService
    participant TagApi as TagApiService
    participant LessonCtrl as LessonController (NestJS)
    participant TagCtrl as TagController (NestJS)
    participant LessonSvc as LessonService
    participant TagSvc as TagService
    participant DB as PostgreSQL (Prisma ORM)
    participant Cache as RedisService

    rect rgb(240, 248, 255)
    Note over Editor, Cache: Luồng 1: Tạo / Cập nhật Bài học (Không phụ thuộc Topic) & Gán Nhãn (Tags)
    Editor->>UI: Nhập nội dung, chọn Độ khó & chọn các Thẻ (Tags)
    Editor->>UI: Nhấn "Lưu nháp" / "Cập nhật"
    UI->>Facade: submitLesson(nextStatus, compiledBlocks)
    Facade->>LessonApi: createLesson(payload) / updateLesson(id, payload)
    LessonApi->>LessonCtrl: POST /lessons (hoặc PATCH /lessons/:id)
    LessonCtrl->>LessonSvc: create(dto) / update(id, dto)
    LessonSvc->>DB: prisma.lesson.create / update (kèm include lessonTags.tag)
    DB-->>LessonSvc: Lesson Entity
    LessonSvc->>Cache: Xóa cache lessons:*
    LessonSvc-->>LessonCtrl: Formatted Lesson (kèm lessonTags & tags)
    LessonCtrl-->>LessonApi: 201 Created / 200 OK

    opt Có chọn danh sách Tags (selectedTags)
        Facade->>TagApi: attachTagsToLesson(lessonId, tagIds)
        TagApi->>TagCtrl: POST /lessons/:id/tags { tagIds }
        TagCtrl->>TagSvc: attachTagsToLesson(lessonId, { tagIds })
        TagSvc->>DB: Kiểm tra Lesson tồn tại & các Tag hợp lệ
        TagSvc->>DB: Transaction: deleteMany(lessonTag cũ) + createMany(lessonTag mới)
        DB-->>TagSvc: Danh sách Tag đã gắn
        TagSvc->>Cache: Invalidate cache tags:* và lessons:*
        TagSvc-->>TagCtrl: Tag[]
        TagCtrl-->>TagApi: 201 Created { data: Tag[] }
    end
    Facade-->>UI: Cập nhật trạng thái Đã lưu
    end

    rect rgb(245, 255, 250)
    Note over Editor, Cache: Luồng 2: Lọc Bài học theo Nhãn (Tag) trong Thư viện Lesson
    Editor->>UI: Chọn bộ lọc Tag trong Thư viện Lesson / Modal thêm vào Chương
    UI->>LessonApi: getLessons({ tagId, search, status })
    LessonApi->>LessonCtrl: GET /lessons?tagId=...
    LessonCtrl->>LessonSvc: findAll(query)
    LessonSvc->>DB: prisma.lesson.findMany({ where: { lessonTags: { some: { tagId } } }, include: { lessonTags: { include: { tag: true } } } })
    DB-->>LessonSvc: Danh sách Lesson khớp Tag
    LessonSvc-->>UI: Trả về Paginated Lessons kèm mảng tags[]
    end
```

---

## 3. Áp dụng Nguyên tắc SOLID & Design Patterns
- **Single Responsibility Principle (SRP)**:
  - `LessonService` chịu trách nhiệm vòng đời nội dung bài học và chuẩn hóa dữ liệu trả về (`formatLessonResponse` ánh xạ `lessonTags` thành mảng `tags` phẳng tiện lợi cho UI).
  - `TagService` chịu trách nhiệm quản lý danh mục `Tag` và đồng bộ bảng trung gian `LessonTag` trong Transaction nguyên tử (`$transaction`).
- **Open/Closed Principle (OCP)**:
  - Bộ lọc bài học trong `LessonService.findAll` mở rộng điều kiện lọc theo `tagId` thông qua quan hệ `lessonTags: { some: { tagId } }` mà không làm thay đổi cấu trúc phân trang hay cache hiện có.
- **Không Magic String**:
  - Toàn bộ khóa cache, thông báo lỗi của module `Tag` được định nghĩa tập trung tại `tag.constant.ts`.
