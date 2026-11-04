import { BadRequestException } from '@nestjs/common';
import { DatePrecision } from '@prisma/client';

export interface ParsedHistoricalDateRange {
  dateText: string | null;
  startYear: number | null;
  startMonth: number | null;
  startDay: number | null;
  endYear: number | null;
  endMonth: number | null;
  endDay: number | null;
  datePrecision: DatePrecision;
}

export interface ParsedSingleHistoricalDate {
  dateText: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  precision: DatePrecision;
}

export interface IHistoricalDateParseStrategy {
  readonly name: string;
  tryParse(normalizedInput: string, rawText: string): ParsedHistoricalDateRange | null;
}

export const HISTORICAL_DATE_CONSTANTS = {
  BCE_SUFFIX: 'TCN',
  CE_SUFFIX: 'SCN',
  YEAR_ZERO_ERROR:
    'Quy ước lịch sử TCN/SCN không có năm 0 (sử dụng -1 cho 1 TCN và 1 cho 1 SCN).',
  INVALID_RANGE_ERROR:
    'Năm kết thúc phải lớn hơn hoặc bằng năm bắt đầu theo trục thời gian TCN/SCN.',
} as const;

const ROMAN_NUMERAL_VALUES: Readonly<Record<string, number>> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
};

/**
 * Chuyển số La Mã (I..XXX) sang số nguyên dương.
 */
export function parseRomanNumeral(roman: string): number | null {
  const cleaned = roman.trim().toUpperCase();
  if (!cleaned || !/^[IVXLC]+$/.test(cleaned)) {
    return null;
  }
  let total = 0;
  let prev = 0;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    const current = ROMAN_NUMERAL_VALUES[cleaned[i]];
    if (!current) return null;
    if (current < prev) {
      total -= current;
    } else {
      total += current;
      prev = current;
    }
  }
  return total > 0 ? total : null;
}

/**
 * Chuyển chuỗi năm kèm nhãn TCN/SCN về số nguyên theo quy ước:
 * -100 = 100 TCN, -1 = 1 TCN, 1 = 1 SCN (Không có năm 0).
 */
export function toSignedHistoricalYear(
  rawYear: string | number,
  eraMarker?: string | null,
  fallbackIsBce = false,
): number | null {
  const numericYear =
    typeof rawYear === 'number' ? rawYear : Number.parseInt(String(rawYear).trim(), 10);

  if (!Number.isFinite(numericYear) || numericYear === 0) {
    return null;
  }

  if (numericYear < 0) {
    return numericYear;
  }

  const normalizedEra = (eraMarker || '').trim().toUpperCase();
  const isBce =
    normalizedEra.includes(HISTORICAL_DATE_CONSTANTS.BCE_SUFFIX) ||
    normalizedEra === 'BC' ||
    normalizedEra === 'BCE' ||
    (!normalizedEra && fallbackIsBce);

  return isBce ? -Math.abs(numericYear) : Math.abs(numericYear);
}

/**
 * Tính khoảng năm của một Thế kỷ theo quy ước lịch sử (không suy diễn ngày/tháng):
 * - Thế kỷ X (10 SCN): 901 -> 1000
 * - Thế kỷ I (1 SCN): 1 -> 100
 * - Thế kỷ I TCN (1 TCN): -100 -> -1
 * - Thế kỷ VII TCN (7 TCN): -700 -> -601
 */
export function getCenturyYearBounds(
  centuryNumber: number,
  isBce: boolean,
): { startYear: number; endYear: number } | null {
  if (!Number.isInteger(centuryNumber) || centuryNumber <= 0) {
    return null;
  }
  if (isBce) {
    return {
      startYear: -(centuryNumber * 100),
      endYear: -((centuryNumber - 1) * 100 + 1),
    };
  }
  return {
    startYear: (centuryNumber - 1) * 100 + 1,
    endYear: centuryNumber * 100,
  };
}

/**
 * Kiểm tra năm hợp lệ theo quy ước TCN/SCN (Không tồn tại năm 0).
 */
