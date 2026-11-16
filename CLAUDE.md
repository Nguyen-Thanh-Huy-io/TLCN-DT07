# Project rules for Claude Code

## Tìm kiếm trong code — KHÔNG quét đệ quy thủ công

Máy Windows này không có sẵn `ripgrep` (rg) ở ngoài tool, nên lệnh PowerShell kiểu:

```
Get-ChildItem -Recurse | Select-String ...
```

sẽ vô tình quét vào `node_modules/`, `.next/`, `dist/`, `.git/` (hàng chục nghìn file), khiến CPU/disk nghẽn và mỗi lệnh chạy 2–5 phút.

**Quy tắc:**
- **Luôn dùng `git grep` / `git ls-files` khi cần chạy lệnh tìm kiếm qua terminal**: chạy dưới 100ms và tự động tôn trọng `.gitignore`.
- Luôn dùng tool `Grep` (built-in, dựa trên ripgrep, tự động bỏ qua `.git`, và tôn trọng `.gitignore`) hoặc `Glob` để tìm file/nội dung — KHÔNG dùng `Get-ChildItem -Recurse`, `dir /s`, `Select-String` đệ quy, hoặc `grep -r` qua Bash hoặc PowerShell.
- Nếu bắt buộc phải chạy lệnh shell quét file (ví dụ cần xử lý đặc biệt ngoài khả năng của Grep/Glob), PHẢI loại trừ rõ các thư mục nặng: `node_modules`, `.git`, `.next`, `dist`, `build`, `.pytest_cache`.
- Không chạy lệnh quét toàn bộ repo mà không giới hạn `path`/`glob` khi chỉ cần tìm trong `backend/src` hoặc `frontend/src` — luôn khoanh vùng `path` cụ thể trước khi tìm rộng hơn.

## Không dùng magic string / magic number

- Không viết thẳng chuỗi hoặc số có ý nghĩa nghiệp vụ (role, status, error code, path API, key của object, giới hạn số lượng...) lặp lại trực tiếp trong code. Phải đặt thành hằng số (`const`), `enum`, hoặc đọc từ config/env.
- Áp dụng cả hai phía backend (NestJS) và frontend (Next.js):
  - Backend: định nghĩa enum/const trong file riêng (ví dụ `*.constants.ts`, hoặc dùng enum trong `schema.prisma` khi là giá trị lưu DB) — tái dùng ở DTO, service, test thay vì gõ lại string.
  - Frontend: không hardcode route string (`"/luyen-tap/..."`), tên key localStorage, hoặc text lặp nhiều nơi — đưa vào hằng số dùng chung (ví dụ `constants/`, `routes.ts`).
- Ngoại lệ hợp lý: chuỗi dùng đúng 1 lần, không mang ý nghĩa nghiệp vụ (ví dụ label UI tiếng Việt hiển thị một chỗ, log message mô tả) thì không bắt buộc phải tách hằng số — đừng over-engineer.
- Khi sửa code cũ có magic string/number liên quan trực tiếp đến phần đang sửa, tiện tay dọn luôn; không cần đi dọn toàn bộ codebase nếu không liên quan đến task.

## Vài tiêu chuẩn code khác cần giữ

- **Validate ở boundary, không validate tràn lan**: DTO (class-validator) chặn input ở controller; service tin dữ liệu đã qua DTO, không validate lại.
- **Không bắt lỗi (try/catch) cho tình huống không thể xảy ra**: chỉ catch khi có lý do xử lý cụ thể (log, rollback, trả lỗi rõ nghĩa); không catch rồi nuốt lỗi im lặng.
- **Đặt tên rõ nghĩa, không viết comment giải thích "làm gì"**: tên biến/hàm phải tự giải thích; chỉ viết comment khi có lý do ẨN (workaround, invariant, quyết định không hiển nhiên).
- **Không tạo abstraction/helper dùng 1 lần**: 2-3 dòng lặp lại đơn giản còn hơn một layer trừu tượng cho tương lai chưa chắc xảy ra (tuân theo nguyên tắc YAGNI).
- **Nhất quán kiểu dữ liệu ID và enum với Prisma schema**: khi thêm field mới liên quan đến các bảng đã có (`lesson`, `quiz`, `topic`...), kiểm tra lại kiểu và convention đặt tên đã dùng trong `backend/prisma/schema/*.prisma` trước khi thêm field/enum mới, tránh lệch convention.
- **Không console.log/print để debug còn sót lại trong commit** — dùng logger của NestJS (`Logger`) ở backend; xoá log debug tạm trước khi coi task là xong.
- **Test đi kèm thay đổi logic nghiệp vụ**: khi sửa service có `.spec.ts` sẵn (ví dụ `quiz.service.spec.ts`), cập nhật test tương ứng, không để test cũ fail âm thầm hoặc bị skip.

