import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { SlugService } from '../common/services/slug.service';
import { TimelineService } from './timeline.service';

describe('TimelineService', () => {
  let service: TimelineService;
  const tx = {
    timeline: { update: jest.fn() },
    timelineNode: { deleteMany: jest.fn(), createMany: jest.fn() },
  };
  const prisma = {
    timeline: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'tl-1' }),
      delete: jest.fn(),
    },
    article: { count: jest.fn() },
    $transaction: jest.fn((fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.timeline.findUnique.mockImplementation(
      ({
        where,
      }: {
        where: { id?: string; slug?: string; topicId?: string };
      }) => {
        if (where.slug || where.topicId) return null;
        return {
          id: where.id,
          slug: 'dong-thoi-gian',
          topicId: null,
          status: ContentStatus.DRAFT,
          nodes: [],
        };
      },
    );
    const moduleRef = await Test.createTestingModule({
      providers: [
        TimelineService,
        SlugService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(TimelineService);
  });

  describe('create', () => {
    it('lưu mốc theo đúng thứ tự gửi lên và sinh slug từ tiêu đề', async () => {
      await service.create({
        title: 'Thời Trần',
        nodes: [
          { title: 'Lập triều', year: 1226 },
          { title: 'Bạch Đằng', year: 1288 },
        ],
      });

      const data = prisma.timeline.create.mock.calls[0][0].data;
      expect(data.slug).toBe('thoi-tran');
      expect(
        data.nodes.create.map((n: { title: string; displayOrder: number }) => [
          n.title,
          n.displayOrder,
        ]),
      ).toEqual([
        ['Lập triều', 0],
        ['Bạch Đằng', 1],
      ]);
    });

    it('nhận năm TCN (số âm)', async () => {
      await expect(
        service.create({
          title: 'Cổ đại',
          nodes: [{ title: 'Âu Lạc', year: -257 }],
        }),
      ).resolves.toBeDefined();
    });

    it('chặn năm kết thúc trước năm bắt đầu', async () => {
      await expect(
        service.create({
          title: 'Sai',
          nodes: [{ title: 'x', year: 1288, endYear: 1200 }],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.timeline.create).not.toHaveBeenCalled();
    });

    it('chặn mốc trỏ tới bài viết không tồn tại', async () => {
      prisma.article.count.mockResolvedValue(1);

      await expect(
        service.create({
          title: 'Có bài',
          nodes: [
            { title: 'a', articleId: 'art-1' },
            { title: 'b', articleId: 'art-khong-co' },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('slug tự đặt bị trùng thì báo 409', async () => {
      prisma.timeline.findUnique.mockResolvedValueOnce({ id: 'khac' });

      await expect(
        service.create({ title: 'Trùng', slug: 'da-co' }),
      ).rejects.toThrow(ConflictException);
    });

    it('chủ đề đã gắn Timeline khác thì báo 409', async () => {
      prisma.timeline.findUnique.mockImplementation(
        ({ where }: { where: { topicId?: string } }) =>
          where.topicId === 'topic-1'
            ? { id: 'tl-khac', title: 'Nhà Trần' }
            : null,
      );

      await expect(
        service.create({ title: 'Mới', topicId: 'topic-1' }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.timeline.create).not.toHaveBeenCalled();
    });

    it('xuất bản mà chưa gắn Chủ đề thì báo 400', async () => {
      await expect(
        service.create({ title: 'Chưa gắn', status: ContentStatus.PUBLISHED }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.timeline.create).not.toHaveBeenCalled();
    });

    it('xuất bản kèm Chủ đề thì tạo được', async () => {
      await expect(
        service.create({
          title: 'Có chủ đề',
          topicId: 'topic-moi',
          status: ContentStatus.PUBLISHED,
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('update', () => {
    it('gửi danh sách mốc thì thay toàn bộ mốc cũ trong 1 transaction', async () => {
      await service.update('tl-1', {
        nodes: [{ title: 'Mốc mới', year: 938 }],
      });

      expect(tx.timelineNode.deleteMany).toHaveBeenCalledWith({
        where: { timelineId: 'tl-1' },
      });
      expect(tx.timelineNode.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({ title: 'Mốc mới', timelineId: 'tl-1' }),
        ],
      });
    });

    it('không gửi mốc thì giữ nguyên mốc cũ', async () => {
      await service.update('tl-1', { description: 'Mô tả mới' });

      expect(tx.timeline.update).toHaveBeenCalled();
      expect(tx.timelineNode.deleteMany).not.toHaveBeenCalled();
    });

    it('gửi mảng rỗng thì xoá hết mốc', async () => {
      await service.update('tl-1', { nodes: [] });

      expect(tx.timelineNode.deleteMany).toHaveBeenCalled();
      expect(tx.timelineNode.createMany).not.toHaveBeenCalled();
    });

    it('dòng thời gian không tồn tại → 404', async () => {
      prisma.timeline.findUnique.mockResolvedValueOnce(null);

      await expect(service.update('khong-co', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('đổi sang chủ đề đã gắn Timeline khác thì báo 409', async () => {
      prisma.timeline.findUnique.mockImplementation(
        ({ where }: { where: { id?: string; topicId?: string } }) => {
          if (where.topicId === 'topic-1')
            return { id: 'tl-khac', title: 'Nhà Trần' };
          return {
            id: where.id,
            slug: 'dong-thoi-gian',
            topicId: null,
            status: ContentStatus.DRAFT,
          };
        },
      );

      await expect(
        service.update('tl-1', { topicId: 'topic-1' }),
      ).rejects.toThrow(ConflictException);
      expect(tx.timeline.update).not.toHaveBeenCalled();
    });

    it('xuất bản mà chưa có Chủ đề (cũ lẫn mới đều không) thì báo 400', async () => {
      await expect(
        service.update('tl-1', { status: ContentStatus.PUBLISHED }),
      ).rejects.toThrow(BadRequestException);
      expect(tx.timeline.update).not.toHaveBeenCalled();
    });

    it('xuất bản khi Timeline đã có sẵn Chủ đề từ trước thì cập nhật được', async () => {
      prisma.timeline.findUnique.mockImplementation(
        ({ where }: { where: { id?: string; topicId?: string } }) => {
          if (where.topicId) return null;
          return {
            id: where.id,
            slug: 'dong-thoi-gian',
            topicId: 'topic-cu',
            status: ContentStatus.DRAFT,
          };
        },
      );

      await expect(
        service.update('tl-1', { status: ContentStatus.PUBLISHED }),
      ).resolves.toBeDefined();
      expect(tx.timeline.update).toHaveBeenCalled();
    });
  });

  it('findAll phân trang và lọc theo chủ đề', async () => {
    prisma.timeline.count.mockResolvedValue(45);

    const result = await service.findAll({
      page: 3,
      limit: 20,
      topicId: 't-1',
    });

    expect(prisma.timeline.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 40,
        take: 20,
        where: { topicId: 't-1' },
      }),
    );
    expect(result.totalPages).toBe(3);
  });

  it('xoá dòng thời gian không tồn tại → 404', async () => {
    prisma.timeline.findUnique.mockResolvedValueOnce(null);

    await expect(service.remove('khong-co')).rejects.toThrow(NotFoundException);
    expect(prisma.timeline.delete).not.toHaveBeenCalled();
  });
});
