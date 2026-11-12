import { LessonBlockType } from '../types/block-palette.types';
import { TextBlockData } from '../types/block-builder.types';
import { BlockPlugin, BlockWidth } from './block-plugin.types';
import { sanitizeRichHtml } from '@/utils/sanitize-html';

export const textBlockPlugin: BlockPlugin<TextBlockData> = {
  type: LessonBlockType.TEXT,

  createDefault: (id: string, defaultWidth: BlockWidth): TextBlockData => ({
    id,
    type: LessonBlockType.TEXT,
    width: defaultWidth,
    content:
      '<h3>Đề mục nội dung mới</h3><p>Nhập nội dung văn bản chi tiết về diễn biến, phân tích hoặc đánh giá sự kiện lịch sử tại đây...</p>',
  }),

  toHtml: (block: TextBlockData): string => {
    return sanitizeRichHtml(block.content);
  },
};
