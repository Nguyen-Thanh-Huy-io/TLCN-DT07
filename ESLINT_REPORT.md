# 📊 BÁO CÁO TOÀN DIỆN LỖI & CẢNH BÁO ESLINT (ESLINT REPORT)
> **Thời điểm xuất:** 2026-11-12T06:12:42.639Z  
> **Dự án:** HISGO (`D:\Fullit\TLCN\TLCN-DT07`)  
> **Phạm vi kiểm tra:** Toàn bộ mã nguồn Backend (`backend/src`, `test`) và Frontend (`frontend/src`, `app`).  
> **Tài liệu liên quan:** [CODE_AUDIT.md](CODE_AUDIT.md) · [CODE_AUDIT_PLAN.md](CODE_AUDIT_PLAN.md) · [MAP_PROJECT.md](MAP_PROJECT.md)

---

## 📌 1. TỔNG QUAN SỐ LIỆU (EXECUTIVE SUMMARY)

| Chỉ số | Backend | Frontend | Toàn dự án |
| :--- | :---: | :---: | :---: |
| **Tổng số file quét** | **204** | **454** | **658** |
| **Số file có vấn đề** | **38** | **221** | **259** |
| **Số lỗi (Errors)** | **0** | **0** | **0** |
| **Số cảnh báo (Warnings)** | **143** | **1003** | **1146** |

> 💡 **Nhận xét quan trọng:**
> - **Lỗi chặn build (Errors): 0 lỗi!** Toàn bộ mã nguồn hợp lệ cú pháp TypeScript và cấu hình ESLint hiện không có rule nào chặn build dạng error.
> - **Cảnh báo (Warnings): 1146 warnings** tập trung áp đảo ở **Frontend (1003)** và **Backend (143)**.
> - Trước đây backend từng bị hơn 700 lỗi format do Prettier (CRLF line endings), nhưng hiện tại `backend/eslint.config.mjs` đã cấu hình `endOfLine: 'auto'`, đưa số lỗi về **0**.

---

## 📈 2. THỐNG KÊ QUY TẮC BỊ VI PHẠM (TOP RULES BREAKDOWN)

### 2.1. Backend (143 warnings trên 38 files)
| Tên quy tắc (Rule ID) | Số lượng | Mức độ | Ý nghĩa / Nguyên nhân |
| :--- | :---: | :---: | :--- |
| `@typescript-eslint/no-unsafe-argument` | **101** | ⚠️ Warn | Truyền biến kiểu `any` vào hàm đòi hỏi kiểu tường minh (thường trong test spec hoặc service khi chưa gõ kiểu). |
| `no-restricted-syntax` | **18** | ⚠️ Warn | Hardcode URL remote http/https thay vì đọc từ biến môi trường / ConfigService. |
| `sonarjs/no-duplicate-string` | **12** | ⚠️ Warn | Chuỗi lặp lại >= 4 lần mà chưa tách thành constant. |
| `sonarjs/cognitive-complexity` | **10** | ⚠️ Warn | Hàm có độ phức tạp nhận thức > 15 (nhiều if/else lồng nhau, loop, switch). |
| `@typescript-eslint/no-floating-promises` | **2** | ⚠️ Warn | Promise không được `await` hoặc gắn `.catch()`. |

### 2.2. Frontend (1003 warnings trên 221 files)
| Tên quy tắc (Rule ID) | Số lượng | Tỷ lệ | Ý nghĩa / Nguyên nhân |
| :--- | :---: | :---: | :--- |
| `no-restricted-syntax` | **397** | 39.6% | Quy tắc cấm Magic Strings trong `===`/`!==`, `switch-case`, hoặc gọi `fetch()` tự do ngoài `services/api`. (Chiếm 39.6% tổng cảnh báo) |
| `sonarjs/no-duplicate-string` | **190** | 18.9% | Chuỗi lặp lại >= 2 lần (threshold cấu hình rất gắt: 2) trong cùng 1 file JSX/TSX. |
| `@typescript-eslint/no-explicit-any` | **125** | 12.5% | Khai báo kiểu `any` tự do thay vì interface / generic. |
| `@typescript-eslint/no-unused-vars` | **78** | 7.8% | Biến / import được khai báo nhưng không dùng đến. |
| `react-hooks/set-state-in-effect` | **72** | 7.2% | Gọi `setState` trực tiếp trong `useEffect` gây re-render thừa hoặc nguy cơ vòng lặp vô hạn. |
| `sonarjs/cognitive-complexity` | **47** | 4.7% | Hàm/component có độ phức tạp nhận thức vượt ngưỡng 15. |
| `@next/next/no-img-element` | **41** | 4.1% | Dùng thẻ `<img>` thường thay vì `<Image />` của Next.js (Lưu ý: trong TipTap/Block Builder có chủ đích dùng `<img>`). |
| `check-file/folder-naming-convention` | **22** | 2.2% | Tên thư mục không theo chuẩn kebab-case. |
| `react-hooks/exhaustive-deps` | **14** | 1.4% | Thiếu dependency trong mảng hook `useEffect` / `useCallback` / `useMemo`. |
| `react/no-unescaped-entities` | **11** | 1.1% | Ký tự nháy đơn/kép không được escape trong JSX text. |
| `@next/next/no-location-assign-relative-destination` | **4** | 0.4% | Quy tắc linter |
| `check-file/filename-naming-convention` | **2** | 0.2% | Quy tắc linter |

---

## 🎯 3. PHÂN TÍCH CHUYÊN SÂU CÁC NHÓM CẢNH BÁO NẶNG NHẤT

### 3.1. Nhóm 1: Magic String (`no-restricted-syntax` - 397 warnings)
- **Cơ chế:** Cấu hình `frontend/eslint.config.mjs` cấm so sánh `=== "draft"`, `case "PUBLISHED":`, và gọi trực tiếp `fetch()`.
- **Nguyên nhân chính:**
  - Hàng loạt component so sánh chuỗi trực tiếp (`status === 'DRAFT'`, `role === 'ADMIN'`, `tab === 'content'`) thay vì dùng Enum có sẵn (`ContentStatus.DRAFT`, `UserRole.ADMIN`).
  - Phân hệ Lesson Block Builder có các switch-case cho loại block (`case 'TEXT':`, `case 'IMAGE':`).
