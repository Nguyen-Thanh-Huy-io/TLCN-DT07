/**
 * Các hàm tiện ích dùng chung (HTML sanitization, thời gian, năm lịch sử).
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

/** Bộ lọc HTML an toàn (SSR-compatible) dùng cho Rich Text. */
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

export function formatTimeAgo(isoString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  } catch {
    return 'Gần đây';
  }
}

/**
 * Định dạng năm lịch sử cho CMS (trang công khai dùng `dateLabel` backend tính sẵn).
 * Quy ước toàn hệ thống: năm âm = TCN (-179 → "179 TCN"), không có năm 0.
 */
export function formatYear(year: number | null | undefined): string {
  if (year === null || year === undefined || year === 0) return '';
  return year < 0 ? `${Math.abs(year)} TCN` : String(year);
}

/** Nhãn niên đại của 1 bản ghi: ưu tiên chữ biên tập viên ghi, sau đó ghép khoảng năm. */
export function dateLabelOf(item: {
  dateText?: string | null;
  startYear?: number | null;
  endYear?: number | null;
}): string {
  if (item.dateText?.trim()) return item.dateText.trim();
  const start = formatYear(item.startYear);
  const end = formatYear(item.endYear);
  if (start && end && item.endYear !== item.startYear) return `${start} – ${end}`;
  return start || end;
}
