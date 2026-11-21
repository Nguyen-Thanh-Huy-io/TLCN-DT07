import { Injectable } from '@nestjs/common';
import { EmailStatus, EmailType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import AppError from '../common/errors/app.error';
import { EmailQueueService } from '../common/queues/email/email.queue';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { AUTH_CONFIG } from './config/auth.config';
import { CreateAuthDto } from './dto/create-auth.dto';
import { ILoginResponse } from './interfaces/auth.interface';
import { AuthLoginSecurityService } from './services/auth-login-security.service';
import { AuthSessionService } from './services/auth-session.service';
import {
  buildVerificationCacheKey,
  parseAuthExpiryToSeconds,
} from './services/auth-token-cache.util';
import { AuthUtilsService } from './services/auth-utils.service';
import { AuthVerificationService } from './services/auth-verification.service';

const LOG_CONTEXT = 'AuthService';
const LOCAL_PROVIDER = 'local';
const FAKE_BCRYPT_HASH =
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G4.4.G4.G4.G4.G';

@Injectable()
export class AuthService {
  constructor(
    private readonly authUtilsService: AuthUtilsService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly emailQueueService: EmailQueueService,
    private readonly customLogger: CustomLoggerService,
    private readonly authSessionService: AuthSessionService,
    private readonly authVerificationService: AuthVerificationService,
    private readonly authLoginSecurityService: AuthLoginSecurityService,
  ) {}

  async create(
    payload: CreateAuthDto,
    meta: { ip: string; userAgent: string; device?: string },
  ): Promise<void> {
    const { email, password, username } = payload;
    const { ip, userAgent } = meta;

    this.customLogger.log(
      `Registration attempt for email: ${email}, username: ${username}`,
      LOG_CONTEXT,
    );

    const { LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS } = AUTH_CONFIG.RATE_LIMIT;
    const { VERIFICATION } = AUTH_CONFIG.TOKEN_EXPIRY;

    await Promise.all([
      this.authUtilsService.checkRateLimit(
        `login:email:${email}`,
        LOGIN_MAX_ATTEMPTS,
        LOGIN_WINDOW_MS,
      ),
      this.authUtilsService.checkRateLimit(
        `login:ip:${ip}`,
        LOGIN_MAX_ATTEMPTS,
        LOGIN_WINDOW_MS,
      ),
    ]);

    if (!this.authUtilsService.validatePassword(password)) {
      throw AppError.badRequest('Password does not meet security requirements');
    }

    const existingUser = await this.prismaService.authUser.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        this.customLogger.warn(
          `Registration failed: Email already exists - ${email}`,
          LOG_CONTEXT,
        );
        throw AppError.conflict('Email already exists!');
      }
      if (existingUser.username === username) {
        this.customLogger.warn(
          `Registration failed: Username already exists - ${username}`,
          LOG_CONTEXT,
        );
        throw AppError.conflict('Username already exists!');
      }
    }

    const verificationCode = this.authUtilsService.generateVerificationCode();
    const expiresAt = new Date(
      Date.now() + parseAuthExpiryToSeconds(VERIFICATION) * 1000,
    );
    const hashedPassword = await bcrypt.hash(
      password,
      AUTH_CONFIG.BCRYPT_SALT_ROUNDS,
    );

    const newUser = await this.prismaService.$transaction(
      async (tx): Promise<{ id: string; email: string; username: string }> => {
        const user = await tx.authUser.create({
          data: {
            email,
            username,
            password: hashedPassword,
            role: 'USER',
            verified: false,
            status: 'ACTIVE',
            provider: LOCAL_PROVIDER,
          },
        });

        await tx.authSecurity.create({
          data: {
            authId: user.id,
            failedAttempts: 0,
            mfaEnabled: false,
            lastPasswordChange: new Date(),
          },
        });

        await tx.emailHistory.create({
          data: {
            authId: user.id,
            emailTo: email,
            emailType: EmailType.verification,
            subject: 'Verify your email address',
            messageId: `verify-${user.id}-${Date.now()}`,
            emailStatus: EmailStatus.pending,
            ipAddress: ip,
            userAgent: userAgent,
          },
        });

        return user;
      },
    );

    const verificationKey = buildVerificationCacheKey(email);
    const ttlSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

    await this.redisService.set(
      verificationKey,
      {
        code: verificationCode,
        userId: newUser.id,
        email: newUser.email,
        expiresAt: expiresAt.toISOString(),
      },
      ttlSeconds,
    );

    try {
      await this.emailQueueService.sendVerificationEmail(
        email,
        username,
        verificationCode,
        newUser.id,
      );
      this.customLogger.log(
        `User registered successfully: ${email}, verification email queued`,
        LOG_CONTEXT,
      );
    } catch (error) {
      this.customLogger.error(
        `Failed to queue verification email for ${email}`,
        error instanceof Error ? error.stack : undefined,
        LOG_CONTEXT,
      );
      await this.prismaService.emailHistory.updateMany({
        where: {
          authId: newUser.id,
          emailType: EmailType.verification,
          emailStatus: EmailStatus.pending,
        },
        data: {
          emailStatus: EmailStatus.failed,
          errorMessage:
            error instanceof Error ? error.message : 'Failed to queue email',
        },
      });
    }
  }

  verifyEmail(
    email: string,
    code: string,
    meta: { ip: string; userAgent: string },
  ): Promise<{ message: string }> {
    return this.authVerificationService.verifyEmail(email, code, meta);
  }

  resendVerificationEmail(
    email: string,
    meta: { ip: string; userAgent: string },
  ): Promise<{ message: string }> {
    return this.authVerificationService.resendVerificationEmail(email, meta);
  }

  async login(
    payload: { email: string; password: string },
    meta: { ip: string; userAgent: string; device?: string },
  ): Promise<ILoginResponse> {
    const { email, password } = payload;
    const { ip, userAgent, device } = meta;

    const { LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS } = AUTH_CONFIG.RATE_LIMIT;
    const { MAX_FAILED_ATTEMPTS, LOCKOUT_DURATION_MS } =
      AUTH_CONFIG.ACCOUNT_LOCKOUT;

    await Promise.all([
      this.authUtilsService.checkRateLimit(
        `login:email:${email}`,
        LOGIN_MAX_ATTEMPTS,
        LOGIN_WINDOW_MS,
      ),
      this.authUtilsService.checkRateLimit(
        `login:ip:${ip}`,
        LOGIN_MAX_ATTEMPTS,
        LOGIN_WINDOW_MS,
      ),
    ]);

    const user = await this.prismaService.authUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        role: true,
        verified: true,
        status: true,
        provider: true,
        tokenVersion: true,
        authSecurity: {
          select: {
            id: true,
            failedAttempts: true,
            lastFailedAt: true,
            lockExpiresAt: true,
          },
        },
      },
    });

    const invalidCredentialsError = AppError.unauthorized(
      'Invalid email or password',
    );

    if (!user) {
      await bcrypt.compare(password, FAKE_BCRYPT_HASH);
      void this.authLoginSecurityService.logLoginAttempt({
        authId: null,
        ip,
        userAgent,
        device,
        success: false,
        failureReason: 'user_not_found',
      });
      throw invalidCredentialsError;
    }

    if (user.provider !== LOCAL_PROVIDER) {
      throw AppError.badRequest(
        `Please login using ${user.provider} authentication`,
      );
    }

    await this.authLoginSecurityService.validateAccountStatusAndLockout(
      user,
      meta,
      password,
      invalidCredentialsError,
    );

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.authLoginSecurityService.handleFailedLoginAttempt(
        user.id,
        user.authSecurity?.failedAttempts || 0,
        MAX_FAILED_ATTEMPTS,
        LOCKOUT_DURATION_MS,
        { ip, userAgent, device },
      );
      throw invalidCredentialsError;
    }

    const sessionTokens = await this.authSessionService.issueLoginSession(
      user,
      meta,
    );
    this.authLoginSecurityService.recordSuccessfulLogin(
      user.id,
      user.authSecurity?.id ?? null,
      meta,
    );

    return {
      ...sessionTokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        verified: user.verified,
      },
    };
  }

  refreshToken(
    refreshToken: string,
    meta: { ip: string; userAgent: string; device?: string },
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    return this.authSessionService.refreshToken(refreshToken, meta);
  }

  logout(refreshToken: string, userId: string): Promise<{ message: string }> {
    return this.authSessionService.logout(refreshToken, userId);
  }

  logoutAllDevices(userId: string): Promise<{ message: string }> {
    return this.authSessionService.logoutAllDevices(userId);
  }

  incrementTokenVersion(userId: string): Promise<void> {
    return this.authSessionService.incrementTokenVersion(userId);
  }
}
