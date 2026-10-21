import { LessonBlockType } from '../types/block-palette.types';

export interface PlacementContext {
  location: 'ROOT' | 'COLUMN';
  columnWidthPercent?: number;
}

export interface PlacementValidationResult {
  allowed: boolean;
  reason?: string;
}

export class BlockPlacementRuleEngine {
  /**
   * Kiểm tra tính hợp lệ khi chèn hoặc kéo thả một khối vào vị trí chỉ định
   */
  public static validate(
    blockType: LessonBlockType,
    context: PlacementContext
  ): PlacementValidationResult {
    // Quy tắc 1: Khối Hàng nhiều cột (SECTION_ROW) cấm tuyệt đối lồng trong Cột khác
    if (blockType === LessonBlockType.SECTION_ROW && context.location === 'COLUMN') {
      return {
        allowed: false,
        reason: 'Hàng nhiều cột chỉ được đặt ở cấp ngoài cùng (Root), không được lồng trong cột con để tránh vỡ giao diện trên điện thoại.',
      };
    }

    // Quy tắc 2: Khối Timeline cần không gian tối thiểu 50% để vẽ trục thời gian và mốc năm
    if (
      blockType === LessonBlockType.TIMELINE &&
      context.location === 'COLUMN' &&
      context.columnWidthPercent !== undefined &&
      context.columnWidthPercent < 50
    ) {
      return {
        allowed: false,
        reason: 'Khối Timeline yêu cầu độ rộng tối thiểu 50% để hiển thị trục mốc lịch sử.',
      };
    }

    // Quy tắc 3: Khối Câu hỏi ôn tập (QUIZ) chỉ đặt ở cấp ngoài cùng cuối bài
    if (blockType === LessonBlockType.QUIZ && context.location === 'COLUMN') {
      return {
        allowed: false,
        reason: 'Khối Câu hỏi ôn tập (Quiz) cần đặt toàn chiều rộng trang bài học.',
      };
    }

    // Quy tắc 4: Khối Bảng so sánh yêu cầu độ rộng tối thiểu 40%
    if (
      blockType === LessonBlockType.COMPARISON_TABLE &&
      context.location === 'COLUMN' &&
      context.columnWidthPercent !== undefined &&
      context.columnWidthPercent < 40
    ) {
      return {
        allowed: false,
        reason: 'Bảng so sánh cần độ rộng tối thiểu 40% để các cột số liệu không bị ép chữ.',
      };
    }

    return { allowed: true };
  }
}
