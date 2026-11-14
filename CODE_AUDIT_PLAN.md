# 📋 KẾ HOẠCH XỬ LÝ CODE_AUDIT.md

> Theo dõi tiến độ xử lý các vi phạm/lỗi liệt kê trong [CODE_AUDIT.md](CODE_AUDIT.md).
> Nhóm đã xử lý: **Mục 7 🔴 Bug / rủi ro vận hành thật** (4/6 mục đã sửa, 2 mục còn lại chuyển vào Pha 1 dưới đây — enum `UserRole` lệch Prisma, base URL hardcode).
> Mỗi pha nên tách 1 (hoặc vài) PR riêng để dễ review/rollback, không gộp chung với pha khác.

### ✅ Đã làm kèm Pha 0 (không phải pha riêng, nhưng cần ghi lại)
- Phát hiện `blog.controller.spec.ts` **fail thật** sau khi thêm `@UseGuards(AuthGuard)` (NestJS không resolve được `RedisService`/`PrismaService`) — đã sửa bằng `overrideGuard(AuthGuard)` theo đúng pattern có sẵn ở `user.controller.spec.ts`, thêm 2 test xác nhận `updatePost`/`deletePost` truyền đúng `userId`/`role`.
- Thêm `blog.service.spec.ts` (file test mới — module này trước đây chưa có) test trực tiếp `assertCanModifyPost`: tác giả/STAFF được sửa-xóa, người khác bị chặn `ForbiddenException`, bài không tồn tại báo `NotFoundException`. 3 test suite / 16 test đều pass.
- Chạy `eslint --fix` (chỉ Prettier, không đổi logic — đã verify lại bằng test+tsc) trên 4 file đã sửa ở Pha 0 để không để lại lỗi format mới; 6 lỗi `no-unused-vars` có sẵn từ trước trong các file đó giữ nguyên, gộp vào việc dọn lint ở Pha 4.
- **Chưa làm** (nằm trong Pha 1-4, không phải Pha 0): fix các claim còn lại ở Mục 7 (enum `UserRole`, base URL), và toàn bộ 718+1052 lỗi lint có sẵn trên phần code chưa đụng tới.

---

## Pha 1 — Dọn kiến trúc lan rộng (chủ yếu tìm-thay, rủi ro thấp)

> **🔎 Phát hiện mới khi rà soát chi tiết Pha 1 bằng `git grep` & đọc `base.prisma`:**
> 1. **Đính chính mục Import Prisma (`@prisma/client` vs `generated/prisma/client`)**: `backend/prisma/schema/base.prisma` khai báo `provider = "prisma-client-js"` **không có `output`**, thư mục `backend/generated` hoàn toàn không tồn tại, và **45/45 file** trong `backend/src` đều đang import từ `@prisma/client`. Nếu đổi sang `generated/prisma/client` sẽ làm gãy toàn bộ build/test của backend. Thay vào đó: đã đính chính `CLAUDE.md` theo đúng chuẩn `@prisma/client`, và ở Pha 1 chỉ cần xoá dòng comment chết `generated/prisma/client` trong `prisma.service.ts` + xoá `moduleNameMapper` thừa trong `backend/package.json`.
> 2. **Phát hiện kéo theo của `UserRole` lệch Prisma**: Ngoài `auth.interface.ts` và `canModifyRole()`, còn có `AUTH_CONFIG.ROLE_HIERARCHY` (`auth.config.ts:43`, `auth.service.spec.ts:39`) dùng key `CUSTOMER`/`SUPER_ADMIN` (dead config chỉ phục vụ `canModifyRole`), và 3 chỗ ép kiểu `user.role as unknown as UserRole` (`auth.service.ts:557,766`, `google-oauth.service.ts:562`). Khi đổi `IAccessTokenPayload.role` sang `userRole` của Prisma sẽ xoá luôn được cả 3 chỗ ép kiểu `as unknown as` này.
> 3. **Danh sách chính xác 19 file Frontend hardcode Base URL**: Gồm 14 file client/SSR/socket (`services/api.ts`, `public-auth.service.ts`, `account.service.ts`, `public-content.service.ts`, `landing.service.ts`, `community/api.ts`, `CommunityFeed.tsx`, `CommunityProfileView.tsx`, `PostCommentModal.tsx`, `ModerationDashboardView.tsx`, `NotificationBell.tsx`, `BlogCreatePage.tsx` [đang lệch sang port `5001`!], `BlogReviewList.tsx`, `TopicCoverImagePicker.tsx`) và 5 route handler (`app/api/notes/route.ts`, `app/api/notes/[id]/route.ts`, `app/api/public/lessons/route.ts`, `app/api/public/quizzes/[id]/statistics/route.ts`, `app/api/public/quizzes/[id]/submit/route.ts`).
> 4. **Lưu ý cập nhật Unit Test đi kèm Pha 1**:
>    - Khi thống nhất `AUTH_CONFIG.BCRYPT_SALT_ROUNDS = 12`, cần cập nhật `user.service.spec.ts:103,199` (đang hardcode assert `10`).
>    - Khi bỏ tự bọc `{statusCode, message, data}` ở `note.service.ts`, cần cập nhật `note.service.spec.ts` (4 test case đang assert `res.statusCode` / `res.data`). Phía FE `features/notes/services/note.service.ts` đang đọc `result.data?.data || result.data` nên tương thích sẵn và có thể dọn gọn.

