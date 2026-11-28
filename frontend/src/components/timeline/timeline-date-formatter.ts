/**
 * Timeline Date Formatter Strategy
 * Chuẩn hóa các chuỗi niên đại thô (ví dụ: '2500000 TCN', '1945') thành văn phong lịch sử tiếng Việt trang nhã.
 */

const MILLION = 1_000_000;

export function formatTimelinePeriod(raw: string | undefined | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();

  // Đã có từ khóa định tính tiếng Việt ("Khoảng", "Hơn", "Trước", "Thế kỷ", "Năm")
  if (/^(khoảng|hơn|trước|thế kỷ|năm|kỷ)\b/i.test(trimmed)) {
    return trimmed;
  }

  // Dạng số nguyên lớn kèm hậu tố TCN / BC / trước CN (vd: '2500000 TCN' hoặc '2500000TCN' hoặc '1945')
  const matchBce = trimmed.match(/^(\d+)\s*(TCN|BC|trước\s*CN)?$/i);
  if (matchBce) {
    const value = parseInt(matchBce[1], 10);
    const hasSuffix = Boolean(matchBce[2]);

    if (value >= MILLION) {
      const millions = value / MILLION;
      const formattedMillions = Number.isInteger(millions)
        ? millions.toString()
        : millions.toFixed(1).replace('.', ',');
      const suffix = hasSuffix ? 'TCN' : '';
      return `Khoảng ${formattedMillions} triệu năm ${suffix}`.trim();
    }

    if (hasSuffix) {
      return `${value.toLocaleString('vi-VN')} TCN`;
    }

    // Không có hậu tố TCN: Nếu là năm dương lịch
    return `Năm ${value}`;
  }

  return trimmed;
}
