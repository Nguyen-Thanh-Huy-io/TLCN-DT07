import { BadRequestException } from '@nestjs/common';
import {
  formatHistoricalYear,
  HISTORICAL_DATE_CONSTANTS,
  validateHistoricalYear,
  validateHistoricalYearRange,
} from './historical-date.parser';

describe('historical-date.parser — BCE/CE Validation & Formatting', () => {
  it('từ chối năm 0 ở validateHistoricalYear và validateHistoricalYearRange', () => {
    expect(() => validateHistoricalYear(0)).toThrow(
      new BadRequestException(HISTORICAL_DATE_CONSTANTS.YEAR_ZERO_ERROR),
    );
    expect(() => validateHistoricalYearRange(0, 100)).toThrow(
      BadRequestException,
    );
    expect(() => validateHistoricalYearRange(-100, 0)).toThrow(
      BadRequestException,
    );
  });

  it('cho phép năm null/undefined và khoảng năm hợp lệ từ TCN sang SCN', () => {
    expect(() => validateHistoricalYear(null)).not.toThrow();
    expect(() => validateHistoricalYear(undefined)).not.toThrow();
    expect(() => validateHistoricalYearRange(-179, 40)).not.toThrow();
    expect(() => validateHistoricalYearRange(938, 938)).not.toThrow();
    expect(() => validateHistoricalYearRange(-257, null)).not.toThrow();
  });

  it('từ chối khoảng năm ngược (endYear < startYear) kèm thông báo tùy chọn', () => {
    expect(() => validateHistoricalYearRange(1945, 1930)).toThrow(
      new BadRequestException(HISTORICAL_DATE_CONSTANTS.INVALID_RANGE_ERROR),
    );
    expect(() =>
      validateHistoricalYearRange(-10, -200, 'Lỗi khoảng năm tùy chỉnh'),
    ).toThrow(new BadRequestException('Lỗi khoảng năm tùy chỉnh'));
  });

  it('định dạng năm âm thành TCN, năm dương thành SCN hoặc số năm thuần', () => {
    expect(formatHistoricalYear(-179)).toBe('179 TCN');
    expect(formatHistoricalYear(-1)).toBe('1 TCN');
    expect(formatHistoricalYear(40, true)).toBe('40 SCN');
    expect(formatHistoricalYear(938)).toBe('938');
    expect(formatHistoricalYear(0)).toBe('');
    expect(formatHistoricalYear(null)).toBe('');
  });
});
