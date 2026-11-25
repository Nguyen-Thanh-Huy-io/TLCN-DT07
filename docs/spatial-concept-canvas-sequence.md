# Sequence Diagram — Interactive Spatial Concept Canvas (HISGO v2)

## 1. Khám phá khái niệm (Mặc định Kho nội bộ HISGO RAG vs. Bật mở rộng Google Search)

```mermaid
sequenceDiagram
    actor User as Người học / Khách
    participant Canvas as SpatialConceptCanvas
    participant Node as SpatialNodeCard
    participant Drawer as MindmapReferenceDrawer (Side Panel)
    participant API as ConceptCanvasController (/public/concept-canvas/explore)
    participant Svc as ConceptCanvasService
    participant DB as Prisma (Article, TimelineNode)
    participant AI as GoogleAiService (Vertex RAG + Optional Google Search)

    User->>Canvas: Nhập khái niệm (kèm công tắc Google Search OFF/ON)
    Canvas->>API: POST /public/concept-canvas/explore { prompt, useGoogleSearch, ... }
    API->>Svc: explore(dto)
    Svc->>DB: Tìm Article (PUBLISHED) & TimelineNode khớp từ khóa nguyên từ
    DB-->>Svc: matchedArticles, matchedTimelineNodes
    alt useGoogleSearch = false (Mặc định: Chỉ kho nội bộ HISGO)
        Svc->>AI: generateGroundedJson({ ragCorpus, enableGoogleSearch: false })
        AI-->>Svc: { data, groundingChunks (RAG), usedRag: true }
        Svc->>DB: Batch verify candidate slugs từ RAG URI & text (/bai-viet/<slug>) (status = PUBLISHED)
        DB-->>Svc: verifiedRagArticles (loại bỏ sạch slug chưa có trong DB, chặn 404)
        Svc-->>API: SpatialExploreResponse (engine: VERTEX_RAG, matchedArticles đã xác thực)
    else useGoogleSearch = true (Mở rộng kiến thức Google)
        Svc->>AI: generateGroundedJson({ ragCorpus, enableGoogleSearch: true })
        AI-->>Svc: { data, groundingChunks (RAG + Web), usedRag: true }
        Svc->>DB: Batch verify candidate slugs từ RAG (status = PUBLISHED)
        DB-->>Svc: verifiedRagArticles
        Svc-->>API: SpatialExploreResponse (engine: GOOGLE_GROUNDED, webSources)
    end
    API-->>Canvas: 200 OK
    Canvas->>Node: Render thẻ Neo-Brutalist + từ khóa in đậm gạch chân đen 2px

    User->>Node: Bấm vào từ khóa gạch chân đen [Khái niệm]
    Node-->>User: Hiện mini-menu: [🌿 Mở Node mới] | [📖 Đọc góc bên]
    alt Chọn [🌿 Mở Node mới]
        Node->>Canvas: onBranchPrompt(parentId, concept)
    else Chọn [📖 Đọc góc bên] hoặc bấm Chip Tư liệu HISGO
        Node->>Canvas: onOpenSideReader(concept / articleSlug)
        Canvas->>Drawer: Mở ngăn đọc trực tiếp bên phải (hỗ trợ bôi đen tách nhánh)
    end
```

## 2. Xuất ảnh PNG tại chỗ & Lưu mở thẳng trong Mindmap Studio

```mermaid
sequenceDiagram
    actor User as Người học
    participant Canvas as SpatialConceptCanvas
    participant Exporter as exportMindmapToPngFile
    participant MindmapAPI as MindmapController (POST /mindmaps)
    participant Studio as MindmapsSection (/tai-khoan?tab=so-do-tu-duy&mindmapId=...)

    alt Bấm [Xuất ảnh PNG]
        User->>Canvas: Bấm "Xuất ảnh PNG"
        Canvas->>Exporter: Convert cây Spatial -> MindmapGraph + computeMindmapLayout -> PNG
        Exporter-->>User: Tải file hisgo-mindmap-*.png về máy ngay lập tức
    else Bấm [Mở trong Mindmap Studio]
        User->>Canvas: Bấm "Lưu & Mở Mindmap Studio"
        Canvas->>MindmapAPI: POST /mindmaps { title, periodLabel, template, graph }
        MindmapAPI-->>Canvas: 201 Created { id }
        Canvas->>Studio: router.push(/tai-khoan?tab=so-do-tu-duy&mindmapId=id)
        Studio->>Studio: Tự động nạp MindmapCanvas cho id vừa tạo
    end
```
