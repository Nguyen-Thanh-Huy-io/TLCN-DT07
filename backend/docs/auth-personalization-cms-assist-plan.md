# Khảo sát & Đề xuất: Đăng ký/Phê duyệt/Phân quyền, Cá nhân hoá, RAG, Hỗ trợ nhập liệu CMS, Phân công biên tập

> Trạng thái: **KHẢO SÁT + ĐỀ XUẤT — chưa code**. Khác với 2 tài liệu trước (tính năng mới hoàn toàn), phần lớn nội dung dưới đây là **đã có sẵn và chạy tốt** — chỉ cần mô tả lại cho rõ luồng. Chỗ nào thật sự thiếu được đánh dấu rõ.

## 0. Xác minh thực tế qua DB (query trực tiếp Postgres `tlcn_db`) — trả lời luôn câu hỏi mở ở mục 6

```
authUser theo role:  ADMIN 2 · MODERATOR 1 · USER 1   (tổng 4 tài khoản)
content_revisions:   0 dòng
```

**Trả lời trực tiếp câu hỏi "quy mô nhóm biên tập viên" đặt ra ở mục 6 bản nháp trước:** thực tế hiện chỉ có **1 MODERATOR + 2 ADMIN** — đúng diện "nhóm rất nhỏ" đã dự đoán. Theo khuyến nghị đã đưa ra (nhóm 1-3 người → bỏ qua tính năng phân công), **kết luận: KHÔNG cần xây tính năng phân công biên tập viên theo chuyên đề ở thời điểm này** — 1 field "gắn nhãn phụ trách" cũng là dư thừa với quy mô này. Nên gạch mục 6 khỏi roadmap gần, chỉ xem lại nếu nhóm biên tập mở rộng thêm người thật.

**Phát hiện thêm quan trọng:** `content_revisions` có **0 dòng** — nghĩa là luồng phê duyệt mô tả ở mục 2 (dù code đọc đầy đủ, đúng logic) **chưa từng được thực thi với dữ liệu thật một lần nào**. Trước khi tin tưởng hoàn toàn vào hệ thống này, nên yêu cầu 1 MODERATOR thật sự sửa 1 nội dung đã xuất bản và đi hết chu trình Gửi duyệt → Duyệt/Từ chối ít nhất 1 lần để xác nhận hoạt động đúng trong thực tế (test thủ công), không chỉ tin vào việc đọc code.

## 1. Đăng ký & Xác thực — ĐÃ ĐẦY ĐỦ, không cần làm gì thêm

**Luồng đăng ký người dùng mới** (`auth.controller.ts`):
```
POST /auth                          → tạo tài khoản, role mặc định = USER (auth.service.ts:109)
                                       gửi email OTP 6 số xác thực
POST /auth/verify-email             → xác thực email bằng OTP
POST /auth/resend-verification-email → gửi lại OTP nếu hết hạn/không nhận được
POST /auth/login                    → đăng nhập (chặn nếu role=USER mà chưa verified, auth.service.ts:526)
GET  /auth/google, /auth/google/callback → đăng nhập/đăng ký qua Google OAuth
```
- Có rate-limit riêng cho nhóm route Auth (`THROTTLER_CONFIG.AUTH`, 5 lần/15 phút) — chống spam đăng ký/brute-force OTP.
- Có `refresh-token`, `logout`, `logout-all` (thu hồi tất cả phiên) đầy đủ.
- **Không có bước "chờ duyệt" khi đăng ký** — tài khoản USER hoạt động ngay sau khi xác thực email, đúng bản chất "người học tự do" (không cần admin can thiệp để bắt đầu học).

**Kết luận: không cần làm gì thêm ở đây.**

## 2. Phân quyền & Phê duyệt nội dung — ĐÃ ĐẦY ĐỦ, thiết kế khá chặt chẽ

### 2.1 4 vai trò (`access.constant.ts`)
| Role | Quyền |
|---|---|
| `USER` | Người học: đăng ký lộ trình, đọc bài, làm quiz |
| `MODERATOR` | Biên tập viên: soạn/sửa nội dung, **chỉ được lưu Nháp hoặc Gửi duyệt** — không tự xuất bản (`EDITOR_ALLOWED_STATUSES`: DRAFT, PENDING_REVIEW) |
| `ADMIN` | Người duyệt: mọi quyền biên tập + duyệt/xuất bản — **không được duyệt bài của chính mình** (`CANNOT_REVIEW_OWN`) |
| `SUPERADMIN` | Mọi quyền trên + quản lý tài khoản/phân quyền (`/users` CRUD, chỉ SUPERADMIN gọi được) |

