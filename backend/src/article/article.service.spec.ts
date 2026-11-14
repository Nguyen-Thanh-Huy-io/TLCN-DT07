import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { SlugService } from '../common/services/slug.service';
import { RedisService } from '../common/services/redis.service';
import { TAG_CONFIG } from '../tag/tag.constant';
import { ArticleService } from './article.service';

const EDITOR = 'editor-1';
const REVIEWER = 'reviewer-1';

const storedArticle = (overrides: object = {}) => ({
  id: 'art-1',
  slug: 'tran-hung-dao',
  status: ContentStatus.DRAFT,
  createdBy: EDITOR,
  categoryId: 'cat-1',
  startYear: null,
  endYear: null,
  category: { name: 'Nhân vật', slug: 'nhan-vat' },
  articleTags: [],
  linksOut: [],
  linksIn: [],
  ...overrides,
});

describe('ArticleService', () => {
  let service: ArticleService;
  const tx = {
    article: { update: jest.fn() },
    articleTag: { deleteMany: jest.fn(), createMany: jest.fn() },
    articleLink: { deleteMany: jest.fn(), createMany: jest.fn() },
  };
  const prisma = {
    article: {
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'art-1' }),
      update: jest.fn().mockResolvedValue({ id: 'art-1' }),
      count: jest.fn(),
      delete: jest.fn(),
    },
    category: { count: jest.fn().mockResolvedValue(1) },
    tag: { count: jest.fn() },
    $transaction: jest.fn((fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  };

  const redis = { deleteByPattern: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.article.findUnique.mockImplementation(
      ({ where }: { where: { id?: string; slug?: string } }) =>
        where.slug ? null : storedArticle(),
    );
    const moduleRef = await Test.createTestingModule({
      providers: [
        ArticleService,
        SlugService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();
    service = moduleRef.get(ArticleService);
  });

  describe('review — quy trình duyệt 2 người', () => {
    const pending = (overrides: object = {}) =>
      prisma.article.findUnique.mockResolvedValueOnce(
        storedArticle({ status: ContentStatus.PENDING_REVIEW, ...overrides }),
      );

    it('chỉ duyệt được bài đang chờ duyệt', async () => {
      prisma.article.findUnique.mockResolvedValueOnce(storedArticle());

      await expect(
        service.review('art-1', { status: ContentStatus.PUBLISHED }, REVIEWER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('người tạo không tự duyệt bài của mình', async () => {
      pending();

      await expect(
        service.review('art-1', { status: ContentStatus.PUBLISHED }, EDITOR),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.article.update).not.toHaveBeenCalled();
    });

    it('chuyên mục tên "Blog / Bài viết" cũng không được tự duyệt', async () => {
      pending({ category: { name: 'Bài viết blog', slug: 'blog' } });

      await expect(
        service.review('art-1', { status: ContentStatus.PUBLISHED }, EDITOR),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.article.update).not.toHaveBeenCalled();
    });

    it('từ chối bắt buộc có lý do', async () => {
      pending();

      await expect(
        service.review(
          'art-1',
          { status: ContentStatus.REJECTED, rejectionReason: '  ' },
          REVIEWER,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('xuất bản ghi người duyệt và thời điểm xuất bản', async () => {
      pending();

      await service.review(
        'art-1',
        { status: ContentStatus.PUBLISHED },
        REVIEWER,
      );

      expect(prisma.article.update).toHaveBeenCalledWith({
        where: { id: 'art-1' },
        data: expect.objectContaining({
          status: ContentStatus.PUBLISHED,
          approvedBy: REVIEWER,
          publishedAt: expect.any(Date),
          rejectionReason: null,
        }),
      });
    });

    it('từ chối lưu lý do và không có thời điểm xuất bản', async () => {
      pending();

      await service.review(
        'art-1',
        { status: ContentStatus.REJECTED, rejectionReason: ' Thiếu nguồn ' },
        REVIEWER,
      );

      expect(prisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            rejectionReason: 'Thiếu nguồn',
            publishedAt: null,
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('lưu người tạo (cần cho duyệt 2 người) và sinh slug', async () => {
      await service.create(
        { title: 'Trần Hưng Đạo', categoryId: 'cat-1' },
        EDITOR,
      );

      expect(prisma.article.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          createdBy: EDITOR,
          slug: 'tran-hung-dao',
          publishedAt: null,
        }),
      });
    });

    it('tag gửi trùng chỉ gắn 1 lần', async () => {
      prisma.tag.count.mockResolvedValueOnce(1);

      await service.create({ title: 'X', tagIds: ['t-1', 't-1'] }, EDITOR);

      expect(prisma.article.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          articleTags: { create: [{ tagId: 't-1' }] },
        }),
      });
      expect(redis.deleteByPattern).toHaveBeenCalledWith(
        TAG_CONFIG.TAG_CACHE_PATTERN,
      );
    });

    it('chuyên mục không tồn tại → 400', async () => {
      prisma.category.count.mockResolvedValueOnce(0);

      await expect(
        service.create({ title: 'X', categoryId: 'khong-co' }, EDITOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('có tag không tồn tại → 400', async () => {
      prisma.tag.count.mockResolvedValueOnce(1);

      await expect(
        service.create({ title: 'X', tagIds: ['t-1', 't-khong-co'] }, EDITOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('slug tự đặt bị trùng → 409', async () => {
      prisma.article.findUnique.mockResolvedValueOnce({ id: 'khac' });

      await expect(
        service.create({ title: 'X', slug: 'da-co' }, EDITOR),
      ).rejects.toThrow(ConflictException);
    });

    it('năm kết thúc trước năm bắt đầu → 400', async () => {
      await expect(
        service.create({ title: 'X', startYear: 1288, endYear: 1200 }, EDITOR),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update — liên kết và tag', () => {
    it('không liên kết tới chính nó', async () => {
      await expect(
        service.update('art-1', { links: [{ targetId: 'art-1' }] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('không liên kết trùng cùng 1 bài', async () => {
      await expect(
        service.update('art-1', {
          links: [{ targetId: 'art-2' }, { targetId: 'art-2' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('liên kết tới bài không tồn tại → 400', async () => {
      prisma.article.count.mockResolvedValueOnce(0);

      await expect(
        service.update('art-1', { links: [{ targetId: 'art-khong-co' }] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('thay toàn bộ tag và liên kết trong 1 transaction', async () => {
      prisma.tag.count.mockResolvedValueOnce(1);
      prisma.article.count.mockResolvedValueOnce(1);

      await service.update('art-1', {
        tagIds: ['t-1', 't-1'],
        links: [{ targetId: 'art-2', label: ' Chỉ huy ' }],
      });

      expect(tx.articleTag.deleteMany).toHaveBeenCalledWith({
        where: { articleId: 'art-1' },
      });
      expect(tx.articleTag.createMany).toHaveBeenCalledWith({
        data: [{ articleId: 'art-1', tagId: 't-1' }],
      });
      expect(redis.deleteByPattern).toHaveBeenCalledWith(
        TAG_CONFIG.TAG_CACHE_PATTERN,
      );
      expect(tx.articleLink.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            sourceId: 'art-1',
            targetId: 'art-2',
            label: 'Chỉ huy',
            displayOrder: 0,
          }),
        ],
      });
    });

    it('không gửi tag / liên kết thì giữ nguyên', async () => {
      await service.update('art-1', { summary: 'Tóm tắt mới' });

      expect(tx.articleTag.deleteMany).not.toHaveBeenCalled();
      expect(tx.articleLink.deleteMany).not.toHaveBeenCalled();
      expect(redis.deleteByPattern).not.toHaveBeenCalled();
    });

    it('bài không tồn tại → 404', async () => {
      prisma.article.findUnique.mockResolvedValueOnce(null);

      await expect(service.update('khong-co', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('xoá bài thì xoá cache danh sách Tag (số bài dùng tag đổi)', async () => {
      await service.remove('art-1');

      expect(prisma.article.delete).toHaveBeenCalledWith({
        where: { id: 'art-1' },
      });
      expect(redis.deleteByPattern).toHaveBeenCalledWith(
        TAG_CONFIG.TAG_CACHE_PATTERN,
      );
    });
  });
});