- **Giải pháp:** Thay bằng enum `LessonBlockType`, `ContentStatus`, `UserRole`.

### 3.2. Nhóm 2: Chuỗi trùng lặp (`sonarjs/no-duplicate-string` - 190 warnings)
- **Cơ chế:** Ngưỡng threshold trong `frontend/eslint.config.mjs` đang đặt là **`2`** (rất khắt khe — bất kỳ chuỗi className Tailwind, nhãn nút bấm hay id xuất hiện từ 2 lần trở lên đều bị cảnh báo).
- **Ví dụ điển hình:** Các chuỗi `'px-4 py-2'`, `'font-medium'`, `'success'` bị bắt lặp lại.
- **Giải pháp:** Có thể nâng threshold lên `3` hoặc `4` cho phù hợp với đặc thù giao diện React/Tailwind, đồng thời tách các nhãn / API endpoint thành hằng số dùng chung.

### 3.3. Nhóm 3: Kiểu `any` (`@typescript-eslint/no-explicit-any` - 125 warnings)
- Tập trung ở:
  - `features/lessons/types/editor.types.ts` và các facade.
  - `features/public-curriculum/strategies/public-curriculum.strategies.ts` (chấm điểm quiz).
  - `features/community/api.ts` (parse dữ liệu mạng xã hội).
- **Giải pháp:** Định nghĩa type rõ ràng theo kế hoạch Pha 2 của `CODE_AUDIT_PLAN.md`.

### 3.4. Nhóm 4: Gọi setState trong useEffect (`react-hooks/set-state-in-effect` - 72 warnings)
- Cảnh báo mới từ ESLint Next.js v15/16: Việc đồng bộ props vào state bằng `useEffect(() => { setState(props.val); }, [props.val])` được khuyến cáo chuyển sang tính toán trực tiếp trong render (`derived state`) hoặc dùng key để reset component.

---

## 🗂️ 4. CHI TIẾT CẢNH BÁO PHÍA BACKEND (THEO FILE)

Tổng cộng: **143 cảnh báo** trên **38 files**.

| # | Đường dẫn file | Tổng warn | Các quy tắc chính vi phạm |
| :---: | :--- | :---: | :--- |
| 1 | [`D:/Fullit/TLCN/TLCN-DT07/backend/test/topic.e2e-spec.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/test/topic.e2e-spec.ts) | **34** | `@typescript-eslint/no-unsafe-argument` (34) |
| 2 | [`D:/Fullit/TLCN/TLCN-DT07/backend/test/auth.e2e-spec.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/test/auth.e2e-spec.ts) | **14** | `@typescript-eslint/no-unsafe-argument` (14) |
| 3 | [`D:/Fullit/TLCN/TLCN-DT07/backend/test/tag.e2e-spec.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/test/tag.e2e-spec.ts) | **11** | `@typescript-eslint/no-unsafe-argument` (11) |
| 4 | [`D:/Fullit/TLCN/TLCN-DT07/backend/test/lesson.e2e-spec.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/test/lesson.e2e-spec.ts) | **10** | `@typescript-eslint/no-unsafe-argument` (10) |
| 5 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/moderation/moderation.service.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/moderation/moderation.service.ts) | **9** | `@typescript-eslint/no-unsafe-argument` (5), `sonarjs/cognitive-complexity` (4) |
| 6 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/blog/blog.service.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/blog/blog.service.ts) | **7** | `@typescript-eslint/no-unsafe-argument` (6), `sonarjs/cognitive-complexity` (1) |
| 7 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/auth/config/google-oauth.config.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/auth/config/google-oauth.config.ts) | **6** | `no-restricted-syntax` (6) |
| 8 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/content-revision/revision-targets.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/content-revision/revision-targets.ts) | **5** | `@typescript-eslint/no-unsafe-argument` (5) |
| 9 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/content-revision/content-revision.service.spec.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/content-revision/content-revision.service.spec.ts) | **4** | `@typescript-eslint/no-unsafe-argument` (3), `sonarjs/no-duplicate-string` (1) |
| 10 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/lesson/lesson.service.spec.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/lesson/lesson.service.spec.ts) | **4** | `sonarjs/no-duplicate-string` (3), `no-restricted-syntax` (1) |
| 11 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/moderation/moderation-ai.service.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/moderation/moderation-ai.service.ts) | **3** | `@typescript-eslint/no-unsafe-argument` (3) |
| 12 | [`D:/Fullit/TLCN/TLCN-DT07/backend/test/dashboard.e2e-spec.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/test/dashboard.e2e-spec.ts) | **3** | `@typescript-eslint/no-unsafe-argument` (3) |
| 13 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/auth/auth.controller.spec.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/auth/auth.controller.spec.ts) | **2** | `sonarjs/no-duplicate-string` (2) |
| 14 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/auth/services/google-oauth.service.spec.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/auth/services/google-oauth.service.spec.ts) | **2** | `sonarjs/no-duplicate-string` (1), `no-restricted-syntax` (1) |
| 15 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/blog/dto/blog-post.dto.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/blog/dto/blog-post.dto.ts) | **2** | `no-restricted-syntax` (2) |
| 16 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/common/guards/custom-throttler.guard.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/common/guards/custom-throttler.guard.ts) | **2** | `@typescript-eslint/no-unsafe-argument` (2) |
| 17 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/discussion/discussion.service.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/discussion/discussion.service.ts) | **2** | `@typescript-eslint/no-unsafe-argument` (2) |
| 18 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/note/note.service.spec.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/note/note.service.spec.ts) | **2** | `@typescript-eslint/no-unsafe-argument` (2) |
| 19 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/notification/notification.gateway.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/notification/notification.gateway.ts) | **2** | `@typescript-eslint/no-floating-promises` (2) |
| 20 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/auth/auth.service.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/auth/auth.service.ts) | **1** | `sonarjs/cognitive-complexity` (1) |
| 21 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/auth/dto/account.dto.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/auth/dto/account.dto.ts) | **1** | `no-restricted-syntax` (1) |
| 22 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/auth/services/google-oauth.service.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/auth/services/google-oauth.service.ts) | **1** | `no-restricted-syntax` (1) |
| 23 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/blog/blog.controller.spec.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/blog/blog.controller.spec.ts) | **1** | `sonarjs/no-duplicate-string` (1) |
| 24 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/common/access/content-write.guard.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/common/access/content-write.guard.ts) | **1** | `sonarjs/cognitive-complexity` (1) |
| 25 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/common/config/swagger.config.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/common/config/swagger.config.ts) | **1** | `no-restricted-syntax` (1) |
| 26 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/common/decorators/api-response.decorator.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/common/decorators/api-response.decorator.ts) | **1** | `sonarjs/no-duplicate-string` (1) |
| 27 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/common/filters/all-exception.filter.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/common/filters/all-exception.filter.ts) | **1** | `sonarjs/cognitive-complexity` (1) |
| 28 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/common/utils/historical-date.parser.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/common/utils/historical-date.parser.ts) | **1** | `sonarjs/cognitive-complexity` (1) |
| 29 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/content-revision/content-revision.service.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/content-revision/content-revision.service.ts) | **1** | `sonarjs/cognitive-complexity` (1) |
| 30 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/lesson/lesson-enrichment.spec.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/lesson/lesson-enrichment.spec.ts) | **1** | `@typescript-eslint/no-unsafe-argument` (1) |
| 31 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/note/note.controller.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/note/note.controller.ts) | **1** | `sonarjs/no-duplicate-string` (1) |
| 32 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/topic/dto/create-topic.dto.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/topic/dto/create-topic.dto.ts) | **1** | `no-restricted-syntax` (1) |
| 33 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/topic/dto/topic-response.dto.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/topic/dto/topic-response.dto.ts) | **1** | `no-restricted-syntax` (1) |
| 34 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/topic/topic.service.spec.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/topic/topic.service.spec.ts) | **1** | `no-restricted-syntax` (1) |
| 35 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/user/dto/update-user.dto.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/user/dto/update-user.dto.ts) | **1** | `no-restricted-syntax` (1) |
| 36 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/user/dto/user-response.dto.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/user/dto/user-response.dto.ts) | **1** | `no-restricted-syntax` (1) |
| 37 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/user/user.controller.spec.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/user/user.controller.spec.ts) | **1** | `sonarjs/no-duplicate-string` (1) |
| 38 | [`D:/Fullit/TLCN/TLCN-DT07/backend/src/user/user.service.spec.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/user/user.service.spec.ts) | **1** | `sonarjs/no-duplicate-string` (1) |