export function validateHistoricalYear(
  year: number | null | undefined,
): void {
  if (year === 0) {
    throw new BadRequestException(HISTORICAL_DATE_CONSTANTS.YEAR_ZERO_ERROR);
  }
}

/**
 * Kiểm tra khoảng năm hợp lệ theo quy ước TCN/SCN.
 */
export function validateHistoricalYearRange(
  startYear?: number | null,
  endYear?: number | null,
  customRangeErrorMessage?: string,
): void {
  validateHistoricalYear(startYear);
  validateHistoricalYear(endYear);

  if (
    startYear !== undefined &&
    startYear !== null &&
    endYear !== undefined &&
    endYear !== null &&
    endYear < startYear
  ) {
    throw new BadRequestException(
      customRangeErrorMessage || HISTORICAL_DATE_CONSTANTS.INVALID_RANGE_ERROR,
    );
  }
}

/**
 * Tính độ dài số năm giữa 2 mốc lịch sử có xét đến việc không có năm 0 khi đi từ TCN sang SCN.
 */
export function calculateHistoricalYearSpan(
  startYear: number,
  endYear: number,
): number {
  validateHistoricalYearRange(startYear, endYear);
  if (startYear < 0 && endYear > 0) {
    return endYear - startYear - 1;
  }
  return endYear - startYear;
}

/**
 * Hàm so sánh thứ tự thời gian (Chronological Comparator) phục vụ sắp xếp Sự kiện / Thời kỳ / Thực thể.
 * Dữ liệu chưa rõ năm (null) được xếp xuống cuối.
 */
export function compareHistoricalDates(
  a: {
    startYear?: number | null;
    startMonth?: number | null;
    startDay?: number | null;
  },
  b: {
    startYear?: number | null;
    startMonth?: number | null;
    startDay?: number | null;
  },
): number {
  const aYear = a.startYear ?? null;
  const bYear = b.startYear ?? null;

  if (aYear === null && bYear === null) return 0;
  if (aYear === null) return 1;
  if (bYear === null) return -1;
  if (aYear !== bYear) return aYear - bYear;

  const aMonth = a.startMonth ?? 13;
  const bMonth = b.startMonth ?? 13;
  if (aMonth !== bMonth) return aMonth - bMonth;

  const aDay = a.startDay ?? 32;
  const bDay = b.startDay ?? 32;
  return aDay - bDay;
}

/**
 * Định dạng năm số nguyên sang chuỗi hiển thị tiếng Việt (VD: -179 -> "179 TCN", 938 -> "938").
 */
export function formatHistoricalYear(
  year: number | null | undefined,
  includeCeSuffix = false,
): string {
  if (year === null || year === undefined || year === 0) return '';
  if (year < 0) {
    return `${Math.abs(year)} ${HISTORICAL_DATE_CONSTANTS.BCE_SUFFIX}`;
  }
  return includeCeSuffix
    ? `${year} ${HISTORICAL_DATE_CONSTANTS.CE_SUFFIX}`
    : `${year}`;
}

function isValidDayAndMonth(day: number, month: number): boolean {
  return (
    Number.isInteger(day) &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31
  );
}

/**
 * Strategy 1: Khoảng ngày cụ thể (VD: "19/05/1959 – 30/04/1975", "18/12 - 29/12/1972", "Từ 13/3/1954 đến 7/5/1954")
 */
class ExactDayRangeParseStrategy implements IHistoricalDateParseStrategy {
  readonly name = 'ExactDayRangeParseStrategy';

