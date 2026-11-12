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
- [x] **[ĐÃ SỬA ✅] `backend/src/moderation/moderation.service.ts` `resolveReport`** — đã bỏ re-validate `dto.action` bằng tay (DTO đã `@IsIn([...])`).
- [x] **[ĐÃ SỬA ✅] `backend/src/auth/auth.service.ts:1072-1075`** — đã sửa lỗi log (object literal lọt vào template string) và đổi toàn bộ 9 chỗ `console.error` còn sót trong `auth.service.ts` sang `customLogger.error`.
- [x] **[ĐÃ SỬA ✅] `backend/src/upload/upload.controller.ts`** — đã tách logic nghiệp vụ ra `upload.service.ts` + `upload.constant.ts`; đọc `CLOUDINARY_*`/`APP_URL`/`PORT` qua `app.config.ts`; cập nhật `upload.module.ts`, `backend/.env.example` và thêm unit test `upload.service.spec.ts`.

## Pha 2 — Domain-logic nhỏ nhưng có ý nghĩa

- [ ] **`Question.difficulty`/`Question.type`** (Prisma schema `quiz.prisma`) — đổi từ `String` tự do sang enum `DifficultyLevel` đã có (giống `Lesson.difficulty`). Cần viết migration theo đúng quy trình Prisma trong CLAUDE.md (không `migrate dev`).
- [ ] **`backend/src/quiz/question.service.ts` `backfillFromQuizzes()`** — chuyển từ tạo từng record trong loop sang `createMany`/`$transaction`; đổi `console.warn` → NestJS `Logger`.
- [ ] **Circular dependency `BlogModule` ⇄ `ModerationModule`** (`forwardRef` 2 chiều) — tách `BlogGateway` ra module riêng, hoặc dùng `@nestjs/event-emitter` để decouple.
- [ ] **Lỗ hổng ghi chú thêm phát hiện khi vá Pha 0 & Pha 1**:
  - Route comment (`createComment`/`updateComment`/`deleteComment`/`likeComment` trong `blog.controller.ts`) nhận `authorId`/`userId` từ **body** chứ không từ token đăng nhập — có thể giả danh người khác. Cần soát lại và chuyển sang lấy từ `req.user` (`@UseGuards(AuthGuard)`) như các route khác; đồng thời đổi `BadRequestException` → `ForbiddenException` khi kiểm tra quyền sở hữu ở `updateComment`/`deleteComment` (`blog.service.ts:534, 580`).
  - Bug DTO `publishedAt` trong `CreateBlogPostDto` & `UpdateBlogPostDto` (`backend/src/blog/dto/blog-post.dto.ts:98-101, 165-168`): đang gắn đồng thời `@Type(() => Date)` và `@IsString()` khiến mọi request gửi `publishedAt` đều fail validate khi `transform: true` — cần đổi sang `@IsDateString()` (hoặc `@Type(() => Date)` + `@IsDate()`).
