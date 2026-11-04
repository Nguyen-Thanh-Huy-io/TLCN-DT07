# Kế hoạch: Đưa Tư liệu lịch sử (HistoricalReference) vào làm 1 loại HistoricalEntity

> Trạng thái: **ĐỀ XUẤT — chưa code**. Tài liệu này là kết quả khảo sát toàn bộ backend + schema liên quan, dùng để lên kế hoạch kỹ thuật chi tiết trước khi động tay.

## 1. Bối cảnh & quyết định đã chốt

- HISGO có menu công khai "TƯ LIỆU" phân theo **chủ đề** (Quân sự / Tác phẩm / Bang giao...) — khác hẳn 2 trục học thuật đã có (`SOURCE_FORMAT`, `SOURCE_NATURE`).
- "Tư liệu" phải là **nội dung đọc được** (toàn văn, không chỉ siêu dữ liệu trích dẫn) — có trang công khai riêng, có trạng thái Nháp/Xuất bản.
- Quyết định kiến trúc đã chốt với người dùng: **không giữ `HistoricalReference` là bảng độc lập** — chuyển thành bảng con 1-1 của `HistoricalEntity` (type mới `REFERENCE`), đúng mẫu `Person`/`HistoricalSite`/`HistoricalEvent` đã có. Lý do: `HistoricalEntity` đã có sẵn đúng 4 trường mà "tư liệu đọc được" cần (`slug`, `contentBlocks`, `description`, `status`) — giữ bảng riêng nghĩa là chép lại y hệt.
- Việc gắn trích dẫn theo từng Statement cụ thể (Lớp 2) **để sau** — kế hoạch này chỉ làm Lớp 1 (thư viện đọc được + vẫn giữ được khả năng trích dẫn như cũ, không phá vỡ).

## 1.5. Xác minh thực tế qua DB (query trực tiếp Postgres `tlcn_db`, không chỉ đọc code)

```
historical_references            9 dòng (dữ liệu thật từ seed, vd. "Đại Việt sử ký toàn thư")
historical_statement_references  22 dòng (đã nối thật vào Statement)
historical_entities              89 dòng · persons 28 · historical_events 26 · historical_sites 16
historical_statements            92 dòng
taxonomy_groups                  ĐÚNG 8 nhóm: EVENT_TYPE, PERIOD_TYPE, SITE_TYPE, PREDICATE,
                                  ROLE_TYPE, SOURCE_FORMAT, SOURCE_NATURE, REGION
```
⇒ Xác nhận lại mục 2.2: migration **chắc chắn phải chuyển dữ liệu thật** (9 + 22 dòng), không phải thao tác trên bảng rỗng — mục 4 (migration tay) là bắt buộc, không thể bỏ qua hay làm tắt bằng `migrate dev` thông thường.
⇒ **Chỉ 8 taxonomy_groups tồn tại thật trong DB** — các key "nhóm cũ phục vụ backward-compatibility" trong `TAXONOMY_GROUPS` constant (`PRESERVATION`, `HERITAGE_RANK`, `EVENT_CATEGORY`, `ENTITY_RELATION`, `EVENT_RELATION`, `FIGURE_ROLE`) **không có hàng nào trong `taxonomy_groups` thật** — đã gộp vào 8 nhóm chuẩn (vd. `FIGURE_ROLE`/`EVENT_ROLE` gộp vào `ROLE_TYPE`, xác nhận qua comment trong `taxonomy.constant.ts`: *"EVENT_ROLE đã gộp vào ROLE_TYPE (2026-11-03)"*). Khi thêm `REFERENCE_TOPIC` ở mục 3.4/5, đây sẽ là **nhóm thứ 9** thật sự mới trong DB, không trùng lặp với nhóm cũ nào.

## 2. Khảo sát hiện trạng (những gì đã có, đọc trực tiếp từ code)

### 2.1 Mẫu "bảng con 1-1 của HistoricalEntity" (3 ví dụ đã có)

