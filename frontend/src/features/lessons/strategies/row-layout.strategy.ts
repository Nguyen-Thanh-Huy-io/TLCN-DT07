import { ROW_LAYOUT_CONFIG } from '../constants/lesson.constants';
import { LessonBlockType } from '../types/editor.types';
import { BlockWidthType, ColumnData, RowSectionBlockData, LessonBlockItem } from '../types/block-builder.types';

export class RowLayoutStrategy {
  /**
   * Tính toán tỷ lệ 2 cột khi kéo thanh resizer, snap theo bước SNAP_STEP_PERCENT (5%)
   * và đảm bảo không cột nào nhỏ hơn MIN_COLUMN_WIDTH_PERCENT (20%)
   */
  public static computeTwoColumnSnap(
    rawLeftPercent: number
  ): [number, number] {
    const min = ROW_LAYOUT_CONFIG.MIN_COLUMN_WIDTH_PERCENT;
    const max = ROW_LAYOUT_CONFIG.MAX_COLUMN_WIDTH_PERCENT;
    const step = ROW_LAYOUT_CONFIG.SNAP_STEP_PERCENT;

    // Giới hạn trong khoảng [min, max]
    const clamped = Math.max(min, Math.min(max, rawLeftPercent));

    // Làm tròn theo nấc step (ví dụ 5%)
    const snappedLeft = Math.round(clamped / step) * step;
    const snappedRight = 100 - snappedLeft;

    return [snappedLeft, snappedRight];
  }

  /**
   * Phân bổ đều tỷ lệ % cho N cột
   */
  public static distributeEqualWidths(count: number): number[] {
    if (count <= 1) return [100];
    if (count === 2) return [50, 50];
    if (count === 3) return [33.33, 33.33, 33.34];
    if (count === 4) return [25, 25, 25, 25];

    const each = Number((100 / count).toFixed(2));
    const result = Array(count).fill(each);
    const sum = result.reduce((a, b) => a + b, 0);
    result[result.length - 1] += Number((100 - sum).toFixed(2));
    return result;
  }

  /**
   * Sinh giá trị grid-template-columns cho style CSS
   */
  public static getGridTemplateColumns(columns: ColumnData[]): string {
    if (!columns || columns.length <= 1) return '1fr';
    return columns.map((c) => `${c.widthPercent}%`).join(' ');
  }

  /**
   * Xuất mã HTML responsive cho Hàng nhiều cột
   */
  public static compileRowToHtml(
    row: RowSectionBlockData,
    blockToHtmlFn: (b: LessonBlockItem) => string
  ): string {
    const colCount = row.columnCount || row.columns.length || 1;
    const gridStyle = this.getGridTemplateColumns(row.columns);

    const colsHtml = row.columns
      .map((col, idx) => {
        const innerBlocksHtml = col.blocks.map(blockToHtmlFn).join('\n');
        return `
          <div class="hisgo-column col-index-${idx} flex-1 min-w-0 space-y-3">
            ${innerBlocksHtml || '<p class="text-slate-400 italic text-xs">Cột trống</p>'}
          </div>
        `;
      })
      .join('\n');

    return `
      <div 
        class="hisgo-row-section my-6 w-full flex flex-col md:grid gap-4" 
        style="grid-template-columns: ${gridStyle};" 
        data-columns="${colCount}"
      >
        ${colsHtml}
      </div>
    `;
  }
}


export interface IBlockWidthOption {
  type: BlockWidthType;
  label: string;
  shortLabel: string;
  cssClass: string;
}

export class BlockWidthStrategy {
  private static readonly WIDTH_DEFINITIONS: Record<BlockWidthType, IBlockWidthOption> = {
    [BlockWidthType.FULL]: {
      type: BlockWidthType.FULL,
      label: '100%',
      shortLabel: '100%',
      cssClass: 'w-full',
    },
    [BlockWidthType.HALF]: {
      type: BlockWidthType.HALF,
      label: '50%',
      shortLabel: '50%',
      cssClass: 'w-full md:w-[calc(50%-8px)]',
    },
    [BlockWidthType.THIRD]: {
      type: BlockWidthType.THIRD,
      label: '33%',
      shortLabel: '33%',
      cssClass: 'w-full md:w-[calc(33.333%-11px)]',
    },
    [BlockWidthType.AUTO]: {
      type: BlockWidthType.AUTO,
      label: 'Tự động',
      shortLabel: 'Tự động',
      cssClass: 'w-auto max-w-full',
    },
  };

