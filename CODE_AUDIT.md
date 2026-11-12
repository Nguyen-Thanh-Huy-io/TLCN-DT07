> **Cập nhật:** Pha 0, Pha 1, Pha 2, và Pha 4 (DRY + Lint Format + Audit jscpd/knip) đã hoàn tất — xem ghi chú `[ĐÃ SỬA ✅]` cạnh mỗi mục và chi tiết trong [CODE_AUDIT_PLAN.md](CODE_AUDIT_PLAN.md). Cả backend và frontend đều đạt **0 ERRORS** trên ESLint và TypeScript typecheck; `npm test` backend PASS 24/24 suites (185 tests); jscpd đạt tỷ lệ trùng lặp xuất sắc: **3.35%** (backend) và **1.36%** (frontend).

# 🔎 CODE AUDIT — Vi phạm quy tắc code (đối chiếu `CLAUDE.md`)
> Dự án: `D:\Fullit\TLCN\TLCN-DT07` · Nhánh: `fix/critical-audit-issues`
> Mục đích: liệt kê các điểm code **chưa tuân** quy tắc trong `CLAUDE.md` (magic string/number, `any`/`as`, component quá dài, try/catch nuốt lỗi, code chết, N+1, thiếu phân trang DB...), tìm bằng cách đọc toàn bộ nội dung file + chạy `npm run lint`/`npm run build`/`npm run audit` thật.
> File này KHÔNG mô tả chức năng/kiến trúc — xem [MAP_PROJECT.md](MAP_PROJECT.md) cho phần đó.

---

## 0. Xác nhận bằng công cụ thật (build/lint/audit) — Cập nhật mới nhất

* **`npm run build` (frontend):** **PASS ✅** — Toàn bộ route build sạch kể cả `/cong-dong/**` và `/bai-hoc/**`.
* **`npm run lint` (frontend):** **0 errors**, 981 warnings (giảm từ 1052 vấn đề với 7 error ban đầu). 100% lỗi runtime/compiler ("Cannot access variable before it is declared", "Cannot access refs during render", React compiler memoization mismatch) đã được xử lý triệt để. Các warning còn lại thuộc nhóm check-file dynamic route `[slug]`, sonarjs cognitive-complexity, duplicate string literals.
* **`npm run lint` (backend):** **0 errors**, 143 warnings (giảm từ 718 errors / 201 warnings ban đầu). Đã dọn sạch toàn bộ lỗi format Prettier, CRLF line-ending, unused vars, và regex useless escapes.
* **`npm run audit:dup` (jscpd):**
  - **Backend:** 164 files, 21,684 lines — **3.35% trùng lặp** (51 clones, 727 lines). Nằm sâu dưới ngưỡng an toàn 5%.
  - **Frontend:** 410 files, 77,605 lines — **1.36% trùng lặp** (90 clones, 1056 lines). Con số tối ưu sau đợt tái cấu trúc Pha 4.
* **`npm run audit:knip` (knip):**
  - **Unlisted dependencies:** **0** (đã bổ sung đầy đủ `socket.io-client` vào `frontend/package.json` và `multer` vào `backend/package.json`).
  - **Unused files:** Phát hiện 19 files không còn được import (được đưa vào danh sách rà soát Pha 3/Pha 4).
  - **Unused exports:** 5 exports backend và 23 exports frontend (sẽ được tinh gọn dần).
* **`npm test` (backend):** PASS 24/24 suites, 185/185 tests.
* **`tsc --noEmit`:** 0 errors trên toàn bộ mã nguồn chính của cả backend (`tsconfig.build.json`) và frontend (`tsconfig.json`).

---

## 1. Vi phạm theo file (đã đọc toàn bộ nội dung)

### `frontend/src/components/hisgo/CommentThread.tsx` (908 dòng)
* **Không được import/dùng ở bất kỳ page/route nào trong codebase hiện tại** (Grep toàn repo chỉ ra chính file này) — tàn tích luồng comment blog cũ, tách biệt hoàn toàn với luồng Cộng đồng mới.
* Gọi `fetch` trực tiếp 6 lần (dòng 208, 336, 409, 487, 549, 584) thay vì qua `services/api.ts`.
* Tự khai `API_BASE_URL` fallback riêng (dòng 10), trùng với fallback đã có ở `public-auth.service.ts`.
* Dùng `any`: `normalizeReply`/`normalizeComment` (dòng 80, 89), socket handler `payload: any` (dòng 242, 270), nhiều biến `responseData` ngầm định `any`.
* Dùng `as any` để truy cập field: dòng 280, 284 (`(existing as any)?.authorId/.author`).
* Magic string API path lặp lại không tách hằng số: `/posts/${postId}/comments` (208, 336, 409), `/comments/${commentId}` (487, 549), `/comments/${commentId}/like` (584).
* Magic number `2200` (ms hiện thông báo) lặp lại 8 lần (267, 368, 388, 442, 468, 526, 541, 568, 576).
* Component quá dài (908 dòng, ngưỡng 200-300) — nên tách hook `useComments(postId)` + sub-component `CommentCard`/`ReplyCard`/`CommentForm`/`DeleteConfirmDialog`.
* try/catch nuốt lỗi gốc không log ở 6 hàm (`loadComments`, `handleSubmit`, `handleReplySubmit`, `handleEditSubmit`, `handleDeleteComment`, `handleToggleLike`) — fallback âm thầm sang localStorage, mất lý do lỗi thật.
* **Code chết:** `appendReplyToComment` (dòng 159-178) không được gọi ở đâu, và nhánh `if/else` (dòng 174-176) trả về giống nhau (vô dụng).
* **Khuyến nghị:** xác nhận với team có cần giữ file này không — nếu không, xoá hẳn; nếu cần, viết lại qua service layer + tách nhỏ.

### `frontend/src/features/lessons/components/hub/HubLessonQuiz.tsx` (497 dòng)
* Vượt ngưỡng 200-300 dòng (gồm `QuestionBody` lồng trong cùng file — nên tách riêng).
* `as any` nhiều lần để fallback field `text`/`label`/`content` thiếu nhất quán (dòng 110, 235, 315, 327) — nên mở rộng type gốc `QuizQuestion`/option/item thay vì ép kiểu tại nơi dùng.
* Magic number `70` (điểm đạt mặc định `quiz.passingScorePercent || 70`, dòng 374) chưa tách hằng số (ví dụ `DEFAULT_PASSING_SCORE_PERCENT`).
* `String.fromCharCode(65 + idx)` lặp lại 3 nơi (~101, 106, 445) để sinh nhãn A/B/C — mức nhẹ, có thể gom hàm `toOptionLetter(idx)`.

### `frontend/src/app/api/notes/route.ts` và `[id]/route.ts`
* Lặp định nghĩa fallback `BACKEND_URL` riêng ở cả 2 file, cùng pattern lặp ở ≥3 route `app/api/public/...` khác (tổng 5 nơi) — nên gom 1 hằng số/util chung cho route handler.
* Tên header `'authorization'`/`'x-guest-id'` gõ lại dạng chuỗi ở cả 4 handler — nên tách hằng số `AUTH_HEADER`/`GUEST_ID_HEADER`.
* Không vi phạm try/catch (có lý do rõ: map lỗi mạng → response lỗi rõ nghĩa); không `any`/code chết.