`backend/prisma/schema/historicalEntity.prisma`:
```prisma
model HistoricalEntity {
  id, periodId, name, slug, type, tagline, description, aliases,
  imageUrl, imageCaption, metadata, contentBlocks,
  isFeatured, displayOrder, dateText, startYear..endDay, datePrecision,
  status, createdAt, updatedAt
  person HistoricalSite? HistoricalEvent?   // 1-1 optional, chọn theo `type`
}
```
- `Person` (`person.prisma`), `HistoricalSite` (`historicalSite.prisma`), `HistoricalEvent` (`historicalEvent.prisma`) đều theo mẫu: `entityId String @id` làm PK kiêm FK, `entity HistoricalEntity @relation(..., onDelete: Cascade)`, chỉ chứa field **thật sự đặc thù** của loại đó.
- `HistoricalEntityType` enum (`enums.prisma`): `PERSON | ORGANIZATION | DYNASTY | MILITARY_FORCE | ARTIFACT | LOCATION | EVENT | OTHER` — cần thêm `REFERENCE`.

### 2.2 `HistoricalReference` hiện tại (`reference.prisma`)
```prisma
model HistoricalReference {
  id, title, author, publisher, publishYear, url, isbn, doi, metadata,
  formatTermId, natureTermId,   // FK -> TaxonomyTerm (SOURCE_FORMAT / SOURCE_NATURE)
  statementReferences HistoricalStatementReference[]
}
model HistoricalStatementReference {
  id, statementId, referenceId, pageNumber, chapter, quote, note
}
```
- **Đã có dữ liệu thật**, không phải bảng trống: `prisma/seeds/pilot-v1.seed.ts` có hàm `upsertReference()` (dòng 444) tạo các `HistoricalReference` thật (vd. "Đại Việt sử ký toàn thư") và nối vào `HistoricalStatementReference` qua `referenceIdByCode` (dòng 419, 442, 472). ⇒ **Migration phải giữ dữ liệu, không thể chỉ drop/create.**
- `TaxonomyTerm` có 2 quan hệ ngược trỏ vào bảng này: `referencesByFormat`, `referencesByNature` (`taxonomy.prisma` dòng 67-68).

### 2.3 Mẫu Delegate xử lý sub-entity (`SiteEntityDelegate` làm ví dụ mẫu)
File `backend/src/historical-entity/delegates/site-entity.delegate.ts` — mẫu chuẩn gồm:
- `shouldCreateXxx(dto, entityType): boolean` — quyết định có tạo sub-row hay không.
- `buildCreatePayload(dto): Prisma.XxxCreateWithoutEntityInput`.
- `buildUpsertPayload(dto, existingRaw): { hasXxxUpdates, payload? }` — xử lý `undefined` (không đổi) vs giá trị thật (đổi) đúng ngữ nghĩa PATCH từng phần.
- (Site có thêm `syncSiteTerms()` để quy đổi cột chữ cũ `siteType` sang `siteTypeId` — **Reference KHÔNG cần bước này** vì `formatTermId`/`natureTermId` đã là FK thật từ đầu, không có cột chữ tự do song song cần đồng bộ.)

### 2.4 Nơi Delegate được gọi (`historical-entity.service.ts`)
```
dòng 96-97   constructor(personDelegate, siteDelegate)
dòng 161-167 const xCreatePayload = delegate.should...() ? delegate.buildCreatePayload(dto) : undefined
dòng 211-212 prisma.historicalEntity.create({ data: { ...(xCreatePayload ? { x: { create: xCreatePayload } } : {}) } })
dòng 216-217 if (siteCreatePayload) await siteDelegate.syncSiteTerms(created.id)   // Reference bỏ qua bước này
dòng 339-344 update(): tương tự qua buildUpsertPayload()
dòng 432-433 prisma.historicalEntity.update({ data: { ...(xUpsert ? { x: xUpsert } : {}) } })
```
⇒ Thêm `ReferenceEntityDelegate` là chèn thêm đúng các dòng tương ứng, không đổi cấu trúc hàm.

### 2.5 Wiring Module (`historical-entity.module.ts`)
Khai báo provider + export — thêm `ReferenceEntityDelegate` vào `providers`/`exports` theo đúng cách `SiteEntityDelegate` đã khai báo.

### 2.6 Include khi đọc chi tiết (`entity-query.builder.ts` dòng 182-207)
```ts
static getDetailInclude(): Prisma.HistoricalEntityInclude {
  return {
    person: true,
    historicalSite: { include: { siteTypeTerm: true, preservation: true, rank: true } },
    media: { orderBy: { displayOrder: 'asc' } },
    event: true,
    subjectStatements: { include: { predicate: true, object: {...}, references: { include: { reference: true } } } },
    ...
  };
}
```
- Thêm `reference: { include: { formatTerm: true, natureTerm: true, topicTerm: true } }`.
- **Chú ý riêng:** `subjectStatements....references.include.reference` ở dòng 201-205 hiện trỏ tới bảng `HistoricalReference` cũ qua `HistoricalStatementReference.reference`. Sau khi đổi `HistoricalStatementReference.referenceId` sang trỏ `HistoricalEntity.id`, quan hệ Prisma ở đây đổi tên thuộc tính (`reference` → trỏ `HistoricalEntity`), cần sửa include + mọi chỗ code đọc `.reference.title` (đổi thành `.reference.name` vì `title` không còn, `HistoricalEntity.name` đóng vai trò đó).

