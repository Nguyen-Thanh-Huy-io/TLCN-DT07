import {
  dateKeyToIsoWeekKey,
  diffIsoWeekKeys,
  diffVnDateKeys,
  listCurrentWeekVnDateKeys,
  toVnDateKey,
  toVnWeekKey,
} from './vn-date.util';

describe('vn-date.util (Asia/Ho_Chi_Minh UTC+7)', () => {
  it('quy đổi chính xác mốc nửa đêm UTC vs giờ Việt Nam (+7)', () => {
    // 17:30 UTC ngày 19/11 = 00:30 VN ngày 20/11
    const afterMidnightVn = new Date('2026-11-19T17:30:00.000Z');
    // 16:30 UTC ngày 19/11 = 23:30 VN ngày 19/11
    const beforeMidnightVn = new Date('2026-11-19T16:30:00.000Z');

    expect(toVnDateKey(beforeMidnightVn)).toBe('2026-11-19');
    expect(toVnDateKey(afterMidnightVn)).toBe('2026-11-20');
    expect(
      diffVnDateKeys(
        toVnDateKey(beforeMidnightVn),
        toVnDateKey(afterMidnightVn),
      ),
    ).toBe(1);
  });

  it('tính weekKey ISO và khoảng cách tuần chính xác qua giao thừa năm mới', () => {
    expect(dateKeyToIsoWeekKey('2026-12-28')).toBe('2026-W53');
    expect(dateKeyToIsoWeekKey('2027-01-04')).toBe('2027-W01');
    expect(diffIsoWeekKeys('2026-W53', '2027-W01')).toBe(1);
    expect(toVnWeekKey(new Date('2026-11-19T10:00:00.000Z'))).toBe('2026-W47');
  });

  it('trả về đủ 7 ngày Thứ 2 -> Chủ nhật của tuần hiện tại', () => {
    const days = listCurrentWeekVnDateKeys(
      new Date('2026-11-19T10:00:00.000Z'), // Thứ Năm
    );
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('2026-11-16');
    expect(days[6]).toBe('2026-11-22');
  });
});