### 4.1. Chi tiết các hàm Backend có Cognitive Complexity > 15
- [`D:/Fullit/TLCN/TLCN-DT07/backend/src/moderation/moderation.service.ts:115`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/moderation/moderation.service.ts#L115): Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/backend/src/moderation/moderation.service.ts:435`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/moderation/moderation.service.ts#L435): Refactor this function to reduce its Cognitive Complexity from 26 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/backend/src/moderation/moderation.service.ts:566`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/moderation/moderation.service.ts#L566): Refactor this function to reduce its Cognitive Complexity from 23 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/backend/src/moderation/moderation.service.ts:611`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/moderation/moderation.service.ts#L611): Refactor this function to reduce its Cognitive Complexity from 51 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/backend/src/blog/blog.service.ts:1108`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/blog/blog.service.ts#L1108): Refactor this function to reduce its Cognitive Complexity from 53 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/backend/src/auth/auth.service.ts:386`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/auth/auth.service.ts#L386): Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/backend/src/common/access/content-write.guard.ts:50`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/common/access/content-write.guard.ts#L50): Refactor this function to reduce its Cognitive Complexity from 23 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/backend/src/common/filters/all-exception.filter.ts:20`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/common/filters/all-exception.filter.ts#L20): Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/backend/src/common/utils/historical-date.parser.ts:819`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/common/utils/historical-date.parser.ts#L819): Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/backend/src/content-revision/content-revision.service.ts:281`](file:///D:/Fullit/TLCN/TLCN-DT07/backend/src/content-revision/content-revision.service.ts#L281): Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

---

## 🖥️ 5. CHI TIẾT CẢNH BÁO PHÍA FRONTEND (THEO FILE)

Tổng cộng: **1003 cảnh báo** trên **221 files**.

### 5.1. Top 30 file có nhiều cảnh báo nhất Frontend
| # | File | Tổng warn | Phân bố quy tắc chính |
| :---: | :--- | :---: | :--- |
| 1 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/CommunityFeed.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/CommunityFeed.tsx) | **37** | `no-restricted-syntax` (32), `cognitive-complexity` (2), `react-hooks/set-state-in-effect` (2) |
| 2 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/review/components/BlogReviewList.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/review/components/BlogReviewList.tsx) | **30** | `no-restricted-syntax` (13), `no-explicit-any` (7), `no-duplicate-string` (6) |
| 3 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/QuickComposer.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/QuickComposer.tsx) | **26** | `no-restricted-syntax` (17), `@next/next/no-img-element` (3), `react-hooks/set-state-in-effect` (2) |
| 4 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/inspectors/StoryChapterBlockInspector.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/inspectors/StoryChapterBlockInspector.tsx) | **26** | `no-restricted-syntax` (15), `no-duplicate-string` (10), `cognitive-complexity` (1) |
| 5 | ~~[`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogCreatePage.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogCreatePage.tsx)~~ | **0** (was 25) | ✅ **ĐÃ DỌN SẠCH 100%**: Phân rã Facade + Sub-components, khử Magic String |
| 6 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/CommunityProfileView.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/CommunityProfileView.tsx) | **24** | `no-restricted-syntax` (19), `no-duplicate-string` (3), `cognitive-complexity` (1) |
| 7 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/strategies/story-chapter-layout.strategy.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/strategies/story-chapter-layout.strategy.ts) | **22** | `no-restricted-syntax` (13), `no-duplicate-string` (9) |
| 8 | ~~[`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuestionBankModal.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuestionBankModal.tsx)~~ | **0** (was 22) | ✅ **ĐÃ DỌN SẠCH 100%**: Phân rã 5 components con, OCP Question Types |
| 9 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/PostCommentModal.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/PostCommentModal.tsx) | **21** | `no-restricted-syntax` (9), `no-duplicate-string` (5), `cognitive-complexity` (3) |
| 10 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/StoryChapterBlockEditor.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/StoryChapterBlockEditor.tsx) | **21** | `no-restricted-syntax` (13), `no-duplicate-string` (7), `cognitive-complexity` (1) |
| 11 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/luyen-tap/page.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/luyen-tap/page.tsx) | **19** | `no-restricted-syntax` (11), `no-unused-vars` (3), `cognitive-complexity` (2) |
| 12 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/entity-detail/entity-reader-adapter.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/entity-detail/entity-reader-adapter.ts) | **18** | `no-duplicate-string` (7), `no-restricted-syntax` (5), `no-explicit-any` (4) |
| 13 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/components/hub/HubLessonQuiz.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/components/hub/HubLessonQuiz.tsx) | **18** | `no-duplicate-string` (8), `no-explicit-any` (8), `cognitive-complexity` (2) |
| 14 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/strategies/public-curriculum.strategies.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/strategies/public-curriculum.strategies.ts) | **17** | `no-explicit-any` (15), `cognitive-complexity` (1), `no-restricted-syntax` (1) |
| 15 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/facades/useLessonEditorFacade.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/facades/useLessonEditorFacade.ts) | **16** | `no-explicit-any` (8), `react-hooks/set-state-in-effect` (4), `no-unused-vars` (2) |
| 16 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/hisgo/NotificationBell.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/hisgo/NotificationBell.tsx) | **15** | `no-restricted-syntax` (13), `react-hooks/set-state-in-effect` (1), `no-duplicate-string` (1) |
| 17 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/moderation/components/ModerationDashboardView.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/moderation/components/ModerationDashboardView.tsx) | **15** | `no-restricted-syntax` (11), `no-explicit-any` (3), `react-hooks/set-state-in-effect` (1) |
| 18 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/inspectors/TypographyInspectorPanel.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/inspectors/TypographyInspectorPanel.tsx) | **13** | `no-restricted-syntax` (10), `no-duplicate-string` (2), `cognitive-complexity` (1) |
| 19 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/plugins/story-chapter-block.plugin.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/plugins/story-chapter-block.plugin.ts) | **13** | `no-restricted-syntax` (7), `no-duplicate-string` (5), `cognitive-complexity` (1) |
| 20 | ~~[`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuestionBankView.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuestionBankView.tsx)~~ | **0** (was 13) | ✅ **ĐÃ DỌN SẠCH 100%**: Khử magic string, định kiểu chuẩn OptionPreview |
| 21 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/articles/components/ArticleEditor.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/articles/components/ArticleEditor.tsx) | **12** | `no-restricted-syntax` (9), `no-unused-vars` (1), `react-hooks/set-state-in-effect` (1) |
| 22 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/media/components/MediaManagerView.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/media/components/MediaManagerView.tsx) | **12** | `no-restricted-syntax` (8), `no-unused-vars` (2), `@next/next/no-img-element` (2) |
| 23 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/review/components/ArticleReviewList.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/review/components/ArticleReviewList.tsx) | **12** | `no-restricted-syntax` (3), `no-explicit-any` (3), `react/no-unescaped-entities` (2) |
| 24 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/story-chapter/StoryChapterContentBlock.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/story-chapter/StoryChapterContentBlock.tsx) | **11** | `no-restricted-syntax` (7), `no-duplicate-string` (3), `cognitive-complexity` (1) |
| 25 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/topics/components/TopicEditor.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/topics/components/TopicEditor.tsx) | **11** | `no-duplicate-string` (5), `no-unused-vars` (3), `react-hooks/set-state-in-effect` (2) |
| 26 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/services/entities/landing.service.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/services/entities/landing.service.ts) | **11** | `no-restricted-syntax` (9), `cognitive-complexity` (2) |
| 27 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/table/DataTableFilterModal.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/table/DataTableFilterModal.tsx) | **10** | `no-restricted-syntax` (7), `react-hooks/exhaustive-deps` (3) |
| 28 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/articles/components/ArticleProfilePanel.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/articles/components/ArticleProfilePanel.tsx) | **10** | `no-restricted-syntax` (9), `no-duplicate-string` (1) |
| 29 | [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/hisgo/Header.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/hisgo/Header.tsx) | **9** | `no-duplicate-string` (4), `no-restricted-syntax` (3), `no-unused-vars` (1) |
| 30 | ~~[`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogDetailPage.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogDetailPage.tsx)~~ | **0** (was 9) | ✅ **ĐÃ DỌN SẠCH 100%**: Giảm cognitive complexity, khử magic strings |

