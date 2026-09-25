import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Query,
  Res,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { GoogleOAuthService } from './services/google-oauth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import {
  VerifyEmailDto,
  ResendVerificationEmailDto,
  LoginDto,
  RefreshTokenDto,
  LogoutDto,
  LogoutAllDto,
} from './dto/auth-request.dto';
import {
  GoogleOAuthInitDto,
  GoogleOAuthCallbackDto,
} from './dto/google-oauth.dto';
import type { Request, Response } from 'express';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { THROTTLER_CONFIG } from '../common/config/throttler.config';
import { ApiResponseDecorator } from '../common/decorators';

@ApiTags('Auth - Xác thực & Phân quyền')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly customLogger: CustomLoggerService,
  ) {}

  // Strict rate limit for registration: 5 requests per 15 minutes
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponseDecorator(
    201,
    'User registered successfully. Verification email sent.',
  )
  @Throttle({ default: THROTTLER_CONFIG.AUTH })
  @Post()
  create(@Body() payload: CreateAuthDto, @Req() req: Request) {
    this.customLogger.log(
      `Registration attempt for email: ${payload.email}`,
      'AuthController',
    );
    const meta = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      device:
        (Array.isArray(req.headers['x-device'])
          ? req.headers['x-device'][0]
          : req.headers['x-device']) ||
        (Array.isArray(req.headers['x-device-id'])
          ? req.headers['x-device-id'][0]
          : req.headers['x-device-id']) ||
        (Array.isArray(req.headers['sec-ch-ua-platform'])
          ? req.headers['sec-ch-ua-platform'][0]
          : req.headers['sec-ch-ua-platform']),
    };
    return this.authService.create(payload, meta);
  }

  // Strict rate limit for verification: 5 requests per 15 minutes
  @ApiOperation({ summary: 'Verify email with 6-digit OTP code' })
  @ApiResponseDecorator(200, 'Email verified successfully')
  @Throttle({ default: THROTTLER_CONFIG.AUTH })
  @Post('verify-email')
  verifyEmail(@Body() body: VerifyEmailDto, @Req() req: Request) {
    this.customLogger.log(
      `Email verification attempt for: ${body.email}`,
      'AuthController',
    );
    const meta = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };
    return this.authService.verifyEmail(body.email, body.code, meta);
  }

  // Strict rate limit: 5 requests per 15 minutes
  @ApiOperation({ summary: 'Resend email verification OTP' })
  @ApiResponseDecorator(200, 'Verification email resent successfully')
  @Throttle({ default: THROTTLER_CONFIG.AUTH })
  @Post('resend-verification-email')
  resendVerificationEmail(
    @Body() body: ResendVerificationEmailDto,
    @Req() req: Request,
  ) {
    const meta = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };
    return this.authService.resendVerificationEmail(body.email, meta);
  }

  // ==========================================
  // Google OAuth Endpoints
  // ==========================================

  /**
   * Initiate Google OAuth flow
   * Returns the Google authorization URL for the client to redirect to
   *
   * @example GET /auth/google
   * @example GET /auth/google?redirectUrl=http://localhost:3000/dashboard
   */
  @ApiOperation({ summary: 'Initiate Google OAuth 2.0 flow' })
  @ApiResponseDecorator(200, 'Returns Google authorization URL and state')
  @Get('google')
  async googleOAuthInit(
    @Query() query: GoogleOAuthInitDto,
    @Req() req: Request,
  ) {
    this.customLogger.log(
      'Google OAuth initialization requested',
      'AuthController',
    );

    const meta = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };

    const { url, state } = await this.googleOAuthService.getAuthorizationUrl(
      meta,
      query.redirectUrl,
    );

    return {
      url,
      state,
      message: 'Redirect to the provided URL to authenticate with Google',
    };
  }

  /**
   * Google OAuth callback handler
   * This endpoint is called by Google after user authentication
   *
   * For browser-based flows, this redirects to the frontend
   * For API-based flows, returns JSON with tokens
   */
  @ApiOperation({
    summary: 'Google OAuth callback handler (GET for web redirects)',
  })
  @ApiResponseDecorator(200, 'Google authentication successful')
  @Get('google/callback')
  async googleOAuthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Req() req: Request,

    @Res({ passthrough: true }) res: Response,
  ) {
    // Handle OAuth errors
    if (error) {
      this.customLogger.warn(
        `Google OAuth error: ${error} - ${errorDescription}`,
        'AuthController',
      );
      Logger.warn(
        `Google OAuth error: ${error} - ${errorDescription}`,
        'AuthController',
      );

      // For browser redirect, you might want to redirect to an error page
      return {
        success: false,
        error,
        errorDescription,
        message: 'Google authentication failed',
      };
    }

    if (!code || !state) {
      return {
        success: false,
        error: 'missing_parameters',
        message: 'Missing authorization code or state parameter',
      };
    }

    this.customLogger.log('Google OAuth callback received', 'AuthController');
    Logger.log('Google OAuth callback received', 'AuthController');

    const meta = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      device:
        (Array.isArray(req.headers['x-device'])
          ? req.headers['x-device'][0]
          : req.headers['x-device']) ||
        (Array.isArray(req.headers['x-device-id'])
          ? req.headers['x-device-id'][0]
          : req.headers['x-device-id']) ||
        (Array.isArray(req.headers['sec-ch-ua-platform'])
          ? req.headers['sec-ch-ua-platform'][0]
          : req.headers['sec-ch-ua-platform']),
    };

    const result = await this.googleOAuthService.handleCallback(
      code,
      state,
      meta,
    );

    // If redirectUrl is provided, redirect to it with tokens as query params
    if (result.redirectUrl) {
      const redirectUrl = new URL(result.redirectUrl);
      redirectUrl.searchParams.set('access_token', result.accessToken);
      redirectUrl.searchParams.set('refresh_token', result.refreshToken);
      redirectUrl.searchParams.set('user_id', result.user.id);
      redirectUrl.searchParams.set('email', result.user.email);
      redirectUrl.searchParams.set('is_new_user', result.isNewUser.toString());

      return res.redirect(redirectUrl.toString());
    }

    // Otherwise return JSON response
    return {
      success: true,
      message: result.isNewUser
        ? 'Account created successfully via Google'
        : 'Signed in successfully via Google',
      data: result,
    };
  }

  /**
   * Alternative POST endpoint for Google OAuth callback
   * Useful for mobile apps or SPAs that handle the callback differently
   */
  @ApiOperation({
    summary: 'Google OAuth callback handler (POST for mobile/SPA API)',
  })
  @ApiResponseDecorator(200, 'Google authentication successful')
  @Post('google/callback')
  async googleOAuthCallbackPost(
    @Body() body: GoogleOAuthCallbackDto,
    @Req() req: Request,
  ) {
    this.customLogger.log(
      'Google OAuth callback (POST) received',
      'AuthController',
    );

    const meta = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      device:
        (Array.isArray(req.headers['x-device'])
          ? req.headers['x-device'][0]
          : req.headers['x-device']) ||
        (Array.isArray(req.headers['x-device-id'])
          ? req.headers['x-device-id'][0]
          : req.headers['x-device-id']) ||
        (Array.isArray(req.headers['sec-ch-ua-platform'])
          ? req.headers['sec-ch-ua-platform'][0]
          : req.headers['sec-ch-ua-platform']),
    };

    const result = await this.googleOAuthService.handleCallback(
      body.code,
      body.state,
      meta,
    );

    return {
      success: true,
      message: result.isNewUser
        ? 'Account created successfully via Google'
        : 'Signed in successfully via Google',
      data: result,
    };
  }

  // ==========================================
  // Login/Logout Endpoints
  // ==========================================

  /**
   * Login with email and password
   */
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiResponseDecorator(200, 'Login successful, returns tokens')
  // Strict rate limit for login: 5 requests per 15 minutes per IP
  @Throttle({ default: THROTTLER_CONFIG.AUTH })
  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: Request) {
    this.customLogger.log(
      `Login attempt for email: ${body.email}`,
      'AuthController',
    );

    const meta = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      device:
        (Array.isArray(req.headers['x-device'])
          ? req.headers['x-device'][0]
          : req.headers['x-device']) ||
        (Array.isArray(req.headers['x-device-id'])
          ? req.headers['x-device-id'][0]
          : req.headers['x-device-id']) ||
        (Array.isArray(req.headers['sec-ch-ua-platform'])
          ? req.headers['sec-ch-ua-platform'][0]
          : req.headers['sec-ch-ua-platform']),
    };

    const result = await this.authService.login(
      { email: body.email, password: body.password },
      meta,
    );

    return {
      success: true,
      message: 'Login successful',
      data: result,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  @ApiOperation({ summary: 'Refresh access token using valid refresh token' })
  @ApiResponseDecorator(200, 'Token refreshed successfully')
  @Post('refresh-token')
  async refreshToken(@Body() body: RefreshTokenDto, @Req() req: Request) {
    this.customLogger.log('Token refresh requested', 'AuthController');

    const meta = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      device:
        (Array.isArray(req.headers['x-device'])
          ? req.headers['x-device'][0]
          : req.headers['x-device']) ||
        (Array.isArray(req.headers['x-device-id'])
          ? req.headers['x-device-id'][0]
          : req.headers['x-device-id']) ||
        (Array.isArray(req.headers['sec-ch-ua-platform'])
          ? req.headers['sec-ch-ua-platform'][0]
          : req.headers['sec-ch-ua-platform']),
    };

    const result = await this.authService.refreshToken(body.refreshToken, meta);

    return {
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    };
  }

  /**
   * Logout current session
   */
  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponseDecorator(200, 'Logged out successfully')
  @Post('logout')
  async logout(
    @Body() body: LogoutDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Req() req: Request,
  ) {
    this.customLogger.log('Logout requested', 'AuthController');

    const result = await this.authService.logout(
      body.refreshToken,
      body.userId,
    );

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Logout from all devices
   */
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponseDecorator(200, 'Logged out from all devices successfully')
  @Post('logout-all')
  async logoutAll(@Body() body: LogoutAllDto) {
    this.customLogger.log(
      `Logout all devices requested for user: ${body.userId}`,
      'AuthController',
    );

    const result = await this.authService.logoutAllDevices(body.userId);

    return {
      success: true,
      ...result,
    };
  }
}
