/** Tab lọc ở màn hình kiểm duyệt (query `tab` của GET /moderation/reports). */
export enum ModerationTab {
  PENDING = 'pending',
  AUTO_HIDDEN = 'auto_hidden',
  USER_REPORT = 'user_report',
  REMOVED = 'removed',
  DISMISSED = 'dismissed',
  ALL = 'all',
}

/** Thao tác người duyệt chọn khi xử lý một báo cáo. */
export enum ModerationResolveAction {
  CONFIRM_REMOVE = 'CONFIRM_REMOVE',
  RESTORE = 'RESTORE',
  BAN_USER = 'BAN_USER',
}