### 5.2. Phân loại theo phân hệ nghiệp vụ Frontend

#### 📁 Bài học & Block Builder (features/lessons) (55 files — **270 warnings**)
| File | Warns | Chi tiết lỗi tiêu biểu |
| :--- | :---: | :--- |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/inspectors/StoryChapterBlockInspector.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/inspectors/StoryChapterBlockInspector.tsx) | **26** | `no-restricted-syntax`: 15, `no-duplicate-string`: 10, `cognitive-complexity`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/strategies/story-chapter-layout.strategy.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/strategies/story-chapter-layout.strategy.ts) | **22** | `no-restricted-syntax`: 13, `no-duplicate-string`: 9 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/StoryChapterBlockEditor.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/StoryChapterBlockEditor.tsx) | **21** | `no-restricted-syntax`: 13, `no-duplicate-string`: 7, `cognitive-complexity`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/facades/useLessonEditorFacade.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/facades/useLessonEditorFacade.ts) | **16** | `no-explicit-any`: 8, `set-state-in-effect`: 4, `no-unused-vars`: 2, `cognitive-complexity`: 2 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/inspectors/TypographyInspectorPanel.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/inspectors/TypographyInspectorPanel.tsx) | **13** | `no-restricted-syntax`: 10, `no-duplicate-string`: 2, `cognitive-complexity`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/plugins/story-chapter-block.plugin.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/plugins/story-chapter-block.plugin.ts) | **13** | `no-restricted-syntax`: 7, `no-duplicate-string`: 5, `cognitive-complexity`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/story-chapter/StoryChapterContentBlock.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/story-chapter/StoryChapterContentBlock.tsx) | **11** | `no-restricted-syntax`: 7, `no-duplicate-string`: 3, `cognitive-complexity`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/TimelineBlockItemEditor.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/TimelineBlockItemEditor.tsx) | **8** | `no-explicit-any`: 4, `no-restricted-syntax`: 3, `cognitive-complexity`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/inspectors/StorySubElementInspector.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/inspectors/StorySubElementInspector.tsx) | **8** | `no-restricted-syntax`: 8 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/utils/lesson-toc.util.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/utils/lesson-toc.util.ts) | **8** | `no-explicit-any`: 6, `cognitive-complexity`: 1, `no-restricted-syntax`: 1 |
| *... và 45 file khác* | | |

