# Sequence Diagram: Danh sách (Bullet / Numbered List) & Bảng biểu (Rich Table) trong Văn bản

Tài liệu mô tả kiến trúc và luồng xử lý tính năng **Danh sách đa kiểu (Bullet & Ordered List Styles)** cùng **Bảng biểu trực tiếp trong Văn bản (Rich Text Table)** cho trình soạn thảo Bài học & Khảo cứu lịch sử:

1. **Khôi phục & Mở rộng Danh sách (`bulletList` / `orderedList`)**:
   - Khắc phục triệt để việc Tailwind CSS v4 Preflight reset `ul, ol { list-style: none; padding: 0 }` khiến văn bản không hiện dấu chấm đầu dòng (`•`) hoặc số thứ tự (`1., 2.`) trong `.tiptap-content-box` và `.ue-bio-blocks`.
   - Mở rộng `BlockTypographyExtension` hỗ trợ thuộc tính `listStyleType` trên `bulletList` (`disc`, `circle`, `square`) và `orderedList` (`decimal`, `lower-alpha`, `upper-roman`) thông qua bảng chọn **Kiểu danh sách** trên `TypographyInspectorPanel`.
2. **Kiến trúc Bảng biểu Rich Text (`RichTableExtensionKit` & `TableActionStrategy`)**:
   - Xây dựng bộ Node `RichTableNode` (`table`), `RichTableRowNode` (`tableRow`), `RichTableHeaderNode` (`tableHeader`), `RichTableCellNode` (`tableCell`) trên nền `@tiptap/core` và `@tiptap/pm/tables` (`prosemirror-tables`).
   - Áp dụng **Strategy / Command Pattern** (`TableActionType` enum + `TABLE_ACTION_STRATEGIES`) để thực thi các thao tác chèn bảng, thêm/xóa hàng, thêm/xóa cột, chuyển đổi dòng tiêu đề và xóa bảng mà không dùng chuỗi cứng (No Magic Strings) hay câu lệnh rẽ nhánh phức tạp (Tuân thủ SOLID / OCP).

```mermaid
sequenceDiagram
    autonumber
    actor Author as Biên tập viên
    participant Inspector as TypographyInspectorPanel ("Văn bản")
    participant Strategy as ListStyle & TableAction Strategies
    participant Editor as TipTap Editor (BlockTypography + RichTableKit)
    participant PM as ProseMirror Tables & DOM (.tiptap-content-box)
    participant Sanitizer as sanitizeRichHtml & Reader (.ue-bio-blocks)

    rect rgb(245, 247, 255)
        Note over Author,PM: Luồng 1: Định dạng Danh sách Bullet & Đánh số thứ tự
        Author->>Inspector: Bấm nút Danh sách chấm (Bullet) hoặc Danh sách số (Ordered)
        Inspector->>Editor: toggleBulletList() / toggleOrderedList()
        Editor->>PM: Render <ul data-list-style="disc"> hoặc <ol data-list-style="decimal">
        PM-->>Author: Hiển thị dấu đầu dòng (•) / số thứ tự (1., 2.) chuẩn CSS

        opt Đang đặt con trỏ trong Danh sách
            Inspector-->>Author: Hiển thị bộ chọn "Kiểu danh sách" (• / ○ / ▪ hoặc 1. / a. / I.)
            Author->>Inspector: Chọn kiểu dấu danh sách mới
            Inspector->>Strategy: Tra cứu ListStyleType trong LIST_STYLE_OPTIONS_MAP
            Strategy->>Editor: updateAttributes('bulletList' | 'orderedList', { listStyleType })
            Editor->>PM: Cập nhật style="list-style-type: ..." trên thẻ <ul> / <ol>
        end
    end

    rect rgb(245, 252, 248)
        Note over Author,Sanitizer: Luồng 2: Chèn & Thao tác Bảng biểu (Rich Table) trong Văn bản
        Author->>Inspector: Bấm nút "Bảng biểu" trên mục Văn bản (hoặc menu + trên Toolbar)
        alt Con trỏ chưa nằm trong bảng
            Inspector->>Strategy: Gọi insertRichTable(editor, { rows: 3, cols: 3, withHeaderRow: true })
            Strategy->>Editor: Khởi tạo Node table > tableRow > (tableHeader | tableCell)
            Editor->>PM: Mount bảng 3x3 kèm plugin tableEditing() & phím tắt Tab/Shift-Tab
        else Con trỏ đang nằm trong bảng (editor.isActive('table'))
            Inspector-->>Author: Hiển thị khay "Thao tác bảng biểu" (Hàng / Cột / Tiêu đề / Xóa)
            Author->>Inspector: Bấm thao tác (VD: + Hàng dưới, + Cột phải, Xóa hàng...)
            Inspector->>Strategy: TABLE_ACTION_STRATEGIES[actionType].execute(editor)
            Strategy->>PM: Thực thi command prosemirror-tables (addRowAfter, addColumnAfter...)
            PM-->>Editor: Phát sự kiện onUpdate -> cập nhật HTML bài học
        end
        Editor->>Sanitizer: Xuất HTML sạch (<table>, <tr>, <th>, <td>, <ul>, <ol>, <li>)
        Sanitizer-->>Author: Hiển thị đồng nhất giữa Khung soạn thảo và Trang đọc công khai
    end
```
