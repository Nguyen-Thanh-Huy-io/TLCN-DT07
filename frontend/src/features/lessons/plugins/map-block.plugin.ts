import { LessonBlockType } from '../types/block-palette.types';
import { MapBlockData } from '../types/block-builder.types';
import { BlockPlugin, BlockWidth, escapeHtml } from './block-plugin.types';

export const mapBlockPlugin: BlockPlugin<MapBlockData> = {
  type: LessonBlockType.MAP,

  createDefault: (id: string, defaultWidth: BlockWidth): MapBlockData => ({
    id,
    type: LessonBlockType.MAP,
    width: defaultWidth,
    locationName: 'Thung lũng lòng chảo Điện Biên Phủ',
    description:
      'Vị trí thung lũng lòng chảo được bao bọc bởi các dãy núi cao hiểm trở Tây Bắc, giữ vai trò yết hầu chiến lược.',
  }),

  toHtml: (block: MapBlockData): string => {
    const safeLoc = escapeHtml(block.locationName);
    const safeDesc = escapeHtml(block.description);

    return `
      <blockquote class="my-4 border-l-4 border-emerald-500 bg-emerald-50/40 p-3 rounded-r-lg text-xs text-slate-700">
        <strong>🗺️ Địa bàn tác chiến:</strong> ${safeLoc}
        <p class="mt-1 mb-0 text-slate-600">${safeDesc}</p>
      </blockquote>`;
  },
};
