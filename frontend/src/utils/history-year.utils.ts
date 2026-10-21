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

// ============================================================================
// Strategy Pattern: Định dạng & Chuyển đổi Mốc thời gian Sự kiện Lịch sử
// ============================================================================

export enum HistoricalEra {
  CE = 'CE',   // Sau Công nguyên (Sau CN)
  BCE = 'BCE', // Trước Công nguyên (Trước CN / TCN)
}

export enum TimelineMode {
  POINT = 'POINT', // Một thời điểm (Point in time)
  RANGE = 'RANGE', // Khoảng thời gian (Range / Kéo dài)
}

export interface HistoricalDatePoint {
  day?: number | string | null;
  month?: number | string | null;
  year?: number | string | null;
  era: HistoricalEra;
}

/**
 * Chuyển đổi từ (Năm dương + Kỷ nguyên Sau CN / Trước CN) sang số nguyên có dấu (Signed Year)
 * phục vụ thuật toán sắp xếp Timeline và truy vấn Database.
 */
export function toSignedHistoricalYear(
  absYearInput: number | string | null | undefined,
  era: HistoricalEra,
): number | null {
  if (absYearInput === null || absYearInput === undefined || String(absYearInput).trim() === '') {
    return null;
  }
  const parsed = Math.abs(parseInt(String(absYearInput).trim(), 10));
  if (isNaN(parsed) || parsed === 0) {
    return null;
  }
  return era === HistoricalEra.BCE ? -parsed : parsed;
}

/**
 * Tách một số nguyên năm trong DB (ví dụ -257 hoặc 1959) thành { absYear, era }
 */
export function fromSignedHistoricalYear(signedYear?: number | null): {
  absYear: string;
  era: HistoricalEra;
} {
  if (signedYear === null || signedYear === undefined || isNaN(signedYear)) {
    return { absYear: '', era: HistoricalEra.CE };
  }
  if (signedYear < 0) {
    return { absYear: String(Math.abs(signedYear)), era: HistoricalEra.BCE };
  }
  return { absYear: String(signedYear), era: HistoricalEra.CE };
}

/**
 * Định dạng 1 mốc thời gian (Ngày/Tháng/Năm + Kỷ nguyên) thành chuỗi hiển thị chuẩn Lịch sử Việt Nam.
 * Ví dụ:
 *   - day=19, month=5, year=1959, era=CE  => "19/05/1959"
 *   - day=null, month=5, year=1959, era=CE => "05/1959"
 *   - day=null, month=null, year=257, era=BCE => "257 TCN"
 */
export function formatSingleDatePoint(point: HistoricalDatePoint): string {
  const signedYear = toSignedHistoricalYear(point.year, point.era);
  if (signedYear === null) return '';

  const absYear = Math.abs(signedYear);
  const eraSuffix = point.era === HistoricalEra.BCE ? ' TCN' : '';

  const m = point.month ? parseInt(String(point.month), 10) : null;
  const d = point.day ? parseInt(String(point.day), 10) : null;

  const validMonth = m && !isNaN(m) && m >= 1 && m <= 12 ? String(m).padStart(2, '0') : null;
  const validDay = d && !isNaN(d) && d >= 1 && d <= 31 ? String(d).padStart(2, '0') : null;

  if (validDay && validMonth) {
    return `${validDay}/${validMonth}/${absYear}${eraSuffix}`;
  }
  if (validMonth) {
    return `${validMonth}/${absYear}${eraSuffix}`;
  }
  return `${absYear}${eraSuffix}`;
}

export interface HistoricalDateFormattingStrategy {
  buildDisplayString(start: HistoricalDatePoint, end?: HistoricalDatePoint): string;
}

class PointInTimeDateStrategy implements HistoricalDateFormattingStrategy {
  buildDisplayString(start: HistoricalDatePoint): string {
    return formatSingleDatePoint(start);
  }
}

class DateRangeStrategy implements HistoricalDateFormattingStrategy {
  buildDisplayString(start: HistoricalDatePoint, end?: HistoricalDatePoint): string {
    const startStr = formatSingleDatePoint(start);
    const endStr = end ? formatSingleDatePoint(end) : '';
    if (startStr && endStr) {
      return `${startStr} – ${endStr}`;
    }
    return startStr || endStr;
  }
}

const DATE_STRATEGIES: Record<TimelineMode, HistoricalDateFormattingStrategy> = {
  [TimelineMode.POINT]: new PointInTimeDateStrategy(),
  [TimelineMode.RANGE]: new DateRangeStrategy(),
};

/**
 * Sinh chuỗi hiển thị gợi ý cho ô "Thời gian hiển thị (tự động tạo)"
 * dựa trên Kiểu mốc thời gian (Một thời điểm / Khoảng thời gian).
 */
export function buildSuggestedEventDisplayString(
  mode: TimelineMode,
  start: HistoricalDatePoint,
  end?: HistoricalDatePoint,
): string {
  const strategy = DATE_STRATEGIES[mode] || DATE_STRATEGIES[TimelineMode.POINT];
  return strategy.buildDisplayString(start, end);
}

export interface FlexibleDateParseResult {
  valid: boolean;
  error?: string;
  day: number | null;
  month: number | null;
  absYear: number | null;
  signedYear: number | null;
  era: HistoricalEra;
  displayPoint: string;
}

