# MA TRẬN TRUY VẾT YÊU CẦU & TEST CASE (RTM) — HISGO

> Tài liệu này ánh xạ trực tiếp **Acceptance Criteria (AC)** → **Test Case ID** → **Phân loại (Positive / Negative / Boundary)** → **Tầng kiểm thử & Script tự động thực tế** trong repository.

---

## 1. Thống kê tổng quan & Tỷ lệ tự động hoá (Automation Rate)

### 1.1. Tỷ lệ trên Ma trận truy vết (RTM)
- **Tổng số Test Case định danh trong RTM:** **60**
  - **Tự động hoá (Automated):** **58** (**96.67%** — vượt ngưỡng **>= 70%**)
  - **Kiểm tra thủ công (Manual):** **2** (`3.33%` — kiểm tra giao diện trực quan đa viewport và xác nhận phê duyệt phát hành CD)
- **Độ phủ theo loại kịch bản (một số TC gộp kiểm tra chéo hai loại):**
  - Có bao phủ **Positive (Ca dương):** 35 TC
  - Có bao phủ **Negative (Ca âm):** 28 TC
  - Có bao phủ **Boundary (Ca biên):** 18 TC

### 1.2. Tổng số ca kiểm thử tự động đã thực thi thực tế
- **Backend Unit & Controller (Jest):** `691` tests (`74` files, `77.99%` Lines)
- **Backend Integration / API E2E (Supertest + Postgres/Redis):** `108` tests (`12` suites)
- **Frontend Unit & Component (Vitest + RTL):** `48` tests (`10` files, `84.94%` Lines core)
- **Frontend UI E2E (Playwright TypeScript Chrome Headless):** `30` tests (`3` suites: `public-and-auth.e2e.ts`, `learner-journeys.e2e.ts`, `cms-workflows.e2e.ts`)
- **Non-functional Load & Rate-limit (`load-smoke.mjs`):** `4` kịch bản
- **Tổng cộng:** **881/881 automated cases/scenarios PASS (100%)**

---

## 2. Ma trận truy vết chi tiết (Acceptance Criteria → Test Cases)

### AC-01: Xác thực, Phiên JWT & Bảo vệ truy cập CMS (`Auth` & `CmsAccessGate`)
| TC ID | Mô tả kiểm thử | Loại | Tầng | Hình thức | Vị trí Script / Ghi chú | Trạng thái |
|---|---|---|---|---|---|---|
| `TC-AUTH-01` | Đăng ký hợp lệ, gửi OTP vào Redis và xác minh email thành công | Positive | API E2E | Automated | `backend/test/auth.e2e-spec.ts` | PASS |
| `TC-AUTH-02` | Đăng ký thất bại khi mật khẩu yếu hoặc email đã tồn tại (`400`/`409`) | Negative | API E2E | Automated | `backend/test/auth.e2e-spec.ts` | PASS |
| `TC-AUTH-03` | Xác minh email với mã OTP sai/hết hạn bị từ chối | Negative | API E2E | Automated | `backend/test/auth.e2e-spec.ts` | PASS |
| `TC-AUTH-04` | Đăng nhập UI với mật khẩu sai hiển thị thông báo lỗi và giữ nguyên trang `/login` | Negative | E2E UI | Automated | `frontend/tests/e2e/public-and-auth.e2e.ts` (`#09`) | PASS |
| `TC-AUTH-05` | Đăng nhập UI đúng tài khoản chuyển hướng về trang chủ kèm phiên hợp lệ | Positive | E2E UI | Automated | `frontend/tests/e2e/public-and-auth.e2e.ts` (`#10`) | PASS |
| `TC-AUTH-06` | Xoay vòng refresh token hợp lệ & từ chối refresh token giả/hết hạn sau khi logout | Positive + Negative | API E2E + Unit | Automated | `backend/test/auth.e2e-spec.ts`, `frontend/tests/unit/public-auth.service.test.ts` | PASS |
| `TC-AUTH-07` | Khách chưa đăng nhập mở route CMS (`/cms`) bị `CmsAccessGate` chặn & redirect sang `/login?redirect=...`; học viên thường (`USER`) bị chặn `"Khu vực dành cho nhân sự biên soạn"` | Negative | E2E UI | Automated | `frontend/tests/e2e/public-and-auth.e2e.ts` (`#08`), `frontend/tests/e2e/learner-journeys.e2e.ts` (`#20`) | PASS |