## TypeScript

- Không dùng `any`. Dùng `unknown` rồi thu hẹp kiểu, hoặc khai báo type/interface rõ ràng.
- Không dùng `as` để ép kiểu cho qua lỗi và không dùng `// @ts-ignore`: sửa kiểu ở gốc.
- Hàm public của service và controller phải khai báo kiểu trả về.

## Backend (NestJS + Prisma)

- Controller chỉ nhận request và gọi service. Logic nghiệp vụ nằm ở service, controller không gọi Prisma trực tiếp.
- Ném exception chuẩn của Nest (`NotFoundException`, `BadRequestException`...) thay vì `throw new Error("...")`.
- Nhiều thao tác ghi phụ thuộc nhau phải nằm trong `prisma.$transaction`.
- Tránh N+1 query: dùng `include`/`select` hoặc gom query, không query trong vòng lặp.
- Chỉ `select` các field cần trả về, không trả nguyên record có field nhạy cảm (password hash, token).
- API trả danh sách phải có phân trang với giới hạn tối đa.

## Frontend (Next.js)

- Component không gọi `fetch`/axios trực tiếp mà đi qua `services/` và facade hook như hiện có.
- Mọi màn hình gọi API phải xử lý đủ 3 trạng thái: loading, lỗi, rỗng.
- Type của response API khai báo một chỗ và dùng chung, không định nghĩa lại ở từng component.
- **Dữ liệu thực tế 100% từ Database (Tuyệt đối không dùng mô hình Hybrid: Mock Preset + LocalStorage + DB)**: Không nhúng mảng mock data tĩnh hoặc nạp fallback từ `localStorage` cho các thực thể tương tác động (như bình luận, bài viết, lượt thích). Mọi dữ liệu phải bắt nguồn từ Database thông qua API backend chuẩn chỉ và hiển thị đúng 3 trạng thái (loading / empty / error).
- **Giới hạn kích thước file** (cân bằng giữa "ít file" và "file dễ đọc" — vượt ngưỡng thì tách):
  - Component: **≤ 400 dòng**.
  - File gom nhiều sub-component nhỏ cùng một màn hình (`*Parts.tsx`): **≤ 600 dòng**.
  - Hook / facade / service / adapter / strategy: **≤ 500 dòng**.
  - Type, hằng số, helper nhỏ (< ~50 dòng) chỉ một file dùng thì để luôn trong file đó; chỉ tách file riêng khi ≥ 2 nơi dùng. Không tạo file chỉ chứa 1 type hoặc 1 hằng số.
- **Mô hình phân rã Component lớn theo chuẩn SOLID (SRP / Facade)**:
  - Khi phân rã các component vượt ngưỡng trên, phân chia thành các thành phần chuyên trách (gộp các mảnh nhỏ cùng màn hình vào 1 file `*Parts.tsx` thay vì mỗi mảnh 1 file):
    1. **Custom Hook / Facade** (ví dụ `usePostComments.ts`, `useCommunityProfile.ts`): quản lý toàn bộ state, socket realtime, API handlers, tính toán chỉ số thống kê & bộ lọc.
    2. **Types, Helpers & Static Data** (ví dụ `*.types.ts`, `*.util.ts`, `*.data.ts`): tách dữ liệu mẫu/mock và helper biến đổi dữ liệu ra khỏi file UI.
    3. **Sub-components chuyên biệt** (Single Responsibility Principle): mỗi khối giao diện (header/KPI, toolbar/filter, list item, composer) là 1 component có interface props rõ ràng; khối lớn đứng file riêng, khối nhỏ gom chung `*Parts.tsx`.
    4. **Component điều phối (Orchestrator)**: chỉ kết nối hook facade với các sub-components, giữ ≤ 250 dòng.
    5. **Bảo toàn khả năng tương thích ngược (Backward Compatibility)**: Re-export các types, helpers mà các file khác đang import từ component gốc.
