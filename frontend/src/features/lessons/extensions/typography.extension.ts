import { Extension, Mark, mergeAttributes } from '@tiptap/core';

/** Căn lề mặc định của đoạn văn — không ghi ra style khi trùng giá trị này. */
const DEFAULT_TEXT_ALIGN = 'left';
/** Giá trị bật của các thuộc tính data-* dạng cờ (data-drop-cap, data-lead-paragraph). */
const DATA_FLAG_ON = 'true';

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