  /**
   * Lấy danh sách các lựa chọn chiều rộng cho từng loại khối
   * Theo đúng ma trận yêu cầu của người dùng:
   * - Văn bản, Timeline, Bản đồ, Quiz: Toàn hàng
   * - Nhân vật, Thẻ sự kiện: 1/2 hoặc 1/3 (hoặc Toàn hàng)
   * - Ảnh tư liệu: 1/2 hoặc Toàn hàng
   * - Video: Toàn hàng hoặc 1/2
   * - Trích dẫn/Tài liệu: Theo nội dung hoặc 1/2
   */
  public static getAvailableWidths(blockType: LessonBlockType): BlockWidthType[] {
    switch (blockType) {
      case LessonBlockType.TEXT:
      case LessonBlockType.TIMELINE:
      case LessonBlockType.MAP:
      case LessonBlockType.QUIZ:
      case LessonBlockType.COMPARISON_TABLE:
        return [BlockWidthType.FULL];

      case LessonBlockType.CHARACTER:
      case LessonBlockType.EVENT:
        return [BlockWidthType.HALF, BlockWidthType.THIRD, BlockWidthType.FULL];

      case LessonBlockType.IMAGE:
        return [BlockWidthType.HALF, BlockWidthType.FULL];

      case LessonBlockType.VIDEO:
        return [BlockWidthType.FULL, BlockWidthType.HALF];

      case LessonBlockType.RESOURCE_LINK:
        return [BlockWidthType.AUTO, BlockWidthType.HALF, BlockWidthType.FULL];

      default:
        return [BlockWidthType.FULL];
    }
  }

  /**
   * Lấy chiều rộng mặc định cho từng loại khối khi khởi tạo
   */
  public static getDefaultWidth(blockType: LessonBlockType): BlockWidthType {
    switch (blockType) {
      case LessonBlockType.CHARACTER:
      case LessonBlockType.EVENT:
      case LessonBlockType.IMAGE:
        return BlockWidthType.HALF;

      case LessonBlockType.RESOURCE_LINK:
        return BlockWidthType.AUTO;

      case LessonBlockType.TEXT:
      case LessonBlockType.TIMELINE:
      case LessonBlockType.MAP:
      case LessonBlockType.VIDEO:
      case LessonBlockType.QUIZ:
      case LessonBlockType.COMPARISON_TABLE:
      default:
        return BlockWidthType.FULL;
    }
  }

  /**
   * Lấy tỷ lệ độ rộng phân số (để tính toán tự động gộp hàng)
   */
  public static getWidthFraction(width: BlockWidthType = BlockWidthType.FULL): number {
    switch (width) {
      case BlockWidthType.HALF:
        return 0.5;
      case BlockWidthType.THIRD:
        return 0.3334;
      case BlockWidthType.AUTO:
        return 0.5;
      case BlockWidthType.FULL:
      default:
        return 1.0;
    }
  }

  /**
   * Lấy CSS class tương ứng với độ rộng
   */
  public static getCssClass(width: BlockWidthType = BlockWidthType.FULL): string {
    return this.WIDTH_DEFINITIONS[width]?.cssClass || this.WIDTH_DEFINITIONS[BlockWidthType.FULL].cssClass;
  }

  /**
   * Lấy thông tin chi tiết một tùy chọn chiều rộng
   */
  public static getWidthOption(width: BlockWidthType): IBlockWidthOption {
    return this.WIDTH_DEFINITIONS[width] || this.WIDTH_DEFINITIONS[BlockWidthType.FULL];
  }
}

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
