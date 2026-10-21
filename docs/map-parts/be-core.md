# BE Core – backend/src (app, main, auth, user, common, dashboard, metrics, upload, tag, public-content)

## Gốc
- `app.module.ts` – root `AppModule`, import các module tính năng.
- `app.controller.ts` – `AppController`: `GET /` → `getHello()`.
- `app.service.ts` – `AppService.getHello()`.
- `main.ts` – `bootstrap()`: NestFactory, Winston logger, `AllExceptionsFilter`, `TransformInterceptor`, helmet, ValidationPipe toàn cục, CORS, Swagger (cờ `ENABLE_SWAGGER`).

## auth/
- `auth/auth.controller.ts` – `@Controller('auth')`: POST `/` (đăng ký), `verify-email`, `resend-verification-email`, GET `google`, GET/POST `google/callback`, POST `login`, `refresh-token`, `logout`, `logout-all`.
- `auth/auth.module.ts` – `AuthModule`.
- `auth/auth.service.ts` – `AuthService`: create (bcrypt 12, transaction, mã xác thực lưu Redis), verifyEmail, resendVerificationEmail, login (rate limit/khóa tài khoản), refreshToken, logout, logoutAllDevices, incrementTokenVersion.
- `auth/config/auth.config.ts` – `AUTH_CONFIG` (rate limit, token expiry, cache prefix).
- `auth/config/google-oauth.config.ts` – `GOOGLE_OAUTH_CONFIG`, `getGoogleOAuthCredentials()` đọc env GOOGLE_*.
- `auth/dto/auth-request.dto.ts` – VerifyEmailDto, ResendVerificationEmailDto, LoginDto, RefreshTokenDto, LogoutDto, LogoutAllDto.
- `auth/dto/create-auth.dto.ts` – `CreateAuthDto` (đăng ký).
- `auth/dto/google-oauth.dto.ts` – GoogleOAuthInitDto, GoogleOAuthCallbackDto.
- `auth/interfaces/auth.interface.ts` – enum `UserRole`, IAccessTokenPayload, IRefreshTokenPayload, ITokenPayload, IStoredRefreshToken, ILoginResponse.
- `auth/interfaces/google-oauth.interface.ts` – kiểu token/user info/state/ID-token claims/callback/error của Google.
- `auth/services/auth-utils.service.ts` – `AuthUtilsService`: generateSecureId, hashToken, createToken (JWT), verifyAccess/Refresh/Token, validatePassword, sinh mã xác thực.
- `auth/services/google-oauth.service.ts` – `GoogleOAuthService`: tạo URL + state, handleCallback, verify ID token qua public key Google, getUserInfo, logLoginAttempt, revokeGoogleToken.

## user/
- `user/user.controller.ts` – `@Controller('users')`, `AuthGuard`: POST, GET, GET `:id`, PATCH `:id`, DELETE `:id` (CRUD).
- `user/user.module.ts` – `UserModule`.
- `user/user.service.ts` – `UserService`: create/findAll/findOne/update/remove.
- `user/dto/create-user.dto.ts` – `CreateUserDto`.
- `user/dto/update-user.dto.ts` – `UpdateUserDto` (PartialType).
- `user/dto/user-response.dto.ts` – UserProfileResponseDto, UserResponseDto.

