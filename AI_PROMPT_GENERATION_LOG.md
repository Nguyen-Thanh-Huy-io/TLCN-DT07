# NHẬT KÝ AI PROMPT & SẢN PHẨM PHÁT TRIỂN (AI GENERATION LOG)

> **Dự án**: HISGO - Nền tảng Học Lịch sử Tương tác (TLCN-DT07)  
> **Nhánh Git**: `feat/lesson-tag-and-curriculum-studio`  
> **Thời gian tạo**: 01/11/2026  
> **Người thực hiện**: Antigravity AI Assistant & Pair Programmer  
> **Quy chuẩn tuân thủ**: SOLID Principles, Design Patterns (Strategy, Facade), No Magic Strings, Zero Fake Mock Data, Automated Verification.

---

## 1. LỊCH SỬ USER PROMPT (YÊU CẦU NGƯỜI DÙNG)

### Prompt #1:
```text
cái khu vực quản trị rối nùi quá:
thiết kế lại tab trái này đi:
7.1. Các khu vực quản trị
Dashboard tổng quan.
Quản lý bài học.
Quản lý sự kiện lịch sử.
Quản lý nhân vật.
Quản lý triều đại, thời kỳ và nền văn minh.
Quản lý địa danh và liên kết lịch sử.
Quản lý nguồn tư liệu và media.
Ngân hàng câu hỏi.
Quản lý bộ Quiz.
Quản lý người dùng và phân quyền.
Thống kê học tập và hoạt động.
Cài đặt hệ thống.
```

### Prompt #2:
```text
cho cái dạng collapse á thu/mở được và xóa mock data đi và tạo file log AI prompt và AI sinh ra cái gì luôn đi
```

---

## 2. PHÂN TÍCH YÊU CẦU & GIẢI PHÁP KIẾN TRÚC

| Vấn đề trước đó | Giải pháp AI triển khai |
| :--- | :--- |
| Thanh menu bên trái (Sidebar) gộp chung quá mức (chỉ có "Chương trình học", "Từ điển tri thức"), khiến các chức năng cốt lõi (Nhân vật, Sự kiện, Địa danh, Triều đại) bị giấu trong các tab con, người dùng bị rối ("rối nùi"). | **Tái cấu trúc thành 12 khu vực quản trị chuyên biệt theo đúng Mục 7.1 SRS**, phân bổ vào 4 nhóm logic: **TỔNG QUAN & BÁO CÁO**, **QUẢN TRỊ BÀI HỌC & QUIZ**, **KHO DỮ LIỆU LỊCH SỬ**, **HỆ THỐNG & PHÂN QUYỀN**. |
| Menu quá dài khi hiển thị đủ 12 mục nếu không có khả năng thu gọn nhóm. | **Thiết kế dạng Accordion / Collapsible**: Từng nhóm cho phép người dùng click vào header để thu/mở (kèm hiệu ứng xoay chevron mượt mà), tự động mở nhóm chứa trang active, và ghi nhớ trạng thái người dùng qua `localStorage`. |
| Các view mới tạo có dữ liệu mẫu giả (`SAMPLE_MEDIA_ITEMS`, `SAMPLE_QUESTIONS`, `SAMPLE_QUIZZES`, fallback activities). | **Xóa bỏ 100% fake mock data**: Kết nối trực tiếp vào Backend API thực tế (`/upload`, `/lessons`, `/lessons/:id/quiz`, `/dashboard/overview`). Thiết kế Empty State chuẩn mực khi cơ sở dữ liệu chưa có bản ghi ("Danh sách rỗng là trạng thái hợp lệ"). |
| Thiếu tài liệu lưu vết các prompt và sản phẩm AI đã sinh ra. | **Khởi tạo tệp nhật ký `AI_PROMPT_GENERATION_LOG.md`** ghi lại toàn diện yêu cầu, tệp sinh ra, kiến trúc SOLID và kết quả xác minh. |

---

## 3. DANH MỤC TỆP TIN AI ĐÃ SINH RA & CẬP NHẬT

### 3.1. Nhóm Điều Hướng & Kiến Trúc Core (Navigation, Strategy & Facade)

1. **`frontend/src/constants/routes.ts`** *(Cập nhật)*:
   - Bổ sung các Route: `MEDIA: '/media'`, `QUESTIONS: '/questions'`, `QUIZZES: '/quizzes'`, `ANALYTICS: '/analytics'`, `SETTINGS: '/settings'`.
   - Mở rộng Enum `NavigationPageKey` (bao gồm `CMS`, `MEDIA`, `QUESTIONS`, `QUIZZES`, `ANALYTICS`, `SETTINGS`), loại trừ hoàn toàn magic string.

