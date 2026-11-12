import { LessonBlockType } from '../types/block-palette.types';
import {
  LessonBlockItem,
  RowSectionBlockData,
} from '../types/block-builder.types';
import { BlockPlugin, BlockWidth } from './block-plugin.types';
import { RowLayoutStrategy } from '../strategies/row-layout.strategy';
import { createBlockUUID } from '../strategies/story-chapter-layout.strategy';

// Lazy-resolve compiler để tránh circular dependency giữa Registry và Composite Plugin
let compilerFn: (block: LessonBlockItem) => string = () => '';
export function setRowSectionCompiler(fn: (block: LessonBlockItem) => string) {
  compilerFn = fn;
}

export const sectionRowBlockPlugin: BlockPlugin<RowSectionBlockData> = {
  type: LessonBlockType.SECTION_ROW,

  createDefault: (id: string, defaultWidth: BlockWidth): RowSectionBlockData => {
    const col1Id = createBlockUUID('col');
    const col2Id = createBlockUUID('col');

    return {
      id,
      type: LessonBlockType.SECTION_ROW,
      width: defaultWidth,
      columnCount: 2,
      columns: [
        {
          id: col1Id,
          widthPercent: 50,
          blocks: [
            {
              id: createBlockUUID('text'),
              type: LessonBlockType.TEXT,
              content: '<p>Nội dung trình bày ở cột bên trái...</p>',
            },
          ],
        },
        {
          id: col2Id,
          widthPercent: 50,
          blocks: [
            {
              id: createBlockUUID('character'),
              type: LessonBlockType.CHARACTER,
              name: 'Tên nhân vật lịch sử',
              years: 'Niên đại hoạt động',
              summary: 'Tóm tắt vai trò và đóng góp lịch sử của nhân vật.',
              avatarUrl: '',
            },
          ],
        },
      ],
    };
  },

  toHtml: (block: RowSectionBlockData): string => {
    return RowLayoutStrategy.compileRowToHtml(block, (child) => compilerFn(child));
  },
};
