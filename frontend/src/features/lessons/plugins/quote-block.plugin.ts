import { LessonBlockType } from '../types/block-palette.types';
import { QuoteBlockData } from '../types/block-builder.types';
import { BlockPlugin, BlockWidth, escapeHtml } from './block-plugin.types';

interface LegacyQuoteBlockFields {
  quote?: string;
  source?: string;
}

function normalizeQuoteFields(block: QuoteBlockData & LegacyQuoteBlockFields) {
  return {
    quoteText: block.quoteText || block.quote || '',
    author: block.author || 'Khuyết danh',
    sourceContext: block.sourceContext || block.source || '',
  };
}

export const quoteBlockPlugin: BlockPlugin<QuoteBlockData> = {
  type: LessonBlockType.QUOTE,

  createDefault: (id: string, defaultWidth: BlockWidth): QuoteBlockData => ({
    id,
    type: LessonBlockType.QUOTE,
    width: defaultWidth,
    quoteText: 'Đầu tôi chưa rơi xuống đất, xin bệ hạ đừng lo!',
    author: 'Thái sư Trần Thủ Độ',
    sourceContext: 'Kháng chiến chống Nguyên Mông lần thứ nhất (1258)',
  }),

  toHtml: (block: QuoteBlockData): string => {
    const normalized = normalizeQuoteFields(block);
    const safeQuote = escapeHtml(normalized.quoteText);
    const safeAuthor = escapeHtml(normalized.author);
    const safeSource = normalized.sourceContext
      ? escapeHtml(normalized.sourceContext)
      : '';

    return `
      <blockquote style="margin: 24px 0; padding: 18px 24px; background: #fdfaf3; border-left: 4px solid #c2410c; border-radius: 0 14px 14px 0; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
        <p style="font-family: var(--font-merriweather), 'Noto Serif', Georgia, serif; font-style: italic; font-size: 16px; color: #1c1917; margin: 0 0 12px 0; line-height: 1.75; letter-spacing: -0.01em;">“${safeQuote}”</p>
        <div style="font-size: 13px; font-weight: 600; color: #78350f; text-align: right; font-family: var(--font-be-vietnam-pro), sans-serif;">
          — <span>${safeAuthor}</span>
          ${safeSource ? `<span style="font-weight: normal; color: #9a3412; font-style: italic;"> (${safeSource})</span>` : ''}
        </div>
      </blockquote>`;
  },
};
