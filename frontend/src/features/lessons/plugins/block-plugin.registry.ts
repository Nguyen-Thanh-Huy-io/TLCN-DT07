import { LessonBlockType } from '../types/block-palette.types';
import { LessonBlockItem } from '../types/block-builder.types';
import { BlockPlugin, renderCollapsibleDetail } from './block-plugin.types';
import { BlockWidthStrategy } from '../strategies/block-width.strategy';
import { createBlockUUID } from '../strategies/story-chapter-layout.strategy';

import { textBlockPlugin } from './text-block.plugin';
import { headingBlockPlugin } from './heading-block.plugin';
import { imageBlockPlugin } from './image-block.plugin';
import { videoBlockPlugin } from './video-block.plugin';
import { quoteBlockPlugin } from './quote-block.plugin';
import { calloutBlockPlugin } from './callout-block.plugin';
import { timelineBlockPlugin } from './timeline-block.plugin';
import { characterBlockPlugin } from './character-block.plugin';
import { eventBlockPlugin } from './event-block.plugin';
import { mapBlockPlugin } from './map-block.plugin';
import { comparisonTableBlockPlugin } from './comparison-table-block.plugin';
import { quizBlockPlugin } from './quiz-block.plugin';
import { dividerBlockPlugin } from './divider-block.plugin';
import { relatedPeopleBlockPlugin } from './related-people-block.plugin';
import { relatedEventsBlockPlugin } from './related-events-block.plugin';
import { sectionRowBlockPlugin, setRowSectionCompiler } from './section-row-block.plugin';
import { storyChapterBlockPlugin, setStoryChapterChildCompiler } from './story-chapter-block.plugin';
import { resourceLinkBlockPlugin } from './resource-link-block.plugin';

/**
 * Registry trung tâm quản lý các Block Plugin theo nguyên tắc Mở/Đóng (OCP) và Đơn nhiệm (SRP).
 * Khi thêm bất kỳ loại khối mới nào trong tương lai (ví dụ: AUDIO, FLASHCARD),
 * chỉ cần tạo 1 file plugin tương ứng và đăng ký vào Registry này.
 */
export class LessonBlockRegistry {
  private static plugins = new Map<LessonBlockType, BlockPlugin<any>>();

  static {
    // Đăng ký toàn bộ 18 Block Plugins theo Registry Pattern (OCP)
    const allPlugins: BlockPlugin<any>[] = [
      textBlockPlugin,
      headingBlockPlugin,
      imageBlockPlugin,
      videoBlockPlugin,
      quoteBlockPlugin,
      calloutBlockPlugin,
      timelineBlockPlugin,
      characterBlockPlugin,
      eventBlockPlugin,
      mapBlockPlugin,
      comparisonTableBlockPlugin,
      quizBlockPlugin,
      dividerBlockPlugin,
      relatedPeopleBlockPlugin,
      relatedEventsBlockPlugin,
      sectionRowBlockPlugin,
      storyChapterBlockPlugin,
      resourceLinkBlockPlugin,
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
  public static registerPlugin(plugin: BlockPlugin<any>): void {
    this.plugins.set(plugin.type, plugin);
  }

  /**
   * Lấy Block Plugin theo loại
   */
  public static getPlugin(type: LessonBlockType): BlockPlugin<any> | undefined {
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
    if (!plugin && (rawType === 'TABLE' || rawType === 'COMPARISON_TABLE')) {
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
