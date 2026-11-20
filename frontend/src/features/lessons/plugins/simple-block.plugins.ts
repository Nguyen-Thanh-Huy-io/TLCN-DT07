import { LessonBlockType } from '../types/editor.types';
import { CalloutBlockData, CharacterBlockData, ComparisonTableBlockData, DividerBlockData, EventBlockData, HeadingBlockData, ImageBlockData, MapBlockData, QuizBlockData, QuoteBlockData, RelatedEventsBlockData, RelatedPeopleBlockData, ResourceLinkBlockData, LessonBlockItem, RowGapSize, RowLayoutPresetId, RowSectionBlockData, RowVerticalAlign, TextBlockData, VideoBlockData } from '../types/block-builder.types';
import { BLOCK_SURFACE_THEME, BlockPlugin, BlockWidth, escapeHtml, safeUrl, renderCollapsibleDetail } from './block-plugin.types';
import { SAMPLE_REMOTE_LINKS } from '@/constants/routes';
import { RowLayoutStrategy, createBlockUUID } from '../strategies/row-layout.strategy';
import { sanitizeRichHtml } from '@/utils/common';
import { createDefaultQuestion } from '../factories/quiz-question.factory';
import { QuizQuestionType } from '../types/quiz.types';
import {
  LESSON_QUIZ_DEFAULT_TITLE,
  LESSON_QUIZ_PLACEHOLDER_ATTR,
  quizBlockQuestions,
} from '../utils/lesson-quiz.util';

// --- callout-block.plugin.ts ---
const BORDER_COLORS: Record<string, string> = {
  HISTORICAL_NOTE: '#d97706',
  INFO: '#2563eb',
  WARNING: '#dc2626',
  SUCCESS: '#059669',
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
    const icon = ICONS[variant] || '📜';

    return `
      <div style="margin: 18px 0; padding: 14px 18px; background: ${BLOCK_SURFACE_THEME.BG_WHITE}; border: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL}; border-left: 4px solid ${color}; border-radius: 8px; font-family: inherit;">
        <div style="font-weight: 700; font-size: 14px; color: ${BLOCK_SURFACE_THEME.TEXT_PRIMARY}; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>${icon}</span> <span>${escapeHtml(block.title || 'Lưu ý lịch sử')}</span>
        </div>
        <div style="font-size: 13px; color: ${BLOCK_SURFACE_THEME.TEXT_SECONDARY}; line-height: 1.6;">${block.content || ''}</div>
      </div>`;
  },
};