### `frontend/src/features/articles/components/ArticleProfilePanel.tsx` (491 dòng)
* Vượt xa ngưỡng 200-300 dòng — nên tách `ListField`, `Section`, và từng nhánh hồ sơ (Person/Site/Event) + phần Liên kết ra component con riêng.
* `LABEL_SUGGESTIONS` dùng key ghép chuỗi `'PERSON>EVENT'` (dòng 33-44) — tạm chấp nhận (dùng 1 chỗ), nên build từ enum `ArticleKind` nếu mở rộng loại.

### `frontend/src/features/articles/components/ContentBlockEditor.tsx` (264 dòng)
* Nút "Hoàn tác"/"Làm lại" (Undo2/Redo2, dòng 104-119) hiển thị nhưng **không có `onClick`** — UI chết, cần gắn handler thật hoặc ẩn/disable kèm lý do.
* `// eslint-disable-next-line react-hooks/exhaustive-deps` (dòng 63) không kèm comment giải thích lý do.
* `useMemo(() => 'max-w-3xl', [])` (dòng 82) bọc hằng số không đổi — over-engineering nhẹ, nên khai `const` thẳng.

### `frontend/src/features/articles/components/ArticlePicker.tsx` (109 dòng)
* `catch { setResults([]); }` (dòng 38-39) nuốt lỗi gọi API hoàn toàn im lặng, không log, không phân biệt lỗi mạng với "không có kết quả".

### `frontend/src/features/heritage/components/HeritageExplorer.tsx` (148 dòng)
* `const LIST_PATH = '/di-tich'` (dòng 29) trùng với hằng số đã có sẵn `PERIOD_ROUTES.LOCATIONS` (`period-detail.adapter.ts`) — nên dùng lại hằng số chung thay vì magic string route cục bộ.

### `frontend/src/features/period-detail/components/PeriodDetailView.tsx` (373 dòng)
* Vượt ngưỡng 200-300 dòng — nên tách các section lớn (mục lục, Giai đoạn con, Nhân vật, Địa danh, Cùng thời kỳ) thành component con riêng. Không phát hiện vi phạm khác.

### Các file đã đọc toàn bộ nhưng KHÔNG phát hiện vi phạm đáng kể
`frontend/src/features/lessons/components/hub/{useLessonMedia.ts, LessonToc.tsx, HubLessonGate.tsx, HubUi.tsx, HubSyllabus.tsx, useLessonProgress.ts, LessonRelated.tsx, lesson-reader.css}` — hằng số nghiệp vụ đã tách rõ, dưới ngưỡng dòng, không `any`/`as`/console.log/code chết.

### Vi phạm cấp dự án (phát hiện từ vòng khảo sát chức năng, cần audit sâu hơn để xác nhận mức độ)
* `BlogService.listPosts` (`backend/src/blog/blog.service.ts` dòng ~69-111) — `findMany` không `take/skip`, phân trang + sort trending làm ở Node sau khi fetch hết → lệch quy ước "API danh sách phải phân trang ở DB".
* `ModerationAiService` (`backend/src/moderation/moderation-ai.service.ts` dòng 144) đọc `process.env.GEMINI_API_KEY` trực tiếp, không qua `ConfigService`/`app.config.ts`.
* `frontend/src/components/hisgo/NotificationBell.tsx` và `frontend/src/features/users/components/UserList.tsx` gọi axios instance chung trực tiếp tại chỗ dùng, chưa tách file `services/entities/*ApiService` riêng (khác convention các feature khác).

---

## 2. Category / Tag / Topic / Timeline / Landing / Search

### Backend
* `backend/src/tag/tag.service.ts:58` — `const where: any = {}` — dùng `any`; nên khai `Prisma.TagWhereInput` (giống `topic.service.ts`/`timeline.service.ts` đã làm đúng).
* `backend/src/topic/topic.service.ts:37,281` — `lessons?: any[]` trong `ITopicTreeNode` — dùng `any`.
* `backend/src/topic/topic.service.ts:273,282,294` — `where: { status: 'PUBLISHED' }` dùng chuỗi literal thay vì enum `ContentStatus.PUBLISHED` đã import sẵn trong cùng file (dùng đúng ở dòng 142) — magic string không nhất quán.
* `backend/src/topic/topic.service.ts:196,233,250,317,553` — nhiều `catch (err)` dùng `err.message` không khai báo kiểu rõ (`unknown`/`instanceof Error`).
* `category.service.ts/controller.ts`, `tag.controller.ts/constant.ts`, `timeline.service.ts/controller.ts` — không phát hiện vi phạm đáng kể.

### Frontend
* `frontend/src/features/topics/components/TopicEditor.tsx` — **~1089 dòng**, vượt rất nặng ngưỡng 200-300 dòng — cần tách gấp.
* `frontend/src/features/topics/components/TopicModal.tsx` — ~570 dòng, vượt ngưỡng, logic trùng với TopicEditor.
* `frontend/src/features/topics/components/TopicParentModalPicker.tsx` — ~500 dòng, vượt ngưỡng.
* `frontend/src/features/topics/components/TopicCoverImagePicker.tsx:27` — tự khai `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'` thay vì import base URL từ `services/api.ts`.
* `frontend/src/features/tags/components/TagForm.tsx:23` và `TagList.tsx:24,43,48,72` — gọi `api.post/get/patch/delete('/tags'...)` **trực tiếp trong component** thay vì qua `TagApiService` đã có sẵn.
* `frontend/src/features/tags/components/TagList.tsx:54-66,74-77` — catch lỗi nhưng cập nhật UI như thành công bằng dữ liệu giả (`id: tag-${Date.now()}`) — che giấu lỗi thật với người dùng. Phân trang cũng chỉ là UI tĩnh (luôn hiện nút "1"), không truyền `limit/page` thật.
* `frontend/src/features/timelines/components/TimelineEditor.tsx` — dùng chuỗi literal `'DRAFT'/'PUBLISHED'/'PENDING_REVIEW'` nhiều lần thay vì enum `ContentStatus` chung.
* `frontend/src/features/taxonomy/*`, `services/public/public-taxonomy.ts` — mã nhóm `'REGION'`, `'FIGURE_ROLE'`, `'EVENT_TYPE'` lặp rải rác không có enum/const chung.
* Không vi phạm đáng kể: `TagModal.tsx`, `TopicForm.tsx`, `TopicPicker.tsx`, `TimelineList.tsx`, toàn bộ `features/landing/**`, `features/search/*` (catch rỗng trong `search.service.ts` có comment lý do rõ — hợp lệ).

---

## 3. Curriculum / Lesson / Learner / Note / Content-Revision

