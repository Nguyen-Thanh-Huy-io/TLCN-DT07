import { LessonBlockType } from '../types/block-palette.types';
import { LessonBlockItem } from '../types/block-builder.types';
import { createBlockUUID } from '../strategies/story-chapter-layout.strategy';
import { LessonBlockRegistry } from '../plugins/block-plugin.registry';

export const generateBlockId = (prefix: string = 'block'): string => {
  return createBlockUUID(prefix);
};

/**
 * LessonBlockFactory (Facade Pattern):
 * Ủy quyền toàn bộ việc tạo khối và biên dịch HTML sang LessonBlockRegistry.
 * Giữ vững tương thích ngược 100% với toàn bộ codebase hiện có,
 * đồng thời tuân thủ triệt để SRP & OCP.
 */
export class LessonBlockFactory {
  /**
   * Tạo một Block mới với dữ liệu khởi tạo mặc định theo loại khối
   */
  public static createDefaultBlock(type: LessonBlockType): LessonBlockItem {
    return LessonBlockRegistry.createDefaultBlock(type);
  }

  /**
   * Chuyển đổi khối thành chuỗi HTML chuẩn để hiển thị trong chế độ xem trước bài học
   */
  public static blockToHtml(block: LessonBlockItem): string {
    return LessonBlockRegistry.blockToHtml(block);
  }

  /**
   * HTML <details>/<summary> gốc cho nội dung chi tiết tuỳ chọn
   */
  public static renderCollapsibleDetail(detailContent?: string, label: string = 'Xem chi tiết'): string {
    return LessonBlockRegistry.renderCollapsibleDetail(detailContent, label);
  }
}
