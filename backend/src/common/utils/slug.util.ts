/**
 * Tiện ích sinh slug (URL thân thiện) từ chuỗi tiếng Việt.
 * Hàm thuần (pure function) để dùng được cả trong NestJS lẫn script seed.
 */
const VIETNAMESE_D_PATTERN = /[đĐ]/g;
const COMBINING_MARKS_PATTERN = /[\u0300-\u036f]/g;
const NON_ALPHANUMERIC_PATTERN = /[^a-z0-9]+/g;
const EDGE_DASH_PATTERN = /^-+|-+$/g;
const SLUG_SEPARATOR = '-';

export const SLUG_MAX_LENGTH = 200;

export function toSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(COMBINING_MARKS_PATTERN, '')
    .replace(VIETNAMESE_D_PATTERN, 'd')
    .toLowerCase()
    .replace(NON_ALPHANUMERIC_PATTERN, SLUG_SEPARATOR)
    .replace(EDGE_DASH_PATTERN, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(EDGE_DASH_PATTERN, '');
}

export function withSuffix(base: string, attempt: number): string {
  return attempt <= 1 ? base : `${base}${SLUG_SEPARATOR}${attempt}`;
}
