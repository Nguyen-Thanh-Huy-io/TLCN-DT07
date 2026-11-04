import { LessonBlockType } from '../types/block-palette.types';
import { CalloutBlockData } from '../types/block-builder.types';
import { BlockPlugin, BlockWidth, escapeHtml } from './block-plugin.types';

const BORDER_COLORS: Record<string, string> = {
  HISTORICAL_NOTE: '#d97706',
  INFO: '#2563eb',
  WARNING: '#dc2626',
  SUCCESS: '#059669',
};

const BG_COLORS: Record<string, string> = {
  HISTORICAL_NOTE: '#fef3c7',
  INFO: '#eff6ff',
  WARNING: '#fef2f2',
  SUCCESS: '#ecfdf5',
};

const ICONS: Record<string, string> = {
  HISTORICAL_NOTE: '📜',
  INFO: '💡',
  WARNING: '⚠️',
  SUCCESS: '✨',
};

export const calloutBlockPlugin: BlockPlugin<CalloutBlockData> = {
  type: LessonBlockType.CALLOUT,

  createDefault: (id: string, defaultWidth: BlockWidth): CalloutBlockData => ({
    id,
    type: LessonBlockType.CALLOUT,
    width: defaultWidth,
    variant: 'HISTORICAL_NOTE',
    title: 'Lưu ý từ góc nhìn Sử học',
    content:
      'Các nhà nghiên cứu lịch sử nhấn mạnh rằng mốc thời gian này có ý nghĩa chuyển hướng chiến lược toàn cục cho phong trào kháng chiến.',
  }),

  toHtml: (block: CalloutBlockData): string => {
    const variant = block.variant || 'HISTORICAL_NOTE';
    const color = BORDER_COLORS[variant] || '#d97706';
    const bg = BG_COLORS[variant] || '#fef3c7';
    const icon = ICONS[variant] || '📜';

    return `
      <div style="margin: 18px 0; padding: 14px 18px; background: ${bg}; border-left: 4px solid ${color}; border-radius: 8px; font-family: inherit;">
        <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>${icon}</span> <span>${escapeHtml(block.title || 'Lưu ý lịch sử')}</span>
        </div>
        <div style="font-size: 13px; color: #334155; line-height: 1.6;">${block.content || ''}</div>
      </div>`;
  },
};
