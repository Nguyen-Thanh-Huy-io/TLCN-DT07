import { ContentStatus, LessonStatus, userRole } from '@prisma/client';

/**
 * Vai trò trong hệ thống (dùng enum userRole sẵn có):
 *  - USER        Người học: đăng ký lộ trình, đọc bài, làm quiz.
 *  - MODERATOR   Biên tập viên: soạn/sửa nội dung, gửi duyệt — không tự xuất bản.
 *  - ADMIN       Người duyệt: mọi quyền biên tập + duyệt/xuất bản, không duyệt bài của chính mình.
 *  - SUPERADMIN  Mọi quyền trên + quản lý tài khoản và phân quyền.
 */
export const ROLE_GROUPS = {
  STAFF: [userRole.MODERATOR, userRole.ADMIN, userRole.SUPERADMIN],
  REVIEWERS: [userRole.ADMIN, userRole.SUPERADMIN],
  SUPERADMIN: [userRole.SUPERADMIN],
} as const;

export const ROLES_METADATA_KEY = 'access:roles';
export const CONTENT_RESOURCE_METADATA_KEY = 'access:content-resource';

/** Trạng thái biên tập viên được tự đặt cho nội dung. */
export const EDITOR_ALLOWED_STATUSES: ReadonlyArray<string> = [
  ContentStatus.DRAFT,
  ContentStatus.PENDING_REVIEW,
  LessonStatus.REVIEW,
];

/** Nội dung ở các trạng thái này đã/đang công khai: biên tập viên không được sửa hay xóa. */
export const LOCKED_FOR_EDITORS: ReadonlyArray<string> = [
  ContentStatus.PUBLISHED,
  ContentStatus.ARCHIVED,
];

export const ACCESS_MESSAGES = {
  FORBIDDEN_ROLE: 'Tài khoản của bạn không có quyền thực hiện thao tác này.',
  EDITOR_CANNOT_PUBLISH:
    'Biên tập viên chỉ được lưu nháp hoặc gửi duyệt — việc xuất bản do người duyệt thực hiện.',
  EDITOR_LOCKED:
    'Nội dung đã xuất bản/lưu trữ: cần người duyệt chuyển về bản nháp trước khi biên tập viên chỉnh sửa.',
  LESSON_PUBLISH_VIA_REVIEW:
    'Xuất bản hoặc từ chối bài học phải thực hiện qua chức năng Duyệt bài.',
  CANNOT_REVIEW_OWN: 'Bạn không thể tự duyệt bài học do chính mình biên soạn.',
  NOT_IN_REVIEW: 'Chỉ duyệt được bài học đang ở trạng thái chờ duyệt.',
} as const;
