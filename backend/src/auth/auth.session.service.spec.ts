import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { userRole, userStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { EmailQueueService } from '../common/queues/email/email.queue';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { AuthService } from './auth.service';
import { AUTH_CONFIG } from './config/auth.config';
import { AuthUtilsService } from './services/auth-utils.service';

const PASSWORD = 'Dung@1234';
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 4);
const META = { ip: '10.0.0.1', userAgent: 'jest', device: 'pc' };
const MAX_DEVICES = AUTH_CONFIG.SESSION.MAX_DEVICES_PER_USER;
const TOKEN_KEY = AUTH_CONFIG.CACHE_PREFIXES.REFRESH_TOKEN;
const SESSIONS_KEY = AUTH_CONFIG.CACHE_PREFIXES.USER_SESSIONS;

const localUser = (overrides: object = {}) => ({
  id: 'u-1',
  email: 'hoc-vien@hisgo.test',
  username: 'hoc-vien',
  password: PASSWORD_HASH,
  role: userRole.USER,
  verified: true,
  status: userStatus.ACTIVE,
  provider: 'local',
  tokenVersion: 3,
  authSecurity: {
    id: 'sec-1',
    failedAttempts: 0,
    lastFailedAt: null,
    lockExpiresAt: null,
  },
  ...overrides,
});

/** Redis giả trong bộ nhớ để kiểm danh sách phiên thật sự thay đổi ra sao. */
class InMemoryRedis {
  readonly store = new Map<string, unknown>();
  get = jest.fn((key: string) => Promise.resolve(this.store.get(key) ?? null));
  set = jest.fn((key: string, value: unknown) => {
    this.store.set(key, structuredClone(value));
    return Promise.resolve(true);
  });
  del = jest.fn((key: string) => {
    this.store.delete(key);
    return Promise.resolve();
  });
  setNX = jest.fn((key: string, value: unknown) => {
    if (this.store.has(key)) return Promise.resolve(false);
    this.store.set(key, value);
    return Promise.resolve(true);
  });

  keysContaining(fragment: string): string[] {
    return [...this.store.keys()].filter((k) => k.includes(fragment));
  }

  sessionsOf(userId: string): string[] {
    const key = this.keysContaining(`${SESSIONS_KEY}:${userId}`)[0];
    const value = key ? this.store.get(key) : undefined;
    return Array.isArray(value) ? value.map(String) : [];
  }
}