  tryParse(normalizedInput: string, rawText: string): ParsedHistoricalDateRange | null {
    // Dạng đầy đủ cả 2 đầu: dd/mm/yyyy - dd/mm/yyyy
    const fullRangeRegex =
      /(?:từ\s+|đêm\s+|ngày\s+)?(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{1,4})\s*(?:–|—|-|đến|tới)\s*(?:đêm\s+|ngày\s+)?(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{1,4})(?:\s*(TCN|SCN|BC|BCE|AD|CE))?/i;
    const fullMatch = normalizedInput.match(fullRangeRegex);
    if (fullMatch) {
      const startDay = Number.parseInt(fullMatch[1], 10);
      const startMonth = Number.parseInt(fullMatch[2], 10);
      const endDay = Number.parseInt(fullMatch[4], 10);
      const endMonth = Number.parseInt(fullMatch[5], 10);
      const endYear = toSignedHistoricalYear(fullMatch[6], fullMatch[7]);
      const startYear = toSignedHistoricalYear(
        fullMatch[3],
        fullMatch[7],
        endYear !== null && endYear < 0,
      );

      if (
        startYear !== null &&
        endYear !== null &&
        isValidDayAndMonth(startDay, startMonth) &&
        isValidDayAndMonth(endDay, endMonth)
      ) {
        return {
          dateText: rawText,
          startYear,
          startMonth,
          startDay,
          endYear,
          endMonth,
          endDay,
          datePrecision: DatePrecision.DAY,
        };
      }
    }

    // Dạng cùng năm: dd/mm - dd/mm/yyyy (VD: "18/12 – 29/12/1972")
    const sameYearRangeRegex =
      /(?:từ\s+|đêm\s+|ngày\s+)?(\d{1,2})[\/.-](\d{1,2})\s*(?:–|—|-|đến|tới)\s*(?:đêm\s+|ngày\s+)?(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{1,4})(?:\s*(TCN|SCN|BC|BCE|AD|CE))?/i;
    const sameYearMatch = normalizedInput.match(sameYearRangeRegex);
    if (sameYearMatch) {
      const startDay = Number.parseInt(sameYearMatch[1], 10);
      const startMonth = Number.parseInt(sameYearMatch[2], 10);
      const endDay = Number.parseInt(sameYearMatch[3], 10);
      const endMonth = Number.parseInt(sameYearMatch[4], 10);
      const sharedYear = toSignedHistoricalYear(sameYearMatch[5], sameYearMatch[6]);

      if (
        sharedYear !== null &&
        isValidDayAndMonth(startDay, startMonth) &&
        isValidDayAndMonth(endDay, endMonth)
      ) {
        return {
          dateText: rawText,
          startYear: sharedYear,
          startMonth,
          startDay,
          endYear: sharedYear,
          endMonth,
          endDay,
          datePrecision: DatePrecision.DAY,
        };
      }
    }

    return null;
  }
}

/**
 * Strategy 2: Một ngày cụ thể (VD: "Đêm 18/12/1972", "Ngày 2/9/1969", "Ngày 30 tháng 4 năm 1975")
 */
class ExactSingleDayParseStrategy implements IHistoricalDateParseStrategy {
  readonly name = 'ExactSingleDayParseStrategy';

  tryParse(normalizedInput: string, rawText: string): ParsedHistoricalDateRange | null {
    // Dạng chữ tiếng Việt: "Ngày 2 tháng 9 năm 1945"
    const vnTextDayRegex =
      /ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{1,4})(?:\s*(TCN|SCN|BC|BCE|AD|CE))?/i;
    const vnMatch = normalizedInput.match(vnTextDayRegex);
    if (vnMatch) {
      const day = Number.parseInt(vnMatch[1], 10);
      const month = Number.parseInt(vnMatch[2], 10);
      const year = toSignedHistoricalYear(vnMatch[3], vnMatch[4]);
      if (year !== null && isValidDayAndMonth(day, month)) {
        return {
          dateText: rawText,
          startYear: year,
          startMonth: month,
          startDay: day,
          endYear: null,
          endMonth: null,
          endDay: null,
          datePrecision: DatePrecision.DAY,
        };
      }
    }

