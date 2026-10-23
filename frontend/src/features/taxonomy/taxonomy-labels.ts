import { EVENT_CATEGORY_LABELS, EVENT_ENTITY_ROLE_LABELS, EventCategory } from '@/constants/enums';
import type { TaxonomyTermItem } from '@/services/entities/taxonomy.service';

/**
 * Nhãn hiển thị lấy từ "Danh mục dùng chung"; chưa có danh mục (tải lỗi / dữ liệu cũ) thì rơi về
 * nhãn enum cũ để giao diện không trống. Dùng được cả ở server component lẫn client.
 */

interface EventCategoryRef {
  category?: string | null;
  categoryIds?: string[] | null;
}

/** Loại chính của sự kiện (phần tử đầu categoryIds) trong danh mục, nếu có. */
export function primaryCategoryTerm(terms: TaxonomyTermItem[], event: EventCategoryRef) {
  const id = event.categoryIds?.[0];
  return id ? terms.find((t) => t.id === id) : undefined;
}

export function eventCategoryLabel(terms: TaxonomyTermItem[], event: EventCategoryRef): string {
  const term = primaryCategoryTerm(terms, event);
  if (term) return term.label;
  const code = event.category ?? '';
  return terms.find((t) => t.code === code)?.label ?? EVENT_CATEGORY_LABELS[code as EventCategory] ?? code;
}

/** Khóa để gom / lọc theo loại chính: id trong danh mục, không có thì mã enum cũ. */
export const eventCategoryKey = (event: EventCategoryRef) => event.categoryIds?.[0] ?? event.category ?? '';

/** Nhãn của khóa do eventCategoryKey trả về. */
export const categoryKeyLabel = (terms: TaxonomyTermItem[], key: string) =>
  terms.find((t) => t.id === key || t.code === key)?.label ?? EVENT_CATEGORY_LABELS[key as EventCategory] ?? key;

/** Mã nút gốc của loại chính (vd. SOCIETY_CULTURE) — dùng để chia nhóm lớn như chính trị / văn hóa. */
export function eventCategoryRootCode(terms: TaxonomyTermItem[], event: EventCategoryRef): string | undefined {
  let term = primaryCategoryTerm(terms, event);
  const seen = new Set<string>();
  while (term?.parentId && !seen.has(term.id)) {
    seen.add(term.id);
    const parent = terms.find((t) => t.id === term!.parentId);
    if (!parent) break;
    term = parent;
  }
  return term?.code;
}

export function eventRoleLabel(terms: TaxonomyTermItem[], code: string | null | undefined): string {
  if (!code) return '';
  return terms.find((t) => t.code === code)?.label ?? EVENT_ENTITY_ROLE_LABELS[code] ?? code;
}
