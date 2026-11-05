# Tham chiếu Block Builder — Schema & Cách soạn đa dạng

Tài liệu này phục vụ 2 việc: (1) tra cứu chính xác field của từng loại khối khi soạn
`contentBlocks` (entity) hoặc `Lesson.content` bằng tay hoặc bằng công cụ hỗ trợ/LLM; (2)
tránh lặp lại 1 khuôn bố cục duy nhất cho mọi thực thể — vấn đề đã phát hiện thực tế trong
dữ liệu hiện có (xem mục "Hiện trạng" bên dưới).

## 1. Hiện trạng: nội dung đang quá đơn điệu

So khớp trình tự khối thật của 8 thực thể trong DB (2026-11-05):

```
nha-ly       (DYNASTY) : QUOTE → TEXT → CALLOUT → COMPARISON_TABLE → TIMELINE → MAP → IMAGE → CALLOUT
nha-tran     (DYNASTY) : QUOTE → HEADING → TEXT → HEADING → TABLE → HEADING → TEXT → TIMELINE → HEADING → TEXT → CALLOUT
tran-thu-do  (PERSON)  : QUOTE → HEADING → TEXT → HEADING → TEXT
tran-hung-dao(PERSON)  : QUOTE → HEADING → TEXT → HEADING → TABLE → HEADING → TEXT
hoi-nghi...  (EVENT)   : QUOTE → HEADING → TEXT
chu-van-an   (PERSON)  : HEADING → TEXT → HEADING → TEXT
den-tran...  (LOCATION): HEADING → TEXT
```

5/8 thực thể trên — bất kể là DYNASTY, PERSON hay EVENT — đều rơi đúng vào công thức
**QUOTE mở đầu → (HEADING → TEXT) lặp lại → đôi khi thêm TABLE/CALLOUT ở cuối**. Đây là dấu
hiệu nội dung được sinh hàng loạt theo 1 khuôn cứng (cùng nguồn với bug `CALLOUT.text` đã sửa
trước đó), không phân biệt loại thực thể hay mục đích tường thuật.

Ngược lại, 2 nơi soạn tay kỹ (`seed-sample-dynasty-ly.ts`, `story-bach-dang-938.seed.ts`) dùng
tới 10+ loại khối khác nhau, bố cục thay đổi theo nội dung thật (xem Mẫu 1 và Mẫu 3 bên dưới).
Mục tiêu: mọi thực thể mới nên được soạn theo tinh thần đó, không theo công thức 1-size-fits-all.

## 2. Field chính xác của từng loại khối

### Văn bản & cấu trúc
| Type | Field | Ghi chú |
|---|---|---|
| `TEXT` | `content` (HTML) | Chứa `<h2>/<h3>` nội bộ sẽ tự vào Mục lục |
| `HEADING` | `text`, `level` (1-6) | Dùng khi muốn 1 tiêu đề đứng riêng |
| `DIVIDER` | — | Chỉ cần `id`/`type` |

### Trích dẫn & nhấn mạnh
| Type | Field | Ghi chú |
|---|---|---|
| `QUOTE` | `quoteText`, `author`, `sourceContext` | Không phải `quote`/`source` |
| `CALLOUT` | `variant`, `title`, `content` | Không phải `tone`/`text`. `variant` ∈ `HISTORICAL_NOTE`\|`INFO`\|`WARNING`\|`SUCCESS` |

### Thẻ nổi bật đứng riêng trong mạch văn
| Type | Field | Ghi chú |
|---|---|---|
| `CHARACTER` | `name`, `years`, `summary`, *tùy chọn* `role`, `avatarUrl`, `entityId`, `detailContent` | |
| `EVENT` | `title`, `timeLocation`, `summary`, *tùy chọn* `thumbnailUrl`, `detailContent` | 1 thẻ sự kiện đơn lẻ, khác `RELATED_EVENTS` (danh sách) |

### Trực quan
| Type | Field | Ghi chú |
|---|---|---|
| `IMAGE` | `src`, `alt`, `caption` | |
| `VIDEO` | `src`, `sourceType`, *tùy chọn* `caption` | `src` phải là URL nhúng được (YouTube embed...) |
| `MAP` | `locationName`, `description` | Khối trích dẫn tĩnh có icon 🗺️, không phải bản đồ tương tác |