    // Dạng dd/mm/yyyy (VD: "Đêm 18/12/1972", "Ngày 2/9/1969", "02/09/1945")
    const slashDayRegex =
      /(?:^|\s|ngày\s+|đêm\s+|sáng\s+|chiều\s+|rạng\s+sáng\s+)(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{1,4})(?:\s*(TCN|SCN|BC|BCE|AD|CE))?(?:\s|$)/i;
    const slashMatch = normalizedInput.match(slashDayRegex);
    if (slashMatch) {
      const day = Number.parseInt(slashMatch[1], 10);
      const month = Number.parseInt(slashMatch[2], 10);
      const year = toSignedHistoricalYear(slashMatch[3], slashMatch[4]);
      if (year !== null && isValidDayAndMonth(day, month)) {
        return {
          dateText: rawText,
          startYear: year,
          startMonth: month,
          startDay: day,
          endYear: null,
          endMonth: null,
          endDay: null,
          datePrecision: DatePrecision.DAY,
        };
      }
    }

    return null;
  }
}

/**
 * Strategy 3: Độ chính xác theo Tháng (VD: "Tháng 8/1945", "Tháng 8 năm 1945", "08/1945", "Tháng 5/1954 – Tháng 7/1954")
 * Tuyệt đối không tự suy diễn ra ngày cụ thể (startDay = null, endDay = null).
 */
class MonthYearParseStrategy implements IHistoricalDateParseStrategy {
  readonly name = 'MonthYearParseStrategy';

  tryParse(normalizedInput: string, rawText: string): ParsedHistoricalDateRange | null {
    // Khoảng tháng-năm: "Tháng 5/1954 - Tháng 7/1954" hoặc "05/1954 - 07/1954"
    const monthRangeRegex =
      /^(?:tháng\s*)?(\d{1,2})\s*(?:\/|-|\s+năm\s+)\s*(\d{1,4})\s*(?:–|—|-|đến|tới)\s*(?:tháng\s*)?(\d{1,2})\s*(?:\/|-|\s+năm\s+)\s*(\d{1,4})(?:\s*(TCN|SCN|BC|BCE|AD|CE))?$/i;
    const rangeMatch = normalizedInput.match(monthRangeRegex);
    if (rangeMatch) {
      const startMonth = Number.parseInt(rangeMatch[1], 10);
      const endMonth = Number.parseInt(rangeMatch[3], 10);
      const endYear = toSignedHistoricalYear(rangeMatch[4], rangeMatch[5]);
      const startYear = toSignedHistoricalYear(
        rangeMatch[2],
        rangeMatch[5],
        endYear !== null && endYear < 0,
      );

      if (
        startYear !== null &&
        endYear !== null &&
        startMonth >= 1 &&
        startMonth <= 12 &&
        endMonth >= 1 &&
        endMonth <= 12
      ) {
        return {
          dateText: rawText,
          startYear,
          startMonth,
          startDay: null,
          endYear,
          endMonth,
          endDay: null,
          datePrecision: DatePrecision.MONTH,
        };
      }
    }

    // Một tháng-năm: "Tháng 8/1945", "Tháng 8 năm 1945", "Cuối tháng 12/1972", "08/1945"
    const singleMonthRegex =
      /^(?:đầu\s+|giữa\s+|cuối\s+)?(?:tháng\s+)(\d{1,2})\s*(?:\/|-|\s+năm\s+)\s*(\d{1,4})(?:\s*(TCN|SCN|BC|BCE|AD|CE))?$/i;
    const singleMatch = normalizedInput.match(singleMonthRegex);
    if (singleMatch) {
      const month = Number.parseInt(singleMatch[1], 10);
      const year = toSignedHistoricalYear(singleMatch[2], singleMatch[3]);
      if (year !== null && month >= 1 && month <= 12) {
        return {
          dateText: rawText,
          startYear: year,
          startMonth: month,
          startDay: null,
          endYear: null,
          endMonth: null,
          endDay: null,
          datePrecision: DatePrecision.MONTH,
        };
      }
    }

    // Dạng ngắn gọn MM/YYYY (VD: "08/1945")
    const shortMonthRegex = /^(\d{1,2})\/(\d{3,4})(?:\s*(TCN|SCN|BC|BCE|AD|CE))?$/i;
    const shortMatch = normalizedInput.match(shortMonthRegex);
    if (shortMatch) {
      const month = Number.parseInt(shortMatch[1], 10);
      const year = toSignedHistoricalYear(shortMatch[2], shortMatch[3]);
      if (year !== null && month >= 1 && month <= 12) {
        return {
          dateText: rawText,
          startYear: year,
          startMonth: month,
          startDay: null,
          endYear: null,
          endMonth: null,
          endDay: null,
          datePrecision: DatePrecision.MONTH,
        };
      }
    }

    return null;
  }
}

