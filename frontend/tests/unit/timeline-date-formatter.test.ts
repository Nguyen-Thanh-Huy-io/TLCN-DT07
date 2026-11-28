import { describe, expect, it } from 'vitest';
import { formatTimelinePeriod } from '@/components/timeline/timeline-date-formatter';

describe('formatTimelinePeriod Strategy', () => {
  it('định dạng số triệu năm TCN chuẩn tiếng Việt', () => {
    expect(formatTimelinePeriod('2500000 TCN')).toBe('Khoảng 2,5 triệu năm TCN');
    expect(formatTimelinePeriod('2000000 TCN')).toBe('Khoảng 2 triệu năm TCN');
    expect(formatTimelinePeriod('4000000TCN')).toBe('Khoảng 4 triệu năm TCN');
  });

  it('định dạng số nghìn năm có dấu phân cách', () => {
    expect(formatTimelinePeriod('1000 TCN')).toBe('1.000 TCN');
    expect(formatTimelinePeriod('3000 TCN')).toBe('3.000 TCN');
  });

  it('thêm tiền tố Năm cho năm dương lịch thuần túy', () => {
    expect(formatTimelinePeriod('1945')).toBe('Năm 1945');
    expect(formatTimelinePeriod('938')).toBe('Năm 938');
  });

  it('giữ nguyên chuỗi đã có từ khóa định tính tiếng Việt', () => {
    expect(formatTimelinePeriod('Khoảng 3,5 triệu TCN')).toBe('Khoảng 3,5 triệu TCN');
    expect(formatTimelinePeriod('Hơn 4 triệu năm trước')).toBe('Hơn 4 triệu năm trước');
    expect(formatTimelinePeriod('Thế kỷ X')).toBe('Thế kỷ X');
  });

  it('xử lý an toàn giá trị rỗng hoặc null', () => {
    expect(formatTimelinePeriod('')).toBe('');
    expect(formatTimelinePeriod(undefined)).toBe('');
    expect(formatTimelinePeriod(null)).toBe('');
  });
});
