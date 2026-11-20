/** Loại nội dung trong khối "Kho nội dung" của dashboard. */
export enum DashboardContentType {
  ARTICLE = 'ARTICLE',
  LESSON = 'LESSON',
  TIMELINE = 'TIMELINE',
  /** Đề thi chưa có trạng thái xuất bản riêng — chỉ có tổng số. */
  QUIZ = 'QUIZ',
}

/** Loại việc trong Hàng chờ duyệt. */
export enum ReviewQueueType {
  /** Bản sửa nội dung đang xuất bản (ContentRevision PROPOSAL chờ duyệt). */
  REVISION = 'REVISION',
  ARTICLE = 'ARTICLE',
  LESSON = 'LESSON',
  BLOG = 'BLOG',
  /** Báo cáo cộng đồng / AI chưa xử lý xong. */
  REPORT = 'REPORT',
}

export enum RecentActivityType {
  LESSON = 'LESSON',
  TOPIC = 'TOPIC',
  ARTICLE = 'ARTICLE',
}

/** Số việc tối đa mỗi loại trả về trong danh sách gộp (số đếm vẫn là tổng thật). */
export const REVIEW_QUEUE_ITEMS_PER_TYPE = 50;
export const RECENT_ACTIVITY_LIMIT = 8;
export const MY_REJECTED_LIMIT = 5;
