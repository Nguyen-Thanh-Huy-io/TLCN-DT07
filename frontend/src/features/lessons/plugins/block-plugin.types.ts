import { LessonBlockType } from '../types/block-palette.types';
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
 * Khung HTML chi tiết tự thu/mở (Details / Summary) cho các khối lịch sử
 */
export function renderCollapsibleDetail(detailContent?: string, label: string = 'Xem chi tiết'): string {
  if (!detailContent) return '';
  return `<details style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #334155; line-height: 1.6;">
    <summary style="cursor: pointer; font-weight: 600; color: #1d4ed8; list-style: none;">▸ ${escapeHtml(label)}</summary>
    <div style="margin-top: 6px;">${detailContent}</div>
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
