export const HISTORICAL_ENTITY_ROUTES = {
  ROOT: 'historical-entities',
  BY_ID: ':id',
  RELATIONS: ':id/relations',
  RELATION_BY_ID: ':id/relations/:relationId',
  GRAPH: ':id/graph',
  MEDIA: ':id/media',
  MEDIA_BY_ID: ':id/media/:mediaId',
} as const;

export const HISTORICAL_ENTITY_CACHE = {
  LIST_PREFIX: 'historical_entities:list',
  DETAIL_PREFIX: 'historical_entity:detail',
  GRAPH_PREFIX: 'historical_entity:graph',
  TTL_SECONDS: 3600,
} as const;

/**
 * Enum quan hệ hồi quy N-N giữa các thực thể lịch sử (Knowledge Graph Edge Type)
 * Quản lý tập trung bằng code backend, đảm bảo không magic string và tuân thủ OCP.
 */
export enum EntityRelationType {
  // Lãnh đạo / Trực thuộc / Thành viên
  LEADER_OF = 'LEADER_OF',           // Vd: Vua lãnh đạo Triều đại, Tướng chỉ huy Quân đoàn
  MEMBER_OF = 'MEMBER_OF',           // Vd: Đảng viên thuộc Đảng phái, Binh sĩ thuộc Binh đoàn
  FOUNDER_OF = 'FOUNDER_OF',         // Vd: Vua sáng lập Triều đại, Lãnh tụ thành lập Tổ chức
  SUCCESSOR_TO = 'SUCCESSOR_TO',     // Vd: Vua kế vị Vua trước

  // Huyết thống / Gia tộc
  CHILD_OF = 'CHILD_OF',             // Con cái của
  PARENT_OF = 'PARENT_OF',           // Cha mẹ của
  SPOUSE_OF = 'SPOUSE_OF',           // Vợ/chồng của
  SIBLING_OF = 'SIBLING_OF',         // Anh chị em ruột

  // Chính trị & Quân sự
  ALLIED_WITH = 'ALLIED_WITH',       // Liên minh với
  OPPOSED_TO = 'OPPOSED_TO',         // Đối địch / Kình địch với
  VASSAL_OF = 'VASSAL_OF',           // Chư hầu / Thần phục

  // Văn hóa / Tác giả / Lưu trữ
  AUTHOR_OF = 'AUTHOR_OF',           // Tác giả của Văn kiện / Hiện vật
  HOUSED_AT = 'HOUSED_AT',           // Lưu giữ / Trưng bày tại
  COMMEMORATES = 'COMMEMORATES',     // Tưởng niệm / Vinh danh

  // Vị trí địa lý / Trực thuộc không gian
  LOCATED_IN = 'LOCATED_IN',         // Nằm trong / Đặt tại
  CAPITAL_OF = 'CAPITAL_OF',         // Kinh đô của

  OTHER = 'OTHER',                   // Quan hệ khác
}

export const HISTORICAL_ENTITY_ERRORS = {
  NOT_FOUND: (id: string) =>
    `Thực thể lịch sử với ID "${id}" không tồn tại trong hệ thống`,
  PERIOD_NOT_FOUND: (periodId: string) =>
    `Giai đoạn lịch sử với ID "${periodId}" không tồn tại`,
  INVALID_YEAR_RANGE:
    'deathYear (năm mất/kết thúc) phải lớn hơn hoặc bằng birthYear (năm sinh/thành lập)',
  RELATION_NOT_FOUND: (relationId: string) =>
    `Quan hệ thực thể với ID "${relationId}" không tồn tại`,
  RELATION_SELF_LOOP:
    'Thực thể không thể tự tạo mối quan hệ với chính nó (sourceId trùng targetId)',
  RELATION_INVALID_YEAR_RANGE:
    'endYear phải lớn hơn hoặc bằng startYear trong mối quan hệ',
  MEDIA_NOT_FOUND: (mediaId: string) =>
    `Tư liệu media với ID "${mediaId}" không tồn tại`,
} as const;

export const HISTORICAL_ENTITY_MESSAGES = {
  DELETED: 'Đã xóa thực thể lịch sử thành công',
  RELATION_DELETED: 'Đã xóa quan hệ thực thể thành công',
  MEDIA_DELETED: 'Đã xóa tư liệu media thành công',
} as const;
