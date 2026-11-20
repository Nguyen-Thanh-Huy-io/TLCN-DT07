# Sequence Diagram — Phase 11: Bóc tách Tầng Repository (Repository Pattern & DIP trong SOLID) cho Historical Event

## 1. Bối cảnh & Mục tiêu
- **Vấn đề**: `HistoricalEventService` trước đây gọi trực tiếp xuống `PrismaService`, vi phạm Dependency Inversion Principle (DIP) và Single Responsibility Principle (SRP).
- **Giải pháp**: 
  - Đưa vào mẫu thiết kế **Repository Pattern** với Interface trừu tượng `IHistoricalEventRepository`.
  - Triển khai cụ thể `HistoricalEventPrismaRepository` đóng gói toàn bộ logic truy vấn cơ sở dữ liệu.
  - `HistoricalEventService` phụ thuộc vào Interface qua Injection Token `HISTORICAL_EVENT_REPOSITORY` (không magic string).
  - Kết hợp với **Strategy Pattern** cho việc chuẩn hóa `metadata` theo `EventCategory`.

## 2. Sequence Diagram: Luồng Tạo Sự Kiện với Repository Pattern & Strategy Pattern

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Quản Trị Viên (Client / UI)
    participant Ctr as HistoricalEventController
    participant Svc as HistoricalEventService
    participant Reg as EventMetadataStrategyRegistry
    participant Strat as SpecificEventMetadataStrategy
    participant SlugSvc as SlugService
    participant Repo as IHistoricalEventRepository<br/>(HistoricalEventPrismaRepository)
    participant DB as PrismaService (PostgreSQL)
    participant Cache as RedisService

    Admin->>Ctr: POST /historical-events (CreateHistoricalEventDto)
    Ctr->>Svc: create(createDto)
    
    activate Svc
    Svc->>Svc: validateYearRange(eventYear, endYear)
    Svc->>Repo: checkReferencesExist(topicId, periodId, locationId, parentId)
    Repo->>DB: findUnique(...)
    DB-->>Repo: Reference entities status
    Repo-->>Svc: References validated

    rect rgb(240, 248, 255)
    Note over Svc,Strat: [Strategy Pattern & OCP] Chuẩn hóa metadata theo Category
    Svc->>Reg: getStrategy(dto.category)
    Reg-->>Svc: matchedStrategy
    Svc->>Strat: validateAndNormalize(dto.metadata)
    Strat-->>Svc: normalizedMetadata
    end

    Svc->>SlugSvc: generateUnique(dto.title, candidateChecker)
    SlugSvc->>Repo: existsBySlug(candidate)
    Repo->>DB: count({ where: { slug } })
    DB-->>Repo: count > 0
    Repo-->>SlugSvc: boolean
    SlugSvc-->>Svc: uniqueSlug

    Svc->>Repo: create(eventData, relations)
    Repo->>DB: historicalEvent.create(...)
    DB-->>Repo: HistoricalEvent Record
    Repo-->>Svc: HistoricalEvent Entity

    Svc->>Cache: invalidateCache(id)
    Cache-->>Svc: OK

    Svc-->>Ctr: HistoricalEvent Entity
    deactivate Svc

    Ctr-->>Admin: 201 Created (ApiResponse<HistoricalEventResponseDto>)
```

## 3. Sequence Diagram: Luồng Truy Vấn Danh Sách (findAll) với Repository & Cache

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (UI / events)
    participant Ctr as HistoricalEventController
    participant Svc as HistoricalEventService
    participant Cache as RedisService
    participant Repo as IHistoricalEventRepository<br/>(HistoricalEventPrismaRepository)
    participant DB as PrismaService (PostgreSQL)

    User->>Ctr: GET /historical-events?category=BATTLE&page=1&limit=10
    Ctr->>Svc: findAll(queryDto)
    
    activate Svc
    Svc->>Cache: get(cacheKey)
    alt Cache Hit
        Cache-->>Svc: cachedResult (JSON)
    else Cache Miss
        Svc->>Repo: findMany(queryParams)
        Repo->>DB: Promise.all([count, findMany])
        DB-->>Repo: [totalCount, records]
        Repo-->>Svc: { items, total }
        Svc->>Cache: set(cacheKey, paginatedResult, TTL)
    end
    Svc-->>Ctr: IPaginatedResult<HistoricalEvent>
    deactivate Svc
    Ctr-->>User: 200 OK (Paginated Events)
```
