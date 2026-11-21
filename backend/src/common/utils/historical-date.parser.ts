import { BadRequestException } from '@nestjs/common';

export const HISTORICAL_DATE_CONSTANTS = {
  BCE_SUFFIX: 'TCN',
  CE_SUFFIX: 'SCN',
  YEAR_ZERO_ERROR:
    'Quy ước lịch sử TCN/SCN không có năm 0 (sử dụng -1 cho 1 TCN và 1 cho 1 SCN).',
  INVALID_RANGE_ERROR:
    'Năm kết thúc phải lớn hơn hoặc bằng năm bắt đầu theo trục thời gian TCN/SCN.',
} as const;

/** Kiểm tra năm hợp lệ theo quy ước TCN/SCN (không tồn tại năm 0). */
export function validateHistoricalYear(year: number | null | undefined): void {
  if (year === 0) {
    throw new BadRequestException(HISTORICAL_DATE_CONSTANTS.YEAR_ZERO_ERROR);
  }
}

/** Kiểm tra khoảng năm hợp lệ theo quy ước TCN/SCN. */
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

/** Định dạng năm số nguyên sang chuỗi hiển thị tiếng Việt (VD: -179 -> "179 TCN", 938 -> "938"). */
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
