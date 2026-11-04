# Kế hoạch: Hoàn thiện tính năng Di tích (HeritageExplorer / `/di-tich`)

> Trạng thái: **ĐỀ XUẤT — chưa code**. Khảo sát toàn bộ `src/features/heritage/*` (frontend) đối chiếu với backend hiện có (`HistoricalSite`, `HistoricalEntityMedia`, `HistoricalStatement`, taxonomy, public-content).

## 0. Xác minh thực tế qua DB (query trực tiếp Postgres `tlcn_db`)

```
historical_entities type=LOCATION   16 dòng
historical_sites                    16 dòng (khớp — mọi LOCATION đều có sub-row Site)
sites có latitude+longitude đủ cả 2   0 dòng  ⚠️
historical_entity_media             0 dòng   ⚠️
entities có content_blocks khác NULL  0 dòng  (đúng — tính năng vừa làm xong trong phiên này, chưa ai nhập)
taxonomy_groups thật                 8 nhóm — KHÔNG có "EVENT_CATEGORY" riêng, đã gộp vào EVENT_TYPE
```

**2 điều chỉnh quan trọng so với bản nháp trước (lúc đó chỉ đọc code, chưa query DB):**

1. **Mục 2 (Bản đồ) và mục 6 (Thư viện ảnh) đúng là không cần sửa backend** — nhưng **dữ liệu thật đang rỗng hoàn toàn** (0/16 di tích có toạ độ, 0 dòng media). Code đã sẵn sàng nhận dữ liệu, nhưng **trước khi làm bản đồ/thư viện ảnh có nghĩa, cần biên tập viên nhập toạ độ + ảnh cho ít nhất vài di tích tiêu biểu trước** — nếu không, 2 tính năng này build xong vẫn hiện trống, trông như lỗi. Nên thêm bước "nhập dữ liệu mẫu" vào Đợt 1, không chỉ code.
2. **Mục 4 (Biên niên sử) sửa lại tham chiếu taxonomy**: bản nháp trước viết "seed theo đúng mẫu `EVENT_CATEGORY`" — nhưng `EVENT_CATEGORY` **không tồn tại trong DB thật**, đã gộp vào `EVENT_TYPE` (xác nhận: `EVENT_TYPE` hiện có 15+ term thật như WAR/BATTLE/TREATY/REFORM...). Taxonomy mới `CONSTRUCTION_ACTION` nên seed theo đúng mẫu **`EVENT_TYPE`** (nhóm thật đang tồn tại), không phải `EVENT_CATEGORY`.

## 1. Phát hiện quan trọng nhất

`HeritageDetailSheet.tsx` có 4 tab, nhưng khảo sát `heritage.adapter.ts` cho thấy **2 tab luôn rỗng vĩnh viễn** vì UI đã dựng sẵn mà chưa từng có nguồn dữ liệu, và **1 chỗ có bug thật** (đọc field không tồn tại). Danh sách đầy đủ, xếp theo độ ưu tiên (rẻ/ít rủi ro → đắt hơn):

| # | Việc | File liên quan | Backend cần gì |
|---|---|---|---|
| 5 | Sửa bug "Đối chiếu Xưa–Nay" luôn trống | `heritage.adapter.ts:149` đọc `h.thenAndNow` — field **không tồn tại** trên `HistoricalHeritage`/object nguồn, luôn `undefined` | Không cần bảng mới — dùng `HistoricalEntityMedia` đã có, quy ước tag |
| 6 | Thư viện ảnh chỉ có 1 ảnh lặp lại | `heritage.adapter.ts:107` chỉ dùng `site.imageUrl`, bỏ qua `detail.media` | **Không cần gì cả** — backend đã trả `media: PublicLocationMediaDto[]` đầy đủ trong `PublicLocationDetailDto` (`landing-content.facade.ts:220`), chỉ là frontend chưa dùng |
| 1 | Bài viết chi tiết (Block Builder) chưa có tab hiển thị | `HeritageDetailSheet.tsx` (thêm tab mới) | Thêm field `contentBlocks` vào `PublicLocationSummaryDto`/Detail (model đã có cột, DTO chưa expose) |
| 2 | Bản đồ — dữ liệu có, frontend Heritage chưa nối | `heritage.types.ts`, `heritage.adapter.ts` | Không cần gì — `latitude`/`longitude` đã có trong `PublicLocationSummaryDto` |
| 3 | Hạng mục kiến trúc/hiện vật con (`subStructures`) | `heritage.adapter.ts:109` gán cứng `[]` | Thêm predicate `PART_OF` + query lấy entity con |
| 4 | Biên niên sử xây dựng/trùng tu (`constructionTimeline`) | `heritage.adapter.ts:108` gán cứng `[]` | Thêm taxonomy `CONSTRUCTION_ACTION` + lọc Event theo đó |
| 7 | Trích dẫn Tư liệu | — | Phụ thuộc `reference-entity-plan.md`, chưa làm |

