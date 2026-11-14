import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/services/prisma.service';
import { AccountService } from './account.service';
import { AuthService } from './auth.service';
import { AuthUtilsService } from './services/auth-utils.service';

const CURRENT_PASSWORD = 'MatKhauCu@2026';
const NEW_PASSWORD = 'MatKhauMoi@2026';

describe('AccountService', () => {
  let service: AccountService;
  let storedHash: string;
  const prisma = {
    authUser: { findUnique: jest.fn(), update: jest.fn() },
    userProfile: { upsert: jest.fn() },
  };
  const authService = { logoutAllDevices: jest.fn() };
  const authUtils = { validatePassword: jest.fn().mockReturnValue(true) };

  beforeAll(async () => {
    storedHash = await bcrypt.hash(CURRENT_PASSWORD, 4);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    authUtils.validatePassword.mockReturnValue(true);
    prisma.authUser.findUnique.mockResolvedValue({
      id: 'u-1',
      password: storedHash,
      provider: 'local',
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: authService },
        { provide: AuthUtilsService, useValue: authUtils },
      ],
    }).compile();
    service = moduleRef.get(AccountService);
  });

  const statusOf = (p: Promise<unknown>) =>
    p.then(
      () => 'ok',
      (e: { getStatus: () => number }) => e.getStatus(),
    );

  describe('changePassword', () => {
    it('đổi thành công: lưu hash mới và thu hồi mọi phiên', async () => {
      await service.changePassword('u-1', {
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD,
      });

      const saved: string =
        prisma.authUser.update.mock.calls[0][0].data.password;
      expect(saved).not.toBe(NEW_PASSWORD);
      expect(await bcrypt.compare(NEW_PASSWORD, saved)).toBe(true);
      expect(authService.logoutAllDevices).toHaveBeenCalledWith('u-1');
    });

    it('sai mật khẩu hiện tại → 400, không đổi gì', async () => {
      const status = await statusOf(
        service.changePassword('u-1', {
          currentPassword: 'sai',
          newPassword: NEW_PASSWORD,
        }),
      );

      expect(status).toBe(HttpStatus.BAD_REQUEST);
      expect(prisma.authUser.update).not.toHaveBeenCalled();
      expect(authService.logoutAllDevices).not.toHaveBeenCalled();
    });

    it('mật khẩu mới yếu → 400', async () => {
      authUtils.validatePassword.mockReturnValue(false);

      const status = await statusOf(
        service.changePassword('u-1', {
          currentPassword: CURRENT_PASSWORD,
          newPassword: '123',
        }),
      );

      expect(status).toBe(HttpStatus.BAD_REQUEST);
      expect(prisma.authUser.update).not.toHaveBeenCalled();
    });

    it('tài khoản đăng nhập Google không đổi mật khẩu tại đây → 400', async () => {
      prisma.authUser.findUnique.mockResolvedValue({
        id: 'u-1',
        password: '',
        provider: 'google',
      });

      const status = await statusOf(
        service.changePassword('u-1', {
          currentPassword: CURRENT_PASSWORD,
          newPassword: NEW_PASSWORD,
        }),
      );

      expect(status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('tài khoản không tồn tại → 404', async () => {
      prisma.authUser.findUnique.mockResolvedValue(null);

      const status = await statusOf(
        service.changePassword('khong-co', {
          currentPassword: CURRENT_PASSWORD,
          newPassword: NEW_PASSWORD,
        }),
      );

      expect(status).toBe(HttpStatus.NOT_FOUND);
    });
  });

  it('cập nhật hồ sơ: cắt khoảng trắng, chuỗi rỗng thành null', async () => {
    prisma.authUser.findUnique.mockResolvedValue({ id: 'u-1' });

    await service.updateProfile('u-1', { firstName: '  Nam  ', bio: '   ' });

    expect(prisma.userProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { authId: 'u-1' },
        update: {
          firstName: 'Nam',
          lastName: null,
          bio: null,
          avatarUrl: null,
        },
      }),
    );
  });

  it('xem hồ sơ không trả mật khẩu', async () => {
    prisma.authUser.findUnique.mockResolvedValue({ id: 'u-1' });

    await service.getProfile('u-1');

    const select = prisma.authUser.findUnique.mock.calls[0][0].select;
    expect(select.password).toBeUndefined();
    expect(select.tokenVersion).toBeUndefined();
  });
});
