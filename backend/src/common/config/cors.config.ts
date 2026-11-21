const DEFAULT_CORS_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

/**
 * Danh sách origin hợp lệ cho HTTP CORS và WebSocket gateways.
 * Cho phép truyền `CORS_ORIGINS` phân tách bằng dấu phẩy khi chạy môi trường E2E/CI/Staging.
 */
export const CORS_ORIGINS: string[] = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : DEFAULT_CORS_ORIGINS;
