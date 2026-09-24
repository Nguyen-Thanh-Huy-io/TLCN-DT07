import { Test, TestingModule } from '@nestjs/testing';
import { PeriodService } from './period.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';

describe('PeriodService', () => {
  let service: PeriodService;
  let prisma: PrismaService;
  let redis: RedisService;

  const mockPeriod = {
    id: 'test-uuid-1',
    name: 'Thời kỳ Bắc thuộc',
    region: 'Việt Nam',
    startYear: -111,
    endYear: 938,
    description: 'Thời kỳ nhân dân ta đấu tranh bảo vệ độc lập',
    coverImageUrl: 'https://example.com/cover.jpg',
    displayOrder: 1,
    status: ContentStatus.PUBLISHED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    period: {
      create: jest.fn().mockResolvedValue(mockPeriod),
      findMany: jest.fn().mockResolvedValue([mockPeriod]),
      findUnique: jest.fn().mockResolvedValue(mockPeriod),
      count: jest.fn().mockResolvedValue(1),
      update: jest.fn().mockResolvedValue(mockPeriod),
      delete: jest.fn().mockResolvedValue(mockPeriod),
    },
  };

  const mockRedisService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
  };

  const mockCustomLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeriodService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: CustomLoggerService, useValue: mockCustomLogger },
      ],
    }).compile();

    service = module.get<PeriodService>(PeriodService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a period', async () => {
      const dto = {
        name: 'Thời kỳ Bắc thuộc',
        region: 'Việt Nam',
        startYear: -111,
        endYear: 938,
      };

      const result = await service.create(dto);
      expect(result).toEqual(mockPeriod);
      expect(mockPrismaService.period.create).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException if endYear < startYear', async () => {
      const dto = {
        name: 'Invalid Period',
        startYear: 1000,
        endYear: 500,
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.period.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated result from database on cache miss', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.items).toEqual([mockPeriod]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(mockPrismaService.period.findMany).toHaveBeenCalled();
    });

    it('should return cached result if cache hit', async () => {
      const cached = { items: [mockPeriod], total: 1, page: 1, limit: 10, totalPages: 1 };
      mockRedisService.get.mockResolvedValueOnce(cached);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result).toEqual(cached);
      expect(mockPrismaService.period.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return period when found', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);
      mockPrismaService.period.findUnique.mockResolvedValueOnce(mockPeriod);

      const result = await service.findOne('test-uuid-1');
      expect(result).toEqual(mockPeriod);
    });

    it('should throw NotFoundException when period does not exist', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);
      mockPrismaService.period.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update period successfully', async () => {
      mockPrismaService.period.findUnique.mockResolvedValueOnce(mockPeriod);
      mockPrismaService.period.update.mockResolvedValueOnce({ ...mockPeriod, name: 'Tên mới' });

      const result = await service.update('test-uuid-1', { name: 'Tên mới' });
      expect(result.name).toBe('Tên mới');
      expect(mockPrismaService.period.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if updated endYear < startYear', async () => {
      mockPrismaService.period.findUnique.mockResolvedValueOnce(mockPeriod);

      await expect(
        service.update('test-uuid-1', { endYear: -200 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete a period successfully', async () => {
      mockPrismaService.period.findUnique.mockResolvedValueOnce(mockPeriod);
      mockPrismaService.period.delete.mockResolvedValueOnce(mockPeriod);

      const result = await service.remove('test-uuid-1');
      expect(result.success).toBe(true);
      expect(mockPrismaService.period.delete).toHaveBeenCalled();
    });
  });
});
