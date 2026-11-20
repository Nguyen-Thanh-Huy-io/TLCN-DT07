import { LessonBlockType } from '../types/editor.types';
import {
  CalloutBlockData, CalloutVariant, CharacterBlockData, ComparisonTableBlockData,
  DividerBlockData, EventBlockData, HeadingBlockData, ImageBlockData, LessonBlockItem,
  MapBlockData, QuizBlockData, QuoteBlockData, RelatedEventsBlockData, RelatedPeopleBlockData,
  ResourceLinkBlockData, RowGapSize, RowLayoutPresetId, RowSectionBlockData,
  RowVerticalAlign, TextBlockData, VideoBlockData,
} from '../types/block-builder.types';
import { CALLOUT_VARIANT_OPTIONS } from '../constants/lesson.constants';
import { BlockPlugin, BlockWidth, escapeHtml, safeUrl, renderCollapsibleDetail } from './block-plugin.types';
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
export const calloutBlockPlugin: BlockPlugin<CalloutBlockData> = {
  type: LessonBlockType.CALLOUT,
  createDefault: (id: string, defaultWidth: BlockWidth): CalloutBlockData => ({
    id,
    type: LessonBlockType.CALLOUT,
    width: defaultWidth,
    variant: CalloutVariant.HISTORICAL_NOTE,
    title: 'Lưu ý từ góc nhìn Sử học',
    content:
      'Các nhà nghiên cứu lịch sử nhấn mạnh rằng mốc thời gian này có ý nghĩa chuyển hướng chiến lược toàn cục cho phong trào kháng chiến.',
  }),
  toHtml: (block: CalloutBlockData): string => {
    const variant = block.variant || CalloutVariant.HISTORICAL_NOTE;
    const meta = CALLOUT_VARIANT_OPTIONS.find((opt) => opt.variant === variant) ?? CALLOUT_VARIANT_OPTIONS[0];
    return `
      <div class="hisgo-callout ${meta.cssModifier}">
        <div class="hisgo-callout-title">
          <span>${meta.icon}</span> <span>${escapeHtml(block.title || 'Lưu ý lịch sử')}</span>
        </div>
        <div class="hisgo-callout-body">${block.content || ''}</div>
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
    const avatarHtml = block.avatarUrl ? `<img src="${safeUrl(block.avatarUrl)}" alt="${safeName}" />` : '👤';
    const bodyHtml =
      safeSummary || block.detailContent
        ? `<div class="${CHARACTER_CARD_CLASSES.BODY}">
            ${safeSummary ? `<p class="hisgo-character-summary">${safeSummary}</p>` : ''}
            ${renderCollapsibleDetail(block.detailContent)}
          </div>`
        : '';

    return `
      <div class="${CHARACTER_CARD_CLASSES.ROOT}">
        <div class="${CHARACTER_CARD_CLASSES.HEADER}">
          <div class="${CHARACTER_CARD_CLASSES.AVATAR}">${avatarHtml}</div>
          <div class="${CHARACTER_CARD_CLASSES.META}">
            <div class="hisgo-character-eyebrow">Nhân vật lịch sử</div>
            <h4 class="hisgo-character-name">${safeName}</h4>
            ${block.role ? `<div class="hisgo-character-role">${escapeHtml(block.role)}</div>` : ''}
            ${safeYears ? `<span class="hisgo-character-years">${safeYears}</span>` : ''}
          </div>
        </div>
        ${bodyHtml}
      </div>`;
  },
};

// --- comparison-table-block.plugin.ts ---
interface LegacyGenericTablePayload { title?: string; headers: unknown[]; rows: unknown[][] }

function extractLegacyGenericTable(block: ComparisonTableBlockData): LegacyGenericTablePayload | null {
  const candidate = (block as ComparisonTableBlockData & { data?: unknown }).data;
  if (!candidate || typeof candidate !== 'object') return null;
  const record = candidate as Record<string, unknown>;
  if (!Array.isArray(record.headers) || !Array.isArray(record.rows)) return null;
  return {
    title: typeof record.title === 'string' ? record.title : undefined,
    headers: record.headers,
    rows: record.rows.filter((r): r is unknown[] => Array.isArray(r)),
  };
}

export const comparisonTableBlockPlugin: BlockPlugin<ComparisonTableBlockData> = {
  type: LessonBlockType.COMPARISON_TABLE,
  createDefault: (id: string, defaultWidth: BlockWidth): ComparisonTableBlockData => ({
    id, type: LessonBlockType.COMPARISON_TABLE, width: defaultWidth,
    title: 'Bảng so sánh tương quan lực lượng',
    colAName: 'Quân đội Nhân dân Việt Nam',
    colBName: 'Quân đội Viễn chinh Pháp',
    rows: [
      { criteria: 'Quân số chủ lực', colA: 'Khoảng 55.000 quân', colB: '16.200 quân đồn trú' },
      { criteria: 'Phương châm tác chiến', colA: 'Đánh chắc, tiến chắc', colB: 'Pháo đài bất khả xâm phạm' },
    ],
  }),
  toHtml: (block: ComparisonTableBlockData): string => {
    const genericData = extractLegacyGenericTable(block);
    if (genericData) {
      const headersHtml = genericData.headers.map((h) => `<th>${escapeHtml(String(h))}</th>`).join('');
      const rowsHtml = genericData.rows
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join('')}</tr>`)
        .join('');
      const safeTitle = escapeHtml(block.title || genericData.title || 'Bảng niên biểu tư liệu');
      return `<div class="hisgo-table-wrap">${safeTitle ? `<p class="hisgo-table-title hisgo-table-title--display">${safeTitle}</p>` : ''}<table class="hisgo-table"><thead><tr>${headersHtml}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
    }
    const safeTitle = escapeHtml(block.title || 'Bảng so sánh tương quan:');
    const rowsHtml = (block.rows || [])
      .map((r) => `<tr><td><strong>${escapeHtml(r.criteria)}</strong></td><td>${escapeHtml(r.colA)}</td><td>${escapeHtml(r.colB)}</td></tr>`)
      .join('');
    return `<div class="hisgo-table-wrap"><p class="hisgo-table-title">${safeTitle}</p><table class="hisgo-table"><thead><tr><th>Tiêu chí</th><th>${escapeHtml(block.colAName)}</th><th>${escapeHtml(block.colBName)}</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
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
  toHtml: (): string => `<hr class="hisgo-divider" />`,
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
    const safeTimeLoc = escapeHtml(block.timeLocation);
    return `
      <div class="hisgo-event-block">
        <span class="hisgo-event-badge">MỐC LỊCH SỬ</span>
        <h3 class="hisgo-event-title">${escapeHtml(block.title)}</h3>
        ${safeTimeLoc ? `<div class="hisgo-event-meta">${safeTimeLoc}</div>` : ''}
        <p class="hisgo-event-summary">${escapeHtml(block.summary)}</p>
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
    return `<${tag} class="hisgo-heading">${escapeHtml(block.text)}</${tag}>`;
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
    const safeCaption = escapeHtml(block.caption);
    return `
      <figure class="hisgo-image-figure">
        <img src="${safeUrl(block.src)}" alt="${escapeHtml(block.alt)}" class="hisgo-image-img" />
        ${safeCaption ? `<figcaption class="hisgo-image-caption">${safeCaption}</figcaption>` : ''}
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
    description: 'Vị trí thung lũng lòng chảo được bao bọc bởi các dãy núi cao hiểm trở Tây Bắc, giữ vai trò yết hầu chiến lược.',
  }),
  toHtml: (block: MapBlockData): string => `
    <blockquote class="hisgo-map-block">
      <strong>🗺️ Địa bàn tác chiến:</strong> ${escapeHtml(block.locationName)}
      <p class="hisgo-map-desc">${escapeHtml(block.description)}</p>
    </blockquote>`,
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
    const prompts = questions.map((q, i) => `<li class="hisgo-quiz-item">${i + 1}. ${escapeHtml(q.prompt)}</li>`).join('');
    return `
      <div ${LESSON_QUIZ_PLACEHOLDER_ATTR}="${escapeHtml(block.id)}" class="hisgo-quiz-placeholder">
        <p class="hisgo-quiz-header">❓ ${escapeHtml(block.title || LESSON_QUIZ_DEFAULT_TITLE)} · ${questions.length} câu</p>
        <ol class="hisgo-quiz-list">${prompts}</ol>
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
    const safeSource = normalized.sourceContext ? escapeHtml(normalized.sourceContext) : '';
    return `
      <blockquote class="hisgo-quote-block">
        <p class="hisgo-quote-text">“${escapeHtml(normalized.quoteText)}”</p>
        <div class="hisgo-quote-footer">
          — <span>${escapeHtml(normalized.author)}</span>
          ${safeSource ? `<span class="hisgo-quote-source"> (${safeSource})</span>` : ''}
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
    const safeDesc = block.description ? escapeHtml(block.description) : '';
    const eventsHtml = (block.events || [])
      .map(
        (e) => `
        <div class="hisgo-related-event-row">
          <span class="hisgo-related-event-title">⚔️ ${escapeHtml(e.title)}</span>
          ${e.year ? `<span class="hisgo-related-event-year">Năm ${escapeHtml(String(e.year))}</span>` : ''}
        </div>`,
      )
      .join('');
    return `
      <div class="hisgo-related-card">
        <div class="hisgo-related-title">⚔️ ${escapeHtml(block.title)}</div>
        ${safeDesc ? `<p class="hisgo-related-desc">${safeDesc}</p>` : ''}
        <div class="hisgo-related-events-list">${eventsHtml}</div>
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
    const safeDesc = block.description ? escapeHtml(block.description) : '';
    const peopleHtml = (block.people || [])
      .map((p) => {
        const safeRole = p.role ? escapeHtml(p.role) : '';
        return `
        <div class="hisgo-related-person-chip">
          <span>👤</span> <span>${escapeHtml(p.name)}</span>
          ${safeRole ? `<span class="hisgo-related-person-role">• ${safeRole}</span>` : ''}
        </div>`;
      })
      .join('');
    return `
      <div class="hisgo-related-card">
        <div class="hisgo-related-title">👥 ${escapeHtml(block.title)}</div>
        ${safeDesc ? `<p class="hisgo-related-desc">${safeDesc}</p>` : ''}
        <div class="hisgo-related-people-list">${peopleHtml}</div>
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
    const safeNote = block.note ? escapeHtml(block.note) : '';
    return `
      <div class="hisgo-resource-link">
        <strong>📄 Sử liệu tham khảo: </strong>
        <a href="${safeUrl(block.url)}" target="_blank" rel="noreferrer" class="hisgo-resource-anchor">${escapeHtml(block.title)}</a>
        ${safeNote ? `<p class="hisgo-resource-note">${safeNote}</p>` : ''}
      </div>`;
  },
};