- **Mô hình Khảo thí Sư phạm & Quan hệ Quiz — Topic**:
  - Đề thi / Bộ đề khảo thí `Quiz` liên kết trực tiếp với Chủ đề lịch sử (`Topic`) theo quan hệ Many-to-Many (`Quiz.topics Topic[]`), cho phép một đề thi kiểm tra kiến thức tổng hợp của nhiều chủ đề hoặc một chuyên đề độc lập. Tuyệt đối không gắn cứng phụ thuộc `Quiz` vào `Lesson` (đã bỏ `quizzes.lesson_id` ngày 2026-11-14).
  - **Ôn tập trong bài học** (giữa bài / cuối bài) dùng khối `QUIZ` của Block Builder trong `Lesson.content` — luyện tại chỗ, không chấm điểm / không lưu. **Đề thi** (có chấm điểm ở server, lưu `quiz_attempts`) thuộc Topic, người học làm ở trang `/luyen-tap` (`?topic=<id>` chọn sẵn chủ đề; trang đọc bài dẫn sang).
  - Khối `QUIZ` soạn ở `frontend/src/features/lessons/components/builder/QuizBlockEditor.tsx` (tối đa `LESSON_QUIZ_MAX_QUESTIONS` câu/khối, soạn tại chỗ hoặc lấy từ Ngân hàng câu hỏi), chấm **ở client** bằng `isLessonAnswerCorrect` (`utils/lesson-quiz.util.ts`) — hàm này viết lại riêng, cùng luật nhưng KHÔNG dùng chung code với `backend/src/quiz/quiz-grading.ts`; sửa luật chấm 1 loại câu hỏi phải soát và sửa cả hai nơi, không chỉ sửa 1 bên.
  - Câu hỏi của đề **chỉ lấy từ Ngân hàng** (`Question`) qua `quiz_questions` (thứ tự + điểm theo đề); không nhúng câu hỏi JSON vào đề. Cột `questions.data` chỉ chứa phần riêng theo dạng câu và mọi chỗ ghi phải qua `validateAndNormalizeQuestions`.
- **Kiểm soát Độ phức tạp Nhận thức (Cognitive Complexity $\le$ 15)**:
  - Khi một hàm hoặc component có nhiều nhánh rẽ (if/else, switch, map, filter), bắt buộc phải phân rã thành các hàm pure helper chuyên biệt bên ngoài component hoặc tách các sub-components con để giữ Cognitive Complexity luôn $\le 15$ theo chuẩn SonarJS.

## Quy ước riêng của dự án

