import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { userRole, userStatus } from '@prisma/client';
import { createHash, generateKeyPairSync } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import { CustomLoggerService } from '../../common/services/custom-logger.service';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { AUTH_CONFIG } from '../config/auth.config';
import { GOOGLE_OAUTH_CONFIG } from '../config/google-oauth.config';
import { AuthUtilsService } from './auth-utils.service';
import { GoogleOAuthService } from './google-oauth.service';

const CLIENT_ID = 'hisgo-test-client';
const KEY_ID = 'google-key-1';
const GOOGLE_ISSUER = `https://${'accounts.google.com'}`;
const META = { ip: '10.0.0.1', userAgent: 'jest' };

const pem = () =>
  generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
const googleKeys = pem();
const attackerKeys = pem();

const idToken = (
  claims: object = {},
  privateKey: string = googleKeys.privateKey,
) =>
  jwt.sign(
    {
      sub: 'google-sub-1',
      email: 'hoc-vien@gmail.com',
      email_verified: true,
      name: 'Hoc Vien',
      given_name: 'Hoc',
      family_name: 'Vien',
      ...claims,
    },
    privateKey,
    {
      algorithm: 'RS256',
      keyid: KEY_ID,
      issuer: GOOGLE_ISSUER,
      audience: CLIENT_ID,
      expiresIn: '5m',
    },
  );

const jsonResponse = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const googleUserRow = (overrides: object = {}) => ({
  id: 'u-1',
  email: 'hoc-vien@gmail.com',
  username: 'hoc_abcd',
  role: userRole.USER,
  verified: true,
  status: userStatus.ACTIVE,
  provider: 'google',
  providerId: 'google-sub-1',
  tokenVersion: 0,
  ...overrides,
});