- [x] **[ĐÃ ĐÍNH CHÍNH ✅] Import Prisma**: Xác nhận `@prisma/client` là chuẩn thật của repo (`base.prisma` không dùng custom output); đã cập nhật `CLAUDE.md` và `CODE_AUDIT.md`. Đã dọn nốt mapping `^generated/prisma/client$` thừa trong `backend/package.json`.
- [x] **[ĐÃ SỬA ✅] Base URL API hardcode** (19 file frontend, 3 giá trị khác nhau: `127.0.0.1:5000`/`localhost:5000`/`localhost:5001`) — đã tạo `frontend/src/constants/api-url.ts` export `API_BASE_URL`, `INTERNAL_API_BASE_URL` (cho SSR/route handler `app/api/**`), `AUTH_HEADER_NAME`, `GUEST_ID_HEADER_NAME` và helper `resolveBackendAssetUrl()`, thay thế toàn bộ 19 file.
- [x] **[ĐÃ SỬA ✅] Code chết trong `backend/src/common/services/prisma.service.ts`** — đã xoá 25 dòng class cũ bị comment lại ở đầu file; đọc `database_url` qua `app.config.ts`.
- [x] **[ĐÃ SỬA ✅] Enum `UserRole` lệch Prisma + `AuthUtilsService.canModifyRole()`** — đã đổi `auth.interface.ts` dùng `userRole` từ `@prisma/client` (`export { userRole as UserRole }`), bỏ 3 chỗ `as unknown as UserRole` ở `auth.service.ts` & `google-oauth.service.ts`, xoá dead code `canModifyRole()` và `ROLE_HIERARCHY` (`auth.config.ts`, `auth.service.spec.ts`).
- [x] **[ĐÃ SỬA ✅] `backend/src/common/guards/auth.guard.ts`** — đã xoá dead method `extractTokenFromCookies`; đổi magic string `'ACTIVE'` sang enum `userStatus.ACTIVE` của Prisma.
- [x] **[ĐÃ SỬA ✅] Salt rounds bcrypt không nhất quán** (12 ở `auth.service.ts` vs 10 ở `user.service.ts`/`account.service.ts`) — đã khai báo `BCRYPT_SALT_ROUNDS: 12` trong `AUTH_CONFIG` (`auth.config.ts`), dùng chung ở cả 3 service và cập nhật `user.service.spec.ts`.
- [x] **[ĐÃ SỬA ✅] `backend/src/note/note.service.ts`** — đã bỏ tự bọc response `{statusCode, message, data}` (để `TransformInterceptor` toàn cục bọc 1 tầng); cập nhật `note.service.spec.ts`.
- [x] **[ĐÃ SỬA ✅] `backend/src/moderation/moderation.service.ts` `resolveReport`** — đã bỏ re-validate `dto.action` bằng tay (DTO đã validate — từ 2026-11-12 là `@IsEnum(ModerationResolveAction)`).
- [x] **[ĐÃ SỬA ✅] `backend/src/auth/auth.service.ts:1072-1075`** — đã sửa lỗi log (object literal lọt vào template string) và đổi toàn bộ 9 chỗ `console.error` còn sót trong `auth.service.ts` sang `customLogger.error`.
- [x] **[ĐÃ SỬA ✅] `backend/src/upload/upload.controller.ts`** — đã tách logic nghiệp vụ ra `upload.service.ts` + `upload.constant.ts`; đọc `CLOUDINARY_*`/`APP_URL`/`PORT` qua `app.config.ts`; cập nhật `upload.module.ts`, `backend/.env.example` và thêm unit test `upload.service.spec.ts`.

## Pha 2 — Domain-logic nhỏ nhưng có ý nghĩa

> **🔎 Phát hiện mới khi rà soát và triển khai Pha 2 (`PostCommentModal.tsx` ⇄ `BlogController` / `BlogGateway`):**
> 1. **Bug mất kết nối API bình luận ở `PostCommentModal.tsx`**:
>    - `handleSubmitComment` (`PostCommentModal.tsx:709`) gửi `POST /posts/:id/comments` kèm header `Authorization` nhưng **không gửi `authorId` trong body**, trong khi `CreateCommentDto` cũ bắt buộc `@IsUUID() authorId` và route thiếu `@UseGuards(AuthGuard)` → mọi bình luận thực tế bị từ chối `400 Bad Request` (chỉ hiện giả ở `localStorage`).
>    - `handleToggleLikeComment` (`645`), `handleSaveEdit` (`765`), `handleDeleteComment` (`794`) gọi nhầm URL `/comments/:commentId` (thiếu prefix `/posts/:postId`) và dùng `PUT` thay vì `PATCH` → 100% trả về `404 Not Found`.
> 2. **Bug mất kết nối Socket room bình luận (`PostCommentModal.tsx:535-538` ⇄ `BlogGateway`)**:
>    - `PostCommentModal.tsx` gọi `socket.emit('join-post-room', post.id)` (truyền chuỗi), nhưng `BlogGateway.joinPostRoom` chỉ đọc `payload?.postId` → không bao giờ join được room `post:<id>`.
>    - `BlogGateway.emitCommentAdded` phát `{ comment }`, nhưng `PostCommentModal.tsx` kiểm tra trực tiếp `newComment?.id` thay vì `payload?.comment ?? payload`.
> 3. **Bug quy tắc duyệt 2 người ở `LessonService.create` (`backend/src/lesson/lesson.service.ts:103-140`)**:
>    - Tham số `_creatorUserId` được `LessonController.create` truyền vào nhưng không được ghi vào cột `createdBy` khi `prisma.lesson.create(...)`, làm cột `createdBy` luôn `null` và vô hiệu hoá kiểm tra `current.createdBy === approverUserId` (`CANNOT_REVIEW_OWN`) ở `LessonService.review()`. Đã sửa lưu `createdBy: creatorUserId || null`.

