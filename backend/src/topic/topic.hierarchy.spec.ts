import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ContentStatus } from '@prisma/client';
import { PUBLIC_LANDING_CACHE_KEY } from '../common/constants/cache-keys.constant';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { SlugService } from '../common/services/slug.service';
import { TOPIC_ERROR_MESSAGES, TOPIC_HIERARCHY_CONFIG } from './topic.constant';
import { TopicService } from './topic.service';

type StoredTopic = { id: string; name: string; parentId: string | null };

/** Cây giả: giai-doan → chu-de → chuyen-de, cùng một nhánh khác. */
const TREE: StoredTopic[] = [
  { id: 'giai-doan', name: 'Trung đại', parentId: null },
  { id: 'chu-de', name: 'Nhà Trần', parentId: 'giai-doan' },
  { id: 'chuyen-de', name: 'Kháng chiến chống Nguyên', parentId: 'chu-de' },
  { id: 'nhanh-khac', name: 'Cận đại', parentId: null },
];

/** Chuỗi `length` chủ đề lồng nhau: c1 ← c2 ← … (c1 là gốc). */
const chain = (length: number): StoredTopic[] =>
  Array.from({ length }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Cấp ${i + 1}`,
    parentId: i === 0 ? null : `c${i}`,
  }));

describe('TopicService — phân cấp, gắn/tách con, sắp xếp, cache', () => {
  let service: TopicService;
  let stored: StoredTopic[];
  const prisma = {
    topic: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  const redis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    deleteByPattern: jest.fn(),
  };
  const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    stored = TREE;
    redis.get.mockResolvedValue(null);
    prisma.topic.count.mockResolvedValue(0);
    prisma.topic.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) =>
        Promise.resolve(stored.find((t) => t.id === where.id) ?? null),
    );
    prisma.topic.update.mockImplementation(
      ({ where, data }: { where: { id: string }; data: object }) =>
        Promise.resolve({ id: where.id, ...data }),
    );
    prisma.topic.create.mockImplementation(({ data }: { data: object }) =>
      Promise.resolve({ id: 'moi', ...data }),
    );
    const moduleRef = await Test.createTestingModule({
      providers: [
        TopicService,
        SlugService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: CustomLoggerService, useValue: logger },
      ],
    }).compile();
    service = moduleRef.get(TopicService);
  });

  describe('đổi chủ đề cha', () => {
    it('không làm cha của chính nó', async () => {
      await expect(
        service.update('chu-de', { parentId: 'chu-de' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('không gắn vào con cháu của chính nó (chống vòng lặp)', async () => {
      await expect(
        service.update('giai-doan', { parentId: 'chuyen-de' }),
      ).rejects.toThrow(TOPIC_ERROR_MESSAGES.CYCLE_DETECTED);
      expect(prisma.topic.update).not.toHaveBeenCalled();
    });

    it('chủ đề cha không tồn tại → 404', async () => {
      await expect(
        service.update('chu-de', { parentId: 'khong-co' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('chuyển sang nhánh khác hợp lệ: xoá cache của cả cha cũ và cha mới', async () => {
      await service.update('chuyen-de', { parentId: 'nhanh-khac' });

      expect(prisma.topic.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'chuyen-de' },
          data: expect.objectContaining({ parentId: 'nhanh-khac' }),
        }),
      );
      expect(redis.del).toHaveBeenCalledWith('topic:detail:chu-de');
      expect(redis.del).toHaveBeenCalledWith('topic:detail:nhanh-khac');
      expect(redis.del).toHaveBeenCalledWith(PUBLIC_LANDING_CACHE_KEY);
    });

    it('gửi parentId rỗng thì tách thành chủ đề gốc', async () => {
      await service.update('chuyen-de', { parentId: '' });

      expect(prisma.topic.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ parentId: null }),
        }),
      );
    });

    it(`cây sâu hơn ${TOPIC_HIERARCHY_CONFIG.MAX_DEPTH} cấp bị chặn, đúng ngưỡng thì cho phép`, async () => {
      stored = chain(TOPIC_HIERARCHY_CONFIG.MAX_DEPTH);

      await expect(
        service.create({
          name: 'Quá sâu',
          parentId: `c${TOPIC_HIERARCHY_CONFIG.MAX_DEPTH}`,
        }),
      ).rejects.toThrow(TOPIC_ERROR_MESSAGES.MAX_DEPTH_EXCEEDED);

      await expect(
        service.create({
          name: 'Vừa đủ',
          parentId: `c${TOPIC_HIERARCHY_CONFIG.MAX_DEPTH - 1}`,
        }),
      ).resolves.toMatchObject({ name: 'Vừa đủ' });
    });
  });

  it('tạo chủ đề: mặc định bản nháp, sinh slug tiếng Việt, xoá cache danh sách', async () => {
    await service.create({ name: ' Nhà Lý ', parentId: 'giai-doan' });

    expect(prisma.topic.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Nhà Lý',
          slug: 'nha-ly',
          parentId: 'giai-doan',
          status: ContentStatus.DRAFT,
        }),
      }),
    );
    expect(redis.deleteByPattern).toHaveBeenCalledWith(
      `${TOPIC_HIERARCHY_CONFIG.CACHE_PREFIX}:*`,
    );
  });

  describe('gắn / tách chủ đề con', () => {
    it('gắn nhiều con trong 1 transaction', async () => {
      const result = await service.assignChildren('nhanh-khac', [
        'chu-de',
        'chuyen-de',
      ]);

      expect(result.count).toBe(2);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.topic.update).toHaveBeenCalledWith({
        where: { id: 'chuyen-de' },
        data: { parentId: 'nhanh-khac' },
      });
    });

    it('không gắn tổ tiên làm con (vòng lặp) — không ghi gì', async () => {
      await expect(
        service.assignChildren('chuyen-de', ['giai-doan']),
      ).rejects.toThrow(TOPIC_ERROR_MESSAGES.CYCLE_DETECTED);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('danh sách rỗng hoặc tự gắn chính mình → 400; cha không tồn tại → 404', async () => {
      await expect(service.assignChildren('chu-de', [])).rejects.toThrow(
        BadRequestException,
      );
      await expect(
        service.assignChildren('chu-de', ['chu-de']),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.assignChildren('khong-co', ['chu-de']),
      ).rejects.toThrow(NotFoundException);
    });

    it('tách con: chỉ khi đúng là con của chủ đề đó', async () => {
      await expect(service.removeChild('nhanh-khac', 'chu-de')).rejects.toThrow(
        TOPIC_ERROR_MESSAGES.CHILD_NOT_BELONG_TO_PARENT,
      );
      await expect(service.removeChild('chu-de', 'khong-co')).rejects.toThrow(
        NotFoundException,
      );

      await service.removeChild('giai-doan', 'chu-de');
      expect(prisma.topic.update).toHaveBeenCalledWith({
        where: { id: 'chu-de' },
        data: { parentId: null },
      });
    });
  });

  it('sắp xếp lại: ghi trong 1 transaction; danh sách rỗng → 400', async () => {
    await expect(service.reorder([])).rejects.toThrow(BadRequestException);

    await service.reorder([
      { id: 'chu-de', displayOrder: 2 },
      { id: 'nhanh-khac', displayOrder: 1 },
    ]);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.topic.update).toHaveBeenCalledWith({
      where: { id: 'nhanh-khac' },
      data: { displayOrder: 1 },
    });
  });

  describe('danh sách và cache', () => {
    it('có cache thì trả luôn, không truy vấn DB', async () => {
      const cached = { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      redis.get.mockResolvedValue(cached);

      await expect(service.findAll({})).resolves.toBe(cached);
      expect(prisma.topic.findMany).not.toHaveBeenCalled();
    });

    it('lọc chủ đề gốc + từ khoá, giới hạn tối đa 100 mỗi trang', async () => {
      prisma.topic.findMany.mockResolvedValue([]);
      prisma.topic.count.mockResolvedValue(0);

      const result = await service.findAll({
        isRootOnly: true,
        search: 'Trần',
        limit: 999,
        page: 2,
      });

      expect(prisma.topic.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            parentId: null,
            OR: [
              { name: { contains: 'Trần', mode: 'insensitive' } },
              { description: { contains: 'Trần', mode: 'insensitive' } },
            ],
          },
          take: 100,
          skip: 100,
        }),
      );
      expect(result.limit).toBe(100);
    });

    it('Redis lỗi khi xoá cache thì chỉ ghi log, vẫn lưu chủ đề', async () => {
      redis.deleteByPattern.mockRejectedValueOnce(new Error('redis down'));

      await expect(service.create({ name: 'Nhà Hồ' })).resolves.toMatchObject({
        name: 'Nhà Hồ',
      });
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
