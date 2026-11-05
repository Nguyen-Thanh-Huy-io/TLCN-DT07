/**
 * Loại bài viết lấy từ CHUYÊN MỤC (`Category.kind`, enum ArticleKind ở backend).
 * Chuyên mục để trống `kind` thì kế thừa chuyên mục cha; gốc cũng trống → OTHER.
 * Đây là nơi DUY NHẤT suy loại bài ở frontend — không gán cứng theo slug chuyên mục.
 */
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
