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

/**
 * Nhãn loại quan hệ theo hướng nhìn: từ phía nguồn (OUTGOING) dùng nhãn, từ phía đích (INCOMING)
 * dùng nhãn chiều ngược ("Cha mẹ của" ↔ "Con của"). Không có trong danh mục thì dùng nhãn dự phòng.
 */
export function relationLabel(
  terms: TaxonomyTermItem[],
  code: string,
  direction: 'OUTGOING' | 'INCOMING' = 'OUTGOING',
  fallback: Record<string, string> = {},
): string {
  const term = terms.find((t) => t.code === code);
  if (term) return direction === 'INCOMING' ? (term.inverseLabel ?? term.label) : term.label;
  return fallback[code] ?? code;
}

/** Lựa chọn [mã, nhãn] cho ô chọn loại quan hệ: giá trị đang dùng của danh mục + giá trị hiện tại. */
export function relationOptions(
  terms: TaxonomyTermItem[],
  fallback: Record<string, string>,
  current?: string,
): Array<[string, string]> {
  const options: Array<[string, string]> = terms.length
    ? terms.filter((t) => t.isActive || t.code === current).map((t) => [t.code, t.label])
    : Object.entries(fallback);
  if (current && !options.some(([code]) => code === current)) options.push([current, fallback[current] ?? current]);
  return options;
}

export function eventRoleLabel(terms: TaxonomyTermItem[], code: string | null | undefined): string {
  if (!code) return '';
  return terms.find((t) => t.code === code)?.label ?? EVENT_ENTITY_ROLE_LABELS[code] ?? code;
}
