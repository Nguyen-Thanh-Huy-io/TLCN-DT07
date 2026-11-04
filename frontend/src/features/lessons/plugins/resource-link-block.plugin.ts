import { LessonBlockType } from '../types/block-palette.types';
import { ResourceLinkBlockData } from '../types/block-builder.types';
import { BlockPlugin, BlockWidth, safeUrl, escapeHtml } from './block-plugin.types';

export const resourceLinkBlockPlugin: BlockPlugin<ResourceLinkBlockData> = {
  type: LessonBlockType.RESOURCE_LINK,

  createDefault: (id: string, defaultWidth: BlockWidth): ResourceLinkBlockData => ({
    id,
    type: LessonBlockType.RESOURCE_LINK,
    width: defaultWidth,
    title: 'Đại Việt Sử Ký Toàn Thư / Lịch sử Quân sự Việt Nam',
    url: 'https://vi.wikipedia.org/wiki/Chi%E1%BA%BFn_d%E1%BB%8Bch_%C4%90i%E1%BB%87n_Bi%C3%AAn_Ph%E1%BB%A7',
    note: 'Tài liệu sử liệu tham khảo chuẩn (NXB Quân đội Nhân dân).',
  }),

  toHtml: (block: ResourceLinkBlockData): string => {
    const safeHref = safeUrl(block.url);
    const safeTitle = escapeHtml(block.title);
    const safeNote = block.note ? escapeHtml(block.note) : '';

    return `
      <div class="my-4 p-3 bg-slate-50 border-l-4 border-blue-600 rounded-r-lg text-xs">
        <strong>📄 Sử liệu tham khảo: </strong>
        <a href="${safeHref}" target="_blank" rel="noreferrer" class="text-blue-600 font-semibold hover:underline">${safeTitle}</a>
        ${safeNote ? `<p class="text-slate-500 mt-1 mb-0">${safeNote}</p>` : ''}
      </div>`;
  },
};
