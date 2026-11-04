import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HistoricalEntityType } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { PersonTimelineService } from './person-timeline.service';
import { PersonTimelineBuilder } from './person-timeline.builder';
import { StatementDirectionProjector } from './statement-direction.projector';
import { TIMELINE_ITEM_TYPE } from './timeline.constant';

describe('PersonTimelineService', () => {
  let service: PersonTimelineService;
  let prisma: any;
  let redis: any;

  beforeEach(async () => {
    prisma = {
      historicalEntity: {
        findUnique: jest.fn(),
      },
      historicalStatement: {
        findMany: jest.fn(),
      },
    };

    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonTimelineService,
        PersonTimelineBuilder,
        StatementDirectionProjector,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<PersonTimelineService>(PersonTimelineService);
  });

  it('nên ném lỗi NotFoundException khi không tìm thấy thực thể', async () => {
    prisma.historicalEntity.findUnique.mockResolvedValue(null);

    await expect(service.getTimeline('non-existent')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('nên trả về kết quả từ cache nếu có', async () => {
    const cachedData = {
      entityId: 'cached-id',
      entityName: 'Cached Entity',
      items: [],
      totalMilestones: 0,
    };
    redis.get.mockResolvedValue(cachedData);

    const result = await service.getTimeline('cached-id');
    expect(result).toBe(cachedData);
    expect(prisma.historicalEntity.findUnique).not.toHaveBeenCalled();
  });

  it('nên tổng hợp Timeline gồm sinh, mất và phát biểu sự kiện thành công', async () => {
    const mockEntity = {
      id: 'entity-nguyen-trai',
      name: 'Nguyễn Trãi',
      slug: 'nguyen-trai',
      type: HistoricalEntityType.PERSON,
      imageUrl: 'https://example.com/nguyen-trai.jpg',
      person: {
        birthYear: 1380,
        birthDateText: '1380',
        deathYear: 1442,
        deathDateText: '1442',
      },
    };

    const mockStatements = [
      {
        id: 'stmt-1',
        subjectId: 'entity-nguyen-trai',
        objectId: 'event-lam-son',
        predicate: {
          id: 'pred-1',
          code: 'PARTICIPATED_IN',
          label: 'Tham gia',
          inverseLabel: 'Có sự tham gia của',
        },
        object: {
          id: 'event-lam-son',
          type: 'EVENT',
          name: 'Khởi nghĩa Lam Sơn',
          slug: 'khoi-nghia-lam-son',
          startYear: 1418,
          dateText: '1418 - 1427',
          event: { categoryIds: [] },
        },
        qualifiers: {
          role: 'MILITARY_ADVISER',
          roleLabel: 'Quân sư',
        },
        references: [],
        isPrimary: true,
      },
    ];

    prisma.historicalEntity.findUnique.mockResolvedValue(mockEntity);
    prisma.historicalStatement.findMany.mockResolvedValue(mockStatements);

    const result = await service.getTimeline('entity-nguyen-trai', {
      order: 'asc',
    });

    expect(result.entityName).toBe('Nguyễn Trãi');
    expect(result.birthYear).toBe(1380);
    expect(result.deathYear).toBe(1442);
    expect(result.totalMilestones).toBe(3); // Sinh (1380) -> Sự kiện (1418) -> Mất (1442)

    expect(result.items[0].type).toBe(TIMELINE_ITEM_TYPE.BIRTH);
    expect(result.items[0].year).toBe(1380);

    expect(result.items[1].type).toBe(TIMELINE_ITEM_TYPE.EVENT_PARTICIPATION);
    expect(result.items[1].title).toBe('Khởi nghĩa Lam Sơn');
    expect(result.items[1].roleLabel).toBe('Quân sư');
    expect(result.items[1].year).toBe(1418);

    expect(result.items[2].type).toBe(TIMELINE_ITEM_TYPE.DEATH);
    expect(result.items[2].year).toBe(1442);

    expect(redis.set).toHaveBeenCalled();
  });
});