### 2.7 Taxonomy: cách thêm 1 nhóm danh mục mới (mẫu `SOURCE_FORMAT`/`SOURCE_NATURE`)
`backend/prisma/seeds/taxonomy-v1.seed.ts`:
- Khai báo nhóm trong mảng groups (dòng ~63-76): `{ code, label, description, hierarchical, displayOrder }`.
- Khai báo danh sách term riêng (dòng 474-494): `SOURCE_FORMATS`, `SOURCE_NATURES` — mảng `{ code, label }` hoặc thêm `aliases`/`parentId` nếu cần.
- `TAXONOMY_GROUPS` const (`taxonomy.constant.ts` dòng 2-21) phải khai báo thêm key mới để code tham chiếu an toàn (không hard-code string).
⇒ Thêm nhóm `REFERENCE_TOPIC` (hoặc tên khác thống nhất) theo đúng 3 bước này, seed terms: Quân sự, Tác phẩm, Bang giao, Chiếu chỉ, Ngoại giao... (danh sách cụ thể cần người dùng duyệt trước khi seed).

### 2.8 Lớp công khai (Public API) — mẫu Location đã có đủ 3 tầng
`public-content.mapper.ts` → `toLocationSummary()` (dòng 325) + hàm detail tương ứng
`landing-content.facade.ts` → `getLocations()` (188), `getLocationBySlug()` (210)
`public-content.controller.ts` → route `GET /public/locations`, `GET /public/locations/:slug`
⇒ Nhân bản chính xác 3 tầng này cho Reference: `toReferenceSummary/Detail`, `getReferences()/getReferenceBySlug()`, route `GET /public/references`, `GET /public/references/:slug` (hoặc đặt tên route là `/public/tu-lieu` nếu muốn khớp URL tiếng Việt — cần quyết định quy ước đặt tên route, xem mục 5).

## 2.9 Ghi chú BA bổ sung (sau trao đổi với người dùng)

**a) `REFERENCE_TOPIC` là lựa chọn biên tập, không phải quy tắc tự động.**
Giống hệt cách `EVENT_CATEGORY` hoạt động hiện nay (biên tập viên tự chọn 1 nhãn phù hợp nhất khi tạo Sự kiện, không có thuật toán suy luận) — mỗi Tư liệu chỉ chọn **1 Chủ đề duy nhất** (`topicTermId`, không phải mảng) tại thời điểm biên tập. Một văn bản như "Hịch tướng sĩ" vừa mang tính quân sự vừa mang tính văn chương — việc xếp vào "Quân sự" hay "Tác phẩm" là quyết định của biên tập viên theo nội dung chính, không cần thiết kế rule cứng. Hệ quả kỹ thuật: `topicTermId` validate như 1 FK đơn (không multiValued), không cần UI multi-select cho trường này.

**b) Liên kết `Person.profile.notableWorks` ↔ `Reference` — việc có định hướng, làm SAU Lớp 1 MVP.**
Hiện `notableWorks` (vd. "Hịch tướng sĩ", "Binh thư yếu lược") là mảng chuỗi chữ thuần trong `metadata.profile` của `Person` (xem `FigureProfileFields.tsx`), không trỏ đi đâu cả. Khi các tác phẩm này đã tồn tại dưới dạng `HistoricalEntity` (type=`REFERENCE`) với trang đọc toàn văn riêng, bước tiếp theo hợp lý là đổi `notableWorks` từ `string[]` sang tham chiếu Tư liệu thật (hoặc giữ chuỗi làm fallback khi tác phẩm đó chưa được số hoá, y hệt cách `contentBlocks` đang fallback về `description` khi chưa soạn khối). **Không đưa vào phạm vi migration/code đợt này** — chỉ ghi nhận làm điểm nối tiếp theo đã có định hướng rõ, tránh làm 2 lần.

