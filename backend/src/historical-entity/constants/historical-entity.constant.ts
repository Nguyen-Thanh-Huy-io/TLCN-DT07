export const HISTORICAL_ENTITY_CONSTANTS = {
  CACHE_PREFIX: 'historical_entities:list',
  CACHE_DETAIL_PREFIX: 'historical_entity:detail',
  CACHE_TTL: 3600, // 1 hour
} as const;

export const HISTORICAL_ENTITY_ERROR_MESSAGES = {
  ENTITY_NOT_FOUND: 'Không tìm thấy thực thể lịch sử',
  NAME_REQUIRED: 'Tên thực thể lịch sử không được để trống',
  INVALID_YEAR_RANGE: 'Năm kết thúc phải lớn hơn hoặc bằng năm bắt đầu',
} as const;

export const HISTORICAL_ENTITY_SUCCESS_MESSAGES = {
  CREATED: 'Tạo thực thể lịch sử thành công',
  UPDATED: 'Cập nhật thực thể lịch sử thành công',
  DELETED: 'Xóa thực thể lịch sử thành công',
} as const;
