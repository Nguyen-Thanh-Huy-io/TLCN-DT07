import type { HistoricalEra, FlexibleDateParseResult } from '../history-year.utils';

export interface HistoricalDateParseContext {
  rawInput: string;
  isBce: boolean;
}

/**
 * Strategy Interface cho các bộ phân tích định dạng niên đại lịch sử.
 * Tuân thủ Open/Closed Principle (OCP) - có thể mở rộng các loại niên đại mới mà không sửa core.
 */
export interface HistoricalDateParserStrategy {
  readonly name: string;
  canParse(context: HistoricalDateParseContext): boolean;
  parse(context: HistoricalDateParseContext): FlexibleDateParseResult | null;
}
