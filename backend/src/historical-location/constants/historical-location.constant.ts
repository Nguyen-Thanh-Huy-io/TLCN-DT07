export const HISTORICAL_LOCATION_CONSTANTS = {
  CACHE_PREFIX: 'historical_locations:list',
  CACHE_DETAIL_PREFIX: 'historical_location:detail',
  CACHE_TTL: 3600, // 1 hour
} as const;

export const HISTORICAL_LOCATION_ERROR_MESSAGES = {
  LOCATION_NOT_FOUND: 'Không tìm thấy địa điểm lịch sử',
  NAME_REQUIRED: 'Tên địa điểm lịch sử không được để trống',
  INVALID_COORDINATES: 'Tọa độ GPS (latitude/longitude) không hợp lệ',
} as const;

export const HISTORICAL_LOCATION_SUCCESS_MESSAGES = {
  CREATED: 'Tạo địa điểm lịch sử thành công',
  UPDATED: 'Cập nhật địa điểm lịch sử thành công',
  DELETED: 'Xóa địa điểm lịch sử thành công',
} as const;