### Backend
* `backend/src/learning-path/learning-path.service.ts` — `addLessonsToChapter` dùng `any[]` và loop upsert **phụ thuộc thứ tự không nằm trong `$transaction`** — vi phạm "nhiều thao tác ghi phụ thuộc nhau phải trong transaction".
* `backend/src/lesson/lesson.service.ts` + `strategies/content-normalizer.strategy.ts` — **[ĐÃ SỬA ✅ — Pha 2]** dùng `any` có hệ thống (`Promise<any>`, `formatLessonResponse`, `calculateReadTime`, mọi method strategy); phát hiện thêm bug `_creatorUserId` bị bỏ qua trong `LessonService.create()` khiến `createdBy` luôn `null` (vô hiệu hoá quy tắc 2 người duyệt `CANNOT_REVIEW_OWN`) — đã sửa lưu `createdBy: creatorUserId || null`.
* `backend/src/lesson/lesson.controller.ts` + `dto/create-lesson.dto.ts` — **[ĐÃ SỬA ✅ — Pha 2]** `@Req() req: any`, nhiều field DTO kiểu `any`.
* `backend/src/note/note.service.ts` — **tự bọc response `{statusCode, message, data}`** dù `TransformInterceptor` đã bọc toàn cục ở tầng global — vi phạm rõ nhất quy ước "không tự bọc response" trong `CLAUDE.md`.
* `backend/src/content-revision/revision-targets.ts` — `Record<string, any>`, `as any` khi gọi `apply` (registry generic, khó tránh hoàn toàn nhưng nên thu hẹp kiểu).
* `backend/src/learner/**` — không vi phạm, được đánh giá là mẫu tốt (constants, DTO rõ kiểu).

### Frontend
* `frontend/src/features/lessons/components/builder/StoryChapterBlockEditor.tsx` — **1459 dòng**, vi phạm độ dài nặng nhất toàn bộ audit.
* `StoryChapterBlockInspector.tsx` — 893 dòng; `StorySubElementInspector.tsx` — 783 dòng; `EventPickerModal`/`EntityPickerModal` ~500-600 dòng và gần như bản sao nhau — nên gộp logic chung.
* `frontend/src/features/lessons/types/editor.types.ts` — `ContentStatus | any` trong interface public của facade — làm `any` lan ra toàn hệ thống dùng type này.
* `quiz/QuizQuestionCard.tsx` — `onChange as any` lặp 6 lần; nhiều facade/plugin khác (quote-block, comparison-table-block, wikidata-claims adapter) cũng dùng `any`/`as any` ở biên dữ liệu block.
* Dữ liệu mẫu nghiệp vụ (quiz, sự kiện Điện Biên Phủ) hard-code trùng lặp độc lập giữa hệ TipTap cũ và hệ Plugin mới — rủi ro bảo trì khi 1 bên đổi mà quên bên kia.
* `frontend/src/features/notes/services/note.service.ts` — tự viết `fetch` wrapper thay vì dùng axios instance `services/api.ts`; hardcode key localStorage `'access_token'` lặp 4 lần — vi phạm rõ quy tắc "một HTTP client".
* `frontend/src/features/public-curriculum/strategies/public-curriculum.strategies.ts` (526 dòng) — `any` tràn lan trong logic chấm điểm quiz.
* Nhiều component curriculum quá dài: `HisgoStudioView.tsx` 808 dòng, `CurriculumTree.tsx` 705 dòng, `RevisionDiff.tsx` 467 dòng.
* `CurriculumSidePanel.tsx` và `CurriculumTreePreviewModal.tsx` gần như bản sao nhau — nên gộp hook/component chung.

#### 3.x. Block Builder (`features/lessons`) — bổ sung từ lượt rà soát khi cập nhật MAP_PROJECT mục 3.8
* **Code chết — `components/builder/TimelineNodeCanvasDrawer.tsx`:** không có file nào import (grep toàn `frontend/src`). Nên xoá hoặc nối vào `TimelineBlockItemEditor`.
* **Code chết — `templates/` (`lesson-template.factory.ts`, `lesson-template.types.ts`, `strategies.ts`, 5 mẫu Standard/MilitaryCampaign/HistoricalFigure/TreatyConference/Blank):** `LessonTemplateFactory` chỉ được tham chiếu trong chính file định nghĩa, chưa nối vào UI tạo bài. Nên nối vào luồng "Tạo bài học" hoặc xoá.
* **Hai palette song song, không đồng bộ:** `LessonBlockPalette.tsx` (cột trái, đọc `constants/block-palette.constants.ts`, tự vẽ SVG icon bằng `switch`) và `builder/BlockLibraryPalette.tsx` (có `BLOCK_TYPE_ICONS` dùng lucide) — hai nguồn icon/danh sách khối riêng, dễ lệch khi thêm khối mới (OCP).
* **Palette thiếu khối so với Registry:** `LESSON_BLOCK_ITEMS` chỉ có 16/18 loại — **không có `QUIZ` và `RESOURCE_LINK`**; `BLOCK_TYPE_VI_LABELS` trong `BlockPropertyInspector.tsx` cũng thiếu 2 loại này. Hai loại soạn ở nơi khác (`LessonQuizPanel`, `LessonPublishingTab`).
  * **✅ Đã kiểm chứng cách canvas xử lý:** `BlockBuilderCanvas.tsx` có 3 `switch`. Ở cấp ngoài, `default` (dòng ~274) hiển thị placeholder chữ `Khối nội dung <TYPE>` — **không crash** nhưng cũng không sửa được. Trong cột `SECTION_ROW`, `default` (dòng ~440) hiển thị `Khối <TYPE>`. Riêng `renderGenericChildBlock` (dùng cho khối con của `STORY_CHAPTER`, `default` ở dòng ~343) **`return null` — khối loại chưa hỗ trợ bị ẩn hoàn toàn, người soạn không biết nội dung đang tồn tại**. Nên đổi sang placeholder giống 2 nhánh kia (hoặc dùng `LessonBlockRegistry` tra plugin).
