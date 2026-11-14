import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { PrismaService } from '../common/services/prisma.service';
import { tokenVersionCacheKey } from '../common/constants/cache-keys.constant';
import { RedisService } from '../common/services/redis.service';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { AUTH_CONFIG } from '../auth/config/auth.config';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

describe('UserService', () => {
  const mockRedisService = { del: jest.fn().mockResolvedValue(1) };
  let service: UserService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prisma: PrismaService;

  const mockPrismaService = {
    authUser: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((queries: Promise<unknown>[]) =>
      Promise.all(queries),
    ),
  };

  const mockCustomLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CustomLoggerService,
          useValue: mockCustomLoggerService,
        },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      };

      const createdUser = {
        id: 'uuid-1',
        email: 'test@example.com',
        username: 'testuser',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        verified: true,
      };

      mockPrismaService.authUser.findFirst.mockResolvedValue(null);
      mockPrismaService.authUser.create.mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      expect(mockPrismaService.authUser.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: createUserDto.email },
            { username: createUserDto.username },
          ],
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(
        createUserDto.password,
        AUTH_CONFIG.BCRYPT_SALT_ROUNDS,
      );
      expect(mockPrismaService.authUser.create).toHaveBeenCalled();
      expect(result).toEqual(createdUser);
    });

    it('should throw ConflictException if email or username exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      };

      mockPrismaService.authUser.findFirst.mockResolvedValue({
        id: 'existing-uuid',
      });

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.authUser.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('trả trang người dùng kèm tổng số, lọc theo vai trò và từ khoá', async () => {
      const users = [{ id: 'uuid-1' }, { id: 'uuid-2' }];
      mockPrismaService.authUser.findMany.mockResolvedValue(users);
      mockPrismaService.authUser.count.mockResolvedValue(45);

      const result = await service.findAll({
        page: 2,
        limit: 20,
        role: UserRole.MODERATOR,
        search: ' bien ',
      });

      expect(mockPrismaService.authUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
          where: {
            role: UserRole.MODERATOR,
            OR: [
              { email: { contains: 'bien', mode: 'insensitive' } },
              { username: { contains: 'bien', mode: 'insensitive' } },
            ],
          },
        }),
      );
      expect(result).toEqual({
        items: users,
        total: 45,
        page: 2,
        limit: 20,
        totalPages: 3,
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = 'uuid-1';
      const user = { id: userId, email: 'test@example.com' };

      mockPrismaService.authUser.findUnique.mockResolvedValue(user);

      const result = await service.findOne(userId);

      expect(mockPrismaService.authUser.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object),
      });
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-uuid';
      mockPrismaService.authUser.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const userId = 'uuid-1';
      const updateUserDto: UpdateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
      };

      const existingUser = { id: userId };
      const updatedUser = { id: userId, ...updateUserDto };

      mockPrismaService.authUser.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.authUser.update.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateUserDto);

      expect(mockPrismaService.authUser.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object),
      });
      expect(mockPrismaService.authUser.update).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });

    it('should update password and hash it', async () => {
      const userId = 'uuid-1';
      const updateUserDto: UpdateUserDto = {
        password: 'newpassword123',
      };

      mockPrismaService.authUser.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.authUser.update.mockResolvedValue({ id: userId });

      await service.update(userId, updateUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(
        'newpassword123',
        AUTH_CONFIG.BCRYPT_SALT_ROUNDS,
      );
      expect(mockPrismaService.authUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ password: 'hashedPassword' }),
        }),
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-uuid';
      const updateUserDto: UpdateUserDto = {};

      mockPrismaService.authUser.findUnique.mockResolvedValue(null);

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.authUser.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      const userId = 'uuid-1';

      mockPrismaService.authUser.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.authUser.delete.mockResolvedValue({ id: userId });

      const result = await service.remove(userId, 'admin-1');

      expect(mockPrismaService.authUser.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object),
      });
      expect(mockPrismaService.authUser.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockRedisService.del).toHaveBeenCalledWith(
        tokenVersionCacheKey(userId),
      );
      expect(result).toEqual({
        success: true,
        message: `Người dùng với ID ${userId} đã được xóa thành công`,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-uuid';

      mockPrismaService.authUser.findUnique.mockResolvedValue(null);

      await expect(service.remove(userId, 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.authUser.delete).not.toHaveBeenCalled();
    });
  });

  describe('bảo vệ quyền SUPERADMIN', () => {
    const superadmin = {
      id: 'sa-1',
      role: UserRole.SUPERADMIN,
      status: UserStatus.ACTIVE,
    };

    it('không tự xoá tài khoản đang đăng nhập', async () => {
      await expect(service.remove('sa-1', 'sa-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrismaService.authUser.delete).not.toHaveBeenCalled();
    });

    it('không hạ quyền SUPERADMIN cuối cùng', async () => {
      mockPrismaService.authUser.findUnique.mockResolvedValue(superadmin);
      mockPrismaService.authUser.count.mockResolvedValue(0);

      await expect(
        service.update('sa-1', { role: UserRole.USER }),
      ).rejects.toThrow(ConflictException);
      expect(mockPrismaService.authUser.update).not.toHaveBeenCalled();
    });

    it('không khoá hay xoá SUPERADMIN cuối cùng', async () => {
      mockPrismaService.authUser.findUnique.mockResolvedValue(superadmin);
      mockPrismaService.authUser.count.mockResolvedValue(0);

      await expect(
        service.update('sa-1', { status: UserStatus.BLOCKED }),
      ).rejects.toThrow(ConflictException);
      await expect(service.remove('sa-1', 'admin-2')).rejects.toThrow(
        ConflictException,
      );
    });

    it('còn SUPERADMIN khác thì hạ quyền được', async () => {
      mockPrismaService.authUser.findUnique.mockResolvedValue(superadmin);
      mockPrismaService.authUser.count.mockResolvedValue(1);
      mockPrismaService.authUser.update.mockResolvedValue({
        ...superadmin,
        role: UserRole.ADMIN,
      });

      await expect(
        service.update('sa-1', { role: UserRole.ADMIN }),
      ).resolves.toBeDefined();
    });
  });
});
