import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  dateLabelOf,
  formatPublishedDate,
  formatTimeAgo,
  formatYear,
  getInitials,
  hasMeaningfulUpdate,
  sanitizeRichHtml,
} from '@/utils/common';

describe('common utils', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('sanitizeRichHtml', () => {
    it('giữ nguyên HTML định dạng an toàn và xoá bỏ script/event/URI nguy hiểm', () => {
      const dirty =
        '<p><strong>Trần Hưng Đạo</strong></p><script>alert(1)</script><img src="javascript:alert(2)" onerror="alert(3)" /><iframe srcdoc="<script>alert(4)</script>"></iframe><a href="data:text/html,<script>">link</a>';
      const clean = sanitizeRichHtml(dirty);

      expect(clean).toContain('<strong>Trần Hưng Đạo</strong>');
      expect(clean).not.toMatch(/<script/i);
      expect(clean).not.toMatch(/onerror/i);
      expect(clean).not.toMatch(/srcdoc/i);
      expect(clean).not.toMatch(/javascript:/i);
      expect(clean).not.toMatch(/data:text\/html/i);
      expect(clean).toContain('src="#"');
      expect(clean).toContain('href="#"');
    });

    it('trả về chuỗi rỗng với null, undefined hoặc non-string', () => {
      expect(sanitizeRichHtml(null)).toBe('');
      expect(sanitizeRichHtml(undefined)).toBe('');
      expect(sanitizeRichHtml('')).toBe('');
    });
  });

  describe('formatTimeAgo', () => {
    it('hiển thị đúng mốc vừa xong / phút / giờ / ngày', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-20T12:00:00.000Z'));

      expect(formatTimeAgo('2026-11-20T11:59:30.000Z')).toBe('Vừa xong');
      expect(formatTimeAgo('2026-11-20T11:55:00.000Z')).toBe('5 phút trước');
      expect(formatTimeAgo('2026-11-20T10:00:00.000Z')).toBe('2 giờ trước');
      expect(formatTimeAgo('2026-11-17T12:00:00.000Z')).toBe('3 ngày trước');
    });
  });

  describe('formatYear & dateLabelOf', () => {
    it('quy đổi năm âm thành TCN và bỏ qua năm 0 / null / undefined', () => {
      expect(formatYear(-179)).toBe('179 TCN');
      expect(formatYear(938)).toBe('938');
      expect(formatYear(0)).toBe('');
      expect(formatYear(null)).toBe('');
      expect(formatYear(undefined)).toBe('');
    });

    it('ưu tiên dateText trước khoảng năm và xử lý năm bắt đầu = kết thúc', () => {
      expect(dateLabelOf({ dateText: '  Mùa xuân 1789  ', startYear: 1789 })).toBe('Mùa xuân 1789');
      expect(dateLabelOf({ startYear: -179, endYear: 43 })).toBe('179 TCN – 43');
      expect(dateLabelOf({ startYear: 938, endYear: 938 })).toBe('938');
      expect(dateLabelOf({ endYear: 1945 })).toBe('1945');
      expect(dateLabelOf({})).toBe('');
    });
  });

  describe('formatPublishedDate & hasMeaningfulUpdate', () => {
    it('định dạng ngày vi-VN và trả null với input rỗng hoặc lỗi', () => {
      expect(formatPublishedDate(null)).toBeNull();
      expect(formatPublishedDate('invalid-date')).toBeNull();
      expect(formatPublishedDate('2026-11-20T10:00:00.000Z')).toMatch(/20\/11\/2026/);
    });

    it('chỉ xem là cập nhật đáng kể khi cách ngày đăng >= 24 giờ', () => {
      expect(hasMeaningfulUpdate(null, '2026-11-21T00:00:00.000Z')).toBe(false);
      expect(hasMeaningfulUpdate('bad', '2026-11-21T00:00:00.000Z')).toBe(false);
      expect(
        hasMeaningfulUpdate('2026-11-20T00:00:00.000Z', '2026-11-20T23:59:59.000Z'),
      ).toBe(false);
      expect(
        hasMeaningfulUpdate('2026-11-20T00:00:00.000Z', '2026-11-21T00:00:00.000Z'),
      ).toBe(true);
    });
  });

  describe('getInitials', () => {
    it('lấy chữ cái viết tắt cho tên nhiều từ, một từ và rỗng', () => {
      expect(getInitials('Nguyễn Văn An')).toBe('NA');
      expect(getInitials('hisgo')).toBe('HI');
      expect(getInitials('   ')).toBe('HG');
    });
  });
});
