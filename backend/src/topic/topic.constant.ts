/**
 * Hằng số cấu hình phân cấp cho Chủ đề lịch sử (Topic Hierarchy Constants)
 * Tuân thủ quy tắc Không Magic String
 */

export const TOPIC_HIERARCHY_CONFIG = {
  /**
   * Giới hạn độ sâu phân cấp tối đa của chủ đề:
   * Cấp 1 (Gốc) -> Cấp 2 (Con) -> Cấp 3 (Cháu)
   */
  MAX_DEPTH: 3,

  /**
   * Thời gian lưu cache Redis cho Topic (giây)
   */
  CACHE_TTL: 300,

  /**
   * Tiền tố Cache Redis
   */
  CACHE_PREFIX: 'topic:list',
  CACHE_DETAIL_PREFIX: 'topic:detail',
  CACHE_TREE_PREFIX: 'topic:tree',
} as const;

export const TOPIC_ERROR_MESSAGES = {
  NOT_FOUND: 'Chủ đề lịch sử không tồn tại',
  PARENT_NOT_FOUND: 'Chủ đề cha được chỉ định không tồn tại',
  PERIOD_NOT_FOUND: 'Giai đoạn lịch sử không tồn tại',
  MAX_DEPTH_EXCEEDED: 'Vượt quá giới hạn phân cấp tối đa: Hệ thống chỉ hỗ trợ tối đa 3 cấp chủ đề (Gốc -> Con -> Cháu)',
  CYCLE_DETECTED: 'Phát hiện chu trình lặp: Chủ đề cha được chọn là con hoặc cháu của chủ đề hiện tại',
  CHILD_NOT_BELONG_TO_PARENT: 'Chủ đề con không thuộc về chủ đề cha này',
  CHILD_IDS_REQUIRED: 'Danh sách mã chủ đề con (childIds) không được để trống',
  REORDER_EMPTY: 'Danh sách sắp xếp lại thứ tự (items) không được để trống',
} as const;

export const TOPIC_SUCCESS_MESSAGES = {
  REORDER_SUCCESS: 'Đã cập nhật thứ tự hiển thị các chủ đề thành công',
} as const;
