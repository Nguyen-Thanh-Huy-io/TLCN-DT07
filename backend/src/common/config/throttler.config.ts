/**
 * Rate Limiting Configuration
 *
 * Uses @nestjs/throttler with Redis storage for distributed rate limiting.
 * This ensures consistent rate limits across multiple app instances.
 */

export const THROTTLER_CONFIG = {
  // Default rate limit (applies to all routes unless overridden)
  DEFAULT: {
    ttl: 60000, // 60 seconds (1 minute)
    limit: 1000, // 1000 requests per minute in local development
  },

  // Strict rate limit for sensitive endpoints (login, signup, password reset)
  STRICT: {
    ttl: 60000, // 60 seconds
    limit: 10, // 10 requests per minute
  },

  // Very strict for auth attempts (prevents brute force)
  AUTH: {
    ttl: 900000, // 15 minutes
    limit: 5, // 5 attempts per 15 minutes
  },

  // Relaxed for read-heavy endpoints
  RELAXED: {
    ttl: 60000, // 60 seconds
    limit: 1000, // 1000 requests per minute in local development
  },
} as const;

/** Bộ đếm đăng nhập (AuthUtilsService.checkRateLimit) vẫn chạy ở 'test' vì có unit test kiểm hành vi 429. */
export const AUTH_RATE_LIMIT_EXEMPT_ENVS: readonly string[] = ['development'];
export const GUARD_RATE_LIMIT_EXEMPT_ENVS: readonly string[] = [
  'test',
  ...AUTH_RATE_LIMIT_EXEMPT_ENVS,
];

/**
 * Error messages for rate limiting
 */
export const THROTTLER_MESSAGES = {
  DEFAULT: 'Too many requests. Please try again later.',
  AUTH: 'Too many login attempts. Please try again in 15 minutes.',
  SIGNUP: 'Too many registration attempts. Please try again later.',
} as const;
