# BE Domain Map (backend/src: topic, period, lesson, learning-path, historical-entity, historical-event; prisma; test)

## src/topic
- `topic/topic.constant.ts` – hằng số: TOPIC_HIERARCHY_CONFIG (giới hạn cấp), TOPIC_ERROR_MESSAGES, TOPIC_SUCCESS_MESSAGES.
- `topic/topic.controller.ts` – `@Controller('topics')`: POST /, GET /, GET /tree, GET /:id, PATCH /reorder, PATCH /:id, DELETE /:id, POST /:id/children, DELETE /:id/children/:childId.
- `topic/topic.module.ts` – TopicModule đăng ký controller/service.
- `topic/topic.service.ts` – CRUD Topic phân cấp cha-con (Composite): validateParentHierarchy, create/findAll (phân trang)/findOne/update/remove, getTopicTree, gán/bỏ con, reorder, invalidateCache (cache).
- `topic/dto/assign-children.dto.ts` – AssignChildrenDto (danh sách id con).
- `topic/dto/create-topic.dto.ts` – CreateTopicDto (class-validator: tên, slug, icon, parent, period…).
- `topic/dto/query-topic.dto.ts` – QueryTopicDto (phân trang, lọc, tìm kiếm).
- `topic/dto/reorder-topics.dto.ts` – ReorderTopicItemDto, ReorderTopicsDto (sắp xếp batch).
- `topic/dto/topic-response.dto.ts` – TopicResponseDto (Swagger response).
- `topic/dto/update-topic.dto.ts` – UpdateTopicDto = PartialType(CreateTopicDto).

## src/period
- `period/period.controller.ts` – `@Controller('periods')`: POST, GET, GET /:id, PATCH /:id, DELETE /:id.
- `period/period.module.ts` – PeriodModule.
- `period/period.service.ts` – PeriodService implements IPeriodService: create/findAll/findOne/update/remove, invalidateCache.
- `period/dto/create-period.dto.ts` – CreatePeriodDto (tên, năm bắt đầu/kết thúc…).
- `period/dto/period-response.dto.ts` – PeriodResponseDto.
- `period/dto/query-period.dto.ts` – QueryPeriodDto (phân trang/lọc).
- `period/dto/update-period.dto.ts` – UpdatePeriodDto (PartialType).
- `period/interfaces/period.interface.ts` – IPaginatedResult<T>, IPeriodService (hợp đồng service, DIP).

## src/lesson
- `lesson/lesson.controller.ts` – `@Controller('lessons')`: POST, GET, GET slug/:slug, GET /:id, PATCH /:id, PATCH /:id/review (duyệt), DELETE /:id.
- `lesson/lesson.module.ts` – LessonModule.
- `lesson/lesson.service.ts` – LessonService: generateUniqueSlug, calculateReadTime, formatLessonResponse, create/findAll/findOne/findBySlug/update/review/remove, invalidateCache; dùng content strategy.
- `lesson/dto/create-lesson.dto.ts` – CreateLessonDto.
- `lesson/dto/lesson-response.dto.ts` – LessonResponseDto.
- `lesson/dto/query-lesson.dto.ts` – QueryLessonDto.
- `lesson/dto/review-lesson.dto.ts` – ReviewLessonDto (trạng thái duyệt/lý do).
- `lesson/dto/update-lesson.dto.ts` – UpdateLessonDto (PartialType).
- `lesson/helpers/slug.helper.ts` – SlugHelper: tạo slug từ tiêu đề.
- `lesson/strategies/content-normalizer.strategy.ts` – Strategy chuẩn hoá nội dung: ILessonContentStrategy; ArrayBlock/TipTapDocument/String/Fallback strategy (canHandle/normalize/extractPlainText); LessonContentStrategyContext chọn strategy.

## src/learning-path
- `learning-path/learning-path.controller.ts` – `@Controller('learning-paths')`: CRUD path (GET, GET/:id, POST, PUT/:id, DELETE/:id); chapters (POST/PUT/DELETE chapters); POST/DELETE chapters/:chapterId/lessons; PUT chapters/:chapterId/lessons/reorder.
- `learning-path/learning-path.module.ts` – LearningPathModule.
- `learning-path/learning-path.service.ts` – findAllPaths/findPathById/createPath/updatePath/deletePath, create/update/deleteChapter, addLessonsToChapter, removeLessonFromChapter, reorderChapterLessons.
- `learning-path/dto/chapter-lesson-action.dto.ts` – AddLessonsToChapterDto, ReorderItemDto, ReorderChapterLessonsDto.
- `learning-path/dto/create-chapter.dto.ts` – CreateChapterDto, UpdateChapterDto.
- `learning-path/dto/create-learning-path.dto.ts` – CreateLearningPathDto, UpdateLearningPathDto.

## src/historical-entity
- `historical-entity/historical-entity.constant.ts` – HISTORICAL_ENTITY_ROUTES, _CACHE, enum EntityRelationType, _ERRORS, _MESSAGES (không magic string).
- `historical-entity/historical-entity.controller.ts` – CRUD thực thể (POST, GET, GET/:id, PATCH, DELETE), POST/DELETE relations, GET :id/graph (getEntityGraph), POST/DELETE media.
- `historical-entity/historical-entity.module.ts` – HistoricalEntityModule.
- `historical-entity/historical-entity.service.ts` – validateYearRange, validateRelationYearRange, ensurePeriodExists, create/findAll/findOne/update/remove, thêm/xoá quan hệ (đối chiếu relation-rules), media, getEntityGraph, invalidateCache.
- `historical-entity/dto/historical-entity.dto.ts` – Create/Update/Query HistoricalEntityDto, Create/Update EntityRelationDto, CreateEntityMediaDto và các Response DTO (Person, HistoricalSite, Media, Relation, Entity).

