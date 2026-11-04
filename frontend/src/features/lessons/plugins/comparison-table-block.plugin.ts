import { LessonBlockType } from '../types/block-palette.types';
import { ComparisonTableBlockData } from '../types/block-builder.types';
import { BlockPlugin, BlockWidth, escapeHtml } from './block-plugin.types';

export const comparisonTableBlockPlugin: BlockPlugin<ComparisonTableBlockData> = {
  type: LessonBlockType.COMPARISON_TABLE,

  createDefault: (id: string, defaultWidth: BlockWidth): ComparisonTableBlockData => ({
    id,
    type: LessonBlockType.COMPARISON_TABLE,
    width: defaultWidth,
    title: 'Bảng so sánh tương quan lực lượng',
    colAName: 'Quân đội Nhân dân Việt Nam',
    colBName: 'Quân đội Viễn chinh Pháp',
    rows: [
      {
        criteria: 'Quân số chủ lực',
        colA: 'Khoảng 55.000 quân',
        colB: '16.200 quân đồn trú',
      },
      {
        criteria: 'Phương châm tác chiến',
        colA: 'Đánh chắc, tiến chắc',
        colB: 'Pháo đài bất khả xâm phạm',
      },
    ],
  }),

  toHtml: (block: ComparisonTableBlockData): string => {
    const safeTitle = escapeHtml(block.title || 'Bảng so sánh tương quan:');
    const safeColA = escapeHtml(block.colAName);
    const safeColB = escapeHtml(block.colBName);

    const rowsHtml = (block.rows || [])
      .map(
        (r) => `
        <tr>
          <td style="padding: 10px 14px; border: 1px solid #e2e8f0;"><strong>${escapeHtml(r.criteria)}</strong></td>
          <td style="padding: 10px 14px; border: 1px solid #e2e8f0;">${escapeHtml(r.colA)}</td>
          <td style="padding: 10px 14px; border: 1px solid #e2e8f0;">${escapeHtml(r.colB)}</td>
        </tr>`
      )
      .join('');

    return `
      <div class="my-6 overflow-x-auto">
        <p style="font-weight: 700; color: #1c1917; margin-bottom: 8px;">${safeTitle}</p>
        <table style="border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13.5px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f8fafc; text-align: left; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 12px 14px;">Tiêu chí</th>
              <th style="padding: 12px 14px;">${safeColA}</th>
              <th style="padding: 12px 14px;">${safeColB}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>`;
  },
};
