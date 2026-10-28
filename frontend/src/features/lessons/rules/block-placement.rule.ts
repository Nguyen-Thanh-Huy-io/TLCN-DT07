import { LessonBlockType } from '../types/block-palette.types';

export enum PlacementLocation {
  ROOT = 'ROOT',
  COLUMN = 'COLUMN',
}

export interface PlacementContext {
  location: PlacementLocation | 'ROOT' | 'COLUMN';
  columnWidthPercent?: number;
}

export interface PlacementValidationResult {
  allowed: boolean;
  reason?: string;
}

interface PlacementRule {
  validate(blockType: LessonBlockType, context: PlacementContext): PlacementValidationResult | null;
}

class SectionRowNestingRule implements PlacementRule {
  validate(blockType: LessonBlockType, context: PlacementContext): PlacementValidationResult | null {
    if (blockType === LessonBlockType.SECTION_ROW && context.location === PlacementLocation.COLUMN) {
      return {
        allowed: false,
        reason: 'Hàng nhiều cột chỉ được đặt ở cấp ngoài cùng (Root), không được lồng trong cột con để tránh vỡ giao diện trên điện thoại.',
      };
    }
    return null;
  }
}

class TimelineWidthRule implements PlacementRule {
  validate(blockType: LessonBlockType, context: PlacementContext): PlacementValidationResult | null {
    if (
      blockType === LessonBlockType.TIMELINE &&
      context.location === PlacementLocation.COLUMN &&
      context.columnWidthPercent !== undefined &&
      context.columnWidthPercent < 50
    ) {
      return {
        allowed: false,
        reason: 'Khối Timeline yêu cầu độ rộng tối thiểu 50% để hiển thị trục mốc lịch sử.',
      };
    }
    return null;
  }
}

class QuizRootOnlyRule implements PlacementRule {
  validate(blockType: LessonBlockType, context: PlacementContext): PlacementValidationResult | null {
    if (blockType === LessonBlockType.QUIZ && context.location === PlacementLocation.COLUMN) {
      return {
        allowed: false,
        reason: 'Khối Câu hỏi ôn tập (Quiz) cần đặt toàn chiều rộng trang bài học.',
      };
    }
    return null;
  }
}

class ComparisonTableWidthRule implements PlacementRule {
  validate(blockType: LessonBlockType, context: PlacementContext): PlacementValidationResult | null {
    if (
      blockType === LessonBlockType.COMPARISON_TABLE &&
      context.location === PlacementLocation.COLUMN &&
      context.columnWidthPercent !== undefined &&
      context.columnWidthPercent < 40
    ) {
      return {
        allowed: false,
        reason: 'Bảng so sánh cần độ rộng tối thiểu 40% để các cột số liệu không bị ép chữ.',
      };
    }
    return null;
  }
}

export class BlockPlacementRuleEngine {
  private static readonly rules: PlacementRule[] = [
    new SectionRowNestingRule(),
    new TimelineWidthRule(),
    new QuizRootOnlyRule(),
    new ComparisonTableWidthRule(),
  ];

  /**
   * Kiểm tra tính hợp lệ khi chèn hoặc kéo thả một khối vào vị trí chỉ định
   */
  public static validate(
    blockType: LessonBlockType,
    context: PlacementContext
  ): PlacementValidationResult {
    for (const rule of this.rules) {
      const result = rule.validate(blockType, context);
      if (result && !result.allowed) {
        return result;
      }
    }
    return { allowed: true };
  }
}