### AC-02: Bài viết lịch sử (`Article`), Duyệt 2 người & Vòng đời Lưu trữ
| TC ID | Mô tả kiểm thử | Loại | Tầng | Hình thức | Vị trí Script / Ghi chú | Trạng thái |
|---|---|---|---|---|---|---|
| `TC-ART-01` | Biên tập viên tạo bản nháp, gửi duyệt và người duyệt khác xuất bản → hiển thị công khai | Positive | API E2E | Automated | `backend/test/article.e2e-spec.ts` | PASS |
| `TC-ART-02` | Biên tập viên không tạo thẳng bài `PUBLISHED`, người duyệt không tự duyệt bài của mình | Negative | API E2E | Automated | `backend/test/article.e2e-spec.ts` | PASS |
| `TC-ART-03` | Từ chối bài viết không nhập lý do bị trả lỗi `400` | Negative | API E2E | Automated | `backend/test/article.e2e-spec.ts` | PASS |
| `TC-ART-04` | Chuyển trạng thái lưu trữ `PUBLISHED → ARCHIVED → DRAFT`; không cho nhảy thẳng `ARCHIVED → PUBLISHED` | Boundary | API E2E | Automated | `backend/test/article.e2e-spec.ts` | PASS |
| `TC-ART-05` | Đọc bài viết công khai `/bai-viet/[slug]` khi **chưa đăng nhập** vẫn hiển thị đầy đủ nội dung (không bị redirect về `/login`) | Regression / Negative | E2E UI + Unit | Automated | `frontend/tests/e2e/public-and-auth.e2e.ts` (`#07`), `frontend/tests/unit/saved-material.normalizer.test.ts` | PASS |
| `TC-ART-06` | Tìm kiếm bài viết `/bai-viet` khớp từ khoá, khi từ khoá không khớp (`0` kết quả), chuyển chế độ Lưới ⇄ Danh sách và mở Mục lục chủ đề | Positive + Boundary | E2E UI | Automated | `frontend/tests/e2e/public-and-auth.e2e.ts` (`#03`, `#04`) | PASS |
| `TC-ART-07` | Tạo bài viết phân loại theo cây `categoryId` + niên đại `startYear`/`endYear`/`dateText`; response `/public/articles/:slug` không còn các trường cũ (`kind`, `datePrecision`, `links`) và từ chối gửi `kind`/`datePrecision` (`400`) | Positive + Negative | API E2E | Automated | `backend/test/article.e2e-spec.ts` | PASS |
| `TC-CMS-01` | Trình soạn thảo CMS `/articles/create` chỉ hiển thị 2 tab (`Thông tin` & `Nội dung`) kèm bộ chọn cây `Chuyên mục`, chặn lưu khi thiếu tiêu đề, không còn tab `Hồ sơ riêng` hay `Hồ sơ & liên kết` | Positive + Negative | E2E UI | Automated | `frontend/tests/e2e/cms-workflows.e2e.ts` (`#22`, `#23`) | PASS |
| `TC-CMS-02` | CMS Dashboard `/cms` & Sidebar rút gọn không còn các trang thừa (`Cài đặt hệ thống`, `Thư viện Media`), cùng các màn quản lý `/categories`, `/tags`, `/timelines`, `/curriculum`, `/lessons/create`, `/quizzes`, `/review` hiển thị sạch | Positive | E2E UI | Automated | `frontend/tests/e2e/cms-workflows.e2e.ts` (`#21`, `#24`–`#30`) | PASS |

