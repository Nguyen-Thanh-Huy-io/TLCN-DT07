import { Test, TestingModule } from '@nestjs/testing';
import { TopicService } from './topic.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { NotFoundException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';

describe('TopicService', () => {
  let service: TopicService;
  let prisma: PrismaService;

  const mockPeriod = {
    id: 'period-uuid-1',
    name: 'Thời kỳ Bắc thuộc',
    region: 'Việt Nam',
    startYear: -111,
    endYear: 938,
  };

  const mockTopic = {
    id: 'topic-uuid-1',
    periodId: 'period-uuid-1',
    name: 'Khởi nghĩa Hai Bà Trưng',
    description: 'Cuộc khởi nghĩa chống ách đô hộ nhà Hán',
    coverImageUrl: 'https://example.com/cover.jpg',
    isSequential: false,
    displayOrder: 1,
    status: ContentStatus.PUBLISHED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    period: {
      findUnique: jest.fn().mockResolvedValue(mockPeriod),
    },
    topic: {
      create: jest.fn().mockResolvedValue(mockTopic),
      findMany: jest.fn().mockResolvedValue([mockTopic]),
      findUnique: jest.fn().mockResolvedValue(mockTopic),
      count: jest.fn().mockResolvedValue(1),
      update: jest.fn().mockResolvedValue(mockTopic),
      delete: jest.fn().mockResolvedValue(mockTopic),
    },
  };

  const mockRedisService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    deleteByPattern: jest.fn().mockResolvedValue(1),
  };

  const mockCustomLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: CustomLoggerService, useValue: mockCustomLogger },
      ],
    }).compile();

    service = module.get<TopicService>(TopicService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a topic when period exists', async () => {
      mockPrismaService.period.findUnique.mockResolvedValueOnce(mockPeriod);
      const dto = {
        periodId: 'period-uuid-1',
        name: 'Khởi nghĩa Hai Bà Trưng',
      };

      const result = await service.create(dto);
      expect(result).toEqual(mockTopic);
      expect(mockPrismaService.topic.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if period does not exist', async () => {
      mockPrismaService.period.findUnique.mockResolvedValueOnce(null);
      const dto = {
        periodId: 'non-existent-period',
        name: 'Chủ đề mới',
      };

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.topic.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated topic list on cache miss', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.items).toEqual([mockTopic]);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return topic detail when found', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);
      mockPrismaService.topic.findUnique.mockResolvedValueOnce(mockTopic);

      const result = await service.findOne('topic-uuid-1');
      expect(result).toEqual(mockTopic);
    });

    it('should throw NotFoundException if topic does not exist', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);
      mockPrismaService.topic.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a topic successfully', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);
      mockPrismaService.topic.findUnique.mockResolvedValueOnce(mockTopic);
      mockPrismaService.topic.delete.mockResolvedValueOnce(mockTopic);

      const result = await service.remove('topic-uuid-1');
      expect(result.success).toBe(true);
      expect(mockPrismaService.topic.delete).toHaveBeenCalled();
    });
  });
});