- [ ] Rà soát rộng hơn các điểm `any`/`as any` còn lại liệt kê trong CODE_AUDIT.md Mục 2-6 (quy mô lớn, có thể làm theo từng domain/PR riêng).
- [x] **[MỚI — 🔴 ĐÃ SỬA ✅] Vá XSS `excerpt` Blog:** `frontend/src/features/blog/components/BlogDetailPage.tsx:219` — đã bọc `escapeHtml(post.excerpt || '...')` trước khi đưa vào `dangerouslySetInnerHTML`, đồng thời bổ sung `@MaxLength(1000)` cho `excerpt` trong `CreateBlogPostDto` & `UpdateBlogPostDto` (`backend/src/blog/dto/blog-post.dto.ts`). Đã xác nhận: luồng khối Blog còn lại đã escape đúng.
- [ ] **[MỚI — 🟠 phòng thủ chiều sâu] Sanitize HTML cho nội dung STAFF** (CODE_AUDIT 3.x / Mục 7 #16b): thêm allow-list sanitizer dùng chung (FE util hoặc BE khi lưu) cho `PublicLessonReaderView.tsx`, `EntityReader.tsx`, `LessonPreviewContent.tsx`, `HubLessonQuiz.tsx` (`q.prompt`); test với `<img onerror>`/`<script>`. Hạ từ mức cao vì chỉ STAFF viết được các nội dung này.
- [ ] **[MỚI] `lesson/dto/create-lesson.dto.ts`** — đổi `difficulty?: any` sang enum Prisma `DifficultyLevel` (`@IsEnum`), gõ lại `content`/`tags`/`displayOrder`; sau đó thay `Promise<any>` trong `lesson.service.ts` và `@Req() req: any` ở `lesson.controller.ts` bằng kiểu rõ (dùng chung interface request đã có ở module khác).
- [ ] **[MỚI] `BlockBuilderCanvas.renderGenericChildBlock`** — đổi `default: return null` sang placeholder (hoặc tra `LessonBlockRegistry`) để khối con loại lạ trong `STORY_CHAPTER` không bị ẩn im lặng.
- [ ] **[MỚI] Thu hẹp `any` ở `plugins/`**: `section-row-block.plugin.ts` (`compilerFn`), `comparison-table-block.plugin.ts`, `quote-block.plugin.ts` (field legacy) — tách hàm chuẩn hoá dữ liệu legacy có kiểu rõ.

## Pha 3 — Tách component quá dài (ngưỡng CLAUDE.md: 200-300 dòng)

Thứ tự ưu tiên theo CODE_AUDIT.md Mục 7 (xếp theo độ dài giảm dần):
- [ ] `StoryChapterBlockEditor.tsx` (1459 dòng)
- [ ] `PostCommentModal.tsx` (1269 dòng)
- [ ] `CommunityProfileView.tsx` (1135 dòng)
- [ ] `TopicEditor.tsx` (~1089 dòng)
- [ ] `BlogCreatePage.tsx` (931 dòng)
- [ ] `QuestionBankModal.tsx` (931 dòng)
- [ ] `StoryChapterBlockInspector.tsx` (893 dòng)
- [ ] `CommunityFeed.tsx` (876 dòng)
- [ ] `luyen-tap/page.tsx` (848 dòng — đã sửa 2 bug trong Pha 0, vẫn cần tách sau)
- [ ] `HisgoStudioView.tsx` (808 dòng)
- [ ] `StorySubElementInspector.tsx` (783 dòng)
- [ ] `QuestionBankView.tsx` (712 dòng); `CurriculumTree.tsx` (705 dòng); `BlogReviewList.tsx` (719 dòng); `QuickComposer.tsx` (604 dòng)
- [ ] Nhóm 400-570 dòng: `TopicModal.tsx`, `TopicParentModalPicker.tsx`, `ArticleProfilePanel.tsx` (491), `RevisionDiff.tsx` (467), `BlogDetailPage.tsx` (457), `MediaManagerView.tsx` (440), `NotificationBell.tsx` (433)
- [ ] **`CommentThread.tsx` (908 dòng)** — xác nhận lại với team rồi **xoá hẳn** (không dùng ở đâu trong code) thay vì tách.
- [ ] **[MỚI] Block Builder — file >300 dòng chưa có trong danh sách trên**: `story-chapter-layout.strategy.ts` (791), `LessonEditor.tsx` (525), `BlockBuilderCanvas.tsx` (523, nên gom 3 `switch` lặp thành 1 hàm render), `useLessonBlockManager.ts` (493), `TimelineBlockItemEditor.tsx` (486), `TipTapToolbar.tsx` (477), `TypographyInspectorPanel.tsx` (458), `useLessonEditorFacade.ts` (415), `QuizQuestionEditors.tsx` (394). Làm sau `StoryChapterBlockEditor.tsx`.

## Pha 4 — Dọn trùng lặp (DRY) + lint/format

- [ ] Gộp `extractMetadataFromBlocks`/`extractMetadata` (lặp ở `BlogDetailPage.tsx`, `BlogLandingPage.tsx`, `BlogReviewList.tsx`) thành 1 util dùng chung.
- [ ] Gộp `getAuthorTint`/`getInitials` (lặp ở `PostCard.tsx`, `PostCommentModal.tsx`, `CommunityProfileView.tsx`).
- [ ] Gộp `formatTimeAgo` (lặp ở `MediaManagerView.tsx`, `AnalyticsDashboardView.tsx`).
- [ ] Gộp `EventPickerModal`/`EntityPickerModal`; gộp `CurriculumSidePanel.tsx`/`CurriculumTreePreviewModal.tsx`.
- [ ] Chạy `npm run lint -- --fix` cả 2 phía (`backend`, `frontend`) + chuẩn hoá line-ending (LF) để giảm phần lớn trong 718 lỗi backend / 1052 vấn đề frontend hiện tại. Review lại danh sách lỗi còn sót sau `--fix` (sẽ ngắn hơn nhiều) trước khi coi là "sạch".
- [ ] Chạy `npm run audit` (lint + jscpd + knip) ở backend để xác nhận các trùng lặp trên đã được jscpd công nhận là hết.
- [ ] **[MỚI] Dọn Block Builder**: xoá `components/builder/TimelineNodeCanvasDrawer.tsx` (không ai import); quyết định nối hoặc xoá `features/lessons/templates/` (`LessonTemplateFactory` + 5 mẫu); gộp 2 palette `LessonBlockPalette` & `BlockLibraryPalette` về 1 nguồn danh sách/icon (bổ sung hoặc ghi rõ lý do vắng `QUIZ`/`RESOURCE_LINK`); gộp `TocItem` trùng giữa `types/left-sidebar.types.ts` và `LessonPreviewContent.tsx`; thay dữ liệu mẫu Điện Biên Phủ trong `createDefault()` của `quiz-block.plugin.ts`/`section-row-block.plugin.ts` bằng placeholder trung tính; cân nhắc thêm `VIDEO` editor ngang `IMAGE` (upload/chọn media).

---

## Ghi chú vận hành

- Mỗi pha/mục nên là 1 commit hoặc 1 PR riêng theo conventional commits (`fix(scope):`, `refactor(scope):`, `chore(scope):`).
- Trước khi coi 1 mục là xong: chạy `npm run lint` + test liên quan ở phía vừa sửa (theo quy ước dự án), không thêm warning ESLint mới.
- Đổi schema Prisma (Pha 2, mục `DifficultyLevel`) phải theo đúng quy trình migration trong `CLAUDE.md` — không dùng `prisma migrate dev` hay sửa DB tay.
