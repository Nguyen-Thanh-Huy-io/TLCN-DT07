import { BadRequestException } from '@nestjs/common';
import { normalizeArticleMetadata } from './article-metadata';

describe('normalizeArticleMetadata', () => {
  it('trả null khi không có dữ liệu hoặc toàn giá trị rỗng', () => {
    expect(normalizeArticleMetadata(undefined)).toBeNull();
    expect(normalizeArticleMetadata({})).toBeNull();
    expect(
      normalizeArticleMetadata({
        aliases: ['  '],
        person: { hometown: '' },
        site: {},
      }),
    ).toBeNull();
  });

  it('cắt khoảng trắng, bỏ trùng, bỏ giá trị rỗng ở mọi nhánh', () => {
    expect(
      normalizeArticleMetadata({
        aliases: [' Trần Quốc Tuấn ', 'Trần Quốc Tuấn', ''],
        unknownField: ' bị bỏ qua ',
        person: {
          roles: [' Tướng lĩnh ', 'Tướng lĩnh'],
          famousQuote: '  Bệ hạ chém đầu thần trước rồi hãy hàng ',
          titles: [],
        },
        site: {
          rank: 'UNESCO',
          siteType: 'BATTLEFIELD',
        },
      }),
    ).toEqual({
      aliases: ['Trần Quốc Tuấn'],
      person: {
        roles: ['Tướng lĩnh'],
        famousQuote: 'Bệ hạ chém đầu thần trước rồi hãy hàng',
      },
      site: { siteType: 'BATTLEFIELD' },
    });
  });

  it('bỏ các trường đã gỡ khỏi hồ sơ (niên đại phụ, toạ độ, hồ sơ sự kiện, kỷ nguyên, phạm vi)', () => {
    expect(
      normalizeArticleMetadata({
        era: 'MEDIEVAL',
        region: 'VIETNAM',
        person: {
          occupation: 'Tướng',
          birthDateLabel: '1228?',
          deathDateLabel: '1300',
        },
        site: { latitude: 20.94, longitude: 106.8, openingHours: '8h–17h' },
        event: { dateNote: 'x', cause: 'y', outcome: 'z', belligerents: ['a'] },
      }),
    ).toBeNull();
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
    expect(() =>
      normalizeArticleMetadata({
        person: { milestones: [{ year: 0, title: 'x' }] },
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      normalizeArticleMetadata({ person: { milestones: [{ year: 938 }] } }),
    ).toThrow(BadRequestException);
  });

  it('vai trò là chữ tự do; vẫn từ chối mã cố định không hợp lệ', () => {
    expect(normalizeArticleMetadata({ person: { roles: ['Vua'] } })).toEqual({
      person: { roles: ['Vua'] },
    });
    expect(() =>
      normalizeArticleMetadata({ site: { siteType: 'CASTLE' } }),
    ).toThrow(BadRequestException);
    expect(() => normalizeArticleMetadata({ person: 'x' })).toThrow(
      BadRequestException,
    );
  });
});
