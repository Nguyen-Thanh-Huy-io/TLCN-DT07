# Workspace Rules — TLCN-DT07 (HISGO)

## 1. Chiến lược tìm & đọc file nhanh (BẮT BUỘC)
- **Không dò mò toàn repo:** Trước khi tìm code cho bất kỳ feature nào, đọc mục tương ứng trong `MAP_PROJECT.md` để lấy sẵn danh sách file FE ⇄ BE.
- **Cấm quét đệ quy chậm:** Tuyệt đối KHÔNG chạy `Get-ChildItem -Recurse`, `dir /s`, `Select-String` đệ quy trên toàn repo (dễ quét `node_modules/`, `.next/`, `dist/` gây treo 2–5 phút).
- **Dùng `git ls-files` và `git grep` (hoặc `rg` nếu có):** Luôn khoanh vùng thư mục cụ thể (`-- backend/src`, `-- frontend/src/features/<tên>`).
- **Gộp lệnh terminal:** Mỗi lần mở PowerShell trên máy này tốn ~15–25s khởi tạo, nên phải gộp toàn bộ truy vấn tìm file / `git grep` vào **1 lệnh duy nhất** thay vì chạy từng lệnh lẻ.
- **Đọc file song song:** Gọi nhiều thao tác đọc file cùng lúc trong 1 lượt (đọc trực tiếp chỉ mất ~1s/file), tránh đọc nhỏ giọt 1–2 file mỗi lượt.
- **Tránh đọc file log/audit khổng lồ nếu không được yêu cầu:** Không tự mở `AI_PROMPT_GENERATION_LOG.md` (~279 KB) hay `CODE_AUDIT.md` (~92 KB).

## 2. Chỉ mục quy chuẩn dự án (`CLAUDE.md`)
Chỉ đọc đúng phần liên quan tới tác vụ thay vì đọc tràn lan:
- Quy ước code chung & TypeScript: `CLAUDE.md` (dòng 19–43)
- Backend (NestJS, Prisma transaction, Gamification, Auth/Review, DTO): `CLAUDE.md` (dòng 44–54, 86–99)
- Frontend (Next.js, SOLID/Facade, giới hạn dòng, React 19, XSS, API client): `CLAUDE.md` (dòng 55–85, 100–112, 136)
- Domain model (Topic/Category/Tag/Quiz) & Prisma migration: `CLAUDE.md` (dòng 113–135)
