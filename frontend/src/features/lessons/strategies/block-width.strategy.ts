import { LessonBlockType } from '../types/block-palette.types';
import { BlockWidthType } from '../types/block-builder.types';

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
      label: 'Auto',
      shortLabel: 'Auto',
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