* **Khối không có editor/inspector riêng, vẽ inline trong `BlockBuilderCanvas.tsx` (523 dòng):** `VIDEO` (chỉ một `<input>` nhập `src`, không có upload/chọn media như `ImageBlockItemEditor`, không có Inspector), `HEADING`, `DIVIDER`, `RELATED_PEOPLE`, `RELATED_EVENTS`. Không đồng nhất mẫu `*ItemEditor` + `BLOCK_INSPECTOR_STRATEGIES` (SRP/OCP) và khối `VIDEO` kém tính năng hơn `IMAGE`.
* **Logic render lặp trong `BlockBuilderCanvas.tsx`:** nhiều loại khối có 2 nhánh `case` (khối cấp ngoài và khối trong cột `SECTION_ROW`, ví dụ `MAP` xuất hiện 2 lần với cùng JSX, chỉ khác callback `onUpdateBlockInColumn`) — nên gom thành một hàm render nhận callback trừu tượng.
* **Type trùng:** `TocItem` được khai báo ở cả `types/left-sidebar.types.ts` và `components/LessonPreviewContent.tsx` (`LessonLeftToolSidebar` import bản của component) — chỉ nên giữ 1 nguồn trong `types/`.
* **File vượt ngưỡng 300 dòng chưa được liệt kê ở Mục 7:** `story-chapter-layout.strategy.ts` (791), `LessonEditor.tsx` (525), `BlockBuilderCanvas.tsx` (523), `useLessonBlockManager.ts` (493), `TimelineBlockItemEditor.tsx` (486), `TipTapToolbar.tsx` (477), `TypographyInspectorPanel.tsx` (458), `block-builder.types.ts` (452), `useLessonEditorFacade.ts` (415), `QuizQuestionEditors.tsx` (394), `LessonPreviewContent.tsx` (353), `LessonTagPicker.tsx` (347), `HistoricalTimelineBlock.tsx` (338), `LessonPropertiesPanel.tsx` (333), `WikiLinkInspectorSection.tsx` (321), `RowSectionBlockInspector.tsx` (319), `ImageBlockView.tsx` (316), `VideoBlockView.tsx` (307), `TimelineBlockInspector.tsx` (307).
* **🔴 [ĐÃ KIỂM CHỨNG] Rủi ro XSS lưu trữ (stored XSS) ở đường render HTML nội dung:**
  * `plugins/text-block.plugin.ts` → `toHtml` trả nguyên `block.content` (HTML TipTap) **không escape/không sanitize**; `divider`/`section-row` không dùng `escapeHtml` (chỉ ghép HTML tĩnh/đệ quy nên không phải điểm rò). Các plugin còn lại đều dùng `escapeHtml`/`safeUrl`.
  * HTML biên dịch được đưa thẳng vào `dangerouslySetInnerHTML` ở: `PublicLessonReaderView.tsx:309` (trang bài học công khai), `EntityReader.tsx:265` (trang bài viết), `BlogDetailPage.tsx:305` (blog), `LessonPreviewContent.tsx:236,336`, `HubLessonQuiz.tsx:417` (`q.prompt`).
  * Toàn dự án **không có thư viện sanitize** (không `DOMPurify`/`sanitize-html` trong `frontend/package.json` & `backend/package.json`; grep `sanitize` chỉ ra `sanitizeMetadata` không liên quan). Backend lưu `content` JSONB nguyên bản (`content-normalizer.strategy.ts` không lọc HTML).
  * **✅ Đã xác nhận quyền Blog & đường render Blog:** người dùng thường tạo được Blog nhưng phải qua duyệt (DRAFT → PENDING_REVIEW → PUBLISHED). **`BlogDetailPage.extractBlocksHtml` tự `escapeHtml` toàn bộ heading/text/quote/caption/imageUrl** → luồng khối Blog **không** phải vector XSS. Phần `contentBlocks` lưu ở backend không sanitize (`blog.service.ts:216,273` chỉ `as any`) nhưng FE escape khi hiển thị. **Ngoại lệ thật duy nhất:** `BlogDetailPage.tsx:219` — `const articleBody = blocksHtml || \`<p>${post.excerpt || '...'}</p>\``: khi bài không có khối nội dung hợp lệ, **`post.excerpt` được chèn nguyên văn (không escape) vào HTML rồi `dangerouslySetInnerHTML`** → người dùng thường có thể cài `<img onerror=...>` vào `excerpt` của một Blog có `contentBlocks` rỗng/chỉ metadata. Bước duyệt chỉ giảm xác suất (người duyệt xem preview ở `BlogReviewList` render bằng React nên có thể không thấy payload), không chặn được. → **Sửa ngay:** `escapeHtml(post.excerpt)` (hoặc render qua JSX thay vì HTML string).
  * Với bài học/bài viết (`PublicLessonReaderView`, `EntityReader`): chỉ STAFF viết nên rủi ro thấp hơn (tin cậy nội bộ), nhưng vẫn nên sanitize như lớp phòng thủ chiều sâu, nhất là khi tài khoản STAFF bị chiếm.
* **`any` trong `plugins/` (đã grep toàn bộ 21 file):** `block-plugin.registry.ts` (`BlockPlugin<any>` ×4 — chấp nhận được vì Map đa hình, nên thu hẹp bằng generic/union), `comparison-table-block.plugin.ts` (dòng 31, 48, 51, 61 — đọc dữ liệu legacy dạng `data.*` bằng `as any`/`any[]`), `quote-block.plugin.ts` (dòng 18, 21 — fallback field cũ `quote`/`source`), `section-row-block.plugin.ts` (dòng 8-9 — `compilerFn: (block: any) => string`, nên gõ `LessonBlockItem`). Các plugin khác sạch `any`.
* **Dữ liệu mẫu hard-code trong `createDefault()` của plugin:** `quiz-block.plugin.ts` (câu hỏi/đáp án Điện Biên Phủ) và `section-row-block.plugin.ts` (nhân vật "Đại tướng Võ Nguyên Giáp", "1911 – 2013") — mỗi lần tác giả thêm khối mới là nhận nội dung mẫu cụ thể thay vì khung trống; nên chuyển sang placeholder trung tính hoặc hằng số chung (đã nêu ở mục trùng lặp dữ liệu mẫu quiz/ĐBP).
* **Phạm vi dùng lại của Block Builder (đã kiểm chứng bằng grep):** `ContentBlockEditor.tsx` chỉ được `ArticleEditor.tsx` dùng; `BlogCreatePage`/Blog **không** dùng `BlockBuilderCanvas`/`LessonBlockRegistry`/`LessonBlockFactory`. Hạ tầng block chỉ được 3 nơi cùng dùng: `LessonEditor`, `ArticleEditor`, `lesson-toc.util`.
* **`lesson.service.ts` & phụ trợ phía backend (đã grep):** `Promise<any>` ở `create/findAll/findOne/findBySlug/update/review` (dòng 99, 150, 233, 255, 279, 352), `calculateReadTime(content: any)`, `formatLessonResponse(lesson: any)` + `(lt: any)`; `lesson.controller.ts` `@Req() req: any` (dòng 56, 170); `dto/create-lesson.dto.ts` có 5 field `any` (`content`, `contentRichText`, `difficulty`, `displayOrder`, `tags`) — **`difficulty?: any` đáng chú ý vì Prisma đã có enum `DifficultyLevel`**; `lesson-response.dto.ts` (`content`, `chapter` kiểu `any`); `content-normalizer.strategy.ts` toàn bộ interface/strategy dùng `any`. (`lesson-enrichment.spec.ts` dùng `any` nhưng là file test, import dữ liệu mẫu từ `prisma/seed-lesson-dien-bien-phu` — không phải vi phạm.)
* **Còn chưa kiểm tra:** magic string/number bên trong `strategies/story-chapter-layout.strategy.ts` (791 dòng) và `TipTapToolbar.tsx`; các `plugins/*.plugin.ts` chưa đọc từng dòng ngoài phần `any` (đã đọc đầy đủ `text`, `divider`, `section-row`, phần đầu `quiz`).

---

## 4. Quiz CMS (Question Bank, Standalone Quiz Editor, backend validators — ngoài `HubLessonQuiz.tsx` đã audit ở Mục 1)

### Backend
* `backend/src/quiz/quiz.service.ts` — `where: any = {}`, `quiz.questions as any[]`, `normalizedQuestions as any` nhiều chỗ; magic number `limit=20`, `timeLimitMinutes??15`, `passingScorePercent??80` lặp lại không tách hằng; magic string `'DRAFT'/'ACTIVE'` lặp 3 lần.
* `backend/src/quiz/question.service.ts` — magic string/number `'MEDIUM'`/`10` lặp 3 lần; **model `Question.difficulty`/`Question.type` là `String` tự do trong Prisma schema dù đã có enum `DifficultyLevel`** (và `Lesson.difficulty` đã dùng enum này) — lệch convention enum Prisma rõ ràng; `backfillFromQuizzes()` **N+1 write trong vòng lặp** (tạo từng record riêng lẻ, không `createMany`/transaction); `catch (err) { console.warn(...) }` dùng `console.warn` thay vì NestJS `Logger`.
* `backend/src/quiz/validators/quiz-question.validator.ts` — rất nhiều `any` không cần thiết (`opt: any`, `it: any`, `list: any[]`, `correctPairs as any[]`...).
* `backend/src/quiz/dto/create-question.dto.ts` — `data: any`; `difficulty?: string` dùng `@IsString()` thay vì `@IsEnum(DifficultyLevel)`.
* Không vi phạm đáng kể: `quiz.controller.ts`, `question.controller.ts`, `standalone-quiz.controller.ts`, `quiz.module.ts`, các DTO còn lại, `types/quiz-question.types.ts`.

