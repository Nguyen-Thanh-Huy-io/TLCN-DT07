import config from '../../common/config/app.config';
import { AUTH_CONFIG } from '../config/auth.config';

const DEFAULT_EXPIRY_SECONDS = 3600;

/**
 * Parse token expiry string (e.g. '15m', '7d', '3600') to seconds.
 */
export function parseAuthExpiryToSeconds(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])?$/);
  if (!match) {
    return DEFAULT_EXPIRY_SECONDS;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2] || 's';

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return value;
  }
}

export function buildVerificationCacheKey(email: string): string {
  return `${config.redis_cache_key_prefix}:${AUTH_CONFIG.CACHE_PREFIXES.VERIFICATION_TOKEN}:${email}`;
}

export function buildRefreshTokenCacheKey(userId: string, jti: string): string {
  return `${config.redis_cache_key_prefix}:${AUTH_CONFIG.CACHE_PREFIXES.REFRESH_TOKEN}:${userId}:${jti}`;
}

export function buildUserSessionsCacheKey(userId: string): string {
  return `${config.redis_cache_key_prefix}:${AUTH_CONFIG.CACHE_PREFIXES.USER_SESSIONS}:${userId}`;
}

export function buildLoginLockCacheKey(userId: string): string {
  return `${config.redis_cache_key_prefix}:lock:login:${userId}`;
}