// --- character-block.plugin.ts ---
const CHARACTER_CARD_CLASSES = {
  ROOT: 'hisgo-character-block',
  HEADER: 'hisgo-character-header',
  AVATAR: 'hisgo-character-avatar',
  META: 'hisgo-character-meta',
  BODY: 'hisgo-character-body',
} as const;

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
      <div class="${CHARACTER_CARD_CLASSES.ROOT} my-6 p-4 bg-white border border-slate-200 rounded-2xl" style="max-width: 100%; overflow-wrap: break-word;">
        <div class="${CHARACTER_CARD_CLASSES.HEADER}">
          <div class="${CHARACTER_CARD_CLASSES.AVATAR}" style="width: 48px; height: 48px; border-radius: 50%; background: ${BLOCK_SURFACE_THEME.BG_WHITE}; border: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL}; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; overflow: hidden;">
            ${avatarHtml}
          </div>
          <div class="${CHARACTER_CARD_CLASSES.META}">
            <div style="font-size: 11px; font-weight: 700; color: ${BLOCK_SURFACE_THEME.TEXT_MUTED}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">Nhân vật lịch sử</div>
            <h4 style="font-size: 16px; font-weight: 700; color: ${BLOCK_SURFACE_THEME.TEXT_PRIMARY}; margin: 0 0 4px 0; font-family: var(--font-merriweather), 'Noto Serif', serif; overflow-wrap: break-word;">${safeName}</h4>
            ${block.role ? `<div style="font-size: 12.5px; font-weight: 600; color: ${BLOCK_SURFACE_THEME.TEXT_SECONDARY}; margin-bottom: 4px; overflow-wrap: break-word;">${escapeHtml(block.role)}</div>` : ''}
            ${safeYears ? `<span style="display: inline-block; font-size: 12px; font-weight: 600; color: ${BLOCK_SURFACE_THEME.TEXT_SECONDARY}; background: ${BLOCK_SURFACE_THEME.BG_WHITE}; border: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL}; padding: 2px 8px; border-radius: 4px;">${safeYears}</span>` : ''}
          </div>
        </div>
        ${
          safeSummary || block.detailContent
            ? `<div class="${CHARACTER_CARD_CLASSES.BODY}">
                ${safeSummary ? `<p style="font-size: 13px; color: ${BLOCK_SURFACE_THEME.TEXT_SECONDARY}; margin: 0; line-height: 1.6; overflow-wrap: break-word;">${safeSummary}</p>` : ''}
                ${renderCollapsibleDetail(block.detailContent)}
              </div>`
            : ''
        }
      </div>`;
  },
};

// --- comparison-table-block.plugin.ts ---
interface LegacyGenericTablePayload {
  title?: string;
  headers: unknown[];
  rows: unknown[][];
}

function extractLegacyGenericTable(
  block: ComparisonTableBlockData,
): LegacyGenericTablePayload | null {
  const candidate = (block as ComparisonTableBlockData & { data?: unknown }).data;
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }
  const record = candidate as Record<string, unknown>;
  if (!Array.isArray(record.headers) || !Array.isArray(record.rows)) {
    return null;
  }
  return {
    title: typeof record.title === 'string' ? record.title : undefined,
    headers: record.headers,
    rows: record.rows.filter((r): r is unknown[] => Array.isArray(r)),
  };
}

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
    // Hỗ trợ bảng đa năng tổng quát (Generic Table với headers và rows)
    const genericData = extractLegacyGenericTable(block);
    if (genericData) {
      const headersHtml = genericData.headers
        .map(
          (h) =>
            `<th style="padding: 12px 14px; background: ${BLOCK_SURFACE_THEME.BG_SUBTLE_HEADER}; color: ${BLOCK_SURFACE_THEME.TEXT_PRIMARY}; font-weight: 700; border-bottom: 2px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL}; text-align: left;">${escapeHtml(
              String(h),
            )}</th>`,
        )
        .join('');

      const rowsHtml = genericData.rows
        .map(
          (row) =>
            `<tr>${row
              .map(
                (cell) =>
                  `<td style="padding: 10px 14px; border-bottom: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL}; color: ${BLOCK_SURFACE_THEME.TEXT_SECONDARY}; background: ${BLOCK_SURFACE_THEME.BG_WHITE};">${escapeHtml(
                    String(cell),
                  )}</td>`,
              )
              .join('')}</tr>`,
        )
        .join('');

      const safeTitle = escapeHtml(
        block.title || genericData.title || 'Bảng niên biểu tư liệu',
      );

      return `
        <div class="my-6 overflow-x-auto">
          ${
            safeTitle
              ? `<p style="font-weight: 700; color: ${BLOCK_SURFACE_THEME.TEXT_PRIMARY}; margin-bottom: 8px; font-family: var(--font-playfair), 'Merriweather', Georgia, serif; font-size: 1.15rem;">${safeTitle}</p>`
              : ''
          }
          <table style="border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 14px; background: ${BLOCK_SURFACE_THEME.BG_WHITE}; border: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL}; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr>${headersHtml}</tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>`;
    }

    const safeTitle = escapeHtml(block.title || 'Bảng so sánh tương quan:');
    const safeColA = escapeHtml(block.colAName);
    const safeColB = escapeHtml(block.colBName);

    const rowsHtml = (block.rows || [])
      .map(
        (r) => `
        <tr>
          <td style="padding: 10px 14px; border: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL}; background: ${BLOCK_SURFACE_THEME.BG_WHITE};"><strong>${escapeHtml(r.criteria)}</strong></td>
          <td style="padding: 10px 14px; border: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL}; background: ${BLOCK_SURFACE_THEME.BG_WHITE};">${escapeHtml(r.colA)}</td>
          <td style="padding: 10px 14px; border: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL}; background: ${BLOCK_SURFACE_THEME.BG_WHITE};">${escapeHtml(r.colB)}</td>
        </tr>`,
      )
      .join('');

    return `
      <div class="my-6 overflow-x-auto">
        <p style="font-weight: 700; color: ${BLOCK_SURFACE_THEME.TEXT_PRIMARY}; margin-bottom: 8px;">${safeTitle}</p>
        <table style="border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13.5px; background: ${BLOCK_SURFACE_THEME.BG_WHITE}; border: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL}; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: ${BLOCK_SURFACE_THEME.BG_SUBTLE_HEADER}; text-align: left; border-bottom: 2px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL};">
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

// --- divider-block.plugin.ts ---
export const dividerBlockPlugin: BlockPlugin<DividerBlockData> = {
  type: LessonBlockType.DIVIDER,

  createDefault: (id: string, defaultWidth: BlockWidth): DividerBlockData => ({
    id,
    type: LessonBlockType.DIVIDER,
    width: defaultWidth,
  }),

  toHtml: (): string => {
    return `<hr style="margin: 32px 0; border: none; border-top: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL};" />`;
  },
};

// --- event-block.plugin.ts ---
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
      <div class="hisgo-event-block my-6 p-4 bg-white border border-slate-200 rounded-2xl" style="max-width: 100%; min-width: 0; overflow-wrap: break-word;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #b45309; background: ${BLOCK_SURFACE_THEME.BG_WHITE}; border: 1px solid #fde68a; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 6px;">MỐC LỊCH SỬ</span>
        <h3 style="font-size: 18px; font-weight: 700; color: ${BLOCK_SURFACE_THEME.TEXT_PRIMARY}; margin: 0 0 4px 0; font-family: var(--font-merriweather), 'Noto Serif', serif; overflow-wrap: break-word;">${safeTitle}</h3>
        ${safeTimeLoc ? `<div style="font-size: 12px; font-weight: 600; color: ${BLOCK_SURFACE_THEME.TEXT_MUTED}; margin-bottom: 8px; overflow-wrap: break-word;">${safeTimeLoc}</div>` : ''}
        <p style="font-size: 13px; color: ${BLOCK_SURFACE_THEME.TEXT_SECONDARY}; line-height: 1.6; margin: 0; overflow-wrap: break-word;">${safeSummary}</p>
        ${renderCollapsibleDetail(block.detailContent)}
      </div>`;
  },
};

