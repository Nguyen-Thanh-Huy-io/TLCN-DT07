# 🗺️ Codebase Architecture & File Index — HisGo (TLCN-DT07)

> Đọc file này TRƯỚC khi tìm code. Mục tiêu: AI nhảy thẳng vào đúng file cần sửa, không cần `grep`/`find` cả repo.
> File này được viết dựa trên việc ĐỌC THẬT nội dung code (không suy đoán từ tên file). Khi thêm/xóa/đổi trách nhiệm module, cập nhật lại file này.

## Tổng quan
- `backend/`: NestJS + Prisma (multi-file schema) + PostgreSQL, Redis (cache + rate-limit + throttler storage), BullMQ (queue email), Winston (log), Prometheus (metrics), Swagger.
- `frontend/`: Next.js App Router + Tailwind + TipTap — gồm 2 phần: trang public "hisgo" (landing, chi tiết theo slug) và CMS quản trị nội dung (editor bài học dạng block là phần phức tạp nhất).
- `docs/`: Sequence diagram theo phase (phase1 → phase12) + tài liệu kiến trúc tổng.
- `data_research/`: dữ liệu nghiên cứu. `frontend/tests/`: Selenium/pytest UI tests (Python). `backend/test/`: e2e (supertest).

---

## 📁 BACKEND (`backend/src/`)
Pattern chung mỗi module: `*.controller.ts` (route) → `*.service.ts` (nghiệp vụ) → `*.module.ts` (DI), `dto/` (validate I/O).

### `auth/` — Đăng nhập, JWT, OAuth Google
- `auth.controller.ts`: `POST /auth` (đăng ký), `verify-email`, `resend-verification-email`, `GET|POST google` + `google/callback`, `login`, `refresh-token`, `logout`, `logout-all` — route nhạy cảm có `@Throttle`.
- `auth.service.ts`: nghiệp vụ create/verifyEmail/login/refreshToken/logout/logoutAllDevices; dùng bcrypt, rate-limit qua Redis, ghi activity log, đẩy email verification vào queue.
- `services/auth-utils.service.ts`: sign/verify JWT access & refresh token (JTI ngẫu nhiên), rate-limit helper trên Redis.
- `services/google-oauth.service.ts`: luồng OAuth2 Google (tạo authorization URL, xử lý callback, tạo/liên kết user).
- `auth.module.ts`: import `QueueModule`, export `AuthUtilsService` & `GoogleOAuthService` cho module khác (vd `AuthGuard`) dùng.

### `user/` — CRUD user thuần
`user.controller.ts` + `user.service.ts`: create/findAll/findOne/update/remove, không pattern đặc biệt.

### `topic/` — Chủ đề học tập dạng cây
- `topic.controller.ts`: `POST/GET /`, `GET /tree` (cây phân cấp), `GET/PATCH/DELETE /:id`, `PATCH /reorder`, `POST/DELETE /:id/children` (gán/huỷ con).
- `topic.service.ts`: CRUD + quản lý cây cha-con nhiều cấp (`MAX_DEPTH: 20`), reorder. Tạm thời gỡ liên kết trực tiếp giữa `Topic` và `Lesson`. `topic.constant.ts`: message/cache key cố định.

### `period/` — Giai đoạn lịch sử dạng cây
`period.controller.ts` (CRUD + `parentId` phân cấp) + `period.service.ts`/`interfaces/period.interface.ts`: CRUD + validate hierarchy, không Repository/Strategy riêng.

### `lesson/` — Bài học độc lập (nội dung block JSONB, review/duyệt, phân loại qua Tag)
- `lesson.controller.ts`: `POST/GET /`, `GET /slug/:slug`, `GET/PATCH/DELETE /:id`, `PATCH /:id/review` (đổi status duyệt).
- `lesson.service.ts`: tạo/sửa/xoá bài học độc lập (không phụ thuộc `Topic`), liên kết N-N với `Tag` qua `LessonTag`, hỗ trợ lọc theo `tagId`, workflow review DRAFT→REVIEW→PUBLISHED/REJECTED.
- `strategies/content-normalizer.strategy.ts`: **Strategy Pattern** — `ArrayBlockContentStrategy` vs `TipTapDocumentContentStrategy` chuẩn hoá nội dung JSONB (block array vs TipTap doc) + trích plain text.
- `helpers/slug.helper.ts`: `SlugHelper.generateSlug` — tiếng Việt có dấu → slug SEO.

### `historical-event/` — Sự kiện + knowledge graph quan hệ
- `historical-event.controller.ts`: CRUD + `POST :id/relations` (thêm quan hệ nhân-quả), `DELETE relations/:relationId`, `GET :id/graph` (đồ thị tri thức).
- `models/historical-event.domain-model.ts`: domain model thuần, tách khỏi Prisma (DIP).
- `repositories/`: **Repository Pattern** — `historical-event.repository.interface.ts` (port) + `historical-event.prisma.repository.ts` (Prisma impl) — dễ thay ORM.
- `strategies/`: **Strategy + Registry** — mỗi `EventCategory` (BATTLE, TREATY, NATURAL_DISASTER, Default) có strategy validate/normalize metadata riêng (`category-metadata.strategies.ts`), chọn qua `event-metadata-strategy.registry.ts` (OCP).