## 2. Khảo sát chi tiết & thiết kế từng mục

### Mục 5 — Sửa bug Đối chiếu Xưa–Nay

**Hiện trạng:** `HistoricalHeritage.thenAndNowComparison` có kiểu `{ ancientImageUrl, ancientLabel, modernImageUrl, modernLabel } | undefined` (`heritage.types.ts:48-53`), nhưng dòng gán duy nhất (`heritage.adapter.ts:149`) viết `thenAndNowComparison: h.thenAndNow ?? undefined` — `h` không có thuộc tính `thenAndNow` nào cả (không khai báo ở đâu trong file). Đây là lỗi gõ nhầm tên field còn sót lại từ 1 lần refactor trước, **không phải thiếu dữ liệu nguồn**.

**Thiết kế:** dùng `HistoricalEntityMedia` đã có (generic, không bảng mới). Thêm 1 cột nhỏ phân loại ảnh:
```prisma
// historicalEntity.prisma — HistoricalEntityMedia
model HistoricalEntityMedia {
  ...
  /// Gắn nhãn hiển thị đặc biệt (vd. "ancient_photo"/"modern_photo" cho đối chiếu Xưa-Nay).
  /// Null = ảnh thường, hiện trong thư viện ảnh mặc định.
  displayTag String? @map("display_tag") @db.VarChar(50)
}
```
CMS: `LessonMediaManager`/media step hiện tại cho Di tích thêm 1 dropdown tuỳ chọn "Gắn nhãn hiển thị" (Ảnh xưa / Ảnh nay / Không gắn) khi `type === LOCATION`.
Public: `toLocationDetail()` lọc `media.find(m => m.displayTag === 'ancient_photo')` / `'modern_photo'`, build `thenAndNowComparison` nếu có đủ cả 2.

### Mục 6 — Nối thư viện ảnh thật (KHÔNG cần việc backend)

`PublicLocationDetailDto.media` đã đầy đủ. Chỉ cần sửa `heritage.adapter.ts`:
```ts
galleryImages: detail.media
  .filter((m) => m.type === 'IMAGE' && m.displayTag == null)  // loại ảnh đã dùng riêng cho Xưa-Nay
  .map((m) => ({ url: m.url, caption: m.caption ?? '' })),
```
(phụ thuộc mục 5 nếu muốn loại ảnh gắn tag ra khỏi gallery chung — làm cùng lúc cho gọn.)

### Mục 1 — Lộ `contentBlocks` cho Location qua Public API

`HistoricalEntity.contentBlocks` đã là cột chung (migration đã chạy thật — xem `migrations/20261103170000_add_entity_content_blocks`), CMS Location đã ghi được qua `EntityEditor` generic. **Chỉ thiếu bước expose public**, y hệt việc đã làm cho Event/Figure trước đó:

```ts
// public-content.dto.ts — PublicLocationDetailDto
@ApiPropertyOptional({ nullable: true })
contentBlocks?: unknown;
```
```ts
// public-content.mapper.ts — trong hàm build location detail (nơi hiện map `historicalSignificance`, `managingAgency`...)
contentBlocks: (entity as { contentBlocks?: unknown }).contentBlocks ?? null,
```
Frontend: thêm tab "Bài viết chi tiết" trong `HeritageDetailSheet.tsx` (thêm `HeritageTab.ARTICLE` vào enum), render bằng đúng `normalizeContentToBlocks` + `buildLessonTocAndHtml` đã dùng cho `/nhan-vat`, `/su-kien`.

### Mục 2 — Bản đồ (đã thống nhất ở lần trao đổi trước, tóm tắt lại)

Không cần việc backend (`latitude`/`longitude` đã có trong `PublicLocationSummaryDto` dòng 109-110). Việc: nối 2 field này vào `HistoricalHeritage`/`toHeritageSummaries()`, thêm `HeritageMapView.tsx` (Leaflet + OSM), nút chuyển Lưới/Bản đồ cạnh bộ lọc trong `HeritageExplorer.tsx`.

### Mục 3 — Hạng mục kiến trúc/hiện vật con (`subStructures`)

