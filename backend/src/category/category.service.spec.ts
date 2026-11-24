import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../common/services/prisma.service';
import { SlugService } from '../common/services/slug.service';
import { CategoryService, resolveRootCategorySlug } from './category.service';

interface FakeCategory {
  id: string;
  slug: string;
  parentId: string | null;
  articles: number;
}

/** Cây mẫu: goc → con → chau; "le" (nhan-vat) là chuyên mục gốc hệ thống; "custom" là chuyên mục thường. */
const SEED: FakeCategory[] = [
  { id: 'goc', slug: 'goc', parentId: null, articles: 0 },
  { id: 'con', slug: 'con', parentId: 'goc', articles: 0 },
  { id: 'chau', slug: 'chau', parentId: 'con', articles: 0 },
  { id: 'le', slug: 'nhan-vat', parentId: null, articles: 3 },
  { id: 'co-bai', slug: 'chuyen-muc-co-bai', parentId: null, articles: 2 },
];

describe('CategoryService', () => {
  let service: CategoryService;
  let rows: Map<string, FakeCategory>;
  const prisma = {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(
        ({ where }: { where: { id?: string; slug?: string } }) => {
          const row = where.id
            ? rows.get(where.id)
            : [...rows.values()].find((r) => r.slug === where.slug);
          return row ? { ...row, _count: { articles: row.articles } } : null;
        },
      ),
      create: jest.fn(({ data }: { data: object }) => ({ id: 'moi', ...data })),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    rows = new Map(SEED.map((r) => [r.id, { ...r }]));
    const moduleRef = await Test.createTestingModule({
      providers: [
        CategoryService,
        SlugService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(CategoryService);
  });

  describe('create', () => {
    it('sinh slug tiếng Việt từ tên, tránh trùng slug đã có', async () => {
      await service.create({ name: 'Nhân vật' });

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ slug: 'nhan-vat-2' }),
      });
    });

    it('slug tự đặt bị trùng → 409', async () => {
      await expect(
        service.create({ name: 'X', slug: 'nhan-vat' }),
      ).rejects.toThrow(ConflictException);
    });

    it('chuyên mục cha không tồn tại → 400', async () => {
      await expect(
        service.create({ name: 'X', parentId: 'khong-co' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update — chống vòng lặp cha/con & khóa chuyên mục gốc hệ thống', () => {
    it('không cho chọn chính nó làm cha', async () => {
      await expect(service.update('con', { parentId: 'con' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('không cho chọn cháu của nó làm cha', async () => {
      await expect(service.update('goc', { parentId: 'chau' })).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.category.update).not.toHaveBeenCalled();
    });

    it('chuyển sang cha hợp lệ thì lưu', async () => {
      await service.update('chau', { parentId: 'le' });

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 'chau' },
        data: { parentId: 'le' },
      });
    });

    it('giữ nguyên slug của chính nó không bị coi là trùng', async () => {
      await expect(
        service.update('le', { slug: 'nhan-vat' }),
      ).resolves.toBeUndefined();
    });

    it('không cho phép đổi slug hoặc gắn parentId cho chuyên mục gốc hệ thống', async () => {
      await expect(
        service.update('le', { slug: 'nhan-vat-moi' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('le', { parentId: 'goc' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('chuyên mục không tồn tại → 404', async () => {
      await expect(service.update('khong-co', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('chặn xoá chuyên mục gốc hệ thống', async () => {
      rows.set('le', { id: 'le', slug: 'nhan-vat', parentId: null, articles: 0 });
      await expect(service.remove('le')).rejects.toThrow(BadRequestException);
      expect(prisma.category.delete).not.toHaveBeenCalled();
    });

    it('chặn xoá chuyên mục còn bài viết', async () => {
      await expect(service.remove('co-bai')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.category.delete).not.toHaveBeenCalled();
    });

    it('chuyên mục trống không phải gốc hệ thống thì xoá được', async () => {
      await service.remove('chau');

      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'chau' },
      });
    });
  });

  describe('resolveRootCategorySlug', () => {
    it('leo lên chuyên mục gốc cao nhất theo parentId', () => {
      expect(resolveRootCategorySlug(rows.get('chau'), rows)).toBe('goc');
      expect(resolveRootCategorySlug(rows.get('le'), rows)).toBe('nhan-vat');
      expect(resolveRootCategorySlug(null, rows)).toBeNull();
    });
  });
});