## src/historical-event
- `historical-event/historical-event.constant.ts` – HISTORICAL_EVENT_CACHE, _TOKENS (DI token repository), _ERRORS, _MESSAGES.
- `historical-event/historical-event.controller.ts` – `@Controller('historical-events')`: POST, GET, GET/:id, PATCH/:id, DELETE/:id, POST :id/relations, DELETE relations/:relationId, GET :id/graph.
- `historical-event/historical-event.module.ts` – bind HISTORICAL_EVENT_TOKENS.REPOSITORY → PrismaRepository, đăng ký strategy registry.
- `historical-event/historical-event.service.ts` – validateYearRange, ensureReferencesExist, create (metadata theo category), formatEvent, findAll/findOne/update/remove, relations, getEventGraph (nodes/edges), invalidateCache.
- `historical-event/dto/create-historical-event.dto.ts` – CreateHistoricalEventDto.
- `historical-event/dto/event-relation.dto.ts` – CreateEventRelationDto, EventRelationNodeDto, EventRelationResponseDto, EventGraphEdgeDto, EventGraphResponseDto.
- `historical-event/dto/historical-event-response.dto.ts` – HistoricalEventResponseDto.
- `historical-event/dto/query-historical-event.dto.ts` – QueryHistoricalEventDto.
- `historical-event/dto/update-historical-event.dto.ts` – UpdateHistoricalEventDto (PartialType).
- `historical-event/models/historical-event.domain-model.ts` – Create/UpdateHistoricalEventDomainModel, HistoricalEventEntityModel (model miền, tách khỏi Prisma).
- `historical-event/repositories/historical-event.repository.interface.ts` – IHistoricalEventRepository (Repository pattern).
- `historical-event/repositories/historical-event.prisma.repository.ts` – HistoricalEventPrismaRepository: create/findById/existsBySlug/countChildren/delete/removeRelation/findRelationById/findRelationsByEventId…
- `historical-event/strategies/event-metadata.strategy.interface.ts` – IEventMetadataStrategy (supports/getCategory/validateAndNormalize).
- `historical-event/strategies/category-metadata.strategies.ts` – Battle, Treaty, NaturalDisaster, Default metadata strategy.
- `historical-event/strategies/event-metadata-strategy.registry.ts` – EventMetadataStrategyRegistry: registerStrategy/getStrategy(category).

## prisma
- `prisma/schema/base.prisma` – generator/datasource (không có model).
- `prisma/schema/enums.prisma` – enum: userRole, userStatus, mfaMethod, loginAction, email_type/provider/status, eventType, actionType, subscriptionStatus, billingInterval, paymentStatus, invoiceStatus, ContentStatus, DifficultyLevel, LearningPathType, MediaType, TopicIcon, HistoricalEntityType, EventCategory, EventRelationType, VerificationStatus, DatePrecision.
- `prisma/schema/auth.prisma` – model authUser, authSecurity.
- `prisma/schema/profile.prisma` – model userProfile.
- `prisma/schema/history.prisma` – model loginHistory, emailHistory.
- `prisma/schema/activityLog.prisma` – model ActivityLogEvent, ActivityLogEventDetail.
- `prisma/schema/subscription.prisma` – model Subscription, SubscriptionPlan, Payment, Invoice.
- `prisma/schema/tag.prisma` – model Tag.
- `prisma/schema/topic.prisma` – model Topic (tự tham chiếu cha-con).
- `prisma/schema/period.prisma` – model Period.
- `prisma/schema/lesson.prisma` – enum LessonStatus; model Lesson.
- `prisma/schema/learningPath.prisma` – model LearningPath, Chapter, ChapterLesson.
- `prisma/schema/historicalEntity.prisma` – model HistoricalEntity, Person, HistoricalSite, HistoricalEntityRelation, HistoricalEntityMedia.
- `prisma/schema/historicalEvent.prisma` – model HistoricalEvent, HistoricalEventEntity, HistoricalEventMedia, HistoricalEventRelation.
- `prisma/relation-rules.json` – 26 luật quan hệ thực thể (code, category, forward/reverseLabel, allowedSources/Targets, isSymmetric, inverseCode, requireTimeRange, example), ví dụ LEADER_OF, MEMBER_OF.
- `prisma/seed.ts` – seed (PrismaPg adapter, `main()`): xoá dữ liệu cũ → tạo Admin → Tags → 1 Period (kháng chiến chống Mỹ 1954–1975) → cây Topic 3 cấp → sự kiện cha/con, bài học, thực thể (nhân vật/lực lượng/hiện vật), địa danh/HistoricalSite.

## test (e2e, jest-e2e.json)
- `test/jest-e2e.json` – cấu hình Jest e2e.
- `test/app.e2e-spec.ts` – smoke test AppController.
- `test/auth.e2e-spec.ts` – đăng ký, xác minh email, login, refresh/logout, health & metrics.
- `test/dashboard.e2e-spec.ts` – GET /dashboard/overview.
- `test/historical-event.e2e-spec.ts` – CRUD /historical-events.
- `test/lesson.e2e-spec.ts` – CRUD /lessons + PATCH review.
- `test/period.e2e-spec.ts` – CRUD /periods.
- `test/public-content.e2e-spec.ts` – API nội dung công khai.
- `test/tag.e2e-spec.ts` – tags: tạo/liệt kê/gán vào lesson/xoá.
- `test/topic.e2e-spec.ts` – CRUD topic, phân cấp cha-con, reorder batch.