- [x] **[ĐÃ SỬA ✅] `Question.difficulty`/`Question.type`** (Prisma schema `quiz.prisma`) — đã đổi `Question.difficulty` từ `String` tự do sang enum `DifficultyLevel` đã có (giống `Lesson.difficulty`), tạo migration SQL `20261112120000_question_difficulty_enum/migration.sql` theo chuẩn Prisma, cập nhật `CreateQuestionDto`/`QueryQuestionDto` dùng `@IsEnum(DifficultyLevel)`.
- [x] **[ĐÃ SỬA ✅] `backend/src/quiz/question.service.ts` `backfillFromQuizzes()`** — đã chuyển từ tạo từng record tuần tự trong vòng lặp sang gom mảng operation chạy trong 1 `this.prisma.$transaction(...)`; đổi `console.warn` → NestJS `Logger`; thêm unit test `question.service.spec.ts`.
- [x] **[ĐÃ SỬA ✅] Circular dependency `BlogModule` ⇄ `ModerationModule`** (`forwardRef` 2 chiều) — đã tách `BlogGatewayModule` (`backend/src/blog/blog-gateway.module.ts`) độc lập để cả `BlogModule` và `ModerationModule` cùng import một chiều, xoá toàn bộ `forwardRef` giữa 2 module.
- [x] **[ĐÃ SỬA ✅] Lỗ hổng & bug luồng bình luận (`blog.controller.ts`, `blog.service.ts`, `blog-post.dto.ts`, `PostCommentModal.tsx`)**:
  - Route comment (`createComment`/`updateComment`/`deleteComment`/`likeComment` trong `blog.controller.ts`) đã gắn `@UseGuards(AuthGuard)` và lấy danh tính từ `req.user.userId` thay vì body; đổi `BadRequestException` → `ForbiddenException` (403) khi kiểm tra quyền sở hữu ở `updateComment`/`deleteComment`.
  - Đã sửa `PostCommentModal.tsx` gọi đúng `/posts/${post.id}/comments/${commentId}` (`PATCH`/`DELETE`/`POST .../like`) và đồng bộ payload socket `join-post-room` / `post:comment-added` với `BlogGateway`.
  - Đã sửa bug validate `publishedAt` trong `CreateBlogPostDto` & `UpdateBlogPostDto` (`@IsDateString()`) và dùng enum `PostType`/`ContentStatus` từ `@prisma/client` thay vì mảng chuỗi `as any`.
