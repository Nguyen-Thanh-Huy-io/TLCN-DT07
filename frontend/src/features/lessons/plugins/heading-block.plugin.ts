import { LessonBlockType } from '../types/block-palette.types';
import { HeadingBlockData } from '../types/block-builder.types';
import { BlockPlugin, BlockWidth, escapeHtml } from './block-plugin.types';

export const headingBlockPlugin: BlockPlugin<HeadingBlockData> = {
  type: LessonBlockType.HEADING,

  createDefault: (id: string, defaultWidth: BlockWidth): HeadingBlockData => ({
    id,
    type: LessonBlockType.HEADING,
    width: defaultWidth,
    level: 2,
    text: 'Tiêu đề phân mục mới',
  }),

  toHtml: (block: HeadingBlockData): string => {
    const level = block.level && block.level >= 1 && block.level <= 6 ? block.level : 2;
    const tag = `h${level}`;
    const safeText = escapeHtml(block.text);
    return `<${tag} style="font-weight: 700; color: #0f172a; margin: 24px 0 12px 0; font-family: var(--font-merriweather), 'Noto Serif', serif;">${safeText}</${tag}>`;
  },
};
