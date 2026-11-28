export enum LearnerHistoryKind {
  QUIZ_ATTEMPTS = 'QUIZ_ATTEMPTS',
  COMPLETED_LESSONS = 'COMPLETED_LESSONS',
  READ_ARTICLES = 'READ_ARTICLES',
}

export const LEARNER_HISTORY_LIMITS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
} as const;

export const LEARNER_ROUTES = {
  ROOT: 'me/learning',
  ENROLL: 'paths/:learningPathId/enroll',
  PATH_PROGRESSION: 'paths/:learningPathId/progression',
  LESSON: 'lessons/:slug',
  COMPLETE: 'lessons/:lessonId/complete',
  HISTORY: 'history',
  QUIZ_ATTEMPT_DETAIL: 'quiz-attempts/:attemptId',
} as const;

export const LEARNER_ERROR_CODES = {
  NOT_ENROLLED: 'NOT_ENROLLED',
  PREREQUISITE_NOT_MET: 'PREREQUISITE_NOT_MET',
  LESSON_LOCKED_SEQUENTIAL: 'LESSON_LOCKED_SEQUENTIAL',
  CHAPTER_QUIZ_LOCKED: 'CHAPTER_QUIZ_LOCKED',
} as const;

export const LEARNER_MESSAGES = {
  NOT_ENROLLED: 'Bạn cần đăng ký lộ trình chứa bài học này để đọc nội dung.',
  PREREQUISITE_NOT_MET: (title: string, count: number, total: number) =>
    `Bạn cần hoàn thành toàn bộ lộ trình tiên quyết "${title}" (${count}/${total} bài) trước khi đăng ký lộ trình này.`,
  LESSON_LOCKED_SEQUENTIAL: (prereqTitle?: string) =>
    prereqTitle
      ? `Bài học này đang bị khóa. Bạn cần hoàn thành bài "${prereqTitle}" trước.`
      : 'Bài học này đang bị khóa theo tiến trình học tuần tự của lộ trình.',
  CHAPTER_QUIZ_LOCKED: (
    quizTitle: string,
    chapterTitle: string,
    passScore: number,
  ) =>
    `Bạn cần vượt qua đề kiểm tra "${quizTitle}" (đạt tối thiểu ${passScore}%) của "${chapterTitle}" để mở khóa chương tiếp theo.`,
  PATH_NOT_FOUND: (id: string) =>
    `Không tìm thấy lộ trình đã xuất bản với ID "${id}".`,
  LESSON_NOT_FOUND: (key: string) =>
    `Không tìm thấy bài học đã xuất bản "${key}".`,
  QUIZ_ATTEMPT_NOT_FOUND: 'Không tìm thấy lịch sử lượt làm bài này.',
  QUIZ_ATTEMPT_FORBIDDEN:
    'Bạn không có quyền xem lượt làm bài của người dùng khác.',
} as const;
