import { LessonBlockType } from '../types/block-palette.types';
import { EventBlockData } from '../types/block-builder.types';
import { BlockPlugin, BlockWidth, escapeHtml, renderCollapsibleDetail } from './block-plugin.types';

export const eventBlockPlugin: BlockPlugin<EventBlockData> = {
  type: LessonBlockType.EVENT,

  createDefault: (id: string, defaultWidth: BlockWidth): EventBlockData => ({
    id,
    type: LessonBlockType.EVENT,
    width: defaultWidth,
    title: 'Chiến thắng Điện Biên Phủ',
    timeLocation: '07/05/1954 • Điện Biên Phủ',
    summary:
      'Chiến thắng vang dội kết thúc 9 năm kháng chiến chống Pháp, làm nên mốc son lừng lẫy năm châu, chấn động địa cầu.',
    thumbnailUrl: '',
  }),

  toHtml: (block: EventBlockData): string => {
    const safeTitle = escapeHtml(block.title);
    const safeTimeLoc = escapeHtml(block.timeLocation);
    const safeSummary = escapeHtml(block.summary);

    return `
      <div class="hisgo-event-block my-6 p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #b45309; background: #fef3c7; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 6px;">MỐC LỊCH SỬ</span>
        <h3 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; font-family: var(--font-merriweather), 'Noto Serif', serif;">${safeTitle}</h3>
        ${safeTimeLoc ? `<div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 8px;">${safeTimeLoc}</div>` : ''}
        <p style="font-size: 13px; color: #334155; line-height: 1.6; margin: 0;">${safeSummary}</p>
        ${renderCollapsibleDetail(block.detailContent)}
      </div>`;
  },
};