## 3. Thiết kế schema chi tiết (đề xuất, chưa migrate)

### 3.1 `enums.prisma`
```prisma
enum HistoricalEntityType {
  PERSON
  ORGANIZATION
  DYNASTY
  MILITARY_FORCE
  ARTIFACT
  LOCATION
  EVENT
  REFERENCE   // MỚI
  OTHER
}
```

### 3.2 `reference.prisma` — viết lại hoàn toàn
```prisma
model Reference {
  entityId     String   @id @map("entity_id")
  author       String?  @db.VarChar(255)
  publisher    String?  @db.VarChar(255)
  publishYear  Int?     @map("publish_year")
  url          String?  @db.VarChar(1000)   // liên kết online tới bản gốc (khác hẳn slug nội bộ của HISGO)
  isbn         String?  @db.VarChar(50)
  doi          String?  @db.VarChar(100)

  formatTermId String?  @map("format_term_id")
  natureTermId String?  @map("nature_term_id")
  topicTermId  String?  @map("topic_term_id")   // MỚI — trục Chủ đề (Quân sự/Tác phẩm/Bang giao...)

  entity     HistoricalEntity @relation(fields: [entityId], references: [id], onDelete: Cascade)
  formatTerm TaxonomyTerm?    @relation("ReferenceFormatTerm", fields: [formatTermId], references: [id], onDelete: SetNull)
  natureTerm TaxonomyTerm?    @relation("ReferenceNatureTerm", fields: [natureTermId], references: [id], onDelete: SetNull)
  topicTerm  TaxonomyTerm?    @relation("ReferenceTopicTerm", fields: [topicTermId], references: [id], onDelete: SetNull)

  @@index([formatTermId])
  @@index([natureTermId])
  @@index([topicTermId])
  @@map("references")
}

model HistoricalStatementReference {
  id          String   @id @default(uuid())
  statementId String   @map("statement_id")
  referenceId String   @map("reference_id")   // giờ trỏ HistoricalEntity.id (loại REFERENCE)
  pageNumber  String?  @map("page_number") @db.VarChar(50)
  chapter     String?  @db.VarChar(150)
  quote       String?  @db.Text
  note        String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")

  statement HistoricalStatement @relation(fields: [statementId], references: [id], onDelete: Cascade)
  reference HistoricalEntity    @relation("StatementReferenceEntity", fields: [referenceId], references: [id], onDelete: Cascade)

  @@unique([statementId, referenceId, pageNumber])
  @@index([statementId])
  @@index([referenceId])
  @@map("historical_statement_references")
}
```
Trường **bỏ** so với bản cũ: `title` (dùng `HistoricalEntity.name`), `metadata` (dùng `HistoricalEntity.metadata` chung).

### 3.3 `historicalEntity.prisma` — thêm 1 dòng quan hệ
```prisma
model HistoricalEntity {
  ...
  reference Reference?
  statementReferences HistoricalStatementReference[] @relation("StatementReferenceEntity")
  ...
}
```

### 3.4 `taxonomy.prisma` — thêm quan hệ ngược mới
```prisma
referencesByTopic HistoricalReference[] @relation("ReferenceTopicTerm")  // đổi tên model -> Reference
```
(2 quan hệ `referencesByFormat`/`referencesByNature` giữ nguyên tên, chỉ đổi kiểu trỏ sang model `Reference` mới.)

## 4. Migration dữ liệu — PHẦN RỦI RO NHẤT, cần viết tay (không để `migrate diff` tự lo)

`migrate diff` chỉ sinh đúng DDL (tạo bảng/cột/xoá bảng cũ) — **không tự chuyển dữ liệu giữa 2 bảng khác cấu trúc**. Thứ tự bắt buộc trong 1 migration viết tay (idempotent, theo đúng quy ước đã ghi trong memory `hisgo-migrations`):

1. `ALTER TYPE "HistoricalEntityType" ADD VALUE IF NOT EXISTS 'REFERENCE';`
   ⚠️ Lưu ý đã rút kinh nghiệm trong dự án: `ALTER TYPE ... ADD VALUE` chạy **autocommit từng câu**, không nằm trong transaction cùng các câu sau — phải tách thành bước riêng, không gộp chung 1 statement block với phần INSERT bên dưới nếu driver yêu cầu (kiểm tra lại khi viết migration thật, Prisma thường tự tách sẵn).