#### 📁 Cộng đồng & Mạng xã hội (features/community) (7 files — **120 warnings**)
| File | Warns | Chi tiết lỗi tiêu biểu |
| :--- | :---: | :--- |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/CommunityFeed.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/CommunityFeed.tsx) | **37** | `no-restricted-syntax`: 32, `cognitive-complexity`: 2, `set-state-in-effect`: 2, `exhaustive-deps`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/QuickComposer.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/QuickComposer.tsx) | **26** | `no-restricted-syntax`: 17, `no-img-element`: 3, `set-state-in-effect`: 2, `no-duplicate-string`: 2, `cognitive-complexity`: 1, `exhaustive-deps`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/CommunityProfileView.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/CommunityProfileView.tsx) | **24** | `no-restricted-syntax`: 19, `no-duplicate-string`: 3, `cognitive-complexity`: 1, `set-state-in-effect`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/PostCommentModal.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/PostCommentModal.tsx) | **21** | `no-restricted-syntax`: 9, `no-duplicate-string`: 5, `cognitive-complexity`: 3, `no-explicit-any`: 2, `no-img-element`: 2 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/PostActionBar.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/PostActionBar.tsx) | **5** | `set-state-in-effect`: 3, `no-duplicate-string`: 2 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/PostCard.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/PostCard.tsx) | **5** | `no-img-element`: 2, `cognitive-complexity`: 1, `no-restricted-syntax`: 1, `no-duplicate-string`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/api.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/api.ts) | **2** | `no-restricted-syntax`: 2 |

#### 📁 Bài viết & Di tích & Khám phá (features/articles, heritage, period-detail) (13 files — **41 warnings**)
| File | Warns | Chi tiết lỗi tiêu biểu |
| :--- | :---: | :--- |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/articles/components/ArticleEditor.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/articles/components/ArticleEditor.tsx) | **12** | `no-restricted-syntax`: 9, `no-unused-vars`: 1, `set-state-in-effect`: 1, `no-duplicate-string`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/articles/components/ArticleProfilePanel.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/articles/components/ArticleProfilePanel.tsx) | **10** | `no-restricted-syntax`: 9, `no-duplicate-string`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/articles/components/ArticleList.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/articles/components/ArticleList.tsx) | **4** | `no-restricted-syntax`: 3, `set-state-in-effect`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/articles/components/ArticleConnections.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/articles/components/ArticleConnections.tsx) | **3** | `no-restricted-syntax`: 3 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/heritage/heritage.adapter.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/heritage/heritage.adapter.ts) | **3** | `no-unused-vars`: 2, `cognitive-complexity`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/period-detail/components/PeriodDetailView.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/period-detail/components/PeriodDetailView.tsx) | **2** | `no-img-element`: 2 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/articles/components/ArticlePicker.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/articles/components/ArticlePicker.tsx) | **1** | `no-restricted-syntax`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/articles/components/CategoryManager.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/articles/components/CategoryManager.tsx) | **1** | `set-state-in-effect`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/articles/components/ContentBlockEditor.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/articles/components/ContentBlockEditor.tsx) | **1** | `no-unused-vars`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/heritage/components/HeritageExplorer.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/heritage/components/HeritageExplorer.tsx) | **1** | `set-state-in-effect`: 1 |
| *... và 3 file khác* | | |

#### 📁 Quiz & Ngân hàng câu hỏi (features/quiz) (10 files — **65 warnings**)
| File | Warns | Chi tiết lỗi tiêu biểu |
| :--- | :---: | :--- |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuestionBankModal.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuestionBankModal.tsx) | **22** | `no-unused-vars`: 14, `cognitive-complexity`: 3, `no-explicit-any`: 3, `set-state-in-effect`: 1, `no-duplicate-string`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuestionBankView.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuestionBankView.tsx) | **13** | `no-explicit-any`: 7, `no-restricted-syntax`: 3, `no-unused-vars`: 2, `set-state-in-effect`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuestionBankPickerModal.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuestionBankPickerModal.tsx) | **7** | `no-restricted-syntax`: 4, `no-unused-vars`: 1, `set-state-in-effect`: 1, `no-explicit-any`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuizManagementView.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuizManagementView.tsx) | **5** | `no-unused-vars`: 3, `no-explicit-any`: 1, `no-restricted-syntax`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuizStatisticsModal.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuizStatisticsModal.tsx) | **5** | `no-unused-vars`: 3, `set-state-in-effect`: 1, `no-restricted-syntax`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/facades/useQuizManagementFacade.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/facades/useQuizManagementFacade.ts) | **5** | `no-restricted-syntax`: 2, `no-explicit-any`: 2, `set-state-in-effect`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuizFilterBar.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuizFilterBar.tsx) | **4** | `no-duplicate-string`: 4 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuizPreviewModal.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuizPreviewModal.tsx) | **2** | `no-duplicate-string`: 2 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/StandaloneQuizEditorModal.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/StandaloneQuizEditorModal.tsx) | **1** | `set-state-in-effect`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/strategies/quiz-filter.strategy.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/strategies/quiz-filter.strategy.ts) | **1** | `no-explicit-any`: 1 |

