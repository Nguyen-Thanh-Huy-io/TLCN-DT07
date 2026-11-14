import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { Test } from '@nestjs/testing';
import { userRole, userStatus } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import config from '../config/app.config';
import { tokenVersionCacheKey } from '../constants/cache-keys.constant';
import { PrismaService } from '../services/prisma.service';
import { RedisService } from '../services/redis.service';
import { AuthGuard } from './auth.guard';

const SECRET = 'auth-guard-test-secret';
const PAYLOAD = { userId: 'u-1', role: userRole.USER, tokenVersion: 2 };

const sign = (
  payload: object = PAYLOAD,
  options: jwt.SignOptions = { expiresIn: '5m' },
  secret = SECRET,
) => jwt.sign(payload, secret, options);

const contextWith = (authorization?: string) => {
  const request: { headers: { authorization?: string }; user?: unknown } = {
    headers: { authorization },
  };
  return { request, context: new ExecutionContextHost([request, {}, null]) };
};

describe('AuthGuard', () => {
  let guard: AuthGuard;
  const originalSecret = config.jwt_access_secret;
  const redis = { get: jest.fn(), set: jest.fn() };
  const prisma = { authUser: { findUnique: jest.fn() } };

  const run = (authorization?: string) => {
    const { request, context } = contextWith(authorization);
    return { request, result: guard.canActivate(context) };
  };

  beforeAll(() => {
    config.jwt_access_secret = SECRET;
  });

  afterAll(() => {
    config.jwt_access_secret = originalSecret;
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    redis.get.mockResolvedValue(null);
    prisma.authUser.findUnique.mockResolvedValue({
      tokenVersion: 2,
      status: userStatus.ACTIVE,
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: RedisService, useValue: redis },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    guard = moduleRef.get(AuthGuard);
  });

  it('token hợp lệ: cho qua, gắn người dùng vào request và cache tokenVersion', async () => {
    const { request, result } = run(`Bearer ${sign()}`);

    await expect(result).resolves.toBe(true);
    expect(request.user).toMatchObject(PAYLOAD);
    expect(redis.set).toHaveBeenCalledWith(
      tokenVersionCacheKey('u-1'),
      2,
      3600,
    );
  });

  it('đã có tokenVersion trong cache thì không truy vấn DB', async () => {
    redis.get.mockResolvedValue(2);

    await expect(run(`Bearer ${sign()}`).result).resolves.toBe(true);
    expect(prisma.authUser.findUnique).not.toHaveBeenCalled();
  });

  it.each([
    ['không có header', undefined],
    ['không phải Bearer', `Basic ${sign()}`],
    ['Bearer rỗng', 'Bearer '],
  ])('%s → 401', async (_case, header) => {
    await expect(run(header).result).rejects.toThrow(UnauthorizedException);
  });

  it('token hết hạn → 401 "Token has expired"', async () => {
    const expired = sign(
      { ...PAYLOAD, exp: Math.floor(Date.now() / 1000) - 60 },
      {},
    );

    await expect(run(`Bearer ${expired}`).result).rejects.toThrow(
      'Token has expired',
    );
  });

  it('token ký bằng secret khác (giả mạo) → 401', async () => {
    const forged = sign(PAYLOAD, { expiresIn: '5m' }, 'secret-cua-ke-gian');

    await expect(run(`Bearer ${forged}`).result).rejects.toThrow(
      'Invalid token',
    );
  });

  it('token "alg: none" (không chữ ký) → 401', async () => {
    const unsigned = jwt.sign(PAYLOAD, '', { algorithm: 'none' });

    await expect(run(`Bearer ${unsigned}`).result).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('tokenVersion cũ (đã đổi mật khẩu / đăng xuất mọi thiết bị) → 401', async () => {
    redis.get.mockResolvedValue(3);

    await expect(run(`Bearer ${sign()}`).result).rejects.toThrow(
      'Token has been revoked',
    );
  });

  it('tài khoản bị khoá hoặc đã xoá (cache trống) → 401', async () => {
    prisma.authUser.findUnique.mockResolvedValueOnce({
      tokenVersion: 2,
      status: userStatus.BLOCKED,
    });
    await expect(run(`Bearer ${sign()}`).result).rejects.toThrow(
      'User account is not active',
    );

    prisma.authUser.findUnique.mockResolvedValueOnce(null);
    await expect(run(`Bearer ${sign()}`).result).rejects.toThrow(
      'User not found',
    );
  });

  it('Redis / DB lỗi bất ngờ → 401 chung, không lộ chi tiết', async () => {
    prisma.authUser.findUnique.mockRejectedValue(new Error('db down'));

    await expect(run(`Bearer ${sign()}`).result).rejects.toThrow(
      'Authentication failed',
    );
  });
});
