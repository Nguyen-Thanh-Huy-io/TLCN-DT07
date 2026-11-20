import { Injectable } from '@nestjs/common';
import { EmailStatus, EmailType } from '@prisma/client';
import AppError from '../../common/errors/app.error';
import { EmailQueueService } from '../../common/queues/email/email.queue';
import { CustomLoggerService } from '../../common/services/custom-logger.service';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { AUTH_CONFIG } from '../config/auth.config';
import { AuthUtilsService } from './auth-utils.service';
import {
  buildVerificationCacheKey,
  parseAuthExpiryToSeconds,
} from './auth-token-cache.util';

const LOG_CONTEXT = 'AuthService';
const RESEND_MAX_ATTEMPTS = 3;
const RESEND_WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class AuthVerificationService {
  constructor(
    private readonly authUtilsService: AuthUtilsService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly emailQueueService: EmailQueueService,
    private readonly customLogger: CustomLoggerService,
  ) {}

  /**
   * Verify user email with verification code
   */
  async verifyEmail(
    email: string,
    code: string,
    meta: { ip: string; userAgent: string },
  ): Promise<{ message: string }> {
    this.customLogger.log(
      `Email verification attempt for: ${email} (ip: ${meta.ip})`,
      LOG_CONTEXT,
    );
    const verificationKey = buildVerificationCacheKey(email);

    // Get verification data from Redis
    const verificationData = await this.redisService.get<{
      code: string;
      userId: string;
      email: string;
      expiresAt: string;
    }>(verificationKey);

    if (!verificationData) {
      this.customLogger.warn(
        `Verification failed: Code expired or invalid for ${email}`,
        LOG_CONTEXT,
      );
      throw AppError.badRequest(
        'Verification code expired or invalid. Please request a new code.',
      );
    }

    // Validate code
    if (verificationData.code !== code) {
      this.customLogger.warn(
        `Verification failed: Invalid code for ${email}`,
        LOG_CONTEXT,
      );
      throw AppError.badRequest('Invalid verification code');
    }

    // Find user
    const user = await this.prismaService.authUser.findUnique({
      where: { email },
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    if (user.verified) {
      throw AppError.badRequest('Email already verified');
    }

    // Update user as verified
    await this.prismaService.$transaction(async (tx) => {
      await tx.authUser.update({
        where: { id: user.id },
        data: { verified: true },
      });
    });

    // Delete verification code from Redis
    await this.redisService.del(verificationKey);

    // Queue welcome email for async processing
    try {
      await this.emailQueueService.sendWelcomeEmail(
        email,
        user.username,
        user.id,
      );
      this.customLogger.log(
        `Email verified successfully for: ${email}, welcome email queued`,
        LOG_CONTEXT,
      );
    } catch (error) {
      this.customLogger.error(
        `Verification successful but failed to queue welcome email for ${email}`,
        error instanceof Error ? error.stack : undefined,
        LOG_CONTEXT,
      );
      // Don't throw, verification is successful
    }

    return { message: 'Email verified successfully' };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(
    email: string,
    meta: { ip: string; userAgent: string },
  ): Promise<{ message: string }> {
    const { ip, userAgent } = meta;
    const { VERIFICATION } = AUTH_CONFIG.TOKEN_EXPIRY;

    this.customLogger.log(
      `Resend verification email requested for: ${email}`,
      LOG_CONTEXT,
    );

    // Check rate limiting
    await this.authUtilsService.checkRateLimit(
      `resend:verification:${email}`,
      RESEND_MAX_ATTEMPTS,
      RESEND_WINDOW_MS,
    );

    // Find user
    const user = await this.prismaService.authUser.findUnique({
      where: { email },
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    if (user.verified) {
      throw AppError.badRequest('Email already verified');
    }

    // Generate new verification code
    const verificationCode = this.authUtilsService.generateVerificationCode();
    const expiresAt = new Date(
      Date.now() + parseAuthExpiryToSeconds(VERIFICATION) * 1000,
    );

    // Store new verification code in Redis
    const verificationKey = buildVerificationCacheKey(email);
    const ttlSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

    await this.redisService.set(
      verificationKey,
      {
        code: verificationCode,
        userId: user.id,
        email: user.email,
        expiresAt: expiresAt.toISOString(),
      },
      ttlSeconds,
    );

    // Create new email history record
    await this.prismaService.emailHistory.create({
      data: {
        authId: user.id,
        emailTo: email,
        emailType: EmailType.verification,
        subject: 'Verify your email address',
        messageId: `verify-resend-${user.id}-${Date.now()}`,
        emailStatus: EmailStatus.pending,
        ipAddress: ip,
        userAgent: userAgent,
      },
    });

    // Queue verification email for async processing
    try {
      await this.emailQueueService.sendVerificationEmail(
        email,
        user.username,
        verificationCode,
        user.id,
      );
    } catch (error) {
      this.customLogger.error(
        `Failed to queue verification email for ${email}`,
        error instanceof Error ? error.stack : undefined,
        LOG_CONTEXT,
      );
      // Update email history status to 'failed'
      await this.prismaService.emailHistory.updateMany({
        where: {
          authId: user.id,
          emailType: EmailType.verification,
          emailStatus: EmailStatus.pending,
        },
        data: {
          emailStatus: EmailStatus.failed,
          errorMessage:
            error instanceof Error ? error.message : 'Failed to queue email',
        },
      });
      throw AppError.badRequest('Failed to send verification email');
    }

    return { message: 'Verification email sent successfully' };
  }
}
