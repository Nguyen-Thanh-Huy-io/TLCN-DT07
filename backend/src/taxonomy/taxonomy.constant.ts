/** Mã các nhóm danh mục đang dùng (dữ liệu nằm trong bảng taxonomy_groups / taxonomy_terms). */
export const TAXONOMY_GROUPS = {
  SITE_TYPE: 'SITE_TYPE',
  PRESERVATION: 'PRESERVATION',
  HERITAGE_RANK: 'HERITAGE_RANK',
  REGION: 'REGION',
  EVENT_CATEGORY: 'EVENT_CATEGORY',
  EVENT_ROLE: 'EVENT_ROLE',
  ENTITY_RELATION: 'ENTITY_RELATION',
  EVENT_RELATION: 'EVENT_RELATION',
  FIGURE_ROLE: 'FIGURE_ROLE',
} as const;

export type TaxonomyGroupCode =
  (typeof TAXONOMY_GROUPS)[keyof typeof TAXONOMY_GROUPS];

export const TAXONOMY_ROUTES = {
  PUBLIC: 'public/taxonomies',
  CMS_TERMS: 'taxonomies/terms',
  CMS_TERM: 'taxonomies/terms/:id',
} as const;

export const TAXONOMY_MESSAGES = {
  GROUP_NOT_FOUND: (code: string) => `Không có nhóm danh mục "${code}"`,
  TERM_NOT_FOUND: (id: string) => `Không tìm thấy giá trị danh mục "${id}"`,
  DUPLICATE_CODE: (group: string, code: string) =>
    `Nhóm "${group}" đã có mã "${code}"`,
  UNKNOWN_TERMS: (group: string, ids: string[]) =>
    `Giá trị không thuộc nhóm "${group}": ${ids.join(', ')}`,
  PARENT_OTHER_GROUP: 'Giá trị cha phải thuộc cùng nhóm danh mục.',
  TERM_IN_USE: (count: number) =>
    `Giá trị đang được ${count} bản ghi sử dụng — hãy ẩn (isActive = false) thay vì xóa.`,
} as const;

/** Xếp hạng lưu dạng chữ tự do → mã nhóm HERITAGE_RANK (null = chưa xếp hạng / không nhận ra). */
export function normalizeRank(raw: string | null | undefined): string | null {
  const t = raw?.toLocaleLowerCase('vi').trim();
  if (!t) return null;
  if (/unesco|thế giới/.test(t)) return 'UNESCO';
  if (/quốc tế/.test(t)) return 'INTERNATIONAL';
  if (/đặc biệt/.test(t)) return 'SPECIAL_NATIONAL';
  if (/quốc gia/.test(t)) return 'NATIONAL';
  if (/tỉnh|thành phố/.test(t)) return 'PROVINCIAL';
  return null;
}
