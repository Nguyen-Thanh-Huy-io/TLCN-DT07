import { DatePrecision } from '../../constants/enums';
import {
  HistoricalEra,
  formatSingleDatePoint,
  type FlexibleDateParseResult,
} from '../history-year.utils';
import type {
  HistoricalDateParserStrategy,
  HistoricalDateParseContext,
} from './date-parser.types';

function getDaysInMonth(month: number, year: number): number {
  if ([4, 6, 9, 11].includes(month)) return 30;
  if (month === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return isLeap ? 29 : 28;
  }
  return 31;
}

/**
 * Strategy phân tích Ngày/Tháng/Năm dạng số chuẩn (Standard Numeric Date Strategy)
 * Hỗ trợ:
 *   - "DD/MM/YYYY" (VD: "19/05/1959")
 *   - "MM/YYYY"    (VD: "05/1959")
 *   - "YYYY"       (VD: "1959", "938", "257")
 */
export class StandardNumericDateStrategy implements HistoricalDateParserStrategy {
  readonly name = 'StandardNumericDateStrategy';

  canParse(context: HistoricalDateParseContext): boolean {
    const trimmed = (context.rawInput || '').trim();
    if (!trimmed) return false;
    // Cho phép phân cách bằng / hoặc - hoặc .
    const normalized = trimmed.replace(/[.-]/g, '/');
    const parts = normalized.split('/').map((p) => p.trim());
    return parts.length >= 1 && parts.length <= 3 && parts.every((p) => /^\d+$/.test(p));
  }

  parse(context: HistoricalDateParseContext): FlexibleDateParseResult | null {
    const trimmed = (context.rawInput || '').trim();
    const era = context.isBce ? HistoricalEra.BCE : HistoricalEra.CE;

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

    const normalized = trimmed.replace(/[.-]/g, '/');
    const parts = normalized.split('/').map((p) => p.trim());

    let day: number | null = null;
    let month: number | null = null;
    let absYear: number | null = null;

    if (parts.length === 1) {
      // YYYY
      if (!/^\d{1,4}$/.test(parts[0])) {
        return {
          valid: false,
          error: 'Năm phải có từ 1 đến 4 chữ số (VD: 938 hoặc 1959).',
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
      // MM/YYYY
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
      // DD/MM/YYYY
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
      return null;
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

    const signedYear = context.isBce ? -absYear : absYear;
    const displayPoint = formatSingleDatePoint({
      day,
      month,
      year: absYear,
      era,
    });

    let precision = DatePrecision.YEAR;
    if (day !== null) {
      precision = DatePrecision.DAY;
    } else if (month !== null) {
      precision = DatePrecision.MONTH;
    }

    return {
      valid: true,
      day,
      month,
      absYear,
      signedYear,
      era,
      displayPoint,
      precision,
    };
  }
}