/**
 * Strategy 4: Thế kỷ (VD: "Thế kỷ X", "Thế kỷ VII TCN", "Thế kỷ VII TCN - Thế kỷ II TCN", "Thế kỷ 10")
 * Xác định khoảng năm theo quy ước lịch sử để query/sort nhưng BẮT BUỘC giữ datePrecision = CENTURY,
 * tuyệt đối không biến thành một ngày hay tháng cụ thể.
 */
class CenturyParseStrategy implements IHistoricalDateParseStrategy {
  readonly name = 'CenturyParseStrategy';

  private parseCenturyToken(token: string, fallbackBce = false): {
    century: number;
    isBce: boolean;
  } | null {
    const cleaned = token
      .replace(/^[(\s]+|[)\s]+$/g, '')
      .replace(/^(?:đầu|giữa|cuối|nửa\s+đầu|nửa\s+cuối)\s+/i, '')
      .trim();

    const match = cleaned.match(
      /^(?:thế\s*kỷ|tk)\s+([IVXLC]+|\d{1,2})(?:\s*(TCN|SCN|BC|BCE|AD|CE))?$/i,
    );
    if (!match) return null;

    const rawNum = match[1];
    const century = /^\d+$/.test(rawNum)
      ? Number.parseInt(rawNum, 10)
      : parseRomanNumeral(rawNum);

    if (!century || century <= 0) return null;

    const eraText = (match[2] || '').trim().toUpperCase();
    const isBce =
      eraText.includes(HISTORICAL_DATE_CONSTANTS.BCE_SUFFIX) ||
      eraText === 'BC' ||
      eraText === 'BCE' ||
      (!eraText && fallbackBce);

    return { century, isBce };
  }

  tryParse(normalizedInput: string, rawText: string): ParsedHistoricalDateRange | null {
    const stripped = normalizedInput.replace(/^[(\s]+|[)\s]+$/g, '');

    // Khoảng giữa 2 thế kỷ: "Thế kỷ VII TCN - Thế kỷ II TCN" hoặc "Thế kỷ X – Thế kỷ XV"
    const parts = stripped.split(/\s*(?:–|—|-|đến|tới)\s*/i);
    if (parts.length === 2) {
      const rightToken = this.parseCenturyToken(parts[1]);
      if (rightToken) {
        const leftToken = this.parseCenturyToken(parts[0], rightToken.isBce);
        if (leftToken) {
          const leftBounds = getCenturyYearBounds(
            leftToken.century,
            leftToken.isBce,
          );
          const rightBounds = getCenturyYearBounds(
            rightToken.century,
            rightToken.isBce,
          );
          if (leftBounds && rightBounds) {
            return {
              dateText: rawText,
              startYear: leftBounds.startYear,
              startMonth: null,
              startDay: null,
              endYear: rightBounds.endYear,
              endMonth: null,
              endDay: null,
              datePrecision: DatePrecision.CENTURY,
            };
          }
        }
      }
    }

    // Một thế kỷ đơn: "Thế kỷ X", "Thế kỷ VII TCN", "Đầu thế kỷ XX"
    const singleCentury = this.parseCenturyToken(stripped);
    if (singleCentury) {
      const bounds = getCenturyYearBounds(
        singleCentury.century,
        singleCentury.isBce,
      );
      if (bounds) {
        return {
          dateText: rawText,
          startYear: bounds.startYear,
          startMonth: null,
          startDay: null,
          endYear: bounds.endYear,
          endMonth: null,
          endDay: null,
          datePrecision: DatePrecision.CENTURY,
        };
      }
    }

    return null;
  }
}

/**
 * Strategy 5: Thập niên (VD: "Thập niên 1960", "Những năm 1930")
 * Giữ datePrecision = DECADE và gán khoảng năm [decade, decade + 9].
 */
