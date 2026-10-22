export const LEARNER_ROUTES = {
  ROOT: 'me/learning',
  ENROLL: 'paths/:learningPathId/enroll',
  LESSON: 'lessons/:slug',
  COMPLETE: 'lessons/:lessonId/complete',
} as const;

export const LEARNER_ERROR_CODES = {
  NOT_ENROLLED: 'NOT_ENROLLED',
} as const;

export const LEARNER_MESSAGES = {
  NOT_ENROLLED: 'Bạn cần đăng ký lộ trình chứa bài học này để đọc nội dung.',
  PATH_NOT_FOUND: (id: string) =>
    `Không tìm thấy lộ trình đã xuất bản với ID "${id}".`,
  LESSON_NOT_FOUND: (key: string) =>
    `Không tìm thấy bài học đã xuất bản "${key}".`,
} as const;
