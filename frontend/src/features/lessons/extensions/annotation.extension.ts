import { Node, mergeAttributes } from '@tiptap/core';
import Link from '@tiptap/extension-link';

export const ANNOTATION_DATA_ATTRS = {
  TOOLTIP: 'data-tooltip',
  FOOTNOTE: 'data-footnote',
} as const;

export const FOOTNOTE_NODE_NAME = 'footnote';
export const FOOTNOTE_REF_CLASS = 'lesson-footnote-ref';
const FOOTNOTE_EDITOR_MARKER = '※';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footnote: {
      insertFootnote: (note: string) => ReturnType;
    };
  }
}

/**
 * Mở rộng Link của TipTap để lưu thêm mô tả nhanh `data-tooltip` (tùy chọn).
 * Khi rê chuột ở trang đọc/xem trước, ưu tiên hiển thị `data-tooltip`, nếu trống
 * sẽ tự lấy tóm tắt từ bài viết nội bộ (`/bai-viet/<slug>`).
 */
export const WikiLinkWithTooltip = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      tooltip: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute(ANNOTATION_DATA_ATTRS.TOOLTIP) || null,
        renderHTML: (attributes) => {
          const val = typeof attributes.tooltip === 'string' ? attributes.tooltip.trim() : '';
          if (!val) return {};
          return { [ANNOTATION_DATA_ATTRS.TOOLTIP]: val };
        },
      },
    };
  },
});

/**
 * Node chú thích đánh số inline (`<sup data-footnote="...">※</sup>`).
 * Trong DB chỉ lưu nội dung chú thích; số thứ tự (1, 2, 3...) được cộng dần tự
 * động theo vị trí xuất hiện trong bài khi hiển thị ở Xem trước / Trang đọc bài.
 */
export const FootnoteNode = Node.create({
  name: FOOTNOTE_NODE_NAME,
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      note: {
        default: '',
        parseHTML: (element) =>
          element.getAttribute(ANNOTATION_DATA_ATTRS.FOOTNOTE) || '',
        renderHTML: (attributes) => ({
          [ANNOTATION_DATA_ATTRS.FOOTNOTE]:
            typeof attributes.note === 'string' ? attributes.note.trim() : '',
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: `sup[${ANNOTATION_DATA_ATTRS.FOOTNOTE}]` }];
  },

  renderHTML({ HTMLAttributes }) {
    const noteText = String(HTMLAttributes[ANNOTATION_DATA_ATTRS.FOOTNOTE] || '');
    return [
      'sup',
      mergeAttributes(
        {
          class: FOOTNOTE_REF_CLASS,
          title: noteText,
        },
        HTMLAttributes,
      ),
      FOOTNOTE_EDITOR_MARKER,
    ];
  },

  addCommands() {
    return {
      insertFootnote:
        (note: string) =>
        ({ chain }) => {
          const trimmed = note.trim();
          if (!trimmed) return false;
          return chain()
            .insertContent({
              type: this.name,
              attrs: { note: trimmed },
            })
            .run();
        },
    };
  },
});
