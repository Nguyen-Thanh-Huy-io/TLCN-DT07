/**
 * Hằng số cấu hình và thông báo cho Module Tag (Không Magic String)
 */

export const TAG_CONFIG = {
  CACHE_TTL: 3600,
  CACHE_PREFIX: 'tags',
  LESSON_CACHE_PATTERN: 'lessons:*',
  TAG_CACHE_PATTERN: 'tags:*',
} as const;

export const TAG_MESSAGES = {
  NOT_FOUND: (id: string) => `Tag với ID "${id}" không tồn tại`,
  NAME_CONFLICT: (name: string) => `Tag với tên "${name}" đã tồn tại`,
  LESSON_NOT_FOUND: (lessonId: string) => `Bài học với ID "${lessonId}" không tồn tại`,
  INVALID_TAG_IDS: (invalidIds: string[]) =>
    `Một hoặc nhiều Tag ID không tồn tại: ${invalidIds.join(', ')}`,
  DELETED_SUCCESS: 'Đã xóa Tag thành công',
} as const;