2. Tạo bảng `references` mới (DDL từ 3.2).
3. **INSERT dữ liệu**: với mỗi dòng trong `historical_references` cũ:
   - Tạo 1 dòng `historical_entities` mới: `name = title`, `slug = slugify(title)` (đụng hàm sinh slug đã có ở `SlugService`, phải đảm bảo unique — cộng hậu tố nếu trùng), `type = 'REFERENCE'`, `status = 'PUBLISHED'` (hoặc `DRAFT` — **cần quyết định**, xem mục 6), `metadata = historical_references.metadata` cũ.
   - Tạo 1 dòng `references` mới với `entity_id` vừa tạo, copy `author/publisher/publish_year/url/isbn/doi/format_term_id/nature_term_id`.
   - Giữ bảng ánh xạ tạm `old_reference_id -> new_entity_id` (có thể làm bằng CTE/temp table trong chính file SQL, hoặc cột `metadata.legacyReferenceId` tạm trên dòng mới rồi dọn sau).
4. `UPDATE historical_statement_references SET reference_id = <entity_id mới tương ứng>` theo bảng ánh xạ ở bước 3.
5. Đổi FK `historical_statement_references.reference_id` sang trỏ `historical_entities.id`.
6. Xoá bảng `historical_references` cũ.
7. Seed nhóm taxonomy `REFERENCE_TOPIC` (chạy qua seed script, không phải trong file migration.sql).

**Đây là migration có mất-dữ-liệu-nếu-sai** (chuyển bảng, không phải thêm cột) — bắt buộc sao lưu `pg_dump` trước khi chạy (đúng quy trình đã có trong memory `hisgo-migrations`, bước 1).

## 5. Thay đổi code backend (danh sách file, theo đúng mẫu đã khảo sát ở mục 2)

| File | Việc cần làm |
|---|---|
| `prisma/schema/enums.prisma` | Thêm `REFERENCE` vào `HistoricalEntityType` |
| `prisma/schema/reference.prisma` | Viết lại theo 3.2 |
| `prisma/schema/historicalEntity.prisma` | Thêm quan hệ `reference Reference?` (3.3) |
| `prisma/schema/taxonomy.prisma` | Đổi `referencesByFormat`/`referencesByNature` sang trỏ `Reference`, thêm `referencesByTopic` |
| `src/taxonomy/taxonomy.constant.ts` | Thêm `REFERENCE_TOPIC` vào `TAXONOMY_GROUPS` |
| `prisma/seeds/taxonomy-v1.seed.ts` | Thêm khai báo nhóm + mảng `REFERENCE_TOPICS` (danh sách chủ đề — cần chốt trước) |
| `src/historical-entity/delegates/reference-entity.delegate.ts` | **File mới** — theo mẫu `SiteEntityDelegate` (2.3), KHÔNG cần `syncXxxTerms()` |
| `src/historical-entity/historical-entity.module.ts` | Đăng ký `ReferenceEntityDelegate` |
| `src/historical-entity/historical-entity.service.ts` | Thêm nhánh gọi delegate (2.4) ở cả create + update |
| `src/historical-entity/dto/historical-entity.dto.ts` | Thêm field nhóm "Reference" vào `CreateHistoricalEntityDto`/`UpdateHistoricalEntityDto`/Response DTO (author/publisher/publishYear/url/isbn/doi/formatTermId/natureTermId/topicTermId) — theo đúng comment-nhóm-trường style đã có cho Person/Site |
| `src/historical-entity/builders/entity-query.builder.ts` | Thêm `reference: {...}` vào `getDetailInclude()`, map field vào response phẳng giống `biography`/`siteType` |
| `src/public-content/mappers/public-content.mapper.ts` | Thêm `toReferenceSummary()`/detail tương ứng |
| `src/public-content/dto/public-content.dto.ts` | Thêm `PublicReferenceSummaryDto`/`PublicReferenceDetailDto` |
| `src/public-content/landing-content.facade.ts` | Thêm `getReferences()`/`getReferenceBySlug()` |
| `src/public-content/public-content.controller.ts` | Thêm route `GET /public/references`, `GET /public/references/:slug` |
| Mọi nơi đọc `HistoricalStatementReference.reference.title` | Đổi sang `.reference.name` (do đổi FK target — cần `grep -rn "statementReference" src` để rà hết, chưa rà trong khảo sát này) |

## 6. Câu hỏi cần người dùng chốt trước khi viết migration thật

