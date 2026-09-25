import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { PrismaService } from '../common/services/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { userRole, userStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

describe('UserService', () => {
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
    },
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
        role: userRole.USER,
        status: userStatus.ACTIVE,
      };

      const createdUser = {
        id: 'uuid-1',
        email: 'test@example.com',
        username: 'testuser',
        role: userRole.USER,
        status: userStatus.ACTIVE,
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
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockPrismaService.authUser.create).toHaveBeenCalled();
      expect(result).toEqual(createdUser);
    });

    it('should throw ConflictException if email or username exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        role: userRole.USER,
        status: userStatus.ACTIVE,
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
    it('should return an array of users', async () => {
      const users = [{ id: 'uuid-1' }, { id: 'uuid-2' }];
      mockPrismaService.authUser.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(mockPrismaService.authUser.findMany).toHaveBeenCalled();
      expect(result).toEqual(users);
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

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
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

      const result = await service.remove(userId);

      expect(mockPrismaService.authUser.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object),
      });
      expect(mockPrismaService.authUser.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual({
        success: true,
        message: `Người dùng với ID ${userId} đã được xóa thành công`,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-uuid';

      mockPrismaService.authUser.findUnique.mockResolvedValue(null);

      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.authUser.delete).not.toHaveBeenCalled();
    });
  });
});
