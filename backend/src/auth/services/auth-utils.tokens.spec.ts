import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { userRole } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import config from '../../common/config/app.config';
import { RedisService } from '../../common/services/redis.service';
import { AUTH_CONFIG } from '../config/auth.config';
import { AuthUtilsService } from './auth-utils.service';

const ACCESS_SECRET = 'access-secret-test';
const REFRESH_SECRET = 'refresh-secret-test';
const ACCESS_PAYLOAD = { userId: 'u-1', role: userRole.USER, tokenVersion: 0 };

describe('AuthUtilsService — token, mã ngẫu nhiên, giới hạn tần suất', () => {
  let utils: AuthUtilsService;
  const saved = {
    access: config.jwt_access_secret,
    refresh: config.jwt_refresh_secret,
  };
  const redis = {
    exists: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    config.jwt_access_secret = ACCESS_SECRET;
    config.jwt_refresh_secret = REFRESH_SECRET;
    const moduleRef = await Test.createTestingModule({
      providers: [AuthUtilsService, { provide: RedisService, useValue: redis }],
    }).compile();
    utils = moduleRef.get(AuthUtilsService);
  });

  afterAll(() => {
    config.jwt_access_secret = saved.access;
    config.jwt_refresh_secret = saved.refresh;
  });

  describe('access / refresh token', () => {
    it('access token ký HS256, hạn theo cấu hình, đọc lại đúng payload', () => {
      const token = utils.createAccessToken(ACCESS_PAYLOAD);

      const decoded = utils.verifyAccessToken(token);
      expect(decoded).toMatchObject(ACCESS_PAYLOAD);
      expect(jwt.decode(token, { complete: true })?.header.alg).toBe('HS256');
      expect(decoded.exp! - decoded.iat!).toBe(15 * 60);
    });

    it('refresh token mang jti để thu hồi được', () => {
      const token = utils.createRefreshToken({ userId: 'u-1' }, 'jti-123');

      expect(utils.verifyRefreshToken(token)).toMatchObject({
        userId: 'u-1',
        jti: 'jti-123',
      });
    });

    it('không dùng access token thay refresh token và ngược lại (khác secret)', () => {
      const access = utils.createAccessToken(ACCESS_PAYLOAD);
      const refresh = utils.createRefreshToken({ userId: 'u-1' }, 'jti-1');

      expect(() => utils.verifyRefreshToken(access)).toThrow(
        jwt.JsonWebTokenError,
      );
      expect(() => utils.verifyAccessToken(refresh)).toThrow(
        jwt.JsonWebTokenError,
      );
    });

    it('token hết hạn bị từ chối', () => {
      const token = utils.createAccessToken(ACCESS_PAYLOAD, '-1s');

      expect(() => utils.verifyAccessToken(token)).toThrow(
        jwt.TokenExpiredError,
      );
    });

    it('chưa cấu hình secret: báo lỗi 500, không ký token rỗng', () => {
      config.jwt_access_secret = '';

      expect(() => utils.createAccessToken(ACCESS_PAYLOAD)).toThrow(
        expect.objectContaining({ status: HttpStatus.INTERNAL_SERVER_ERROR }),
      );
    });
  });

  describe('mã ngẫu nhiên và băm', () => {
    it('jti là 64 ký tự hex và không lặp', () => {
      const ids = new Set(
        Array.from({ length: 50 }, () => utils.generateSecureId()),
      );

      expect(ids.size).toBe(50);
      expect([...ids].every((id) => /^[0-9a-f]{64}$/.test(id))).toBe(true);
    });

    it('mã xác minh email gồm 6 ký tự hex in hoa', () => {
      expect(utils.generateVerificationCode()).toMatch(/^[0-9A-F]{6}$/);
    });

    it('băm token SHA-256: ổn định, không chứa token gốc', () => {
      const hash = utils.hashToken('refresh-token-goc');

      expect(hash).toBe(utils.hashToken('refresh-token-goc'));
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
      expect(hash).not.toContain('refresh-token-goc');
    });
  });

  describe('checkRateLimit', () => {
    const WINDOW_MS = 60_000;

    it('lần đầu: đặt hạn cho bộ đếm theo cửa sổ thời gian', async () => {
      redis.exists.mockResolvedValue(false);
      redis.incr.mockResolvedValue(1);

      await expect(
        utils.checkRateLimit('login:ip:1.2.3.4', 5, WINDOW_MS),
      ).resolves.toBe(true);
      expect(redis.expire).toHaveBeenCalledWith(
        expect.stringContaining(
          `${AUTH_CONFIG.CACHE_PREFIXES.RATE_LIMIT}login:ip:1.2.3.4`,
        ),
        60,
      );
    });

    it('vượt số lần cho phép: khoá cả cửa sổ và trả 429', async () => {
      redis.exists.mockResolvedValue(false);
      redis.incr.mockResolvedValue(6);

      await expect(
        utils.checkRateLimit('login:ip:1.2.3.4', 5, WINDOW_MS),
      ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/:locked$/),
        '1',
        60,
      );
    });

    it('đang bị khoá: trả 429 ngay, không tăng bộ đếm', async () => {
      redis.exists.mockResolvedValue(true);

      await expect(
        utils.checkRateLimit('login:ip:1.2.3.4', 5, WINDOW_MS),
      ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
      expect(redis.incr).not.toHaveBeenCalled();
    });
  });
});