// --- heading-block.plugin.ts ---
export const headingBlockPlugin: BlockPlugin<HeadingBlockData> = {
  type: LessonBlockType.HEADING,

  createDefault: (id: string, defaultWidth: BlockWidth): HeadingBlockData => ({
    id,
    type: LessonBlockType.HEADING,
    width: defaultWidth,
    level: 2,
    text: 'Tiêu đề phân mục mới',
  }),

  toHtml: (block: HeadingBlockData): string => {
    const level = block.level && block.level >= 1 && block.level <= 6 ? block.level : 2;
    const tag = `h${level}`;
    const safeText = escapeHtml(block.text);
    return `<${tag} style="font-weight: 700; color: ${BLOCK_SURFACE_THEME.TEXT_PRIMARY}; margin: 24px 0 12px 0; font-family: var(--font-merriweather), 'Noto Serif', serif;">${safeText}</${tag}>`;
  },
};

// --- image-block.plugin.ts ---
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

// --- map-block.plugin.ts ---
export const mapBlockPlugin: BlockPlugin<MapBlockData> = {
  type: LessonBlockType.MAP,

  createDefault: (id: string, defaultWidth: BlockWidth): MapBlockData => ({
    id,
    type: LessonBlockType.MAP,
    width: defaultWidth,
    locationName: 'Thung lũng lòng chảo Điện Biên Phủ',
    description:
      'Vị trí thung lũng lòng chảo được bao bọc bởi các dãy núi cao hiểm trở Tây Bắc, giữ vai trò yết hầu chiến lược.',
  }),

  toHtml: (block: MapBlockData): string => {
    const safeLoc = escapeHtml(block.locationName);
    const safeDesc = escapeHtml(block.description);

    return `
      <blockquote class="my-4 border border-slate-200 border-l-4 border-l-emerald-600 bg-white p-3.5 rounded-r-lg text-xs text-slate-700">
        <strong>🗺️ Địa bàn tác chiến:</strong> ${safeLoc}
        <p class="mt-1 mb-0 text-slate-600">${safeDesc}</p>
      </blockquote>`;
  },
};

// --- quiz-block.plugin.ts ---
/**
 * Khối Ôn tập: HTML chỉ là chỗ giữ chỗ (câu dẫn, không đáp án); trang đọc / xem trước gắn phần làm bài
 * tương tác vào `[data-lesson-quiz]` (xem `public-curriculum/components/hub/LessonQuizIslands.tsx`).
 */
