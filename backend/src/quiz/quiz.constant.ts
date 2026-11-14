/** Ngưỡng điểm đạt mặc định (%) khi đề Quiz không chỉ định `passingScorePercent`. */
export const DEFAULT_QUIZ_PASSING_SCORE_PERCENT = 80;

/** Thời lượng làm bài mặc định (phút) khi đề Quiz không chỉ định `timeLimitMinutes`. */
export const DEFAULT_QUIZ_TIME_LIMIT_MINUTES = 15;

/** Điểm số mặc định của mỗi câu hỏi trong Ngân hàng câu hỏi. */
export const DEFAULT_QUESTION_POINTS = 10;

/** Số đề tối đa mỗi trang ở danh sách đề CMS. */
export const QUIZ_LIST_MAX_LIMIT = 100;

/** Trạng thái hiển thị của đề ở CMS (không lưu DB): có câu hỏi = ACTIVE, chưa có = DRAFT. */
export enum QuizListStatus {
  ACTIVE = 'ACTIVE',
  DRAFT = 'DRAFT',
  ALL = 'all',
}
