# 📊 BÁO CÁO ESLINT (ESLINT REPORT)
> **Cập nhật:** 2026-11-12
> **Dự án:** HISGO (`D:\Fullit\TLCN\TLCN-DT07`)
> **Phạm vi:** Backend `backend/{src,apps,libs,test}/**/*.ts` · Frontend `frontend/` (`eslint .`)
> **Liên quan:** [CODE_AUDIT.md](CODE_AUDIT.md) · [CODE_AUDIT_PLAN.md](CODE_AUDIT_PLAN.md) · [MAP_PROJECT.md](MAP_PROJECT.md) · [CLAUDE.md](CLAUDE.md)

---

## 1. Tổng quan

| Chỉ số | Backend | Frontend | Toàn dự án |
| :--- | :---: | :---: | :---: |
| File quét | 205 | 507 | 712 |
| Errors | **0** | **0** | **0** |
| Warnings | **0** | **0** | **0** |
| Lần trước (cùng ngày) | 7 errors · 1 warning | 0 errors · 174 warnings | 7 errors · 175 warnings |
| Từ đầu đợt dọn | 143 warnings | 1.003 warnings | 1.146 → **0** |
| Unit test backend | 24/24 suites · 191/191 tests | — | Pass |

Frontend `tsc --noEmit` không còn lỗi nào ở các file đã sửa. Lỗi còn lại duy nhất là ở `features/lessons/components/builder/story-chapter/*` (`EditorialSubElementType`), thuộc phần đang được phiên làm việc khác sửa, không nằm trong đợt này.

---

## 2. Cách xử lý từng nhóm (174 warnings frontend + 8 vấn đề backend)