### Dữ liệu có cấu trúc
| Type | Field | Ghi chú |
|---|---|---|
| `COMPARISON_TABLE` | `title`, `colAName`, `colBName`, `rows[]` (`{criteria,colA,colB}`) — **hoặc** `data:{headers[],rows[][]}` | Cả 2 dạng được hỗ trợ sẵn |
| `TIMELINE` | `title`, `subtitle`, `nodes[]`, *tùy chọn* `sourceMode`('MANUAL'\|'AUTO'\|'HYBRID') + `filterConfig`/`displayConfig` | AUTO/HYBRID chỉ hoạt động ở trang `/thuc-the` (dựa vào statements), chưa ở Lesson |

### Liên kết tự động từ Đồ thị tri thức
| Type | Field | Ghi chú |
|---|---|---|
| `RELATED_PEOPLE` | `title`, `people[]`, `sourceMode`('AUTO'\|'MANUAL') | AUTO lấy statement có `relatedEntityType==='PERSON'` |
| `RELATED_EVENTS` | `title`, `events[]`, `sourceMode` | AUTO lấy statement có `relatedEntityType==='EVENT'` |

### Tương tác & tham khảo
| Type | Field | Ghi chú |
|---|---|---|
| `QUIZ` | `question`, `options[]` (`{id,text,isCorrect}`), *tùy chọn* `explanation` | |
| `RESOURCE_LINK` | `title`, `url`, *tùy chọn* `note` | Tách khỏi mạch văn, luôn hiện cuối trang |

### Bố cục composite (đệ quy, chứa khối con)
| Type | Field | Ghi chú |
|---|---|---|
| `SECTION_ROW` | `columnCount`, `columns[]` (`{id,widthPercent,blocks[]}`) | Chia 2-3 cột song song |
| `STORY_CHAPTER` | `storyTitle`, `subjectType`, `chapters[]` (`{id,order,title,subtitle,config,blocks[]}`) | Story → Chapters → Blocks, cho bài tường thuật nhiều chương |

## 3. Mẫu bố cục đa dạng (chọn theo loại nội dung, không ép 1 khuôn)

### Mẫu A — Tổng quan triều đại / tổ chức (DYNASTY, ORGANIZATION)
Trọng tâm: dữ kiện định lượng (ai, bao lâu, bao nhiêu đời vua) + 1 khoảnh khắc cảm xúc mở đầu.
```
QUOTE (lời tuyên bố/chiếu chỉ nổi tiếng mở đầu thời đại)
→ TEXT (bối cảnh thành lập)
→ CALLOUT (1 cột mốc đặc biệt, vd đổi quốc hiệu)
→ COMPARISON_TABLE (niên biểu các đời vua)
→ TIMELINE (các mốc son xuyên suốt triều đại)
→ MAP (kinh đô / địa bàn)
→ IMAGE (bản đồ cương vực)
→ CALLOUT (nhận định của sử gia, khép lại)
```
*Ví dụ thật:* `nha-ly` trong `seed-sample-dynasty-ly.ts`.

### Mẫu B — Tiểu sử nhân vật (PERSON)
Trọng tâm: con người, không phải niên biểu khô khan — nên **tránh lặp HEADING→TEXT đơn điệu**
như hiện trạng. Thử cấu trúc thiên về đối chiếu/mạng lưới quan hệ:
```
QUOTE (câu nói để đời của chính nhân vật)
→ TEXT (xuất thân, bước ngoặt sự nghiệp)
→ SECTION_ROW 2 cột: CHARACTER (nhân vật này) | CHARACTER (đối thủ/đồng minh chính)
→ CALLOUT (1 giai thoại hoặc đánh giá hậu thế)
→ RELATED_EVENTS (sourceMode: AUTO — tự kéo sự kiện nhân vật tham gia qua statements)
→ RELATED_PEOPLE (sourceMode: AUTO — tự kéo người liên quan)
```
Khác hẳn mẫu A: không cần TIMELINE/COMPARISON_TABLE vì 1 đời người không cần niên biểu nhiều
dòng; dùng RELATED_* thay vì liệt kê tay để tận dụng đồ thị tri thức đã có statement.

