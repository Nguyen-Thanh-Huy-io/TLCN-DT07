import { LessonBlockType } from '../types/block-palette.types';
import { CharacterBlockData } from '../types/block-builder.types';
import { BlockPlugin, BlockWidth, safeUrl, escapeHtml, renderCollapsibleDetail } from './block-plugin.types';

export const characterBlockPlugin: BlockPlugin<CharacterBlockData> = {
  type: LessonBlockType.CHARACTER,

  createDefault: (id: string, defaultWidth: BlockWidth): CharacterBlockData => ({
    id,
    type: LessonBlockType.CHARACTER,
    width: defaultWidth,
    name: 'Đại tướng Võ Nguyên Giáp',
    years: '1911 – 2013',
    summary:
      'Tổng Tư lệnh kiêm Bí thư Đảng ủy Chiến dịch Điện Biên Phủ với quyết định lịch sử chuyển phương châm tác chiến sang "Đánh chắc tiến chắc".',
    avatarUrl: '',
  }),

  toHtml: (block: CharacterBlockData): string => {
    const safeName = escapeHtml(block.name);
    const safeYears = escapeHtml(block.years);
    const safeSummary = escapeHtml(block.summary);
    const avatarHtml = block.avatarUrl
      ? `<img src="${safeUrl(block.avatarUrl)}" alt="${safeName}" style="width: 100%; height: 100%; object-fit: cover;" />`
      : '👤';

    return `
      <div class="hisgo-character-block my-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-4">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: #ffffff; border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; overflow: hidden;">
          ${avatarHtml}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">Nhân vật lịch sử</div>
          <h4 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; font-family: var(--font-merriweather), 'Noto Serif', serif;">${safeName}</h4>
          ${safeYears ? `<span style="font-size: 12px; font-weight: 600; color: #1d4ed8; background: #eff6ff; padding: 2px 8px; border-radius: 4px;">${safeYears}</span>` : ''}
          <p style="font-size: 13px; color: #475569; margin: 8px 0 0 0; line-height: 1.6;">${safeSummary}</p>
          ${renderCollapsibleDetail(block.detailContent)}
        </div>
      </div>`;
  },
};