### Frontend
* `frontend/src/app/luyen-tap/page.tsx` (848 dòng) — **BUG THẬT**: `passingScorePercent` dùng 2 fallback khác nhau — `|| 80` khi chấm điểm (dòng 274) vs `|| 70` khi hiển thị UI (dòng 447, 471) → có thể hiện sai kết quả đạt/không đạt cho người học. Ngoài ra: quá dài (gộp timer+scoring+UI), magic string loại câu hỏi lặp lại thay vì dùng enum `QuizQuestionType` có sẵn, tự định nghĩa lại type `RawQuizQuestion`/`PublicQuiz` trùng với type đã có ở service, thiếu trạng thái "lỗi" khi tải `/api/public/lessons` (chỉ console.error, UI hiện như "rỗng"), `handleSubmitExam` set `submitted=true` trước khi gọi API nên nếu submit lỗi, người dùng vẫn thấy "nộp thành công" dù chưa lưu được.
* `frontend/src/features/quiz/components/QuestionBankModal.tsx` — **931 dòng**, nhiều `any` khi xử lý dữ liệu đa hình theo loại câu hỏi.
* `frontend/src/features/quiz/components/QuestionBankView.tsx` — **712 dòng**, nhiều `any` khi render đáp án theo loại; catch chỉ log, không có state lỗi UI riêng.
* `frontend/src/features/quiz/components/QuizManagementView.tsx` (381 dòng) — vượt nhẹ ngưỡng; `setFilterStatus(e.target.value as any)`.
* `frontend/src/services/entities/question.service.ts` — `data: any` ở 2 type; `frontend/src/features/quiz/strategies/quiz-filter.strategy.ts` — `questions: any[]`; `useQuizManagementFacade.ts` — `catch (err: any)` x2.
* Không vi phạm đáng kể: `CategoryTreePicker.tsx`, `LessonQuickPreviewModal.tsx`, `QuizBriefingCard.tsx`, `QuizFilterBar.tsx`, `QuizPreviewModal.tsx`, `QuizSelectorGrid.tsx`, `QuizStatisticsModal.tsx`, `quiz.service.ts`, `app/quizzes/page.tsx`, `app/questions/page.tsx`.
* **Gap chức năng (không phải lỗi rule):** `calculateScore` chỉ xử lý `MULTIPLE_CHOICE/TRUE_FALSE/FILL_IN_BLANK`; nhánh `else` coi mọi loại câu hỏi khác là "luôn đúng" nếu có `userAns` — hiện an toàn vì UI chưa tạo `userAns` cho các loại đó, nhưng là logic ngầm nguy hiểm nếu sau này thêm UI mà quên cập nhật hàm chấm.

---

## 5. Blog / Cộng đồng / Kiểm duyệt / Thảo luận / Thông báo

### Backend
* `backend/src/blog/blog.service.ts` (1297 dòng, file lớn nhất dự án):
  - `listPosts` không phân trang ở DB — `findMany` lấy hết rồi `sort/slice` trong JS (xác nhận lại, dòng 40-136).
  - `any` tràn lan: `where: Record<string, any>`, `computeTrendingScore = (post: any) =>`, `mapPost(post: any)`, `mapComment(comment: any)`.
  - `as any` ép enum ở 4 vị trí (dòng 183, 187, 229, 238) — nguyên nhân gốc: `blog-post.dto.ts` tự định nghĩa lại `BLOG_POST_STATUSES`/`POST_TYPES` trùng enum Prisma `ContentStatus`/`PostType` thay vì import enum thật, rồi `@IsEnum(... as any)` lặp 6 lần.
  - **Bug validate DTO mới phát hiện (`blog-post.dto.ts:98-101, 165-168`):** trường `publishedAt` gắn đồng thời `@Type(() => Date)` và `@IsString()`. Vì `ValidationPipe` toàn cục bật `transform: true`, `class-transformer` biến chuỗi ngày thành instance `Date` trước khi `@IsString()` chạy → mọi request truyền `publishedAt` đều bị `400 Bad Request` (`publishedAt must be a string`).
  - **Sai mã lỗi HTTP phân quyền (`blog.service.ts:534, 580`):** `updateComment` và `deleteComment` ném `BadRequestException` (400) thay vì `ForbiddenException` (403) khi `comment.authorId !== authorId`.
  - Magic string trạng thái (`'PENDING_REVIEW'`, `'PUBLISHED'`, `'REJECTED'`, `'VISIBLE'`, `'REMOVED'`) rải khắp thay vì dùng enum đã import.
  - 5 catch nuốt lỗi có comment lý do nhưng không gọi `Logger` để ghi lại.
  - Magic number `50`/`2`/`6`/`20` chưa tách hằng.
  - `review`/`updatePost`/`deletePost` trong controller **không có `@UseGuards(AuthGuard)`** — lỗ hổng phân quyền cần xem lại.
* `backend/src/discussion/discussion.service.ts` — tốt nhất trong nhóm: có phân trang DB thật; chỉ có `.includes(userRoleVal as any)` lặp 2 lần nên sửa kiểu tham số từ đầu.
* `backend/src/moderation/moderation.service.ts` — **`resolveReport` re-validate `dto.action` bằng tay dù DTO đã `@IsIn([...])`** — vi phạm "validate ở boundary, service tin dữ liệu đã qua DTO"; magic string action/source không nhất quán dù đã có enum `ReportActionTaken`; `listReports` (~210 dòng) làm quá nhiều việc trong 1 hàm; catch im lặng không log ở 4 vị trí.
* `backend/src/moderation/moderation-ai.service.ts` — đọc `process.env.GEMINI_API_KEY` VÀ `process.env.GEMINI_MODEL` trực tiếp (2 vị trí, không chỉ 1); `const data: any = await response.json()`.
* **Circular dependency xác nhận:** `BlogModule` ⇄ `ModerationModule` dùng `forwardRef` 2 chiều thật — nên tách `BlogGateway` ra module riêng hoặc dùng event emitter để decouple.
* `backend/src/notification/*` — `emitNewNotification(userId, notification: any)`; `getUserNotifications` không giới hạn trần cho `limit` query (thiếu `Math.min`); catch rỗng không log khi emit socket lỗi.

### Frontend
* **Base URL API hardcode lặp lại ở 6 file với 3 giá trị KHÁC NHAU** — rủi ro thật, không chỉ vi phạm quy ước:
  - `NotificationBell.tsx:10`, `CommunityFeed.tsx:37`, `PostCommentModal.tsx:28`, `CommunityProfileView.tsx:37` → `'http://127.0.0.1:5000'`
  - `BlogCreatePage.tsx:12,34` → `'http://localhost:5001'` (port khác hẳn!)
  - `BlogReviewList.tsx:56` → `'http://localhost:5000'`