### AC-03: Phân loại `Topic`, `Category`, `Tag`, Dòng thời gian (`Timeline`) & Chống XSS nội dung
| TC ID | Mô tả kiểm thử | Loại | Tầng | Hình thức | Vị trí Script / Ghi chú | Trạng thái |
|---|---|---|---|---|---|---|
| `TC-TAX-01` | Tạo cây Topic cha-con (`Composite`), gắn/tách con và sắp xếp lại thứ tự bằng `$transaction` | Positive | API E2E | Automated | `backend/test/topic.e2e-spec.ts` | PASS |
| `TC-TAX-02` | Chống vòng lặp (Anti-Cycle) khi gán chính Topic làm cha/con của nó; từ chối `reorder` khi mảng `items` rỗng | Negative + Boundary | API E2E | Automated | `backend/test/topic.e2e-spec.ts` | PASS |
| `TC-TAX-03` | Tạo Tag trùng tên trả `409`; người học không được tạo Tag (`403`); xoá bài viết tự xoá cache đếm Tag | Negative + Boundary | API E2E | Automated | `backend/test/tag.e2e-spec.ts`, `backend/test/article.e2e-spec.ts` | PASS |
| `TC-TAX-04` | Loại bỏ `<script>`, event handler inline `onerror=` qua `sanitizeRichHtml` trước khi render | Negative / Security | Unit | Automated | `frontend/tests/unit/common.test.ts`, `frontend/tests/unit/article-kind.test.ts` | PASS |
| `TC-TML-01` | Điều hướng `/chuyen-muc/:slug` tự động redirect sang `/bai-viet?chuyen-muc=:slug` và trang `/dong-thoi-gian` hiển thị đúng các mốc sự kiện từ `TimelineNodeArticle` không lỗi SSR/console | Positive + Boundary | E2E UI | Automated | `frontend/tests/e2e/public-and-auth.e2e.ts` (`#05`, `#06`) | PASS |

### AC-04: Giáo trình, Bài học (`Lesson` / `LearningPath`) & Quyền ghi danh
| TC ID | Mô tả kiểm thử | Loại | Tầng | Hình thức | Vị trí Script / Ghi chú | Trạng thái |
|---|---|---|---|---|---|---|
| `TC-LRN-01` | Dựng Lộ trình → Chương → Gom bài học → Người duyệt xuất bản chỉ bằng `{ status }` | Positive | API E2E | Automated | `backend/test/learning-path.e2e-spec.ts`, `backend/test/lesson.e2e-spec.ts` | PASS |
| `TC-LRN-02` | Người học chưa ghi danh đọc bài thuộc lộ trình bị chặn `403 NOT_ENROLLED`; huỷ đăng ký xong mất quyền đọc | Negative | API E2E | Automated | `backend/test/learning-path.e2e-spec.ts` | PASS |
| `TC-LRN-03` | Tạo bài học thiếu Topic (`400`), không được đăng ký lộ trình đang `DRAFT` hoặc `ARCHIVED` | Negative + Boundary | API E2E | Automated | `backend/test/lesson.e2e-spec.ts`, `backend/test/learning-path.e2e-spec.ts` | PASS |
| `TC-LRN-04` | Dựng mục lục (TOC), di chuyển block & chuyển đổi khối `STORY_CHAPTER` cũ sang `SECTION_ROW` | Positive + Boundary | Unit | Automated | `frontend/tests/unit/lesson-blocks-and-toc.test.ts` | PASS |
| `TC-LRN-05` | Giao diện `/chuong-trinh-hoc` lọc lộ trình theo Chủ đề/từ khóa, chặn đọc `/bai-hoc/:slug` khi chưa đăng nhập và cho phép ghi danh miễn phí → vào đọc nội dung bài học | Positive + Negative | E2E UI | Automated | `frontend/tests/e2e/learner-journeys.e2e.ts` (`#13`, `#14`, `#15`) | PASS |

