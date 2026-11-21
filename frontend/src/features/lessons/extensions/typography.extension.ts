import { Extension, Mark, mergeAttributes } from '@tiptap/core';

/** Căn lề mặc định của đoạn văn — không ghi ra style khi trùng giá trị này. */
const DEFAULT_TEXT_ALIGN = 'left';
/** Giá trị bật của các thuộc tính data-* dạng cờ (data-drop-cap, data-lead-paragraph). */
const DATA_FLAG_ON = 'true';

export const LIST_NODE_TYPES = {
  BULLET: 'bulletList',
  ORDERED: 'orderedList',
} as const;

export const ListStyleType = {
  DISC: 'disc',
  CIRCLE: 'circle',
  SQUARE: 'square',
  DECIMAL: 'decimal',
  LOWER_ALPHA: 'lower-alpha',
  UPPER_ROMAN: 'upper-roman',
} as const;

export type ListStyleType = (typeof ListStyleType)[keyof typeof ListStyleType];

export interface ListStyleOption {
  value: ListStyleType;
  label: string;
  symbol: string;
}

export const BULLET_LIST_STYLE_OPTIONS: ReadonlyArray<ListStyleOption> = [
  { value: ListStyleType.DISC, label: 'Chấm tròn đặc', symbol: '•' },
  { value: ListStyleType.CIRCLE, label: 'Vòng tròn rỗng', symbol: '○' },
  { value: ListStyleType.SQUARE, label: 'Ô vuông', symbol: '▪' },
];

export const ORDERED_LIST_STYLE_OPTIONS: ReadonlyArray<ListStyleOption> = [
  { value: ListStyleType.DECIMAL, label: 'Số (1, 2, 3)', symbol: '1.' },
  { value: ListStyleType.LOWER_ALPHA, label: 'Chữ cái (a, b, c)', symbol: 'a.' },
  { value: ListStyleType.UPPER_ROMAN, label: 'La Mã (I, II, III)', symbol: 'I.' },
];

/**
 * Extension cấp độ đoạn văn (Paragraph & Heading):
 * Quản lý:
 * - Căn lề (text-align)
 * - Giãn dòng (line-height)
 * - Chữ cái đầu đoạn lớn (dropCap - Editorial Drop Cap)
 * - Đoạn dẫn nhập kiểu tạp chí (leadParagraph - Lead Paragraph)
 * - Chia cột văn bản tạp chí (textColumns - Multi-column Text: 1, 2, 3 cột)
 */
export const BlockTypographyExtension = Extension.create({
  name: 'blockTypography',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          textAlign: {
            default: DEFAULT_TEXT_ALIGN,
            parseHTML: (element) => element.style.textAlign || DEFAULT_TEXT_ALIGN,
            renderHTML: (attributes) => {
              if (!attributes.textAlign || attributes.textAlign === DEFAULT_TEXT_ALIGN) {
                return {};
              }
              return {
                style: `text-align: ${attributes.textAlign}`,
              };
            },
          },
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) {
                return {};
              }
              return {
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
          dropCap: {
            default: false,
            parseHTML: (element) =>
              element.getAttribute('data-drop-cap') === DATA_FLAG_ON ||
              element.classList.contains('editorial-drop-cap'),
            renderHTML: (attributes) => {
              if (!attributes.dropCap) {
                return {};
              }
              return {
                'data-drop-cap': DATA_FLAG_ON,
                class: 'editorial-drop-cap',
              };
            },
          },
          leadParagraph: {
            default: false,
            parseHTML: (element) =>
              element.getAttribute('data-lead-paragraph') === DATA_FLAG_ON ||
              element.classList.contains('editorial-lead-paragraph'),
            renderHTML: (attributes) => {
              if (!attributes.leadParagraph) {
                return {};
              }
              return {
                'data-lead-paragraph': DATA_FLAG_ON,
                class: 'editorial-lead-paragraph',
              };
            },
          },
          textColumns: {
            default: 1,
            parseHTML: (element) => {
              const raw = element.getAttribute('data-text-columns');
              return raw ? Number(raw) || 1 : 1;
            },
            renderHTML: (attributes) => {
              const cols = Number(attributes.textColumns) || 1;
              if (cols <= 1) {
                return {};
              }
              return {
                'data-text-columns': String(cols),
                class: `editorial-columns-${cols}`,
              };
            },
          },
        },
      },
      {
        types: [LIST_NODE_TYPES.BULLET, LIST_NODE_TYPES.ORDERED],
        attributes: {
          listStyleType: {
            default: null,
            parseHTML: (element) =>
              element.getAttribute('data-list-style') ||
              element.style.listStyleType ||
              null,
            renderHTML: (attributes) => {
              if (!attributes.listStyleType) {
                return {};
              }
              return {
                'data-list-style': String(attributes.listStyleType),
                style: `list-style-type: ${attributes.listStyleType}`,
              };
            },
          },
        },
      },
    ];
  },
});

/**
 * Mark cấp độ ký tự (Inline Typography):
 * Quản lý Phông chữ (font-family), Cỡ chữ (font-size), Màu chữ (color) và Màu nền highlight (background-color).
 */
export const InlineTypographyMark = Mark.create({
  name: 'inlineTypography',

  addAttributes() {
    return {
      fontFamily: {
        default: null,
        parseHTML: (element) => element.style.fontFamily?.replace(/['"]/g, '') || null,
        renderHTML: (attributes) => {
          if (!attributes.fontFamily) return {};
          return { style: `font-family: ${attributes.fontFamily}` };
        },
      },
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
      color: {
        default: null,
        parseHTML: (element) => element.style.color || null,
        renderHTML: (attributes) => {
          if (!attributes.color) return {};
          return { style: `color: ${attributes.color}` };
        },
      },
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || null,
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) return {};
          return {
            style: `background-color: ${attributes.backgroundColor}; padding: 0 2px; border-radius: 2px`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[style]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});
