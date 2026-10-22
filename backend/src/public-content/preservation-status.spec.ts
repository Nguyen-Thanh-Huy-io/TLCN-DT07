import { normalizePreservation } from './preservation-status.constant';

describe('normalizePreservation', () => {
  it.each([
    ['Bảo tồn nguyên vẹn', 'INTACT', null],
    ['Bảo tồn đặc biệt', 'INTACT', 'Chế độ bảo tồn đặc biệt'],
    [
      'Bảo tồn nguyên vẹn (thuộc Bảo tàng Hermitage)',
      'MUSEUM_MEMORIAL',
      'Bảo tồn nguyên vẹn',
    ],
    ['Bảo tàng Lịch sử Hội nghị Yalta', 'MUSEUM_MEMORIAL', null],
    [
      'Hệ thống bảo tàng và nghĩa trang tưởng niệm D-Day',
      'MUSEUM_MEMORIAL',
      null,
    ],
    ['Khu tưởng niệm Quốc gia Đồi Mamayev Kurgan', 'MUSEUM_MEMORIAL', null],
    ['Khu tưởng niệm Quốc gia USS Arizona', 'MUSEUM_MEMORIAL', null],
    [
      'Khu tưởng niệm Bức tường Berlin & East Side Gallery',
      'MUSEUM_MEMORIAL',
      null,
    ],
    [
      'Địa vực khảo cổ lịch sử',
      'ARCHAEOLOGICAL_RUIN',
      'Địa vực khảo cổ lịch sử',
    ],
    [
      'Đang hoạt động & Bảo tàng Lịch sử Vũ trụ',
      'ACTIVE_SITE',
      'Đang hoạt động & Bảo tàng Lịch sử Vũ trụ',
    ],
    ['Đã trùng tu năm 2005', 'RESTORED', 'Đã trùng tu năm 2005'],
  ])('"%s" → %s', (raw, category, note) => {
    expect(normalizePreservation(raw)).toEqual({ category, note });
  });

  it('keeps unknown text as a note without a category', () => {
    expect(normalizePreservation('Chưa khảo sát')).toEqual({
      category: null,
      note: 'Chưa khảo sát',
    });
    expect(normalizePreservation('Đang chờ đánh giá')).toEqual({
      category: null,
      note: 'Đang chờ đánh giá',
    });
  });

  it('returns nothing for empty values and accepts category codes', () => {
    expect(normalizePreservation(null)).toEqual({ category: null, note: null });
    expect(normalizePreservation('  ')).toEqual({ category: null, note: null });
    expect(normalizePreservation('RESTORED')).toEqual({
      category: 'RESTORED',
      note: null,
    });
  });
});