**Thiết kế: không tạo bảng mới** — 1 hạng mục con (vd. "Tháp Bút" trong quần thể Đền Ngọc Sơn) là 1 `HistoricalEntity` bình thường (type `LOCATION` hoặc `ARTIFACT` tuỳ hạng mục), nối với di tích cha qua 1 `HistoricalStatement` với predicate mới `PART_OF`.

**Backend cần thêm:**
1. Seed predicate mới vào nhóm `PREDICATE` (`taxonomy-v1.seed.ts`, cạnh `LOCATED_AT` dòng 290):
   ```ts
   { code: 'PART_OF', label: 'Là bộ phận của', inverseLabel: 'Có hạng mục con' },
   ```
2. `getLocationBySlug()` (`landing-content.facade.ts:210`) thêm 1 query lấy hạng mục con:
   ```ts
   const subStructures = await this.prisma.historicalEntity.findMany({
     where: {
       status: PUBLIC_CONTENT_STATUS,
       subjectStatements: { some: { predicate: { code: 'PART_OF' }, objectId: entity.id } },
     },
     orderBy: { displayOrder: 'asc' },
   });
   ```
3. DTO mới:
   ```ts
   export class PublicSubStructureDto {
     id: string; slug: string; name: string;
     type: string;          // HistoricalEntityType gốc (LOCATION | ARTIFACT)
     periodLabel: string | null;
     description: string | null;
     imageUrl: string | null;
   }
   // PublicLocationDetailDto thêm:
   @ApiProperty({ type: [PublicSubStructureDto] }) subStructures: PublicSubStructureDto[];
   ```

**Endpoint:** không có endpoint mới — field này nằm trong `GET /public/locations/:slug` đã có, chỉ mở rộng response.

**CMS:** biên tập viên tạo hạng mục con như tạo 1 Địa danh/Hiện vật bình thường (`/entities/create?type=LOCATION`), rồi ở Mục 3 "Quan hệ & Bối cảnh" của hạng mục đó, gắn quan hệ `PART_OF` trỏ tới di tích cha — **dùng đúng UI quan hệ đã có, không cần màn hình mới**.

### Mục 4 — Biên niên sử xây dựng/trùng tu (`constructionTimeline`)

**Thiết kế: không tạo bảng mới** — mỗi mốc (Khởi dựng/Mở rộng/Tàn phá/Trùng tu) là 1 `HistoricalEvent` (type `EVENT`) đã gắn `OCCURRED_AT` tới di tích — cơ chế này **đã chạy thật** (xem `landing-content.facade.ts:229-241`, đang dùng để lấy "Sự kiện liên quan" ở tab 4). Chỉ cần phân loại được sự kiện nào là "sự kiện xây dựng/trùng tu" để lọc riêng cho tab Biên niên sử, tránh lẫn với sự kiện lịch sử thường (chiến tranh, hội nghị...).

**Backend cần thêm:**
1. Taxonomy nhóm mới `CONSTRUCTION_ACTION` (seed theo đúng mẫu `EVENT_TYPE` — nhóm thật đang tồn tại trong DB, xem mục 0; `EVENT_CATEGORY` đã gộp vào đây từ trước, không seed riêng nữa):
   ```ts
   { code: 'CONSTRUCTION_ACTION', label: 'Hành động xây dựng/trùng tu', hierarchical: false, displayOrder: <tiếp theo> }
   ```
   Terms: `FOUNDED` (Khởi dựng), `EXPANDED` (Mở rộng), `DAMAGED` (Biến cố/Tàn phá), `RESTORED` (Trùng tu/Bảo tồn) — **trùng khớp luôn với `ConstructionActionType` frontend đã định nghĩa sẵn** (`heritage.types.ts:18`), không cần đổi tên gì ở UI.
2. Gắn nhóm này vào `HistoricalEvent.categoryIds` đã có sẵn (`historicalEvent.prisma:13`, kiểu `String[]`) — sự kiện xây dựng chỉ cần thêm code `CONSTRUCTION_ACTION:FOUNDED` (hoặc tách riêng 1 cột `constructionActionCode` nếu muốn tách bạch khỏi `EVENT_CATEGORY` — **cần quyết định**, xem mục 3).
3. `getLocationBySlug()` lọc trong danh sách `events` đã lấy được (dòng 229-241): sự kiện nào có gắn `CONSTRUCTION_ACTION` → đưa vào `constructionTimeline`, có `dateLabel` (từ `event.eventDateNote`/`startYear`), `dynasty` (từ `period`), `actionType`, `description`.
4. DTO: tái dùng gần như nguyên `PublicEventSummaryDto` đã có, chỉ thêm field `actionType: string` khi trả trong mảng `constructionTimeline`.