#### 📁 Giáo trình & Lộ trình (features/curriculum, public-curriculum) (20 files — **87 warnings**)
| File | Warns | Chi tiết lỗi tiêu biểu |
| :--- | :---: | :--- |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/components/hub/HubLessonQuiz.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/components/hub/HubLessonQuiz.tsx) | **18** | `no-duplicate-string`: 8, `no-explicit-any`: 8, `cognitive-complexity`: 2 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/strategies/public-curriculum.strategies.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/strategies/public-curriculum.strategies.ts) | **17** | `no-explicit-any`: 15, `cognitive-complexity`: 1, `no-restricted-syntax`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/curriculum/components/studio/ChapterList.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/curriculum/components/studio/ChapterList.tsx) | **8** | `no-unused-vars`: 6, `set-state-in-effect`: 1, `no-duplicate-string`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/curriculum/components/HisgoStudioView.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/curriculum/components/HisgoStudioView.tsx) | **6** | `set-state-in-effect`: 3, `no-duplicate-string`: 3 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/components/PublicCurriculumView.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/components/PublicCurriculumView.tsx) | **6** | `no-unused-vars`: 3, `no-img-element`: 2, `cognitive-complexity`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/curriculum/components/CurriculumExplorer.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/curriculum/components/CurriculumExplorer.tsx) | **5** | `no-unused-vars`: 2, `set-state-in-effect`: 2, `cognitive-complexity`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/components/PublicLessonReaderView.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/components/PublicLessonReaderView.tsx) | **5** | `no-duplicate-string`: 2, `cognitive-complexity`: 1, `set-state-in-effect`: 1, `no-img-element`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/curriculum/components/CurriculumTree.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/curriculum/components/CurriculumTree.tsx) | **3** | `no-duplicate-string`: 3 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/facades/usePublicLessonReaderFacade.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/facades/usePublicLessonReaderFacade.ts) | **3** | `no-unused-vars`: 1, `no-explicit-any`: 1, `set-state-in-effect`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/curriculum/components/studio/StudioHeader.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/curriculum/components/studio/StudioHeader.tsx) | **2** | `no-duplicate-string`: 2 |
| *... và 10 file khác* | | |

#### 📁 Blog (features/blog) (6 files — **47 warnings**)
| File | Warns | Chi tiết lỗi tiêu biểu |
| :--- | :---: | :--- |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogCreatePage.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogCreatePage.tsx) | **25** | `no-restricted-syntax`: 13, `no-unused-vars`: 4, `no-img-element`: 4, `no-duplicate-string`: 3, `cognitive-complexity`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogDetailPage.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogDetailPage.tsx) | **9** | `no-restricted-syntax`: 4, `no-duplicate-string`: 2, `no-img-element`: 2, `cognitive-complexity`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/blog-data.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/blog-data.ts) | **6** | `no-restricted-syntax`: 6 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogBrowser.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogBrowser.tsx) | **3** | `cognitive-complexity`: 1, `no-duplicate-string`: 1, `no-img-element`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogLandingPage.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogLandingPage.tsx) | **3** | `no-unused-vars`: 2, `no-img-element`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogFeaturedSlider.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogFeaturedSlider.tsx) | **1** | `no-img-element`: 1 |

#### 📁 CMS Vận hành (dashboard, users, review, moderation, media) (9 files — **86 warnings**)
| File | Warns | Chi tiết lỗi tiêu biểu |
| :--- | :---: | :--- |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/review/components/BlogReviewList.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/review/components/BlogReviewList.tsx) | **30** | `no-restricted-syntax`: 13, `no-explicit-any`: 7, `no-duplicate-string`: 6, `no-img-element`: 2, `set-state-in-effect`: 1, `no-unused-vars`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/moderation/components/ModerationDashboardView.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/moderation/components/ModerationDashboardView.tsx) | **15** | `no-restricted-syntax`: 11, `no-explicit-any`: 3, `set-state-in-effect`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/media/components/MediaManagerView.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/media/components/MediaManagerView.tsx) | **12** | `no-restricted-syntax`: 8, `no-unused-vars`: 2, `no-img-element`: 2 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/review/components/ArticleReviewList.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/review/components/ArticleReviewList.tsx) | **12** | `no-restricted-syntax`: 3, `no-explicit-any`: 3, `no-unescaped-entities`: 2, `no-duplicate-string`: 1, `set-state-in-effect`: 1, `exhaustive-deps`: 1, `no-location-assign-relative-destination`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/review/components/ReviewList.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/review/components/ReviewList.tsx) | **6** | `no-explicit-any`: 3, `no-unescaped-entities`: 2, `no-duplicate-string`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/settings/components/SystemSettingsView.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/settings/components/SystemSettingsView.tsx) | **6** | `no-restricted-syntax`: 4, `no-duplicate-string`: 2 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/review/components/ReviewModal.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/review/components/ReviewModal.tsx) | **2** | `no-unescaped-entities`: 2 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/users/components/UserList.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/users/components/UserList.tsx) | **2** | `no-restricted-syntax`: 2 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/dashboard/components/DashboardView.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/dashboard/components/DashboardView.tsx) | **1** | `set-state-in-effect`: 1 |

#### 📁 Trang công khai & Tìm kiếm (landing, search, app pages) (4 files — **5 warnings**)
| File | Warns | Chi tiết lỗi tiêu biểu |
| :--- | :---: | :--- |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/landing/landing.adapter.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/landing/landing.adapter.ts) | **2** | `no-unused-vars`: 2 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/landing/components/EntitiesSection.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/landing/components/EntitiesSection.tsx) | **1** | `no-img-element`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/landing/components/LandingUi.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/landing/components/LandingUi.tsx) | **1** | `no-img-element`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/landing/components/LearningQuiz.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/landing/components/LearningQuiz.tsx) | **1** | `no-img-element`: 1 |

