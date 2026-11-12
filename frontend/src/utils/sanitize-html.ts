/**
 * Bộ lọc HTML an toàn (SSR-compatible, không phụ thuộc DOM trình duyệt)
 * dùng cho nội dung Rich Text (TipTap / Block Builder / câu dẫn Quiz).
 *
 * Loại bỏ:
 * - Các thẻ thực thi mã hoặc nhúng nguy hiểm (`script`, `object`, `embed`, `applet`, `base`, `meta`, `link`, `form`, `input`, `button`, `textarea`, `select`, `srcdoc`)
 * - Mọi thuộc tính sự kiện inline (`onerror`, `onload`, `onclick`, `onmouseover`...)
 * - Các giao thức nguy hiểm (`javascript:`, `vbscript:`, `data:text/html`) trong `href`, `src`, `xlink:href`, `action`, `formaction`
 */

const FORBIDDEN_CONTAINER_TAGS_REGEX =
  /<\s*(script|object|embed|applet|style|form|textarea|select)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;

const FORBIDDEN_STANDALONE_TAGS_REGEX =
  /<\s*\/?\s*(script|object|embed|applet|base|meta|link|form|input|button|textarea|select)\b[^>]*\/?>/gi;

const INLINE_EVENT_HANDLER_ATTR_REGEX =
  /\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+)/gi;

const SRCDOC_ATTR_REGEX =
  /\s+srcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+)/gi;

const DANGEROUS_URI_ATTR_REGEX =
  /(\s+(?:href|src|xlink:href|action|formaction)\s*=\s*)(?:"\s*(?:javascript|vbscript|data\s*:\s*text\/html)[^"]*"|'\s*(?:javascript|vbscript|data\s*:\s*text\/html)[^']*'|(?:\s*(?:javascript|vbscript|data\s*:\s*text\/html)[^\s"'=<>`]*))/gi;

export function sanitizeRichHtml(rawHtml: string | null | undefined): string {
  if (!rawHtml || typeof rawHtml !== 'string') {
    return '';
  }

  return rawHtml
    .replace(FORBIDDEN_CONTAINER_TAGS_REGEX, '')
    .replace(FORBIDDEN_STANDALONE_TAGS_REGEX, '')
    .replace(INLINE_EVENT_HANDLER_ATTR_REGEX, '')
    .replace(SRCDOC_ATTR_REGEX, '')
    .replace(DANGEROUS_URI_ATTR_REGEX, '$1"#"');
}
