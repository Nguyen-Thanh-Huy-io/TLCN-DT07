import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AuthUtilsService } from './services/auth-utils.service';
import { AuthSessionService } from './services/auth-session.service';
import { AuthVerificationService } from './services/auth-verification.service';
import { AuthLoginSecurityService } from './services/auth-login-security.service';
import { GoogleOAuthService } from './services/google-oauth.service';
import { PrismaService } from '../common/services/prisma.service';
import { EmailService } from '../common/services/email.service';
import { RedisService } from '../common/services/redis.service';
import { QueueModule } from '../common/modules';

@Module({
  imports: [QueueModule],
  controllers: [AuthController, AccountController],
  providers: [
    AuthService,
    AuthSessionService,
    AuthVerificationService,
    AuthLoginSecurityService,
    AccountService,
    AuthUtilsService,
    GoogleOAuthService,
    PrismaService,
    EmailService,
    RedisService,
  ],
  exports: [AuthUtilsService, GoogleOAuthService, AccountService],
})
export class AuthModule {}