### `historical-entity/` — Nhân vật/thực thể (Person, Site, Organization...)
`historical-entity.controller.ts`: CRUD + `POST :id/relations`, `DELETE relation/:id`, `GET :id/graph`, `POST/DELETE :id/media`. `historical-entity.service.ts`: CRUD + cache Redis + graph quan hệ N-N hồi quy, gọi Prisma trực tiếp (không Repository riêng). `.constant.ts`: message/cache key.

### `learning-path/` — Lộ trình học: LearningPath → Chapter → ChapterLesson
CRUD lồng nhau (path/chapter/chapter-lesson, gán bài học vào chương, reorder); gọi Prisma trực tiếp + `SlugService`, không pattern đặc biệt.
> ⚠️ **Phân biệt với `topic/`**: `Topic` là thẻ phân loại độc lập theo môn học (không thuộc khóa học nào); `LearningPath`/`Chapter` là cấu trúc BÊN TRONG 1 khóa học cụ thể, tự chọn lại bài học có sẵn theo trình tự riêng. 1 Lesson có thể vừa thuộc 1 Topic vừa nằm trong nhiều Chapter của nhiều LearningPath. Xem ghi chú đầy đủ ở đầu `prisma/schema/learningPath.prisma` / `topic.prisma`.

### `quiz/` — Đề ôn tập cuối bài (lesson-level, KHÔNG phải khối Block Builder)
`quiz.controller.ts` (`GET/PUT/DELETE /lessons/:lessonId/quiz`) + `quiz.service.ts` (upsert validate qua `validators/quiz-question.validator.ts`). `Quiz` 1-1 với `Lesson`, `questions` là JSONB (không có bảng con) — 5 dạng câu hỏi (MULTIPLE_CHOICE/TRUE_FALSE/ORDERING/MATCHING/FILL_IN_BLANK) định nghĩa ở `types/quiz-question.types.ts`, cùng pattern với `Lesson.content`. Trước đây có khối `QUIZ` trong Block Builder — đã bỏ, chuyển hẳn thành thuộc tính cấp bài học.

### `tag/` — Tag (Phân loại N-N cho Lesson)
CRUD Tag đầy đủ + `attachTagsToLesson` (`POST /lessons/:id/tags`, chạy `$transaction` `deleteMany` + `createMany` trên bảng `LessonTag`) và `getLessonTags` (`GET /lessons/:id/tags`). `tag.constant.ts`: hằng số thông báo chuẩn.

### `upload/` — Upload file
`upload.controller.ts`: `POST /upload/image`, `POST /upload/document` — Multer `diskStorage` lưu vào `uploads/` cục bộ, không có service riêng ngoài validate loại file.

### `dashboard/` — Số liệu tổng quan CMS
`dashboard.service.ts`: **Facade method** `getOverview()` — `Promise.all` gom đếm Period/Topic/Lesson/HistoricalEvent, lesson theo status, hoạt động gần đây, bài chờ duyệt. Route duy nhất: `GET /overview`.

### `public-content/` — API public cho landing/trang chi tiết
- `landing-content.facade.ts`: **Facade** — `getLanding()` gom Period + section Topic + Figures + cache Redis, điểm vào duy nhất cho trang landing.
- `strategies/landing-section.strategy.ts` + `landing-section.registry.ts`: **Strategy + Registry + Template Method** — lớp trừu tượng `TopicSectionStrategy`, các lớp con (`ChaptersSectionStrategy`...) chỉ khai filter riêng, registry map section→strategy (OCP).
- `mappers/public-content.mapper.ts`: **Mapper** — hàm thuần format Prisma entity → DTO public (`formatYear`, `estimateReadMinutes`, `toTopic`...).
- Route: `GET landing`, `periods`, `period/:slug`, `figures`, `figure/:slug`, `topics`, `topic/:slug`.

### `metrics/` — Prometheus metrics
`metrics.service.ts` (Registry Histogram/Counter/Gauge), `metrics.controller.ts` (`GET /metrics`, `/metrics/json`), `metrics.interceptor.ts` (ghi duration/total mỗi request). Module `@Global()`.

### `common/` — Dùng chung toàn backend
- `services/prisma.service.ts`: wrapper PrismaClient (`@prisma/adapter-pg`), lifecycle connect/disconnect.
- `services/redis.service.ts`: cache get/set, xoá theo pattern (scan-based).
- `services/activity-log.service.ts`: ghi audit log (ActivityLogEvent + field thay đổi).
- `services/custom-logger.service.ts`: wrapper Winston (`LoggerService`).
- `services/email.service.ts`: gửi email nodemailer + template file.
- `services/slug.service.ts`: `generateUnique()` sinh slug duy nhất (callback `SlugExistsChecker`, DIP); `utils/slug.util.ts`: `toSlug`/`withSuffix` thuần.
- `guards/auth.guard.ts`: xác thực JWT access token + check `tokenVersion` DB (hỗ trợ revoke).
- `guards/custom-throttler.guard.ts` + `modules/rate-limit.module.ts`: rate-limit toàn cục, storage Redis, bỏ qua Swagger/metrics/health check.
- `filters/all-exception.filter.ts`: exception filter toàn cục, log Winston, chuẩn hoá response lỗi.
- `interceptors/transform.interceptor.ts`: chuẩn hoá response thành công `{ message, data }`.
- `queues/email/`: **Producer/Consumer (BullMQ)** — `email.queue.ts` (add job) / `email.processor.ts` (Worker xử lý gửi mail thật).
- `modules/*.module.ts` (logger/queue/rate-limit/redis): Nest module `@Global()` wiring hạ tầng.

