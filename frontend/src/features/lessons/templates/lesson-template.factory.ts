import {
  ILessonTemplateStrategy,
  LessonTemplateContext,
  LessonTemplateMeta,
  LessonTemplateType,
} from './lesson-template.types';
import {
  StandardLessonTemplateStrategy,
  MilitaryCampaignTemplateStrategy,
  HistoricalFigureTemplateStrategy,
  TreatyConferenceTemplateStrategy,
  BlankLessonTemplateStrategy,
} from './strategies';

/**
 * Registry & Factory quản lý các mẫu bài học (Template Registry Factory)
 * Tuân thủ tuyệt đối OCP & SRP
 */
export class LessonTemplateFactory {
  private static strategies: Map<LessonTemplateType, ILessonTemplateStrategy> = new Map([
    [LessonTemplateType.STANDARD, new StandardLessonTemplateStrategy()],
    [LessonTemplateType.MILITARY_CAMPAIGN, new MilitaryCampaignTemplateStrategy()],
    [LessonTemplateType.HISTORICAL_FIGURE, new HistoricalFigureTemplateStrategy()],
    [LessonTemplateType.TREATY_CONFERENCE, new TreatyConferenceTemplateStrategy()],
    [LessonTemplateType.BLANK, new BlankLessonTemplateStrategy()],
  ]);

  /**
   * Đăng ký thêm strategy mới mà không cần sửa code cũ (OCP)
   */
  static registerStrategy(strategy: ILessonTemplateStrategy): void {
    this.strategies.set(strategy.meta.type, strategy);
  }

  /**
   * Lấy danh sách tất cả các mẫu khả dụng để hiển thị trên UI
   */
  static getAllTemplateMetas(): LessonTemplateMeta[] {
    return Array.from(this.strategies.values()).map((s) => s.meta);
  }

  /**
   * Sinh nội dung HTML theo mẫu chỉ định
   */
  static generateContent(type: LessonTemplateType, context: LessonTemplateContext): string {
    const strategy = this.strategies.get(type) || this.strategies.get(LessonTemplateType.STANDARD);
    if (!strategy) return '';
    return strategy.generateHtml(context);
  }
}