- [ ] Rà soát rộng hơn các điểm `any`/`as any` còn lại liệt kê trong CODE_AUDIT.md Mục 2-6 (quy mô lớn, có thể làm theo từng domain/PR riêng).
- [x] **[MỚI — 🔴 ĐÃ SỬA ✅] Vá XSS `excerpt` Blog:** `frontend/src/features/blog/components/BlogDetailPage.tsx:219` — đã bọc `escapeHtml(post.excerpt || '...')` trước khi đưa vào `dangerouslySetInnerHTML`, đồng thời bổ sung `@MaxLength(1000)` cho `excerpt` trong `CreateBlogPostDto` & `UpdateBlogPostDto` (`backend/src/blog/dto/blog-post.dto.ts`). Đã xác nhận: luồng khối Blog còn lại đã escape đúng.
- [x] **[MỚI — 🟠 ĐÃ SỬA ✅] Sanitize HTML cho nội dung STAFF** (CODE_AUDIT 3.x / Mục 7 #16b): đã tạo allow-list sanitizer dùng chung `frontend/src/utils/sanitize-html.ts` (`sanitizeRichHtml`) và áp dụng tại `text-block.plugin.ts`, `PublicLessonReaderView.tsx`, `EntityReader.tsx`, `LessonPreviewContent.tsx`, `HubLessonQuiz.tsx` (`q.prompt`).
- [x] **[MỚI — ĐÃ SỬA ✅] `lesson/dto/create-lesson.dto.ts`** — đã đổi `difficulty` sang `@IsEnum(DifficultyLevel)` (cả ở `QueryLessonDto`), gõ lại `content`/`tags`/`displayOrder` (`@IsInt()`), chuẩn hoá kiểu trong `content-normalizer.strategy.ts`, thay `Promise<any>` trong `lesson.service.ts` bằng `Promise<LessonResponseDto>` và `@Req() req: any` ở `lesson.controller.ts` bằng `AuthenticatedRequest`.
- [x] **[MỚI — ĐÃ SỬA ✅] `BlockBuilderCanvas.renderGenericChildBlock`** — đã đổi `default: return null` sang hiển thị placeholder rõ ràng để khối con loại lạ trong `STORY_CHAPTER` không bị ẩn im lặng.
- [x] **[MỚI — ĐÃ SỬA ✅] Thu hẹp `any` ở `plugins/`**: đã gõ `LessonBlockItem` cho `compilerFn` trong `section-row-block.plugin.ts`, tách hàm chuẩn hoá dữ liệu legacy có kiểu rõ `extractLegacyGenericTable` (`comparison-table-block.plugin.ts`) và `normalizeQuoteFields` (`quote-block.plugin.ts`).
- [x] **[ĐÃ SỬA ✅ — Schema Database & Pure DB Data] Tách model `BlogPostComment` độc lập & Xóa sạch Mock Data:** Đã bổ sung `model BlogPostComment` và `model PostCommentLike` vào `blog.prisma` kèm migration `20261112140000_add_blog_post_comments`, chuyển toàn bộ logic CRUD trong `blog.service.ts` sang bảng mới. Frontend đã xoá bỏ hoàn toàn file `historical-comments.data.ts` (~260 dòng mock), xoá `localStorage` fallback trong `usePostComments.ts` và `PostCard.tsx`, đưa 100% luồng bình luận sang gọi và lưu trực tiếp trong Database kèm Socket realtime.

## Pha 3 — Tách component quá dài (ngưỡng CLAUDE.md: 200-300 dòng)

Thứ tự ưu tiên theo CODE_AUDIT.md Mục 7 (xếp theo độ dài giảm dần):
- [x] **[ĐÃ PHÂN RÃ ✅] `StoryChapterBlockEditor.tsx` (1459 dòng → 224 dòng, -85%)**: Tách thành cụm `features/lessons/components/builder/story-chapter/` gồm `StoryChapterRenderer.tsx`, `StoryChapterContentBlock.tsx`, `StoryChapterHeading.tsx`, `StoryChapterToolbar.tsx`, `StoryChapterTocBar.tsx`, `StoryChapterAddBlockMenu.tsx`, `useStoryChapterColumnResize.ts`, `types.ts`.
- [x] **[ĐÃ PHÂN RÃ ✅] `PostCommentModal.tsx` (1269 dòng → 190 dòng, -85%)**: Tách thành cụm `features/community/components/comment-modal/` gồm `usePostComments.ts` (custom hook/facade quản lý socket, local storage, API CRUD), `PostSummaryPane.tsx`, `CommentItemRow.tsx`, `CommentComposerBar.tsx`, `historical-comments.data.ts`, `comment-tree.util.ts`, `comment-modal.types.ts`.
- [x] **[ĐÃ PHÂN RÃ ✅] `CommunityProfileView.tsx` (1135 dòng → 214 dòng, -81%)**: Tách thành cụm `features/community/components/profile/` gồm `useCommunityProfile.ts` (custom hook/facade quản lý state, socket follow/like, stats calculation, tabs, filters), `ProfileSidebar.tsx`, `ProfileHeaderKpi.tsx`, `ProfileTabsToolbar.tsx`, `ProfileMembersList.tsx`, `ProfilePostsList.tsx`, `profile.types.ts`.
- [x] **[ĐÃ PHÂN RÃ ✅] `BlogCreatePage.tsx` (920 dòng → 260 dòng, -72%)**: Tách thành cụm `features/blog/components/` và `facades/` gồm `useBlogCreateFacade.ts`, `BlogStoryBlockItem.tsx`, `BlogHistoricalMetaModal.tsx`, `BlogPreviewModal.tsx`, `blog-create.types.ts`, `blog.constant.ts`. Xóa bỏ hoàn toàn tệp mock data thừa `blog-data.ts`. Cả feature `features/blog/` đạt **0 errors, 0 warnings (100% sạch)**.
- [x] **[ĐÃ PHÂN RÃ & TÁI CẤU TRÚC KHẢO THÍ DATABASE ✅] `QuestionBankModal.tsx` (931 dòng → 150 dòng, -84%) & Phân hệ Quiz**:
  - Tách thành 6 sub-components: `QuestionCategorySection.tsx`, `QuestionOptionsEditor.tsx`, `QuestionTypeCardSelector.tsx`, `QuestionAnswersSection.tsx`, `QuestionModalHeaderFooter.tsx`, `question-modal.helper.ts`.
  - Tái cấu trúc chuẩn mô hình khảo thí sư phạm: Chuyển quan hệ `Quiz` gắn trực tiếp vào nhiều `Topic` (`Quiz.topics Topic[] @relation("TopicQuizzes")`), khử phụ thuộc cứng vào `Lesson`. Cập nhật backend DTOs, service, unit tests (24/24 suites pass 100%).
  - Tối ưu `StandaloneQuizEditorModal.tsx`, `QuizStatisticsModal.tsx`, `QuestionBankPickerModal.tsx`, `QuizManagementView.tsx`, `QuestionBankView.tsx`.
  - Cả feature `features/quiz/` đạt **0 errors, 0 warnings (100% sạch)**.
- [x] **[ĐÃ PHÂN RÃ & TỐI ƯU HOÀN HẢO ✅] `luyen-tap/page.tsx` (848 dòng → 360 dòng, -58%)**: Tách thành cụm components và helpers chuẩn OCP/SRP: `QuizBriefingCard.tsx`, `QuizQuestionCard.tsx`, `QuizExamSidebar.tsx`, `QuizStatisticsModal.tsx`, `quiz-score.helper.ts`. Tích hợp trực tiếp với API database `QuizApiService.submitQuizAttempt` & `getPublicLessons`, không mock data. Đạt **0 errors, 0 warnings (100% sạch)**.
- [x] **[ĐÃ PHÂN RÃ & TỐI ƯU HOÀN HẢO ✅] `entity-reader-adapter.ts` & Cụm Universal Entity Detail (`frontend/src/components/entity-detail`)**: Tách `EntityReadingToolbar.tsx`, `EntityReadingToc.tsx`, `EntityReadingTimeline.tsx`, `entity-strategy.ts`. Khử 100% kiểu `any`, khử magic strings bằng enum `EntityType`, hạ cognitive complexity từ 56 và 29 xuống $< 8$. Toàn bộ thư mục `entity-detail` đạt **0 errors, 0 warnings (100% sạch)**.
- [x] **[ĐÃ PHÂN RÃ & TỐI ƯU HOÀN HẢO ✅] `HubLessonQuiz.tsx`, `public-curriculum.strategies.ts` & Cụm Public Curriculum (`frontend/src/features/public-curriculum`)**: Tách nhỏ `LessonGateSection.tsx`, `LessonReaderMainLayout.tsx`, `LessonReaderArticle.tsx`, `LessonReaderDesktopSidebar.tsx`, `LessonReaderLoadingSkeleton.tsx`, `LessonReaderNotFound.tsx`, `LessonReaderHeader.tsx`, `LessonReaderNavigationFooter.tsx`, `LessonMobileSyllabusDrawer.tsx`. Khử 100% `any`, hạ cognitive complexity từ 55, 25, 22 xuống $\le 8$, giải quyết triệt để cascading render `setState-in-effect`. Toàn bộ phân hệ `public-curriculum` đạt **0 errors, 0 warnings (100% sạch)**.
- [x] **[ĐÃ DỌN DẸP TRIỆT ĐỂ TAXONOMY, OBSOLETE ENUMS & CỤM LANDING ✅]**:
  - Backend: Loại bỏ hoàn toàn endpoint và logic `GET /taxonomies` (`public-content.controller.ts`, `public-content.service.ts`). Toàn bộ 24/24 unit test suites pass (191/191 tests passed).
  - Frontend: Xóa bỏ hoàn toàn các Enum lỗi thời/thừa thãi: `FigureRole`, `LocationType`, `EntityType`, `VerificationStatus`, `EntityRelationType`, `EventRelationType`, `EVENT_CATEGORY_CODES`, `TaxonomyGroupCode`, `CategoryFieldType`.
  - Khử toàn bộ danh sách role cứng (`PRIMARY_ROLE_CODES`, `CANONICAL_ROLE_LABELS`): vai trò nhân vật được quản lý dạng danh sách tag chuỗi tự do (`roles: string[]`) qua `ListField` trong `ArticleProfilePanel.tsx`.
  - Cụm Landing Page: Loại bỏ hoàn toàn phần "Đối sánh khu vực" (`ParallelBand`, `buildBands`, tab đối sánh) và các bộ lọc khu vực cứng trên trang chủ (`landing.adapter.ts`, `InteractivePreview.tsx`, `LandingHero.tsx`, `LandingView.tsx`, `ExploreSections.tsx`). Toàn bộ cụm Landing đạt **0 errors, 0 warnings (100% sạch)**.
- [ ] `TopicEditor.tsx` (~1089 dòng)
- [ ] `StoryChapterBlockInspector.tsx` (893 dòng)
- [ ] `CommunityFeed.tsx` (876 dòng)
- [ ] `HisgoStudioView.tsx` (808 dòng)
- [ ] `StorySubElementInspector.tsx` (783 dòng)
- [ ] `QuestionBankView.tsx` (712 dòng); `CurriculumTree.tsx` (705 dòng); `BlogReviewList.tsx` (719 dòng); `QuickComposer.tsx` (604 dòng)
- [ ] Nhóm 400-570 dòng: `TopicModal.tsx`, `TopicParentModalPicker.tsx`, `ArticleProfilePanel.tsx` (491), `RevisionDiff.tsx` (467), `BlogDetailPage.tsx` (457), `MediaManagerView.tsx` (440), `NotificationBell.tsx` (433)
- [x] **`CommentThread.tsx` (908 dòng)** — đã xác nhận không được import ở bất kỳ đâu trong codebase và **đã xoá hẳn**.
- [ ] **[MỚI] Block Builder — file >300 dòng chưa có trong danh sách trên**: `story-chapter-layout.strategy.ts` (791), `LessonEditor.tsx` (525), `BlockBuilderCanvas.tsx` (523, nên gom 3 `switch` lặp thành 1 hàm render), `useLessonBlockManager.ts` (493), `TimelineBlockItemEditor.tsx` (486), `TipTapToolbar.tsx` (477), `TypographyInspectorPanel.tsx` (458), `useLessonEditorFacade.ts` (415), `QuizQuestionEditors.tsx` (394). Làm sau `StoryChapterBlockEditor.tsx`.

## Pha 4 — Dọn trùng lặp (DRY) + lint/format

- [x] Gộp `extractMetadataFromBlocks`/`extractMetadata` (lặp ở `BlogDetailPage.tsx`, `BlogLandingPage.tsx`, `BlogReviewList.tsx`) thành 1 util dùng chung (`frontend/src/features/blog/utils/blog-metadata.util.ts`).
- [x] Gộp `getAuthorTint`/`getInitials` (lặp ở `PostCard.tsx`, `PostCommentModal.tsx`, `CommunityProfileView.tsx`) thành `frontend/src/features/community/utils/author-avatar.util.ts`.
- [x] Gộp `formatTimeAgo` (lặp ở `MediaManagerView.tsx`, `AnalyticsDashboardView.tsx`) thành `frontend/src/utils/time-ago.util.ts`.
- [x] Gộp `EventPickerModal`/`EntityPickerModal` (tách `useWikipediaDetailPicker.ts` & `WikiDetailPreviewPane.tsx` dùng chung); gộp `CurriculumSidePanel.tsx`/`CurriculumTreePreviewModal.tsx` (`CurriculumTreePreviewModal` uỷ quyền cho `CurriculumSidePanel` với `variant="modal"`).
- [x] Chạy `npm run lint -- --fix` cả 2 phía (`backend`, `frontend`) + chuẩn hoá line-ending (CRLF/LF) và sửa toàn bộ lỗi còn lại: Cả Backend và Frontend hiện đạt **0 ERRORS** (Backend: 0 errors / 143 warnings; Frontend: 0 errors / 981 warnings). Toàn bộ 718 lỗi format backend ban đầu và 7 lỗi compilation/runtime frontend ban đầu đã được giải quyết triệt để.
- [x] Chạy `npm run audit` (lint + jscpd + knip) ở cả backend và frontend:
  - Báo cáo trùng lặp `jscpd`: Backend đạt **3.35%** (51 clones, 727 lines), Frontend đạt **1.36%** (90 clones, 1056 lines) — cả hai đều tối ưu sâu dưới ngưỡng 5%.
  - Báo cáo `knip`: Bổ sung thành công các dependency thiếu (`socket.io-client` ở frontend, `multer` ở backend) đưa unlisted dependencies về **0**; ghi nhận danh sách 19 files chưa dùng và các export thừa để rà soát tinh gọn ở Pha 3/Pha 4 tiếp theo.
- [x] **[MỚI] Dọn Block Builder**: đã xoá `components/builder/TimelineNodeCanvasDrawer.tsx` (không ai import); đã gộp 2 palette `LessonBlockPalette` & `BlockLibraryPalette` về 1 nguồn danh sách/icon (`BLOCK_TYPE_ICONS` + ghi rõ lý do vắng `QUIZ`/`RESOURCE_LINK` trong `block-palette.constants.ts`); đã gộp `TocItem` trùng giữa `types/left-sidebar.types.ts` và `LessonPreviewContent.tsx`; đã thay dữ liệu mẫu Điện Biên Phủ trong `createDefault()` của `quiz-block.plugin.ts`/`section-row-block.plugin.ts` bằng placeholder trung tính. (Còn lại tuỳ chọn tính năng: nối/xoá `features/lessons/templates/` và thêm `VIDEO` upload editor).

---

## Pha 5 — Dọn enum, migration, khu vực & toàn bộ warning ESLint (2026-11-12)

- [x] **[ĐÃ SỬA ✅] Lịch sử migration hỏng** — thêm `20261109000000_create_blog_posts` + `20261112210000_sync_comment_quiz_schema` (bù các đối tượng từng tạo bằng db push, đều `IF NOT EXISTS`); sửa `"auth_user"` → `"authUser"` trong `community_phase1` và `add_blog_post_comments`; chuyển `quizzes.topic_id` sang `_TopicQuizzes` trước khi bỏ cột. Đã deploy: `migrate status` sạch, `migrate diff` rỗng.
- [x] **[ĐÃ SỬA ✅] Enum backend thừa / lệch** (migration `20261112200000_cleanup_unused_enums`) — bỏ 4 enum + 4 bảng thuê bao (rỗng, không code dùng); `stmp` → `smtp` bằng `RENAME VALUE`; enum `ReportTargetType` cho `content_reports.target_type` (đổi kiểu tại chỗ, giữ dữ liệu); chuỗi cứng thay bằng enum Prisma ở blog/moderation/auth/email; DTO moderation chuyển `@IsIn` → `@IsEnum` (`moderation.constant.ts`).
- [x] **[ĐÃ SỬA ✅] `LearningPathType`** — bỏ `MYTHOLOGICAL` và `Topic.pathType` (migration `20261112220000_drop_topic_path_type`).
- [x] **[ĐÃ SỬA ✅] Bỏ hẳn khu vực & xếp hạng di tích** — `metadata.region`, `site.rank`, `HistoricalRegion`, `HeritageRank`, `region.utils.ts`, `HeritageFilterBar`, nhóm "Trong nước / Thế giới" (dữ liệu nằm trong JSON metadata — không cần migration).
- [x] **[ĐÃ SỬA ✅] ESLint 0 errors / 0 warnings cả 2 phía** — xem [ESLINT_REPORT.md](ESLINT_REPORT.md); kèm sửa bug khoá token ở `note.service.ts`, xoá proxy `app/api/notes`, gỡ mock ảnh Unsplash trong `ImageBlockView`.
- [ ] Thống nhất kiểu chữ tên enum Prisma (`userRole`, `email_type`… → PascalCase; có thể giữ tên type trong DB bằng `@@map`) — sửa import diện rộng.
- [ ] Hợp nhất `ContentStatus.PENDING_REVIEW` và `LessonStatus.REVIEW` — cần data migration + sửa frontend.
- [ ] `ArticleList.tsx` đang ẩn cứng 1 bài (`HIDDEN_ARTICLE`) — chuyển bài đó sang `ARCHIVED` rồi bỏ đoạn lọc.
- [x] **[ĐÃ SỬA ✅]** Đã xoá bỏ hoàn toàn `features/taxonomy/*` và `public-taxonomy.ts`, thay bằng `hooks/useEventCategories.ts` + `services/public/article-kind.ts`.

---

## Pha 6 — Hợp nhất & Thu gọn kiến trúc Frontend (2026-11-13)

- [x] **Dọn trước đó (513 → 493 file):** Gỡ hệ TipTap Block cũ song song (`extensions/*-block.extension.ts`, `components/blocks/*BlockView.tsx`, `LessonBlockPalette.tsx`, `lesson-block.factory.ts`, `lesson-block-insert.strategy.ts`), hợp nhất route trùng (`/cms/moderation` → `/moderation`, `/review/blog` → `/blog-review`), thay thế lớp `taxonomy/` bằng `useEventCategories`.
- [x] **Đợt 1 (493 → 469 file):** Xoá 5 route thừa (`/styleguide`, `/topics` redirect, `/trieu-dai/[slug]`, `/kien-thuc/[slug]`, `/cong-dong/tai-khoan`), xoá 2 component chết (`OrnamentFrame`, `SectionTitle`); gộp `constants/` nhỏ vào `enums.ts`, `types/models/*` → `types/models.ts`, `utils/*` → `utils/common.ts`, 7 UI nhỏ → `components/common/CommonUi.tsx`.
- [x] **Đợt 2 — `features/lessons/` (469 → 419 file):** Gộp 16 plugin ngắn → `simple-block.plugins.ts`, gộp `types/` và `constants/` nhỏ → `editor.types.ts` & `lesson.constants.ts`, gộp `strategies/` + `rules/` + `factories/` nhỏ, gộp Header/TipTap/Properties/Quiz subcomponents, gom `story-chapter/` (8 → 2 file) và `*BlockItemEditor` → `BasicBlockItemEditors.tsx` & `RichBlockItemEditors.tsx`.
- [x] **Đợt 3 — `features/community/` + `public-curriculum/` + `curriculum/` (419 → 374 file):** Gom `features/community/` từ 39 → 12 file, `public-curriculum/components/reader/` (9 → 1) & `hub/` (9 → 4), `curriculum/components/studio/` (modals + panels + `CurriculumExplorer`).
- [x] **Đợt 4 (Đã xong — 374 → 359 files):** Gom `features/quiz/` (`QuestionBankModal.tsx`, `PracticeQuizParts.tsx`, `utils/practice-quiz.helper.ts`) + `features/review/` (`BlogReviewParts.tsx`, `types/review.types.ts`).
- [x] **Đợt 5 (Đã xong — 359 → 310 files):** Gom `components/timeline/` (`TimelineChrome`, `TimelineNodes`, `TimelineSections`, `sk-types`), `components/figures/` (`FiguresDirectoryParts`, `FigureProfileParts`), `components/entity-detail/` (`EntityReaderParts`, `EntityReader`), và các feature vừa/nhỏ (`landing`, `account`, `tags`, `topics`, `heritage`, `blog`, `period-detail`, `notes`, `search`).

---

## Pha 7 — 3 vai trò Category / Topic / Tag & test toàn hệ thống (2026-11-13)

Chi tiết từng lỗi ở [CODE_AUDIT.md](CODE_AUDIT.md) Mục 9.

- [x] **Topic cho bài viết:** ô chọn Topic trong `ArticleEditor`, `topicId` vào `REVISION_FIELDS.ARTICLE` và API công khai; thời kỳ của bài suy theo Topic thay vì Tag (`landing-graph.ts`, `landing.service.ts`).
- [x] **Cây chủ đề CMS:** backend `getTopicTree` kèm bài học; frontend vẽ/lọc/đếm đệ quy mọi độ sâu.
- [x] **Kiểm duyệt bình luận Blog** đọc đúng bảng `blog_post_comments` (moderation + preview bình luận ở feed).
- [x] **Hỏi đáp ở trang bài học** + link thông báo trả lời dùng slug.
- [x] **Chữ & chú thích** theo đúng 3 vai trò (CMS, menu, schema Prisma).
- [x] **Lỗi tìm ra khi test toàn hệ thống:** lộ ghi chú của người khác (`GET /notes`), trang Tag luôn 0 thẻ (đọc sai response, nuốt lỗi lưu/xoá).
- [x] **Test bổ sung (backend):** `moderation.service.spec.ts` (mới, 6 test), `topic.service.spec.ts` (cây 4 cấp), `discussion.service.spec.ts` (link bài học/bài viết/nội dung đã xoá), `note.service.spec.ts` (không định danh → rỗng), `tag.service.spec.ts` (đếm bài học + bài viết).
- [x] **Thử thao tác ghi trên server thật** — tìm và sửa: đăng blog giả danh người khác (`POST /posts` tin `authorId` trong body), người dùng thường tự xuất bản bài chuyên khảo / đặt nổi bật, slug blog mất chữ "đ", lỗi lưu thẻ bị lớp phủ che. Test `blog.service.spec.ts` (6 test mới).
- [x] **Thử nốt 88 API ghi với 4 vai trò** (thêm `learner@hisgo.test` vào `seed-staff.ts`) — tìm và sửa: CMS không kiểm tra vai trò (người học ghi được mọi nội dung), biên tập viên tự xuất bản bài viết, lỗi Prisma lộ chi tiết nội bộ + 500 cho ID liên kết sai, xoá chủ đề xoá cả cây con, quét AI nhận loại tuỳ ý. Test mới: `content-write.guard.spec.ts`, `all-exception.filter.spec.ts`, `topic.service.spec.ts`.
- [x] Chấm điểm quiz ở server (`quiz-grading.ts`); `/luyen-tap` làm được đủ 6 loại câu và xáo đáp án.
- [x] Bắt buộc `topicId` khi tạo bài học (DTO + trình soạn + Studio); sửa trình soạn không lưu Topic và nút "Gửi duyệt" gửi sai trạng thái.
- [x] Quản lý người dùng: chặn tự xoá, giữ ≥ 1 SUPERADMIN.
- [x] Test giao diện: soạn/gửi duyệt bài học, cộng đồng, tag, hỏi đáp, ghi chú, luyện tập, 5 cỡ màn hình (sửa tràn ngang header + câu ghép nối).
- [x] Phân trang `GET /users` (backend + `UserList` qua `UserApiService`).
- [x] Gắn Topic "Bạch Đằng năm 938" cho bài "Ngô Quyền và chiến thắng Bạch Đằng năm 938" (qua bản sửa của biên tập viên → người duyệt duyệt).
- [x] Chạy `seed-staff.ts`: `admin@hisgo.edu.vn` là SUPERADMIN, có thêm `learner@hisgo.test`.
- [x] Sửa `Update*Dto` kế thừa giá trị mặc định (PATCH gỡ xuất bản / hạ quyền) và `LessonService.update` bỏ qua `topicId`.
- [x] **Unit test nhóm ưu tiên 1** (2026-11-14): `timeline` (11), `category` (10), `learner` (9), `account` (7), `learning-path` (9), `article` (21) — 240 → 303 test, độ phủ backend 39% → 44,5%. Tìm ra: tag trùng ghi 2 lần ở bài viết, `addLessonsToChapter` không dùng transaction.
- [x] **Unit test nhóm ưu tiên 2** (2026-11-14): `blog` (bảng tin, duyệt, bình luận, thích/lưu/báo cáo/lượt xem, theo dõi), `public-content` (chỉ nội dung đã xuất bản, danh bạ theo loại chuyên mục, thống kê đề), `moderation` (quét AI 3 mức, danh sách báo cáo, xử lý báo cáo bài), `auth` (đăng nhập, khoá tài khoản, xoay vòng refresh token, đăng xuất — dùng Redis giả trong bộ nhớ), `google-oauth` (PKCE, kiểm chữ ký ID token bằng khoá RSA sinh trong test), `redis` — 303 → 422 test, độ phủ backend 44,5% → 59,3%. Sửa 5 lỗi tìm ra (xem `CODE_AUDIT.md` Mục 9).
- [x] Bảng tin Blog chỉ trả bài đã xuất bản; màn duyệt CMS chuyển sang `GET /posts/review` (2026-11-14), mỗi tab gọi `?status=` riêng thay vì tải chung 100 bài rồi tự chia.
- [x] **Unit test nhóm ưu tiên 3** (2026-11-14): `auth.guard` (100%: token hết hạn / giả mạo / `alg: none` / `tokenVersion` cũ / tài khoản bị khoá hoặc đã xoá), `auth-utils` (74%: ký và kiểm token, access ≠ refresh, giới hạn tần suất), `topic` (95%: chống vòng lặp cha–con, giới hạn 20 cấp, gắn/tách con, cache) — 430 → 467 test, độ phủ backend 59,4% → 62%. Sửa lỗ cache `tokenVersion` khi khoá / xoá tài khoản.
- [x] **DB test riêng cho e2e** (2026-11-14): `npm run test:e2e:prepare` dựng lại `<DB dev>_e2e` từ `prisma/schema`; e2e dùng Redis DB 1 + tiền tố `e2e` (không lấy job BullMQ của backend dev); có chốt chặn từ chối trùng DB dev. Viết lại `lesson`, `tag`, `dashboard`, `topic` e2e dùng tài khoản thật qua `AuthGuard` thật (trước giả lập người dùng không có trong DB nên vỡ khi ghi `createdBy`) — 47/47 test e2e qua, không để lại dữ liệu.
- [x] Đề thi chỉ lấy câu hỏi từ Ngân hàng; bỏ cột `quizzes.questions`; chuẩn hoá câu định dạng cũ; bỏ bảng thừa `article_comments` (2026-11-14). Còn 39 bảng.
- [ ] Chốt `Quiz.lessonId` (đề ôn tập theo bài) với quy tắc "không gắn Quiz vào Lesson" trong CLAUDE.md.
- [ ] Đưa các script thử API ghi (bài viết, timeline, quiz, blog, kiểm duyệt, người dùng) thành e2e.
- [x] Gộp lịch sử migration thành baseline `20261114000000_baseline` + lệnh `npm run db:baseline` cho DB cũ (2026-11-14). **Mỗi thành viên chạy `npm run db:baseline` một lần sau khi pull.**
- [x] Bỏ ngoại lệ tự duyệt bài viết ở chuyên mục "blog/bài viết" (`isBlogCategory`); sửa quét AI 2 lần, transaction cho bình luận, TTL phiên Google (2026-11-14).
- [ ] Thêm bộ chạy test cho frontend (vitest) rồi viết test cho `createPeriodSlugResolver`, `pruneTree`/`countLessons`.
- [ ] Xoá bảng `article_comments` (model `ArticleComment`) bằng migration — đã không còn code dùng.
- [ ] Xoá cache danh sách Tag khi sửa tag trong bài viết (hiện trễ tới 1 giờ).
- [ ] Xoá bài học trong cây chủ đề phải gọi API và duyệt mọi cấp (`CurriculumExplorer.handleConfirmDelete`).

---

## Ghi chú vận hành

- Mỗi pha/mục nên là 1 commit hoặc 1 PR riêng theo conventional commits (`fix(scope):`, `refactor(scope):`, `chore(scope):`).
- Trước khi coi 1 mục là xong: chạy `npm run lint` + test liên quan ở phía vừa sửa (theo quy ước dự án), không thêm warning ESLint mới.
- Đổi schema Prisma phải theo đúng quy trình migration trong `CLAUDE.md` — không dùng `prisma migrate dev` hay sửa DB tay. Luôn đọc lại SQL do `migrate diff` sinh: với đổi kiểu cột / bỏ giá trị enum, Prisma có thể sinh DROP+ADD cột (mất dữ liệu) hoặc sai thứ tự lệnh — sửa tay thành `ALTER COLUMN ... USING` / `RENAME VALUE` trước khi deploy.
