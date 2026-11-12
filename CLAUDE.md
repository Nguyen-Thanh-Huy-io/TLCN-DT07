# Project rules for Claude Code

## Tìm kiếm trong code — KHÔNG quét đệ quy thủ công

Máy Windows này không có sẵn `ripgrep` (rg) ở ngoài tool, nên lệnh PowerShell kiểu:

```
Get-ChildItem -Recurse | Select-String ...
```

sẽ vô tình quét vào `node_modules/`, `.next/`, `dist/`, `.git/` (hàng chục nghìn file), khiến CPU/disk nghẽn và mỗi lệnh chạy 2–5 phút.

**Quy tắc:**
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
- Một component quá khoảng 200–300 dòng thì tách nhỏ.

## Quy ước riêng của dự án

- **Kiểm tra trước khi coi là xong**: chạy `npm run lint` và test liên quan (`npm run test` ở backend) trong phía vừa sửa. Thay đổi lớn thì chạy thêm `npm run audit` (lint + jscpd + knip). Không thêm warning ESLint mới.
- **Một HTTP client ở frontend**: code mới gọi API qua axios instance trong `frontend/src/services/api.ts`, không viết wrapper `fetch` riêng. Base URL của API chỉ khai báo một chỗ rồi import, không lặp lại fallback `'http://localhost:5000'` trong từng file. Ngoại lệ: route handler trong `src/app/api/` và lời gọi tới API bên ngoài (Wikipedia, Wikimedia).
- **Biến môi trường backend**: đọc qua `backend/src/common/config/app.config.ts` hoặc `ConfigService`, không gọi `process.env` trực tiếp trong controller/service. Thêm biến mới thì cập nhật luôn `backend/.env.example`.
- **Response và DTO**: không tự bọc response (`{ data, message }`...) vì `TransformInterceptor` đã bọc, lỗi do `AllExceptionsFilter` xử lý. Mọi field của DTO phải có decorator class-validator, vì `ValidationPipe` bật `whitelist` + `forbidNonWhitelisted` nên field thiếu decorator sẽ bị từ chối.
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