### Mẫu C — Tường thuật sự kiện/chiến dịch dài (EVENT trọng đại)
Trọng tâm: kịch tính, diễn biến theo thời gian, nhiều nhân vật đối đầu.
```
TEXT (dẫn nhập ngắn, 1 đoạn "lead")
→ STORY_CHAPTER (3-5 chương: bối cảnh → diễn biến → cao trào → kết quả), mỗi chương tự do
  trộn TEXT/IMAGE theo zone LEFT/RIGHT/FULL
→ DIVIDER
→ TIMELINE (toàn bộ hành trình, sourceMode: MANUAL vì cần chọn lọc đúng các mốc dẫn tới sự kiện)
→ SECTION_ROW 2 cột: CHARACTER (chủ tướng ta) | CHARACTER (chủ tướng địch)
→ RELATED_PEOPLE (sourceMode: MANUAL, liệt kê đầy đủ nhân vật tâm điểm)
→ CALLOUT (bài học lịch sử, variant khác callout mở đầu để không trùng tông)
→ RESOURCE_LINK ×2 (sử liệu + di tích liên quan)
```
*Ví dụ thật:* `story-bach-dang-938.seed.ts` — khối phong phú nhất trong dự án, 1000+ dòng,
không lặp lại 1 loại khối 2 lần liên tiếp.

### Mẫu D — Di tích / địa danh (LOCATION)
Trọng tâm: không gian vật lý, hiện trạng bảo tồn — nên mở bằng hình ảnh/bản đồ, không phải chữ.
```
IMAGE (toàn cảnh di tích)
→ MAP (vị trí, cách di chuyển)
→ TEXT (lịch sử hình thành, giá trị khảo cổ)
→ COMPARISON_TABLE (nếu có nhiều đợt trùng tu/khai quật: dùng dạng data.headers/rows để liệt kê)
→ RELATED_EVENTS (sourceMode: AUTO — sự kiện lịch sử gắn với địa danh)
```

### Mẫu E — Bảo vật / cổ vật (ARTIFACT)
Trọng tâm: mô tả vật thể + bối cảnh phát hiện/chế tác, thường ngắn, không cần nhiều khối.
```
IMAGE (ảnh hiện vật)
→ TEXT (mô tả chất liệu, kích thước, niên đại)
→ QUOTE (nếu có ghi chép cổ nhắc tới hiện vật)
→ RELATED_EVENTS (sourceMode: AUTO)
```

## 4. Nguyên tắc chọn mẫu (để không soạn lặp)

1. **Mở đầu khác nhau theo loại**: DYNASTY/PERSON mở bằng QUOTE (có lời để trích); LOCATION/ARTIFACT
   mở bằng IMAGE/MAP (có hiện vật để nhìn); EVENT dài mở bằng TEXT dẫn nhập ngắn rồi vào STORY_CHAPTER.
2. **Không dùng TIMELINE cho mọi thứ** — chỉ khi thực sự có ≥4 mốc thời gian trải dài (phù hợp
   DYNASTY, EVENT dài); 1 nhân vật/di tích đơn lẻ nên dùng RELATED_EVENTS (AUTO) thay vì tự liệt kê.
3. **Ưu tiên AUTO/HYBRID cho RELATED_PEOPLE/RELATED_EVENTS** khi statement đã có sẵn trong Đồ thị
   tri thức — đỡ phải nhập tay và tự động cập nhật khi đồ thị thay đổi; chỉ dùng MANUAL khi cần
   chọn lọc thủ công (như Mẫu C, nơi thứ tự kể chuyện quan trọng hơn danh sách đầy đủ).
4. **2 CALLOUT trong cùng 1 thực thể nên khác `variant`** (vd mở đầu dùng `HISTORICAL_NOTE`, kết
   luận dùng `SUCCESS`/`WARNING`) để không trông như lặp lại cùng 1 khối.
5. **SECTION_ROW 2 cột là cách rẻ nhất để tạo đối lập** (ta/địch, trước/sau, nhân vật A/B) — dùng
   bất cứ khi nào nội dung có 2 chủ thể cần so sánh trực quan, thay vì viết thành đoạn văn.

## 5. Ghi chú vận hành

- `contentBlocks`/`Lesson.content` lưu nguyên mảng JSON các khối ở trên vào cột JSONB — không có
  ràng buộc schema ở tầng DB/Prisma, nên **mọi field sai tên sẽ bị âm thầm bỏ qua lúc render**,
  không có lỗi nào báo ra. Nếu soạn bằng script hoặc LLM, bắt buộc so khớp đúng tên field ở mục 2
  trước khi ghi DB (không có validate tự động nào chặn hiện tại).
- Nguồn tổng hợp: đọc trực tiếp cả 18 file `frontend/src/features/lessons/plugins/*.plugin.ts`
  (không suy đoán) + đối chiếu dữ liệu thật trong `historical_entities.content_blocks`,
  2026-11-05.