---

## 📁 DATABASE (`backend/prisma/`)
- `schema/base.prisma`: generator + datasource (Postgres).
- `schema/enums.prisma`: toàn bộ enum dùng chung (ContentStatus, EventCategory, EventRelationType, DatePrecision, HistoricalEntityType...).
- `schema/auth.prisma`: `authUser` (role/status/tokenVersion) 1-1 `authSecurity` (MFA/lockout), 1-1 `userProfile`, 1-n `loginHistory`/`emailHistory`/`ActivityLogEvent`/`Subscription`.
- `schema/profile.prisma`: `userProfile` (họ tên, bio, avatar).
- `schema/activityLog.prisma`: `ActivityLogEvent` 1-n `ActivityLogEventDetail` (audit log theo table/record).
- `schema/history.prisma`: `loginHistory` (geo/device, suspicious flag), `emailHistory` (status/retry).
- `schema/subscription.prisma`: `Subscription`→`SubscriptionPlan`, 1-n `Payment`/`Invoice` — **model đầy đủ nhưng CHƯA có service/module tương ứng trong `src/`**.
- `schema/topic.prisma`: `Topic` tự quan hệ cha-con (`TopicHierarchy`).
- `schema/period.prisma`: `Period` tự quan hệ cha-con, 1-n `HistoricalEntity`, 1-n `HistoricalEvent`.
- `schema/lesson.prisma`: `Lesson` (`content` JSONB, `contentRichText`, status DRAFT/REVIEW/PUBLISHED/ARCHIVED), độc lập với `Topic`, liên kết n-n với `Tag` qua `LessonTag` và n-n với `Chapter` qua `ChapterLesson`.
- `schema/learningPath.prisma`: `LearningPath` 1-n `Chapter` 1-n `ChapterLesson` (bảng nối n-n Chapter↔Lesson).
- `schema/quiz.prisma`: `Quiz` 1-1 `Lesson` (`lessonId @unique`), `questions Json @db.JsonB` — không có bảng câu hỏi riêng, validate ở DTO/service layer.
- `schema/tag.prisma`: `Tag` + `LessonTag` (`lesson_tags`, quan hệ N-N giữa `Lesson` và `Tag`).
- `schema/historicalEntity.prisma`: `HistoricalEntity` (Person/Organization/Dynasty/Force/Artifact/Location) gắn `Period`, 1-1 mở rộng `Person`/`HistoricalSite`, n-n qua `HistoricalEventEntity`, tự quan hệ đồ thị `HistoricalEntityRelation`, 1-n `HistoricalEntityMedia`.
- `schema/historicalEvent.prisma`: `HistoricalEvent` gắn `Period` + `location` (HistoricalEntity), tự quan hệ cha-con, n-n `HistoricalEventEntity` (role/isPrimary), 1-n `HistoricalEventMedia`, tự quan hệ đồ thị nhân-quả `HistoricalEventRelation` (CAUSES/PRECEDES/...).
- `relation-rules.json`: quy tắc quan hệ thực thể (code, forward/reverseLabel, allowedSources/Targets, inverseCode) cho knowledge graph.
- `seed.ts`: xoá dữ liệu lịch sử cũ theo FK (gồm `learningPath.deleteMany()`) rồi tạo admin + dữ liệu mẫu "Kháng chiến chống Mỹ, cứu nước (1954-1975)" + 1 `LearningPath` mẫu (3 Chapter, mỗi Chapter 3 bài học thật dùng lại từ Topic tree). Đã bỏ seed 6 "Chủ đề kiến thức" (Văn hóa & Đời sống...) — đó là danh mục landing page, không phải Topic bài học thật, gây rối cây phân cấp.
- `migrations/`: lịch sử migration tự động. `migrations_manual/`: SQL thủ công.

---

## 📁 FRONTEND (`frontend/src/`)

### Routing (`app/`) — Public
- `page.tsx`: trang chủ (Server Component), gọi `fetchLandingContent()`, render Hero + Timeline/Chapters/Figures/Periods/Topics/Newsletter.
- `chuong-su/[slug]/page.tsx`: chi tiết Chương sử/Chuyên đề (`fetchTopicBySlug`).
- `giai-doan/[slug]/page.tsx`: chi tiết Giai đoạn lịch sử (`fetchPeriodBySlug`).
- `kien-thuc/[slug]/page.tsx`: chỉ re-export `ChapterDetailPage` của `chuong-su/[slug]`.
- `nhan-vat/[slug]/page.tsx`: hồ sơ nhân vật (`fetchFigureBySlug`).
- `api/subscribe/route.ts`: POST đăng ký newsletter, chống bot (honeypot) + validate email — **lưu vào `Set<string>` RAM (stub), mất khi restart server, chưa nối DB.**

