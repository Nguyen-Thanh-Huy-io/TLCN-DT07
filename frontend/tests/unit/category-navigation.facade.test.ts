import { describe, expect, it } from 'vitest';
import {
  EXPLORE_STATIC_LABELS,
  EXPLORE_STATIC_ROUTES,
  mapCategoriesToResolvedExplore,
  resolveCategoryIcon,
} from '@/components/hisgo/category-navigation.facade';
import type { PublicCategory } from '@/services/public/public-content.service';
import { Folder, Swords, User } from 'lucide-react';

describe('category-navigation.facade', () => {
  describe('resolveCategoryIcon', () => {
    it('ánh xạ chính xác các icon hợp lệ trong database sang Lucide component', () => {
      expect(resolveCategoryIcon('Swords')).toBe(Swords);
      expect(resolveCategoryIcon('User')).toBe(User);
    });

    it('trả về Folder fallback khi icon rỗng hoặc không tồn tại', () => {
      expect(resolveCategoryIcon(null)).toBe(Folder);
      expect(resolveCategoryIcon(undefined)).toBe(Folder);
      expect(resolveCategoryIcon('NonExistentIcon')).toBe(Folder);
    });
  });

  describe('mapCategoriesToResolvedExplore', () => {
    it('lọc chỉ lấy các category gốc và sắp xếp theo displayOrder', () => {
      const mockCategories: PublicCategory[] = [
        {
          id: 'cat-2',
          parentId: null,
          name: 'Nhân vật lịch sử',
          slug: 'nhan-vat',
          icon: 'User',
          displayOrder: 2,
          articleCount: 15,
          description: 'Danh nhân',
          adjacentTimeline: null,
        },
        {
          id: 'cat-child',
          parentId: 'cat-2',
          name: 'Vua chúa',
          slug: 'vua-chua',
          icon: 'Crown',
          displayOrder: 1,
          articleCount: 5,
          description: null,
          adjacentTimeline: null,
        },
        {
          id: 'cat-1',
          parentId: null,
          name: 'Sự kiện lịch sử',
          slug: 'su-kien',
          icon: 'Swords',
          displayOrder: 1,
          articleCount: 20,
          description: 'Chiến dịch',
          adjacentTimeline: null,
        },
      ];

      const result = mapCategoriesToResolvedExplore(mockCategories);

      // Không chứa category con (cat-child)
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('cat-1');
      expect(result[0].href).toBe(`${EXPLORE_STATIC_ROUTES.CATEGORY_FILTER_BASE}su-kien`);
      expect(result[0].icon).toBe(Swords);

      expect(result[1].id).toBe('cat-2');
      expect(result[1].href).toBe(`${EXPLORE_STATIC_ROUTES.CATEGORY_FILTER_BASE}nhan-vat`);
      expect(result[1].icon).toBe(User);
    });

    it('trả về danh sách fallback mặc định khi danh sách danh mục rỗng', () => {
      const result = mapCategoriesToResolvedExplore([]);
      expect(result.length).toBeGreaterThan(0);
      const slugs = result.map((c) => c.slug);
      expect(slugs).toContain('su-kien');
      expect(slugs).toContain('nhan-vat');
    });
  });

  describe('static constants', () => {
    it('chứa đầy đủ các routes và labels cơ bản không có magic string', () => {
      expect(EXPLORE_STATIC_ROUTES.CONCEPT_MAP).toBe('/kham-pha-khai-niem');
      expect(EXPLORE_STATIC_ROUTES.ALL_ARTICLES).toBe('/bai-viet');
      expect(EXPLORE_STATIC_LABELS.CONCEPT_MAP).toBe('Bản đồ Khái niệm AI');
      expect(EXPLORE_STATIC_LABELS.ALL_ARTICLES).toBe('Tất cả bài viết');
    });
  });
});
