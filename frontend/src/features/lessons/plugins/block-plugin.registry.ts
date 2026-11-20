import { LessonBlockType } from '../types/editor.types';
import { LessonBlockItem } from '../types/block-builder.types';
import { BlockPlugin, renderCollapsibleDetail } from './block-plugin.types';
import { BlockWidthStrategy } from '../strategies/row-layout.strategy';
import { createBlockUUID } from '../strategies/story-chapter-layout.strategy';

export const generateBlockId = (prefix: string = 'block'): string => {
  return createBlockUUID(prefix);
};

import {
  textBlockPlugin,
  headingBlockPlugin,
  imageBlockPlugin,
  videoBlockPlugin,
  quoteBlockPlugin,
  calloutBlockPlugin,
  characterBlockPlugin,
  eventBlockPlugin,
  mapBlockPlugin,
  comparisonTableBlockPlugin,
  quizBlockPlugin,
  dividerBlockPlugin,
  relatedPeopleBlockPlugin,
  relatedEventsBlockPlugin,
  sectionRowBlockPlugin,
  setRowSectionCompiler,
  resourceLinkBlockPlugin,
} from './simple-block.plugins';
import { timelineBlockPlugin } from './timeline-block.plugin';
import { storyChapterBlockPlugin, setStoryChapterChildCompiler } from './story-chapter-block.plugin';

const LEGACY_TABLE_TYPE = 'TABLE';
const LEGACY_COMPARISON_TABLE_TYPE = 'COMPARISON_TABLE';

/**
 * Registry trung tâm quản lý các Block Plugin theo nguyên tắc Mở/Đóng (OCP) và Đơn nhiệm (SRP).
 * Khi thêm bất kỳ loại khối mới nào trong tương lai (ví dụ: AUDIO, FLASHCARD),
 * chỉ cần tạo 1 file plugin tương ứng và đăng ký vào Registry này.
 */
export class LessonBlockRegistry {
  private static plugins = new Map<LessonBlockType, BlockPlugin<LessonBlockItem>>();

  static {
    // Đăng ký toàn bộ 18 Block Plugins theo Registry Pattern (OCP)
    const allPlugins: BlockPlugin<LessonBlockItem>[] = [
      textBlockPlugin as BlockPlugin<LessonBlockItem>,
      headingBlockPlugin as BlockPlugin<LessonBlockItem>,
      imageBlockPlugin as BlockPlugin<LessonBlockItem>,
      videoBlockPlugin as BlockPlugin<LessonBlockItem>,
      quoteBlockPlugin as BlockPlugin<LessonBlockItem>,
      calloutBlockPlugin as BlockPlugin<LessonBlockItem>,
      timelineBlockPlugin as BlockPlugin<LessonBlockItem>,
      characterBlockPlugin as BlockPlugin<LessonBlockItem>,
      eventBlockPlugin as BlockPlugin<LessonBlockItem>,
      mapBlockPlugin as BlockPlugin<LessonBlockItem>,
      comparisonTableBlockPlugin as BlockPlugin<LessonBlockItem>,
      quizBlockPlugin as BlockPlugin<LessonBlockItem>,
      dividerBlockPlugin as BlockPlugin<LessonBlockItem>,
      relatedPeopleBlockPlugin as BlockPlugin<LessonBlockItem>,
      relatedEventsBlockPlugin as BlockPlugin<LessonBlockItem>,
      sectionRowBlockPlugin as BlockPlugin<LessonBlockItem>,
      storyChapterBlockPlugin as BlockPlugin<LessonBlockItem>,
      resourceLinkBlockPlugin as BlockPlugin<LessonBlockItem>,
    ];

    for (const plugin of allPlugins) {
      LessonBlockRegistry.plugins.set(plugin.type, plugin);
    }

    // Khởi tạo các hàm biên dịch lồng nhau cho composite blocks (Composite Pattern)
    setRowSectionCompiler((b) => LessonBlockRegistry.blockToHtml(b));
    setStoryChapterChildCompiler((b) => LessonBlockRegistry.blockToHtml(b));
  }

  /**
   * Đăng ký một Block Plugin mới hoặc ghi đè plugin hiện có
   */
  public static registerPlugin(plugin: BlockPlugin<LessonBlockItem>): void {
    this.plugins.set(plugin.type, plugin);
  }

  /**
   * Lấy Block Plugin theo loại
   */
  public static getPlugin(type: LessonBlockType): BlockPlugin<LessonBlockItem> | undefined {
    return this.plugins.get(type);
  }

  /**
   * Sinh dữ liệu mặc định ban đầu cho Builder theo loại khối
   */
  public static createDefaultBlock(type: LessonBlockType): LessonBlockItem {
    const plugin = this.plugins.get(type);
    const id = createBlockUUID(type.toLowerCase());
    const defaultWidth = BlockWidthStrategy.getDefaultWidth(type);

    if (!plugin) {
      return textBlockPlugin.createDefault(id, defaultWidth);
    }
    return plugin.createDefault(id, defaultWidth);
  }

  /**
   * Biên dịch dữ liệu khối thành chuỗi HTML an toàn, chuẩn Typography
   */
  public static blockToHtml(block: LessonBlockItem): string {
    const rawType = String(block.type || '').toUpperCase();
    let plugin = this.plugins.get(rawType as LessonBlockType);
    if (!plugin && (rawType === LEGACY_TABLE_TYPE || rawType === LEGACY_COMPARISON_TABLE_TYPE)) {
      plugin = this.plugins.get(LessonBlockType.COMPARISON_TABLE);
    }
    if (!plugin) {
      return '';
    }
    return plugin.toHtml(block);
  }

  /**
   * Tiện ích render Collapsible Detail (giữ tương thích ngược)
   */
  public static renderCollapsibleDetail(detailContent?: string, label: string = 'Xem chi tiết'): string {
    return renderCollapsibleDetail(detailContent, label);
  }
}