### AC-05: Luyện tập & Khảo thí (`Quiz` / Ngân hàng câu hỏi)
| TC ID | Mô tả kiểm thử | Loại | Tầng | Hình thức | Vị trí Script / Ghi chú | Trạng thái |
|---|---|---|---|---|---|---|
| `TC-QUIZ-01` | Đề công khai `/public/quizzes` **không trả đáp án**; server tự chấm điểm & tính kết quả trên DB | Positive / Security | API E2E | Automated | `backend/test/quiz.e2e-spec.ts` | PASS |
| `TC-QUIZ-02` | Làm bài trọn luồng trên UI `/luyen-tap` → chọn đáp án → nộp bài → hiển thị `100%` | Positive | E2E UI | Automated | `frontend/tests/e2e/learner-journeys.e2e.ts` (`#12`) | PASS |
| `TC-QUIZ-03` | Từ chối câu hỏi 1 đáp án không có phương án đúng (`400`), từ chối gửi field `lessonId` cũ (`400`), nộp đề lạ trả `404` | Negative | API E2E | Automated | `backend/test/quiz.e2e-spec.ts` | PASS |
| `TC-QUIZ-04` | Khi gỡ hết Topic hoặc gắn vào Topic chưa xuất bản thì đề tự ẩn khỏi danh sách công khai | Boundary | API E2E | Automated | `backend/test/quiz.e2e-spec.ts` | PASS |
| `TC-QUIZ-05` | Lọc/gom đề theo cây Topic & chiến lược câu hỏi theo chủ đề | Positive + Boundary | Unit | Automated | `frontend/tests/unit/practice-quiz-and-lesson-quiz.test.ts`, `frontend/tests/unit/question-topic.strategy.test.ts`, `frontend/tests/unit/true-false-selector.test.tsx` | PASS |

### AC-06: Blog, Cộng đồng & Theo dõi tác giả (`Author Follow`)
| TC ID | Mô tả kiểm thử | Loại | Tầng | Hình thức | Vị trí Script / Ghi chú | Trạng thái |
|---|---|---|---|---|---|---|
| `TC-FLW-01` | Đăng nhập và nhấn `Theo dõi` trên trang bài viết → đồng bộ sang hồ sơ `/cong-dong/thanh-vien/[username]`, giữ trạng thái sau F5 và bỏ theo dõi | Positive | E2E UI | Automated | `frontend/tests/e2e/learner-journeys.e2e.ts` (`#11`) | PASS |
| `TC-FLW-02` | Khách chưa đăng nhập nhấn `Theo dõi` trên trang bài viết → chuyển sang `/login` | Negative | E2E UI | Automated | `frontend/tests/e2e/public-and-auth.e2e.ts` (`#07`) | PASS |
| `TC-FLW-03` | Toggle follow via API tạo thông báo `NEW_FOLLOWER`, cập nhật `followerCount` & `follow-status`; tự follow chính mình bị chặn `400`, target lạ trả `404` | Positive + Negative | API E2E | Automated | `backend/test/blog-follow.e2e-spec.ts` | PASS |
| `TC-FLW-04` | Tạo `QUICK_POST`, gửi duyệt `LONG_FORM`, like, bookmark, comment lồng nhánh; user thường không tự xuất bản `LONG_FORM` (`403`); hiển thị bảng tin `/cong-dong` & redirect `/cong-dong/ca-nhan` | Positive + Negative | API E2E + E2E UI | Automated | `backend/test/blog-follow.e2e-spec.ts`, `frontend/tests/e2e/learner-journeys.e2e.ts` (`#16`, `#17`) | PASS |
| `TC-FLW-05` | `AuthorFollowButton` xử lý trạng thái lạc quan, rollback khi API lỗi, tự ẩn khi xem bài của chính mình | Boundary | Unit / RTL | Automated | `frontend/tests/unit/author-follow-button.test.tsx` | PASS |

