import { LessonBlockType } from '../types/block-palette.types';
import { VideoBlockData } from '../types/block-builder.types';
import { BlockPlugin, BlockWidth, safeUrl } from './block-plugin.types';

export const videoBlockPlugin: BlockPlugin<VideoBlockData> = {
  type: LessonBlockType.VIDEO,

  createDefault: (id: string, defaultWidth: BlockWidth): VideoBlockData => ({
    id,
    type: LessonBlockType.VIDEO,
    width: defaultWidth,
    src: '',
    sourceType: 'URL',
    caption: '',
  }),

  toHtml: (block: VideoBlockData): string => {
    if (!block.src) return '';
    const safeSrc = safeUrl(block.src);

    return `
      <div class="my-6 aspect-video rounded-xl overflow-hidden bg-black max-w-2xl mx-auto">
        <iframe src="${safeSrc}" class="w-full h-full border-0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
      </div>`;
  },
};
