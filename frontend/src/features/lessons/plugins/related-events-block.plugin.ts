import { LessonBlockType } from '../types/block-palette.types';
import { RelatedEventsBlockData } from '../types/block-builder.types';
import { BlockPlugin, BlockWidth, escapeHtml } from './block-plugin.types';

export const relatedEventsBlockPlugin: BlockPlugin<RelatedEventsBlockData> = {
  type: LessonBlockType.RELATED_EVENTS,

  createDefault: (id: string, defaultWidth: BlockWidth): RelatedEventsBlockData => ({
    id,
    type: LessonBlockType.RELATED_EVENTS,
    width: defaultWidth,
    title: 'Sự kiện liên quan',
    description: 'Các mốc chiến dịch và hội nghị lịch sử tiêu biểu',
    sourceMode: 'MANUAL',
    events: [
      { id: 'e1', title: 'Hội nghị Diên Hồng', year: 1284 },
      { id: 'e2', title: 'Đại thắng Bạch Đằng', year: 1288 },
      { id: 'e3', title: 'Hội nghị Bình Than', year: 1282 },
    ],
  }),

  toHtml: (block: RelatedEventsBlockData): string => {
    const safeTitle = escapeHtml(block.title);
    const safeDesc = block.description ? escapeHtml(block.description) : '';
    const events = block.events || [];

    const eventsHtml = events
      .map(
        (e) => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px; font-size: 12px;">
          <span style="font-weight: 600; color: #292524;">⚔️ ${escapeHtml(e.title)}</span>
          ${e.year ? `<span style="font-size: 11px; font-family: monospace; color: #b45309; font-weight: 700;">Năm ${escapeHtml(String(e.year))}</span>` : ''}
        </div>`
      )
      .join('');

    return `
      <div style="margin: 24px 0; padding: 18px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fafaf9;">
        <div style="font-size: 14px; font-weight: 700; color: #1c1917; margin-bottom: 4px;">⚔️ ${safeTitle}</div>
        ${safeDesc ? `<p style="font-size: 12px; color: #78716c; margin-top: 0; margin-bottom: 12px;">${safeDesc}</p>` : ''}
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${eventsHtml}
        </div>
      </div>`;
  },
};
