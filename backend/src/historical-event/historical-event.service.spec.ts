import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventCategory } from '@prisma/client';
import { HistoricalEventService } from './historical-event.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { SlugService } from '../common/services/slug.service';
import { HISTORICAL_EVENT_TOKENS } from './historical-event.constant';
import { EventMetadataStrategyRegistry } from './strategies/event-metadata-strategy.registry';
import {
  BattleMetadataStrategy,
  TreatyMetadataStrategy,
  NaturalDisasterMetadataStrategy,
  DefaultEventMetadataStrategy,
} from './strategies/category-metadata.strategies';

describe('HistoricalEventService (SOLID - Clean Architecture & Strategy Pattern Validation)', () => {
  let service: HistoricalEventService;

  const mockEvent = {
    id: 'event-uuid-1',
    topicId: 'topic-uuid-1',
    periodId: null,
    locationId: null,
    location: null,
    historicalLocation: null,
    title: 'Trận Bạch Đằng năm 938',
    slug: 'tran-bach-dang-nam-938',
    startYear: 938,
    endYear: 938,
    category: EventCategory.BATTLE,
    metadata: {
      belligerents: ['Đại Cồ Việt', 'Nam Hán'],
      commanders: ['Ngô Quyền', 'Lưu Hoằng Thao'],
      casualties: 'Lưu Hoằng Thao tử trận',
    },
    eventDateNote: 'Mùa thu năm 938',
    description: 'Ngô Quyền đánh tan quân Nam Hán',
    displayOrder: 1,
    status: 'PUBLISHED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let mockRepository: any;
  let mockRedisService: any;
  let mockCustomLogger: any;
  let mockSlugService: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn().mockResolvedValue(mockEvent),
      update: jest.fn().mockResolvedValue(mockEvent),
      findById: jest.fn().mockResolvedValue(mockEvent),
      findMany: jest.fn().mockResolvedValue({ items: [mockEvent], total: 1 }),
      existsBySlug: jest.fn().mockResolvedValue(false),
      countChildren: jest.fn().mockResolvedValue(0),
      checkReferences: jest.fn().mockResolvedValue({
        topicExists: true,
        periodExists: true,
        locationExists: true,
        parentExists: true,
      }),
      delete: jest.fn().mockResolvedValue(mockEvent),
    };

    mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      deleteByPattern: jest.fn().mockResolvedValue(1),
    };

    mockCustomLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    mockSlugService = {
      generateUnique: jest.fn().mockResolvedValue('tran-bach-dang-nam-938'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoricalEventService,
        BattleMetadataStrategy,
        TreatyMetadataStrategy,
        NaturalDisasterMetadataStrategy,
        DefaultEventMetadataStrategy,
        EventMetadataStrategyRegistry,
        {
          provide: HISTORICAL_EVENT_TOKENS.REPOSITORY,
          useValue: mockRepository,
        },
        { provide: RedisService, useValue: mockRedisService },
        { provide: CustomLoggerService, useValue: mockCustomLogger },
        { provide: SlugService, useValue: mockSlugService },
      ],
    }).compile();

    service = module.get<HistoricalEventService>(HistoricalEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('tạo sự kiện độc lập (Master Data) với category và metadata chuẩn hóa theo Strategy qua Repository Domain Model', async () => {
      const dto = {
        title: 'Trận Bạch Đằng năm 938',
        startYear: 938,
        category: EventCategory.BATTLE,
        metadata: {
          belligerents: ['Đại Cồ Việt', 'Nam Hán'],
          commanders: ['Ngô Quyền', 'Lưu Hoằng Thao'],
          casualties: 'Lưu Hoằng Thao tử trận',
          tactics: 'Đóng cọc ngầm lòng sông',
        },
        entityIds: ['entity-1'],
      };

      const result = await service.create(dto);
      expect(result).toEqual(mockEvent);
      expect(mockSlugService.generateUnique).toHaveBeenCalledWith(
        'Trận Bạch Đằng năm 938',
        expect.any(Function),
      );
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          category: EventCategory.BATTLE,
          startYear: 938,
          metadata: {
            belligerents: ['Đại Cồ Việt', 'Nam Hán'],
            commanders: ['Ngô Quyền', 'Lưu Hoằng Thao'],
            casualties: 'Lưu Hoằng Thao tử trận',
            tactics: 'Đóng cọc ngầm lòng sông',
            strength: null,
          },
          entities: [
            expect.objectContaining({
              entityId: 'entity-1',
              role: 'PARTICIPANT',
            }),
          ],
        }),
      );
    });

    it('ném BadRequestException nếu endYear nhỏ hơn startYear', async () => {
      await expect(
        service.create({
          title: 'Sự kiện lỗi năm',
          startYear: 1975,
          endYear: 1954,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if topicId is provided but does not exist in repository', async () => {
      mockRepository.checkReferences.mockResolvedValueOnce({
        topicExists: false,
        periodExists: true,
        locationExists: true,
        parentExists: true,
      });

      const dto = {
        topicId: 'non-existent-topic',
        title: 'Sự kiện sai',
        startYear: 1000,
      };

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('tạo sự kiện hiệp ước chuẩn hóa signatories qua TreatyMetadataStrategy', async () => {
      const dto = {
        title: 'Hiệp định Paris năm 1973',
        startYear: 1973,
        category: EventCategory.TREATY,
        metadata: {
          signatories: ['Việt Nam Dân chủ Cộng hòa', 'Mỹ', 'Việt Nam Cộng hòa', 'Chính phủ CMLT'],
          ratifiedDate: '1973-01-27',
          termsSummary: 'Chấm dứt chiến tranh, lập lại hòa bình ở Việt Nam',
        },
      };

      await service.create(dto);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          category: EventCategory.TREATY,
          startYear: 1973,
          metadata: expect.objectContaining({
            signatories: expect.arrayContaining(['Việt Nam Dân chủ Cộng hòa', 'Mỹ']),
            ratifiedDate: '1973-01-27',
          }),
          entities: [],
        }),
      );
    });
  });

  describe('findAll', () => {
    it('gọi repository.findMany và trả về kết quả phân trang khi cache miss', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);

      const result = await service.findAll({ page: 1, limit: 10, category: EventCategory.BATTLE });
      expect(result.items).toEqual([mockEvent]);
      expect(result.total).toBe(1);
      expect(mockRepository.findMany).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        category: EventCategory.BATTLE,
      });
    });
  });

  describe('remove', () => {
    it('chặn xóa sự kiện cha nếu countChildren > 0', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);
      mockRepository.countChildren.mockResolvedValueOnce(2);

      await expect(service.remove('event-uuid-1')).rejects.toThrow(BadRequestException);
    });

    it('xóa sự kiện thành công qua repository khi không có sự kiện con', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);
      mockRepository.countChildren.mockResolvedValueOnce(0);

      const result = await service.remove('event-uuid-1');
      expect(result.success).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith('event-uuid-1');
    });
  });

  describe('event relations & graph', () => {
    it('ném lỗi BadRequestException nếu sự kiện tự liên kết chính nó', async () => {
      await expect(
        service.addRelation('event-uuid-1', {
          targetEventId: 'event-uuid-1',
          relationType: 'LEADS_TO' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('thêm quan hệ thành công và xóa cache liên quan', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findById.mockResolvedValue(mockEvent);
      mockRepository.addRelation = jest.fn().mockResolvedValue({
        id: 'rel-1',
        sourceEventId: 'event-uuid-1',
        targetEventId: 'event-uuid-2',
        relationType: 'LEADS_TO',
      });

      const res = await service.addRelation('event-uuid-1', {
        targetEventId: 'event-uuid-2',
        relationType: 'LEADS_TO' as any,
        description: 'Chiến thắng dẫn tới hòa bình',
      });

      expect(res.id).toBe('rel-1');
      expect(mockRepository.addRelation).toHaveBeenCalled();
    });

    it('xóa quan hệ thành công', async () => {
      mockRepository.findRelationById = jest.fn().mockResolvedValue({
        id: 'rel-1',
        sourceEventId: 'event-uuid-1',
        targetEventId: 'event-uuid-2',
      });
      mockRepository.removeRelation = jest.fn().mockResolvedValue({ id: 'rel-1' });

      const res = await service.removeRelation('rel-1');
      expect(res.success).toBe(true);
      expect(mockRepository.removeRelation).toHaveBeenCalledWith('rel-1');
    });

    it('lấy đồ thị tri thức sự kiện (nodes & edges) chuẩn xác', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findById.mockResolvedValue(mockEvent);
      mockRepository.findRelationsByEventId = jest.fn().mockResolvedValue({
        outgoing: [
          {
            id: 'rel-1',
            sourceEventId: 'event-uuid-1',
            targetEventId: 'event-uuid-2',
            relationType: 'LEADS_TO',
            targetEvent: { id: 'event-uuid-2', title: 'Sự kiện 2' },
          },
        ],
        incoming: [],
      });

      const graph = await service.getEventGraph('event-uuid-1');
      expect(graph.nodes.length).toBe(2);
      expect(graph.edges.length).toBe(1);
    });
  });
});