### Routing (`app/`) — CMS
- `events/`, `entities/`, `locations/`, `tags/`, `users/`, `review/`: mỗi trang chỉ render list component tương ứng (`EventList`, `EntityList`, `LocationList`, `TagList`, `UserList`, `ReviewList`).
- `topics/`, `lessons/`: **KHÔNG còn trang danh sách (`page.tsx`) riêng** — đã bị xoá vì trùng lặp với `/curriculum` (Topic trùng tab "Cây phân cấp Chủ đề", Lesson trùng tab "Thư viện Lesson" trong HISGO Studio). Chỉ còn `create/page.tsx` và `[id]/page.tsx` (form tạo/sửa) dưới mỗi thư mục — vẫn được điều hướng tới từ `/curriculum`.
- `periods/page.tsx`: **không render gì, chỉ `redirect` sang `/curriculum`** (route cũ đã gộp).
- `curriculum/page.tsx`: Client Component, 2 chế độ xem — "HISGO Studio" (`HisgoStudioView`, biên soạn Lộ trình/Chương) và "Cây chủ đề" (`CurriculumExplorer`, Topic). **Đây là trang trung tâm duy nhất** cho cả Topic và LearningPath — mọi nút "Quản lý Chủ đề"/"Quản lý bài học" ở nơi khác (Dashboard, breadcrumb...) đều trỏ về đây, không còn trỏ tới `/topics` hay `/lessons`.
- `knowledge/page.tsx`: render `KnowledgeHub` — hub tra cứu địa danh/nhân vật/sự kiện/thẻ.
- `cms/page.tsx`: render `DashboardView` (KPI dashboard).

### Tầng services (`services/`)
- `api.ts`: axios client dùng chung — có `AuthSessionManager` singleton tự đăng nhập ngầm bằng tài khoản admin cứng khi chưa có token, interceptor gắn Bearer + tự retry 1 lần khi 401, trả `{data: []}` khi lỗi network (giả lập offline mode); export `parsePaginatedResponse`/`extractErrorMessage`.
- `entities/*.service.ts`: mỗi file 1 resource CRUD — `dashboard`, `historical-entity`, `historical-event`, `landing` (có fallback data tĩnh khi offline), `learning-path`, `lesson`, `period`, `tag`, `topic`, `upload`.
- `navigation/navigation-strategy.service.ts`: **Strategy + Facade** — 4 strategy nhóm route sidebar (Dashboard/Curriculum/KnowledgeBase/Operations), `NavigationFacade` singleton cung cấp nav groups/breadcrumb/active page.

### UI dùng chung (`components/`)
- `common/`: `FormField`, `HistoricalDateRangeField` (mốc thời gian TCN/CN linh hoạt), `SearchableGroupedSelectField`, `ParentContextComboboxField`, `EntityAutocompleteChipsField`, `EntityRelationRepeaterField`, `KnowledgeRelationManager`, `EntityDetailLayout` (layout stepper dùng chung các trang chi tiết Event/Entity/Location), `ConfirmDeleteModal`, `TabbedRichTextEditor` (wrap `TipTapContent` của lessons), `ActionMenu`/`Avatar`/`Badge`/`ContentCell`/`StatCard`/`UserCell`.
- `layout/`: `ClientLayout` (khung CMS, lưu collapse sidebar vào localStorage), `Sidebar`/`Topbar` (dùng `navigationFacade`), `PageHeader`.
- `hisgo/`: UI landing public — `Header`/`Footer`, `ChapterCard`/`EraCard`/`FigureCard`/`TopicTile`, `NewsletterBanner` (POST `/api/subscribe`), `PublicDetailView`+`PublicLessonCard`, `SafeImage` (fallback khi lỗi/`USE_IMAGES=false`), `ScrollRevealProvider`, `VideoModal`.
- `sections/hisgo/` (ở `src/sections/hisgo/`, không phải `components/`): `HeroSection`, `HomeSections` (gom các section trang chủ), `TimelineStrip`.

### Features khác (`features/<x>/`)
- `topics/`: `TopicForm`/`TopicModal`/`TopicEditor` (form tạo/sửa, điều hướng về `/curriculum` sau khi lưu) + `TopicParentModalPicker` (chọn parent qua modal cây) + `TopicCoverImagePicker` (tab Upload/URL). **Không còn `TopicList`** — xem Cây phân cấp Chủ đề trong `curriculum/`.
- `curriculum/`: xem mục riêng ngay dưới đây — đây là module trung tâm cho cả Topic tree và Lộ trình học.
- `periods/`: `PeriodList`/`PeriodForm`/`PeriodModal`/`PeriodEditor` (tái dùng `TopicCoverImagePicker` từ feature `topics`).
- `tags/`: `TagList` (có mock fallback)/`TagForm` (gọi `api` trực tiếp)/`TagModal`.
- `locations/`: chỉ `LocationList` + `LocationModal` (CRUD hoàn toàn qua modal, không `Form`/service class riêng).
- `review/`: chỉ `ReviewList` + `ReviewModal` (approve/reject có nhập reason).
- `users/`: chỉ `UserList` — đơn giản nhất, không `Form`/`Modal`.

