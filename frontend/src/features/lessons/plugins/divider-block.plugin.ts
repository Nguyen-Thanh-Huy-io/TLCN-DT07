import { LessonBlockType } from '../types/block-palette.types';
import { DividerBlockData } from '../types/block-builder.types';
import { BlockPlugin, BlockWidth } from './block-plugin.types';

export const dividerBlockPlugin: BlockPlugin<DividerBlockData> = {
  type: LessonBlockType.DIVIDER,

  createDefault: (id: string, defaultWidth: BlockWidth): DividerBlockData => ({
    id,
    type: LessonBlockType.DIVIDER,
    width: defaultWidth,
  }),

  toHtml: (): string => {
    return `<hr style="margin: 32px 0; border: none; border-top: 1px solid #e2e8f0;" />`;
  },
};
