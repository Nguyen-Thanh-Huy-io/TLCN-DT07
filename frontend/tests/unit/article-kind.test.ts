import { describe, expect, it } from 'vitest';
import {
  findRootCategory,
  SYSTEM_CATEGORY_ROOT_SLUGS,
  type CategoryHierarchyNode,
} from '@/services/public/public-content.service';
import {
  categoryKeyLabel,
  eventCategoryKey,
  eventCategoryLabel,
  extractEventCategories,
  type EventCategoryItem,
} from '@/hooks/useEventCategories';

const sampleTree: Array<CategoryHierarchyNode & { parentId: string | null; displayOrder?: number }> = [
  { id: 'root-ev', parentId: null, name: 'Sự kiện', slug: SYSTEM_CATEGORY_ROOT_SLUGS.EVENT, displayOrder: 1 },
  { id: 'sub-battle', parentId: 'root-ev', name: 'Trận đánh', slug: 'tran-danh', displayOrder: 2 },
  { id: 'sub-deep', parentId: 'sub-battle', name: 'Thủy chiến', slug: 'thuy-chien', displayOrder: 3 },
  { id: 'root-person', parentId: null, name: 'Nhân vật', slug: SYSTEM_CATEGORY_ROOT_SLUGS.PERSON },
  { id: 'root-empty', parentId: null, name: 'Khác', slug: 'khac' },
  { id: 'cycle-a', parentId: 'cycle-b', name: 'Vòng A', slug: 'a' },
  { id: 'cycle-b', parentId: 'cycle-a', name: 'Vòng B', slug: 'b' },
];

describe('category hierarchy & event category helpers', () => {
  it('tìm chuyên mục gốc từ chuyên mục trực tiếp, kế thừa nhiều cấp và chống vòng lặp parentId', () => {
    expect(findRootCategory(sampleTree, 'root-ev')?.slug).toBe(SYSTEM_CATEGORY_ROOT_SLUGS.EVENT);
    expect(findRootCategory(sampleTree, 'sub-deep')?.slug).toBe(SYSTEM_CATEGORY_ROOT_SLUGS.EVENT);
    expect(findRootCategory(sampleTree, 'root-empty')?.slug).toBe('khac');
    expect(findRootCategory(sampleTree, 'missing-id')).toBeUndefined();
    expect(findRootCategory(sampleTree, null)).toBeUndefined();
    expect(findRootCategory(sampleTree, 'cycle-a')).toBeDefined();
  });

  it('lọc chuyên mục con thuộc nhánh su-kien kèm thông tin cha', () => {
    const extracted: EventCategoryItem[] = extractEventCategories(sampleTree);
    expect(extracted.map((s) => s.id)).toEqual(['sub-battle', 'sub-deep']);
    expect(extracted[0]).toMatchObject({
      id: 'sub-battle',
      parentSlug: 'su-kien',
      parentName: 'Sự kiện',
      displayOrder: 2,
    });
  });

  it('xác định key và nhãn hiển thị loại sự kiện (ưu tiên categoryIds, fallback slug / Khác)', () => {
    const extracted = extractEventCategories(sampleTree);

    expect(eventCategoryKey({ categoryIds: ['sub-battle'], category: 'tran-danh' })).toBe('sub-battle');
    expect(eventCategoryKey({ category: 'tran-danh' })).toBe('tran-danh');
    expect(eventCategoryKey({})).toBe('');

    expect(categoryKeyLabel(extracted, '')).toBe('Khác');
    expect(categoryKeyLabel(extracted, 'OTHER')).toBe('Khác');
    expect(categoryKeyLabel(extracted, 'tran-danh')).toBe('Trận đánh');
    expect(categoryKeyLabel(extracted, 'unknown-slug')).toBe('unknown-slug');

    expect(eventCategoryLabel(extracted, { categoryIds: ['sub-deep'] })).toBe('Thủy chiến');
    expect(eventCategoryLabel(extracted, { categoryIds: ['unknown'], category: 'tran-danh' })).toBe('Trận đánh');
    expect(eventCategoryLabel(extracted, { category: null })).toBe('Khác');
  });
});
