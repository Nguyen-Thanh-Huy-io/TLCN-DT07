# 📋 KẾ HOẠCH XỬ LÝ CODE_AUDIT.md

> Theo dõi tiến độ xử lý các vi phạm/lỗi liệt kê trong [CODE_AUDIT.md](CODE_AUDIT.md).
> Nhóm đã xử lý: **Mục 7 🔴 Bug / rủi ro vận hành thật** (4/6 mục đã sửa, 2 mục còn lại chuyển vào Pha 1 dưới đây — enum `UserRole` lệch Prisma, base URL hardcode).
> Mỗi pha nên tách 1 (hoặc vài) PR riêng để dễ review/rollback, không gộp chung với pha khác.

---

## Pha 1 — Dọn kiến trúc lan rộng (chủ yếu tìm-thay, rủi ro thấp)

- [ ] **Import Prisma sai quy ước**: đổi `import ... from '@prisma/client'` → `from '../../generated/prisma/client'` (hoặc đường dẫn tương ứng) ở toàn bộ ~9 file: `auth.service.ts`, `user/dto/create-user.dto.ts`, `user/dto/user-response.dto.ts`, `dashboard.service.ts`, `dashboard-overview.dto.ts`, `public-content.service.ts`, `public-content.mapper.ts`, `common/access/access.constant.ts`, `common/services/prisma.service.ts`. *(Rà lại toàn repo bằng Grep trước khi coi là xong — danh sách trên chưa chắc đủ.)*
- [ ] **Base URL API hardcode** (16+ file, 3 giá trị khác nhau: `127.0.0.1:5000`/`localhost:5000`/`localhost:5001`) — gom về 1 hằng số dùng chung. Phía route handler `app/api/**` và các service SSR cần 1 util/constant riêng (không dùng axios instance client vì không có token/localStorage ở SSR).
- [ ] **Code chết trong `backend/src/common/services/prisma.service.ts`** — xoá 24 dòng class cũ bị comment lại.
- [ ] **Enum `UserRole` lệch Prisma** (`backend/src/auth/interfaces/auth.interface.ts:5-10`) — sửa khớp enum `userRole` thật (`USER/ADMIN/MODERATOR/SUPERADMIN`) hoặc xoá hẳn nếu không cần dùng riêng.
- [ ] **`AuthUtilsService.canModifyRole()`** — dead code (không ai gọi), xoá hoặc viết lại đúng nếu còn cần.
- [ ] **`backend/src/common/guards/auth.guard.ts` — `extractTokenFromCookies`** — dead code, xoá.
- [ ] **Salt rounds bcrypt không nhất quán** (12 ở `auth.service.ts` vs 10 ở `user.service.ts`/`account.service.ts`) — thống nhất 1 hằng số (ví dụ `BCRYPT_SALT_ROUNDS` trong `auth.config.ts`).
- [ ] **`backend/src/note/note.service.ts`** — bỏ tự bọc response `{statusCode, message, data}` (đã có `TransformInterceptor` toàn cục).
- [ ] **`backend/src/moderation/moderation.service.ts` `resolveReport`** — bỏ re-validate `dto.action` bằng tay (DTO đã `@IsIn([...])`).
- [ ] **`backend/src/auth/auth.service.ts:1072-1075`** — sửa lỗi log (object literal lọt vào template string thay vì truyền đúng metadata cho `customLogger.log`). Dọn luôn 9 chỗ `console.error` còn sót song song `CustomLoggerService`.
- [ ] **`backend/src/upload/upload.controller.ts`** — tách logic nghiệp vụ ra `upload.service.ts`; đọc `CLOUDINARY_*`/`APP_URL`/`PORT` qua `ConfigService` thay vì `process.env` trực tiếp.

## Pha 2 — Domain-logic nhỏ nhưng có ý nghĩa

- [ ] **`Question.difficulty`/`Question.type`** (Prisma schema `quiz.prisma`) — đổi từ `String` tự do sang enum `DifficultyLevel` đã có (giống `Lesson.difficulty`). Cần viết migration theo đúng quy trình Prisma trong CLAUDE.md (không `migrate dev`).
- [ ] **`backend/src/quiz/question.service.ts` `backfillFromQuizzes()`** — chuyển từ tạo từng record trong loop sang `createMany`/`$transaction`; đổi `console.warn` → NestJS `Logger`.
- [ ] **Circular dependency `BlogModule` ⇄ `ModerationModule`** (`forwardRef` 2 chiều) — tách `BlogGateway` ra module riêng, hoặc dùng `@nestjs/event-emitter` để decouple.
- [ ] **Lỗ hổng ghi chú thêm phát hiện khi vá Pha 0**: route comment (`createComment`/`updateComment`/`deleteComment`/`likeComment` trong `blog.controller.ts`) nhận `authorId`/`userId` từ **body** chứ không từ token đăng nhập — có thể giả danh người khác. Cần soát lại và chuyển sang lấy từ `req.user` như các route khác.
- [ ] Rà soát rộng hơn các điểm `any`/`as any` còn lại liệt kê trong CODE_AUDIT.md Mục 2-6 (quy mô lớn, có thể làm theo từng domain/PR riêng).

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

## Pha 4 — Dọn trùng lặp (DRY) + lint/format

- [ ] Gộp `extractMetadataFromBlocks`/`extractMetadata` (lặp ở `BlogDetailPage.tsx`, `BlogLandingPage.tsx`, `BlogReviewList.tsx`) thành 1 util dùng chung.
- [ ] Gộp `getAuthorTint`/`getInitials` (lặp ở `PostCard.tsx`, `PostCommentModal.tsx`, `CommunityProfileView.tsx`).
- [ ] Gộp `formatTimeAgo` (lặp ở `MediaManagerView.tsx`, `AnalyticsDashboardView.tsx`).
- [ ] Gộp `EventPickerModal`/`EntityPickerModal`; gộp `CurriculumSidePanel.tsx`/`CurriculumTreePreviewModal.tsx`.
- [ ] Chạy `npm run lint -- --fix` cả 2 phía (`backend`, `frontend`) + chuẩn hoá line-ending (LF) để giảm phần lớn trong 718 lỗi backend / 1052 vấn đề frontend hiện tại. Review lại danh sách lỗi còn sót sau `--fix` (sẽ ngắn hơn nhiều) trước khi coi là "sạch".
- [ ] Chạy `npm run audit` (lint + jscpd + knip) ở backend để xác nhận các trùng lặp trên đã được jscpd công nhận là hết.

---

## Ghi chú vận hành

- Mỗi pha/mục nên là 1 commit hoặc 1 PR riêng theo conventional commits (`fix(scope):`, `refactor(scope):`, `chore(scope):`).
- Trước khi coi 1 mục là xong: chạy `npm run lint` + test liên quan ở phía vừa sửa (theo quy ước dự án), không thêm warning ESLint mới.
- Đổi schema Prisma (Pha 2, mục `DifficultyLevel`) phải theo đúng quy trình migration trong `CLAUDE.md` — không dùng `prisma migrate dev` hay sửa DB tay.