describe('GoogleOAuthService — luồng đăng nhập Google (PKCE + kiểm chữ ký ID token)', () => {
  let service: GoogleOAuthService;
  let fetchMock: jest.SpyInstance;
  const savedEnv = { ...process.env };
  const redisStore = new Map<string, unknown>();
  const redis = {
    get: jest.fn((key: string) => Promise.resolve(redisStore.get(key) ?? null)),
    set: jest.fn((...[key, value]: [string, unknown, number?]) => {
      redisStore.set(key, value);
      return Promise.resolve();
    }),
    del: jest.fn((key: string) => {
      redisStore.delete(key);
      return Promise.resolve();
    }),
    setNX: jest.fn().mockResolvedValue(true),
  };
  const tx = {
    authUser: { create: jest.fn() },
    authSecurity: { create: jest.fn() },
    userProfile: { create: jest.fn() },
  };
  const prisma = {
    authUser: { findFirst: jest.fn(), findUnique: jest.fn() },
    loginHistory: { create: jest.fn() },
    $transaction: jest.fn((fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  };
  const utils = {
    generateSecureId: jest.fn(),
    createAccessToken: jest.fn().mockReturnValue('access'),
    createRefreshToken: jest.fn().mockReturnValue('refresh'),
    hashToken: jest.fn().mockReturnValue('hash'),
  };
  const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

  /** Bắt đầu đăng nhập rồi giả Google trả về token cho đúng `state` vừa cấp. */
  const startLogin = async (tokenBody: object) => {
    const { state } = await service.getAuthorizationUrl(META, '/hoc-tap');
    fetchMock.mockResolvedValueOnce(jsonResponse(tokenBody));
    return state;
  };

  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = 'secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:5000/auth/google/cb';
  });

  afterAll(() => {
    process.env = savedEnv;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    redisStore.clear();
    prisma.authUser.findFirst.mockResolvedValue(null);
    prisma.authUser.findUnique.mockResolvedValue(null);
    prisma.loginHistory.create.mockResolvedValue({});
    tx.authUser.create.mockResolvedValue(googleUserRow());
    let jti = 0;
    utils.generateSecureId.mockImplementation(() => `jti-${++jti}`);
    fetchMock = jest.spyOn(global, 'fetch');
    jest
      .spyOn(JwksClient.prototype, 'getSigningKey')
      .mockImplementation((kid?: string | null) =>
        kid === KEY_ID
          ? Promise.resolve({
              kid: KEY_ID,
              alg: 'RS256',
              getPublicKey: () => googleKeys.publicKey,
              rsaPublicKey: googleKeys.publicKey,
            })
          : Promise.reject(new Error('unknown kid')),
      );

    const moduleRef = await Test.createTestingModule({
      providers: [
        GoogleOAuthService,
        { provide: CustomLoggerService, useValue: logger },
        { provide: RedisService, useValue: redis },
        { provide: PrismaService, useValue: prisma },
        { provide: AuthUtilsService, useValue: utils },
      ],
    }).compile();
    service = moduleRef.get(GoogleOAuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('URL đăng nhập mang code_challenge = SHA256(code_verifier) đã lưu theo state', async () => {
    const { url, state } = await service.getAuthorizationUrl(META);

    const params = new URL(url).searchParams;
    const [stored] = [...redisStore.values()];
    expect(params.get('state')).toBe(state);
    expect(stored).toMatchObject({ state, ip: META.ip });
    const verifier =
      typeof stored === 'object' && stored && 'codeVerifier' in stored
        ? String(stored.codeVerifier)
        : '';
    expect(params.get('code_challenge')).toBe(
      createHash('sha256').update(verifier).digest('base64url'),
    );
  });

  it('người mới: gửi code_verifier khi đổi code, tạo tài khoản + hồ sơ trong 1 transaction, state chỉ dùng 1 lần', async () => {
    const state = await startLogin({
      access_token: 'g-access',
      id_token: idToken(),
    });

    const result = await service.handleCallback('auth-code', state, META);

    const [tokenUrl, init] = fetchMock.mock.calls[0];
    expect(tokenUrl).toBe(GOOGLE_OAUTH_CONFIG.ENDPOINTS.TOKEN);
    expect(String(init.body)).toContain('code_verifier=');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.authUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'hoc-vien@gmail.com',
          provider: 'google',
          providerId: 'google-sub-1',
          verified: true,
        }),
      }),
    );
    expect(tx.userProfile.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ firstName: 'Hoc', lastName: 'Vien' }),
    });
    expect(result).toMatchObject({
      isNewUser: true,
      accessToken: 'access',
      redirectUrl: '/hoc-tap',
    });

    await expect(
      service.handleCallback('auth-code', state, META),
    ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
  });

  it('đã có tài khoản Google: đăng nhập, không tạo mới', async () => {
    prisma.authUser.findFirst.mockResolvedValue(googleUserRow());
    const state = await startLogin({ access_token: 'g', id_token: idToken() });

    const result = await service.handleCallback('auth-code', state, META);

    expect(result.isNewUser).toBe(false);
    expect(tx.authUser.create).not.toHaveBeenCalled();
  });

  it('tài khoản Google bị chặn: 403', async () => {
    prisma.authUser.findFirst.mockResolvedValue(
      googleUserRow({ status: userStatus.BLOCKED }),
    );
    const state = await startLogin({ access_token: 'g', id_token: idToken() });

    await expect(
      service.handleCallback('auth-code', state, META),
    ).rejects.toMatchObject({ status: HttpStatus.FORBIDDEN });
  });

  it('email đã đăng ký bằng mật khẩu: 409, không tự gộp tài khoản', async () => {
    prisma.authUser.findUnique.mockResolvedValue({ provider: 'local' });
    const state = await startLogin({ access_token: 'g', id_token: idToken() });

    await expect(
      service.handleCallback('auth-code', state, META),
    ).rejects.toMatchObject({ status: HttpStatus.CONFLICT });
    expect(tx.authUser.create).not.toHaveBeenCalled();
  });

  it('ID token giả (ký bằng khoá khác): 401, không đụng tới DB', async () => {
    const state = await startLogin({
      access_token: 'g',
      id_token: idToken({}, attackerKeys.privateKey),
    });

    await expect(
      service.handleCallback('auth-code', state, META),
    ).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED });
    expect(prisma.authUser.findFirst).not.toHaveBeenCalled();
  });

  it('ID token cấp cho ứng dụng khác (sai audience): 401', async () => {
    const foreignToken = jwt.sign(
      { sub: 'x', email: 'x@gmail.com', email_verified: true },
      googleKeys.privateKey,
      {
        algorithm: 'RS256',
        keyid: KEY_ID,
        issuer: GOOGLE_ISSUER,
        audience: 'ung-dung-khac',
      },
    );
    const state = await startLogin({
      access_token: 'g',
      id_token: foreignToken,
    });

    await expect(
      service.handleCallback('auth-code', state, META),
    ).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED });
  });

  it('không có ID token: lấy thông tin từ userinfo; email chưa xác minh thì 403', async () => {
    const state = await startLogin({ access_token: 'g-access' });
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        sub: 'google-sub-2',
        email: 'chua-xac-minh@gmail.com',
        email_verified: false,
      }),
    );

    await expect(
      service.handleCallback('auth-code', state, META),
    ).rejects.toMatchObject({ status: HttpStatus.FORBIDDEN });
    expect(fetchMock.mock.calls[1][0]).toBe(
      GOOGLE_OAUTH_CONFIG.ENDPOINTS.USERINFO,
    );
  });

  it('Google từ chối đổi code: 401', async () => {
    const { state } = await service.getAuthorizationUrl(META);
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: 'invalid_grant' }, 400),
    );

    await expect(
      service.handleCallback('code-sai', state, META),
    ).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED });
  });

  it('quá số thiết bị: chỉ giữ các phiên mới nhất', async () => {
    const max = AUTH_CONFIG.SESSION.MAX_DEVICES_PER_USER;
    prisma.authUser.findFirst.mockResolvedValue(googleUserRow());

    for (let i = 0; i < max + 1; i++) {
      const state = await startLogin({
        access_token: 'g',
        id_token: idToken(),
      });
      await service.handleCallback('auth-code', state, META);
    }

    const sessionKey = [...redisStore.keys()].find((k) =>
      k.includes(`${AUTH_CONFIG.CACHE_PREFIXES.USER_SESSIONS}:u-1`),
    );
    const sessions = sessionKey ? redisStore.get(sessionKey) : [];
    expect(sessions).toHaveLength(max);
    expect(sessions).not.toContain('jti-1');
    const sessionWrites = redis.set.mock.calls.filter(
      ([key]) => key === sessionKey,
    );
    expect(
      sessionWrites.every(([, , ttl]) => typeof ttl === 'number' && ttl > 0),
    ).toBe(true);
  });

  it('thu hồi token Google lỗi mạng thì chỉ ghi log, không ném lỗi', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));

    await expect(service.revokeGoogleToken('g')).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});