export const quizBlockPlugin: BlockPlugin<QuizBlockData> = {
  type: LessonBlockType.QUIZ,

  createDefault: (id: string, defaultWidth: BlockWidth): QuizBlockData => ({
    id,
    type: LessonBlockType.QUIZ,
    width: defaultWidth,
    title: LESSON_QUIZ_DEFAULT_TITLE,
    questions: [createDefaultQuestion(QuizQuestionType.SINGLE_CHOICE)],
  }),

  toHtml: (block: QuizBlockData): string => {
    const questions = quizBlockQuestions(block);
    const prompts = questions
      .map((q, i) => `<li style="margin: 4px 0;">${i + 1}. ${escapeHtml(q.prompt)}</li>`)
      .join('');
    return `
      <div ${LESSON_QUIZ_PLACEHOLDER_ATTR}="${escapeHtml(block.id)}" class="my-6 p-5 bg-white border border-slate-200 rounded-2xl font-sans">
        <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #b45309; margin: 0 0 6px 0;">❓ ${escapeHtml(block.title || LESSON_QUIZ_DEFAULT_TITLE)} · ${questions.length} câu</p>
        <ol style="list-style: none; padding: 0; margin: 0; font-size: 14px; color: ${BLOCK_SURFACE_THEME.TEXT_SECONDARY};">${prompts}</ol>
      </div>`;
  },
};

// --- quote-block.plugin.ts ---
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
      <blockquote style="margin: 24px 0; padding: 18px 24px; background: ${BLOCK_SURFACE_THEME.BG_WHITE}; border: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL}; border-left: 4px solid #c2410c; border-radius: 0 14px 14px 0;">
        <p style="font-family: var(--font-merriweather), 'Noto Serif', Georgia, serif; font-style: italic; font-size: 16px; color: ${BLOCK_SURFACE_THEME.TEXT_PRIMARY}; margin: 0 0 12px 0; line-height: 1.75; letter-spacing: -0.01em;">“${safeQuote}”</p>
        <div style="font-size: 13px; font-weight: 600; color: ${BLOCK_SURFACE_THEME.TEXT_SECONDARY}; text-align: right; font-family: var(--font-be-vietnam-pro), sans-serif;">
          — <span>${safeAuthor}</span>
          ${safeSource ? `<span style="font-weight: normal; color: ${BLOCK_SURFACE_THEME.TEXT_MUTED}; font-style: italic;"> (${safeSource})</span>` : ''}
        </div>
      </blockquote>`;
  },
};

// --- related-events-block.plugin.ts ---
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
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: ${BLOCK_SURFACE_THEME.BG_WHITE}; border: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL}; border-radius: 8px; font-size: 12px;">
          <span style="font-weight: 600; color: ${BLOCK_SURFACE_THEME.TEXT_PRIMARY};">⚔️ ${escapeHtml(e.title)}</span>
          ${e.year ? `<span style="font-size: 11px; font-family: monospace; color: #b45309; font-weight: 700;">Năm ${escapeHtml(String(e.year))}</span>` : ''}
        </div>`
      )
      .join('');

    return `
      <div style="margin: 24px 0; padding: 18px; border: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL}; border-radius: 12px; background: ${BLOCK_SURFACE_THEME.BG_WHITE};">
        <div style="font-size: 14px; font-weight: 700; color: ${BLOCK_SURFACE_THEME.TEXT_PRIMARY}; margin-bottom: 4px;">⚔️ ${safeTitle}</div>
        ${safeDesc ? `<p style="font-size: 12px; color: ${BLOCK_SURFACE_THEME.TEXT_MUTED}; margin-top: 0; margin-bottom: 12px;">${safeDesc}</p>` : ''}
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${eventsHtml}
        </div>
      </div>`;
  },
};