class DecadeParseStrategy implements IHistoricalDateParseStrategy {
  readonly name = 'DecadeParseStrategy';

  tryParse(normalizedInput: string, rawText: string): ParsedHistoricalDateRange | null {
    const decadeRegex =
      /^(?:thập\s*niên|những\s*năm)\s+(\d{3,4})s?(?:\s*(TCN|SCN|BC|BCE|AD|CE))?$/i;
    const match = normalizedInput.match(decadeRegex);
    if (!match) return null;

    const baseYear = toSignedHistoricalYear(match[1], match[2]);
    if (baseYear === null) return null;

    const startYear = baseYear < 0 ? baseYear - 9 : baseYear;
    const endYear = baseYear < 0 ? baseYear : baseYear + 9;

    return {
      dateText: rawText,
      startYear,
      startMonth: null,
      startDay: null,
      endYear,
      endMonth: null,
      endDay: null,
      datePrecision: DatePrecision.DECADE,
    };
  }
}

/**
 * Strategy 6: Khoảng năm (VD: "179 TCN – 40 SCN", "1009–1225", "257 TCN - 208 TCN")
 */
class YearRangeParseStrategy implements IHistoricalDateParseStrategy {
  readonly name = 'YearRangeParseStrategy';

  tryParse(normalizedInput: string, rawText: string): ParsedHistoricalDateRange | null {
    const stripped = normalizedInput.replace(/^[(\s]+|[)\s]+$/g, '');
    const isApproximate = /^(?:khoảng|ước\s*khoảng|xấp\s*xỉ)\s+/i.test(stripped);
    const body = stripped.replace(
      /^(?:khoảng|ước\s*khoảng|xấp\s*xỉ)?\s*(?:từ\s*)?(?:năm\s*)?/i,
      '',
    );

    const rangeRegex =
      /^(-?\d{1,4})(?:\s*(TCN|SCN|BC|BCE|AD|CE))?\s*(?:–|—|-|đến|tới)\s*(?:năm\s*)?(-?\d{1,4})(?:\s*(TCN|SCN|BC|BCE|AD|CE))?$/i;
    const match = body.match(rangeRegex);
    if (!match) return null;

    const endYear = toSignedHistoricalYear(match[3], match[4]);
    const startYear = toSignedHistoricalYear(
      match[1],
      match[2],
      // Nếu vế đầu không ghi rõ TCN/SCN mà vế sau là TCN (ví dụ "257 - 208 TCN"), tự kế thừa TCN
      !match[2] && endYear !== null && endYear < 0,
    );

    if (startYear === null || endYear === null) return null;

    return {
      dateText: rawText,
      startYear,
      startMonth: null,
      startDay: null,
      endYear,
      endMonth: null,
      endDay: null,
      datePrecision: isApproximate ? DatePrecision.APPROXIMATE : DatePrecision.RANGE,
    };
  }
}

/**
 * Strategy 7: Năm ước lượng / xấp xỉ (VD: "Khoảng năm 1228", "Khoảng 257 TCN", "~1228")
 */
class ApproximateYearParseStrategy implements IHistoricalDateParseStrategy {
  readonly name = 'ApproximateYearParseStrategy';

  tryParse(normalizedInput: string, rawText: string): ParsedHistoricalDateRange | null {
    const approxRegex =
      /^(?:khoảng|ước\s*khoảng|xấp\s*xỉ|~|c\.)\s*(?:năm\s*)?(-?\d{1,4})(?:\s*(TCN|SCN|BC|BCE|AD|CE))?$/i;
    const match = normalizedInput.match(approxRegex);
    if (!match) return null;

    const year = toSignedHistoricalYear(match[1], match[2]);
    if (year === null) return null;

    return {
      dateText: rawText,
      startYear: year,
      startMonth: null,
      startDay: null,
      endYear: null,
      endMonth: null,
      endDay: null,
      datePrecision: DatePrecision.APPROXIMATE,
    };
  }
}

