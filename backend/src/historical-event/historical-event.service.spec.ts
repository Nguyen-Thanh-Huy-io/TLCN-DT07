import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventCategory } from '@prisma/client';
import { HistoricalEventService } from './historical-event.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { SlugService } from '../common/services/slug.service';
import { HISTORICAL_EVENT_TOKENS } from './historical-event.constant';
import { TaxonomyService } from '../taxonomy/taxonomy.service';
import { PrismaService } from '../common/services/prisma.service';

/** Cây loại sự kiện thu nhỏ: trường thông tin khai báo ở nút và kế thừa xuống nút con. */
const CATEGORY_TERMS = [
  {
    id: 't-mil', groupCode: 'EVENT_CATEGORY', code: 'MILITARY', label: 'Quân sự', parentId: null, aliases: [],
    meta: {
      legacyCategory: 'WAR',
      fields: [
        { key: 'belligerents', label: 'Các bên tham chiến', type: 'list' },
        { key: 'commanders', label: 'Chỉ huy', type: 'list' },
        { key: 'strength', label: 'Binh lực', type: 'text' },
        { key: 'casualties', label: 'Thương vong', type: 'text' },
      ],
    },
  },
  {
    id: 't-battle', groupCode: 'EVENT_CATEGORY', code: 'BATTLE', label: 'Trận đánh', parentId: 't-mil', aliases: ['trận đánh'],
    meta: { fields: [{ key: 'tactics', label: 'Chiến thuật', type: 'textarea' }] },
  },
  {
    id: 't-pol', groupCode: 'EVENT_CATEGORY', code: 'POLITICS_DIPLOMACY', label: 'Chính trị', parentId: null, aliases: [],
    meta: { legacyCategory: 'POLITICAL_EVENT', fields: [{ key: 'participants', label: 'Các bên', type: 'list' }] },
  },
  {
    id: 't-treaty', groupCode: 'EVENT_CATEGORY', code: 'TREATY', label: 'Hiệp ước', parentId: 't-pol', aliases: [],
    meta: {
      fields: [
        { key: 'signatories', label: 'Các bên ký kết', type: 'list' },
        { key: 'ratifiedDate', label: 'Ngày phê chuẩn', type: 'text' },
        { key: 'termsSummary', label: 'Tóm tắt điều khoản', type: 'textarea' },
      ],
    },
  },
  { id: 't-soc', groupCode: 'EVENT_CATEGORY', code: 'SOCIETY_CULTURE', label: 'Văn hóa – Xã hội', parentId: null, aliases: [], meta: { legacyCategory: 'CULTURE_SCIENCE' } },
  { id: 't-legend', groupCode: 'EVENT_CATEGORY', code: 'LEGEND', label: 'Truyền thuyết', parentId: 't-soc', aliases: [], meta: null },
  { id: 't-other', groupCode: 'EVENT_CATEGORY', code: 'OTHER', label: 'Khác', parentId: null, aliases: [], meta: null },
  // Nhóm khác cùng bảng: loại quan hệ sự kiện (chỉ khớp khi lọc theo nhóm EVENT_RELATION).
  { id: 't-causes', groupCode: 'EVENT_RELATION', code: 'CAUSES', label: 'Là nguyên nhân của', parentId: null, aliases: ['gây ra'], meta: null },
];

