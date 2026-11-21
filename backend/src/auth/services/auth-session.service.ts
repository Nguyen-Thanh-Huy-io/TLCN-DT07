import { Injectable } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { tokenVersionCacheKey } from '../../common/constants/cache-keys.constant';
import AppError from '../../common/errors/app.error';
import { CustomLoggerService } from '../../common/services/custom-logger.service';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { AUTH_CONFIG } from '../config/auth.config';
import { IStoredRefreshToken } from '../interfaces/auth.interface';
import { AuthUtilsService } from './auth-utils.service';
import {
  buildLoginLockCacheKey,
  buildRefreshTokenCacheKey,
  buildUserSessionsCacheKey,
  parseAuthExpiryToSeconds,
} from './auth-token-cache.util';

const LOG_CONTEXT = 'AuthService';
const LOGIN_LOCK_TTL_SECONDS = 5;

export interface SessionTokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SessionIssueUser {
  id: string;
  role: UserRole;
  tokenVersion: number;
}

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly authUtilsService: AuthUtilsService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly customLogger: CustomLoggerService,
  ) {}

  /**
   * Create and track access + refresh tokens for an authenticated user under a distributed login lock.
   */
  async issueLoginSession(
    user: SessionIssueUser,
    meta: { ip: string; userAgent: string; device?: string },
  ): Promise<SessionTokenPair> {
    const { ip, userAgent, device } = meta;
    const lockKey = buildLoginLockCacheKey(user.id);
    const lockAcquired = await this.redisService.setNX(
      lockKey,
      '1',
      LOGIN_LOCK_TTL_SECONDS,
    );

    if (!lockAcquired) {
      throw AppError.conflict(
        'Another login is in progress. Please try again in a moment.',
      );
    }

    try {
      const jti: string = this.authUtilsService.generateSecureId();
      const accessToken: string = this.authUtilsService.createAccessToken({
        userId: user.id,
        role: user.role,
        tokenVersion: user.tokenVersion,
      });
      const refreshToken: string = this.authUtilsService.createRefreshToken(
        { userId: user.id },
        jti,
      );
      const tokenHash: string = this.authUtilsService.hashToken(refreshToken);
      const refreshTokenTTL = parseAuthExpiryToSeconds(
        AUTH_CONFIG.TOKEN_EXPIRY.REFRESH,
      );
      const refreshTokenKey = buildRefreshTokenCacheKey(user.id, jti);

      const storedTokenData: IStoredRefreshToken = {
        userId: user.id,
        jti,
        tokenHash,
        ip,
        userAgent,
        device,
        createdAt: new Date().toISOString(),
      };

      // RedisService.set nuốt lỗi và trả false, nên phải kiểm giá trị trả về.
      const tokenStored = await this.redisService.set(
        refreshTokenKey,
        storedTokenData,
        refreshTokenTTL,
      );
      if (!tokenStored) {
        this.customLogger.error(
          `Failed to store refresh token in Redis for user ${user.id}`,
          undefined,
          LOG_CONTEXT,
        );
        throw AppError.serviceUnavailable(
          'Authentication service temporarily unavailable. Please try again.',
        );
      }

      await this.trackLoginSessionWithRollback(
        user.id,
        jti,
        refreshTokenKey,
        refreshTokenTTL,
      );
      await this.safeEnforceMaxDevices(user.id);

      return {
        accessToken,
        refreshToken,
        expiresIn: parseAuthExpiryToSeconds(AUTH_CONFIG.TOKEN_EXPIRY.ACCESS),
      };
    } finally {
      await this.redisService.del(lockKey);
    }
  }

  /**
   * Refresh access token using refresh token. Implements token rotation for security.
   */
  async refreshToken(
    refreshToken: string,
    meta: { ip: string; userAgent: string; device?: string },
  ): Promise<SessionTokenPair> {
    const { ip, userAgent, device } = meta;
    const { userId, jti } = this.decodeVerifiedRefreshToken(refreshToken);

    const refreshTokenKey = buildRefreshTokenCacheKey(userId, jti);
    const storedData =
      await this.redisService.get<IStoredRefreshToken>(refreshTokenKey);

    if (!storedData) {
      // Token not found - possibly already rotated or revoked
      await this.revokeAllUserTokens(userId);
      throw AppError.unauthorized(
        'Refresh token has been revoked. Please login again.',
      );
    }

    const tokenHash: string = this.authUtilsService.hashToken(refreshToken);
    if (storedData.tokenHash !== tokenHash) {
      // Token mismatch - potential attack, revoke all tokens
      await this.revokeAllUserTokens(userId);
      throw AppError.unauthorized('Invalid refresh token');
    }

    const user = await this.prismaService.authUser.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true, tokenVersion: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      await this.revokeAllUserTokens(userId);
      throw AppError.unauthorized('User account is not active');
    }

    const newJti: string = this.authUtilsService.generateSecureId();
    const newAccessToken: string = this.authUtilsService.createAccessToken({
      userId: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });
    const newRefreshToken: string = this.authUtilsService.createRefreshToken(
      { userId: user.id },
      newJti,
    );
    const newTokenHash: string =
      this.authUtilsService.hashToken(newRefreshToken);
    const refreshTokenTTL = parseAuthExpiryToSeconds(
      AUTH_CONFIG.TOKEN_EXPIRY.REFRESH,
    );
    const newRefreshTokenKey = buildRefreshTokenCacheKey(userId, newJti);

    const newStoredData: IStoredRefreshToken = {
      userId,
      jti: newJti,
      tokenHash: newTokenHash,
      ip,
      userAgent,
      device,
      createdAt: new Date().toISOString(),
      rotatedFrom: jti,
    };

    // removeUserSession và addUserSession cùng đọc-ghi danh sách phiên: chạy song song thì ghi đè nhau.
    await this.redisService.del(refreshTokenKey);
    await this.removeUserSession(userId, jti);
    await this.redisService.set(
      newRefreshTokenKey,
      newStoredData,
      refreshTokenTTL,
    );
    await this.addUserSession(userId, newJti, refreshTokenTTL);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: parseAuthExpiryToSeconds(AUTH_CONFIG.TOKEN_EXPIRY.ACCESS),
    };
  }

  /**
   * Logout user by revoking their refresh token.
   */
  async logout(
    refreshToken: string,
    userId: string,
  ): Promise<{ message: string }> {
    let decoded: { userId: string; jti?: string };
    try {
      decoded = this.authUtilsService.verifyRefreshToken(refreshToken);
    } catch {
      return { message: 'Logged out successfully' };
    }

    if (decoded.userId !== userId) {
      throw AppError.unauthorized('Invalid token');
    }

    const { jti } = decoded;
    if (jti) {
      const refreshTokenKey = buildRefreshTokenCacheKey(userId, jti);
      await Promise.all([
        this.redisService.del(refreshTokenKey),
        this.removeUserSession(userId, jti),
      ]);
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from all devices by revoking all refresh tokens and incrementing tokenVersion.
   */
  async logoutAllDevices(userId: string): Promise<{ message: string }> {
    await this.revokeAllUserTokens(userId);
    await this.incrementTokenVersion(userId);
    return { message: 'Logged out from all devices successfully' };
  }

  /**
   * Increment token version for a user to immediately invalidate all access tokens.
   */
  async incrementTokenVersion(userId: string): Promise<void> {
    await this.prismaService.authUser.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    await this.redisService.del(tokenVersionCacheKey(userId));
    this.customLogger.log(
      `Token version incremented for user ${userId}`,
      `${LOG_CONTEXT}.incrementTokenVersion`,
    );
  }

  private decodeVerifiedRefreshToken(refreshToken: string): {
    userId: string;
    jti: string;
  } {
    let decoded: { userId: string; jti: string };
    try {
      const payload = this.authUtilsService.verifyRefreshToken(refreshToken);
      if (!payload.jti) {
        throw new Error('Missing JTI in token');
      }
      decoded = { userId: payload.userId, jti: payload.jti };
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    if (!decoded.userId || !decoded.jti) {
      throw AppError.unauthorized('Invalid refresh token payload');
    }
    return decoded;
  }

  private async trackLoginSessionWithRollback(
    userId: string,
    jti: string,
    refreshTokenKey: string,
    refreshTokenTTL: number,
  ): Promise<void> {
    try {
      await this.addUserSession(userId, jti, refreshTokenTTL);
    } catch (error) {
      this.customLogger.error(
        `Failed to add user session to Redis for user ${userId}`,
        error instanceof Error ? error.stack : String(error),
        LOG_CONTEXT,
      );
      await this.redisService.del(refreshTokenKey).catch((rollbackError) => {
        this.customLogger.error(
          `CRITICAL: Failed to rollback refresh token for user ${userId}`,
          rollbackError instanceof Error
            ? rollbackError.stack
            : String(rollbackError),
          LOG_CONTEXT,
        );
      });
      throw AppError.serviceUnavailable(
        'Authentication service temporarily unavailable. Please try again.',
      );
    }
  }

  private async safeEnforceMaxDevices(userId: string): Promise<void> {
    try {
      await this.enforceMaxDevices(
        userId,
        AUTH_CONFIG.SESSION.MAX_DEVICES_PER_USER,
      );
    } catch (error) {
      this.customLogger.error(
        `Failed to enforce max devices (non-critical) for user ${userId}`,
        error instanceof Error ? error.stack : String(error),
        LOG_CONTEXT,
      );
    }
  }

  private async addUserSession(
    userId: string,
    jti: string,
    ttl: number,
  ): Promise<void> {
    const userSessionsKey = buildUserSessionsCacheKey(userId);
    const sessions =
      (await this.redisService.get<string[]>(userSessionsKey)) || [];
    sessions.push(jti);
    await this.redisService.set(userSessionsKey, sessions, ttl);
  }

  private async removeUserSession(userId: string, jti: string): Promise<void> {
    const userSessionsKey = buildUserSessionsCacheKey(userId);
    const sessions =
      (await this.redisService.get<string[]>(userSessionsKey)) || [];
    const updatedSessions = sessions.filter((s) => s !== jti);

    if (updatedSessions.length > 0) {
      const ttl = parseAuthExpiryToSeconds(AUTH_CONFIG.TOKEN_EXPIRY.REFRESH);
      await this.redisService.set(userSessionsKey, updatedSessions, ttl);
    } else {
      await this.redisService.del(userSessionsKey);
    }
  }

  private async enforceMaxDevices(
    userId: string,
    maxDevices: number,
  ): Promise<void> {
    const userSessionsKey = buildUserSessionsCacheKey(userId);
    const sessions =
      (await this.redisService.get<string[]>(userSessionsKey)) || [];

    if (sessions.length <= maxDevices) {
      return;
    }

    const excess = sessions.length - maxDevices;
    const sessionsToRemove = sessions.slice(0, excess);

    await Promise.all(
      sessionsToRemove.map(async (jti) => {
        const tokenKey = buildRefreshTokenCacheKey(userId, jti);
        await this.redisService.del(tokenKey);
      }),
    );

    const updatedSessions = sessions.slice(excess);
    const ttl = parseAuthExpiryToSeconds(AUTH_CONFIG.TOKEN_EXPIRY.REFRESH);
    await this.redisService.set(userSessionsKey, updatedSessions, ttl);
  }

  private async revokeAllUserTokens(userId: string): Promise<void> {
    const userSessionsKey = buildUserSessionsCacheKey(userId);
    const sessions =
      (await this.redisService.get<string[]>(userSessionsKey)) || [];

    await Promise.all([
      ...sessions.map((jti) => {
        const tokenKey = buildRefreshTokenCacheKey(userId, jti);
        return this.redisService.del(tokenKey);
      }),
      this.redisService.del(userSessionsKey),
    ]);
  }
}