### 2.2 Luồng phê duyệt (`content-revision` module) — đã hoạt động cho LESSON, EVENT, ENTITY
```
Biên tập viên sửa nội dung ĐANG xuất bản
  → Hệ thống tự tạo 1 ContentRevision (kind=PROPOSAL, status=PENDING) thay vì ghi đè bản công khai
  → Bản công khai giữ nguyên cho tới khi được duyệt
GET  /content-revisions/pending              → danh sách chờ duyệt (ADMIN/SUPERADMIN)
GET  /content-revisions/content/:type/:id    → lịch sử phiên bản của 1 nội dung
GET  /content-revisions/content/:type/:id/draft → bản nháp đang chờ (nếu biên tập viên muốn sửa tiếp)
POST /content-revisions/:id/approve          → áp dụng thay đổi vào bản công khai (chặn tự duyệt bài mình)
POST /content-revisions/:id/reject           → từ chối, kèm ghi chú lý do
POST /content-revisions/:id/restore          → khôi phục về 1 SNAPSHOT cũ
```
- Mỗi lần duyệt/sửa trực tiếp/khôi phục đều tự chụp `SNAPSHOT` — có lịch sử phiên bản đầy đủ, so sánh được (`basePayload` vs `payload`).
- `authorId`/`reviewerId` trên mỗi revision → **đã có vết tích "ai làm, ai duyệt"**, nhưng đây là ghi nhận **sau khi làm xong**, không phải giao việc **trước khi làm** (xem mục 5).

**Kết luận: hệ thống phê duyệt đã chặt — không cần thiết kế lại, chỉ nên khai thác dữ liệu sẵn có (mục 5).**

## 3. Cá nhân hoá người dùng đã đăng ký — HẸP, có khoảng trống rõ

### 3.1 Hiện có (`learner` module, cần đăng nhập)
```
GET  /me/learning                                → lộ trình đã đăng ký + bài đã hoàn thành
POST /me/learning/paths/:id/enroll               → đăng ký lộ trình (miễn phí)
DELETE /me/learning/paths/:id/enroll              → huỷ đăng ký
GET  /me/learning/lessons/:slug                   → trạng thái truy cập 1 bài học
POST /me/learning/lessons/:id/complete            → đánh dấu hoàn thành
```
→ Cá nhân hoá hiện tại **chỉ xoay quanh hệ Lesson/LearningPath** (góc độ "học viên hoàn thành khoá học").

### 3.2 Khoảng trống: phía Knowledge Graph (Nhân vật/Sự kiện/Di tích/Tư liệu) KHÔNG có cá nhân hoá gì cả
Đã rà `prisma/schema/*.prisma` toàn bộ — **không có bảng nào** kiểu `Favorite`, `Bookmark`, `ReadingHistory`, `SavedEntity`. Một người dùng đã đăng nhập xem trang Trần Hưng Đạo 10 lần, hệ thống không biết, không ghi nhớ, không gợi ý gì khác cho họ so với khách vãng lai.

### 3.3 Đề xuất (mức tối thiểu, không phá vỡ gì — làm khi có nhu cầu thật, không phải ưu tiên ngay)
- Bảng mới `UserBookmark` (userId, entityId hoặc contentType+contentId generic, createdAt) — "Lưu để đọc sau" trên trang Nhân vật/Sự kiện/Di tích/Tư liệu.
- `GET /me/bookmarks` — danh sách đã lưu.
- Gợi ý đơn giản không cần AI: "Vì bạn đã xem [Trần Hưng Đạo], có thể bạn quan tâm [Trần Quốc Toản]" dựa thẳng trên `HistoricalStatement` (cùng Period hoặc có quan hệ trực tiếp) — không cần ML, dùng luôn Knowledge Graph sẵn có.

## 4. RAG — tổng hợp lại hướng đã thống nhất trước đó (xem lịch sử trao đổi), liên kết thêm với mục 6

Đã chốt hướng ở lần trao đổi trước: **không cần vector database**, vì dữ liệu HISGO đã có cấu trúc — khi cần AI trả lời về 1 thực thể, lấy thẳng hồ sơ (contentBlocks + statements) bằng SQL, nhét vào context, gọi LLM. Áp dụng cho: hỏi-đáp theo trang Nhân vật/Sự kiện, hỏi-đáp theo Bài học, tự sinh câu hỏi Quiz.
**Điểm nối mới phát hiện khi khảo sát mục 6**: cùng 1 khoản đầu tư LLM đó **có thể dùng luôn để giảm tải nhập liệu CMS** (mục 6.2) — không phải 2 việc tách rời, nên quyết định nhà cung cấp LLM 1 lần, dùng cho cả 2.

## 5. Hỗ trợ nhập liệu CMS — HIỆN TẠI GẦN NHƯ BẰNG 0, đúng như phản ánh

Đã grep toàn backend: **không có** endpoint import CSV/Excel hàng loạt, **không có** tích hợp AI nào (xác nhận lại, khớp với lần kiểm tra trước đó), **không có** API ghi dữ liệu nào ngoài các CRUD REST thông thường của CMS (nghĩa là "có API" theo nghĩa kỹ thuật — Swagger đầy đủ ở `/docs` — nhưng không có *công cụ* nào dùng API đó để nhập hàng loạt, biên tập viên vẫn phải vào từng form).

