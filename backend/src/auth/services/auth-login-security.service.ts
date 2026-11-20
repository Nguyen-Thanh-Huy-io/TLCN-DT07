import { Injectable } from '@nestjs/common';
import { LoginAction, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import AppError from '../../common/errors/app.error';
import { CustomLoggerService } from '../../common/services/custom-logger.service';
import { PrismaService } from '../../common/services/prisma.service';
import { AuthSessionService } from './auth-session.service';

const LOG_CONTEXT = 'AuthService';

export interface LoginAccountCandidate {
  id: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  verified: boolean;
  status: UserStatus;
  provider: string;
  tokenVersion: number;
  authSecurity?: {
    id: string;
    failedAttempts: number;
    lastFailedAt: Date | null;
    lockExpiresAt: Date | null;
  } | null;
}

export interface LoginAttemptLogInput {
  authId: string | null;
  ip: string;
  userAgent: string;
  device?: string;
  success: boolean;
  failureReason?: string;
  attemptNumber?: number;
  isSuspicious?: boolean;
}

@Injectable()
export class AuthLoginSecurityService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authSessionService: AuthSessionService,
    private readonly customLogger: CustomLoggerService,
  ) {}

  async validateAccountStatusAndLockout(
    user: LoginAccountCandidate,
    meta: { ip: string; userAgent: string; device?: string },
    password: string,
    invalidCredentialsError: Error,
  ): Promise<void> {
    const { ip, userAgent, device } = meta;

    if (
      user.status === UserStatus.BLOCKED ||
      user.status === UserStatus.SUSPENDED
    ) {
      void this.logLoginAttempt({
        authId: user.id,
        ip,
        userAgent,
        device,
        success: false,
        failureReason: `account_${user.status.toLowerCase()}`,
      });
      throw AppError.forbidden(
        `Your account has been ${user.status.toLowerCase()}. Please contact support.`,
      );
    }

    if (
      user.status === UserStatus.DELETED ||
      user.status === UserStatus.INACTIVE
    ) {
      await bcrypt.compare(password, user.password);
      throw invalidCredentialsError;
    }

    const security = user.authSecurity;
    if (security?.lockExpiresAt && new Date() < security.lockExpiresAt) {
      const remainingTime = Math.ceil(
        (security.lockExpiresAt.getTime() - Date.now()) / 1000 / 60,
      );
      void this.logLoginAttempt({
        authId: user.id,
        ip,
        userAgent,
        device,
        success: false,
        failureReason: 'account_locked',
        attemptNumber: security.failedAttempts + 1,
      });
      throw AppError.forbidden(
        `Account is temporarily locked. Please try again in ${remainingTime} minutes.`,
      );
    }

    // Người học (USER) được đăng nhập và học ngay; nhân sự CMS vẫn bắt buộc xác minh email.
    if (!user.verified && user.role !== UserRole.USER) {
      void this.logLoginAttempt({
        authId: user.id,
        ip,
        userAgent,
        device,
        success: false,
        failureReason: 'email_not_verified',
      });
      throw AppError.forbidden(
        'Please verify your email address before logging in',
      );
    }
  }

  async handleFailedLoginAttempt(
    userId: string,
    currentFailedAttempts: number,
    maxAttempts: number,
    lockoutDuration: number,
    meta: { ip: string; userAgent: string; device?: string },
  ): Promise<void> {
    const newFailedAttempts = currentFailedAttempts + 1;
    const shouldLock = newFailedAttempts >= maxAttempts;

    const failure = {
      failedAttempts: newFailedAttempts,
      lastFailedAt: new Date(),
      ...(shouldLock && {
        lockExpiresAt: new Date(Date.now() + lockoutDuration),
      }),
    };

    await Promise.all([
      // Tài khoản tạo qua seed / OAuth có thể chưa có dòng authSecurity: update trần sẽ ném P2025 (404).
      this.prismaService.authSecurity.upsert({
        where: { authId: userId },
        update: failure,
        create: { authId: userId, ...failure },
      }),
      this.logLoginAttempt({
        authId: userId,
        ip: meta.ip,
        userAgent: meta.userAgent,
        device: meta.device,
        success: false,
        failureReason: shouldLock ? 'account_locked' : 'invalid_password',
        attemptNumber: newFailedAttempts,
      }),
    ]);

    if (shouldLock) {
      await this.authSessionService.incrementTokenVersion(userId);
    }
  }

  recordSuccessfulLogin(
    userId: string,
    securityId: string | null,
    meta: { ip: string; userAgent: string; device?: string },
  ): void {
    void Promise.allSettled([
      securityId
        ? this.prismaService.authSecurity.update({
            where: { id: securityId },
            data: {
              failedAttempts: 0,
              lastFailedAt: null,
              lockExpiresAt: null,
            },
          })
        : Promise.resolve(),
      this.logLoginAttempt({
        authId: userId,
        ip: meta.ip,
        userAgent: meta.userAgent,
        device: meta.device,
        success: true,
      }),
    ]).then((results) => {
      results.forEach((result) => {
        if (result.status === 'rejected') {
          this.customLogger.error(
            'Non-critical login post-process failed',
            result.reason instanceof Error
              ? result.reason.stack
              : String(result.reason),
            LOG_CONTEXT,
          );
        }
      });
    });
  }

  logLoginAttempt(data: LoginAttemptLogInput): Promise<void> {
    if (!data.authId) {
      return Promise.resolve();
    }

    return this.prismaService.loginHistory
      .create({
        data: {
          authId: data.authId,
          ipAddress: data.ip,
          userAgent: data.userAgent,
          device_id: data.device,
          action: LoginAction.login,
          success: data.success,
          failureReason: data.failureReason,
          attemptNumber: data.attemptNumber || 1,
          isSuspicious: data.isSuspicious || false,
        },
      })
      .then(() => undefined)
      .catch((error) => {
        this.customLogger.error(
          'Failed to log login attempt',
          error instanceof Error ? error.stack : String(error),
          LOG_CONTEXT,
        );
      });
  }
}
