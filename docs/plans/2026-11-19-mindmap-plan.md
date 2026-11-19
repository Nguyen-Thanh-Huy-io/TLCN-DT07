# Kế hoạch triển khai: Sơ đồ tư duy Lịch sử (HISGO Mindmap — Freeform Canvas)

Ngày lập: 2026-11-19 · Tham chiếu thiết kế: Stitch screen `f210daa1a58c4aada87bb2a8f8a2f89f` (*Sơ đồ Tư duy Lịch sử - Canvas Tri thức*)

## 1. Nguyên tắc thiết kế
1. **Linh hoạt & thoải mái (Freeform Canvas + Auto-arrange)**:
   - Lưu dạng đồ thị (`nodes` có toạ độ `x, y` + `edges` có `label` tuỳ chọn) thay vì cây cứng nhắc — người học tự do **kéo thả từng node**, **kéo nền để di chuyển canvas**, **phóng to/thu nhỏ**, hoặc bấm **Tự sắp xếp** để hệ thống căn lại gọn gàng.
2. **Không sửa bảng DB cũ & không cài thêm thư viện nặng**:
   - Chỉ tạo mới 1 bảng độc lập `study_mindmaps` (`backend/prisma/schema/mindmap.prisma`).
   - Dựng canvas bằng HTML/Tailwind + đường nối SVG Bezier thuần (không cần `@xyflow/react`), giữ trọn bảng màu HISGO (`--primary #7A1F24`, `--gold #B8893F`, `--bg-page #F5EEDC`).
3. **Kết nối dữ liệu HISGO + AI**:
   - Nút **Gắn tư liệu HISGO**: tìm bài viết đã xuất bản (`/public/articles`) để tạo node mới hoặc đính kèm vào node đang chọn.
   - Nút **✨ Tạo bằng AI**: phân tích ghi chú & bài viết đã lưu (`GEMINI_API_KEY` hoặc Heuristic fallback) để dựng sẵn sơ đồ nhiều nhánh.

---

## 2. Cấu trúc dữ liệu & Database (`study_mindmaps`)

```prisma
model StudyMindmap {
  id          String   @id @default(uuid())
  ownerId     String   @map("owner_id")
  title       String   @db.VarChar(150)
  periodLabel String?  @map("period_label") @db.VarChar(80)
  /// { nodes: MindmapNode[], edges: MindmapEdge[] }
  graph       Json     @db.JsonB
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([ownerId, updatedAt])
  @@map("study_mindmaps")
}
```

### Quy ước Graph (`nodes` + `edges`)
- **`MindmapNode`**:
  - `id`: chuỗi duy nhất
  - `x`, `y`: toạ độ trên canvas
  - `title`: tên thực thể / sự kiện / khái niệm
  - `badge?`: nhãn nhỏ phía trên (vd: *Gốc*, *Bối cảnh*, *1019 – 1105*)
  - `note?`: tóm tắt ngắn
  - `color`: `CRIMSON | GOLD | TEAL | INDIGO | STONE`
  - `articleRef?`: `{ id, slug, title }` (liên kết trực tiếp tới `/bai-viet/[slug]`)
- **`MindmapEdge`**:
  - `id`, `fromId`, `toId`, `label?` (nhãn quan hệ trên đường nối, vd: *"chỉ huy"*, *"dẫn tới"*)

---

## 3. Kiến trúc Backend (`backend/src/mindmap/`)
1. **CRUD (`MindmapController` + `MindmapService`, `AuthGuard`)**:
   - `GET /mindmaps`: danh sách sơ đồ (kèm `nodeCount`, `edgeCount`)
   - `GET /mindmaps/:id`: chi tiết sơ đồ
   - `POST /mindmaps`: tạo mới (mẫu *Khung phân tích sự kiện 4 nhánh* hoặc *Trống*)
   - `PATCH /mindmaps/:id`: lưu `title`, `periodLabel`, `graph` (tự động lưu debounced từ client)
   - `DELETE /mindmaps/:id`: xoá sơ đồ
2. **AI Generator (`MindmapAiService` — Strategy Pattern)**:
   - `POST /mindmaps/generate-preview`: nhận `{ articleIds?, includeNotes? }`, trả về `{ title, periodLabel, graph, engine }` (Gemini Flash nếu có key, hoặc Heuristic tự tách đề mục bài viết + ghi chú thành các node & edge đã dàn toạ độ sẵn).

---

## 4. Kiến trúc Frontend (`frontend/src/features/mindmap/` + tab `Sơ đồ tư duy` ở `/tai-khoan`)
1. **Thanh công cụ Canvas nổi** (lấy cảm hứng từ Stitch):
   - `+ Thêm Node` (thêm node tự do hoặc nối từ node đang chọn)
   - `Tạo liên kết` (bấm node nguồn → bấm node đích để nối dây)
   - `Tư liệu HISGO` (tìm nhanh bài viết để chèn node có link)
   - `Tự sắp xếp` · `Căn giữa` · `Zoom -/+` · `In / Xuất PDF`
   - Trạng thái `"Đã lưu"` tự động.
2. **Canvas tương tác (`MindmapCanvas.tsx`)**:
   - Nền giấy dó có lưới chấm nhẹ (tắt/bật được).
   - Kéo thả từng node tự do cập nhật toạ độ tức thì; double-click để sửa nhanh tiêu đề; kéo nền để pan canvas.
   - Đường nối SVG Bezier tự bám theo tâm/cạnh node + hiển thị nhãn quan hệ ở giữa đường nối.
3. **Bảng thuộc tính Node bên phải (`MindmapNodeInspector.tsx`)**:
   - Chỉnh `title`, `badge` (niên đại/vai trò), `color` (5 phối màu thẻ), `note` (khảo luận tóm tắt), gắn/mở `articleRef`, hoặc xoá node / xoá liên kết.

---

## 5. Lộ trình thực hiện
1. **Bước 1**: Sequence Diagram (`docs/mindmap-sequence.md`) + tạo bảng `study_mindmaps` (`mindmap.prisma` + SQL).
2. **Bước 2**: Backend `MindmapModule` (CRUD + `MindmapAiService` + Jest unit tests).
3. **Bước 3**: Frontend `MindmapCanvas` (drag node, pan/zoom, SVG Bezier edges, auto-arrange, node inspector, AI modal) + tích hợp tab **Sơ đồ tư duy** vào `/tai-khoan`.
4. **Bước 4**: Kiểm tra `eslint`, `tsc --noEmit`, `jest` và test trực tiếp trên trình duyệt.