// --- section-row-block.plugin.ts ---
let compilerFn: (block: LessonBlockItem) => string = () => '';
export function setRowSectionCompiler(fn: (block: LessonBlockItem) => string) {
  compilerFn = fn;
}

export const sectionRowBlockPlugin: BlockPlugin<RowSectionBlockData> = {
  type: LessonBlockType.SECTION_ROW,
  createDefault: (id: string, defaultWidth: BlockWidth): RowSectionBlockData => ({
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
        id: createBlockUUID('col'),
        widthPercent: 50,
        blocks: [{ id: createBlockUUID('text'), type: LessonBlockType.TEXT, content: '<p>Nội dung trình bày ở cột bên trái...</p>' }],
      },
      {
        id: createBlockUUID('col'),
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
  }),
  toHtml: (block: RowSectionBlockData): string => RowLayoutStrategy.compileRowToHtml(block, (child) => compilerFn(child)),
};

// --- text-block.plugin.ts ---
export const textBlockPlugin: BlockPlugin<TextBlockData> = {
  type: LessonBlockType.TEXT,
  createDefault: (id: string, defaultWidth: BlockWidth): TextBlockData => ({
    id,
    type: LessonBlockType.TEXT,
    width: defaultWidth,
    content: '<h3>Đề mục nội dung mới</h3><p>Nhập nội dung văn bản chi tiết về diễn biến, phân tích hoặc đánh giá sự kiện lịch sử tại đây...</p>',
  }),
  toHtml: (block: TextBlockData): string => sanitizeRichHtml(block.content),
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
    return `
      <div class="hisgo-video-wrap">
        <iframe src="${safeUrl(block.src)}" class="hisgo-video-iframe" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
      </div>`;
  },
};
