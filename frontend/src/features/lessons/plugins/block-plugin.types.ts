import { LessonBlockType } from '../types/editor.types';
import { LessonBlockItem, BlockWidthType } from '../types/block-builder.types';

/**
 * Hàm escape ký tự đặc biệt chống tấn công XSS (Cross-Site Scripting)
 * khi người dùng nhập dữ liệu văn bản thuần (Text, Title, Name, Author...).
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Kiểm tra và chuẩn hóa URL an toàn, ngăn chặn các tấn công `javascript:` hoặc data URLs nguy hiểm.
 */
export function safeUrl(url: string | null | undefined): string {
  if (!url) return '#';
  const trimmed = url.trim();
  if (/^(?:https?:|\/|#)/i.test(trimmed)) {
    return escapeHtml(trimmed);
  }
  return '#';
}

/**
 * Khung HTML chi tiết tự thu/mở (Details / Summary) dùng semantic classes chuẩn `lesson-blocks.css`
 */
export function renderCollapsibleDetail(detailContent?: string, label: string = 'Xem chi tiết'): string {
  if (!detailContent) return '';
  return `<details class="hisgo-detail">
    <summary class="hisgo-detail-summary">▸ ${escapeHtml(label)}</summary>
    <div class="hisgo-detail-body">${detailContent}</div>
  </details>`;
}

export type BlockWidth = BlockWidthType | undefined;

/**
 * Plugin Contract theo Open/Closed Principle (OCP):
 * Mỗi loại khối tự quản lý việc sinh dữ liệu mặc định và biên dịch ra Presentation HTML.
 */
export interface BlockPlugin<T extends LessonBlockItem = LessonBlockItem> {
  readonly type: LessonBlockType;
  createDefault: (id: string, defaultWidth: BlockWidth) => T;
  toHtml: (block: T) => string;
}
