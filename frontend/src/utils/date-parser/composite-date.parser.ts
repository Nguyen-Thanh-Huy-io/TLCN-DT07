import {
  HistoricalEra,
  type FlexibleDateParseResult,
} from '../history-year.utils';
import type {
  HistoricalDateParserStrategy,
  HistoricalDateParseContext,
} from './date-parser.types';
import { StandardNumericDateStrategy } from './standard-numeric-date.strategy';
import { CenturyDateParserStrategy } from './century-date.strategy';
import { ApproximateYearParserStrategy } from './approximate-year-date.strategy';

/**
 * Composite / Chain of Responsibility Parser cho Niên đại Lịch sử.
 * Điều phối qua các Strategy đăng ký. Dễ dàng cắm thêm Strategy mới theo nguyên lý OCP.
 */
export class CompositeHistoricalDateParser {
  private strategies: HistoricalDateParserStrategy[] = [];

  constructor(customStrategies?: HistoricalDateParserStrategy[]) {
    if (customStrategies && customStrategies.length > 0) {
      this.strategies = customStrategies;
    } else {
      // Thứ tự ưu tiên: Thế kỷ -> Năm ước lượng -> Số học chuẩn
      this.strategies = [
        new CenturyDateParserStrategy(),
        new ApproximateYearParserStrategy(),
        new StandardNumericDateStrategy(),
      ];
    }
  }

  registerStrategy(strategy: HistoricalDateParserStrategy): void {
    this.strategies.unshift(strategy);
  }

  parse(rawInput: string, isBce: boolean): FlexibleDateParseResult {
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

    const context: HistoricalDateParseContext = { rawInput: trimmed, isBce };

    for (const strategy of this.strategies) {
      if (strategy.canParse(context)) {
        const result = strategy.parse(context);
        if (result) {
          return result;
        }
      }
    }

    // Nếu không khớp strategy nào
    return {
      valid: false,
      error:
        "Định dạng không hợp lệ. Nhập DD/MM/YYYY, YYYY hoặc niên đại ước lệ (VD: 'Khoảng thế kỷ 19', 'Thế kỷ X', 'Khoảng năm 938').",
      day: null,
      month: null,
      absYear: null,
      signedYear: null,
      era,
      displayPoint: '',
    };
  }
}

export const defaultHistoricalDateParser = new CompositeHistoricalDateParser();
