import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContentStatus, HistoricalEntityType, MediaType } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { SlugService } from '../common/services/slug.service';
import { TaxonomyService } from '../taxonomy/taxonomy.service';
import { PUBLIC_LANDING_CACHE_KEY } from '../common/constants/cache-keys.constant';
import { HistoricalEntityService } from './historical-entity.service';
import { EntityRelationType } from './historical-entity.constant';

describe('Phase 2 - HistoricalEntityService Unit Tests', () => {
  let service: HistoricalEntityService;

  const mockEntity = {
    id: 'ent-1',
    periodId: 'p-1',
    name: 'Đại tướng Võ Nguyên Giáp',
    slug: 'dai-tuong-vo-nguyen-giap',
    type: HistoricalEntityType.PERSON,
    tagline: 'Tổng Tư lệnh QĐND Việt Nam',
    description: 'Mô tả chi tiết',
    aliases: ['Võ Giáp', 'Anh Văn'],
    imageUrl: 'https://example.com/vng.jpg',
    imageCaption: 'Đại tướng Võ Nguyên Giáp tại chiến khu Việt Bắc',
    metadata: { rank: 'Đại tướng' },
    person: {
      birthYear: 1911,
      deathYear: 2013,
      birthDateLabel: '25/08/1911',
      deathDateLabel: '04/10/2013',
    },
    isFeatured: true,
    displayOrder: 2,
    status: ContentStatus.PUBLISHED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTargetEntity = {
    id: 'ent-2',
    name: 'Quân đội Nhân dân Việt Nam',
    slug: 'quan-doi-nhan-dan-viet-nam',
    type: HistoricalEntityType.MILITARY_FORCE,
    isFeatured: false,
    displayOrder: 1,
    status: ContentStatus.PUBLISHED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRelation = {
    id: 'rel-1',
    sourceEntityId: 'ent-1',
    targetEntityId: 'ent-2',
    relationType: EntityRelationType.LEADER_OF,
    startYear: 1944,
    endYear: 1975,
    note: 'Tổng tư lệnh tối cao',
    createdAt: new Date(),
  };

  const mockMedia = {
    id: 'med-1',
    entityId: 'ent-1',
    type: MediaType.DOCUMENT,
    url: 'https://example.com/tai-lieu-vng.pdf',
    caption: 'Bản dịch toàn văn',
    displayOrder: 0,
    createdAt: new Date(),
  };

  const mockPrisma = {
    historicalEntity: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    historicalEntityRelation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    historicalEntityMedia: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    period: {
      findUnique: jest.fn(),
    },
  };

  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    deleteByPattern: jest.fn().mockResolvedValue(undefined),
  };

  const mockLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockSlugService = {
    generateUnique: jest.fn().mockResolvedValue('dai-tuong-vo-nguyen-giap'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoricalEntityService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: CustomLoggerService, useValue: mockLogger },
        { provide: SlugService, useValue: mockSlugService },
        {
          provide: TaxonomyService,
          useValue: {
            syncSiteTerms: jest.fn(),
            requireTermCode: jest.fn(async (_g: string, v: string) => v),
            requireTermCodes: jest.fn(async (_g: string, v: string[]) => v),
          },
        },
      ],
    }).compile();

    service = module.get(HistoricalEntityService);
  });

  it('tạo thực thể mới với slug duy nhất, aliases và xóa cache landing', async () => {
    mockPrisma.period.findUnique.mockResolvedValueOnce({ id: 'p-1' });
    mockPrisma.historicalEntity.create.mockResolvedValueOnce(mockEntity);

    const result = await service.create({
      name: 'Đại tướng Võ Nguyên Giáp',
      type: HistoricalEntityType.PERSON,
      periodId: 'p-1',
      aliases: ['Võ Giáp', 'Anh Văn'],
      birthYear: 1911,
      deathYear: 2013,
      isFeatured: true,
      status: ContentStatus.PUBLISHED,
    });

    expect(mockSlugService.generateUnique).toHaveBeenCalledWith(
      'Đại tướng Võ Nguyên Giáp',
      expect.any(Function),
    );
    expect(mockPrisma.historicalEntity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: 'dai-tuong-vo-nguyen-giap',
          aliases: ['Võ Giáp', 'Anh Văn'],
          person: expect.objectContaining({
            create: expect.objectContaining({
              birthYear: 1911,
              deathYear: 2013,
            }),
          }),
        }),
      }),
    );
    expect(mockRedis.del).toHaveBeenCalledWith(PUBLIC_LANDING_CACHE_KEY);
  });

  it('ném BadRequestException khi birthYear lớn hơn deathYear', async () => {
    await expect(
      service.create({
        name: 'Thực thể lỗi năm',
        type: HistoricalEntityType.PERSON,
        birthYear: 2000,
        deathYear: 1950,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('ném NotFoundException khi periodId không tồn tại', async () => {
    mockPrisma.period.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.create({
        name: 'Thực thể lỗi thời kỳ',
        type: HistoricalEntityType.PERSON,
        periodId: 'invalid-period',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('findAll lọc theo type và trả về danh sách phân trang', async () => {
    mockPrisma.historicalEntity.findMany.mockResolvedValueOnce([mockEntity]);
    mockPrisma.historicalEntity.count.mockResolvedValueOnce(1);

    const res = await service.findAll({
      page: 1,
      limit: 10,
      type: HistoricalEntityType.PERSON,
    });

    expect(mockPrisma.historicalEntity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: HistoricalEntityType.PERSON,
        }),
      }),
    );
    expect(res.items).toHaveLength(1);
    expect(res.items[0].birthYear).toBe(1911);
  });

  // Test Quan hệ hồi quy N-N
  describe('Quan hệ hồi quy N-N (Knowledge Graph)', () => {
    it('ném BadRequestException khi sourceEntityId tự nối với chính nó (Self Loop)', async () => {
      await expect(
        service.addRelation('ent-1', {
          targetEntityId: 'ent-1',
          relationType: EntityRelationType.LEADER_OF,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném BadRequestException khi endYear < startYear trong quan hệ', async () => {
      await expect(
        service.addRelation('ent-1', {
          targetEntityId: 'ent-2',
          relationType: EntityRelationType.LEADER_OF,
          startYear: 2000,
          endYear: 1990,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('tạo mối quan hệ hợp lệ thành công qua upsert', async () => {
      mockPrisma.historicalEntity.findUnique
        .mockResolvedValueOnce(mockEntity)
        .mockResolvedValueOnce(mockTargetEntity);
      mockPrisma.historicalEntityRelation.create.mockResolvedValueOnce(
        mockRelation,
      );

      const rel = await service.addRelation('ent-1', {
        targetEntityId: 'ent-2',
        relationType: EntityRelationType.LEADER_OF,
        startYear: 1944,
        endYear: 1975,
      });

      expect(mockPrisma.historicalEntityRelation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sourceEntityId: 'ent-1',
            targetEntityId: 'ent-2',
            relationType: EntityRelationType.LEADER_OF,
          }),
        }),
      );
      expect(rel.relationType).toBe(EntityRelationType.LEADER_OF);
    });

    it('getEntityGraph trả về danh sách nodes và edges từ quan hệ', async () => {
      mockPrisma.historicalEntity.findUnique.mockResolvedValueOnce(mockEntity);
      mockPrisma.historicalEntityRelation.findMany
        .mockResolvedValueOnce([
          {
            ...mockRelation,
            targetEntity: mockTargetEntity,
          },
        ])
        .mockResolvedValueOnce([]);

      const graph = await service.getEntityGraph('ent-1');
      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0].relationType).toBe(EntityRelationType.LEADER_OF);
    });
  });

  // Test Tư liệu Media
  describe('Tư liệu Media / File', () => {
    it('thêm tài liệu media mới thành công', async () => {
      mockPrisma.historicalEntity.findUnique.mockResolvedValueOnce(mockEntity);
      mockPrisma.historicalEntityMedia.create.mockResolvedValueOnce(mockMedia);

      const media = await service.addMedia('ent-1', {
        type: MediaType.DOCUMENT,
        url: 'https://example.com/tai-lieu-vng.pdf',
        caption: 'Bản dịch toàn văn',
      });

      expect(mockPrisma.historicalEntityMedia.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityId: 'ent-1',
            type: MediaType.DOCUMENT,
          }),
        }),
      );
      expect(media.type).toBe(MediaType.DOCUMENT);
    });
  });
});