describe('HistoricalEventService (loại sự kiện theo danh mục dùng chung)', () => {
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
        TaxonomyService,
        {
          provide: PrismaService,
          useValue: { taxonomyTerm: { findMany: jest.fn().mockResolvedValue(CATEGORY_TERMS) } },
        },
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
    it('tạo sự kiện từ mã enum cũ: gắn loại tương ứng và chuẩn hóa metadata theo trường kế thừa', async () => {
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
          categoryIds: ['t-battle'],
          startYear: 938,
          metadata: {
            belligerents: ['Đại Cồ Việt', 'Nam Hán'],
            commanders: ['Ngô Quyền', 'Lưu Hoằng Thao'],
            casualties: 'Lưu Hoằng Thao tử trận',
            tactics: 'Đóng cọc ngầm lòng sông',
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

    it('tạo sự kiện hiệp ước chuẩn hóa signatories theo trường của loại Hiệp ước', async () => {
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

  describe('loại sự kiện nhiều giá trị', () => {
    it('gắn nhiều loại: loại đầu là loại chính, metadata gộp trường của mọi loại và giữ khóa lạ', async () => {
      await service.create({
        title: 'Hòa ước sau chiến thắng',
        startYear: 1077,
        categoryIds: ['t-treaty', 't-battle'],
        metadata: {
          signatories: 'Đại Việt; Nhà Tống',
          tactics: '  Đánh vào lòng địch  ',
          cause: 'Giữ nguyên khóa không khai báo',
        },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          category: EventCategory.TREATY,
          categoryIds: ['t-treaty', 't-battle'],
          metadata: {
            signatories: ['Đại Việt', 'Nhà Tống'],
            tactics: 'Đánh vào lòng địch',
            cause: 'Giữ nguyên khóa không khai báo',
          },
        }),
      );
    });

    it('loại mới ngoài enum cũ (Truyền thuyết) ghi enum theo legacyCategory của nút cha', async () => {
      await service.create({ title: 'Sơn Tinh – Thủy Tinh', startYear: -258, categoryIds: ['t-legend'] });
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ category: EventCategory.CULTURE_SCIENCE, categoryIds: ['t-legend'] }),
      );
    });

    it('từ chối id loại không thuộc danh mục', async () => {
      await expect(
        service.create({ title: 'Sai loại', startYear: 1000, categoryIds: ['khong-ton-tai'] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('chỉ gửi entityIds thì giữ vai trò, mô tả vai trò của liên kết cũ; thực thể mới là PARTICIPANT', async () => {
      mockRepository.findById.mockResolvedValueOnce({
        ...mockEvent,
        entities: [
          { entityId: 'ngo-quyen', role: 'COMMANDER', roleLabel: 'Chủ tướng', isPrimary: true, displayOrder: 0, notes: 'ghi chú' },
        ],
      });

      await service.update('event-uuid-1', { entityIds: ['ngo-quyen', 'entity-moi'] });

      expect(mockRepository.update).toHaveBeenCalledWith(
        'event-uuid-1',
        expect.objectContaining({
          entities: [
            { entityId: 'ngo-quyen', role: 'COMMANDER', roleLabel: 'Chủ tướng', isPrimary: true, displayOrder: 0, notes: 'ghi chú' },
            { entityId: 'entity-moi', role: 'PARTICIPANT', roleLabel: null, isPrimary: false, displayOrder: 1, notes: null },
          ],
        }),
      );
    });
  });

  describe('findAll', () => {
    it('lọc theo nút cha ra cả loại con', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);

      const result = await service.findAll({ page: 1, limit: 10, category: 'MILITARY' });
      expect(result.items).toEqual([mockEvent]);
      expect(result.total).toBe(1);
      expect(mockRepository.findMany).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        category: 'MILITARY',
        categoryTermIds: ['t-mil', 't-battle'],
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

      // Alias "gây ra" được quy về mã chuẩn CAUSES của danh mục EVENT_RELATION.
      const res = await service.addRelation('event-uuid-1', {
        targetEventId: 'event-uuid-2',
        relationType: 'gây ra',
        description: 'Chiến thắng dẫn tới hòa bình',
      });

      expect(res.id).toBe('rel-1');
      expect(mockRepository.addRelation).toHaveBeenCalledWith(
        expect.objectContaining({ relationType: 'CAUSES' }),
      );
    });

    it('từ chối loại quan hệ không có trong danh mục', async () => {
      mockRepository.findById.mockResolvedValue(mockEvent);
      await expect(
        service.addRelation('event-uuid-1', { targetEventId: 'event-uuid-2', relationType: 'LEADS_TO' }),
      ).rejects.toThrow(BadRequestException);
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

