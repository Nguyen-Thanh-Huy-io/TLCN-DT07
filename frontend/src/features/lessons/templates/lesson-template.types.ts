/**
 * Định danh các loại mẫu bài học lịch sử (Strategy Keys)
 * Đảm bảo OCP và không dùng magic string
 */
export enum LessonTemplateType {
  STANDARD = 'STANDARD',                     // Bài học chuẩn sư phạm chung
  MILITARY_CAMPAIGN = 'MILITARY_CAMPAIGN',   // Chiến dịch & Trận đánh quân sự
  HISTORICAL_FIGURE = 'HISTORICAL_FIGURE',   // Nhân vật lịch sử & Anh hùng dân tộc
  TREATY_CONFERENCE = 'TREATY_CONFERENCE',   // Hiệp định & Sự kiện ngoại giao
  BLANK = 'BLANK',                           // Bản nháp trống (chỉ tiêu đề)
}

export interface LessonTemplateContext {
  lessonTitle: string;
  topicName?: string;
}

export interface LessonTemplateMeta {
  type: LessonTemplateType;
  label: string;
  badge: string;
  description: string;
  icon: string;
}

/**
 * Interface Strategy theo nguyên tắc SOLID
 */
export interface ILessonTemplateStrategy {
  readonly meta: LessonTemplateMeta;
  generateHtml(context: LessonTemplateContext): string;
}