| Rule | Số lượng | Cách xử lý |
| :--- | :---: | :--- |
| `no-restricted-syntax` – magic string trong `===` / `switch` | 45 | Thay bằng enum/hằng số có sẵn (`UserRole`, `KeyboardKey`, `CommonFilterOption`, `ContentStatus`, `NavigationPageKey`, `NOTE_TARGET_TYPE`); thêm enum `LifeSource`, `LinkDirection` (`features/articles/person-life.ts`); tab/chế độ chỉ dùng trong 1 file thành enum cục bộ (`LibraryViewMode`, `RowInspectorTab`, `TimelineInspectorTab`, `SettingsTab`); bảng tra style thay cho chuỗi so sánh (`TreeSelectModal`). |
| `no-restricted-syntax` – `fetch()` tự do | 8 | `features/notes/services/note.service.ts` chuyển sang axios `@/services/api` (gắn token tự động — trước đây đọc nhầm khoá `access_token` nên ghi chú luôn bị coi là khách). `lessons/strategies/entity-sources/**` gọi Wikipedia/Wikimedia/Wikidata — ngoại lệ đã ghi trong CLAUDE.md, thêm vào block cho phép `fetch` của `eslint.config.mjs`. |
| `no-restricted-syntax` – URL remote | 13 | URL ngoài gom vào vùng URL tập trung của `constants/routes.ts` (`WIKIPEDIA_VI_API`, `TIMELINE_HERO_IMAGE_URL`, dùng lại `SOCIAL_LINKS.HOMEPAGE`); bỏ `xmlns` thừa trong SVG inline; regex của rule chỉ bắt URL có tên miền (chuỗi `"https://..."` ở placeholder/`startsWith` không còn bị tính). Gỡ "thư viện ảnh mẫu" Unsplash cứng trong khối Ảnh bài học (mock data, trái CLAUDE.md). |
| `react-hooks/set-state-in-effect` | 29 | Bọc phần đồng bộ của effect vào `void Promise.resolve().then(...)` theo CLAUDE.md; `Sidebar` dùng functional update (đồng thời hết `exhaustive-deps`); `useQuizEditor` giữ cleanup `isMounted`. |
| `@typescript-eslint/no-explicit-any` | 26 | Khai kiểu thật: `TopicLessonSummary` (cây chủ đề), `QuestionBankData`/`QuestionBankOption` (ngân hàng câu hỏi), `content: unknown` cho bài học, envelope `{ data }` của TransformInterceptor cho upload; bỏ `as any` ở `QuizQuestionCard`; lỗi dùng `extractErrorMessage`. |
| `@typescript-eslint/no-unused-vars` | 18 | Xoá import/biến thừa; `CurriculumExplorer` hiện trạng thái "Đang tải" (trước đó có `loading` nhưng không hiển thị); `LessonPublishingTab` hiện số từ / thời gian đọc đã được truyền vào; bỏ prop thừa của `Topbar`. |
| `@next/next/no-img-element` | 15 | Gom về `components/common/RemoteImage.tsx` — ảnh CMS/nguồn ngoài không biết trước kích thước, khung do CSS từng nơi quyết định; `next/image` bắt buộc `width/height` hoặc `fill` sẽ làm méo bố cục. Ngoại lệ chỉ còn ở đúng 1 chỗ, có ghi lý do. |
| `sonarjs/cognitive-complexity` | 7 | Tách helper thuần / sub-component: `ancestorPath` (CurriculumExplorer), `indexEventHomes`/`subEraForYear`/`attachEndingAtYear` (sk-adapter), `addDirectRelations`/`addHierarchy`/`addSharedEntities` (TimelineFocus), `isNodeTouched`/`highlightRange` (TimelineNodeItem), `relatedEvents`/`onlyRelatedIds`/`pickSelectedNode`/`FocusBar` (TimelineExplorer), `HisgoEventResults` (EventPickerModal), `rowClass`/`radioClass`/... (TopicParentModalPicker). |
| `sonarjs/no-duplicate-string` | 6 | Hằng số `ADD_BLOCK_BELOW_LABEL`, `WIKIMEDIA_REQUEST_HEADERS`, class dùng lại trong `CurriculumTree`. |
| `react-hooks/exhaustive-deps` | 3 | `Sidebar` (functional update), `TopicParentModalPicker` (thêm `maxDepth`), `useLessonBlockManager` (đổi `useMemo` không deps thành `useState` lazy init — chỉ chạy khi mount). |
| `@next/next/no-location-assign-relative-destination` | 3 | Component dùng `router.replace(APP_ROUTES.LOGIN)` (thêm `APP_ROUTES.LOGIN`); interceptor axios (ngoài cây React) dùng `window.location.replace` để trang hết phiên không nằm lại trong lịch sử. |
| `check-file/filename-naming-convention` | 2 | `services/auth/useAuthSession.ts` → `use-auth-session.ts`; `components/timeline/sk-ui.tsx` → `SkUi.tsx` (đã sửa mọi import). |
| `react/no-unescaped-entities` | 2 | Dùng `&ldquo;`/`&rdquo;` trong `EraTocDrawer`. |
| Backend `prettier/prettier` | 7 | `eslint --fix` trên `quiz.service.ts`, `quiz.service.spec.ts`. |
| Backend `sonarjs/cognitive-complexity` | 1 | `QuizService.updateStandalone`: gom 3 đoạn kiểm tra bài học lặp lại thành `findLessonOrThrow()`. |

---

## 3. Thay đổi cấu hình `frontend/eslint.config.mjs`

1. Selector URL remote: `^https?:\/\/(?!localhost)(?!127\.0\.0\.1)[a-z0-9]` (cờ `i`) — chỉ bắt URL có tên miền.
2. Block cho phép `fetch()` thêm `src/features/lessons/strategies/entity-sources/**` (API Wikipedia/Wikimedia/Wikidata).

Không tắt rule nào ở cấp dự án; ngoại lệ `<img>` nằm trong đúng 1 component có chú thích.

---

## 4. Việc còn mở

- Lỗi `tsc` ở `story-chapter/*` thuộc phần việc đang dở của phiên khác.

---

## 5. Lệnh kiểm tra

```bash
cd backend && npm run lint && npm run test
cd frontend && npx eslint . && npx tsc --noEmit
```
