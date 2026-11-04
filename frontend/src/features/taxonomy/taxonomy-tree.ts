import api from '@/services/api';
import type { TaxonomyGroupItem, TaxonomyTermItem } from '@/services/entities/taxonomy.service';

/** Trường thông tin riêng khai báo trong meta.fields của một nút (đồng bộ với backend event-category.util). */
export interface TaxonomyFieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'list' | 'number';
}

export const FIELD_TYPE_LABELS: Record<TaxonomyFieldDef['type'], string> = {
  text: 'Chữ ngắn',
  textarea: 'Đoạn văn',
  list: 'Danh sách',
  number: 'Số',
};

export const fieldsOf = (term: TaxonomyTermItem): TaxonomyFieldDef[] => {
  const fields = term.meta?.fields;
  return Array.isArray(fields) ? (fields as TaxonomyFieldDef[]).filter((f) => f?.key) : [];
};

/** Giá trị kèm độ sâu, sắp theo cây (cha trước, con ngay sau, mỗi cấp theo thứ tự hiển thị). */
export function flattenTree(terms: TaxonomyTermItem[]): Array<{ term: TaxonomyTermItem; depth: number }> {
  const ids = new Set(terms.map((t) => t.id));
  const children = new Map<string | null, TaxonomyTermItem[]>();
  for (const t of terms) {
    const parent = t.parentId && ids.has(t.parentId) ? t.parentId : null;
    children.set(parent, [...(children.get(parent) ?? []), t]);
  }
  const out: Array<{ term: TaxonomyTermItem; depth: number }> = [];
  const seen = new Set<string>();
  const walk = (parent: string | null, depth: number) => {
    const list = [...(children.get(parent) ?? [])].sort(
      (a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label, 'vi'),
    );
    for (const t of list) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      out.push({ term: t, depth });
      walk(t.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

/** Chuỗi tổ tiên từ gốc xuống chính nút. */
export function ancestorChain(terms: TaxonomyTermItem[], id: string): TaxonomyTermItem[] {
  const byId = new Map(terms.map((t) => [t.id, t]));
  const chain: TaxonomyTermItem[] = [];
  const seen = new Set<string>();
  let current = byId.get(id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return chain;
}

/** Trường của các loại đã chọn và mọi cấp phía trên; trùng key giữ khai báo gặp trước. */
export function collectFields(terms: TaxonomyTermItem[], selectedIds: string[]): TaxonomyFieldDef[] {
  const fields = new Map<string, TaxonomyFieldDef>();
  for (const id of selectedIds) {
    for (const node of ancestorChain(terms, id)) {
      for (const f of fieldsOf(node)) if (!fields.has(f.key)) fields.set(f.key, f);
    }
  }
  return [...fields.values()];
}

/** Id của nút và mọi nút con cháu — lọc theo nút cha ra cả nút con. */
export function descendantIds(terms: TaxonomyTermItem[], rootId: string): Set<string> {
  const result = new Set([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const t of terms) {
      if (t.parentId && result.has(t.parentId) && !result.has(t.id)) {
        result.add(t.id);
        added = true;
      }
    }
  }
  return result;
}

/** Nhãn dạng "Quân sự › Trận đánh / Chiến dịch". */
export const pathLabel = (terms: TaxonomyTermItem[], id: string) =>
  ancestorChain(terms, id)
    .map((t) => t.label)
    .join(' › ');

const publicCache = new Map<string, Promise<TaxonomyGroupItem | undefined>>();

/** Một nhóm danh mục công khai (chỉ giá trị đang dùng), cache theo phiên trang. */
export function loadPublicTaxonomy(groupCode: string): Promise<TaxonomyGroupItem | undefined> {
  let pending = publicCache.get(groupCode);
  if (!pending) {
    pending = api
      .get('/public/taxonomies', { params: { groups: groupCode } })
      .then((res) => {
        const data = (res.data?.data ?? res.data) as TaxonomyGroupItem[];
        return data.find((g) => g.code === groupCode);
      })
      .catch((err) => {
        publicCache.delete(groupCode);
        throw err;
      });
    publicCache.set(groupCode, pending);
  }
  return pending;
}
