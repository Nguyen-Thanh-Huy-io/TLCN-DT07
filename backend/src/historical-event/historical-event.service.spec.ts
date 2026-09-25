import { Test, TestingModule } from '@nestjs/testing';
import { HistoricalEventService } from './historical-event.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { NotFoundException } from '@nestjs/common';

describe('HistoricalEventService', () => {
  let service: HistoricalEventService;
  const mockTopic = {
    id: 'topic-uuid-1',
    name: 'Khởi nghĩa Hai Bà Trưng',
  };

  const mockEvent = {
    id: 'event-uuid-1',
    topicId: 'topic-uuid-1',
    title: 'Trận Bạch Đằng năm 938',
    eventYear: 938,
    eventDateNote: 'Mùa thu năm 938',
    description: 'Ngô Quyền đánh tan quân Nam Hán',
    location: 'Sông Bạch Đằng, Quảng Ninh',
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    topic: {
      findUnique: jest.fn().mockResolvedValue(mockTopic),
    },
    historicalEvent: {
      create: jest.fn().mockResolvedValue(mockEvent),
      findMany: jest.fn().mockResolvedValue([mockEvent]),
      findUnique: jest.fn().mockResolvedValue(mockEvent),
      count: jest.fn().mockResolvedValue(1),
      update: jest.fn().mockResolvedValue(mockEvent),
      delete: jest.fn().mockResolvedValue(mockEvent),
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
        HistoricalEventService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: CustomLoggerService, useValue: mockCustomLogger },
      ],
    }).compile();

    service = module.get<HistoricalEventService>(HistoricalEventService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create historical event successfully when topic exists', async () => {
      mockPrismaService.topic.findUnique.mockResolvedValueOnce(mockTopic);
      const dto = {
        topicId: 'topic-uuid-1',
        title: 'Trận Bạch Đằng năm 938',
        eventYear: 938,
        location: 'Sông Bạch Đằng, Quảng Ninh',
      };

      const result = await service.create(dto);
      expect(result).toEqual(mockEvent);
      expect(mockPrismaService.historicalEvent.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if topic does not exist', async () => {
      mockPrismaService.topic.findUnique.mockResolvedValueOnce(null);
      const dto = {
        topicId: 'non-existent-topic',
        title: 'Sự kiện sai',
        eventYear: 1000,
      };

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated events list on cache miss', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.items).toEqual([mockEvent]);
      expect(result.total).toBe(1);
    });
  });

  describe('remove', () => {
    it('should delete event successfully', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);
      mockPrismaService.historicalEvent.findUnique.mockResolvedValueOnce(
        mockEvent,
      );
      mockPrismaService.historicalEvent.delete.mockResolvedValueOnce(mockEvent);

      const result = await service.remove('event-uuid-1');
      expect(result.success).toBe(true);
    });
  });
});
