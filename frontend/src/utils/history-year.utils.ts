/**
 * Tiện ích Chuẩn hóa Hiển thị Niên đại Lịch sử (Historical Year Formatter)
 * Tuân thủ chuẩn Sư phạm Lịch sử Việt Nam (TCN - Trước Công nguyên) & Chuẩn quốc tế (BCE/CE).
 * Loại bỏ hoàn toàn dấu âm (-) khi hiển thị trước người dùng.
 */

export interface FormatYearOptions {
  /**
   * Hậu tố cho năm trước Công nguyên. Mặc định: 'TCN'
   */
  eraSuffix?: 'TCN' | 'Trước CN' | 'BCE';
  /**
   * Có hiển thị hậu tố CN (hoặc CE) cho năm sau Công nguyên hay không. Mặc định: false
   */
  showCeSuffix?: boolean;
}

/**
 * Định dạng một năm lịch sử đơn lẻ.
 * Ví dụ:
 *   -2000 => '2000 TCN'
 *   1975  => '1975' (hoặc '1975 CN' nếu showCeSuffix = true)
 */
export function formatHistoricalYear(
  year: number | string | null | undefined,
  options: FormatYearOptions = {},
): string {
  if (year === null || year === undefined || year === '') {
    return 'Chưa rõ';
  }

  // Nếu là chuỗi ngày tháng cụ thể (ví dụ: '13/03/1954', '1954-05-07') hoặc đã có nhãn niên đại
  if (typeof year === 'string') {
    const trimmed = year.trim();
    if (
      trimmed.includes('/') ||
      trimmed.includes('.') ||
      /TCN|BCE|CN|CE/i.test(trimmed) ||
      /^\d{4}-\d{2}-\d{2}/.test(trimmed)
    ) {
      return trimmed;
    }
  }

  const numYear = typeof year === 'number' ? year : parseInt(String(year), 10);
  if (isNaN(numYear)) {
    return String(year);
  }

  const suffix = options.eraSuffix || 'TCN';

  if (numYear < 0) {
    return `${Math.abs(numYear)} ${suffix}`;
  }

  if (numYear === 0) {
    return 'Năm 0';
  }

  return options.showCeSuffix ? `${numYear} CN` : `${numYear}`;
}

/**
 * Định dạng khoảng thời gian / niên đại lịch sử (startYear – endYear).
 * Xử lý chính xác các trường hợp giao thoa Trước/Sau Công nguyên:
 *   - (-2000, -1000) => '2000 TCN – 1000 TCN'
 *   - (-111, 40)     => '111 TCN – 40' (hoặc '111 TCN – 40 CN')
 *   - (1954, 1975)   => '1954 – 1975'
 *   - (-2000, null)  => 'Từ 2000 TCN'
 *   - (1975, null)   => 'Từ 1975'
 */
export function formatHistoricalTimeSpan(
  startYear?: number | string | null,
  endYear?: number | string | null,
  options: FormatYearOptions = {},
): string {
  if (startYear === null || startYear === undefined || startYear === '') {
    return 'Chưa xác định';
  }

  const startNum = typeof startYear === 'number' ? startYear : parseInt(String(startYear), 10);
  if (isNaN(startNum)) {
    return 'Chưa xác định';
  }

  const formattedStart = formatHistoricalYear(startNum, options);

  if (endYear === null || endYear === undefined || endYear === '') {
    return `Từ ${formattedStart}`;
  }

  const endNum = typeof endYear === 'number' ? endYear : parseInt(String(endYear), 10);
  if (isNaN(endNum)) {
    return `Từ ${formattedStart}`;
  }

  // Trường hợp cả hai cùng là năm TCN:
  // Ví dụ: 2000 TCN – 1000 TCN
  if (startNum < 0 && endNum < 0) {
    return `${formatHistoricalYear(startNum, options)} – ${formatHistoricalYear(endNum, options)}`;
  }

  // Trường hợp vắt ngang từ TCN sang CN:
  // Ví dụ: 111 TCN – 40 CN (hoặc 111 TCN – 40)
  if (startNum < 0 && endNum >= 0) {
    const formattedEnd = formatHistoricalYear(endNum, { ...options, showCeSuffix: options.showCeSuffix ?? true });
    return `${formattedStart} – ${formattedEnd}`;
  }

  // Trường hợp cả hai cùng sau Công nguyên:
  // Ví dụ: 1954 – 1975
  return `${startNum} – ${endNum}`;
}
