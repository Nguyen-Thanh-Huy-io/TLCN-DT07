import { LessonBlockType } from '../types/block-palette.types';
import { ResourceLinkBlockData } from '../types/block-builder.types';
import { BlockPlugin, BlockWidth, safeUrl, escapeHtml } from './block-plugin.types';
import { SAMPLE_REMOTE_LINKS } from '@/constants/routes';

export const resourceLinkBlockPlugin: BlockPlugin<ResourceLinkBlockData> = {
  type: LessonBlockType.RESOURCE_LINK,

  createDefault: (id: string, defaultWidth: BlockWidth): ResourceLinkBlockData => ({
    id,
    type: LessonBlockType.RESOURCE_LINK,
    width: defaultWidth,
    title: 'Đại Việt Sử Ký Toàn Thư / Lịch sử Quân sự Việt Nam',
    url: SAMPLE_REMOTE_LINKS.DIEN_BIEN_PHU_WIKI,
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