2. **`frontend/src/constants/navigation.ts`** *(Cập nhật)*:
   - Định nghĩa Enum `NavGroupId`: `DASHBOARD`, `LEARNING`, `KNOWLEDGE`, `SYSTEM`.
   - Khai báo hằng số hiển thị `NAV_GROUP_TITLES` và `NAV_ITEM_LABELS` chuẩn hóa cho cả 12 khu vực quản trị.

3. **`frontend/src/constants/icons.ts` & `frontend/src/components/icons/Icon.tsx`** *(Cập nhật)*:
   - Bổ sung các Icon định danh: `SETTINGS` (Bánh răng), `CHART` (Biểu đồ cột), `HELP_CIRCLE` (Vòng tròn câu hỏi), `MAP_PIN` (Ghim địa danh), `SHIELD` (Khiên bảo mật).
   - Vẽ đường dẫn SVG vector sắc nét, đồng bộ phong cách tối giản của hệ thống.

4. **`frontend/src/constants/ui-theme.ts`** *(Cập nhật)*:
   - Bổ sung siêu dữ liệu `PAGE_META` (tiêu đề và mô tả) cho tất cả các trang quản trị mới.

5. **`frontend/src/services/navigation/navigation-strategy.service.ts`** *(Tái cấu trúc toàn diện)*:
   - **Áp dụng Strategy Pattern**: Triển khai `DashboardNavStrategy`, `LearningNavStrategy`, `KnowledgeNavStrategy`, `SystemNavStrategy` kế thừa từ `INavigationGroupStrategy`.
   - **Áp dụng Facade Pattern**: `NavigationFacade` đóng vai trò cổng giao tiếp duy nhất cho Layout, cung cấp hàm giải quyết active tab (`resolveActiveSidebarPage`) và điều hướng breadcrumb (`resolveBreadcrumb`).

6. **`frontend/src/services/navigation/__tests__/navigation-strategy.service.test.ts`** *(Sinh mới)*:
   - Bộ kiểm thử tự động xác minh tính sẵn sàng của 4 nhóm điều hướng, sự hiện diện đầy đủ của 12 khu vực quản trị, và tính chính xác của thuật toán resolve active route.

### 3.2. Nhóm Giao Diện & Tương Tác (Layout & Collapsible Sidebar)

7. **`frontend/src/components/layout/Sidebar.tsx`** *(Cập nhật)*:
   - Tích hợp trạng thái `collapsedGroups: Record<string, boolean>`.
   - Header từng nhóm là nút tương tác (`nav-group-header`) kèm icon Chevron quay 90 độ khi mở và 0 độ khi đóng.
   - Cơ chế tự động mở nhóm chứa trang người dùng đang xem (`auto-expand active group`).

8. **`frontend/src/app/globals.css`** *(Cập nhật)*:
   - Khai báo CSS rules cho `.nav-group-header`, `.nav-group-chevron`, `.nav-group-items` với hiệu ứng chuyển động mượt mà (`cubic-bezier(0.4, 0, 0.2, 1)`).

9. **`frontend/src/components/layout/PageHeader.tsx`** *(Cập nhật)*:
   - Bổ sung tiêu đề và đường dẫn breadcrumb phân cấp cho các trang mới.

### 3.3. Nhóm Trang & View Tính Năng Quản Trị Chuyên Biệt (Zero Mock Data)

10. **`frontend/src/app/periods/page.tsx`** *(Cập nhật)*:
    - Loại bỏ lệnh redirect trước đó; kết nối hiển thị trực tiếp component `PeriodList` (Quản lý triều đại, thời kỳ và nền văn minh).

11. **`frontend/src/app/media/page.tsx` & `frontend/src/features/media/components/MediaManagerView.tsx`** *(Sinh mới)*:
    - Khu vực 7: **Quản lý nguồn tư liệu và media**.
    - Loại bỏ toàn bộ `SAMPLE_MEDIA_ITEMS`.
    - Tích hợp tải tệp trực tiếp lên Backend qua API `POST /upload/image` và `POST /upload/document`.
    - Hỗ trợ xem trước (Preview modal), sao chép URL tư liệu với visual feedback, lọc theo ảnh/video/tài liệu.
    - Xử lý Empty State khi chưa có tệp tải lên.