* `frontend/src/features/community/components/PostCommentModal.tsx` (**1269 dòng**) — vi phạm nặng nhất trong frontend: **gọi `fetch()` trực tiếp 5 lần**, tự set header `Authorization` lặp 4 lần; `any` ở vài chỗ; ~200 dòng mock data lịch sử nhúng cứng trong component UI; trộn localStorage+API+preset data phức tạp dễ lệch dữ liệu; hàm `getAuthorTint`/`getInitials` trùng lặp y hệt ở `PostCard.tsx`, `CommunityProfileView.tsx`.
* `frontend/src/features/community/components/CommunityProfileView.tsx` (**1135 dòng**) — vượt ngưỡng nặng, gộp quá nhiều UI trong 1 file.
* `frontend/src/features/community/components/CommunityFeed.tsx` (876 dòng) — quá dài nhưng là điểm sáng duy nhất có xử lý đủ loading/lỗi/rỗng.
* `frontend/src/features/community/components/QuickComposer.tsx` (604 dòng) — quá dài, không `any`.
* `frontend/src/components/hisgo/NotificationBell.tsx` (433 dòng) — gọi axios trực tiếp 3 lần trong component; thiếu trạng thái lỗi (chỉ loading+rỗng); quá dài.
* `frontend/src/features/review/components/BlogReviewList.tsx` (**719 dòng**) — nhiều `any`/`as any`; hàm `extractMetadataFromBlocks` **trùng lặp gần như y hệt ở ≥3 file** (`BlogDetailPage.tsx`, `BlogLandingPage.tsx`, `BlogReviewList.tsx`, ~60-77 dòng mỗi bản) — nợ DRY mà `jscpd` sẽ bắt được; có điểm tốt: dùng đúng `ContentStatus` enum chung (nhưng các file khác không theo).
* `frontend/src/features/blog/components/BlogCreatePage.tsx` (**931 dòng**) — hardcode base URL 2 lần; hardcode string trạng thái thay vì enum chung.
* `frontend/src/features/blog/components/BlogDetailPage.tsx` (457 dòng), `BlogLandingPage.tsx` (316 dòng) — có bản sao hàm `extractMetadata` như trên.
* `frontend/src/services/entities/blog.service.ts` — tự định nghĩa `BlogStatusValue`/`BlogPostTypeValue` trùng `ContentStatus` enum đã có.
* **[ĐÃ ĐỌC HẾT ✅]** 4/5 file còn lại trong `features/review/components/` (`ReviewList.tsx`, `RevisionReviewList.tsx`, `ArticleReviewList.tsx`, `ReviewModal.tsx`):
  - Không lặp `extractMetadataFromBlocks` hay hardcode base URL.
  - Tuy nhiên phát hiện mới:
    1. `ReviewList.tsx:47,99,119` gọi `api.get('/lessons')` và `api.patch('/lessons/:id/review')` trực tiếp trong component thay vì qua `LessonApiService`; ép `(lesson as any)?.creator`.
    2. `ArticleReviewList.tsx:58-60` lọc cứng tiêu đề/slug bài viết mẫu trong code production (`normalizedTitle !== 'cổng la mã và không gian quyền lực'`, `!normalizedSlug.includes('cong-la-ma')`).
    3. `ReviewList.tsx` (280 dòng) và `ArticleReviewList.tsx` (287 dòng) trùng cấu trúc ~80% (tab, search, notice, bảng duyệt, `ReviewModal`).
    4. `ReviewModal.tsx:127` dùng `alert('Vui lòng nhập lý do từ chối!')` thay vì hiển thị lỗi inline trên form.
    5. `RevisionReviewList.tsx` (119 dòng) viết sạch, đúng quy ước.
* Không vi phạm đáng kể: `PostCard.tsx` (486 dòng, border-line nhưng catch rollback có lý do rõ), `PostActionBar.tsx`, `ReportDialog.tsx`, `features/moderation/api.ts`, `DiscussionSection.tsx` (317 dòng, hơi vượt nhẹ), `BlogBrowser.tsx`, `BlogComposerBar.tsx`, `BlogFeaturedSlider.tsx`, `discussion.service.ts`.

---

## 6. Auth / User / Dashboard / Settings / Upload / Metrics / `common/`

### Backend
* `backend/src/auth/interfaces/auth.interface.ts` — **enum `UserRole` (CUSTOMER/MODERATOR/ADMIN/SUPER_ADMIN) lệch hoàn toàn với Prisma `userRole` (USER/ADMIN/MODERATOR/SUPERADMIN) và với enum frontend** — rủi ro cao vì đây là service bảo mật (JWT payload dùng enum này). `AuthUtilsService.canModifyRole()` dùng enum sai này và **không được gọi ở đâu trong codebase** — dead code chứa logic sai, nên xoá hoặc viết lại đúng enum Prisma.
* `backend/src/common/services/prisma.service.ts` — **24 dòng code chết bị comment lại nguyên 1 class cũ** (vi phạm trực tiếp "không để code chết/bị comment trong commit"); import `PrismaClient` từ `@prisma/client` thay vì `generated/prisma/client`; đọc `process.env.DATABASE_URL` trực tiếp.
* **Import `@prisma/client` thay vì `generated/prisma/client` lan rộng** ở: `auth.service.ts`, `user/dto/create-user.dto.ts`, `user/dto/user-response.dto.ts`, `dashboard.service.ts`, `dashboard-overview.dto.ts`, `public-content.service.ts`, `public-content.mapper.ts`, `common/access/access.constant.ts`, `common/services/prisma.service.ts` — vi phạm quy ước Prisma ở quy mô lớn.
* **Salt rounds bcrypt không nhất quán**: `auth.service.ts` dùng 12, `user.service.ts` và `account.service.ts` dùng 10 — nên thống nhất 1 hằng số.
* `backend/src/auth/auth.service.ts:1072-1075` — lỗi log: nhúng object literal vào template string thành text vô nghĩa thay vì truyền metadata thật cho `customLogger.log`. Ngoài ra còn 9 vị trí `console.error` sót song song với `CustomLoggerService` đã inject.
* `backend/src/upload/upload.controller.ts` — **toàn bộ logic nghiệp vụ nằm trong controller, không có `upload.service.ts`**; đọc `process.env.CLOUDINARY_*`/`APP_URL`/`PORT` trực tiếp; magic number giới hạn dung lượng `5MB`/`20MB` hardcode, hoàn toàn tách biệt với UI "Giới hạn dung lượng tải tệp" giả ở `SystemSettingsView.tsx`.
* `backend/src/metrics/metrics.service.ts` — `console.log('Metrics service initialized')` còn sót; `getMetricsJSON(): Promise<any>`.
* `backend/src/public-content/public-content.service.ts` — `resolveCategoryKind` trả về union string tự định nghĩa thay vì enum `ArticleKind` đã có trong Prisma; nhiều `as Record<string, any>` khi parse `metadata`; `submitQuizAttempt` định nghĩa lại type inline trùng `SubmitQuizAttemptDto` và vẫn dùng `any`; `quiz.passingScorePercent || 80` hardcode — tách biệt hoàn toàn với UI "Ngưỡng đạt Quiz mặc định" giả ở Settings; magic number `take: 50`.
* `backend/src/common/services/email.service.ts` — 2 `console.error` sót song song `customLogger.error`. `redis.service.ts` — đọc `process.env.NODE_ENV` trực tiếp; vài method `@deprecated` nên xem lại có cần giữ không.
* `backend/src/common/guards/auth.guard.ts` — `extractTokenFromCookies` là private method không được gọi ở đâu (dead code); magic string `'ACTIVE'` nên dùng enum `userStatus`.
* `backend/src/user/user.service.ts:126` — `const dataToUpdate: any = {...authData}`.
* Không vi phạm đáng kể: `user.controller.ts`, `dashboard.controller.ts`, hầu hết `common/access/*`, `common/guards/optional-auth.guard.ts`, `custom-throttler.guard.ts`, `filters/`, `interceptors/`, `errors/`, `config/`, `queues/email/*`.

