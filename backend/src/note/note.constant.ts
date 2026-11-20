/**
 * Chế độ neo vị trí ghi chú trong nội dung bài đọc.
 */
export enum NoteAnchorMode {
  INLINE = 'INLINE',
  BLOCK = 'BLOCK',
  HEADING = 'HEADING',
  INK = 'INK',
}

/**
 * Kiểu hiển thị nét đánh dấu văn bản trực tiếp (CSS Custom Highlight & Overlay).
 */
export enum NoteMarkupStyle {
  HIGHLIGHT = 'HIGHLIGHT',
  UNDERLINE = 'UNDERLINE',
  STRIKETHROUGH = 'STRIKETHROUGH',
  CIRCLE = 'CIRCLE',
  CALLOUT = 'CALLOUT',
}

/**
 * Công cụ vẽ tay tự do / điền chữ tự do neo theo khối đoạn văn.
 */
export enum NoteInkTool {
  PEN = 'PEN',
  HIGHLIGHTER = 'HIGHLIGHTER',
  TEXT = 'TEXT',
}