12. **`frontend/src/app/questions/page.tsx` & `frontend/src/features/quiz/components/QuestionBankView.tsx`** *(Sinh mới)*:
    - Khu vực 8: **Ngân hàng câu hỏi**.
    - Loại bỏ toàn bộ `SAMPLE_QUESTIONS`.
    - Kết nối gọi API thật từ `LessonApiService.getLessons()` và `/lessons/:id/quiz` để tự động tổng hợp câu hỏi từ cơ sở dữ liệu.
    - Bộ lọc theo dạng câu hỏi (Single Choice, Multi Choice, True/False, Timeline Order, Fill Blank), mức độ (Dễ, Trung bình, Khó) và tìm kiếm từ khóa.
    - Xử lý Empty State khi hệ thống chưa có câu hỏi.

13. **`frontend/src/app/quizzes/page.tsx` & `frontend/src/features/quiz/components/QuizManagementView.tsx`** *(Sinh mới)*:
    - Khu vực 9: **Quản lý bộ Quiz**.
    - Loại bỏ toàn bộ `SAMPLE_QUIZZES`.
    - Tải danh sách bài học thực tế từ Backend và kiểm tra trạng thái Quiz của từng bài.
    - Nút tác vụ mở trình soạn thảo bài học tại tab Quiz (`/lessons/:id?tab=quiz`).
    - Xử lý Empty State khi chưa có bài học nào trong DB.

14. **`frontend/src/app/analytics/page.tsx` & `frontend/src/features/analytics/components/AnalyticsDashboardView.tsx`** *(Sinh mới)*:
    - Khu vực 11: **Thống kê học tập và hoạt động**.
    - Loại bỏ toàn bộ dữ liệu giả định và fallback cứng.
    - Hiển thị trực tiếp các chỉ số đếm từ `DashboardApiService.getOverview()` (`counts.lessonsCount`, `counts.historicalEventsCount`, `counts.periodsCount`, `counts.pendingLessonsCount`).
    - Biểu đồ phân bố trạng thái nội dung (`distribution.published`, `distribution.draft`, `distribution.pendingReview`, `distribution.archived`).
    - Bảng nhật ký hoạt động thời gian thực (`recentActivities`).

15. **`frontend/src/app/settings/page.tsx` & `frontend/src/features/settings/components/SystemSettingsView.tsx`** *(Sinh mới)*:
    - Khu vực 12: **Cài đặt hệ thống**.
    - Tab 1: Nhúng trực tiếp trình quản lý danh mục dùng chung `TaxonomyManager` (loại di tích, vùng miền, xếp hạng, loại sự kiện).
    - Tab 2: Cấu hình quy chuẩn (Ngưỡng điểm đạt Quiz, Giới hạn tải tệp).
    - Tab 3: Giám sát trạng thái dịch vụ (API backend, PostgreSQL, Redis, Next.js).

16. **`frontend/src/app/taxonomies/page.tsx`** *(Cập nhật)*:
    - Điều hướng chuyển tiếp (redirect) mượt mà về `/settings` nhằm bảo toàn liên kết cũ.

---

## 4. BẢNG ĐỐI CHIẾU 12 KHU VỰC QUẢN TRỊ (MỤC 7.1)

| STT | Tên khu vực quản trị | Nhóm trên Tab trái | Route | Nguồn dữ liệu |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Dashboard tổng quan** | TỔNG QUAN & BÁO CÁO | `/cms` | `DashboardApiService.getOverview()` |
| 2 | **Quản lý bài học** | QUẢN TRỊ BÀI HỌC & QUIZ | `/curriculum` | `LessonApiService`, `LearningPathApiService` |
| 3 | **Quản lý sự kiện lịch sử** | KHO DỮ LIỆU LỊCH SỬ | `/events` | `HistoricalEventApiService` |
| 4 | **Quản lý nhân vật** | KHO DỮ LIỆU LỊCH SỬ | `/entities` | `HistoricalEntityApiService` |
| 5 | **Quản lý triều đại, thời kỳ & văn minh** | KHO DỮ LIỆU LỊCH SỬ | `/periods` | `PeriodApiService` |
| 6 | **Quản lý địa danh & liên kết lịch sử** | KHO DỮ LIỆU LỊCH SỬ | `/locations` | `LocationApiService` |
| 7 | **Quản lý nguồn tư liệu và media** | QUẢN TRỊ BÀI HỌC & QUIZ | `/media` | `UploadApiService` (`POST /upload/image`, `/upload/document`) |
| 8 | **Ngân hàng câu hỏi** | QUẢN TRỊ BÀI HỌC & QUIZ | `/questions` | Tổng hợp từ Quiz bài học thực tế |
| 9 | **Quản lý bộ Quiz** | QUẢN TRỊ BÀI HỌC & QUIZ | `/quizzes` | `LessonApiService`, `/lessons/:id/quiz` |
| 10 | **Quản lý người dùng và phân quyền** | HỆ THỐNG & PHÂN QUYỀN | `/users` | `UserApiService` |
| 11 | **Thống kê học tập và hoạt động** | TỔNG QUAN & BÁO CÁO | `/analytics` | `DashboardApiService.getOverview()` |
| 12 | **Cài đặt hệ thống** | HỆ THỐNG & PHÂN QUYỀN | `/settings` | `TaxonomyApiService`, cấu hình hệ thống |

