/**
 * Định dạng năm lịch sử cho CMS (trang công khai dùng `dateLabel` backend tính sẵn).
 * Quy ước toàn hệ thống: năm âm = TCN (-179 → "179 TCN"), không có năm 0.
 */
export function formatYear(year: number | null | undefined): string {
  if (year === null || year === undefined || year === 0) return '';
  return year < 0 ? `${Math.abs(year)} TCN` : String(year);
}

/** Nhãn niên đại của 1 bản ghi: ưu tiên chữ biên tập viên ghi, sau đó ghép khoảng năm. */
export function dateLabelOf(item: { dateText?: string | null; startYear?: number | null; endYear?: number | null }): string {
  if (item.dateText?.trim()) return item.dateText.trim();
  const start = formatYear(item.startYear);
  const end = formatYear(item.endYear);
  if (start && end && item.endYear !== item.startYear) return `${start} – ${end}`;
  return start || end;
}
