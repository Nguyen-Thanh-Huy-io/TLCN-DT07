/** Mã các nhóm danh mục đang dùng (dữ liệu nằm trong bảng taxonomy_groups / taxonomy_terms). */
export const TAXONOMY_GROUPS = {
  // 7 nhóm Taxonomy chuẩn hóa theo Taxonomy Specification v1.0
  EVENT_TYPE: 'EVENT_TYPE',
  PERIOD_TYPE: 'PERIOD_TYPE',
  SITE_TYPE: 'SITE_TYPE',
  PREDICATE: 'PREDICATE',
  ROLE_TYPE: 'ROLE_TYPE',
  SOURCE_FORMAT: 'SOURCE_FORMAT',
  SOURCE_NATURE: 'SOURCE_NATURE',

  // Nhóm cũ phục vụ backward-compatibility
  PRESERVATION: 'PRESERVATION',
  HERITAGE_RANK: 'HERITAGE_RANK',
  REGION: 'REGION',
  EVENT_CATEGORY: 'EVENT_CATEGORY',
  // EVENT_ROLE đã gộp vào ROLE_TYPE (2026-11-03) — không còn group riêng, xoá khỏi DB.
  ENTITY_RELATION: 'ENTITY_RELATION',
  EVENT_RELATION: 'EVENT_RELATION',
  FIGURE_ROLE: 'FIGURE_ROLE',
} as const;

export type TaxonomyGroupCode =
  (typeof TAXONOMY_GROUPS)[keyof typeof TAXONOMY_GROUPS];

/**
 * 15 Vị từ chuẩn hóa v1.0 trong Knowledge Graph (Subject -> Predicate -> Object)
 */
export const PREDICATE_CODES = {
  FOUNDED: 'FOUNDED',
  SUCCEEDED_BY: 'SUCCEEDED_BY',
  CHILD_OF: 'CHILD_OF',
  PARENT_OF: 'PARENT_OF',
  SPOUSE_OF: 'SPOUSE_OF',
  ALLY_OF: 'ALLY_OF',
  OPPONENT_OF: 'OPPONENT_OF',
  PRECEDED_BY: 'PRECEDED_BY',
  CAUSED_BY: 'CAUSED_BY',
  SUB_EVENT_OF: 'SUB_EVENT_OF',
  LOCATED_AT: 'LOCATED_AT',
  MEMBER_OF: 'MEMBER_OF',
  CAPITAL_OF: 'CAPITAL_OF',
  AUTHORED: 'AUTHORED',
  CONTEMPORARY_OF: 'CONTEMPORARY_OF',
} as const;

export type PredicateCode =
  (typeof PREDICATE_CODES)[keyof typeof PREDICATE_CODES];

/**
 * 13 Vai trò tham gia sự kiện chuẩn hóa v1.0 (HistoricalEventParticipant.roleTerm)
 */
export const ROLE_TYPE_CODES = {
  COMMANDER: 'COMMANDER',
  PARTICIPANT: 'PARTICIPANT',
  OPPONENT: 'OPPONENT',
  MEDIATOR: 'MEDIATOR',
  WITNESS: 'WITNESS',
  ALLY: 'ALLY',
  DIPLOMAT: 'DIPLOMAT',
  VICTIM: 'VICTIM',
  CASUALTY: 'CASUALTY',
  INSPIRER: 'INSPIRER',
  COURIER: 'COURIER',
  MILITARY_ADVISER: 'MILITARY_ADVISER',
  OTHER_ROLE: 'OTHER_ROLE',
} as const;

export type RoleTypeCode =
  (typeof ROLE_TYPE_CODES)[keyof typeof ROLE_TYPE_CODES];

/**
 * 10 Hình thức nguồn tham khảo chuẩn hóa v1.0 (HistoricalReference.formatTerm)
 */
export const SOURCE_FORMAT_CODES = {
  BOOK: 'BOOK',
  JOURNAL_ARTICLE: 'JOURNAL_ARTICLE',
  RESEARCH_PAPER: 'RESEARCH_PAPER',
  DECREE: 'DECREE',
  MEMOIR: 'MEMOIR',
  MAP: 'MAP',
  EPIGRAPHY: 'EPIGRAPHY',
  CHRONICLE: 'CHRONICLE',
  ARCHIVAL_DOCUMENT: 'ARCHIVAL_DOCUMENT',
  OTHER_FORMAT: 'OTHER_FORMAT',
} as const;

export type SourceFormatCode =
  (typeof SOURCE_FORMAT_CODES)[keyof typeof SOURCE_FORMAT_CODES];

/**
 * 6 Bản chất nguồn tham khảo chuẩn hóa v1.0 (HistoricalReference.natureTerm)
 */
export const SOURCE_NATURE_CODES = {
  PRIMARY_SOURCE: 'PRIMARY_SOURCE',
  SECONDARY_SOURCE: 'SECONDARY_SOURCE',
  TERTIARY_SOURCE: 'TERTIARY_SOURCE',
  ORAL_HISTORY: 'ORAL_HISTORY',
  CONTEMPORARY_RECORD: 'CONTEMPORARY_RECORD',
  ARCHAEOLOGICAL_EVIDENCE: 'ARCHAEOLOGICAL_EVIDENCE',
} as const;

export type SourceNatureCode =
  (typeof SOURCE_NATURE_CODES)[keyof typeof SOURCE_NATURE_CODES];

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