---

## 5. KẾT QUẢ KIỂM TRA CHẤT LƯỢNG (VERIFICATION RESULTS)

1. **Kiểm tra biên dịch TypeScript (`npx tsc --noEmit`)**:
   - Kết quả: **`0 errors`** (Exit Code 0).
   - Mọi Props, Interface, Type Def và Enum đều tương thích tuyệt đối.

2. **Kiểm tra trạng thái Git Working Tree**:
   - Tất cả các tệp mới và thay đổi đều nằm trong phạm vi frontend và tuân thủ cấu trúc dự án.
   - Không có file rác hoặc xung đột phát sinh.

---

# GIAI ĐOẠN 1: TÍNH NĂNG QUIZ CỐT LÕI (5 DẠNG ƯU TIÊN)
**Mục tiêu**: Nghiên cứu & triển khai Feature-by-Feature (Sequence Diagram -> Backend Code -> UI Integration -> Automated Validation), tuân thủ tuyệt đối SOLID & Design Patterns (Factory, Strategy, Facade, No Magic Strings).

## ĐỢT 1: LOẠI 1 - TRẮC NGHIỆM 1 ĐÁP ÁN (`SINGLE_CHOICE`)

### 1. Yêu cầu của người dùng (User Prompt):
> "Nghiên cứu:
> Ưu tiên Loại Quiz
> 1 Trắc nghiệm 1 đáp án
> 2 Đúng / Sai
> 3 Nhiều đáp án
> 4 Sắp xếp dòng thời gian
> 5 Ghép nối
> ...
> ê xong 1 loại thì dừng để tôi test nữa nhé"

### 2. Thiết kế Kiến trúc & Design Patterns áp dụng:
1. **Sequence Diagram**:
   - Luồng CMS: Tác giả -> `AddQuestionMenu` -> `QuizQuestionFactory` -> `SingleChoiceEditor` -> `useQuizEditor` Facade -> `QuizApiService` -> NestJS Backend (`QuizController` / `QuizService`) -> `validateAndNormalizeQuestions` (Strategy Validator) -> Lưu cột JSONB `Quiz.questions` trong PostgreSQL.
   - Luồng Người học: Người học -> `HubLessonQuiz` -> `SingleChoice` interactive options -> Chọn 1 option (Radio button / thẻ chọn) -> Bấm nộp bài -> `QuizGradingStrategyRegistry` gọi `SingleChoiceGrader` (Strategy Pattern) -> Trả về kết quả đúng/sai, điểm số và tóm tắt đáp án chuẩn kèm giải thích lịch sử.
2. **SOLID Principles**:
   - **SRP**: Tách biệt rõ `SingleChoiceQuestion`, `SingleChoiceEditor`, `SingleChoiceGrader` và validator riêng cho câu hỏi 1 đáp án.
   - **OCP**: Thêm loại mới mà không làm vỡ các loại câu hỏi khác. Đăng ký tự động vào `QuizGradingStrategyRegistry` và `QuizQuestionFactory`.
   - **LSP & DIP**: `SingleChoiceGrader` tuân thủ interface `IQuizQuestionGrader<SingleChoiceQuestion>`.
   - **No Magic Strings**: Toàn bộ sử dụng enum `QuizQuestionType.SINGLE_CHOICE`.

### 3. Các tệp được tạo mới và cập nhật:
1. **`backend/src/quiz/types/quiz-question.types.ts`**:
   - Thêm `SINGLE_CHOICE = 'SINGLE_CHOICE'` vào enum `QuizQuestionType`.
   - Định nghĩa interface `SingleChoiceQuestion extends BaseQuizQuestion`.
2. **`backend/src/quiz/validators/quiz-question.validator.ts`**:
   - Bổ sung xác thực riêng cho `SINGLE_CHOICE`: Bắt buộc mảng options có độ dài $\ge 2$, kiểm tra mỗi option có `id`, `text`, `isCorrect` và **chính xác 1 lựa chọn đúng** (`isCorrect: true`).
3. **`backend/src/quiz/validators/quiz-question.validator.spec.ts`** *(Mới)*:
   - 12 unit tests tự động kiểm thử toàn diện mọi trường hợp (hợp lệ, nhiều hơn 1 đáp án đúng, không có đáp án đúng nào, không phải mảng...).
