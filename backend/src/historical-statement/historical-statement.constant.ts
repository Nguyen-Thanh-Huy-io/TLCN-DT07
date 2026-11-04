/**
 * Hằng số và thông điệp lỗi cho Historical Statement (Knowledge Graph)
 * Tuân thủ quy tắc không dùng Magic String.
 */

export const STATEMENT_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_GRAPH_DEPTH: 1,
  MAX_GRAPH_DEPTH: 3,
  MAX_GRAPH_NODES: 200,
} as const;

export const STATEMENT_NODE_KIND = {
  ENTITY: 'ENTITY',
  LITERAL: 'LITERAL',
} as const;

export type StatementNodeKind =
  (typeof STATEMENT_NODE_KIND)[keyof typeof STATEMENT_NODE_KIND];

export const STATEMENT_ERROR_MESSAGES = {
  EXACTLY_ONE_SUBJECT:
    'Phát biểu phải có đúng một Chủ thể (subjectEntityId hoặc subjectEventId).',
  EXACTLY_ONE_OBJECT:
    'Phát biểu phải có đúng một Đối tượng (objectEntityId, objectEventId, hoặc objectValue kèm objectValueType).',
  NO_SELF_LOOP: 'Chủ thể và đối tượng không được trùng nhau (không tạo tự lặp).',
  SUBJECT_ENTITY_NOT_FOUND: 'Thực thể chủ thể (subjectId) không tồn tại.',
  OBJECT_ENTITY_NOT_FOUND: 'Thực thể đối tượng (objectId) không tồn tại.',
  PREDICATE_NOT_FOUND: 'Mối quan hệ (predicateId) không tồn tại trong Taxonomy.',
  PREDICATE_NOT_ACTIVE: 'Mối quan hệ (predicateId) đang bị vô hiệu hóa.',
  PREDICATE_SUBJECT_TYPE_INVALID:
    'Loại Chủ thể không hợp lệ với Predicate này (xem TaxonomyPredicateRule.allowedSubjectTypes).',
  PREDICATE_OBJECT_TYPE_INVALID:
    'Loại Đối tượng không hợp lệ với Predicate này (xem TaxonomyPredicateRule.allowedObjectTypes).',
  INVALID_YEAR_RANGE: 'Năm kết thúc (validToYear) phải lớn hơn hoặc bằng năm bắt đầu (validFromYear).',
  NO_YEAR_ZERO: 'Lịch sử không có năm 0 (dùng số âm cho TCN: -1 = 1 TCN, 1 = 1 SCN).',
  STATEMENT_NOT_FOUND: 'Không tìm thấy phát biểu lịch sử.',
  DUPLICATE_STATEMENT: 'Mối quan hệ này giữa chủ thể và đối tượng đã tồn tại.',
  INVALID_LITERAL_VALUE: 'Giá trị literal không khớp với kiểu dữ liệu đã khai báo.',
  REFERENCE_NOT_FOUND: 'Không tìm thấy tài liệu tham khảo nguồn.',
  STATEMENT_REFERENCE_NOT_FOUND: 'Không tìm thấy liên kết tài liệu tham khảo của phát biểu.',
  TARGET_NODE_NOT_FOUND: 'Không tìm thấy nút gốc để dựng đồ thị tri thức.',
} as const;
