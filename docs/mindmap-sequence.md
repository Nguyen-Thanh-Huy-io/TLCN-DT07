# Sequence Diagram: Sơ đồ tư duy Lịch sử (HISGO Mindmap)

Tài liệu mô tả luồng **Sơ đồ tư duy Lịch sử** (1 bảng mới độc lập `study_mindmaps`, không sửa bảng cũ):
1. Tạo sơ đồ mới từ 1 trong 5 mẫu (`TREE | FLOW | SPIDER | DOUBLE_BUBBLE | BLANK`) qua `MindmapTemplateRegistry` (Strategy Pattern).
2. Chỉnh sửa tự do trên canvas (kéo thả node, thêm/sửa/xoá node & liên kết, gắn bài viết HISGO) và tự động lưu (`PATCH /mindmaps/:id`).
3. Sinh sơ đồ xem trước bằng AI / Heuristic từ ghi chú & bài viết đã lưu (`POST /mindmaps/generate-preview`).

```mermaid
sequenceDiagram
    autonumber
    actor User as Người học
    participant UI as MindmapSection / MindmapCanvas
    participant API as MindmapController (/mindmaps)
    participant Tpl as MindmapTemplateRegistry
    participant AI as MindmapAiService
    participant DB as PostgreSQL (study_mindmaps)

    User->>UI: Mở tab "Sơ đồ tư duy" (/tai-khoan)
    UI->>API: GET /mindmaps
    API->>DB: SELECT study_mindmaps WHERE owner_id = :userId
    DB-->>UI: MindmapSummary[]

    alt Tạo từ mẫu (TREE / FLOW / SPIDER / DOUBLE_BUBBLE / BLANK)
        User->>UI: Chọn dạng sơ đồ & nhập tên
        UI->>API: POST /mindmaps { title, periodLabel, template }
        API->>Tpl: buildGraph(template, title, periodLabel)
        Tpl-->>API: { nodes, edges }
        API->>DB: INSERT study_mindmaps
        DB-->>UI: StudyMindmap
    else Tạo bằng AI từ Ghi chú & Bài viết đã lưu
        User->>UI: Bấm "Tạo bằng AI"
        UI->>API: POST /mindmaps/generate-preview { articleIds, includeNotes }
        API->>DB: Truy vấn notes & articles
        AI-->>UI: { title, periodLabel, graph, engine }
        User->>UI: Xem trước & bấm "Lưu sơ đồ"
        UI->>API: POST /mindmaps { title, periodLabel, template, graph }
        API->>DB: INSERT study_mindmaps
        DB-->>UI: StudyMindmap
    end

    loop Thao tác trên Canvas (kéo thả, thêm/sửa node, nối dây)
        User->>UI: Thay đổi node / edge
        UI->>API: PATCH /mindmaps/:id (debounced)
        API->>DB: UPDATE study_mindmaps SET graph = ...
        DB-->>UI: Đã lưu
    end
```
