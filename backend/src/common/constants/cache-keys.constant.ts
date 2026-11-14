import config from '../config/app.config';

/**
 * Khóa cache dùng chung giữa nhiều module.
 * Đặt ở common để module nội dung (Period/Topic) xóa được cache landing
 * mà không phụ thuộc ngược vào module public-content.
 */
export const PUBLIC_LANDING_CACHE_KEY = 'public:landing:v1';
export const PUBLIC_LANDING_CACHE_TTL_SECONDS = 300;

/**
 * `tokenVersion` mà AuthGuard cache trong Redis. Mọi chỗ tăng `tokenVersion` (khoá, đổi quyền, xoá tài khoản…)
 * phải xoá key này, nếu không token cũ vẫn qua được AuthGuard cho tới khi cache hết hạn.
 */
export const tokenVersionCacheKey = (userId: string): string =>
  `${config.redis_cache_key_prefix}:token_version:${userId}`;