1. **Trạng thái xuất bản của các Reference đã seed sẵn** (Đại Việt sử ký toàn thư...) khi migrate: `PUBLISHED` luôn hay `DRAFT` để duyệt lại?
2. **Danh sách Chủ đề (`REFERENCE_TOPIC`) chính thức** — ảnh ví dụ có Quân sự/Tác phẩm/Bang giao, cần danh sách đầy đủ trước khi seed (không nên vừa code vừa đoán).
3. **Tên route public**: `/public/references` (khớp tên model tiếng Anh, nhất quán với `/public/locations`, `/public/events`) hay đặt tên tiếng Việt riêng? Và URL trang Next.js tương ứng: `/tu-lieu/[slug]` (đã thống nhất ở lần trao đổi trước) — route backend không nhất thiết phải trùng chữ với route frontend.
4. **Có cần field `url` (link online) hiển thị công khai không**, hay chỉ dùng nội bộ cho biên tập viên tra cứu?

## 7. Thứ tự thực thi đề xuất (sau khi mục 6 chốt xong)

1. Sửa 4 file schema (enum, reference, historicalEntity, taxonomy) theo mục 3.
2. Viết migration tay đầy đủ theo mục 4 (có backup DB trước).
3. `npx prisma generate`, chạy `npx prisma migrate deploy`, verify `migrate diff` ra rỗng.
4. Thêm `ReferenceEntityDelegate` + wiring (mục 5, các dòng backend thuần).
5. Mở rộng DTO + builder + mapper + facade + controller (mục 5, phần public).
6. `grep` toàn repo các chỗ đọc `.reference.title`/kiểu cũ, sửa hết.
7. Seed `REFERENCE_TOPIC` + cập nhật lại dữ liệu Reference cũ nếu cần gắn chủ đề.
8. Test: `npm run test` (đặc biệt các spec đụng Statement/Reference), kiểm tra `/docs` Swagger route mới.
9. (Lớp sau, không nằm trong phạm vi kế hoạch này) Frontend: CMS field nhóm Reference trong `EntityContentStep`/`EntityBasicInfoStep`, trang `/tu-lieu` + `/tu-lieu/[slug]`, menu "TƯ LIỆU".

## 8. Phác thảo kỹ thuật chi tiết — endpoint & data shape

### 8.1 Phía CMS (biên tập) — KHÔNG có endpoint mới

`HistoricalEntityController` (`@Controller('historical-entities')`) đã generic theo `type`, không có route riêng cho từng loại thực thể — Reference **tái dùng nguyên 100%** các route đã có:

| Method | Route | Dùng cho Reference như thế nào |
|---|---|---|
| `POST` | `/historical-entities` | Body `{ type: 'REFERENCE', name, ... , author, publisher, publishYear, url, isbn, doi, formatTermId, natureTermId, topicTermId, contentBlocks }` |
| `GET` | `/historical-entities?type=REFERENCE` | Danh sách Tư liệu trong CMS (query `type` đã hỗ trợ sẵn, xem `historical-entity.service.ts`) |
| `GET` | `/historical-entities/:id` | Chi tiết 1 Tư liệu — `entity-query.builder.ts` trả kèm `reference: {...}` sau khi thêm include |
| `PATCH` | `/historical-entities/:id` | Sửa — body chỉ gửi field muốn đổi (PATCH từng phần, đúng ngữ nghĩa `buildUpsertPayload`) |
| `DELETE` | `/historical-entities/:id` | Xoá — cascade xoá luôn dòng `references` (FK `onDelete: Cascade`) |