- **Kiểm tra trước khi coi là xong**: chạy `npm run lint` và test liên quan (`npm run test` ở backend) trong phía vừa sửa. Thay đổi lớn thì chạy thêm `npm run audit` (lint + jscpd + knip). Không thêm warning ESLint mới. Khi đứng ở thư mục gốc của monorepo, có thể chạy nhanh ESLint/TypeScript trên đúng danh sách file vừa sửa bằng `node backend/node_modules/eslint/bin/eslint.js -c backend/eslint.config.mjs <files...>` và `node backend/node_modules/typescript/bin/tsc -p backend/tsconfig.build.json --noEmit` (tương tự cho `frontend`).
- **Một HTTP client ở frontend**: code mới gọi API qua axios instance trong `frontend/src/services/api.ts`, không viết wrapper `fetch` riêng. Base URL của API chỉ khai báo một chỗ tại `frontend/src/constants/api-url.ts` (`API_BASE_URL`, `INTERNAL_API_BASE_URL`, `resolveBackendAssetUrl`) rồi import, không lặp lại fallback `'http://localhost:5000'` hay `'http://127.0.0.1:5000'` trong từng file. Ngoại lệ: route handler trong `src/app/api/` và lời gọi tới API bên ngoài (Wikipedia, Wikimedia — `features/lessons/strategies/entity-sources/**`). Không dựng route proxy Next (`app/api/...`) chỉ để chuyển tiếp sang backend — gọi thẳng backend qua axios (token do interceptor gắn; khoá token thật là `hisgo_reader_access_token`, không tự đọc localStorage).
- **URL & ảnh bên ngoài ở frontend**: URL ngoài hệ thống (`https://…` có tên miền) chỉ khai báo trong vùng URL tập trung của `frontend/src/constants/routes.ts` (`SOCIAL_LINKS`, `WIKIPEDIA_VI_API`, `TIMELINE_HERO_IMAGE_URL`…). Ảnh CMS / nguồn ngoài render qua `components/common/RemoteImage.tsx`, không viết `<img>` trực tiếp; không nhúng mảng ảnh mẫu cứng (Unsplash…) làm "thư viện".
- **Biến môi trường backend**: đọc qua `backend/src/common/config/app.config.ts` hoặc `ConfigService`, không gọi `process.env` trực tiếp trong controller/service. Thêm biến mới thì cập nhật luôn `backend/.env.example`.
- **Response và DTO**:
  - Không tự bọc response (`{ data, message }`...) vì `TransformInterceptor` đã bọc, lỗi do `AllExceptionsFilter` xử lý.
  - Mọi field của DTO phải có decorator `class-validator`, vì `ValidationPipe` bật `whitelist` + `forbidNonWhitelisted` + `transform: true` nên field thiếu decorator sẽ bị từ chối.
  - Field có tập giá trị cố định dùng `@IsEnum(<enum>)` + `@ApiProperty({ enum: <enum> })` với enum Prisma (giá trị lưu DB) hoặc enum trong `*.constant.ts` (giá trị chỉ ở API, vd. `ModerationTab`) — không dùng `@IsIn(['A', 'B'])` + union chuỗi. Trong service, ghi/so sánh giá trị enum qua `EnumName.VALUE` (`ReportSource.AI_SCAN`, `EmailStatus.pending`…), không gõ chuỗi.
  - **Không đặt giá trị khởi tạo (`status?: X = X.DRAFT`) trong `Create*Dto` mà `Update*Dto` kế thừa qua `PartialType`**: `PartialType` mang cả giá trị khởi tạo sang, khiến mọi PATCH không gửi trường đó bị ghi đè (đã từng gỡ xuất bản bài học, hạ quyền người dùng). Đặt mặc định khi tạo mới ở service hoặc `@default` trong Prisma schema; `src/common/update-dto-defaults.spec.ts` kiểm điều này cho mọi `Update*Dto`.
  - **Không gắn đồng thời `@Type(() => Date)` và `@IsString()` trên cùng một trường DTO**: vì `class-transformer` chạy trước `class-validator`, chuỗi ngày sẽ bị ép thành đối tượng `Date` khiến `@IsString()` luôn báo lỗi `400 Bad Request`. Hãy dùng `@IsDateString()` (hoặc `@Type(() => Date)` đi kèm `@IsDate()`).
- **Xác thực danh tính, phân quyền và quy tắc duyệt 2 người**:
  - **Không bao giờ tin `authorId` / `userId` / `creatorId` gửi từ Request Body hoặc Query**: mọi endpoint thay đổi dữ liệu gắn với người dùng phải dùng `@UseGuards(AuthGuard)` (hoặc `@RequireRoles` / `@ContentWrite`) và lấy danh tính từ `req.user.userId` (`AuthenticatedRequest` trong `common/access/roles.guard.ts`).
  - Khi kiểm tra quyền sở hữu tài nguyên trong service (ví dụ chỉ tác giả hoặc STAFF được sửa/xoá bài viết, bình luận), nếu không đủ quyền phải ném `ForbiddenException` (HTTP 403), **không** dùng `BadRequestException` (HTTP 400).
  - **Lưu trữ (`ARCHIVED`)** chỉ đi một vòng `PUBLISHED → ARCHIVED → DRAFT` và chỉ người duyệt làm (kiểm tại `ContentWriteGuard.assertArchiveTransition` cho mọi nội dung CMS); nội dung lưu trữ không hiện ở API công khai. Muốn ẩn một nội dung thì lưu trữ nó, không lọc cứng theo tiêu đề/slug ở frontend. Frontend dùng `components/common/ArchiveStatusButton.tsx`.
  - Với các thực thể áp dụng quy tắc 2 người duyệt (`Lesson`, `Article` — người duyệt phải khác người tạo `CANNOT_REVIEW_OWN`), hàm `create()` bắt buộc phải lưu `createdBy: creatorUserId || null` vào DB.
