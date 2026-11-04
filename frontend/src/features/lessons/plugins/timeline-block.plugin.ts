import { LessonBlockType } from '../types/block-palette.types';
import { TimelineBlockData, TimelineOrientation } from '../types/block-builder.types';
import { BlockPlugin, BlockWidth, safeUrl, escapeHtml, renderCollapsibleDetail } from './block-plugin.types';

export const timelineBlockPlugin: BlockPlugin<TimelineBlockData> = {
  type: LessonBlockType.TIMELINE,

  createDefault: (id: string, defaultWidth: BlockWidth): TimelineBlockData => ({
    id,
    type: LessonBlockType.TIMELINE,
    width: defaultWidth,
    title: 'Dòng thời gian lịch sử',
    subtitle: 'Các mốc lịch sử tiêu biểu',
    orientation: TimelineOrientation.VERTICAL,
    sourceMode: 'HYBRID',
    maxEvents: 10,
    filterConfig: {
      statusPublishedOnly: true,
    },
    displayConfig: {
      sceneStyle: 'MUSEUM_SPLIT',
      dateFormat: 'YEAR_ONLY',
      sortOrder: 'CHRONOLOGICAL',
      showDescription: true,
      showImage: true,
      showLocation: false,
      showRole: true,
      showDetailButton: true,
      itemsPerPage: 4,
    },
    nodes: [
      {
        id: 'node_1',
        year: '1945',
        title: 'Tuyên bố độc lập',
        description: 'Sự kiện đánh dấu bước ngoặt lịch sử mở ra kỷ nguyên mới cho dân tộc Việt Nam.',
        contentHtml:
          '<h3>Tuyên bố độc lập</h3><p>Sự kiện đánh dấu bước ngoặt lịch sử mở ra kỷ nguyên mới cho dân tộc Việt Nam.</p>',
        isManual: false,
      },
      {
        id: 'node_2',
        year: '1954',
        title: 'Chiến thắng Điện Biên Phủ',
        description: 'Mốc son chấn động địa cầu, kết thúc thắng lợi cuộc kháng chiến chống Pháp.',
        contentHtml:
          '<h3>Chiến thắng Điện Biên Phủ</h3><p>Mốc son chấn động địa cầu, kết thúc thắng lợi cuộc kháng chiến chống Pháp.</p>',
        locationName: 'Điện Biên',
        isManual: false,
      },
    ],
  }),

  toHtml: (block: TimelineBlockData): string => {
    const nodes = block.nodes || [];
    const nodesHtml = nodes
      .map((n) => {
        const thumbHtml = n.thumbnailUrl
          ? `<figure style="margin: 10px 0; border-radius: 10px; overflow: hidden; border: 1px solid #e7e5e4; background: #fafaf9;">
              <img src="${safeUrl(n.thumbnailUrl)}" alt="${escapeHtml(n.mediaCaption || n.title || '')}" style="width: 100%; max-height: 280px; object-fit: cover; display: block;" />
              ${n.mediaCaption ? `<figcaption style="font-size: 13px; color: #57534e; padding: 6px 10px; font-style: italic;">${escapeHtml(n.mediaCaption)}</figcaption>` : ''}
            </figure>`
          : '';

        const narrativeHtml = n.contentHtml
          ? `<div style="font-size: 15px; color: #1c1917; line-height: 1.65;">${n.contentHtml}</div>`
          : `<div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px; font-family: var(--font-merriweather), 'Noto Serif', serif;">${escapeHtml(n.title)}</div>
             <p style="font-size: 15px; color: #475569; margin: 0; line-height: 1.6;">${escapeHtml(n.description)}</p>`;

        const detailHtml = renderCollapsibleDetail(n.detailContent, 'Xem chi tiết diễn biến');
        const safeYear = escapeHtml(n.dateLabel || n.year);

        return `
        <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e7e5e4;">
          <div style="margin-bottom: 8px;">
            <span style="display: inline-block; background: #1c1917; color: #ffffff; font-family: var(--font-merriweather), 'Noto Serif', serif; font-weight: 700; font-size: 13px; padding: 3px 10px; border-radius: 6px;">${safeYear}</span>
          </div>
          ${narrativeHtml}
          ${thumbHtml}
          ${detailHtml}
        </div>`;
      })
      .join('');

    const safeTitle = escapeHtml(block.title);
    const safeSubtitle = block.subtitle ? escapeHtml(block.subtitle) : '';

    return `
      <div class="hisgo-timeline-block my-6 p-5 bg-white border border-stone-200 rounded-2xl font-sans">
        <h4 style="font-size: 20px; font-weight: 700; color: #1c1917; margin: 0 0 4px 0; font-family: var(--font-merriweather), 'Noto Serif', serif;">
          ${safeTitle}
        </h4>
        ${safeSubtitle ? `<p style="font-size: 15px; color: #57534e; margin: 0 0 16px 0;">${safeSubtitle}</p>` : ''}
        <div style="padding-left: 20px; margin: 16px 0; border-left: 2px solid #d6d3d1;">
          ${nodesHtml}
        </div>
      </div>`;
  },
};