describe('AuthService — đăng nhập, làm mới token, đăng xuất', () => {
  let service: AuthService;
  let redis: InMemoryRedis;
  let jtiCounter: number;
  const prisma = {
    authUser: { findUnique: jest.fn(), update: jest.fn() },
    authSecurity: { update: jest.fn() },
    loginHistory: { create: jest.fn() },
  };
  const utils = {
    checkRateLimit: jest.fn(),
    generateSecureId: jest.fn(),
    createAccessToken: jest.fn(),
    createRefreshToken: jest.fn(),
    hashToken: jest.fn((token: string) => `hash(${token})`),
    verifyRefreshToken: jest.fn(),
  };
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  const login = () =>
    service.login({ email: 'hoc-vien@hisgo.test', password: PASSWORD }, META);

  beforeEach(async () => {
    jest.clearAllMocks();
    redis = new InMemoryRedis();
    jtiCounter = 0;
    prisma.authUser.findUnique.mockResolvedValue(localUser());
    prisma.authSecurity.update.mockResolvedValue({});
    prisma.loginHistory.create.mockResolvedValue({});
    utils.generateSecureId.mockImplementation(() => `jti-${++jtiCounter}`);
    utils.createAccessToken.mockReturnValue('access');
    utils.createRefreshToken.mockImplementation(
      (_payload: object, jti: string) => `refresh-${jti}`,
    );
    utils.verifyRefreshToken.mockImplementation((token: string) => ({
      userId: 'u-1',
      jti: token.replace('refresh-', ''),
    }));

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthUtilsService, useValue: utils },
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: EmailQueueService, useValue: {} },
        { provide: CustomLoggerService, useValue: logger },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  describe('login', () => {
    it('đúng mật khẩu: cấp token kèm tokenVersion, lưu băm refresh token, ghi phiên', async () => {
      const result = await login();

      expect(result).toMatchObject({
        accessToken: 'access',
        refreshToken: 'refresh-jti-1',
        user: { id: 'u-1', role: userRole.USER },
        expiresIn: 15 * 60,
      });
      expect(utils.createAccessToken).toHaveBeenCalledWith({
        userId: 'u-1',
        role: userRole.USER,
        tokenVersion: 3,
      });
      const [tokenKey] = redis.keysContaining(`${TOKEN_KEY}:u-1:jti-1`);
      expect(redis.store.get(tokenKey)).toMatchObject({
        tokenHash: 'hash(refresh-jti-1)',
      });
      expect(redis.sessionsOf('u-1')).toEqual(['jti-1']);
      expect(redis.keysContaining(':lock:login:')).toEqual([]);
    });

    it('sai mật khẩu: tăng số lần sai, trả 401 chung chung', async () => {
      await expect(
        service.login(
          { email: 'hoc-vien@hisgo.test', password: 'Sai@1234' },
          META,
        ),
      ).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED });

      expect(prisma.authSecurity.update).toHaveBeenCalledWith({
        where: { authId: 'u-1' },
        data: expect.objectContaining({ failedAttempts: 1 }),
      });
      expect(prisma.authUser.update).not.toHaveBeenCalled();
    });

    it('sai lần thứ 5: khoá tài khoản và vô hiệu mọi access token', async () => {
      prisma.authUser.findUnique.mockResolvedValue(
        localUser({
          authSecurity: { id: 'sec-1', failedAttempts: 4, lockExpiresAt: null },
        }),
      );

      await expect(
        service.login(
          { email: 'hoc-vien@hisgo.test', password: 'Sai@1234' },
          META,
        ),
      ).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED });

      expect(prisma.authSecurity.update).toHaveBeenCalledWith({
        where: { authId: 'u-1' },
        data: expect.objectContaining({
          failedAttempts: 5,
          lockExpiresAt: expect.any(Date),
        }),
      });
      expect(prisma.authUser.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: { tokenVersion: { increment: 1 } },
      });
    });

    it('đang bị khoá tạm: 403 dù đúng mật khẩu', async () => {
      prisma.authUser.findUnique.mockResolvedValue(
        localUser({
          authSecurity: {
            id: 'sec-1',
            failedAttempts: 5,
            lockExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
          },
        }),
      );

      await expect(login()).rejects.toMatchObject({
        status: HttpStatus.FORBIDDEN,
      });
    });

    it('tài khoản bị chặn: 403', async () => {
      prisma.authUser.findUnique.mockResolvedValue(
        localUser({ status: userStatus.BLOCKED }),
      );

      await expect(login()).rejects.toMatchObject({
        status: HttpStatus.FORBIDDEN,
      });
    });

    it('email không tồn tại: cùng thông báo 401 như sai mật khẩu', async () => {
      prisma.authUser.findUnique.mockResolvedValue(null);

      await expect(login()).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid email or password',
      });
    });

    it('tài khoản Google không đăng nhập bằng mật khẩu: 400', async () => {
      prisma.authUser.findUnique.mockResolvedValue(
        localUser({ provider: 'google' }),
      );

      await expect(login()).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });

    it('người học chưa xác minh email vẫn vào được, nhân sự CMS thì không', async () => {
      prisma.authUser.findUnique.mockResolvedValueOnce(
        localUser({ verified: false }),
      );
      await expect(login()).resolves.toMatchObject({ accessToken: 'access' });

      prisma.authUser.findUnique.mockResolvedValueOnce(
        localUser({ verified: false, role: userRole.MODERATOR }),
      );
      await expect(login()).rejects.toMatchObject({
        status: HttpStatus.FORBIDDEN,
      });
    });

    it('đang có lượt đăng nhập khác cùng lúc: 409', async () => {
      await redis.setNX('app:lock:login:u-1', '1');
      redis.setNX.mockResolvedValueOnce(false);

      await expect(login()).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
      });
    });

    it('Redis lỗi khi lưu token: 503 và vẫn nhả khoá đăng nhập', async () => {
      redis.set.mockResolvedValueOnce(false);

      await expect(login()).rejects.toMatchObject({
        status: HttpStatus.SERVICE_UNAVAILABLE,
      });
      expect(redis.keysContaining(':lock:login:')).toEqual([]);
    });

    it(`quá ${MAX_DEVICES} thiết bị: bỏ phiên cũ nhất, giữ đúng ${MAX_DEVICES} phiên mới nhất`, async () => {
      for (let i = 0; i < MAX_DEVICES + 1; i++) {
        await login();
      }

      const sessions = redis.sessionsOf('u-1');
      expect(sessions).toHaveLength(MAX_DEVICES);
      expect(sessions).not.toContain('jti-1');
      expect(redis.keysContaining(`${TOKEN_KEY}:u-1:jti-1:`)).toEqual([]);
      expect(redis.keysContaining(`${TOKEN_KEY}:u-1:jti-1`)).toEqual([]);
    });
  });

  describe('refreshToken — xoay vòng token', () => {
    it('cấp cặp token mới, huỷ token cũ, danh sách phiên chỉ còn phiên mới', async () => {
      await login();

      const result = await service.refreshToken('refresh-jti-1', META);

      expect(result.refreshToken).toBe('refresh-jti-2');
      expect(redis.keysContaining(`${TOKEN_KEY}:u-1:jti-1`)).toEqual([]);
      expect(redis.keysContaining(`${TOKEN_KEY}:u-1:jti-2`)).toHaveLength(1);
      expect(redis.sessionsOf('u-1')).toEqual(['jti-2']);
    });

    it('dùng lại token đã xoay (nghi bị đánh cắp): 401 và huỷ mọi phiên', async () => {
      await login();
      await login();
      await service.refreshToken('refresh-jti-1', META);

      await expect(
        service.refreshToken('refresh-jti-1', META),
      ).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED });
      expect(redis.keysContaining(`${TOKEN_KEY}:u-1:`)).toEqual([]);
      expect(redis.sessionsOf('u-1')).toEqual([]);
    });

    it('token không khớp bản băm đã lưu: 401 và huỷ mọi phiên', async () => {
      await login();
      utils.hashToken.mockReturnValueOnce('hash-khac');

      await expect(
        service.refreshToken('refresh-jti-1', META),
      ).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED });
      expect(redis.sessionsOf('u-1')).toEqual([]);
    });

    it('token hết hạn / sai chữ ký: 401', async () => {
      utils.verifyRefreshToken.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(
        service.refreshToken('refresh-cu', META),
      ).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED });
    });

    it('tài khoản đã bị chặn: 401, không cấp token mới', async () => {
      await login();
      prisma.authUser.findUnique.mockResolvedValue({
        id: 'u-1',
        role: userRole.USER,
        status: userStatus.BLOCKED,
        tokenVersion: 4,
      });

      await expect(
        service.refreshToken('refresh-jti-1', META),
      ).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED });
      expect(redis.sessionsOf('u-1')).toEqual([]);
    });
  });

  describe('đăng xuất', () => {
    it('đăng xuất 1 thiết bị: chỉ huỷ phiên đó', async () => {
      await login();
      await login();

      await service.logout('refresh-jti-1', 'u-1');

      expect(redis.sessionsOf('u-1')).toEqual(['jti-2']);
      expect(redis.keysContaining(`${TOKEN_KEY}:u-1:jti-2`)).toHaveLength(1);
    });

    it('token của người khác: 401', async () => {
      await expect(
        service.logout('refresh-jti-1', 'u-khac'),
      ).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED });
    });

    it('token đã hết hạn thì coi như đã đăng xuất', async () => {
      utils.verifyRefreshToken.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.logout('refresh-cu', 'u-1')).resolves.toEqual({
        message: expect.any(String),
      });
    });

    it('đăng xuất mọi thiết bị: huỷ hết refresh token và tăng tokenVersion', async () => {
      await login();
      await login();
      await redis.set('app:token_version:u-1', 3);

      await service.logoutAllDevices('u-1');

      expect(redis.keysContaining(`${TOKEN_KEY}:u-1:`)).toEqual([]);
      expect(redis.sessionsOf('u-1')).toEqual([]);
      expect(redis.keysContaining('token_version:u-1')).toEqual([]);
      expect(prisma.authUser.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: { tokenVersion: { increment: 1 } },
      });
    });
  });
});