function getDaysInMonth(month: number, year: number): number {
  if ([4, 6, 9, 11].includes(month)) return 30;
  if (month === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return isLeap ? 29 : 28;
  }
  return 31;
}

/**
 * Phân tích chuỗi ngày tháng linh hoạt trong 1 ô input duy nhất:
 * Hỗ trợ:
 *   - "DD/MM/YYYY" (VD: "19/05/1959" hoặc "2/9/1945")
 *   - "MM/YYYY"    (VD: "05/1959")
 *   - "YYYY"       (VD: "1959" hoặc "257")
 * Kết hợp với checkbox `isBce` (Trước CN - TCN).
 */
export function parseFlexibleHistoricalDate(
  rawInput: string,
  isBce: boolean,
): FlexibleDateParseResult {
  const trimmed = (rawInput || '').trim();
  const era = isBce ? HistoricalEra.BCE : HistoricalEra.CE;

  if (!trimmed) {
    return {
      valid: false,
      day: null,
      month: null,
      absYear: null,
      signedYear: null,
      era,
      displayPoint: '',
    };
  }

  // Cho phép phân cách bằng '/' hoặc '-' hoặc '.'
  const normalized = trimmed.replace(/[.-]/g, '/');
  const parts = normalized.split('/').map((p) => p.trim());

  let day: number | null = null;
  let month: number | null = null;
  let absYear: number | null = null;

  if (parts.length === 1) {
    // Định dạng YYYY
    if (!/^\d{1,4}$/.test(parts[0])) {
      return {
        valid: false,
        error: 'Định dạng không hợp lệ. Nhập DD/MM/YYYY, MM/YYYY hoặc YYYY.',
        day: null,
        month: null,
        absYear: null,
        signedYear: null,
        era,
        displayPoint: '',
      };
    }
    absYear = parseInt(parts[0], 10);
  } else if (parts.length === 2) {
    // Định dạng MM/YYYY
    if (!/^\d{1,2}$/.test(parts[0]) || !/^\d{1,4}$/.test(parts[1])) {
      return {
        valid: false,
        error: 'Định dạng MM/YYYY không hợp lệ (VD: 05/1959).',
        day: null,
        month: null,
        absYear: null,
        signedYear: null,
        era,
        displayPoint: '',
      };
    }
    month = parseInt(parts[0], 10);
    absYear = parseInt(parts[1], 10);
  } else if (parts.length === 3) {
    // Định dạng DD/MM/YYYY
    if (
      !/^\d{1,2}$/.test(parts[0]) ||
      !/^\d{1,2}$/.test(parts[1]) ||
      !/^\d{1,4}$/.test(parts[2])
    ) {
      return {
        valid: false,
        error: 'Định dạng DD/MM/YYYY không hợp lệ (VD: 19/05/1959).',
        day: null,
        month: null,
        absYear: null,
        signedYear: null,
        era,
        displayPoint: '',
      };
    }
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    absYear = parseInt(parts[2], 10);
  } else {
    return {
      valid: false,
      error: 'Định dạng không hợp lệ. Nhập DD/MM/YYYY hoặc YYYY.',
      day: null,
      month: null,
      absYear: null,
      signedYear: null,
      era,
      displayPoint: '',
    };
  }

  if (!absYear || absYear <= 0) {
    return {
      valid: false,
      error: 'Năm phải lớn hơn 0.',
      day: null,
      month: null,
      absYear: null,
      signedYear: null,
      era,
      displayPoint: '',
    };
  }

  if (month !== null && (month < 1 || month > 12)) {
    return {
      valid: false,
      error: 'Tháng phải từ 01 đến 12.',
      day,
      month,
      absYear,
      signedYear: null,
      era,
      displayPoint: '',
    };
  }

  if (day !== null && month !== null) {
    const maxDay = getDaysInMonth(month, absYear);
    if (day < 1 || day > maxDay) {
      return {
        valid: false,
        error: `Ngày không hợp lệ (Tháng ${month}/${absYear} tối đa ${maxDay} ngày).`,
        day,
        month,
        absYear,
        signedYear: null,
        era,
        displayPoint: '',
      };
    }
  }

  const signedYear = isBce ? -absYear : absYear;
  const displayPoint = formatSingleDatePoint({
    day,
    month,
    year: absYear,
    era,
  });

  return {
    valid: true,
    day,
    month,
    absYear,
    signedYear,
    era,
    displayPoint,
  };
}

/**
 * Chuyển dữ liệu từ DB (signedYear, month, day) ngược lại chuỗi hiển thị trong ô input linh hoạt
 */
export function formatRecordToFlexibleDateInput(
  signedYear?: number | null,
  month?: number | null,
  day?: number | null,
): { text: string; isBce: boolean } {
  if (signedYear === null || signedYear === undefined || isNaN(signedYear)) {
    return { text: '', isBce: false };
  }
  const isBce = signedYear < 0;
  const absYear = Math.abs(signedYear);

  if (day && month) {
    return {
      text: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${absYear}`,
      isBce,
    };
  }
  if (month) {
    return {
      text: `${String(month).padStart(2, '0')}/${absYear}`,
      isBce,
    };
  }
  return {
    text: String(absYear),
    isBce,
  };
}