**Endpoint:** vẫn nằm trong `GET /public/locations/:slug`, không có route mới.

**CMS:** biên tập viên tạo 1 Sự kiện bình thường (`/entities/create`, type=EVENT), gắn `OCCURRED_AT` tới di tích (**đã làm được, không cần sửa gì**), chỉ cần thêm 1 field chọn "Hành động xây dựng" (hiện tại ẩn vì chỉ hợp khi sự kiện đó thuộc loại trùng tu) — **cần quyết định đặt field này ở đâu trong form Event** (mục 3 câu hỏi mở).

## 2.9 Đợt 1 — Kế hoạch backend chi tiết, sẵn sàng code (đào sâu theo yêu cầu)

Đã đọc lại chính xác đoạn code sẽ sửa (`landing-content.facade.ts`, hàm `getLocationBySlug`, dòng 270-315) — đây là nơi **duy nhất** cần sửa backend cho cả mục 1 và mục 5, vì mục 2 + mục 6 không cần backend (đã xác nhận ở mục 0).

### A. Migration — thêm cột `display_tag` (phục vụ mục 5: Đối chiếu Xưa–Nay)

```prisma
// historicalEntity.prisma — model HistoricalEntityMedia
model HistoricalEntityMedia {
  id           String    @id @default(uuid())
  entityId     String    @map("entity_id")
  type         MediaType @default(IMAGE)
  url          String    @db.VarChar(500)
  caption      String?   @db.VarChar(255)
  displayOrder Int       @default(0) @map("display_order")
  /// Gắn nhãn hiển thị đặc biệt — hiện chỉ dùng "ANCIENT_PHOTO"/"MODERN_PHOTO" cho khối Đối chiếu
  /// Xưa-Nay ở trang Di tích. Null = ảnh thường, vào thư viện ảnh mặc định.
  displayTag   String?   @map("display_tag") @db.VarChar(50)   // MỚI
  createdAt    DateTime  @default(now()) @map("created_at")
  entity HistoricalEntity @relation(fields: [entityId], references: [id], onDelete: Cascade)
  @@index([entityId])
  @@index([displayOrder])
  @@map("historical_entity_media")
}
```
Quy trình migration (đúng chuẩn đã dùng cho `content_blocks` — xem `hisgo-migrations` — thêm cột đơn giản, `migrate diff` tự lo được, không cần viết tay):
```bash
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema \
  --script -o prisma/migrations/<timestamp>_add_media_display_tag/migration.sql
# review file sinh ra — chỉ nên là 1 dòng ALTER TABLE ... ADD COLUMN "display_tag" VARCHAR(50);
npx prisma migrate deploy
npx prisma generate
```
Đây là migration **an toàn tuyệt đối** (thêm cột nullable, không đụng dữ liệu cũ) — không cần backup đặc biệt như migration của `reference-entity-plan.md`.

### B. DTO — thêm 2 field vào `public-content.dto.ts`

```ts
// PublicLocationMediaDto — thêm field mới
export class PublicLocationMediaDto {
  @ApiProperty() id: string;
  @ApiProperty({ example: 'IMAGE' }) type: string;
  @ApiProperty() url: string;
  @ApiPropertyOptional({ nullable: true }) caption: string | null;
  @ApiPropertyOptional({ nullable: true }) displayTag?: string | null;   // MỚI — "ANCIENT_PHOTO" | "MODERN_PHOTO" | null
}

// PublicLocationDetailDto — thêm 1 field (mục 1, contentBlocks đã có sẵn trên model, chỉ chưa expose)
export class PublicLocationDetailDto extends PublicLocationSummaryDto {
  ... // giữ nguyên các field cũ
  @ApiPropertyOptional({ nullable: true })
  contentBlocks?: unknown;   // MỚI
}
```

### C. Facade — sửa đúng 3 chỗ trong `getLocationBySlug()` (`landing-content.facade.ts:293-314`)