// --- related-people-block.plugin.ts ---
export const relatedPeopleBlockPlugin: BlockPlugin<RelatedPeopleBlockData> = {
  type: LessonBlockType.RELATED_PEOPLE,

  createDefault: (id: string, defaultWidth: BlockWidth): RelatedPeopleBlockData => ({
    id,
    type: LessonBlockType.RELATED_PEOPLE,
    width: defaultWidth,
    title: 'Nhân vật liên quan',
    description: 'Các danh tướng, hoàng thân hoặc nhân vật lịch sử đồng hành',
    sourceMode: 'MANUAL',
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
        <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: ${BLOCK_SURFACE_THEME.BG_WHITE}; border: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL}; border-radius: 8px; font-size: 12px; font-weight: 600; color: ${BLOCK_SURFACE_THEME.TEXT_PRIMARY};">
          <span>👤</span> <span>${safeName}</span>
          ${safeRole ? `<span style="font-size: 11px; font-weight: normal; color: ${BLOCK_SURFACE_THEME.TEXT_MUTED};">• ${safeRole}</span>` : ''}
        </div>`;
      })
      .join('');

    return `
      <div style="margin: 24px 0; padding: 18px; border: 1px solid ${BLOCK_SURFACE_THEME.BORDER_NEUTRAL}; border-radius: 12px; background: ${BLOCK_SURFACE_THEME.BG_WHITE};">
        <div style="font-size: 14px; font-weight: 700; color: ${BLOCK_SURFACE_THEME.TEXT_PRIMARY}; margin-bottom: 4px;">👥 ${safeTitle}</div>
        ${safeDesc ? `<p style="font-size: 12px; color: ${BLOCK_SURFACE_THEME.TEXT_MUTED}; margin-top: 0; margin-bottom: 12px;">${safeDesc}</p>` : ''}
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${peopleHtml}
        </div>
      </div>`;
  },
};

// --- resource-link-block.plugin.ts ---
export const resourceLinkBlockPlugin: BlockPlugin<ResourceLinkBlockData> = {
  type: LessonBlockType.RESOURCE_LINK,

  createDefault: (id: string, defaultWidth: BlockWidth): ResourceLinkBlockData => ({
    id,
    type: LessonBlockType.RESOURCE_LINK,
    width: defaultWidth,
    title: 'Đại Việt Sử Ký Toàn Thư / Lịch sử Quân sự Việt Nam',
    url: SAMPLE_REMOTE_LINKS.DIEN_BIEN_PHU_WIKI,
    note: 'Tài liệu sử liệu tham khảo chuẩn (NXB Quân đội Nhân dân).',
  }),

  toHtml: (block: ResourceLinkBlockData): string => {
    const safeHref = safeUrl(block.url);
    const safeTitle = escapeHtml(block.title);
    const safeNote = block.note ? escapeHtml(block.note) : '';

    return `
      <div class="my-4 p-3 bg-white border border-slate-200 border-l-4 border-l-blue-600 rounded-r-lg text-xs">
        <strong>📄 Sử liệu tham khảo: </strong>
        <a href="${safeHref}" target="_blank" rel="noreferrer" class="text-blue-600 font-semibold hover:underline">${safeTitle}</a>
        ${safeNote ? `<p class="text-slate-500 mt-1 mb-0">${safeNote}</p>` : ''}
      </div>`;
  },
};

// --- section-row-block.plugin.ts ---
// Lazy-resolve compiler để tránh circular dependency giữa Registry và Composite Plugin
let compilerFn: (block: LessonBlockItem) => string = () => '';
export function setRowSectionCompiler(fn: (block: LessonBlockItem) => string) {
  compilerFn = fn;
}

export const sectionRowBlockPlugin: BlockPlugin<RowSectionBlockData> = {
  type: LessonBlockType.SECTION_ROW,

  createDefault: (id: string, defaultWidth: BlockWidth): RowSectionBlockData => {
    const col1Id = createBlockUUID('col');
    const col2Id = createBlockUUID('col');

    return {
      id,
      type: LessonBlockType.SECTION_ROW,
      width: defaultWidth,
      columnCount: 2,
      layoutPreset: RowLayoutPresetId.SYMMETRIC_6_6,
      gapSize: RowGapSize.MD,
      verticalAlign: RowVerticalAlign.TOP,
      showColumnDivider: false,
      columns: [
        {
          id: col1Id,
          widthPercent: 50,
          blocks: [
            {
              id: createBlockUUID('text'),
              type: LessonBlockType.TEXT,
              content: '<p>Nội dung trình bày ở cột bên trái...</p>',
            },
          ],
        },
        {
          id: col2Id,
          widthPercent: 50,
          blocks: [
            {
              id: createBlockUUID('character'),
              type: LessonBlockType.CHARACTER,
              name: 'Tên nhân vật lịch sử',
              years: 'Niên đại hoạt động',
              summary: 'Tóm tắt vai trò và đóng góp lịch sử của nhân vật.',
              avatarUrl: '',
            },
          ],
        },
      ],
    };
  },

  toHtml: (block: RowSectionBlockData): string => {
    return RowLayoutStrategy.compileRowToHtml(block, (child) => compilerFn(child));
  },
};

// --- text-block.plugin.ts ---
export const textBlockPlugin: BlockPlugin<TextBlockData> = {
  type: LessonBlockType.TEXT,

  createDefault: (id: string, defaultWidth: BlockWidth): TextBlockData => ({
    id,
    type: LessonBlockType.TEXT,
    width: defaultWidth,
    content:
      '<h3>Đề mục nội dung mới</h3><p>Nhập nội dung văn bản chi tiết về diễn biến, phân tích hoặc đánh giá sự kiện lịch sử tại đây...</p>',
  }),

  toHtml: (block: TextBlockData): string => {
    return sanitizeRichHtml(block.content);
  },
};

// --- video-block.plugin.ts ---
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
