import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ContentStatus, LearningPathType, TopicIcon } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { SlugService } from '../common/services/slug.service';
import { toSlug } from '../common/utils/slug.util';
import {
  PUBLIC_LANDING_CACHE_KEY,
  PUBLIC_LANDING_CACHE_TTL_SECONDS,
} from '../common/constants/cache-keys.constant';
import { LandingContentFacade } from './landing-content.facade';
import { LandingSectionRegistry } from './strategies/landing-section.registry';
import {
  ChaptersSectionStrategy,
  KnowledgeSectionStrategy,
} from './strategies/landing-section.strategy';
import {
  LANDING_SECTION_STRATEGIES,
  LandingSection,
} from './public-content.constant';
import { buildTimeLabel } from './mappers/public-content.mapper';

describe('Phase 1 - SlugService & PublicContentModule', () => {
  describe('SlugService & toSlug', () => {
    let slugService: SlugService;

    beforeEach(() => {
      slugService = new SlugService();
    });

    it('chuyển chuỗi tiếng Việt có dấu sang slug chuẩn không dấu', () => {
      expect(
        toSlug('Giai đoạn 1954 - 1960: Giữ gìn lực lượng & Đồng Khởi'),
      ).toBe('giai-doan-1954-1960-giu-gin-luc-luong-dong-khoi');
    });

    it('thêm hậu tố số tăng dần khi slug bị trùng', async () => {
      const existing = new Set(['van-lang-au-lac', 'van-lang-au-lac-2']);
      const result = await slugService.generateUnique(
        'Văn Lang - Âu Lạc',
        async (candidate) => existing.has(candidate),
      );
      expect(result).toBe('van-lang-au-lac-3');
    });
  });

  describe('buildTimeLabel', () => {
    it('tự sinh nhãn TCN và năm dương lịch', () => {
      expect(buildTimeLabel(-179, 938)).toBe('(179 TCN - 938)');
      expect(buildTimeLabel(1945, null)).toBe('(1945 - nay)');
    });
  });

  describe('LandingContentFacade & Strategies', () => {
    let facade: LandingContentFacade;
    let registry: LandingSectionRegistry;

    const mockPublishedPeriod = {
      id: 'p-1',
      name: 'Kháng chiến chống Mỹ (1954 - 1975)',
      slug: 'khang-chien-chong-my-1954-1975',
      timeLabel: null,
      region: 'Toàn quốc',
      startYear: 1954,
      endYear: 1975,
      description: 'Mô tả giai đoạn',
      coverImageUrl: 'https://example.com/p1.jpg',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockChapterTopic = {
      id: 't-chapter-1',
      periodId: 'p-1',
      parentId: null,
      pathType: LearningPathType.CHRONOLOGICAL,
      name: 'Phong trào Đồng Khởi',
      slug: 'phong-trao-dong-khoi',
      eyebrow: 'GIAI ĐOẠN 1954 - 1960',
      icon: null,
      isFeatured: true,
      description: 'Mô tả chương sử',
      coverImageUrl: 'https://example.com/c1.jpg',
      isSequential: true,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockKnowledgeTopic = {
      id: 't-know-1',
      periodId: null,
      parentId: null,
      pathType: LearningPathType.THEMATIC,
      name: 'Văn hóa & Đời sống',
      slug: 'van-hoa-doi-song',
      eyebrow: null,
      icon: TopicIcon.Landmark,
      isFeatured: false,
      description: null,
      coverImageUrl: null,
      isSequential: false,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockFeaturedFigure = {
      id: 'fig-1',
      periodId: 'p-1',
      name: 'Chủ tịch Hồ Chí Minh',
      slug: 'chu-tich-ho-chi-minh',
      type: 'PERSON',
      tagline: 'Anh hùng giải phóng dân tộc',
      biography: 'Người sáng lập Đảng Cộng sản Việt Nam',
      imageUrl: 'https://example.com/hcm.jpg',
      birthYear: 1890,
      deathYear: 1969,
      isFeatured: true,
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockPrisma = {
      period: {
        findMany: jest.fn().mockResolvedValue([mockPublishedPeriod]),
      },
      topic: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          if (where.pathType === LearningPathType.CHRONOLOGICAL) {
            return Promise.resolve([mockChapterTopic]);
          }
          return Promise.resolve([mockKnowledgeTopic]);
        }),
      },
      historicalEntity: {
        findMany: jest.fn().mockResolvedValue([mockFeaturedFigure]),
      },
    };

    const mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
    };

    beforeEach(async () => {
      jest.clearAllMocks();
      mockRedis.get.mockResolvedValue(null);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          { provide: PrismaService, useValue: mockPrisma },
          { provide: RedisService, useValue: mockRedis },
          ChaptersSectionStrategy,
          KnowledgeSectionStrategy,
          {
            provide: LANDING_SECTION_STRATEGIES,
            useFactory: (
              c: ChaptersSectionStrategy,
              k: KnowledgeSectionStrategy,
            ) => [c, k],
            inject: [ChaptersSectionStrategy, KnowledgeSectionStrategy],
          },
          LandingSectionRegistry,
          LandingContentFacade,
        ],
      }).compile();

      facade = module.get(LandingContentFacade);
      registry = module.get(LandingSectionRegistry);
    });

    it('trả về dữ liệu từ DB khi cache miss và lưu vào Redis', async () => {
      const result = await facade.getLanding();

      expect(result.periods).toHaveLength(1);
      expect(result.periods[0].timeLabel).toBe('(1954 - 1975)');
      expect(result.chapters).toHaveLength(1);
      expect(result.chapters[0].eyebrow).toBe('GIAI ĐOẠN 1954 - 1960');
      expect(result.knowledge).toHaveLength(1);
      expect(result.knowledge[0].icon).toBe(TopicIcon.Landmark);
      expect(result.figures).toHaveLength(1);
      expect(result.figures[0].name).toBe('Chủ tịch Hồ Chí Minh');
      expect(result.figures[0].tagline).toBe('Anh hùng giải phóng dân tộc');

      expect(mockPrisma.period.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ContentStatus.PUBLISHED },
        }),
      );
      expect(mockRedis.set).toHaveBeenCalledWith(
        PUBLIC_LANDING_CACHE_KEY,
        result,
        PUBLIC_LANDING_CACHE_TTL_SECONDS,
      );
    });

    it('trả về ngay dữ liệu từ Redis khi cache hit, không truy vấn DB', async () => {
      const cachedPayload = {
        periods: [],
        chapters: [],
        knowledge: [],
        figures: [],
      };
      mockRedis.get.mockResolvedValueOnce(cachedPayload);

      const result = await facade.getLanding();
      expect(result).toBe(cachedPayload);
      expect(mockPrisma.period.findMany).not.toHaveBeenCalled();
    });

    it('ném NotFoundException nếu truyền section không hợp lệ vào registry', () => {
      expect(() =>
        registry.resolve('UNKNOWN_SECTION' as LandingSection),
      ).toThrow(NotFoundException);
    });
  });
});
