export const QUIZ_CONSTANTS = {
  CACHE_PREFIX: 'quizzes:list',
  CACHE_DETAIL_PREFIX: 'quiz:detail',
  CACHE_ATTEMPT_PREFIX: 'quiz:attempt',
  CACHE_TTL: 3600, // 1 hour
  DEFAULT_PASSING_SCORE: 70, // 70%
  DEFAULT_XP_REWARD: 50,
  MAX_QUESTIONS_PER_QUIZ: 100,
  MIN_OPTIONS_PER_QUESTION: 2,
  MAX_OPTIONS_PER_QUESTION: 10,
} as const;

export const QUIZ_ERROR_MESSAGES = {
  QUIZ_NOT_FOUND: 'Không tìm thấy bài kiểm tra (Quiz)',
  LESSON_NOT_FOUND: 'Không tìm thấy bài học liên kết',
  TOPIC_NOT_FOUND: 'Không tìm thấy chủ đề liên kết',
  QUESTION_NOT_FOUND: 'Không tìm thấy câu hỏi',
  ATTEMPT_NOT_FOUND: 'Không tìm thấy lượt làm bài kiểm tra',
  ATTEMPT_ALREADY_COMPLETED:
    'Lượt làm bài này đã hoàn thành hoặc hết thời gian',
  MAX_ATTEMPTS_REACHED:
    'Bạn đã đạt giới hạn số lần làm bài tối đa cho Quiz này',
  INVALID_QUESTION_TYPE: 'Loại câu hỏi không hợp lệ',
  NO_CORRECT_OPTION: 'Câu hỏi bắt buộc phải có ít nhất một đáp án đúng',
  MULTIPLE_CORRECT_FOR_SINGLE_CHOICE:
    'Câu hỏi trắc nghiệm một lựa chọn chỉ được có đúng 1 đáp án đúng',
  QUIZ_NOT_PUBLISHED: 'Bài kiểm tra chưa được xuất bản để làm bài',
  REJECTION_REASON_REQUIRED:
    'Bắt buộc phải nhập lý do từ chối khi từ chối duyệt bài kiểm tra',
} as const;

export const QUIZ_SUCCESS_MESSAGES = {
  QUIZ_CREATED: 'Tạo bài kiểm tra thành công',
  QUIZ_UPDATED: 'Cập nhật bài kiểm tra thành công',
  QUIZ_DELETED: 'Xóa bài kiểm tra thành công',
  QUIZ_REVIEWED: 'Kiểm duyệt bài kiểm tra thành công',
  ATTEMPT_STARTED: 'Bắt đầu làm bài kiểm tra thành công',
  ATTEMPT_SUBMITTED: 'Nộp bài kiểm tra và chấm điểm thành công',
} as const;
