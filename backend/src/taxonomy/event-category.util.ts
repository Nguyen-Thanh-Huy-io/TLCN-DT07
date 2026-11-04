import { BadRequestException } from '@nestjs/common';
import { EventCategory, TaxonomyTerm } from '@prisma/client';

/** Một trường thông tin riêng khai báo trong meta.fields của nút loại sự kiện. */
export interface EventFieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'list' | 'number';
}

const FIELD_TYPES = new Set<EventFieldDef['type']>([
  'text',
  'textarea',
  'list',
  'number',
]);
const LEGACY_CATEGORIES = new Set<string>(Object.values(EventCategory));

type TermLike = Pick<TaxonomyTerm, 'id' | 'code' | 'parentId' | 'meta'>;

const metaOf = (term: TermLike) =>
  term.meta && typeof term.meta === 'object' && !Array.isArray(term.meta)
    ? (term.meta as Record<string, unknown>)
    : {};

/** Chuỗi tổ tiên của một nút, từ gốc xuống chính nó (chặn vòng lặp nếu dữ liệu cha – con bị sai). */
export function ancestorChain(terms: TermLike[], id: string): TermLike[] {
  const byId = new Map(terms.map((t) => [t.id, t]));
  const chain: TermLike[] = [];
  const seen = new Set<string>();
  let current = byId.get(id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return chain;
}

/** Gộp trường của các loại đã gắn và mọi cấp phía trên; trùng key thì giữ khai báo gặp trước. */
export function collectEventFields(
  terms: TermLike[],
  categoryIds: string[],
): EventFieldDef[] {
  const fields = new Map<string, EventFieldDef>();
  for (const id of categoryIds) {
    for (const node of ancestorChain(terms, id)) {
      const declared = metaOf(node).fields;
      if (!Array.isArray(declared)) continue;
      for (const f of declared as Partial<EventFieldDef>[]) {
        if (!f?.key || fields.has(f.key)) continue;
        fields.set(f.key, {
          key: f.key,
          label: f.label || f.key,
          type: FIELD_TYPES.has(f.type!) ? f.type! : 'text',
        });
      }
    }
  }
  return [...fields.values()];
}

/**
 * Chuẩn hóa metadata theo trường đã khai báo: chữ được cắt khoảng trắng, danh sách bỏ phần tử rỗng,
 * số phải là số. Khóa không khai báo (cause, outcome, sources...) giữ nguyên — không xóa dữ liệu.
 */
export function normalizeEventMetadata(
  fields: EventFieldDef[],
  raw: unknown,
  invalidMessage: string,
): Record<string, any> | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new BadRequestException(invalidMessage);
  }
  const result: Record<string, any> = { ...(raw as Record<string, any>) };
  for (const field of fields) {
    if (!(field.key in result)) continue;
    const value = result[field.key];
    if (value === null || value === undefined || value === '') {
      result[field.key] = field.type === 'list' ? [] : null;
      continue;
    }
    switch (field.type) {
      case 'list': {
        const items: unknown[] = Array.isArray(value)
          ? value
          : String(value).split(/[,;\n]/);
        result[field.key] = items.map((v) => String(v).trim()).filter(Boolean);
        break;
      }
      case 'number': {
        const n = Number(value);
        if (!Number.isFinite(n)) {
          throw new BadRequestException(
            `Trường "${field.label}" phải là số.`,
          );
        }
        result[field.key] = n;
        break;
      }
      default:
        result[field.key] = String(value).trim() || null;
    }
  }
  return result;
}

/**
 * Giá trị ghi vào cột enum category cũ khi loại này là loại chính: meta.legacyCategory gần nhất
 * trên chuỗi tổ tiên, hoặc chính mã nếu mã nằm trong enum; không có thì OTHER.
 */
export function legacyEventCategory(
  terms: TermLike[],
  id: string | undefined,
): EventCategory {
  if (!id) return EventCategory.OTHER;
  const chain = ancestorChain(terms, id).reverse();
  for (const node of chain) {
    if (LEGACY_CATEGORIES.has(node.code)) return node.code as EventCategory;
    const legacy = metaOf(node).legacyCategory;
    if (typeof legacy === 'string' && LEGACY_CATEGORIES.has(legacy)) {
      return legacy as EventCategory;
    }
  }
  return EventCategory.OTHER;
}

/** Id của các nút và toàn bộ nút con cháu — lọc theo nút cha ra cả sự kiện thuộc nút con. */
export function descendantIds(terms: TermLike[], rootIds: string[]): string[] {
  const result = new Set(rootIds);
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
  return [...result];
}
