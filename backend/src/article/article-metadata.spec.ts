import { BadRequestException } from '@nestjs/common';
import { normalizeArticleMetadata } from './article-metadata';

describe('normalizeArticleMetadata', () => {
  it('trả null khi không có dữ liệu hoặc toàn giá trị rỗng', () => {
    expect(normalizeArticleMetadata(undefined)).toBeNull();
    expect(normalizeArticleMetadata({})).toBeNull();
    expect(normalizeArticleMetadata({ aliases: ['  '], person: { hometown: '' }, site: {} })).toBeNull();
  });

  it('cắt khoảng trắng, bỏ trùng, bỏ giá trị rỗng ở mọi nhánh', () => {
    expect(
      normalizeArticleMetadata({
        aliases: [' Trần Quốc Tuấn ', 'Trần Quốc Tuấn', ''],
        region: ' Việt Nam ',
        person: { roles: ['GENERAL'], famousQuote: '  Bệ hạ chém đầu thần trước rồi hãy hàng ', titles: [] },
        site: { latitude: '20.94', longitude: 106.8, rank: '', siteType: 'BATTLEFIELD' },
        event: { cause: ' ', belligerents: ['Đại Việt', 'Nguyên'] },
      }),
    ).toEqual({
      aliases: ['Trần Quốc Tuấn'],
      region: 'Việt Nam',
      person: { roles: ['GENERAL'], famousQuote: 'Bệ hạ chém đầu thần trước rồi hãy hàng' },
      site: { latitude: 20.94, longitude: 106.8, siteType: 'BATTLEFIELD' },
      event: { belligerents: ['Đại Việt', 'Nguyên'] },
    });
  });

  it('mốc đời riêng: sắp theo thời gian, bắt buộc năm khác 0 và tiêu đề', () => {
    expect(
      normalizeArticleMetadata({
        person: {
          milestones: [
            { year: 1300, title: ' Mất ', month: 13 },
            { year: '1285', title: 'Đánh tan quân Nguyên', note: '' },
          ],
        },
      }),
    ).toEqual({
      person: {
        milestones: [
          { year: 1285, title: 'Đánh tan quân Nguyên' },
          { year: 1300, title: 'Mất' },
        ],
      },
    });
    expect(() => normalizeArticleMetadata({ person: { milestones: [{ year: 0, title: 'x' }] } })).toThrow(
      BadRequestException,
    );
    expect(() => normalizeArticleMetadata({ person: { milestones: [{ year: 938 }] } })).toThrow(BadRequestException);
  });

  it('từ chối mã không hợp lệ và toạ độ ngoài khoảng', () => {
    expect(() => normalizeArticleMetadata({ person: { roles: ['KING'] } })).toThrow(BadRequestException);
    expect(() => normalizeArticleMetadata({ site: { rank: 'TOP' } })).toThrow(BadRequestException);
    expect(() => normalizeArticleMetadata({ site: { latitude: 120 } })).toThrow(BadRequestException);
    expect(() => normalizeArticleMetadata({ event: 'x' })).toThrow(BadRequestException);
  });
});
