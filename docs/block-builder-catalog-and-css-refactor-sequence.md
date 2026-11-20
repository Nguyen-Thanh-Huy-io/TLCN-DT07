# Sequence Diagram: Chuẩn hóa `BLOCK_CATALOG`, Enums & Tách Inline CSS Block Builder

Tài liệu mô tả kiến trúc sau khi loại bỏ hardcode ở tầng Block Builder:
1. **Single Source of Truth cho Metadata & Enums (`BLOCK_CATALOG` & Enum Options)**:
   - Toàn bộ nhãn tiếng Việt, mô tả, nhóm và cờ hiển thị trên Palette của 17 loại khối (`LessonBlockType`) được định nghĩa duy nhất tại `BLOCK_CATALOG` (`frontend/src/features/lessons/constants/lesson.constants.ts`), kèm helper `getBlockLabel(type)`.
   - `BlockLibraryPalette`, `LessonLeftToolSidebar`, `BlockCardWrapper`, `BlockPropertyInspector` và `RevisionDiff` cùng tra cứu từ `BLOCK_CATALOG` thay vì khai báo map/switch lặp lại.
   - Các cấu hình dạng chuỗi (`CalloutVariant`, `TimelineSceneStyle`, `TimelineSortOrder`, `TimelineDateFormat`) được chuẩn hóa thành `enum` trong `block-builder.types.ts` và cung cấp mảng tùy chọn dùng chung (`CALLOUT_VARIANT_OPTIONS`, `TIMELINE_DATE_FORMAT_OPTIONS`, `TIMELINE_SORT_ORDER_OPTIONS`, `TIMELINE_SCENE_STYLE_OPTIONS`).
2. **Semantic HTML + Strategy Pattern (`LessonBlockRegistry` → `lesson-blocks.css`)**:
   - `simple-block.plugins.ts` và `timeline-block.plugin.ts` (với Strategy Map `TIMELINE_SCENE_RENDERERS`) chỉ biên dịch HTML semantic gắn class `hisgo-*` (không nhúng inline `style="..."` cứng).
   - Toàn bộ CSS giao diện thẻ khối, biến chủ đề (`--hisgo-block-*`) và Container Queries (`@container hisgo-row`, `@container hisgo-col`, `@container hisgo-card`) được quản lý tập trung tại `frontend/src/features/lessons/styles/lesson-blocks.css` và nạp qua `globals.css`.

```mermaid
sequenceDiagram
    autonumber
    actor Author as Biên tập viên / Học viên
    participant UI as Palette / Sidebar / CardWrapper / Inspector / RevisionDiff
    participant Catalog as BLOCK_CATALOG & Enum Options (lesson.constants.ts)
    participant Types as block-builder.types.ts (Enums)
    participant Plugins as simple-block.plugins.ts & timeline-block.plugin.ts
    participant CSS as lesson-blocks.css (Semantic CSS + @container)

    rect rgb(245, 247, 255)
        Note over Author,Types: Luồng 1: Tra cứu Metadata tập trung & Enums (Không magic string / Không lặp nhãn)
        Author->>UI: Mở Palette, chọn Khối, xem Inspector hoặc đối chiếu RevisionDiff
        UI->>Catalog: Đọc LESSON_BLOCK_ITEMS / gọi getBlockLabel(block.type)
        Catalog-->>UI: Trả nhãn & mô tả đồng nhất từ BLOCK_CATALOG[type]

        opt Cấu hình Callout Variant hoặc Timeline DisplayConfig
            UI->>Catalog: Đọc CALLOUT_VARIANT_OPTIONS / TIMELINE_*_OPTIONS
            Catalog->>Types: Dùng enum CalloutVariant, TimelineSceneStyle, TimelineSortOrder, TimelineDateFormat
            Types-->>UI: Bảo đảm type-safe 100% lúc compile, không magic string
        end
    end

    rect rgb(245, 252, 248)
        Note over Author,CSS: Luồng 2: Biên dịch HTML Semantic sạch & áp dụng Style tập trung
        Author->>Plugins: Xem trước / Xuất bản / Đọc bài học (LessonBlockRegistry.blockToHtml)
        alt Khối Timeline
            Plugins->>Plugins: Tra Strategy TIMELINE_SCENE_RENDERERS[sceneStyle]
        else Khối nội dung chuẩn (Callout, Character, Event, Quote, Table...)
            Plugins->>Plugins: Xuất thẻ semantic với class hisgo-* (không inline style cứng)
        end
        Plugins-->>Author: HTML sạch (.hisgo-callout, .hisgo-character-block, .hisgo-timeline-block...)
        CSS-->>Author: Áp dụng theme --hisgo-block-* & @container responsive đồng nhất mọi màn hình
    end
```