- **Tránh phụ thuộc vòng (`forwardRef` 2 chiều) giữa các Module NestJS**:
  - Khi hai module nghiệp vụ cùng cần phát sự kiện qua một WebSocket Gateway hoặc gọi service hạ tầng chung (ví dụ `BlogModule` và `ModerationModule` cùng dùng `BlogGateway`), phải tách Gateway/hạ tầng đó ra module riêng (`BlogGatewayModule`) để import một chiều, không dùng `forwardRef` hai chiều.
- **Chống XSS khi render HTML ở Frontend (`dangerouslySetInnerHTML`)**:
  - Dữ liệu văn bản thuần (như `post.excerpt`, tiêu đề, tên tác giả, chú thích) nếu ghép vào chuỗi HTML bắt buộc phải bọc qua `escapeHtml()`.
  - Nội dung Rich HTML (TipTap / Block Builder / câu dẫn Quiz `q.prompt`) trước khi đưa vào `dangerouslySetInnerHTML` bắt buộc phải lọc qua `sanitizeRichHtml()` tại `frontend/src/utils/common.ts`.
- **Quy tắc React 19 / React Compiler & Hooks**:
  - **Tránh gọi setState đồng bộ trong useEffect ("Calling setState synchronously within an effect can trigger cascading renders")**:
    - Khi khôi phục trạng thái từ `localStorage`, cookie hoặc query params, hãy khởi tạo giá trị trực tiếp trong lazy initializer của hook: `const [state, setState] = useState(() => readFromStorage());`.
    - Khi bắt buộc phải kích hoạt nạp dữ liệu hoặc cập nhật state từ `useEffect`, hãy bọc qua microtask `void Promise.resolve().then(() => setState(...));` để tránh kích hoạt cascading render tức thì.
  - **Hàm render phải thuần khiết ("react-hooks/purity")**: Không gọi `Date.now()`, `Math.random()` hoặc hàm sinh trạng thái không thuần khiết trực tiếp trong render phase của component. Hãy lưu thời gian mốc trong `useState(() => Date.now())` hoặc tính toán trong event handlers/effects.
  - **Tránh Temporal Dead Zone trong Component ("Cannot access variable before it is declared")**: mọi hàm trợ giúp hoặc callback được gọi bên trong `useEffect` phải được khai báo trước `useEffect` (hoặc bọc `useCallback` / dùng function declaration có hoisting).
  - **Không đọc hoặc ghi Ref trực tiếp trong Render Phase ("Cannot access refs during render")**: việc gán `ref.current = ...` hoặc đọc `ref.current` chỉ được thực hiện trong `useEffect` hoặc trong event handler, tuyệt đối không gán trần trong thân hàm component.
  - **Khớp Dependency với React Compiler**: khi callback/memo truy cập thuộc tính con lồng nhau của object (như `sessionUser.username`), dependency array cần liệt kê object tham chiếu (`sessionUser`), tránh chỉ liệt kê `sessionUser?.id` dẫn tới cảnh báo `Compilation Skipped: Existing memoization could not be preserved`.
- **Biểu thức chính quy (Regex) & Cú pháp sạch**:
  - Trong biểu thức chính quy (Regex), ký tự gạch chéo `/` khi nằm bên trong lớp ký tự `[...]` không cần thoát ký tự `\/` (dùng `[/.-]` thay vì `[\/.-]`) để tránh vi phạm ESLint rule `no-useless-escape`.