/**
 * Strategy 8: Một năm đơn lẻ hoặc câu có năm trong ngoặc (VD: "Năm 1890", "938", "179 TCN", "Mùa thu năm Canh Tý (1300)")
 */
class SingleYearParseStrategy implements IHistoricalDateParseStrategy {
  readonly name = 'SingleYearParseStrategy';

  tryParse(normalizedInput: string, rawText: string): ParsedHistoricalDateRange | null {
    // Khớp trực tiếp "Năm 1890", "1890", "179 TCN", "40 SCN"
    const directYearRegex =
      /^(?:năm\s+|mùa\s+\S+\s+năm\s+)?(-?\d{1,4})(?:\s*(TCN|SCN|BC|BCE|AD|CE))?$/i;
    const directMatch = normalizedInput.match(directYearRegex);
    if (directMatch) {
      const year = toSignedHistoricalYear(directMatch[1], directMatch[2]);
      if (year !== null) {
        return {
          dateText: rawText,
          startYear: year,
          startMonth: null,
          startDay: null,
          endYear: null,
          endMonth: null,
          endDay: null,
          datePrecision: DatePrecision.YEAR,
        };
      }
    }

    // Khớp năm nằm trong ngoặc đơn hoặc sau chữ "năm": VD "Mùa thu năm Canh Tý (1300)"
    const embeddedYearRegex =
      /(?:\(|\bnăm\s+)(-?\d{1,4})(?:\s*(TCN|SCN|BC|BCE|AD|CE))?\)?/i;
    const embeddedMatch = normalizedInput.match(embeddedYearRegex);
    if (embeddedMatch) {
      const year = toSignedHistoricalYear(embeddedMatch[1], embeddedMatch[2]);
      if (year !== null) {
        return {
          dateText: rawText,
          startYear: year,
          startMonth: null,
          startDay: null,
          endYear: null,
          endMonth: null,
          endDay: null,
          datePrecision: DatePrecision.YEAR,
        };
      }
    }

    return null;
  }
}

/**
 * Bộ phân tích thời gian lịch sử dùng chung cho cả 5 Model:
 * HistoricalEvent, Period, HistoricalEntity, Person, HistoricalSite.
 * Áp dụng Strategy Pattern (Chain of Responsibility) đảm bảo nguyên tắc SOLID (OCP & SRP).
 */
export class HistoricalDateParser {
  private static readonly strategies: readonly IHistoricalDateParseStrategy[] = [
    new ExactDayRangeParseStrategy(),
    new ExactSingleDayParseStrategy(),
    new MonthYearParseStrategy(),
    new CenturyParseStrategy(),
    new DecadeParseStrategy(),
    new YearRangeParseStrategy(),
    new ApproximateYearParseStrategy(),
    new SingleYearParseStrategy(),
  ];

  /**
   * Phân tích chuỗi thời gian tổng quát (dùng cho HistoricalEvent, Period, HistoricalEntity, HistoricalSite).
   */
  static parseDateRange(
    rawDateText?: string | null,
  ): ParsedHistoricalDateRange {
    const trimmed = rawDateText?.trim() || null;
    if (!trimmed) {
      return {
        dateText: null,
        startYear: null,
        startMonth: null,
        startDay: null,
        endYear: null,
        endMonth: null,
        endDay: null,
        datePrecision: DatePrecision.UNKNOWN,
      };
    }

    const normalized = trimmed.replace(/\s+/g, ' ');
    for (const strategy of this.strategies) {
      const parsed = strategy.tryParse(normalized, trimmed);
      if (parsed) {
        return parsed;
      }
    }

    return {
      dateText: trimmed,
      startYear: null,
      startMonth: null,
      startDay: null,
      endYear: null,
      endMonth: null,
      endDay: null,
      datePrecision: DatePrecision.UNKNOWN,
    };
  }

