# Kiến Trúc Đồ Thị Tri Thức Lịch Sử (Knowledge Graph Relation Rules)

> **Mục tiêu**: Lưu trữ và quản lý danh mục quy tắc quan hệ (Ontology Ruleset) động, kết hợp giữa file JSON cấu hình, Database và Cache Backend. Tạm hoãn triển khai để ưu tiên hoàn thiện chuẩn chỉnh từng module đơn lẻ trước.

---

## 1. Cấu trúc Quy Tắc (Relation Rule Schema)

Mỗi quy tắc quan hệ có cấu trúc mẫu:

```json
{
  "code": "LEADER_OF",
  "category": "MILITARY_POLITICAL",
  "forwardLabel": "Lãnh đạo, chỉ huy",
  "reverseLabel": "Dưới sự lãnh đạo, chỉ huy của",
  "description": "Chỉ huy chiến dịch, trận đánh, hoặc đứng đầu lực lượng, tổ chức, triều đại",
  "allowedSources": ["PERSON"],
  "allowedTargets": ["EVENT", "FORCE", "ORGANIZATION", "DYNASTY"],
  "isSymmetric": false,
  "inverseCode": "LED_BY",
  "requireTimeRange": true,
  "example": "Trần Hưng Đạo lãnh đạo Kháng chiến chống Nguyên Mông (1285 - 1288)"
}
```

File cấu hình gốc đã tạo: [`backend/prisma/relation-rules.json`](../backend/prisma/relation-rules.json)

---

## 2. Kiến Trúc 3 Tầng Dài Hạn

### Tầng 1: Database (Prisma)
- Sử dụng chính `code` (String) làm `@id` (Khóa chính):
```prisma
model RelationRule {
  code              String   @id // "LEADER_OF", "OCCURRED_AT"...
  category          String   // "MILITARY_POLITICAL", "SPATIAL"...
  forwardLabel      String
  reverseLabel      String
  description       String?
  allowedSources    String[] // Postgres text[]
  allowedTargets    String[]
  isSymmetric       Boolean  @default(false)
  inverseCode       String?
  requireTimeRange  Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```
- Bảng liên kết (`HistoricalEntityRelation` / `EventEntity`) sẽ nối khóa ngoại trực tiếp vào `RelationRule.code`.

### Tầng 2: Backend & Caching
- File `relation-rules.json` được đọc trong `prisma/seed.ts` để `upsert` vào database.
- Cung cấp API `GET /relation-rules` có bọc Redis / In-memory Cache vì dữ liệu này tần suất đọc cao, ít thay đổi.

### Tầng 3: Frontend UI
- Dropdown quan hệ tự lọc theo `allowedSources` và `allowedTargets` của thực thể đang chỉnh sửa.
- Tự động hiển thị/ẩn ô nhập "Từ năm - Đến năm" dựa vào cờ `requireTimeRange`.
- Hiển thị nhãn ngữ cảnh 2 chiều tự nhiên (`forwardLabel` / `reverseLabel`).

---

## 3. Lộ Trình Triển Khai
1. **Giai đoạn hiện tại**: Hoàn thiện toàn diện CRUD và dữ liệu cơ bản cho từng module độc lập (Thời kỳ, Sự kiện, Nhân vật, Địa danh, Bài học, Chủ đề).
2. **Giai đoạn tiếp theo**: Kích hoạt bảng `RelationRule`, nạp `relation-rules.json` và nâng cấp mạng lưới liên kết tri thức.
