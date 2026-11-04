/**
 * Khóa cache dùng chung giữa nhiều module.
 * Đặt ở common để module nội dung (Period/Topic) xóa được cache landing
 * mà không phụ thuộc ngược vào module public-content.
 */
export const PUBLIC_LANDING_CACHE_KEY = 'public:landing:v1';
export const PUBLIC_LANDING_CACHE_TTL_SECONDS = 300;