- **Phân định ranh giới Domain Model trong Prisma Schema (DDD & Bounded Context)**:
  - Mỗi domain nghiệp vụ (Article, Blog/Community, Discussion, Note) phải sở hữu schema model và bảng riêng trong database. Tuyệt đối không tái sử dụng bảng của domain này (ví dụ `article_comments`) để chứa dữ liệu cho domain khác (`blog_posts`) bằng cách gán chéo ID, gây nợ kỹ thuật, phá vỡ ràng buộc khóa ngoại (Foreign Key) và buộc frontend phải duy trì mock data dự phòng.
- **Loại bỏ triệt để Taxonomy & Enum thừa/lỗi thời**:
  - Hệ thống Taxonomy và các enum cũ (`FigureRole`, `LocationType`, `EntityType`, `VerificationStatus`, `EntityRelationType`, `EventRelationType`, `EVENT_CATEGORY_CODES`, `TaxonomyGroupCode`, `CategoryFieldType`) đã bị loại bỏ hoàn toàn khỏi backend và frontend.
  - Tuyệt đối KHÔNG tạo các mảng hằng số cứng thay thế (như `PRIMARY_ROLE_CODES`, `CANONICAL_ROLE_LABELS`). Mọi vai trò của nhân vật được lưu trữ và hiển thị trực tiếp dưới dạng danh sách chuỗi linh hoạt (`roles: string[]`) qua component nhập thẻ tự do (`ListField`).
  - Giao diện Landing Page không dựng tab đối sánh khu vực gượng ép (`ParallelBand`, `buildBands`); tập trung hiển thị trực quan Mini Timeline theo thời gian thực tế.
  - Khái niệm **khu vực** (`metadata.region`, `HistoricalRegion`, nhóm "Trong nước / Thế giới", bộ lọc khu vực) và **xếp hạng di tích** (`site.rank`, `HeritageRank`) đã bỏ hẳn — không thêm lại vào metadata, enum, bộ lọc hay UI nếu không có yêu cầu mới.
- **Đổi quan hệ 1-N thành N-N phải giữ tương thích ngược (xem `TimelineNode↔Article`)**: khi 1 quan hệ 1-N (ví dụ `TimelineNode.articleId`) cần mở rộng thành N-N, **giữ nguyên cột FK đơn cũ** và thêm bảng nối riêng (`TimelineNodeArticle`) thay vì xoá/đổi kiểu cột cũ — bản ghi cũ vẫn đọc được, API cũ (trả 1 bài viết) không vỡ. Khi ghi: nếu phía gửi lên vẫn dùng field đơn (`articleId`) thì tự coi là danh sách 1 phần tử; khi đọc công khai, ưu tiên danh sách N-N nếu có, fallback dùng field đơn.
- **Topic và Lộ trình là 2 trục độc lập**: `Topic` là cây phân loại (Giai đoạn → Chủ đề → Chuyên đề) — `Article`, `Lesson`, `Timeline` gắn 1 `topicId`; `Quiz`, `Question` gắn nhiều Topic. `LearningPath` là khoá học chia theo `Chapter` → `ChapterLesson` → `Lesson` có sẵn. Kiểu lộ trình `pathType` (`LearningPathType`: `CHRONOLOGICAL` | `THEMATIC`) chỉ thuộc `LearningPath`, không gắn lên Topic.
- **Category / Topic / Tag — 3 vai trò, không dùng lẫn**:
  - `Category` = bài viết là loại gì (chỉ Article, quyết định `kind` và trang hiển thị). `Topic` = thuộc phần nào của môn sử (dùng để xếp thời kỳ / chủ đề). `Tag` = từ khoá tự do của Lesson & Article, chỉ để tìm kiếm và gợi ý bài liên quan — **không** dùng Tag để phân loại hay suy thời kỳ.
  - Blog không dùng cả ba (có `postType` và hashtag trong `metadata`). Tương tác: Lesson → ghi chú + hỏi đáp (`Discussion`, `DiscussionTargetType` chỉ còn `LESSON`); Article → chỉ ghi chú cá nhân (trao đổi thì dẫn sang Cộng đồng); Blog → bình luận/thích/lưu/báo cáo (`blog_post_comments`). Không dùng bảng `article_comments`.
  - Cây Topic có thể sâu hơn 3 cấp (backend cho tới 20): code duyệt cây (vẽ, lọc, đếm) phải viết đệ quy, không viết cứng theo số cấp.