### `features/curriculum/` — Topic tree + Lộ trình học (module trung tâm `/curriculum`)
- `components/CurriculumExplorer.tsx`: tab "Cây phân cấp Chủ đề" — tải `TopicApiService.getTopicTree()`, hiển thị `CurriculumTree` (cây) + `CurriculumDetailPane` (panel chi tiết node đang chọn, master-detail resizable). Node Topic có nút "+ Thêm chủ đề con"/"Thêm bài học"/"Sửa chủ đề"/Xoá ngay trong panel chi tiết — đây là nơi DUY NHẤT quản lý Topic (không còn trang bảng riêng).
- `components/CurriculumTree.tsx` / `CurriculumDetailPane.tsx`: hiển thị cây + panel chi tiết thuần, logic render theo loại node nằm ở `strategies/node-detail.strategy.tsx` (Strategy theo `CurriculumNodeType`).
- `components/HisgoStudioView.tsx`: tab "HISGO Studio" — 2 tab con `CURRICULUM` (Chương & nhóm) / `LESSON_LIBRARY` (Thư viện Lesson). Tab Chương & nhóm theo mô hình **List → Detail**: không chọn `pathId` thì hiện `LearningPathListPanel` (danh sách Lộ trình dạng card); chọn 1 Lộ trình (đồng bộ qua URL `?pathId=`, không dùng dropdown) thì hiện `LearningPathToolbar` (tiêu đề + nút quay lại danh sách) + `ChapterList`.
- `components/studio/ChapterList.tsx`: danh sách Chương của 1 Lộ trình — có phân trang + 2 chế độ xem (Accordion xổ chi tiết bài học / List dạng bảng gọn), kéo-thả hoặc ▲▼ đổi thứ tự bài học trong Chương, bấm vào bài học để mở soạn thảo trực tiếp.
- `components/studio/LearningPathListPanel.tsx`: danh sách tất cả Lộ trình (card), bấm vào để sang màn chi tiết.
- `components/studio/LearningPathToolbar.tsx`: thanh tiêu đề màn chi tiết 1 Lộ trình — nút quay lại danh sách + Sửa + Xuất bản/Chuyển nháp.
- `components/studio/LessonLibraryPanel.tsx`: tab Thư viện Lesson — danh sách bài học độc lập, có phân trang + chế độ xem Lưới/Danh sách, mở soạn thảo hoặc xoá.
- `components/studio/modals/CreateChapterModal.tsx`: tạo Chương mới — CHO PHÉP chọn bài học từ thư viện và sắp xếp thứ tự (▲▼) ngay trong modal trước khi tạo (gọi `createChapter` rồi `addLessonsToChapter` theo đúng thứ tự đã sắp).
- `components/studio/modals/AddLessonsToChapterModal.tsx`: gom thêm bài học vào 1 Chương ĐÃ CÓ sẵn (khác với CreateChapterModal — việc gom thêm sau khi tạo).
- `components/studio/modals/LearningPathFormModal.tsx`: tạo/sửa Lộ trình — không còn field "Phân loại lộ trình" (Niên đại/Chuyên đề), trường đó không có tác dụng lọc/hiển thị gì ở phía Lộ trình.

### `types/`, `constants/`, `data/`, `utils/`
- `types/models/*.type.ts`: interface domain thuần theo resource; `table.types.ts`: `ColumnDef<T>` cho `DataTable`.
- `constants/`: `enums.ts` (đồng bộ enum Prisma), `icons.ts`, `routes.ts` (`APP_ROUTES`), `ui-theme.ts`, `navigation.ts`.
- `data/*.ts`: dữ liệu tĩnh fallback cho landing khi backend offline (chapters/eras/figures/hero/newsletter/timeline/topics).
- `utils/history-year.utils.ts`: chuẩn hoá hiển thị niên đại Việt Nam (TCN/BCE).

---

## 📁 `features/lessons/` — trình soạn bài dạng block (module phức tạp nhất)

> ⚠️ Module này **KHÔNG có thư mục `hooks/`** — toàn bộ state/logic (vai trò hook) nằm ở `facades/`.

### Trạng thái các loại khối (block types) trong Block Builder
Đã hoàn chỉnh (có editor UI thật): `TEXT`, `TIMELINE`, `CHARACTER`, `EVENT`, `IMAGE`, `VIDEO`, `SECTION_ROW` (layout nhiều cột, đệ quy), `MAP` (`MapBlockItemEditor.tsx`), `COMPARISON_TABLE` (`ComparisonTableBlockItemEditor.tsx`).
`QUIZ` **không còn là khối Block Builder** — đã chuyển thành tính năng cấp bài học riêng (xem `quiz/` dưới, tab "Đề ôn tập" trong Panel Thuộc tính), bỏ khỏi `BlockBuilderCanvas.tsx` và `block-palette.constants.ts`.
`RESOURCE_LINK` không còn là khối chèn rời rạc giữa nội dung — quản lý tập trung ở tab "Xuất bản" (Panel Thuộc tính), luôn xuất ra cuối bài.
Placeholder `"Khối nội dung {type}"` chỉ còn là `default:` fallback cho type không xác định, hiện không còn type nào rơi vào case này.

