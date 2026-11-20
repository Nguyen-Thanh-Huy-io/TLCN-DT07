import { BadRequestException } from '@nestjs/common';
import { DatePrecision } from '@prisma/client';
import {
  calculateHistoricalYearSpan,
  compareHistoricalDates,
  formatHistoricalYear,
  HistoricalDateParser,
  validateHistoricalYear,
  validateHistoricalYearRange,
} from './historical-date.parser';

describe('HistoricalDateParser & BCE/CE Convention', () => {
  describe('1. HistoricalEvent Date Parsing', () => {
    it('parses exact day with time-of-day prefix ("Đêm 18/12/1972") -> DAY precision', () => {
      const result = HistoricalDateParser.parseDateRange('Đêm 18/12/1972');
      expect(result).toEqual({
        dateText: 'Đêm 18/12/1972',
        startYear: 1972,
        startMonth: 12,
        startDay: 18,
        endYear: null,
        endMonth: null,
        endDay: null,
        datePrecision: DatePrecision.DAY,
      });
    });

    it('parses same-year day range ("18/12 – 29/12/1972") -> DAY precision', () => {
      const result = HistoricalDateParser.parseDateRange('18/12 – 29/12/1972');
      expect(result).toEqual({
        dateText: '18/12 – 29/12/1972',
        startYear: 1972,
        startMonth: 12,
        startDay: 18,
        endYear: 1972,
        endMonth: 12,
        endDay: 29,
        datePrecision: DatePrecision.DAY,
      });
    });

    it('parses multi-year day range ("19/05/1959 – 30/04/1975") -> DAY precision', () => {
      const result = HistoricalDateParser.parseDateRange(
        '19/05/1959 – 30/04/1975',
      );
      expect(result).toEqual({
        dateText: '19/05/1959 – 30/04/1975',
        startYear: 1959,
        startMonth: 5,
        startDay: 19,
        endYear: 1975,
        endMonth: 4,
        endDay: 30,
        datePrecision: DatePrecision.DAY,
      });
    });

    it('parses month + year ("Tháng 8/1945") -> MONTH precision without fabricating day', () => {
      const result = HistoricalDateParser.parseDateRange('Tháng 8/1945');
      expect(result).toEqual({
        dateText: 'Tháng 8/1945',
        startYear: 1945,
        startMonth: 8,
        startDay: null,
        endYear: null,
        endMonth: null,
        endDay: null,
        datePrecision: DatePrecision.MONTH,
      });
    });

    it('supports events with unknown date (startYear = null, precision = UNKNOWN)', () => {
      const result = HistoricalDateParser.resolveRangeFields({
        dateText: 'Chưa xác định rõ thời gian',
      });
      expect(result.startYear).toBeNull();
      expect(result.datePrecision).toBe(DatePrecision.UNKNOWN);
    });
  });

  describe('2. Period & HistoricalEntity Date Parsing (TCN / SCN & Century)', () => {
    it('parses BCE to CE range ("179 TCN – 40 SCN") -> startYear = -179, endYear = 40, RANGE', () => {
      const result = HistoricalDateParser.parseDateRange('179 TCN – 40 SCN');
      expect(result).toEqual({
        dateText: '179 TCN – 40 SCN',
        startYear: -179,
        startMonth: null,
        startDay: null,
        endYear: 40,
        endMonth: null,
        endDay: null,
        datePrecision: DatePrecision.RANGE,
      });
    });

    it('parses dynasty existence range ("1009–1225" & "1225–1400") -> RANGE', () => {
      const lyDynasty = HistoricalDateParser.parseDateRange('1009–1225');
      expect(lyDynasty.startYear).toBe(1009);
      expect(lyDynasty.endYear).toBe(1225);
      expect(lyDynasty.datePrecision).toBe(DatePrecision.RANGE);

      const tranDynasty = HistoricalDateParser.parseDateRange('1225–1400');
      expect(tranDynasty.startYear).toBe(1225);
      expect(tranDynasty.endYear).toBe(1400);
      expect(tranDynasty.datePrecision).toBe(DatePrecision.RANGE);
    });

    it('parses Century ("Thế kỷ X") -> computes year bounds [901, 1000] while strictly preserving CENTURY precision and null month/day', () => {
      const result = HistoricalDateParser.parseDateRange('Thế kỷ X');
      expect(result).toEqual({
        dateText: 'Thế kỷ X',
        startYear: 901,
        startMonth: null,
        startDay: null,
        endYear: 1000,
        endMonth: null,
        endDay: null,
        datePrecision: DatePrecision.CENTURY,
      });
    });

    it('parses BCE Century range ("(thế kỷ VII TCN - thế kỷ II TCN)") -> [-700, -101] with CENTURY precision', () => {
      const result = HistoricalDateParser.parseDateRange(
        '(thế kỷ VII TCN - thế kỷ II TCN)',
      );
      expect(result).toEqual({
        dateText: '(thế kỷ VII TCN - thế kỷ II TCN)',
        startYear: -700,
        startMonth: null,
        startDay: null,
        endYear: -101,
        endMonth: null,
        endDay: null,
        datePrecision: DatePrecision.CENTURY,
      });
    });

    it('parses Decade ("Thập niên 1960") -> [1960, 1969] with DECADE precision', () => {
      const result = HistoricalDateParser.parseDateRange('Thập niên 1960');
      expect(result).toEqual({
        dateText: 'Thập niên 1960',
        startYear: 1960,
        startMonth: null,
        startDay: null,
        endYear: 1969,
        endMonth: null,
        endDay: null,
        datePrecision: DatePrecision.DECADE,
      });
    });
  });

  describe('3. Person Separate Birth & Death Date Parsing', () => {
    it('parses separate birth ("Năm 1890" -> YEAR) and death ("Ngày 2/9/1969" -> DAY)', () => {
      const birth = HistoricalDateParser.resolveSinglePointFields({
        dateText: 'Năm 1890',
      });
      const death = HistoricalDateParser.resolveSinglePointFields({
        dateText: 'Ngày 2/9/1969',
      });

      expect(birth).toEqual({
        dateText: 'Năm 1890',
        year: 1890,
        month: null,
        day: null,
        precision: DatePrecision.YEAR,
      });

      expect(death).toEqual({
        dateText: 'Ngày 2/9/1969',
        year: 1969,
        month: 9,
        day: 2,
        precision: DatePrecision.DAY,
      });
    });

    it('parses approximate birth year ("Khoảng năm 1228") -> APPROXIMATE', () => {
      const birth = HistoricalDateParser.resolveSinglePointFields({
        dateText: 'Khoảng năm 1228',
      });
      expect(birth).toEqual({
        dateText: 'Khoảng năm 1228',
        year: 1228,
        month: null,
        day: null,
        precision: DatePrecision.APPROXIMATE,
      });
    });
  });

  describe('4. HistoricalSite Construction Date Parsing', () => {
    it('parses multi-phase construction range ("1010–1070") -> sets constructionYear and constructionEndYear', () => {
      const siteDate = HistoricalDateParser.resolveRangeFields({
        dateText: '1010–1070',
      });
      expect(siteDate.startYear).toBe(1010);
      expect(siteDate.endYear).toBe(1070);
      expect(siteDate.datePrecision).toBe(DatePrecision.RANGE);
    });
  });

  describe('5. BCE/CE Convention: No Year 0 & Chronological Sorting', () => {
    it('rejects year 0 in validateHistoricalYear and validateHistoricalYearRange', () => {
      expect(() => validateHistoricalYear(0)).toThrow(BadRequestException);
      expect(() => validateHistoricalYearRange(0, 100)).toThrow(
        BadRequestException,
      );
      expect(() => validateHistoricalYearRange(-100, 0)).toThrow(
        BadRequestException,
      );
    });

    it('calculates elapsed years across BCE/CE boundary without year 0 (-1 to 1 is 1 year)', () => {
      expect(calculateHistoricalYearSpan(-1, 1)).toBe(1);
      expect(calculateHistoricalYearSpan(-179, 40)).toBe(218);
      expect(calculateHistoricalYearSpan(1009, 1225)).toBe(216);
    });

    it('sorts historical records chronologically (-179 < -1 < 1 < 938 < null)', () => {
      const items = [
        { id: 'unknown', startYear: null },
        { id: 'bach-dang', startYear: 938 },
        { id: '1-scn', startYear: 1 },
        { id: 'trieu-da', startYear: -179 },
        { id: '1-tcn', startYear: -1 },
      ];

      const sorted = [...items].sort(compareHistoricalDates);
      expect(sorted.map((i) => i.id)).toEqual([
        'trieu-da',
        '1-tcn',
        '1-scn',
        'bach-dang',
        'unknown',
      ]);
    });

    it('formats negative years as TCN and positive years as SCN/plain', () => {
      expect(formatHistoricalYear(-179)).toBe('179 TCN');
      expect(formatHistoricalYear(-1)).toBe('1 TCN');
      expect(formatHistoricalYear(40, true)).toBe('40 SCN');
      expect(formatHistoricalYear(938)).toBe('938');
    });
  });
});
