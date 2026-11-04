import { DatePrecision } from '../../constants/enums';
import {
  HistoricalEra,
  type FlexibleDateParseResult,
} from '../history-year.utils';
import type {
  HistoricalDateParserStrategy,
  HistoricalDateParseContext,
} from './date-parser.types';
import { parseRomanNumeral } from './roman-numerals.util';

/**
 * Strategy phân tích Niên đại Dạng Thế kỷ (Century Date Parsing Strategy)
 * Ví dụ hợp lệ:
 *   - "Khoảng thế kỷ 19", "Khoảng thế kỷ XIX"
 *   - "Thế kỷ 19", "Thế kỷ XIX", "TK 19", "TK XIX", "Thế kỉ X"
 *   - "Đầu thế kỷ XX", "Giữa thế kỷ 18", "Cuối thế kỷ XIX"
 *   - "Thế kỷ III TCN", "Khoảng thế kỷ VII TCN"
 */
export class CenturyDateParserStrategy implements HistoricalDateParserStrategy {
  readonly name = 'CenturyDateParserStrategy';

  // Regex bắt các biến thể thế kỷ tiếng Việt
  private readonly CENTURY_REGEX =
    /^(?:(khoảng|ước chừng|vào khoảng)\s+)?(?:(đầu|giữa|cuối)\s+)?(?:thế\s*k[ỷi]|tk)\s+([ivxlcdm]+|\d+)(?:\s+(tcn|trước\s*cn|bce))?$/i;

  canParse(context: HistoricalDateParseContext): boolean {
    const trimmed = (context.rawInput || '').trim();
    return this.CENTURY_REGEX.test(trimmed);
  }

  parse(context: HistoricalDateParseContext): FlexibleDateParseResult | null {
    const trimmed = (context.rawInput || '').trim();
    const match = trimmed.match(this.CENTURY_REGEX);
    if (!match) return null;

    const approxPrefix = match[1]; // "khoảng", "ước chừng"...
    const subPeriod = match[2]?.toLowerCase(); // "đầu", "giữa", "cuối"
    const rawCentury = match[3]; // "19", "XIX", "10", "X"...
    const textEraSuffix = match[4]; // "tcn", "trước cn"...

    // Xác định số thế kỷ (hỗ trợ cả số La Mã và số Ả Rập)
    let centuryNum: number | null = null;
    if (/^\d+$/.test(rawCentury)) {
      centuryNum = parseInt(rawCentury, 10);
    } else {
      centuryNum = parseRomanNumeral(rawCentury);
    }

    if (!centuryNum || centuryNum <= 0 || centuryNum > 50) {
      return {
        valid: false,
        error: `Thế kỷ '${rawCentury}' không hợp lệ. Vui lòng nhập từ 1 đến 50 (hoặc số La Mã tương ứng).`,
        day: null,
        month: null,
        absYear: null,
        signedYear: null,
        era: context.isBce ? HistoricalEra.BCE : HistoricalEra.CE,
        displayPoint: '',
      };
    }

    // Xác định Kỷ nguyên (TCN / BCE hoặc Sau CN)
    const isBce = Boolean(context.isBce || textEraSuffix);
    const era = isBce ? HistoricalEra.BCE : HistoricalEra.CE;

    // Tính toán năm số học đại diện cho Timeline
    let baseYear = (centuryNum - 1) * 100 + 1;
    if (subPeriod === 'đầu') {
      baseYear = (centuryNum - 1) * 100 + 1;
    } else if (subPeriod === 'giữa') {
      baseYear = (centuryNum - 1) * 100 + 50;
    } else if (subPeriod === 'cuối') {
      baseYear = (centuryNum - 1) * 100 + 75;
    }

    // Với TCN, mốc thời gian bắt đầu của thế kỷ tính từ năm xa nhất (năm - (century * 100))
    const absYear = isBce ? centuryNum * 100 : baseYear;
    const signedYear = isBce ? -absYear : absYear;

    // Chuẩn hóa chuỗi hiển thị
    // Giữ nguyên vẻ tự nhiên của chuỗi người dùng nhập, nếu có TCN mà chưa có hậu tố trong text thì thêm vào
    let displayPoint = trimmed;
    if (isBce && !/(tcn|trước\s*cn|bce)/i.test(displayPoint)) {
      displayPoint = `${displayPoint} TCN`;
    }

    const approxEndYear = isBce ? -((centuryNum - 1) * 100 + 1) : centuryNum * 100;

    return {
      valid: true,
      day: null,
      month: null,
      absYear,
      signedYear,
      era,
      displayPoint,
      precision: DatePrecision.CENTURY,
      approxEndYear,
    };
  }
}