### `quiz/` — Đề ôn tập cuối bài (frontend, lesson-level — KHÔNG phải khối Block Builder)
- `types/quiz.types.ts`: `QuizQuestionType` (5 dạng: MULTIPLE_CHOICE/TRUE_FALSE/ORDERING/MATCHING/FILL_IN_BLANK) + interface từng dạng + `QUIZ_QUESTION_TYPE_META` (label/màu).
- `facades/useQuizEditor.ts`: state 1 đề ôn tập cho 1 lessonId — tải/lưu qua `services/entities/quiz.service.ts`, dùng CHUNG 1 instance cho cả tab "Đề ôn tập" và phần hiển thị cuối bài ở tab "Xem trước" (truyền qua prop, không gọi API 2 lần).
- `components/quiz/AddQuestionMenu.tsx` (popover chọn dạng câu hỏi), `QuizQuestionCard.tsx` (card thu gọn/mở + ▲▼✕), `QuizQuestionEditors.tsx` (form riêng từng dạng).
- `components/LessonQuizPanel.tsx`: nội dung tab "Đề ôn tập" trong Panel Thuộc tính, nhận `quiz` qua prop.

### `components/` (cấp gốc)
- `LessonEditor.tsx` (~500 dòng, đã tách từ ~1400 dòng): điều phối — giữ `useLessonEditorFacade` + `useLessonBlockManager` + state UI, phần hiển thị tách ra các file con dưới đây (giống pattern đã dùng cho `HisgoStudioView.tsx`).
  - `LessonEditorHeader.tsx`: Tầng 1 — Thoát (quay lại `/curriculum`, không còn `/lessons`)/tiêu đề/badge trạng thái, auto-save, nút Thuộc tính, Gửi duyệt/Cập nhật, menu "•••".
  - `LessonEditorSubHeader.tsx`: Tầng 2 — chuyển Soạn thảo/Chia đôi/Xem trước, ẩn/hiện cột khối, Toàn màn hình.
  - `LessonLeftToolSidebar.tsx`: cột trái "Thêm khối"/"Mục lục", thu gọn thanh icon hoặc mở rộng.
  - `LessonPreviewContent.tsx`: bản xem trước Wiki-style — Mục lục + HTML được biên dịch TRỰC TIẾP từ danh sách khối (`utils/lesson-toc.util.ts`, không còn regex dò `<h1-3>` trên chuỗi HTML đã ghép sẵn), và hiện Đề ôn tập (quiz) ở cuối bài.
  - `properties/LessonPropertiesPanel.tsx`: Cột 3 — aside 4 tab (Phân loại/Media/Đề ôn tập/Xuất bản), gồm `LessonClassificationTab.tsx`/`LessonMediaTab.tsx`/`LessonPublishingTab.tsx` + `LessonQuizPanel.tsx` (xem mục `quiz/`).
- `utils/lesson-toc.util.ts`: `buildLessonTocAndHtml(blocks)` — sinh Mục lục đầy đủ (tiêu đề trong khối Văn bản + nhãn đại diện cho Timeline/Nhân vật/Sự kiện/Bản đồ/Bảng so sánh) kèm HTML có gắn id neo khớp từng mục.
- `LessonBlockPalette.tsx`: danh sách khối kéo-thả (drag `application/x-lesson-block`), nhóm Cơ bản/Chuyên biệt. `QUIZ` đã bị gỡ khỏi palette.
- `LessonLeftSidebar.tsx`: sidebar trái card loại bài học + TOC + Quick Settings — **hiện không được dùng trong `LessonEditor`**.
- `LessonHeaderMetaForm.tsx`: form metadata (tiêu đề, slug, độ khó, tags inline, mô tả có đếm ký tự, ảnh đại diện).
- `AutoSaveIndicator.tsx`: hiển thị trạng thái IDLE/PENDING/SAVED/ERROR/SYNCING, tự cập nhật "x phút trước".
> ⚠️ **Không còn `LessonList.tsx`** / trang `/lessons` (list) — đã gộp vào tab "Thư viện Lesson" của `HisgoStudioView` (xem `features/curriculum/`) để tránh trùng lặp giao diện. `/lessons/create` và `/lessons/[id]` (trình soạn thảo) vẫn giữ nguyên.
- `TipTapContent.tsx`: wrapper editor TipTap chính — StarterKit + NodeView tùy biến (Image/Video/Timeline/Character/Event), BubbleMenu, `handleDrop` chèn snippet qua `lessonBlockInsertStrategy`.
- `TipTapToolbar.tsx`: toolbar định dạng đầy đủ + upload ảnh + chèn URL ảnh/YouTube + menu "+" (callout/mốc thời gian/thẻ nhân vật-địa danh).
- `LessonDifficultySelector.tsx`, `LessonMediaManager.tsx`, `LessonOrderField.tsx` (dùng `LessonTimelineStrategy`), `LessonTagPicker.tsx`, `LessonTopicModalPicker.tsx` (modal chọn chủ đề có breadcrumb phân cấp).

