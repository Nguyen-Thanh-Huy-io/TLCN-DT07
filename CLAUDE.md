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
- Một component quá khoảng 200–300 dòng thì tách nhỏ.
- **Mô hình phân rã Component lớn theo chuẩn SOLID (SRP / Facade)**:
  - Khi phân rã các component phức tạp (>500–1000 dòng), phân chia thành 4 thành phần chuyên trách:
    1. **Custom Hook / Facade** (ví dụ `usePostComments.ts`, `useCommunityProfile.ts`): quản lý toàn bộ state, socket realtime, API handlers, tính toán chỉ số thống kê & bộ lọc.
    2. **Types, Helpers & Static Data** (ví dụ `*.types.ts`, `*.util.ts`, `*.data.ts`): tách dữ liệu mẫu/mock và helper biến đổi dữ liệu ra khỏi file UI.
    3. **Sub-components chuyên biệt** (Single Responsibility Principle): mỗi khối giao diện (header/KPI, toolbar/filter, list item, composer) là 1 file component riêng biệt, có interface props rõ ràng.
    4. **Component điều phối (Orchestrator)**: chỉ kết nối hook facade với các sub-components, duy trì độ dài dưới 150–250 dòng.
    5. **Bảo toàn khả năng tương thích ngược (Backward Compatibility)**: Re-export các types, helpers mà các file khác đang import từ component gốc.
- **Mô hình Khảo thí Sư phạm & Quan hệ Quiz — Topic**:
  - Đề thi / Bộ đề khảo thí `Quiz` liên kết trực tiếp với Chủ đề lịch sử (`Topic`) theo quan hệ Many-to-Many (`Quiz.topics Topic[]`), cho phép một đề thi kiểm tra kiến thức tổng hợp của nhiều chủ đề hoặc một chuyên đề độc lập. Tuyệt đối không gắn cứng phụ thuộc `Quiz` vào `Lesson` (vì Lesson đã có các khối Practice Question / Interactive Blocks tương tác trực tiếp tại chỗ).
- **Kiểm soát Độ phức tạp Nhận thức (Cognitive Complexity $\le$ 15)**:
  - Khi một hàm hoặc component có nhiều nhánh rẽ (if/else, switch, map, filter), bắt buộc phải phân rã thành các hàm pure helper chuyên biệt bên ngoài component hoặc tách các sub-components con để giữ Cognitive Complexity luôn $\le 15$ theo chuẩn SonarJS.

## Quy ước riêng của dự án

- **Kiểm tra trước khi coi là xong**: chạy `npm run lint` và test liên quan (`npm run test` ở backend) trong phía vừa sửa. Thay đổi lớn thì chạy thêm `npm run audit` (lint + jscpd + knip). Không thêm warning ESLint mới. Khi đứng ở thư mục gốc của monorepo, có thể chạy nhanh ESLint/TypeScript trên đúng danh sách file vừa sửa bằng `node backend/node_modules/eslint/bin/eslint.js -c backend/eslint.config.mjs <files...>` và `node backend/node_modules/typescript/bin/tsc -p backend/tsconfig.build.json --noEmit` (tương tự cho `frontend`).
- **Một HTTP client ở frontend**: code mới gọi API qua axios instance trong `frontend/src/services/api.ts`, không viết wrapper `fetch` riêng. Base URL của API chỉ khai báo một chỗ tại `frontend/src/constants/api-url.ts` (`API_BASE_URL`, `INTERNAL_API_BASE_URL`, `resolveBackendAssetUrl`) rồi import, không lặp lại fallback `'http://localhost:5000'` hay `'http://127.0.0.1:5000'` trong từng file. Ngoại lệ: route handler trong `src/app/api/` và lời gọi tới API bên ngoài (Wikipedia, Wikimedia).
- **Biến môi trường backend**: đọc qua `backend/src/common/config/app.config.ts` hoặc `ConfigService`, không gọi `process.env` trực tiếp trong controller/service. Thêm biến mới thì cập nhật luôn `backend/.env.example`.
- **Response và DTO**:
  - Không tự bọc response (`{ data, message }`...) vì `TransformInterceptor` đã bọc, lỗi do `AllExceptionsFilter` xử lý.
  - Mọi field của DTO phải có decorator `class-validator`, vì `ValidationPipe` bật `whitelist` + `forbidNonWhitelisted` + `transform: true` nên field thiếu decorator sẽ bị từ chối.
  - **Không gắn đồng thời `@Type(() => Date)` và `@IsString()` trên cùng một trường DTO**: vì `class-transformer` chạy trước `class-validator`, chuỗi ngày sẽ bị ép thành đối tượng `Date` khiến `@IsString()` luôn báo lỗi `400 Bad Request`. Hãy dùng `@IsDateString()` (hoặc `@Type(() => Date)` đi kèm `@IsDate()`).