## common/
- `common/config/app.config.ts` – object `config` kiểu `AppConfig` (env, redis prefix…).
- `common/config/swagger.config.ts` – `setupSwagger(app)`.
- `common/config/throttler.config.ts` – `THROTTLER_CONFIG`, `THROTTLER_MESSAGES`.
- `common/config/winston.config.ts` – `winstonConfig` (transports).
- `common/constants/cache-keys.constant.ts` – `PUBLIC_LANDING_CACHE_KEY` (`public:landing:v1`), TTL 300s.
- `common/decorators/api-pagination.decorator.ts` – PaginationMeta, PaginatedResponse, PaginationDto, `ApiPaginatedResponseDecorator`, `createPaginatedResponse`.
- `common/decorators/api-response.decorator.ts` – ApiSuccessResponse/ApiErrorResponse + các decorator Swagger (ApiResponseDecorator, ApiArrayResponseDecorator, ApiCommonErrorResponses…).
- `common/decorators/index.ts` – barrel export.
- `common/errors/app.error.ts` – `AppError extends HttpException`.
- `common/filters/all-exception.filter.ts` – `AllExceptionsFilter`: chuẩn hóa lỗi + log.
- `common/guards/auth.guard.ts` – `AuthGuard` (JWT access token, kiểm tra tokenVersion).
- `common/guards/custom-throttler.guard.ts` – `CustomThrottlerGuard` mở rộng ThrottlerGuard.
- `common/interceptors/transform.interceptor.ts` – `TransformInterceptor`: bọc response chuẩn.
- `common/modules/index.ts` – barrel.
- `common/modules/logger.module.ts` – `LoggerModule` (@Global).
- `common/modules/queue.module.ts` – `QueueModule` (BullMQ).
- `common/modules/rate-limit.module.ts` – `RateLimitModule` (@Global, throttler).
- `common/modules/redis.module.ts` – `RedisModule` (@Global), provider `REDIS_CLIENT`, đóng kết nối khi destroy.
- `common/queues/email/email.queue.ts` – `EmailQueueService`: sendVerificationEmail/sendWelcomeEmail; kiểu EmailJob.
- `common/queues/email/email.processor.ts` – `EmailProcessor` (@Processor('email'), WorkerHost) `process(job)`.
- `common/services/activity-log.service.ts` – `ActivityLogService`: logActivity/logCreate/logUpdate/logDelete/logCustomEvent.
- `common/services/custom-logger.service.ts` – `CustomLoggerService` (Winston wrapper: logUserAction, logApiRequest, logDatabaseQuery…).
- `common/services/email.service.ts` – `EmailService`: sendEmail, sendWelcomeEmail.
- `common/services/prisma.service.ts` – `PrismaService` (connect/disconnect lifecycle).
- `common/services/redis.service.ts` – `RedisService`: get/set, del, delMany, deleteByPattern, exists, ttl, expire, incr, hset/hdel, cacheData…
- `common/services/slug.service.ts` – `SlugService`: sinh slug duy nhất qua `SlugExistsChecker` (tối đa 50 lần thử).
- `common/utils/slug.util.ts` – `toSlug` (bỏ dấu tiếng Việt), `withSuffix`, `SLUG_MAX_LENGTH`=200.

## dashboard/
- `dashboard/dashboard.controller.ts` – `@Controller('dashboard')`: GET `overview`.
- `dashboard/dashboard.module.ts` – `DashboardModule`.
- `dashboard/dashboard.service.ts` – `getOverview()` tổng hợp số liệu/hoạt động/bài chờ duyệt.
- `dashboard/dto/dashboard-overview.dto.ts` – DashboardCountsDto, RecentActivityItemDto, PendingLessonItemDto, ContentDistributionDto, DashboardOverviewResponseDto.

## metrics/
- `metrics/metrics.controller.ts` – GET `/metrics` (Prometheus text), GET `/metrics/json`.
- `metrics/metrics.interceptor.ts` – `MetricsInterceptor`: đo request HTTP.
- `metrics/metrics.module.ts` – `MetricsModule` (@Global).
- `metrics/metrics.service.ts` – `MetricsService` (prom-client): getMetrics, getMetricsJSON, setActiveUsers.

## upload/
- `upload/upload.controller.ts` – `@Controller('upload')`: POST `image`, POST `document` (lưu vào thư mục `uploads/`).
- `upload/upload.module.ts` – `UploadModule`.

## tag/
- `tag/tag.controller.ts` – GET/POST/PATCH/DELETE `tags[/:id]` (ghi cần `AuthGuard`), POST/GET `lessons/:id/tags`.
- `tag/tag.module.ts` – `TagModule`.
- `tag/tag.service.ts` – `TagService`: CRUD, attachTagsToLesson, getLessonTags, clearCache.
- `tag/dto/attach-lesson-tags.dto.ts` – `AttachLessonTagsDto`.
- `tag/dto/create-tag.dto.ts` – `CreateTagDto`.
- `tag/dto/query-tag.dto.ts` – `QueryTagDto`.
- `tag/dto/update-tag.dto.ts` – `UpdateTagDto` (PartialType).

## public-content/
- `public-content/public-content.controller.ts` – GET landing, periods, periods/:slug, figures, figures/:slug, topics, topics/:slug (đường dẫn trong `PUBLIC_CONTENT_ROUTES`).
- `public-content/public-content.module.ts` – `PublicContentModule`, đăng ký strategies.
- `public-content/public-content.constant.ts` – `PUBLIC_CONTENT_STATUS`, enum `LandingSection`, token `LANDING_SECTION_STRATEGIES`, ROUTES, MESSAGES, ERA_SUFFIX.
- `public-content/landing-content.facade.ts` – Facade `LandingContentFacade`: getLanding (cache Redis), getPeriods/Figures/getSection, get*BySlug.
- `public-content/dto/public-content.dto.ts` – các DTO Public* và LandingResponseDto, QueryPublicTopicsDto.
- `public-content/mappers/public-content.mapper.ts` – `PublicContentMapper`, `formatYear`, `buildTimeLabel`, `estimateReadMinutes`.
- `public-content/strategies/landing-section.strategy.ts` – Strategy: interface `LandingSectionStrategy`, `TopicSectionStrategy`, `ChaptersSectionStrategy`, `KnowledgeSectionStrategy`.
- `public-content/strategies/landing-section.registry.ts` – `LandingSectionRegistry.resolve(section)`.