- **Prisma**:
  - Import client và type từ `@prisma/client` (do `backend/prisma/schema/base.prisma` dùng `provider = "prisma-client-js"` không cấu hình custom `output`, toàn bộ 45 file backend đều dùng `@prisma/client`; không import từ `generated/prisma/client`).
  - Đổi schema theo quy trình: sửa `prisma/schema/*.prisma` → tạo thư mục `prisma/migrations/<timestamp>_<tên>/` → `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema --script -o <thư mục>/migration.sql` → đọc lại SQL → `npx prisma migrate deploy`.
  - Lịch sử migration đã gộp thành 1 baseline `20261114000000_baseline` (2026-11-14) vì 67 migration cũ không dựng được DB trống. DB có từ trước ngày đó chạy **một lần** `npm run db:baseline` (không chạy `migrate deploy` trước bước này); DB mới / máy mới chỉ cần `npx prisma migrate deploy`.
  - `prisma migrate dev` đã chạy lại được, nhưng vẫn ưu tiên quy trình `migrate diff` ở trên để đọc SQL trước khi áp. Không sửa DB bằng `db execute` tay.
  - Giá trị enum vừa `ALTER TYPE ... ADD VALUE` không được dùng ngay trong cùng file migration (Postgres lỗi `55P04 unsafe use of new value`) — tách sang migration sau. Sau khi tạo migration mới, kiểm nó dựng được từ DB trống bằng `npm run test:e2e:prepare` (DB e2e dựng lại bằng `migrate deploy`).
  - Sau khi deploy, `npx prisma migrate status` phải sạch và `migrate diff` phải ra rỗng. Kiểm tra dữ liệu bị ảnh hưởng trước khi xoá bảng/cột.
  - Đọc kỹ SQL sinh ra trước khi deploy: đổi kiểu cột Prisma hay sinh `DROP COLUMN` + `ADD COLUMN` (mất dữ liệu) → sửa thành `ALTER COLUMN ... TYPE ... USING (...)`; đổi tên giá trị enum → `ALTER TYPE ... RENAME VALUE`; bỏ giá trị enum mà còn bảng khác dùng type đó → xoá cột/đổi kiểu bảng đó trước rồi mới `DROP TYPE`.
  - Trước `migrate deploy`, xem `migrate status`: deploy áp **mọi** migration đang chờ (kể cả của người khác) — nếu DB đang lệch nhiều migration, báo người dùng trước. Khi DB đang lệch, sinh SQL bằng `migrate diff --from-schema <bản schema trước khi sửa> --to-schema prisma/schema` để file chỉ chứa đúng thay đổi của mình.
  - Không tạo bảng/cột/giá trị enum bằng `db push`: mọi đối tượng DB phải có migration, nếu không DB dựng lại từ lịch sử sẽ hỏng (đã gặp với `blog_posts`, `article_comments`, `historical_entity_relations` — lý do phải gộp baseline). Tham chiếu bảng user dùng đúng tên `"authUser"`.
- **Cấu trúc feature frontend & cân bằng kích thước file**: feature mới trong `frontend/src/features/<tên>/` dùng khuôn `components/`, `hooks/`, `services/`, `types/`, `constants/` (thêm `views/` nếu có màn hình cấp trang). Tên thư mục kebab-case, file component PascalCase. Không tách file nhỏ (<80 dòng) chỉ dùng ở 1 nơi thành file riêng; ưu tiên gom các sub-components/constants/types nội bộ theo màn hình (~150–450 dòng/file) và chỉ tách riêng khi tái sử dụng hoặc là điểm mở rộng (Strategy/Plugin/Facade).

## Chung

- Một hàm làm một việc. Ưu tiên early return thay vì lồng `if` nhiều tầng.
- Không để code chết hoặc code bị comment lại trong commit.
- Secret và URL môi trường đọc từ `.env`, không hardcode.
- Commit theo conventional commits như repo đang dùng (`feat(scope):`, `fix(scope):`), mỗi commit một mục đích.