### Frontend
* `frontend/src/features/users/components/UserList.tsx` — xác nhận gọi `api.get/patch` trực tiếp; lỗi fetch bị nuốt thành "rỗng" (thiếu trạng thái "lỗi" riêng).
* `frontend/src/features/settings/components/SystemSettingsView.tsx` — xác nhận hoàn toàn UI giả: không gọi API nào, "Lưu" chỉ set state tạm; tab "Trạng thái hạ tầng" hardcode cứng; đây là nơi set `defaultQuizPassingScore=80`/`maxUploadSizeMb=10` trên UI nhưng **hoàn toàn tách biệt khỏi giá trị thật** dùng ở backend.
* `frontend/src/features/media/components/MediaManagerView.tsx` — xác nhận lưu `localStorage`; **thêm vi phạm mới**: gọi `api.post('/upload/image', ...)` trực tiếp trong component; dài 440 dòng, vượt ngưỡng.
* `frontend/src/features/analytics/components/AnalyticsDashboardView.tsx` — thiếu trạng thái "lỗi" (chỉ console.error); hàm `formatTimeAgo` trùng lặp y nguyên với `MediaManagerView.tsx`.
* `frontend/src/components/layout/ClientLayout.tsx`/`CmsAccessGate.tsx` — magic string `"moderation"`/`'review'`/`'users'` lặp giữa 2 file cho `PAGE_ACCESS`, nên gom hằng số chung (mức nhẹ).
* Không vi phạm đáng kể: `DashboardView.tsx` (mẫu tốt — có banner lỗi + nút thử lại + xử lý rỗng, nên dùng làm chuẩn đối chiếu), toàn bộ `features/account/components/*`, `components/layout/Sidebar/Topbar/PageHeader`, `services/api.ts`, `services/auth/*`, `services/entities/dashboard.service.ts`, `constants/*.ts`.

---

## 7. TÓM TẮT ƯU TIÊN XỬ LÝ (toàn dự án)

Xếp theo mức độ rủi ro thật (bug/an toàn > kiến trúc > vi phạm style), không theo thứ tự tìm thấy.

### 🔴 Bug / rủi ro vận hành thật — nên sửa trước
> Đã verify ĐỘC LẬP bằng Read/Grep thật (agent thứ 2, không liên quan agent tìm ra claim) — xem kết quả xác minh kèm trích dẫn dòng ở mỗi mục.

1. **[ĐÃ SỬA ✅]** `frontend/src/app/luyen-tap/page.tsx` — ngưỡng điểm đạt lệch nhau (80 lúc chấm vs 70 lúc hiển thị). **Sửa gốc ở backend**: thêm hằng số duy nhất `DEFAULT_QUIZ_PASSING_SCORE_PERCENT = 80` tại `backend/src/quiz/quiz.constant.ts`, áp dụng nhất quán ở `quiz.service.ts` (findAll/findById/createStandalone) và `public-content.service.ts` (nơi nuôi dữ liệu thật cho `/luyen-tap`, cả chỗ server tính `isPassed` khi nộp bài). Frontend đổi `||`→`??` (tránh bug ngưỡng 0%) và dùng 1 hằng số khớp backend thay 2 số 80/70. Theo góp ý người dùng: không chỉ vá số hiển thị mà đảm bảo API luôn trả giá trị nhất quán.
2. **[ĐÃ SỬA ✅ — Pha 1]** `backend/src/auth/interfaces/auth.interface.ts` đã đổi sang re-export `userRole as UserRole` từ `@prisma/client`, xoá `AuthUtilsService.canModifyRole()` + `ROLE_HIERARCHY` và bỏ 3 chỗ ép kiểu `as unknown as UserRole`.
3. **[ĐÃ SỬA ✅]** `backend/src/blog/blog.controller.ts` — 3 route `review`/`updatePost`/`deletePost` hoàn toàn không có guard nào (không cả `OptionalAuthGuard`). Đã thêm: `review` → `@RequireRoles(...ROLE_GROUPS.REVIEWERS)` (khớp convention duyệt bài ở Article/Lesson); `updatePost`/`deletePost` → `@UseGuards(AuthGuard)` + kiểm tra ownership thật trong service (`assertCanModifyPost`: chỉ tác giả bài viết hoặc STAFF mới được sửa/xoá, throw `ForbiddenException` nếu không).
4. **[ĐÃ SỬA ✅ — Pha 1]** Base URL API hardcode ở 19 file frontend đã được gom về 1 nguồn duy nhất tại `frontend/src/constants/api-url.ts` (`API_BASE_URL`, `INTERNAL_API_BASE_URL`, `resolveBackendAssetUrl`).
5. **[ĐÃ SỬA ✅]** `frontend/src/features/community/api.ts` đã được viết lại hoàn chỉnh (đọc toàn bộ 10 file tiêu thụ + backend `blog.controller.ts`/`blog.service.ts` để khớp đúng endpoint/response shape, không dùng `any`). `npm run build` frontend xác nhận **exit code 0**, toàn bộ route build sạch kể cả `/cong-dong/**`.
6. **[ĐÃ SỬA ✅]** `frontend/src/app/luyen-tap/page.tsx` — `handleSubmitExam` giờ chỉ `setSubmitted(true)` SAU KHI `fetch` trả `res.ok`; thêm state `submitError` hiển thị thông báo lỗi + đổi nút thành "Thử nộp lại" nếu API lỗi, thay vì âm thầm coi như đã nộp thành công.

