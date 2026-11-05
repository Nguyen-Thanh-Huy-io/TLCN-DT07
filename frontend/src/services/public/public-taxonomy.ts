/**
 * Lớp tương thích "danh mục" cho giao diện công khai cũ (timeline, nhân vật, di tích...).
 *
 * Bảng Taxonomy đã bỏ (2026-11-05). Các component cũ vẫn nhận `TaxonomyTermItem[]` để lấy nhãn
 * loại sự kiện / khu vực / vai trò — nay sinh từ bảng Category:
 *   • EVENT_TYPE  = các chuyên mục CON có loại EVENT (vd. Trận đánh, Hội nghị dưới "Sự kiện").
 *   • Nhóm khác (REGION, FIGURE_ROLE, PREDICATE...) = rỗng → component tự dùng nhãn mặc định.
 */

import { subCategoriesOfKind, type ArticleKind } from './article-kind';

export interface TaxonomyTermItem {
  id: string;
  groupCode: string;
  code: string;
  label: string;
  inverseLabel: string | null;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  aliases: string[];
  parentId: string | null;
  meta: Record<string, unknown> | null;
  isActive: boolean;
}

export interface TaxonomyGroupItem {
  code: string;
  label: string;
  description: string | null;
  multiValued: boolean;
  hierarchical: boolean;
  terms: TaxonomyTermItem[];
}

export interface CategoryLike {
  id: string;
  parentId: string | null;
  kind?: ArticleKind | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
}

export function categoryToTerm(groupCode: string, c: CategoryLike): TaxonomyTermItem {
  return {
    id: c.id,
    groupCode,
    code: c.slug,
    label: c.name,
    inverseLabel: null,
    description: c.description,
    icon: c.icon,
    displayOrder: c.displayOrder,
    aliases: [],
    parentId: null,
    meta: null,
    isActive: true,
  };
}

export function buildTaxonomyGroup(groupCode: string, categories: CategoryLike[]): TaxonomyGroupItem {
  const terms =
    groupCode === 'EVENT_TYPE'
      ? subCategoriesOfKind(categories, 'EVENT').map((c) => categoryToTerm(groupCode, c))
      : [];
  return { code: groupCode, label: groupCode, description: null, multiValued: false, hierarchical: false, terms };
}