  /**
   * Phân tích chuỗi thời gian đơn (dùng riêng cho ngày sinh / ngày mất của Person).
   */
  static parseSinglePointDate(
    rawDateText?: string | null,
  ): ParsedSingleHistoricalDate {
    const parsedRange = this.parseDateRange(rawDateText);
    return {
      dateText: parsedRange.dateText,
      year: parsedRange.startYear,
      month: parsedRange.startMonth,
      day: parsedRange.startDay,
      precision: parsedRange.datePrecision,
    };
  }

  /**
   * Chuẩn hóa và kết hợp giữa các trường số (startYear/Month/Day, endYear/Month/Day) và chuỗi dateText:
   * - Nếu người dùng nhập dateText mà bỏ trống các trường số, Parser sẽ trích xuất các trường số và datePrecision tương ứng.
   * - Nếu người dùng truyền sẵn các trường số, ưu tiên giữ nguyên các trường số đã truyền (không tự ý ghi đè hay suy diễn ngày/tháng).
   */
  static resolveRangeFields(input: {
    dateText?: string | null;
    legacyLabel?: string | null;
    startYear?: number | null;
    startMonth?: number | null;
    startDay?: number | null;
    endYear?: number | null;
    endMonth?: number | null;
    endDay?: number | null;
    datePrecision?: DatePrecision | null;
  }): ParsedHistoricalDateRange {
    const effectiveText =
      input.dateText !== undefined
        ? input.dateText?.trim() || null
        : input.legacyLabel !== undefined
          ? input.legacyLabel?.trim() || null
          : null;

    const parsedFromText = effectiveText
      ? this.parseDateRange(effectiveText)
      : null;

    const startYear =
      input.startYear !== undefined
        ? input.startYear
        : (parsedFromText?.startYear ?? null);
    const startMonth =
      input.startMonth !== undefined
        ? input.startMonth
        : (parsedFromText?.startMonth ?? null);
    const startDay =
      input.startDay !== undefined
        ? input.startDay
        : (parsedFromText?.startDay ?? null);
    const endYear =
      input.endYear !== undefined
        ? input.endYear
        : (parsedFromText?.endYear ?? null);
    const endMonth =
      input.endMonth !== undefined
        ? input.endMonth
        : (parsedFromText?.endMonth ?? null);
    const endDay =
      input.endDay !== undefined
        ? input.endDay
        : (parsedFromText?.endDay ?? null);

    let datePrecision: DatePrecision;
    if (input.datePrecision) {
      datePrecision = input.datePrecision;
    } else if (
      parsedFromText &&
      parsedFromText.datePrecision !== DatePrecision.UNKNOWN
    ) {
      datePrecision = parsedFromText.datePrecision;
    } else if (startYear !== null && startMonth !== null && startDay !== null) {
      datePrecision = DatePrecision.DAY;
    } else if (startYear !== null && startMonth !== null) {
      datePrecision = DatePrecision.MONTH;
    } else if (
      startYear !== null &&
      endYear !== null &&
      endYear !== startYear
    ) {
      datePrecision = DatePrecision.RANGE;
    } else if (startYear !== null) {
      datePrecision = DatePrecision.YEAR;
    } else {
      datePrecision = DatePrecision.UNKNOWN;
    }

    return {
      dateText: effectiveText,
      startYear,
      startMonth,
      startDay,
      endYear,
      endMonth,
      endDay,
      datePrecision,
    };
  }

  /**
   * Chuẩn hóa và kết hợp nhóm trường ngày đơn (dùng cho birthDate hoặc deathDate của Person).
   */
  static resolveSinglePointFields(input: {
    dateText?: string | null;
    legacyLabel?: string | null;
    year?: number | null;
    month?: number | null;
    day?: number | null;
    precision?: DatePrecision | null;
  }): ParsedSingleHistoricalDate {
    const resolved = this.resolveRangeFields({
      dateText: input.dateText,
      legacyLabel: input.legacyLabel,
      startYear: input.year,
      startMonth: input.month,
      startDay: input.day,
      datePrecision: input.precision,
    });

    return {
      dateText: resolved.dateText,
      year: resolved.startYear,
      month: resolved.startMonth,
      day: resolved.startDay,
      precision: resolved.datePrecision,
    };
  }
}
