import { describe, expect, it } from 'vitest';
import { ArticleKindEnum } from '@/constants/enums';
import {
  ARTICLE_KIND_LABELS,
  categoryKeyLabel,
  eventCategoryKey,
  eventCategoryLabel,
  extractEventCategories,
  resolveCategoryKind,
  subCategoriesOfKind,
  type CategoryKindNode,
  type EventCategoryItem,
} from '@/services/public/article-kind';

const sampleTree: Array<CategoryKindNode & { name: string; slug: string; displayOrder?: number }> = [
  { id: 'root-ev', parentId: null, kind: 'EVENT', name: 'Sự kiện', slug: 'su-kien', displayOrder: 1 },
  { id: 'sub-battle', parentId: 'root-ev', kind: null, name: 'Trận đánh', slug: 'tran-danh', displayOrder: 2 },
  { id: 'sub-deep', parentId: 'sub-battle', kind: null, name: 'Thủy chiến', slug: 'thuy-chien', displayOrder: 3 },
  { id: 'root-person', parentId: null, kind: 'PERSON', name: 'Nhân vật', slug: 'nhan-vat' },
  { id: 'root-empty', parentId: null, kind: null, name: 'Khác', slug: 'khac' },
  { id: 'cycle-a', parentId: 'cycle-b', kind: null, name: 'Vòng A', slug: 'a' },
  { id: 'cycle-b', parentId: 'cycle-a', kind: null, name: 'Vòng B', slug: 'b' },
];

describe('article-kind helpers', () => {
  it('suy loại từ chuyên mục trực tiếp, kế thừa từ cha nhiều cấp và fallback OTHER', () => {
    expect(resolveCategoryKind(sampleTree, 'root-ev')).toBe(ArticleKindEnum.EVENT);
    expect(resolveCategoryKind(sampleTree, 'sub-deep')).toBe(ArticleKindEnum.EVENT);
    expect(resolveCategoryKind(sampleTree, 'root-empty')).toBe(ArticleKindEnum.OTHER);
    expect(resolveCategoryKind(sampleTree, 'missing-id')).toBe(ArticleKindEnum.OTHER);
    expect(resolveCategoryKind(sampleTree, null)).toBe(ArticleKindEnum.OTHER);
    // Ca biên vòng lặp parentId không bị lặp vô hạn
    expect(resolveCategoryKind(sampleTree, 'cycle-a')).toBe(ArticleKindEnum.OTHER);
  });

  it('lọc chuyên mục con theo loại và rút trích EventCategoryItem kèm thông tin cha', () => {
    const subs = subCategoriesOfKind(sampleTree, 'EVENT');
    expect(subs.map((s) => s.id)).toEqual(['sub-battle', 'sub-deep']);

    const extracted: EventCategoryItem[] = extractEventCategories(sampleTree);
    expect(extracted[0]).toMatchObject({
      id: 'sub-battle',
      parentSlug: 'su-kien',
      parentName: 'Sự kiện',
      displayOrder: 2,
    });
    expect(ARTICLE_KIND_LABELS.DYNASTY).toBe('Triều đại');
  });

  it('xác định key và nhãn hiển thị loại sự kiện (ưu tiên categoryIds, fallback slug / Khác)', () => {
    const extracted = extractEventCategories(sampleTree);

    expect(eventCategoryKey({ categoryIds: ['sub-battle'], category: 'tran-danh' })).toBe('sub-battle');
    expect(eventCategoryKey({ category: 'tran-danh' })).toBe('tran-danh');
    expect(eventCategoryKey({})).toBe('');

    expect(categoryKeyLabel(extracted, '')).toBe('Khác');
    expect(categoryKeyLabel(extracted, ArticleKindEnum.OTHER)).toBe('Khác');
    expect(categoryKeyLabel(extracted, 'tran-danh')).toBe('Trận đánh');
    expect(categoryKeyLabel(extracted, 'unknown-slug')).toBe('unknown-slug');

    expect(eventCategoryLabel(extracted, { categoryIds: ['sub-deep'] })).toBe('Thủy chiến');
    expect(eventCategoryLabel(extracted, { categoryIds: ['unknown'], category: 'tran-danh' })).toBe('Trận đánh');
    expect(eventCategoryLabel(extracted, { category: null })).toBe('Khác');
  });
});
