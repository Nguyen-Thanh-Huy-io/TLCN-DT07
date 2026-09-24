import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/all-exception.filter';
import { EmailQueueService } from '../src/common/queues/email/email.queue';
import { RedisService } from '../src/common/services/redis.service';
import { PrismaService } from '../src/common/services/prisma.service';
import { CustomThrottlerGuard } from '../src/common/guards/custom-throttler.guard';
import { AuthUtilsService } from '../src/auth/services/auth-utils.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

describe('Auth & User E2E Tests (Automated Integration)', () => {
  let app: INestApplication;
  let redisService: RedisService;
  let prismaService: PrismaService;

  // Track state across steps
  const uniqueId = Date.now();
  const testEmail = `e2e_test_${uniqueId}@example.com`;
  const testUsername = `e2e_user_${uniqueId}`;
  const testPassword = 'Password@123';
  let accessToken = '';
  let refreshToken = '';
  let userId = '';

  // Mock EmailQueueService to avoid sending real emails via SMTP
  const mockEmailQueueService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  };

  jest.setTimeout(60000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailQueueService)
      .useValue(mockEmailQueueService)
      .overrideGuard(CustomThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();

    // Match main.ts global pipeline
    const winstonLogger = app.get(WINSTON_MODULE_PROVIDER);
    app.useGlobalFilters(new AllExceptionsFilter(winstonLogger));
    app.useGlobalInterceptors(new TransformInterceptor(winstonLogger));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    redisService = app.get<RedisService>(RedisService);
    prismaService = app.get<PrismaService>(PrismaService);
    const authUtilsService = app.get<AuthUtilsService>(AuthUtilsService);
    jest.spyOn(authUtilsService, 'checkRateLimit').mockResolvedValue(true);
  }, 60000);

  afterAll(async () => {
    // Cleanup created test data in database
    try {
      if (prismaService && prismaService.authUser) {
        await prismaService.authUser.deleteMany({
          where: { email: { contains: 'e2e_test_' } },
        });
      }
      if (app) {
        await app.close();
      }
    } catch (err) {
      console.error('Error during test cleanup:', err);
    }
  }, 60000);

  describe('1. Registration Flow', () => {
    it('Negative: Should fail registration if password does not meet criteria (Validation)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth')
        .send({
          email: 'invalid-email-format',
          username: 'usr',
          password: '123', // weak password
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('Positive: Should register new user and trigger verification email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth')
        .send({
          email: testEmail,
          username: testUsername,
          password: testPassword,
        })
        .expect(201);

      expect(response.body).toHaveProperty('statusCode', 201);
      expect(response.body).toHaveProperty('message', 'Success');
      expect(mockEmailQueueService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('Negative: Should fail when registering with already existing email', async () => {
      // Clear rate limit key for this email to isolate conflict test
      await redisService.del(`app:rate_limit:login:email:${testEmail}`);

      const response = await request(app.getHttpServer())
        .post('/auth')
        .send({
          email: testEmail,
          username: `another_${Date.now()}`,
          password: testPassword,
        })
        .expect(409); // Conflict

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.statusCode).toBe(409);
    });
  });

  describe('2. Email Verification Flow', () => {
    it('Negative: Should reject invalid/expired OTP code', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({
          email: testEmail,
          code: '000000',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.statusCode).toBe(400);
    });

    it('Positive: Should verify user email with OTP from Redis', async () => {
      // Retrieve the generated OTP stored in Redis: app:verification_token:{email}
      const verificationKey = `app:verification_token:${testEmail}`;
      const storedData = await redisService.get<{ code: string }>(verificationKey);
      expect(storedData).toBeDefined();
      expect(storedData?.code).toBeDefined();

      const response = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({
          email: testEmail,
          code: storedData!.code,
        })
        .expect(201);

      expect(response.body).toHaveProperty('statusCode', 201);
      expect(mockEmailQueueService.sendWelcomeEmail).toHaveBeenCalled();
    });
  });

  describe('3. Login Flow', () => {
    it('Negative: Should reject login with wrong password', async () => {
      // Clear rate limit key for login attempt
      await redisService.del(`app:rate_limit:login:email:${testEmail}`);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword@123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.statusCode).toBe(401);
    });

    it('Positive: Should login successfully and return Access & Refresh tokens', async () => {
      // Clear rate limit key for login attempt
      await redisService.del(`app:rate_limit:login:email:${testEmail}`);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(201);

      expect(response.body).toHaveProperty('data');
      const innerData = response.body.data.data || response.body.data;
      expect(innerData).toHaveProperty('accessToken');
      expect(innerData).toHaveProperty('refreshToken');
      expect(innerData).toHaveProperty('user');
      expect(innerData.user.email).toBe(testEmail);

      // Store tokens and ID for subsequent tests
      accessToken = innerData.accessToken;
      refreshToken = innerData.refreshToken;
      userId = innerData.user.id;
    });
  });

  describe('4. Token Refresh & Logout Flow', () => {
    it('Positive: Should refresh access token using valid refreshToken', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({
          refreshToken,
        })
        .expect(201);

      const innerData = response.body.data.data || response.body.data;
      expect(innerData).toHaveProperty('accessToken');
      expect(innerData).toHaveProperty('refreshToken');

      // Update tokens
      accessToken = innerData.accessToken;
      refreshToken = innerData.refreshToken;
    });

    it('Negative: Should reject refresh with invalid refreshToken', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({
          refreshToken: 'invalid.jwt.token',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.statusCode).toBe(401);
    });

    it('Positive: Should logout successfully and invalidate session', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({
          refreshToken,
          userId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('statusCode', 201);
    });
  });

  describe('5. Health Check & Metrics Flow', () => {
    it('Positive: Should return health status from root endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body.data).toBe('Hello World!');
    });

    it('Positive: Should return metrics from /metrics endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('http_requests_total');
    });
  });
});
