import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { TagService } from './tag.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';

describe('TagService', () => {
  let service: TagService;
  let prisma: PrismaService;
  let redis: RedisService;

  const mockTag = {
    id: 'tag-1',
    name: 'Kháng chiến chống Pháp',
    description: 'Mô tả tag',
    colorHex: '#FF5733',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    tag: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
    },
    lessonTag: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    deleteByPattern: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<TagService>(TagService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('tạo tag thành công khi tên chưa tồn tại', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(null);
      mockPrismaService.tag.create.mockResolvedValue(mockTag);

      const result = await service.create({ name: 'Kháng chiến chống Pháp' });
      expect(result).toEqual(mockTag);
      expect(mockRedisService.deleteByPattern).toHaveBeenCalled();
    });

    it('báo lỗi ConflictException khi tên tag đã tồn tại', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);

      await expect(service.create({ name: 'Kháng chiến chống Pháp' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('trả về danh sách tag từ Redis cache nếu có', async () => {
      const cached = { items: [mockTag], total: 1, page: 1, limit: 10, totalPages: 1 };
      mockRedisService.get.mockResolvedValue(cached);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result).toEqual(cached);
      expect(mockPrismaService.tag.findMany).not.toHaveBeenCalled();
    });

    it('query DB và lưu Redis nếu cache miss', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.tag.findMany.mockResolvedValue([mockTag]);
      mockPrismaService.tag.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(mockRedisService.set).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('trả về chi tiết tag nếu tìm thấy', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);

      const result = await service.findOne('tag-1');
      expect(result).toEqual(mockTag);
    });

    it('báo lỗi NotFoundException nếu không tìm thấy tag', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.tag.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('attachTagsToLesson', () => {
    it('báo lỗi NotFoundException nếu bài học không tồn tại', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue(null);

      await expect(
        service.attachTagsToLesson('invalid-lesson-id', { tagIds: ['tag-1'] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('báo lỗi BadRequestException nếu một trong các tagId không tồn tại', async () => {
      mockPrismaService.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });
      mockPrismaService.tag.findMany.mockResolvedValue([]);

      await expect(
        service.attachTagsToLesson('lesson-1', { tagIds: ['invalid-tag-id'] }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