**Field mới thêm vào `CreateHistoricalEntityDto` / `UpdateHistoricalEntityDto`** (nhóm "Reference", đặt cạnh nhóm "HistoricalSite" đã có, theo đúng style comment hiện tại):
```ts
// ==========================================
// Nhóm trường cho Reference (Tư liệu lịch sử — Dành cho REFERENCE)
// ==========================================
@ApiPropertyOptional({ example: 'Ngô Sĩ Liên', description: 'Tác giả / chủ biên (Dành cho Reference)' })
@IsString() @IsOptional()
author?: string;

@ApiPropertyOptional({ example: 'NXB Khoa học Xã hội' })
@IsString() @IsOptional()
publisher?: string;

@ApiPropertyOptional({ example: 1993 })
@IsInt() @IsOptional()
publishYear?: number;

@ApiPropertyOptional({ example: 'https://...' })
@IsString() @IsOptional()
referenceUrl?: string;   // đặt tên khác `url` nếu HistoricalEntity sau này có url riêng, tránh đụng tên

@ApiPropertyOptional({ example: '978-604-0-12345-6' })
@IsString() @IsOptional()
isbn?: string;

@ApiPropertyOptional()
@IsString() @IsOptional()
doi?: string;

@ApiPropertyOptional({ description: 'FK TaxonomyTerm nhóm SOURCE_FORMAT' })
@IsUUID('4') @IsOptional()
formatTermId?: string;

@ApiPropertyOptional({ description: 'FK TaxonomyTerm nhóm SOURCE_NATURE' })
@IsUUID('4') @IsOptional()
natureTermId?: string;

@ApiPropertyOptional({ description: 'FK TaxonomyTerm nhóm REFERENCE_TOPIC — chọn đúng 1' })
@IsUUID('4') @IsOptional()
topicTermId?: string;
```
(`contentBlocks`, `description`, `slug`, `status`, `name`, `imageUrl` dùng thẳng field chung của `HistoricalEntity` đã có sẵn trong DTO — không khai báo lại.)

### 8.2 Phía Public — 2 endpoint mới

```
GET /public/references
GET /public/references/:slug
```
(theo đúng convention `/public/locations`, `/public/events` đã có — xem `public-content.constant.ts`)

**`PublicReferenceSummaryDto`** (dùng cho danh sách + thẻ preview):
```ts
export class PublicReferenceSummaryDto {
  id: string;
  slug: string;
  name: string;                 // = tên tư liệu
  summary: string | null;       // = description, tóm tắt ngắn
  imageUrl: string | null;
  author: string | null;
  publishYear: number | null;
  formatCode: string | null;    // code của formatTerm, vd. 'CHRONICLE'
  formatLabel: string | null;
  topicCode: string | null;     // code của topicTerm, vd. 'MILITARY'
  topicLabel: string | null;    // vd. 'Quân sự'
}
```

**`PublicReferenceDetailDto extends PublicReferenceSummaryDto`**:
```ts
export class PublicReferenceDetailDto extends PublicReferenceSummaryDto {
  publisher: string | null;
  url: string | null;
  isbn: string | null;
  doi: string | null;
  natureCode: string | null;
  natureLabel: string | null;
  contentBlocks: unknown;       // mảng khối Block Builder — frontend tự biên dịch HTML, giống Event/Person
  /** Các Nhân vật/Sự kiện mà tư liệu này đang được dùng làm nguồn chứng minh (Lớp 2, rỗng ở MVP) */
  citedBy: Array<{ entityId: string; slug: string; name: string; statementSummary: string }>;
}
```

**Ví dụ response `GET /public/references/hich-tuong-si`:**
```json
{
  "id": "e7c1...",
  "slug": "hich-tuong-si",
  "name": "Hịch tướng sĩ",
  "summary": "Bài hịch của Trần Hưng Đạo kêu gọi tướng sĩ đoàn kết chống quân Nguyên Mông.",
  "imageUrl": null,
  "author": "Trần Hưng Đạo",
  "publisher": null,
  "publishYear": 1285,
  "url": null,
  "isbn": null,
  "doi": null,
  "formatCode": "DECREE",
  "formatLabel": "Chiếu chỉ, sắc lệnh, văn kiện chính thức",
  "natureCode": "PRIMARY_SOURCE",
  "natureLabel": "Sử liệu gốc / Sơ cấp",
  "topicCode": "MILITARY",
  "topicLabel": "Quân sự",
  "contentBlocks": [
    { "id": "block_1", "type": "TEXT", "content": "<h2>Nguyên văn</h2><p>...</p>" }
  ],
  "citedBy": []
}
```

### 8.3 File cần sửa thêm so với mục 5 (do phác thảo DTO/route cụ thể hoá thêm)
- `src/public-content/public-content.constant.ts` — thêm `REFERENCES: 'references'`, `REFERENCE_DETAIL: 'references/:slug'` vào `PUBLIC_CONTENT_ROUTES`.
- `src/historical-entity/historical-entity.constant.ts` — rà xem có message lỗi nào cần thêm riêng cho Reference không (vd. validate year range không áp dụng — Reference không có khoảng năm tồn tại kiểu Person/Site).

---
*Tài liệu này chỉ là kế hoạch kỹ thuật — chưa có dòng code nào được sửa. Cần chốt mục 6 trước khi bắt đầu mục 7.*