```ts
const site = entity.historicalSite;
return {
  ...summary,
  tagline: entity.tagline,
  description: entity.description,
  contentBlocks: (entity as { contentBlocks?: unknown }).contentBlocks ?? null,  // MỚI — dòng thêm
  imageCaption: entity.imageCaption,
  constructionYear: site?.constructionYear ?? null,
  preservationStatus: site?.preservationStatus ?? null,
  managingAgency: site?.managingAgency ?? null,
  period: entity.period ? PublicContentMapper.toPeriod(entity.period) : null,
  media: entity.media.map((m) => ({
    id: m.id,
    type: m.type,
    url: m.url,
    caption: m.caption,
    displayTag: (m as { displayTag?: string | null }).displayTag ?? null,   // MỚI — dòng sửa
  })),
  events: events.map((e) => PublicContentMapper.toEventSummary(e)),
  figures: [...figures.values()],
  nearby,
  heritage: toHeritageProfile(entity.metadata),
};
```
Không cần sửa include Prisma — `media` đã được include sẵn ở dòng 220 (`media: { orderBy: { displayOrder: 'asc' } }`), cột mới tự động có mặt trong object `m` sau khi `prisma generate` lại.

### D. CMS — field chọn `displayTag` khi upload ảnh cho Location

`LessonMediaManager` (component tái dùng cho media của mọi loại `HistoricalEntity`, kể cả LOCATION) hiện không có khái niệm "gắn nhãn hiển thị". Cần thêm 1 dropdown tuỳ chọn (mặc định "Không gắn") chỉ hiện khi đang sửa entity type=LOCATION — đây là phần **frontend**, nằm ngoài phạm vi "backend trước" đang tập trung, ghi chú lại để làm ở bước sau khi quay lại frontend.

### E. Việc KHÔNG đổi — để tránh nhầm khi code
- Không đụng `entity-query.builder.ts` (file đó phục vụ CMS admin, không phải public) — mục 1/5 chỉ ảnh hưởng tầng Public API.
- Không đụng `PublicLocationSummaryDto` (danh sách rút gọn) — `contentBlocks` chỉ cần ở Detail, danh sách không cần nội dung đầy đủ.

## 3. Câu hỏi cần chốt trước khi code

1. **Mục 4**: `CONSTRUCTION_ACTION` nên là `categoryIds` dùng chung với `EVENT_CATEGORY` (1 sự kiện vừa gắn "Trùng tu" vừa gắn category khác nếu cần), hay tách cột riêng `constructionActionCode` trên `HistoricalEvent`? Dùng chung category thì không cần sửa schema `HistoricalEvent`, nhưng lẫn 2 khái niệm khác nhau (loại sự kiện vs hành động xây dựng) vào 1 mảng.
2. **Mục 5**: tên/giá trị `displayTag` (`ancient_photo`/`modern_photo`) có ổn không, hay muốn dùng taxonomy thay vì enum string cứng (nhất quán hơn nhưng nặng hơn cho việc chỉ có 2 giá trị cố định)?
3. **Mục 3**: hạng mục con dùng `PART_OF` 1 chiều di tích cha ← con — có cần giới hạn số cấp lồng (hạng mục con của hạng mục con) không, hay để tự nhiên theo đồ thị (không giới hạn)?
4. **Thứ tự thực hiện**: làm hết 5+6+1+2 (toàn bộ không cần schema mới) thành 1 đợt trước, rồi mới sang 3+4 (cần thêm taxonomy/migration) ở đợt sau — đồng ý theo thứ tự này không?

## 4. Thứ tự thực thi đề xuất

**Đợt 1 (không cần migration mới, chỉ wiring + 1 cột nhỏ cho mục 5):**
1. Mục 6 — nối `galleryImages` thật (thuần frontend).
2. Mục 1 — expose `contentBlocks` qua DTO/mapper + thêm tab (backend: 2 dòng; frontend: 1 tab mới).
3. Mục 2 — bản đồ (thuần frontend + cài `leaflet`/`react-leaflet`).
4. Mục 5 — thêm cột `displayTag` lên `HistoricalEntityMedia` (1 migration nhỏ, thêm cột nullable) + sửa bug đọc field sai tên.

**Đợt 2 (cần taxonomy mới + thay đổi lớn hơn ở CMS):**
5. Mục 3 — predicate `PART_OF` + query hạng mục con + DTO.
6. Mục 4 — taxonomy `CONSTRUCTION_ACTION` + lọc event + DTO.

**Đợt 3 (phụ thuộc tính năng khác):**
7. Mục 7 — trích dẫn Tư liệu, sau khi `reference-entity-plan.md` hoàn thành.

---
*Tài liệu này chỉ là kế hoạch kỹ thuật — chưa có dòng code nào được sửa. Cần chốt mục 3 trước khi bắt đầu Đợt 2.*