### `components/builder/` — Block Builder (page-builder, Composite Pattern)
- `BlockBuilderCanvas.tsx`: canvas chính — gom block liền kề thành "visual row" theo `BlockWidthStrategy`, dispatch render theo `LessonBlockType`, kéo-thả sắp xếp/chèn mới.
- `RowSectionBlockEditor.tsx`: editor khối "Hàng nhiều cột" (đổi số cột 1-4, preset tỷ lệ, kéo-thả khối con vào cột, validate qua `BlockPlacementRuleEngine`).
- `ColumnResizer.tsx`: kéo resize 2 cột, snap 5% (`RowLayoutStrategy`).
- `BlockCardWrapper.tsx`: khung bọc block (drag handle, dropdown chiều rộng, nút di chuyển/xoá).
- `TextBlockEditor.tsx`: soạn văn bản inline + Modal "Zen" toàn màn hình.
- `TimelineBlockItemEditor.tsx`: editor Timeline trong canvas — thêm mốc thủ công/từ `EventPickerModal`, đổi hướng trục, mở `TimelineNodeCanvasDrawer` viết chi tiết từng mốc.
- `CharacterBlockItemEditor.tsx` / `EventBlockItemEditor.tsx`: editor khối Nhân vật/Sự kiện, liên kết `EntityPickerModal`/`EventPickerModal`.
- `TimelineNodeCanvasDrawer.tsx`: drawer toàn màn hình kiểu "Google Docs" viết nội dung chuyên sâu cho 1 mốc timeline (dùng `TipTapContent`).
- `AddBlockDivider.tsx`: vạch chèn giữa block — click mở popover hoặc kéo-thả từ palette.

### `components/blocks/` — NodeView TipTap (khác Block Builder — dùng trong rich-text editor)
- `AddBlockBelowMenu.tsx`: popover "+ thêm khối bên dưới" dùng chung mọi NodeView.
- `HistoricalTimelineBlock.tsx`: component Timeline độc lập (state nội bộ), định nghĩa type `TimelineNode`/`TimelineNodeMedia` dùng chung toàn module.
- `CharacterBlockView.tsx` / `EventBlockView.tsx`: NodeView form inline cho Nhân vật/Sự kiện + nút liên kết entity picker.
- `EntityPickerModal.tsx` / `EventPickerModal.tsx`: modal 2 nguồn (HISGO nội bộ / Wikipedia), debounce search 350ms, preview Wikidata QID/license ảnh Commons.
- `ImageBlockView.tsx`: NodeView ảnh (upload/URL/thư viện mẫu, giới hạn 10MB).
- `TimelineBlockView.tsx`: NodeView Timeline trong TipTap (parse `nodes` từ JSON string attribute).
- `VideoBlockView.tsx`: NodeView video (Upload/URL/Embed iframe, auto-convert YouTube link, giới hạn 50MB).