### 🟠 Vi phạm kiến trúc / convention lan rộng — nên dọn theo lô
7. **[ĐÃ ĐÍNH CHÍNH ✅ — FALSE POSITIVE]** Claim cũ về "Import `@prisma/client` thay vì `generated/prisma/client`" là do `CLAUDE.md` ghi lệch với `backend/prisma/schema/base.prisma` (`provider = "prisma-client-js"` không cấu hình custom `output`, toàn bộ 45/45 file backend đều import từ `@prisma/client`, thư mục `backend/generated` không tồn tại). Đã cập nhật lại `CLAUDE.md`.
8. **[ĐÃ SỬA ✅ — Pha 1]** `backend/src/common/services/prisma.service.ts` đã xoá 25 dòng code chết bị comment lại và đọc `database_url` qua `app.config.ts`.
9. **[ĐÃ SỬA ✅ — Pha 1]** Salt rounds bcrypt đã thống nhất qua `AUTH_CONFIG.BCRYPT_SALT_ROUNDS = 12` ở cả `auth.service.ts`, `user.service.ts`, `account.service.ts`.
10. **[ĐÃ SỬA ✅ — Pha 1]** `backend/src/note/note.service.ts` đã bỏ tự bọc response `{statusCode, message, data}`.
11. **[ĐÃ SỬA ✅ — Pha 1]** `backend/src/moderation/moderation.service.ts` đã bỏ re-validate `dto.action` bằng tay trong `resolveReport`.
12. **[ĐÃ SỬA ✅ — Pha 2] Circular dependency `BlogModule` ⇄ `ModerationModule`** đã được gỡ bỏ bằng cách tách `BlogGatewayModule` riêng (`backend/src/blog/blog-gateway.module.ts`).
13. **[ĐÃ SỬA ✅ — Pha 2] `Question.difficulty` trong Prisma schema (`quiz.prisma`)** đã đổi sang enum `DifficultyLevel` kèm migration SQL và validate `@IsEnum(DifficultyLevel)` ở DTO.
14. **[ĐÃ SỬA ✅ — Pha 2] `backend/src/quiz/question.service.ts` `backfillFromQuizzes()`** đã gộp các thao tác tạo câu hỏi vào `$transaction` và dùng NestJS `Logger`.
15. Giá trị mặc định nghiệp vụ (ngưỡng đạt quiz 80%, giới hạn upload 5MB/20MB) **hardcode rải ở backend**, hoàn toàn tách biệt khỏi UI "Cài đặt hệ thống" (vốn cũng đang giả) — khi làm Settings thật cần 1 nguồn config duy nhất.
16. **[MỚI — ĐÃ KIỂM CHỨNG & SỬA ✅ — Pha 2] XSS:** (a) 🔴 **[ĐÃ SỬA ✅]** `BlogDetailPage.tsx:219` đã bọc `escapeHtml(post.excerpt)` trước khi đưa vào `dangerouslySetInnerHTML` và thêm `@MaxLength(1000)` ở DTO; (b) 🟠 **[ĐÃ SỬA ✅]** khối TEXT của bài học/bài viết và `q.prompt` đã được lọc qua `sanitizeRichHtml` (`frontend/src/utils/sanitize-html.ts`).
17. **[MỚI — ĐÃ SỬA ✅ — Pha 2]** `BlockBuilderCanvas.renderGenericChildBlock` đã hiển thị placeholder thay vì `return null` ở `default`.
18. **[MỚI — ĐÃ SỬA ✅ — Pha 2]** `lesson/dto/create-lesson.dto.ts` đã dùng `@IsEnum(DifficultyLevel)`, gõ rõ kiểu ở `lesson.service.ts`, `lesson.controller.ts` và `content-normalizer.strategy.ts`.
19. **[MỚI]** Code chết ở Block Builder: `TimelineNodeCanvasDrawer.tsx`, `features/lessons/templates/` (mục 3.x).

### 🟡 Component quá dài cần tách (ngưỡng CLAUDE.md: 200-300 dòng)
Xếp theo độ dài giảm dần — các file này nên tách trước tiên vì vi phạm nặng nhất:
- `StoryChapterBlockEditor.tsx` — **1459 dòng**
- `PostCommentModal.tsx` — **1269 dòng**
- `CommunityProfileView.tsx` — **1135 dòng**
- `TopicEditor.tsx` — **~1089 dòng**
- `BlogCreatePage.tsx` — **931 dòng**
- `QuestionBankModal.tsx` — **931 dòng**
- `StoryChapterBlockInspector.tsx` — 893 dòng
- `CommunityFeed.tsx` — 876 dòng
- `luyen-tap/page.tsx` — 848 dòng
- `HisgoStudioView.tsx` — 808 dòng
- `StorySubElementInspector.tsx` — 783 dòng
- **[ĐÃ XOÁ ✅ — Pha 4]** `CommentThread.tsx` — 908 dòng (đã xoá hẳn vì không được import ở đâu trong codebase)
- `QuestionBankView.tsx` — 712 dòng; `CurriculumTree.tsx` — 705 dòng; `BlogReviewList.tsx` — 719 dòng; `QuickComposer.tsx` — 604 dòng
- Nhóm 400-570 dòng: `TopicModal.tsx`, `TopicParentModalPicker.tsx`, `ArticleProfilePanel.tsx` (491), `RevisionDiff.tsx` (467), `BlogDetailPage.tsx` (457), `MediaManagerView.tsx` (440), `NotificationBell.tsx` (433)

### 🟢 Trùng lặp code nên gộp (DRY — sẽ bị `jscpd`/`npm run audit` bắt)
- **[ĐÃ SỬA ✅ — Pha 4]** `extractMetadataFromBlocks`/`extractMetadata` đã gộp về `frontend/src/features/blog/utils/blog-metadata.util.ts`.
- **[ĐÃ SỬA ✅ — Pha 4]** `getAuthorTint`/`getInitials` đã gộp về `frontend/src/features/community/utils/author-avatar.util.ts`.
- **[ĐÃ SỬA ✅ — Pha 4]** `formatTimeAgo` đã gộp về `frontend/src/utils/time-ago.util.ts`.
- **[ĐÃ SỬA ✅ — Pha 4]** `EventPickerModal`/`EntityPickerModal` đã tách logic & UI dùng chung vào `useWikipediaDetailPicker.ts` và `WikiDetailPreviewPane.tsx`; `CurriculumTreePreviewModal.tsx` đã uỷ quyền cho `CurriculumSidePanel.tsx` (`variant="modal"`).
- **[ĐÃ SỬA ✅ — Pha 4]** Dữ liệu mẫu Điện Biên Phủ / Võ Nguyên Giáp trong `createDefault()` của `quiz-block.plugin.ts` và `section-row-block.plugin.ts` đã được thay bằng placeholder trung tính; đã xoá file chết `TimelineNodeCanvasDrawer.tsx`.

### ⚪ Còn thiếu để audit 100%
- **[ĐÃ BỔ SUNG ✅]** 4/5 file trong `frontend/src/features/review/components/` (`ReviewList.tsx`, `RevisionReviewList.tsx`, `ArticleReviewList.tsx`, `ReviewModal.tsx`) đã được đọc và ghi nhận chi tiết ở Mục 5.
- Chi tiết dòng-theo-dòng của 1 số plugin/facade phụ trong `features/lessons/plugins/*.plugin.ts` (18 file) — đã audit ở mức tổng quan, có thể còn `any`/magic string lẻ tẻ chưa liệt kê hết.

### Về 718 lỗi lint backend / 1052 vấn đề lint frontend (Mục 0)
Phần lớn là lỗi **format Prettier (CRLF line-ending)** và `@typescript-eslint/no-unsafe-argument`/`no-explicit-any` ở quy mô nhỏ lặp lại — không phải lỗi logic. Khuyến nghị: chạy `npm run lint -- --fix` ở cả 2 phía trước, sau đó review lại danh sách lỗi còn sót (sẽ ngắn hơn nhiều) để không bị "chìm" giữa hàng trăm lỗi format.
