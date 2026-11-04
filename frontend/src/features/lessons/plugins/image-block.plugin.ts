import { LessonBlockType } from '../types/block-palette.types';
import { ImageBlockData } from '../types/block-builder.types';
import { BlockPlugin, BlockWidth, safeUrl, escapeHtml } from './block-plugin.types';

export const imageBlockPlugin: BlockPlugin<ImageBlockData> = {
  type: LessonBlockType.IMAGE,

  createDefault: (id: string, defaultWidth: BlockWidth): ImageBlockData => ({
    id,
    type: LessonBlockType.IMAGE,
    width: defaultWidth,
    src: '',
    alt: '',
    caption: '',
  }),

  toHtml: (block: ImageBlockData): string => {
    if (!block.src) return '';
    const safeSrc = safeUrl(block.src);
    const safeAlt = escapeHtml(block.alt);
    const safeCaption = escapeHtml(block.caption);

    return `
      <figure class="my-6 text-center">
        <img src="${safeSrc}" alt="${safeAlt}" class="max-w-full rounded-xl mx-auto shadow-xs" style="max-height: 480px; object-fit: cover;" />
        ${safeCaption ? `<figcaption class="text-xs text-slate-500 italic mt-2">${safeCaption}</figcaption>` : ''}
      </figure>`;
  },
};