### 5.1 Đề xuất theo độ ưu tiên

**a) Import/Export CSV cho dữ liệu cấu trúc (rẻ, không cần AI)** — phù hợp nhất cho các trường **cột cứng** (tên, năm sinh/mất, loại, slug) đã phân tích kỹ ở `reference-entity-plan.md`/`heritage-site-plan.md`: biên tập viên điền 1 bảng Excel/CSV (vd. danh sách 50 nhân vật triều Trần với năm sinh/mất/quê quán), hệ thống đọc lên và `upsert` hàng loạt qua đúng `HistoricalEntityService` đã có (tái dùng service, không viết logic tạo entity lần 2). **Không giúp được phần nội dung dài** (Block Builder) — chỉ hợp với trường ngắn.

**b) AI hỗ trợ soạn nội dung dài (cần quyết định nhà cung cấp LLM — chung với mục 4)**:
   - Nút "Gợi ý mô tả ngắn" trong `description` (dự phòng) — AI tóm tắt từ `contentBlocks` đã soạn, không phải tự bịa.
   - Nút "Diễn giải lại từ bản nháp" — biên tập viên dán văn bản thô (chụp/copy từ sách), AI giúp format lại thành các khối H2/P chuẩn (không tự thêm sự kiện, chỉ format) — nối với tính năng string-matching/AI-extraction tên thực thể đã bàn ở phiên trước.
   - **Đây đúng là chỗ giảm tải nhiều nhất** theo đúng lời phàn nàn "nhập tay rất cực" — vì phần tốn công nhất là soạn Block Builder, không phải điền form cột cứng.

**c) Không nên làm ngay**: OCR tự động từ ảnh chụp sách/văn bia — kỹ thuật phức tạp hơn hẳn (a)/(b), nên để sau khi (b) đã chứng minh hữu ích.

## 6. Phân công công việc biên tập viên theo chuyên đề — KHÔNG CÓ, **đã xác nhận: không cần làm**

Đã rà: không có bảng nào kiểu `EditorAssignment`/`WorkItem`, `ContentRevision.authorId` chỉ ghi nhận **sau khi nộp**, không phải giao việc **trước khi làm**. Hiện tại nếu muốn "A phụ trách thời Trần, B phụ trách thời Nguyễn" thì phải tự thoả thuận ngoài hệ thống (Zalo/Sheet riêng) — HISGO không biết gì về việc phân công này.

### Đã xác minh qua DB (mục 0): nhóm chỉ có 1 MODERATOR + 2 ADMIN — đúng diện "nhóm nhỏ"
Theo đúng khuyến nghị đã đặt ra ("nhóm 1-3 người → bỏ qua"), **kết luận cuối: không xây tính năng này**. Phần phê duyệt (mục 2) đã đủ kiểm soát chất lượng với quy mô hiện tại, không cần thêm tầng điều phối việc. Chỉ xem lại nếu nhóm biên tập mở rộng lên 5+ người và thật sự gặp vấn đề trùng việc/bỏ sót — khi đó quay lại câu hỏi "gắn nhãn phụ trách đơn giản" (1 field `assignedToId`) hay "bảng Task/Kanban riêng" (nặng hơn nhiều).

## 7. Tổng kết ưu tiên

| Việc | Cần làm? | Độ lớn |
|---|---|---|
| Đăng ký, xác thực | Không — đã đủ | — |
| Phân quyền, phê duyệt | Không — đã đủ | — |
| Cá nhân hoá (Lesson) | Không — đã đủ | — |
| Cá nhân hoá (Knowledge Graph — bookmark/gợi ý) | Tuỳ nhu cầu, không cấp thiết | Nhỏ |
| RAG hỏi-đáp | Có, đã có kế hoạch từ trước | Vừa |
| Import/Export CSV (cột cứng) | Nên làm — giảm tải nhập liệu thấy ngay | Vừa |
| AI hỗ trợ soạn nội dung dài | Nên làm — đúng chỗ đau nhất, dùng chung hạ tầng LLM với RAG | Vừa–Lớn (phụ thuộc chọn LLM) |
| Phân công biên tập viên | **Không — đã xác nhận qua DB (1 MODERATOR + 2 ADMIN), nhóm quá nhỏ để cần** | — |

---
*Tài liệu khảo sát — chưa có dòng code nào được sửa. Mục 6 đã chốt (bỏ qua) nhờ số liệu DB thật ở mục 0; các mục còn lại (RAG, Import/Export, AI hỗ trợ soạn nội dung) vẫn đang chờ quyết định nhà cung cấp LLM trước khi lên kế hoạch kỹ thuật chi tiết.*