#### 📁 Hạ tầng dùng chung & Services (components, services, context, hooks) (65 files — **210 warnings**)
| File | Warns | Chi tiết lỗi tiêu biểu |
| :--- | :---: | :--- |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/entity-detail/entity-reader-adapter.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/entity-detail/entity-reader-adapter.ts) | **18** | `no-duplicate-string`: 7, `no-restricted-syntax`: 5, `no-explicit-any`: 4, `cognitive-complexity`: 2 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/hisgo/NotificationBell.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/hisgo/NotificationBell.tsx) | **15** | `no-restricted-syntax`: 13, `set-state-in-effect`: 1, `no-duplicate-string`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/topics/components/TopicEditor.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/topics/components/TopicEditor.tsx) | **11** | `no-duplicate-string`: 5, `no-unused-vars`: 3, `set-state-in-effect`: 2, `cognitive-complexity`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/services/entities/landing.service.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/services/entities/landing.service.ts) | **11** | `no-restricted-syntax`: 9, `cognitive-complexity`: 2 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/table/DataTableFilterModal.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/table/DataTableFilterModal.tsx) | **10** | `no-restricted-syntax`: 7, `exhaustive-deps`: 3 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/hisgo/Header.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/hisgo/Header.tsx) | **9** | `no-duplicate-string`: 4, `no-restricted-syntax`: 3, `no-unused-vars`: 1, `no-img-element`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/timelines/components/TimelineEditor.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/timelines/components/TimelineEditor.tsx) | **8** | `no-restricted-syntax`: 7, `set-state-in-effect`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/topics/components/TopicParentModalPicker.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/topics/components/TopicParentModalPicker.tsx) | **8** | `no-duplicate-string`: 4, `set-state-in-effect`: 1, `exhaustive-deps`: 1, `no-unused-vars`: 1, `cognitive-complexity`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/services/auth/public-auth.service.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/services/auth/public-auth.service.ts) | **8** | `no-restricted-syntax`: 4, `no-explicit-any`: 2, `no-duplicate-string`: 2 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/topics/components/TopicCoverImagePicker.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/topics/components/TopicCoverImagePicker.tsx) | **7** | `no-restricted-syntax`: 3, `set-state-in-effect`: 2, `no-duplicate-string`: 2 |
| *... và 55 file khác* | | |

#### 📁 Khác (32 files — **72 warnings**)
| File | Warns | Chi tiết lỗi tiêu biểu |
| :--- | :---: | :--- |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/luyen-tap/page.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/luyen-tap/page.tsx) | **19** | `no-restricted-syntax`: 11, `no-unused-vars`: 3, `cognitive-complexity`: 2, `no-duplicate-string`: 1, `set-state-in-effect`: 1, `exhaustive-deps`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/events-library/EventsLibrary.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/events-library/EventsLibrary.tsx) | **7** | `no-restricted-syntax`: 3, `no-duplicate-string`: 1, `set-state-in-effect`: 1, `no-unused-vars`: 1, `no-img-element`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/constants/enums.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/constants/enums.ts) | **5** | `no-duplicate-string`: 5 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/api/notes/[id]/route.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/api/notes/[id]/route.ts) | **3** | `no-restricted-syntax`: 2, `folder-naming-convention`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/layout.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/layout.tsx) | **3** | `no-duplicate-string`: 2, `no-restricted-syntax`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/constants/routes.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/constants/routes.ts) | **3** | `no-restricted-syntax`: 3 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/api/notes/route.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/api/notes/route.ts) | **2** | `no-restricted-syntax`: 2 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/api/public/quizzes/[id]/statistics/route.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/api/public/quizzes/[id]/statistics/route.ts) | **2** | `folder-naming-convention`: 1, `no-restricted-syntax`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/api/public/quizzes/[id]/submit/route.ts`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/api/public/quizzes/[id]/submit/route.ts) | **2** | `folder-naming-convention`: 1, `no-restricted-syntax`: 1 |
| [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/thuc-the/[slug]/page.tsx`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/thuc-the/[slug]/page.tsx) | **2** | `folder-naming-convention`: 1, `no-unused-vars`: 1 |
| *... và 22 file khác* | | |