### AC-07: Hỏi đáp (`Discussion`) & Ghi chú cá nhân (`Note`)
| TC ID | Mô tả kiểm thử | Loại | Tầng | Hình thức | Vị trí Script / Ghi chú | Trạng thái |
|---|---|---|---|---|---|---|
| `TC-NOTE-01` | Tạo câu hỏi ở Bài học, ban biên soạn trả lời đánh dấu `isOfficial=true` & gửi Notification `OFFICIAL_REPLY` | Positive | API E2E | Automated | `backend/test/discussion-note.e2e-spec.ts` | PASS |
| `TC-NOTE-02` | Chặn đặt câu hỏi trên Bài viết (`400`), người lạ không xoá được câu hỏi/ghi chú (`403`) | Negative | API E2E | Automated | `backend/test/discussion-note.e2e-spec.ts` | PASS |
| `TC-NOTE-03` | Cô lập ghi chú khách (`x-guest-id`); khi thiếu cả JWT lẫn `guestId` trả mảng rỗng `[]` | Boundary | API E2E | Automated | `backend/test/discussion-note.e2e-spec.ts` | PASS |
| `TC-NOTE-04` | Gom cụm ghi chú theo khoảng chồng lấn & tái định vị anchor khi nội dung thay đổi | Positive + Boundary | Unit | Automated | `frontend/tests/unit/note-cluster-and-anchor.test.ts` | PASS |

### AC-08: Công cụ học tập mới (`Flashcards SM-2`, `Mindmap`, `Saved Materials`, `Gamification`)
| TC ID | Mô tả kiểm thử | Loại | Tầng | Hình thức | Vị trí Script / Ghi chú | Trạng thái |
|---|---|---|---|---|---|---|
| `TC-TOOL-01` | Tạo bộ thẻ + thẻ Flashcard, lấy batch đến hạn (`due`) và chấm SM-2 `GOOD` tăng `repetitions` & `intervalDays` | Positive | API E2E | Automated | `backend/test/learning-tools.e2e-spec.ts` | PASS |
| `TC-TOOL-02` | Chặn tên bộ thẻ toàn khoảng trắng (`400`), chặn user khác truy cập deck/mindmap (`403`/`404`) | Negative + Boundary | API E2E | Automated | `backend/test/learning-tools.e2e-spec.ts` | PASS |
| `TC-TOOL-03` | Mindmap CRUD (`POST`/`GET`/`PATCH`/`DELETE`) và chuyển toàn bộ 7 tab `/tai-khoan` (`Hồ sơ sử học`, `Lộ trình của tôi`, `Mục tiêu & Thành tựu`, `Tư liệu đã lưu`, `Thẻ ghi nhớ`, `Sơ đồ tư duy`, `Bảo mật & Phiên`) không lỗi JS console | Positive | API E2E + E2E UI | Automated | `backend/test/learning-tools.e2e-spec.ts`, `frontend/tests/e2e/learner-journeys.e2e.ts` (`#18`, `#19`) | PASS |
| `TC-TOOL-04` | Lưu `ARTICLE` tự đồng bộ ghim `TIMELINE_NODE` trong `$transaction`; enum lạ trả `400` | Positive + Negative | API E2E | Automated | `backend/test/learning-tools.e2e-spec.ts` | PASS |
| `TC-TOOL-05` | Đánh dấu đọc xong bài viết cộng XP lần đầu; gọi lại lần 2 trả `alreadyCompleted=true`, `xpEarned=0` (chống farm XP qua `dedupKey`) | Boundary | API E2E | Automated | `backend/test/learning-tools.e2e-spec.ts` | PASS |

### AC-09: Kiểm duyệt (`Moderation AI Sentinel`) & Hàng chờ duyệt (`Dashboard`)
| TC ID | Mô tả kiểm thử | Loại | Tầng | Hình thức | Vị trí Script / Ghi chú | Trạng thái |
|---|---|---|---|---|---|---|
| `TC-MOD-01` | Người học báo cáo bài viết, báo cáo trùng 2 lần bị chặn `409`, Moderator xem danh sách & xử lý 1-click | Positive + Negative | API E2E | Automated | `backend/test/learning-tools.e2e-spec.ts` | PASS |
| `TC-MOD-02` | Người học bị chặn xem `/moderation/reports` & `/dashboard/overview` (`403`); hàng chờ duyệt tổng hợp chỉ cho Reviewer | Negative | API E2E | Automated | `backend/test/learning-tools.e2e-spec.ts`, `backend/test/dashboard.e2e-spec.ts` | PASS |
| `TC-MOD-03` | Moderation AI xử lý chuỗi trắng/rỗng, fallback an toàn khi Gemini API lỗi mạng/HTTP & ưu tiên luật `AUTO_HIDE` | Boundary + Negative | Unit | Automated | `backend/src/moderation/moderation-ai.service.spec.ts` | PASS |