### `facades/` — thay vai trò `hooks/` của module
- **`useLessonEditorFacade.ts`**: state nghiệp vụ & vòng đời bài học (title/slug/description/topic/content/difficulty/status/tags/media...), tải Topics + bài học theo topic để auto-suggest `displayOrder`, **auto-save vào `localStorage`** (`hisgo_draft_lesson_{id}`, debounce 1500ms, có restore/dismiss draft), nạp lesson có sẵn hoặc data mẫu khi tạo mới, tính `wordCount`/`estimatedReadMinutes`, `submitLesson()` (validate + create/update + gắn tag + xoá draft + điều hướng).
- **`useLessonBlockManager.ts`**: quản lý mảng block (Composite, `RowSectionBlockData` lồng cột) — CRUD block, di chuyển, `compileToHtml`/`compileToJson`, `loadFromContent`, quản lý hàng nhiều cột (`setRowColumnCount`/`setRowRatio`/add-update-removeBlockFromColumn`), `splitBlockIntoRow` (biến 1 block thường thành `SECTION_ROW` khi kéo vào mép).

### `factories/`
- `lesson-block.factory.ts`: `createDefaultBlock(type)` sinh data mẫu lịch sử; `blockToHtml(block)` chuyển block→HTML preview.
- `entity-source-strategy.factory.ts`: factory Map `EntitySourceType → IEntityDataSourceStrategy` (HISGO/Wikipedia).

### `strategies/`
- `block-width.strategy.ts`: ma trận chiều rộng cho phép/mặc định theo loại block, tính fraction gom visual row.
- `lesson-block-insert.strategy.ts`: sinh snippet HTML để chèn vào TipTap khi kéo-thả/"thêm khối bên dưới".
- `lesson-timeline.strategy.ts`: tính thứ tự ảo + câu giải thích vị trí cho `LessonOrderField`.
- `row-layout.strategy.ts`: tính snap cột, `grid-template-columns`, compile HTML cho `SECTION_ROW`.
- `timeline-layout.strategy.ts`: layout CSS khác nhau cho Timeline dọc vs ngang.
- `entity-sources/` (adapter tra cứu ngoài): `entity-source.interface.ts` (Strategy interface), `hisgo-internal-source.strategy.ts`, `wikipedia-source.strategy.ts` (tích hợp Wikipedia+Wikidata+Commons), `wikidata-claims.adapter.ts`, `wikimedia-commons.adapter.ts`, `wikipedia.adapter.ts`.

### `rules/`, `templates/`, `types/`
- `rules/block-placement.rule.ts`: `BlockPlacementRuleEngine` — SECTION_ROW không lồng trong cột; TIMELINE cần cột ≥50%; QUIZ chỉ ở Root; COMPARISON_TABLE cần cột ≥40%.
- `templates/`: `lesson-template.factory.ts` (registry Map, `registerStrategy` cho OCP) + `strategies.ts` (5 mẫu: STANDARD/MILITARY_CAMPAIGN/HISTORICAL_FIGURE/TREATY_CONFERENCE/BLANK) — dùng trong dropdown "Mẫu bố cục".
- `types/`: `editor.types.ts`, `block-builder.types.ts` (discriminated union `LessonBlockItem`), `block-palette.types.ts`, `entity-source.types.ts`, `header-meta.types.ts`, `left-sidebar.types.ts`.

---

## 📁 DOCS (`docs/`)
Sequence diagram theo phase (mỗi file có mermaid `sequenceDiagram` + SOLID/pattern áp dụng):
- Phase 1: Public Content API cho Landing (slug Period/Topic).
- Phase 2: `HistoricalEntity` & quan hệ hồi quy (Knowledge Graph nhân vật).
- Phase 3: `HistoricalLocation` (địa danh, GPS, phân cấp).
- Phase 4: `HistoricalEvent` → Master Data + Knowledge Graph.
- Phase 5-6: Lesson↔Knowledge Graph, `/review`, `NewsletterSubscriber` (ghi rõ `/api/subscribe` chỉ lưu RAM, cần nối DB).
- Phase 7: Public Detail Pages theo slug (Facade + Mapper).
- Phase 8: CMS Detail View & Edit Modals.
- Phase 9: Event CMS detail layout (`EntityDetailLayout` stepper 6 bước).
- Phase 10: Event Tree Table Hierarchy (Composite Pattern).
- Phase 11: Repository Pattern cho `HistoricalEvent` (DIP).
- Phase 12: `HistoricalEventRelation` — quan hệ nhân quả phi cấu trúc cây.
- `docs/map-parts/` (be-core, be-domain, fe-lessons): bản đồ module từng phần. `docs/plans/`: kế hoạch triển khai. `topic-*-sequence.md`: luồng topic hierarchy/reorder riêng. `universal-history-knowledge-architecture.md`, `knowledge-graph-relation-rules-architecture.md`: kiến trúc tri thức tổng.

---

## ⚠️ Các điểm "chưa xong" / stub cần biết trước khi sửa
- **`tag` ↔ `lesson`**: API `attach-lesson-tags`/`get-lesson-tags` là stub trả `[]`, Prisma chưa có model nối Tag↔Lesson riêng — cần xác minh lại kỹ trước khi dựa vào Tag để thay thế vai trò phân loại của Topic (đã có người đề xuất ý này, CHƯA làm, premise còn chưa chắc đúng).
- **Cây phân cấp Chủ đề chưa có kéo-thả/▲▼ đổi thứ tự bài học trong 1 Topic** (khác với Chương trong Lộ trình — `ChapterList.tsx` đã có đầy đủ). Đổi thứ tự Topic cũng chưa có UI từ khi bỏ trang `/topics` (trang cũ có nút ▲▼ theo nhóm cùng cấp, chưa được chuyển sang Cây phân cấp Chủ đề).
- **Newsletter**: `app/api/subscribe/route.ts` lưu email vào `Set` trong RAM, mất khi restart server — chưa nối DB (dù Prisma không có model `NewsletterSubscriber` tương ứng rõ ràng, cần kiểm tra lại khi làm phase 5-6).
- **`app/periods/page.tsx`**: chỉ redirect sang `/curriculum`, route cũ chưa dọn.
- **`Subscription`/`Payment`/`Invoice`** (Prisma `subscription.prisma`): có model DB đầy đủ nhưng **chưa có module/service nào trong `backend/src/`** dùng tới.
- **`LessonLeftSidebar.tsx`**: tồn tại nhưng không được `LessonEditor.tsx` sử dụng hiện tại.

---

## Cách thêm feature (quy trình)
Sequence Diagram (`docs/`) → Backend (DTO→Service→Controller, áp dụng Strategy/Factory/Facade/Repository đúng pattern module đang dùng, không magic string → `*.constant.ts`) → UI (service→component→page) → Test (supertest `backend/test/` + Selenium `frontend/tests/`).