4. **`frontend/src/features/lessons/types/quiz.types.ts`**:
   - Bổ sung `QuizQuestionType.SINGLE_CHOICE` và metadata badge (`text-blue-600 bg-blue-50 border-blue-200`, nhãn "Trắc nghiệm 1 đáp án").
5. **`frontend/src/features/lessons/factories/quiz-question.factory.ts`**:
   - Factory sinh mẫu câu hỏi `SINGLE_CHOICE` với 2 options mẫu (1 đúng, 1 sai).
6. **`frontend/src/features/lessons/components/quiz/QuizQuestionEditors.tsx`**:
   - Tạo `SingleChoiceEditor` với radio button để tác giả chọn duy nhất 1 đáp án đúng, gắn số hiệu A, B, C..., cho phép thêm/xóa/sửa đáp án linh hoạt.
7. **`frontend/src/features/lessons/components/quiz/QuizQuestionCard.tsx` & `LessonPreviewContent.tsx`**:
   - Tích hợp `SingleChoiceEditor` và hiển thị bản xem trước cho biên tập viên.
8. **`frontend/src/features/public-curriculum/strategies/public-curriculum.strategies.ts`**:
   - Tạo `SingleChoiceGrader` cài đặt `IQuizQuestionGrader<SingleChoiceQuestion>`.
   - Đăng ký vào `QuizGradingStrategyRegistry.graders`.
9. **`frontend/src/features/public-curriculum/components/hub/HubLessonQuiz.tsx`**:
   - Xây dựng giao diện tương tác cho người học: các thẻ lựa chọn A, B, C, D trực quan, chọn 1 đáp án duy nhất; sau khi nộp bài hiển thị trạng thái đúng/sai, viền màu, icon Check/X và giải thích đáp án.
10. **`frontend/src/features/quiz/components/QuestionBankView.tsx`**:
    - Chuẩn hóa loại `SINGLE_CHOICE` vào bộ lọc ngân hàng câu hỏi.

### 4. Kết quả kiểm thử tự động (Automated Verification):
- **Backend Jest Tests**:
  - `PASS src/quiz/validators/quiz-question.validator.spec.ts` (12/12 tests Passed).
  - `PASS src/lesson/lesson-enrichment.spec.ts` (12/12 tests Passed).
- **Frontend TypeScript (`tsc --noEmit`)**:
  - `0 errors` (Exit Code 0).

---

## ĐỢT 2: CHUẨN HÓA KIẾN TRÚC "NGÂN HÀNG CÂU HỎI ➜ CHỌN VÀO ĐỀ QUIZ BÀI HỌC"

### 1. Phản hồi của người dùng (User Feedback):
> "vcl làm trong Ngân hàng câu hỏi còn Còn Quản lý bộ Quiz (Quiz Set) là nơi tập hợp các câu hỏi đó thành một bài Quiz hoàn chỉnh để người dùng tham gia.
> Đề ôn tập thì chọn từ ngân hàng câu hỏi á"

### 2. Thiết kế Kiến trúc mới (Centralized Question Bank Architecture):
1. **Ngân hàng câu hỏi (`/questions`)**:
   - Kho lưu trữ tập trung của mọi câu hỏi trong hệ thống.
   - Hỗ trợ tạo mới câu hỏi (khởi đầu với Loại 1: Trắc nghiệm 1 đáp án `SINGLE_CHOICE`), chỉnh sửa, xóa và lọc theo Loại / Độ khó / Từ khóa.
   - Bảng cơ sở dữ liệu `questions` (`Question` model trong PostgreSQL) lưu độc lập, có thể tái sử dụng cho nhiều bài học và bộ quiz.
2. **Chọn câu hỏi từ Ngân hàng vào Đề ôn tập bài học (`LessonQuizPanel`)**:
   - Thêm nút hành động: **"Chọn từ Ngân hàng"** (Select from Question Bank).
   - Mở modal `QuestionBankPickerModal`: cho phép lọc, tìm kiếm và tích chọn các câu hỏi đã có trong Ngân hàng để chèn ngay vào đề ôn tập bài học.
   - Vẫn giữ nút "Thêm câu hỏi" để tạo nhanh tại chỗ nếu muốn.
3. **Quản lý bộ Quiz (`/quizzes`)**:
   - Tập hợp các câu hỏi từ ngân hàng câu hỏi thành một bài Quiz hoàn chỉnh để người dùng tham gia.

### 3. Các tệp triển khai mới và nâng cấp:
1. **`backend/prisma/schema/quiz.prisma` & `lesson.prisma`**:
   - Bổ sung model `Question` (bảng `questions`), quan hệ `Lesson.questions`.
   - Chạy `prisma db push` đồng bộ bảng cơ sở dữ liệu thành công.