### 5.3. Danh sách các hàm Frontend có Cognitive Complexity > 15 (Cần refactor)
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/CommunityFeed.tsx:53`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/CommunityFeed.tsx#L53): Refactor this function to reduce its Cognitive Complexity from 54 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/CommunityFeed.tsx:107`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/CommunityFeed.tsx#L107): Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/QuickComposer.tsx:19`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/QuickComposer.tsx#L19): Refactor this function to reduce its Cognitive Complexity from 27 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/inspectors/StoryChapterBlockInspector.tsx:101`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/inspectors/StoryChapterBlockInspector.tsx#L101): Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogCreatePage.tsx:68`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogCreatePage.tsx#L68): Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/CommunityProfileView.tsx:60`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/CommunityProfileView.tsx#L60): Refactor this function to reduce its Cognitive Complexity from 40 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuestionBankModal.tsx:144`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuestionBankModal.tsx#L144): Refactor this function to reduce its Cognitive Complexity from 32 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuestionBankModal.tsx:212`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuestionBankModal.tsx#L212): Refactor this function to reduce its Cognitive Complexity from 28 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuestionBankModal.tsx:359`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/quiz/components/QuestionBankModal.tsx#L359): Refactor this function to reduce its Cognitive Complexity from 34 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/PostCommentModal.tsx:368`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/PostCommentModal.tsx#L368): Refactor this function to reduce its Cognitive Complexity from 31 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/PostCommentModal.tsx:448`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/PostCommentModal.tsx#L448): Refactor this function to reduce its Cognitive Complexity from 23 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/PostCommentModal.tsx:636`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/PostCommentModal.tsx#L636): Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/StoryChapterBlockEditor.tsx:332`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/StoryChapterBlockEditor.tsx#L332): Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/luyen-tap/page.tsx:117`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/luyen-tap/page.tsx#L117): Refactor this function to reduce its Cognitive Complexity from 39 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/luyen-tap/page.tsx:252`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/app/luyen-tap/page.tsx#L252): Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/entity-detail/entity-reader-adapter.ts:105`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/entity-detail/entity-reader-adapter.ts#L105): Refactor this function to reduce its Cognitive Complexity from 56 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/entity-detail/entity-reader-adapter.ts:285`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/entity-detail/entity-reader-adapter.ts#L285): Refactor this function to reduce its Cognitive Complexity from 29 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/components/hub/HubLessonQuiz.tsx:33`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/components/hub/HubLessonQuiz.tsx#L33): Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/components/hub/HubLessonQuiz.tsx:63`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/components/hub/HubLessonQuiz.tsx#L63): Refactor this function to reduce its Cognitive Complexity from 25 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/strategies/public-curriculum.strategies.ts:324`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/strategies/public-curriculum.strategies.ts#L324): Refactor this function to reduce its Cognitive Complexity from 25 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/facades/useLessonEditorFacade.ts:115`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/facades/useLessonEditorFacade.ts#L115): Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/facades/useLessonEditorFacade.ts:270`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/facades/useLessonEditorFacade.ts#L270): Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/inspectors/TypographyInspectorPanel.tsx:39`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/inspectors/TypographyInspectorPanel.tsx#L39): Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/plugins/story-chapter-block.plugin.ts:161`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/plugins/story-chapter-block.plugin.ts#L161): Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/story-chapter/StoryChapterContentBlock.tsx:15`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/story-chapter/StoryChapterContentBlock.tsx#L15): Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/topics/components/TopicEditor.tsx:63`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/topics/components/TopicEditor.tsx#L63): Refactor this function to reduce its Cognitive Complexity from 43 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/services/entities/landing.service.ts:551`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/services/entities/landing.service.ts#L551): Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/services/entities/landing.service.ts:684`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/services/entities/landing.service.ts#L684): Refactor this function to reduce its Cognitive Complexity from 25 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogDetailPage.tsx:35`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogDetailPage.tsx#L35): Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/TimelineBlockItemEditor.tsx:226`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/builder/TimelineBlockItemEditor.tsx#L226): Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/utils/lesson-toc.util.ts:19`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/utils/lesson-toc.util.ts#L19): Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/topics/components/TopicParentModalPicker.tsx:351`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/topics/components/TopicParentModalPicker.tsx#L351): Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/entity-detail/EntityReader.tsx:39`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/entity-detail/EntityReader.tsx#L39): Refactor this function to reduce its Cognitive Complexity from 27 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/components/PublicCurriculumView.tsx:94`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/components/PublicCurriculumView.tsx#L94): Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/PostCard.tsx:40`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/community/components/PostCard.tsx#L40): Refactor this function to reduce its Cognitive Complexity from 44 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/curriculum/components/CurriculumExplorer.tsx:114`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/curriculum/components/CurriculumExplorer.tsx#L114): Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/blocks/EventPickerModal.tsx:74`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/blocks/EventPickerModal.tsx#L74): Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/components/PublicLessonReaderView.tsx:89`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/public-curriculum/components/PublicLessonReaderView.tsx#L89): Refactor this function to reduce its Cognitive Complexity from 55 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/timeline/TimelineNodeItem.tsx:41`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/timeline/TimelineNodeItem.tsx#L41): Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogBrowser.tsx:39`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/blog/components/BlogBrowser.tsx#L39): Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/heritage/heritage.adapter.ts:66`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/heritage/heritage.adapter.ts#L66): Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/TipTapContent.tsx:33`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/TipTapContent.tsx#L33): Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/timeline/EventCard.tsx:17`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/timeline/EventCard.tsx#L17): Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/timeline/TimelineExplorer.tsx:92`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/timeline/TimelineExplorer.tsx#L92): Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/timeline/TimelineFocus.tsx:52`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/timeline/TimelineFocus.tsx#L52): Refactor this function to reduce its Cognitive Complexity from 29 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/timeline/sk-adapter.ts:145`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/components/timeline/sk-adapter.ts#L145): Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.
- [`D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/TipTapToolbar.tsx:32`](file:///D:/Fullit/TLCN/TLCN-DT07/frontend/src/features/lessons/components/TipTapToolbar.tsx#L32): Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.

---

## 🛠️ 6. KẾ HOẠCH BÀO MÒN & GIẢM CẢNH BÁO THEO TỪNG LÔ (BATCH FIX ROADMAP)

Để xử lý hơn 1,000 cảnh báo này một cách khoa học, không gây xung đột và bám sát [CODE_AUDIT_PLAN.md](CODE_AUDIT_PLAN.md):

### 🚀 Giai đoạn 1: Sửa nhanh tự động & Dọn rác (Giảm ngay ~200 warnings)
1. **Dọn biến không dùng (`@typescript-eslint/no-unused-vars` - 78 warnings):**
   - Chạy script xoá hoặc prefix dấu gạch dưới `_` cho các biến nhận vào nhưng không dùng (vd: `_error`, `_index`).
2. **Cân chỉnh ngưỡng chuỗi trùng lặp (`sonarjs/no-duplicate-string` - 190 warnings):**
   - Hiện threshold đang là **`2`** (quá nhạy cho JSX/HTML). Đề xuất nâng lên **`3` hoặc `4`** (giống backend) trong `frontend/eslint.config.mjs`. Chỉ riêng bước này sẽ giảm tự động ~100-120 warnings giả (false positive) mà không làm suy giảm chất lượng code.

### 🧩 Giai đoạn 2: Chuẩn hoá Magic Strings sang Enums (Giảm ~350 warnings)
- Bổ sung hoặc dùng triệt để các Enum đã có:
  - Trạng thái nội dung: `ContentStatus`
  - Loại phân hệ/chuyên mục: `ArticleKind`
  - Loại khối bài học: `LessonBlockType`
  - Quyền hạn người dùng: `UserRole`
- Thay thế các biểu thức `status === 'PUBLISHED'` sang `status === ContentStatus.PUBLISHED`.

### 🛡️ Giai đoạn 3: Khử `any` & Chuẩn hoá Props (Giảm ~150 warnings)
- Khử `any` trong các file Type lõi:
  - `frontend/src/features/lessons/types/editor.types.ts`
  - `frontend/src/features/public-curriculum/strategies/public-curriculum.strategies.ts`
  - `backend/src/lesson/dto/create-lesson.dto.ts`
- Định nghĩa interface trả về cho API responses thay vì `Promise<any>`.

### ⚡ Giai đoạn 4: Refactor Hàm quá phức tạp (Cognitive Complexity > 15)
- Tách nhỏ các hàm xử lý dữ liệu phức tạp trong `landing.service.ts` và các Strategy layout (`story-chapter-layout.strategy.ts`).

---
*(Báo cáo được trích xuất tự động từ kết quả chạy thực tế của ESLint CLI trên cả hai gói backend và frontend)*
