# Sequence Diagram: Hợp nhất `STORY_CHAPTER` vào Generic Layout Block (`SECTION_ROW`)

Tài liệu mô tả kiến trúc sau khi gộp khối chuyên biệt `STORY_CHAPTER` (~4,252 dòng, 16+ file) về một khối bố cục tổng quát duy nhất (`SECTION_ROW` — **Bố cục nhiều cột**) kèm **Preset Strategy / Factory** và **Legacy Adapter** để bảo toàn khả năng đọc dữ liệu cũ:

1. **Luồng biên soạn Generic Layout (`SECTION_ROW`) với Preset Strategy**:
   - `RowLayoutPresetRegistry` (Strategy + Factory Pattern) cho phép áp dụng nhanh các mẫu dàn trang (`MAGAZINE_4_8`, `SYMMETRIC_6_6`, `MEDIA_LEAD_7_5`, `THREE_COLUMNS`, `THREE_COL_FEATURE`, `SINGLE_COLUMN`) bằng cách tái phân bổ bất biến các khối con sang danh sách cột mới (`RowLayoutStrategy.resizeColumnsImmutably`).
   - Hỗ trợ tùy chỉnh khoảng cách cột (`RowGapSize`: `SM` | `MD` | `LG`), căn dọc (`RowVerticalAlign`: `TOP` | `CENTER` | `STRETCH`), đường kẻ ngăn cột (`showColumnDivider`), kéo thanh `ColumnResizer` overlay giữa 2 cột mà không chiếm track Grid, và bật Drop Cap / Chia cột văn bản ngay trong `TypographyInspectorPanel` cho khối `TEXT` bên trong cột.
2. **Luồng tương thích ngược dữ liệu cũ (`STORY_CHAPTER` → `[HEADING, SECTION_ROW]`)**:
   - `migrateLegacyStoryChapterToBlocks` (Adapter Pattern) tự động chuyển đổi bản ghi `STORY_CHAPTER` cũ (cả dạng `chapters[]` lẫn dạng phẳng cũ) thành mảng các khối chuẩn `[HEADING, SECTION_ROW, ...]` ngay khi nạp vào trình soạn thảo (`useLessonBlockManager`), dựng mục lục (`lesson-toc.util.ts`) hoặc biên dịch HTML (`LessonBlockRegistry.blockToHtml`).

```mermaid
sequenceDiagram
    autonumber
    actor Author as Biên tập viên / Học viên
    participant Inspector as RowSectionBlockInspector
    participant PresetReg as RowLayoutPresetRegistry (Strategy/Factory)
    participant Manager as useLessonBlockManager
    participant Editor as RowSectionBlockEditor (+ ColumnResizer)
    participant Strategy as RowLayoutStrategy & BlockPlacementRuleEngine
    participant Adapter as migrateLegacyStoryChapterToBlocks (Adapter)
    participant Compiler as lesson-toc.util & LessonBlockRegistry

    rect rgb(245, 247, 255)
        Note over Author,Strategy: Luồng 1: Biên soạn Generic Layout (SECTION_ROW) với Preset & Resizer
        Author->>Inspector: Chọn mẫu bố cục nhanh (VD: Tạp chí 4:8 - MAGAZINE_4_8)
        Inspector->>PresetReg: applyPreset(row, RowLayoutPresetId.MAGAZINE_4_8)
        PresetReg->>Strategy: resizeColumnsImmutably(row.columns, 2, [33.33, 66.67])
        Strategy-->>PresetReg: Cột mới giữ nguyên khối con (không mất dữ liệu)
        PresetReg-->>Inspector: RowSectionBlockData (gapSize=LG, showColumnDivider=true)
        Inspector->>Manager: onUpdateBlock(row.id, updatedRow)
        Manager->>Editor: Render lưới Grid minmax(0, widthFr) + đường ngăn + ColumnResizer overlay

        opt Kéo thanh ColumnResizer giữa 2 cột hoặc chèn khối con vào cột
            Author->>Editor: Kéo Resizer hoặc thả khối từ Palette vào Cột
            Editor->>Strategy: computeTwoColumnSnap(targetLeft) / validate(type, { location: 'COLUMN', columnWidthPercent })
            Strategy-->>Editor: Trả tỷ lệ snap 5% hoặc kết quả kiểm tra PlacementRule
            Editor->>Manager: updateRowRatio / addBlockToColumn (giữ activeBlockId = rowId)
        end
    end

    rect rgb(245, 252, 248)
        Note over Author,Compiler: Luồng 2: Nạp & Biên dịch tương thích ngược dữ liệu STORY_CHAPTER cũ
        Author->>Manager: Mở bài học hoặc bài viết có JSONB từ DB
        Manager->>Adapter: parseContentToBlocks -> normalizeLegacyBlocks(rawItems)
        alt Gặp block.type === LEGACY_BLOCK_TYPE_STORY_CHAPTER
            Adapter->>Adapter: Chuyển chapters[] hoặc legacy flat fields -> HEADING + SECTION_ROW (theo tỷ lệ & zone)
            Adapter-->>Manager: Danh sách LessonBlockItem chuẩn (không còn STORY_CHAPTER)
        end

        Author->>Compiler: Xem trước / Xuất bản / Đọc bài học (buildLessonTocAndHtml / blockToHtml)
        Compiler->>Adapter: normalizeContentToBlocks / blockToHtml fallback chuyển đổi nếu còn raw legacy
        Compiler->>Strategy: compileRowToHtml(row, blockToHtmlFn)
        Strategy-->>Compiler: HTML responsive (grid-template-columns, gap, verticalAlign, columnDivider)
        Compiler-->>Author: Mục lục tự động (đọc từ HEADING) + HTML hiển thị chuẩn tạp chí
    end
```
