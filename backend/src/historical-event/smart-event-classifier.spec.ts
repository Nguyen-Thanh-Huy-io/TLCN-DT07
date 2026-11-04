import { SmartEventClassifier } from '../../../frontend/src/features/events/strategies/event-classifier.strategy';
import { EventCategory } from '../../../frontend/src/constants/enums';
import {
  EventLocationScopeStrategy,
  EventLocationKind,
} from '../../../frontend/src/features/events/strategies/location-scope.strategy';

describe('SmartEventClassifier & LocationScope Automated Tests', () => {
  const emptyTerms: any[] = [];

  describe('1. SmartEventClassifier Strategy', () => {
    it('nhận diện chính xác Chiến tranh / Kháng chiến từ tiêu đề', () => {
      const result = SmartEventClassifier.classify(emptyTerms, {
        title: 'Kháng chiến chống Nguyên - Mông lần thứ hai',
      });
      expect(result.code).toBe(EventCategory.WAR);
      expect(result.label).toBe('Chiến tranh / Kháng chiến');
      expect(result.isHeuristic).toBe(true);
    });

    it('nhận diện chính xác Trận đánh (Trận Tây Kết, Trận Vạn Kiếp, Hải chiến)', () => {
      const res1 = SmartEventClassifier.classify(emptyTerms, {
        title: 'Trận Tây Kết',
      });
      expect(res1.code).toBe(EventCategory.BATTLE);

      const res2 = SmartEventClassifier.classify(emptyTerms, {
        title: 'Trận Vạn Kiếp',
      });
      expect(res2.code).toBe(EventCategory.BATTLE);

      const res3 = SmartEventClassifier.classify(emptyTerms, {
        title: 'Hải chiến Hoàng Sa 1974',
      });
      expect(res3.code).toBe(EventCategory.BATTLE);
    });

    it('nhận diện chính xác Cách mạng / Khởi nghĩa', () => {
      const res1 = SmartEventClassifier.classify(emptyTerms, {
        title: 'Cách mạng Pháp năm 1789',
      });
      expect(res1.code).toBe(EventCategory.REVOLUTION);

      const res2 = SmartEventClassifier.classify(emptyTerms, {
        title: 'Khởi nghĩa Lam Sơn',
      });
      expect(res2.code).toBe(EventCategory.REVOLUTION);
    });

    it('nhận diện chính xác Hiệp ước / Văn kiện', () => {
      const res1 = SmartEventClassifier.classify(emptyTerms, {
        title: 'Hiệp định Genève năm 1954',
      });
      expect(res1.code).toBe(EventCategory.TREATY);

      const res2 = SmartEventClassifier.classify(emptyTerms, {
        title: 'Chiếu dời đô của Lý Công Uẩn',
      });
      expect(res2.code).toBe(EventCategory.TREATY);
    });

    it('nhận diện chính xác Hội nghị', () => {
      const res = SmartEventClassifier.classify(emptyTerms, {
        title: 'Hội nghị Diên Hồng',
      });
      expect(res.code).toBe(EventCategory.SUMMIT_CONFERENCE);
    });

    it('ưu tiên taxonomy term hợp lệ nếu đã được gắn từ trước', () => {
      const mockTerms: any[] = [
        { id: 'term-culture', code: EventCategory.CULTURE_SCIENCE, label: 'Văn hóa đặc biệt' },
      ];
      const res = SmartEventClassifier.classify(mockTerms, {
        title: 'Kháng chiến nhưng được phân loại Văn hóa',
        categoryIds: ['term-culture'],
      });
      expect(res.code).toBe(EventCategory.CULTURE_SCIENCE);
      expect(res.label).toBe('Văn hóa đặc biệt');
      expect(res.isHeuristic).toBe(false);
    });
  });

  describe('2. EventLocationScope Strategy', () => {
    it('nhận diện chính xác Địa danh / Di tích cụ thể', () => {
      const result = EventLocationScopeStrategy.resolve({
        historicalLocation: {
          name: 'Sông Bạch Đằng, Quảng Ninh',
          address: 'Thị xã Quảng Yên, tỉnh Quảng Ninh',
        },
      });
      expect(result.kind).toBe(EventLocationKind.SPECIFIC_SITE);
      expect(result.displayName).toBe('Sông Bạch Đằng, Quảng Ninh');
      expect(result.badgeTone).toBe('emerald');
    });

    it('nhận diện Phạm vi toàn quốc hoặc liên khu (STRATEGIC_SCOPE)', () => {
      const res1 = EventLocationScopeStrategy.resolve({
        metadata: { rawLocation: 'Toàn quốc' },
      });
      expect(res1.kind).toBe(EventLocationKind.STRATEGIC_SCOPE);
      expect(res1.displayName).toBe('Toàn quốc');
      expect(res1.badgeTone).toBe('blue');

      const res2 = EventLocationScopeStrategy.resolve({
        historicalLocation: { name: 'Miền Bắc Việt Nam' },
      });
      expect(res2.kind).toBe(EventLocationKind.STRATEGIC_SCOPE);
      expect(res2.displayName).toBe('Miền Bắc Việt Nam');
    });

    it('loại bỏ các chuỗi chưa rõ / vô nghĩa và trả về UNSPECIFIED', () => {
      const res1 = EventLocationScopeStrategy.resolve({
        metadata: { rawLocation: 'Toàn quốc / Chưa rõ' },
      });
      expect(res1.kind).toBe(EventLocationKind.UNSPECIFIED);
      expect(res1.displayName).toBe('Chưa xác định địa điểm');

      const res2 = EventLocationScopeStrategy.resolve({
        metadata: { rawLocation: 'Chưa rõ' },
      });
      expect(res2.kind).toBe(EventLocationKind.UNSPECIFIED);

      const res3 = EventLocationScopeStrategy.resolve({});
      expect(res3.kind).toBe(EventLocationKind.UNSPECIFIED);
    });
  });
});