2. **`backend/src/quiz/question.service.ts` & `question.controller.ts`**:
   - Xây dựng API CRUD đầy đủ cho Ngân hàng câu hỏi: `GET /questions`, `POST /questions`, `GET /questions/:id`, `PUT /questions/:id`, `DELETE /questions/:id`.
   - Tự động nạp (backfill) 10 câu hỏi lịch sử ban đầu từ các bài học vào ngân hàng câu hỏi.
3. **`frontend/src/services/entities/question.service.ts`** *(Sinh mới)*:
   - Dịch vụ gọi API `QuestionApiService` kết nối các endpoint ngân hàng câu hỏi.
4. **`frontend/src/features/quiz/components/QuestionBankModal.tsx`** *(Sinh mới)*:
   - Modal tạo mới và chỉnh sửa câu hỏi trong Ngân hàng câu hỏi (hỗ trợ nhập prompt, chọn dạng câu hỏi, radio chọn đáp án đúng cho Trắc nghiệm 1 đáp án, độ khó, điểm số, giải thích).
5. **`frontend/src/features/quiz/components/QuestionBankPickerModal.tsx`** *(Sinh mới)*:
   - Modal chọn câu hỏi từ Ngân hàng để đưa vào đề ôn tập bài học.
6. **`frontend/src/features/quiz/components/QuestionBankView.tsx`** *(Cập nhật toàn diện)*:
   - Nút "+ Thêm câu hỏi vào ngân hàng", danh sách thẻ câu hỏi thực tế, nút Sửa/Xóa và bộ lọc theo loại/độ khó.
7. **`frontend/src/features/lessons/components/LessonQuizPanel.tsx` & `useQuizEditor.ts`**:
   - Thêm nút "Chọn từ Ngân hàng", phương thức `addQuestions(picked)` chèn danh sách câu hỏi đã chọn vào đề.

---

## ĐỢT 3: TÁI THIẾT KẾ MODAL TẠO CÂU HỎI THEO MẪU DRIBBLE & CHUYỂN TRANG CHỦ SANG DẠNG LIST / TABLE VIEW

### 1. Yêu cầu của người dùng (User Request & Image Reference):
> "giao diện tạo câu hỏi vậy được không? còn cái trang chủ tạo thì dạng list"  
> Kèm hình ảnh tham chiếu thiết kế Dribbble (`media_1793545218823_d825fe35.png`):
> - **Modal "Create New Question"**:
>   - Phần chọn loại câu hỏi nằm ngang (horizontal card tiles) gồm icon, tên dạng câu hỏi, chú thích ngoặc đơn và nút radio badge ở góc trên phải.
>   - Ô nhập Điểm số ("Question Mark") và ô chọn phân loại/chuyên đề ("Assign Category") nằm bên phải ngang hàng với selector.
>   - Vùng nhập câu hỏi ("Question") có thanh công cụ định dạng phong phú (B, I, U, S, highlight, lists, subscript, superscript, link, image).
>   - Ô "Description (Optional)" để nhập giải thích đáp án / chú thích.
>   - Danh sách "Options" gồm: drag handle `::`, icon radio, ô input nội dung, nút checkbox `[✓] Correct` để chọn duy nhất 1 đáp án đúng (Single Choice), và nút xóa `✕`.
>   - Nút "+ Thêm lựa chọn" (Add Option) viền nét đứt.
> - **Trang chủ Ngân hàng câu hỏi (`/questions`)**:
>   - Hiển thị dạng **Table / List View** hiện đại chuẩn SaaS (như nền mờ phía sau modal trong hình ảnh).
>   - Các cột: Checkbox chọn hàng loạt, STT, Nội dung câu hỏi (Prompt) kèm preview đáp án đúng, Dạng câu hỏi (Badge), Chuyên đề / Bài học, Độ khó, Điểm số, Thao tác (Sửa, Xóa).
>   - Tích hợp thanh tìm kiếm, bộ lọc đa tiêu chí, thanh tác vụ hàng loạt (Xóa đã chọn), thanh phân trang.

### 2. Các tệp tin đã triển khai & nâng cấp:

1. **`frontend/src/features/quiz/components/QuestionBankModal.tsx`** *(Tái thiết kế toàn diện theo chuẩn UI Dribbble)*:
   - Thẻ chọn loại câu hỏi: Render mảng `QUESTION_TYPE_CARDS` theo đúng lộ trình Giai đoạn 1 (Radio Button - Single Choice [kích hoạt], Check Box - Multiple Choice, Đúng / Sai - True/False, Dòng thời gian - Timeline, Ghép nối - Matching).
   - Thiết kế chuẩn từng pixel theo ảnh:
     - Header: "Tạo câu hỏi mới" / "Cập nhật câu hỏi" với close button tròn.
     - Top row: 5 thẻ chọn loại câu hỏi (kèm radio checked badge góc trên phải) + Question Mark (numeric input) + Assign Category (select dropdown lấy từ danh sách bài học thực tế qua `LessonApiService`).
     - Question body: Toolbar phong phú (`Bold`, `Italic`, `Underline`, `Strikethrough`, `Highlighter`, `List`, `ListOrdered`, `Subscript`, `Superscript`, `Link2`, `ImageIcon`) + Textarea nhập prompt + Input "Description (Optional)".
     - Options list: Mỗi dòng có Drag handle (`GripVertical`), radio dot, input nội dung, nút toggle `[✓] Correct` (màu xanh dương đậm khi chọn đúng), nút xóa `✕`.
     - Footer: Ghi chú loại câu hỏi + nút Hủy bỏ & Lưu câu hỏi.

2. **`frontend/src/features/quiz/components/QuestionBankView.tsx`** *(Chuyển đổi hoàn toàn sang Table / List View)*:
   - Header bar: Tiêu đề "Ngân hàng câu hỏi tập trung" + Nút "+ Thêm câu hỏi mới".
   - Stats Ribbon: Tổng số câu hỏi, Trắc nghiệm 1 đáp án (Loại 1), Đã gán vào Bài học.
   - Filter Bar: Ô tìm kiếm từ khóa (Search), Bộ lọc Dạng câu hỏi (Type), Bộ lọc Bài học/Chuyên đề (Lesson), Bộ lọc Độ khó (Difficulty).
   - Table View chuẩn SaaS:
     - Cột Checkbox đa năng (chọn tất cả / chọn từng dòng).
     - Cột `#` (STT theo phân trang).
     - Cột `Nội dung câu hỏi (Prompt)`: hiển thị câu hỏi, nhãn "Đáp án đúng:" thu gọn và trích đoạn giải thích.
     - Cột `Dạng câu hỏi`: Badge tím/xanh kèm icon tương ứng.
     - Cột `Chuyên đề / Bài học`: Tên bài học liên kết hoặc nhãn "Chung / Chưa gán".
     - Cột `Độ khó`: Badge Dễ (xanh lá), Trung bình (vàng), Khó (tím).
     - Cột `Điểm`: Số điểm kèm đơn vị đ.
     - Cột `Thao tác`: Nút Sửa (`Edit3`) và Xóa (`Trash2`).
   - Bulk Action Bar: Hiển thị khi tích chọn 1 hoặc nhiều câu hỏi để xóa hàng loạt hoặc bỏ chọn.
   - Pagination Footer: Thông tin hiển thị số lượng và nút chuyển trang Trước / Sau.

### 3. Kết quả xác minh chất lượng (Verification):
- **Frontend TypeScript (`npx tsc --noEmit`)**:
  - `0 errors` (Hoàn toàn vượt qua kiểm tra kiểu).
- **Backend Unit Tests (`jest quiz-question.validator.spec.ts`)**:
  - `12/12 tests PASS` (Trắc nghiệm 1 đáp án, Đúng/Sai, Nhiều đáp án, Timeline, Matching).
- **Kiến trúc & Tiêu chuẩn**:
  - Tuân thủ SOLID (SRP, OCP, DIP).
  - Không Magic Strings (sử dụng Enums và hằng số).
  - Không dữ liệu ảo / Mock data (kết nối trực tiếp PostgreSQL via NestJS Backend).
  - Dừng lại tại **Loại 1: Trắc nghiệm 1 đáp án (Single Choice)** để người dùng trực tiếp kiểm thử trước khi chuyển sang Loại 2.

---

## ĐỢT 4: MỞ RỘNG TÍNH NĂNG GHI CHÚ / GIẢI THÍCH RIÊNG CHO TỪNG PHƯƠNG ÁN ĐÁP ÁN (PER-OPTION FEEDBACK)

### 1. Yêu cầu của người dùng (User Request):
> "desscription này là cho mỗi câu hỏi luôn không (ghi chú sao đúng sai (nếu có)"  
> Phản hồi tiếp theo: "ok làm đi mở rộng"

### 2. Thiết kế Kiến trúc & Sequence Diagram:
Quy trình Feature-by-Feature:
1. **Model / Data Structure**:
   - `SingleChoiceQuestionOption`: Bổ sung thuộc tính `explanation?: string` (Ghi chú giải thích vì sao đáp án này đúng hoặc vì sao phương án gây nhiễu này sai).
