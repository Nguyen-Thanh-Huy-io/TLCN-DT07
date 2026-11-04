export const HISTORICAL_EVENT_CACHE = {
  LIST_PREFIX: 'historical_events:list',
  DETAIL_PREFIX: 'historical_event:detail',
  GRAPH_PREFIX: 'historical_events:graph',
  TTL_SECONDS: 3600,
} as const;

export const HISTORICAL_EVENT_TOKENS = {
  REPOSITORY: Symbol('IHistoricalEventRepository'),
} as const;

export const HISTORICAL_EVENT_ERRORS = {
  NOT_FOUND: (id: string) => `Sự kiện lịch sử với ID "${id}" không tồn tại`,
  TOPIC_NOT_FOUND: (topicId: string) =>
    `Chủ đề lịch sử với ID "${topicId}" không tồn tại`,
  PERIOD_NOT_FOUND: (periodId: string) =>
    `Thời kỳ lịch sử với ID "${periodId}" không tồn tại`,
  SITE_NOT_FOUND: (siteId: string) =>
    `Di tích / Địa danh lịch sử với ID "${siteId}" không tồn tại`,
  LOCATION_NOT_FOUND: (locationId: string) =>
    `Di tích / Địa danh lịch sử với ID "${locationId}" không tồn tại`,
  INVALID_YEAR_RANGE:
    'Năm kết thúc (endYear) không được nhỏ hơn năm diễn ra (startYear)',
  INVALID_METADATA_FORMAT: 'Trường metadata phải là một JSON Object hợp lệ',
  CHILDREN_EXIST_CANNOT_DELETE: (childCount: number) =>
    `Không thể xóa sự kiện cha này vì đang có ${childCount} sự kiện thành phần con trực thuộc. Vui lòng chuyển hoặc xử lý các sự kiện con trước khi xóa.`,
  RELATION_SELF_LOOP: 'Sự kiện không thể tự liên kết nhân quả với chính nó',
  RELATION_NOT_FOUND: (id: string) =>
    `Mối quan hệ sự kiện với ID "${id}" không tồn tại`,
} as const;

export const HISTORICAL_EVENT_MESSAGES = {
  DELETE_SUCCESS: 'Xóa sự kiện lịch sử thành công',
  DELETED: (id: string) =>
    `Sự kiện lịch sử với ID "${id}" đã được xóa thành công`,
  RELATION_DELETED: 'Xóa mối quan hệ sự kiện thành công',
} as const;