- **Xác thực danh tính, phân quyền và quy tắc duyệt 2 người**:
  - **Không bao giờ tin `authorId` / `userId` / `creatorId` gửi từ Request Body hoặc Query**: mọi endpoint thay đổi dữ liệu gắn với người dùng phải dùng `@UseGuards(AuthGuard)` (hoặc `@RequireRoles` / `@ContentWrite`) và lấy danh tính từ `req.user.userId` (`AuthenticatedRequest` trong `common/access/roles.guard.ts`).
  - Khi kiểm tra quyền sở hữu tài nguyên trong service (ví dụ chỉ tác giả hoặc STAFF được sửa/xoá bài viết, bình luận), nếu không đủ quyền phải ném `ForbiddenException` (HTTP 403), **không** dùng `BadRequestException` (HTTP 400).
  - Với các thực thể áp dụng quy tắc 2 người duyệt (`Lesson`, `Article` — người duyệt phải khác người tạo `CANNOT_REVIEW_OWN`), hàm `create()` bắt buộc phải lưu `createdBy: creatorUserId || null` vào DB.
- **Tránh phụ thuộc vòng (`forwardRef` 2 chiều) giữa các Module NestJS**:
  - Khi hai module nghiệp vụ cùng cần phát sự kiện qua một WebSocket Gateway hoặc gọi service hạ tầng chung (ví dụ `BlogModule` và `ModerationModule` cùng dùng `BlogGateway`), phải tách Gateway/hạ tầng đó ra module riêng (`BlogGatewayModule`) để import một chiều, không dùng `forwardRef` hai chiều.
- **Chống XSS khi render HTML ở Frontend (`dangerouslySetInnerHTML`)**:
  - Dữ liệu văn bản thuần (như `post.excerpt`, tiêu đề, tên tác giả, chú thích) nếu ghép vào chuỗi HTML bắt buộc phải bọc qua `escapeHtml()`.
  - Nội dung Rich HTML (TipTap / Block Builder / câu dẫn Quiz `q.prompt`) trước khi đưa vào `dangerouslySetInnerHTML` bắt buộc phải lọc qua `sanitizeRichHtml()` tại `frontend/src/utils/sanitize-html.ts`.
- **Quy tắc React 19 / React Compiler & Hooks**:
  - **Tránh Temporal Dead Zone trong Component ("Cannot access variable before it is declared")**: mọi hàm trợ giúp hoặc callback được gọi bên trong `useEffect` phải được khai báo trước `useEffect` (hoặc bọc `useCallback` / dùng function declaration có hoisting).
  - **Không đọc hoặc ghi Ref trực tiếp trong Render Phase ("Cannot access refs during render")**: việc gán `ref.current = ...` hoặc đọc `ref.current` chỉ được thực hiện trong `useEffect` hoặc trong event handler, tuyệt đối không gán trần trong thân hàm component.
  - **Khớp Dependency với React Compiler**: khi callback/memo truy cập thuộc tính con lồng nhau của object (như `sessionUser.username`), dependency array cần liệt kê object tham chiếu (`sessionUser`), tránh chỉ liệt kê `sessionUser?.id` dẫn tới cảnh báo `Compilation Skipped: Existing memoization could not be preserved`.
- **Biểu thức chính quy (Regex) & Cú pháp sạch**:
  - Trong biểu thức chính quy (Regex), ký tự gạch chéo `/` khi nằm bên trong lớp ký tự `[...]` không cần thoát ký tự `\/` (dùng `[/.-]` thay vì `[\/.-]`) để tránh vi phạm ESLint rule `no-useless-escape`.
- **Phân định ranh giới Domain Model trong Prisma Schema (DDD & Bounded Context)**:
  - Mỗi domain nghiệp vụ (Article, Blog/Community, Discussion, Note) phải sở hữu schema model và bảng riêng trong database. Tuyệt đối không tái sử dụng bảng của domain này (ví dụ `article_comments`) để chứa dữ liệu cho domain khác (`blog_posts`) bằng cách gán chéo ID, gây nợ kỹ thuật, phá vỡ ràng buộc khóa ngoại (Foreign Key) và buộc frontend phải duy trì mock data dự phòng.
- **Prisma**:
  - Import client và type từ `@prisma/client` (do `backend/prisma/schema/base.prisma` dùng `provider = "prisma-client-js"` không cấu hình custom `output`, toàn bộ 45 file backend đều dùng `@prisma/client`; không import từ `generated/prisma/client`).
  - Đổi schema theo quy trình: sửa `prisma/schema/*.prisma` → tạo thư mục `prisma/migrations/<timestamp>_<tên>/` → `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema --script -o <thư mục>/migration.sql` → đọc lại SQL → `npx prisma migrate deploy`.
  - Không dùng `prisma migrate dev` (shadow DB không replay được lịch sử migration) và không sửa DB bằng `db execute` tay.
  - Sau khi deploy, `npx prisma migrate status` phải sạch và `migrate diff` phải ra rỗng. Kiểm tra dữ liệu bị ảnh hưởng trước khi xoá bảng/cột.
- **Cấu trúc feature frontend**: feature mới trong `frontend/src/features/<tên>/` dùng khuôn `components/`, `hooks/`, `services/`, `types/`, `constants/` (thêm `views/` nếu có màn hình cấp trang). Tên thư mục kebab-case, file component PascalCase. Feature cũ đang theo khuôn khác (`facades/`, `strategies/`, file phẳng) thì giữ nguyên, không tự chuyển đổi nếu task không yêu cầu.

## Chung

- Một hàm làm một việc. Ưu tiên early return thay vì lồng `if` nhiều tầng.
- Không để code chết hoặc code bị comment lại trong commit.
- Secret và URL môi trường đọc từ `.env`, không hardcode.
- Commit theo conventional commits như repo đang dùng (`feat(scope):`, `fix(scope):`), mỗi commit một mục đích.
