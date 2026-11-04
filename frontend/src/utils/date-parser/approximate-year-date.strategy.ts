import { DatePrecision } from '../../constants/enums';
import {
  HistoricalEra,
  type FlexibleDateParseResult,
} from '../history-year.utils';
import type {
  HistoricalDateParserStrategy,
  HistoricalDateParseContext,
} from './date-parser.types';

/**
 * Strategy phân tích Niên đại Ước lượng theo Năm (Approximate Year Parsing Strategy)
 * Ví dụ hợp lệ:
 *   - "Khoảng năm 938", "Khoảng 938", "Ước chừng năm 1789"
 *   - "Vào khoảng 1288", "Năm khoảng 1945"
 *   - "~938", "ca. 938", "c. 938"
 *   - "Khoảng năm 257 TCN"
 */
export class ApproximateYearParserStrategy implements HistoricalDateParserStrategy {
  readonly name = 'ApproximateYearParserStrategy';

  private readonly APPROX_YEAR_REGEX =
    /^(?:(khoảng\s+năm|khoảng|ước\s*chừng\s*năm|ước\s*chừng|vào\s+khoảng\s+năm|vào\s+khoảng|năm\s+khoảng|ca?\.|~)\s*)(\d{1,4})(?:\s+(tcn|trước\s*cn|bce))?$/i;

  canParse(context: HistoricalDateParseContext): boolean {
    const trimmed = (context.rawInput || '').trim();
    return this.APPROX_YEAR_REGEX.test(trimmed);
  }

  parse(context: HistoricalDateParseContext): FlexibleDateParseResult | null {
    const trimmed = (context.rawInput || '').trim();
    const match = trimmed.match(this.APPROX_YEAR_REGEX);
    if (!match) return null;

    const rawYear = match[2];
    const textEraSuffix = match[3];

    const absYear = parseInt(rawYear, 10);
    if (isNaN(absYear) || absYear <= 0) {
      return {
        valid: false,
        error: 'Năm ước lượng phải là số nguyên dương lớn hơn 0.',
        day: null,
        month: null,
        absYear: null,
        signedYear: null,
        era: context.isBce ? HistoricalEra.BCE : HistoricalEra.CE,
        displayPoint: '',
      };
    }

    const isBce = Boolean(context.isBce || textEraSuffix);
    const era = isBce ? HistoricalEra.BCE : HistoricalEra.CE;
    const signedYear = isBce ? -absYear : absYear;

    let displayPoint = trimmed;
    if (isBce && !/(tcn|trước\s*cn|bce)/i.test(displayPoint)) {
      displayPoint = `${displayPoint} TCN`;
    }

    return {
      valid: true,
      day: null,
      month: null,
      absYear,
      signedYear,
      era,
      displayPoint,
      precision: DatePrecision.APPROXIMATE,
    };
  }
}