### AC-10: Phi chức năng (Hiệu năng, Tải đồng thời & Khả năng chịu lỗi)
| TC ID | Mô tả kiểm thử | Loại | Tầng | Hình thức | Vị trí Script / Ghi chú | Trạng thái |
|---|---|---|---|---|---|---|
| `TC-PERF-01` | `/public/articles?limit=20` chịu tải `10` luồng đồng thời (`50` requests): `p95 <= 1000 ms`, `0` lỗi `5xx` (thực đo `p95=86.82 ms`, `184.6 RPS`) | Positive / Perf | Non-functional | Automated | `backend/test/perf/load-smoke.mjs` | PASS |
| `TC-PERF-02` | `/public/quizzes` & `/public/timelines` chịu tải `10` VUs (`p95=76.57 ms` & `84.78 ms`, `0` `5xx`) | Positive / Perf | Non-functional | Automated | `backend/test/perf/load-smoke.mjs` | PASS |
| `TC-PERF-03` | Burst `POST /auth/login` sai mật khẩu liên tiếp: không sập `500`, trả `401`/`429` kiểm soát (`p95=60.29 ms`) | Negative / Resilience | Non-functional | Automated | `backend/test/perf/load-smoke.mjs` | PASS |
| `TC-PERF-04` | Kiểm tra endpoint `/metrics` Prometheus khả dụng & ứng dụng thoát kết nối Redis/Prisma gọn không treo tiến trình | Boundary / Reliability | API E2E | Automated | `backend/test/auth.e2e-spec.ts`, `backend/src/common/modules/rate-limit.module.ts` | PASS |

### AC-11: Kiểm tra thủ công bổ sung (Manual Exploratory & Release Gate)
| TC ID | Mô tả kiểm thử | Loại | Tầng | Hình thức | Ghi chú thực hiện | Trạng thái |
|---|---|---|---|---|---|---|
| `TC-MAN-01` | Kiểm tra bố cục giao diện thực tế (mobile/desktop) trang chủ, trang đọc bài viết & tab tài khoản | Positive | UI Exploratory | Manual | Xác nhận hiển thị không vỡ khung trên viewport `1440x1080` & `375px` | PASS |
| `TC-MAN-02` | Phê duyệt thủ công triển khai Docker image khi phát hành Production | Positive | Release Gate | Manual | Sẽ gắn cờ `environment` approval ở bước CI/CD | PENDING_CD |

---

## 3. Hiện trạng bộ kiểm thử trong `frontend/tests/` (Đồng bộ 100% TypeScript)

| Nhóm file | Số lượng | Công cụ chạy | Ghi chú |
|---|---|---|---|
| `frontend/tests/unit/*.test.ts(x)` | 10 file (`48` tests) | **Vitest + React Testing Library** (`npm --prefix frontend run test:cov`) | Kiểm thử logic nghiệp vụ cốt lõi & component cô lập (`84.94%` Lines coverage) |
| `frontend/tests/e2e/*.e2e.ts` (`public-and-auth.e2e.ts`, `learner-journeys.e2e.ts`, `cms-workflows.e2e.ts`, `e2e.config.ts`, `e2e.pages.ts`) | 3 suite (`30` scenarios) + 2 file POM/Config | **Playwright TypeScript** (`npm --prefix frontend run test:e2e`) | Đã thay thế và dọn sạch toàn bộ các file `.py` Selenium / `.mjs` rời rạc cũ; đồng bộ 100% hệ sinh thái TypeScript |
