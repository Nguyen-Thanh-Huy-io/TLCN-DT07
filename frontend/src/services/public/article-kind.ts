/**
 * Loại bài viết lấy từ CHUYÊN MỤC (`Category.kind`, enum ArticleKind ở backend).
 * Chuyên mục để trống `kind` thì kế thừa chuyên mục cha; gốc cũng trống → OTHER.
 * Đây là nơi DUY NHẤT suy loại bài ở frontend — không gán cứng theo slug chuyên mục.
 */
import { ArticleKindEnum } from '@/constants/enums';

export type ArticleKind = 'PERSON' | 'EVENT' | 'LOCATION' | 'DYNASTY' | 'OTHER';

export const ARTICLE_KIND_LABELS: Record<ArticleKind, string> = {
  PERSON: 'Nhân vật',
  EVENT: 'Sự kiện',
  LOCATION: 'Di tích / địa danh',
  DYNASTY: 'Triều đại',
  OTHER: 'Khác',
};

export interface CategoryKindNode {
  id: string;
  parentId: string | null;
  kind?: ArticleKind | null;
}

export function resolveCategoryKind(
  categories: CategoryKindNode[],
  categoryId: string | null | undefined,
): ArticleKind {
  const byId = new Map(categories.map((c) => [c.id, c]));
  let cur = categoryId ? byId.get(categoryId) : undefined;
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    if (cur.kind) return cur.kind;
    seen.add(cur.id);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return 'OTHER';
}

/** Chuyên mục CON thuộc loại `kind` (vd. Trận đánh, Hội nghị dưới Sự kiện) — dùng làm "loại sự kiện". */
export function subCategoriesOfKind<T extends CategoryKindNode>(categories: T[], kind: ArticleKind): T[] {
  return categories.filter((c) => c.parentId && resolveCategoryKind(categories, c.id) === kind);
}

export interface EventCategoryItem extends CategoryKindNode {
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  displayOrder?: number;
  parentSlug?: string | null;
  parentName?: string | null;
}

export interface EventCategoryRef {
  category?: string | null;
  categoryIds?: string[] | null;
}

const FALLBACK_EVENT_CATEGORY_LABEL = 'Khác';
const CULTURE_CATEGORY_PATTERN =
  /van-hoa|kinh-te|xa-hoi|khoa-hoc|giao-duc|nghe-thuat|ton-giao|tin-nguong|khoa-bang|kien-truc|culture|economy|society|science/i;

/** Rút danh sách chuyên mục con thuộc loại EVENT kèm thông tin chuyên mục cha trực tiếp. */
export function extractEventCategories<
  T extends CategoryKindNode & {
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    displayOrder?: number;
  },
>(categories: T[]): EventCategoryItem[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return subCategoriesOfKind(categories, 'EVENT').map((c) => {
    const parent = c.parentId ? byId.get(c.parentId) : undefined;
    return {
      id: c.id,
      parentId: c.parentId,
      kind: c.kind,
      name: c.name,
      slug: c.slug,
      description: c.description ?? null,
      icon: c.icon ?? null,
      displayOrder: c.displayOrder ?? 0,
      parentSlug: parent?.slug ?? null,
      parentName: parent?.name ?? null,
    };
  });
}

/** Khóa để gom / lọc theo loại sự kiện chính: ưu tiên id chuyên mục, sau đó tới slug. */
export const eventCategoryKey = (event: EventCategoryRef): string =>
  event.categoryIds?.[0] ?? event.category ?? '';

/** Tra nhãn hiển thị từ khóa (id hoặc slug) của loại sự kiện. */
export function categoryKeyLabel(categories: EventCategoryItem[], key: string): string {
  if (!key || key === ArticleKindEnum.OTHER) return FALLBACK_EVENT_CATEGORY_LABEL;
  return categories.find((c) => c.id === key || c.slug === key)?.name ?? key;
}

/** Nhãn hiển thị của loại sự kiện trên thẻ / danh sách. */
export function eventCategoryLabel(categories: EventCategoryItem[], event: EventCategoryRef): string {
  const id = event.categoryIds?.[0];
  if (id) {
    const byId = categories.find((c) => c.id === id);
    if (byId) return byId.name;
  }
  const slug = event.category ?? '';
  if (!slug || slug === ArticleKindEnum.OTHER) return FALLBACK_EVENT_CATEGORY_LABEL;
  return categories.find((c) => c.slug === slug)?.name ?? slug;
}

/** Tìm chuyên mục cha cấp trên (trong nhánh loại sự kiện) của sự kiện để phân nhóm. */
export function eventParentCategory(
  categories: EventCategoryItem[],
  event: EventCategoryRef,
): EventCategoryItem | undefined {
  const id = event.categoryIds?.[0];
  const slug = event.category;
  let current = categories.find((c) => (id && c.id === id) || (slug && c.slug === slug));
  const byId = new Map(categories.map((c) => [c.id, c]));
  const seen = new Set<string>();
  while (current?.parentId && byId.has(current.parentId) && !seen.has(current.id)) {
    seen.add(current.id);
    current = byId.get(current.parentId);
  }
  return current;
}

/**
 * Kiểm tra sự kiện có thuộc nhánh "Kinh tế – Văn hóa" hay không dựa trên chuyên mục cha
 * (hoặc chính chuyên mục đó nếu đặt trực tiếp dưới gốc Sự kiện).
 */
export function isCultureEventCategory(
  categories: EventCategoryItem[],
  event: EventCategoryRef,
): boolean {
  const id = event.categoryIds?.[0];
  const slug = event.category ?? '';
  const leaf = categories.find((c) => (id && c.id === id) || (slug && c.slug === slug));
  const rootParent = eventParentCategory(categories, event);
  const candidates = [rootParent?.slug, rootParent?.parentSlug, leaf?.slug, leaf?.parentSlug, slug].filter(
    (s): s is string => Boolean(s),
  );
  return candidates.some((s) => CULTURE_CATEGORY_PATTERN.test(s));
}

