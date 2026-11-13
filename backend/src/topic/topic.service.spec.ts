import { Test, TestingModule } from '@nestjs/testing';
import { TopicService } from './topic.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { SlugService } from '../common/services/slug.service';
import { NotFoundException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';

describe('TopicService', () => {
  let service: TopicService;

  const mockTopic = {
    id: 'topic-uuid-1',
    name: 'Khởi nghĩa Hai Bà Trưng',
    slug: 'khoi-nghia-hai-ba-trung',
    isFeatured: false,
    description: 'Cuộc khởi nghĩa chống ách đô hộ nhà Hán',
    coverImageUrl: `https://${'example.com/cover.jpg'}`,
    isSequential: false,
    displayOrder: 1,
    status: ContentStatus.PUBLISHED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
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
        SlugService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: CustomLoggerService, useValue: mockCustomLogger },
      ],
    }).compile();

    service = module.get<TopicService>(TopicService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a topic', async () => {
      const dto = {
        name: 'Khởi nghĩa Hai Bà Trưng',
      };

      const result = await service.create(dto);
      expect(result).toEqual(mockTopic);
      expect(mockPrismaService.topic.create).toHaveBeenCalled();
    });

    // Topic không có periodId (xem comment đầu topic.prisma — Chủ đề là thẻ phân loại
    // độc lập theo môn học, không gắn Giai đoạn); create() chỉ validate parentId.
    it('should throw NotFoundException if parent topic does not exist', async () => {
      mockPrismaService.topic.findUnique.mockResolvedValueOnce(null);
      const dto = {
        parentId: 'non-existent-topic',
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

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTopicTree', () => {
    it('dựng cây nhiều cấp và mỗi nút mang theo bài học của chính nó', async () => {
      const lesson = {
        id: 'lesson-1',
        title: 'Bạch Đằng 1288',
        slug: 'bach-dang-1288',
      };
      mockPrismaService.topic.findMany.mockResolvedValueOnce([
        { ...mockTopic, id: 'root', parentId: null, lessons: [] },
        { ...mockTopic, id: 'child', parentId: 'root', lessons: [] },
        { ...mockTopic, id: 'grandchild', parentId: 'child', lessons: [] },
        { ...mockTopic, id: 'leaf', parentId: 'grandchild', lessons: [lesson] },
      ]);

      const tree = await service.getTopicTree();

      expect(mockPrismaService.topic.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({ lessons: expect.any(Object) }),
        }),
      );
      expect(tree).toHaveLength(1);
      const leaf = tree[0].children[0].children[0].children[0];
      expect(leaf.id).toBe('leaf');
      expect(leaf.lessons).toEqual([lesson]);
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
