# Sequence Diagram: Nâng cấp Hộp ghi chú (CALLOUT) & Khung bao Bố cục nhiều cột (SECTION_ROW)

Tài liệu mô tả luồng dữ liệu 2 chiều giữa Canvas Editor, Property Inspector và Compiler Plugin cho:
- **CALLOUT**: tùy chọn màu sắc, kiểu khung (`LEFT_ACCENT` | `HEADER_BAR` | `OUTLINED`), icon/emoji hoặc ẩn icon, tiêu đề tùy chọn, chế độ thu gọn (`collapsible`), nội dung Rich Text và ảnh chèn nổi (`media`: Trái/Phải + chú thích) cho chữ chảy ôm quanh ảnh.
- **SECTION_ROW**: tùy chọn khung bao (`frameStyle`: `NONE` | `OUTLINED` | `TINTED`) và icon góc (`frameIcon`).

```mermaid
sequenceDiagram
    autonumber
    actor Author as Tác giả (CMS)
    participant CalloutUI as CalloutBlockItemEditor
    participant RowUI as RowSectionBlockEditor
    participant Inspector as CalloutBlockInspector / RowSectionBlockInspector + Typography
    participant Constants as callout.constants / lesson.constants
    participant CalloutPlugin as callout-block.plugin.ts
    participant RowStrategy as RowLayoutStrategy.compileRowToHtml
    participant CSS as lesson-blocks.css

    Author->>CalloutUI: Mở khối CALLOUT trên Canvas
    CalloutUI->>Constants: resolveCalloutOption, resolveCalloutIcon, resolveCalloutBoxStyleOption
    Constants-->>CalloutUI: Màu viền/nền tint, headerBarClass, icon & layout kiểu khung

    par Tùy chỉnh CALLOUT (Canvas Popover hoặc Inspector Phải)
        Author->>CalloutUI: Chọn màu, Kiểu khung (Viền trái / Thanh tiêu đề / Đóng khung), Emoji/Ẩn, Thu gọn
        Author->>Inspector: Chọn Kiểu khung, Tải/gắn ảnh nổi (Trái/Phải + chú thích), Bật thu gọn
        Inspector-->>CalloutUI: Đồng bộ CalloutBlockData (variant, boxStyle, icon, collapsible, media)
    and Soạn chữ & xem trước float ngay trên Canvas
        Author->>CalloutUI: Nhập tiêu đề + soạn Rich Text trong TipTapContent
        CalloutUI-->>Author: Hiển thị ảnh nổi bên Trái/Phải để chữ tự chảy ôm quanh ảnh
    end

    Note over CalloutPlugin,CSS: Biên dịch CALLOUT sang HTML ngữ nghĩa
    CalloutPlugin->>Constants: resolveCalloutOption, resolveCalloutIcon, resolveCalloutBoxStyleOption, resolveCalloutMediaAlignOption
    CalloutPlugin->>CalloutPlugin: renderCalloutMediaHtml (safeUrl + caption) & renderCalloutBodyHtml (sanitizeRichHtml / escapeHtml)
    CalloutPlugin-->>CSS: Xuất .hisgo-callout (+ --header-bar / --outlined / --collapsible / --compact) + .hisgo-callout-media (clearfix & @container hisgo-callout)

    Note over Author,RowStrategy: Cấu hình Khung bao cho SECTION_ROW
    Author->>Inspector: Chọn Khung bao (NONE / OUTLINED / TINTED) & Icon góc
    Inspector-->>RowUI: Cập nhật frameStyle & frameIcon trên RowSectionBlockData
    RowUI-->>Author: Bọc khung viền/nền nổi + badge icon góc trên Canvas
    RowStrategy->>Constants: resolveRowFrameOption(row.frameStyle)
    RowStrategy-->>CSS: Gắn .hisgo-row-container--outlined / --tinted & .hisgo-row-frame-icon (zero inline style khung)
```
