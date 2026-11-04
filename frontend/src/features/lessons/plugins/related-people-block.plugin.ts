import { LessonBlockType } from '../types/block-palette.types';
import { RelatedPeopleBlockData } from '../types/block-builder.types';
import { BlockPlugin, BlockWidth, escapeHtml } from './block-plugin.types';

export const relatedPeopleBlockPlugin: BlockPlugin<RelatedPeopleBlockData> = {
  type: LessonBlockType.RELATED_PEOPLE,

  createDefault: (id: string, defaultWidth: BlockWidth): RelatedPeopleBlockData => ({
    id,
    type: LessonBlockType.RELATED_PEOPLE,
    width: defaultWidth,
    title: 'Nhân vật liên quan',
    description: 'Các danh tướng, hoàng thân hoặc nhân vật lịch sử đồng hành',
    sourceMode: 'AUTO',
    people: [
      { id: 'p1', name: 'Trần Thánh Tông', role: 'Hoàng đế thứ 2 nhà Trần' },
      { id: 'p2', name: 'Trần Nhân Tông', role: 'Phật hoàng, lãnh đạo kháng chiến' },
      { id: 'p3', name: 'Yết Kiêu', role: 'Tướng cận vệ, danh tướng thủy quân' },
      { id: 'p4', name: 'Dã Tượng', role: 'Tướng tài chỉ huy tượng binh' },
    ],
  }),

  toHtml: (block: RelatedPeopleBlockData): string => {
    const safeTitle = escapeHtml(block.title);
    const safeDesc = block.description ? escapeHtml(block.description) : '';
    const people = block.people || [];

    const peopleHtml = people
      .map((p) => {
        const safeName = escapeHtml(p.name);
        const safeRole = p.role ? escapeHtml(p.role) : '';
        return `
        <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px; font-size: 12px; font-weight: 600; color: #292524;">
          <span>👤</span> <span>${safeName}</span>
          ${safeRole ? `<span style="font-size: 11px; font-weight: normal; color: #a8a29e;">• ${safeRole}</span>` : ''}
        </div>`;
      })
      .join('');

    return `
      <div style="margin: 24px 0; padding: 18px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fafaf9;">
        <div style="font-size: 14px; font-weight: 700; color: #1c1917; margin-bottom: 4px;">👥 ${safeTitle}</div>
        ${safeDesc ? `<p style="font-size: 12px; color: #78716c; margin-top: 0; margin-bottom: 12px;">${safeDesc}</p>` : ''}
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${peopleHtml}
        </div>
      </div>`;
  },
};