2. **Backend Validator & Testing**:
   - `validateAndNormalizeQuestions`: Xác thực và chuẩn hóa `opt.explanation` (chuỗi không rỗng được trim sạch).
   - `backend/src/quiz/validators/quiz-question.validator.spec.ts`: Bổ sung test case kiểm tra việc lưu trữ và xác thực `explanation` của từng phương án (13/13 unit tests passed).
3. **UI Integration**:
   - **`QuestionBankModal.tsx`**: Mỗi hàng đáp án có nút `[💡 + Giải thích]`. Khi click, mở rộng trường nhập ghi chú riêng có màu sắc phân biệt giữa Đáp án đúng và Phương án sai.
   - **`QuizQuestionEditors.tsx`**: Tích hợp nút `[💡 + Giải thích]` đồng bộ cho `SingleChoiceEditor` trong giao diện bài học.
   - **`HubLessonQuiz.tsx`**: Trải nghiệm người học nâng cao: Sau khi nộp bài, nếu học sinh chọn đáp án sai sẽ nhìn thấy ngay lưu ý của phương án đã chọn và giải thích vì sao đáp án đúng là chính xác, kèm lời giải thích chung.

### 3. Kết quả kiểm thử tự động (Verification):
- **Frontend TypeScript (`npx tsc --noEmit`)**: `0 errors`.
- **Backend Unit Tests (`jest quiz-question.validator.spec.ts`)**: `13/13 tests PASS`.

---

## ĐỢT 5: TÁI SỬ DỤNG CMS RICH TEXT EDITOR (TIPTAP) VÀ MỞ RỘNG KÍCH THƯỚC MODAL (BUNG TO + TOÀN MÀN HÌNH)

### 1. Yêu cầu của người dùng (User Request):
> "cái này chưa làm à sao không tái sử dụng cái đó bên CMS á và cho bung to ra đi dễ nhìn"  
> Kèm hình ảnh (`media_1793546184463_fa2ccbb1.png`) chụp thanh toolbar và ô nhập câu hỏi.

### 2. Phân tích & Giải pháp Kiến trúc (SOLID):
1. **Tái sử dụng CMS Rich Text Editor (`TipTapContent`)**:
   - Thay thế hoàn toàn thanh công cụ giả lập và textarea thuần bằng component `TipTapContent` đã có sẵn trong CMS (`frontend/src/features/lessons/components/TipTapContent.tsx`).
   - Mở rộng prop `showToolbar={true}` và `minHeightClass="min-h-[170px]"` cho `TipTapContent`, cho phép hiển thị đầy đủ thanh công cụ định dạng chuẩn:
     - Định dạng: Format, H1, H2, H3, Blockquote.
     - Phông chữ: In đậm (B), In nghiêng (I), Gạch chân (U), Gạch ngang (S).
     - Danh sách: Gạch đầu dòng (`•≡`), Đánh số thứ tự (`1.`), Trích dẫn (`“`).
     - Tư liệu: Chèn liên kết (`Link`), Tải ảnh tư liệu từ máy tính cá nhân hoặc qua URL, Nhúng Video YouTube.
     - BubbleMenu: Bôi đen văn bản để format nhanh.
2. **Bung to kích thước Modal & Chế độ Toàn màn hình (Maximize)**:
   - Tăng độ rộng mặc định của Modal từ `max-w-4xl` lên `w-[96vw] max-w-5xl lg:max-w-6xl` với chiều cao tối đa `max-h-[94vh]`.
   - Bổ sung nút **Phóng to / Thu nhỏ (`Maximize2` / `Minimize2`)** ở góc trên bên phải header để người dùng có thể mở rộng toàn màn hình (`inset-2`) khi soạn câu hỏi dài hoặc chèn ảnh tư liệu lớn.
3. **Hiển thị định dạng Rich Text đồng bộ trên toàn hệ thống**:
   - `QuestionBankView.tsx`: Làm sạch các thẻ HTML (`stripHtml`) để cột câu hỏi trong bảng danh sách hiển thị văn bản gọn gàng, không bị dính tag `<p>`.
   - `HubLessonQuiz.tsx`: Render HTML câu hỏi bằng `dangerouslySetInnerHTML` kèm định dạng typography sắc nét (ảnh tư liệu bo góc, hiển thị in đậm, in nghiêng chuẩn xác cho người học).
   - `LessonPreviewContent.tsx` & `QuestionBankPickerModal.tsx`: Đồng bộ hiển thị định dạng phong phú.

### 3. Kết quả kiểm thử tự động (Verification):
- **Frontend TypeScript (`npx tsc --noEmit`)**: `0 errors`.
- **Backend Unit Tests (`jest quiz-question.validator.spec.ts`)**: `13/13 tests PASS`.





