import { describe, it, expect } from 'vitest';
import {
  NAVIGATION_PILLARS,
  MOBILE_HOME_LINK,
  PRACTICE_ROUTE,
  isLearningActive,
  isTimelineActive,
  isCommunityActive,
  isExploreActive,
} from '@/components/hisgo/header-navigation.config';
import { resolveDedicatedSearchUrl } from '@/features/search/GlobalSearch';
import { NavigationPillarId, SearchEntryKind } from '@/constants/enums';

describe('Header Navigation Config (Phương án A - 4 Trụ cột)', () => {
  it('chứa đủ các nhóm trụ cột chính: Học tập, Dòng thời gian, Cộng đồng', () => {
    const pillarIds = NAVIGATION_PILLARS.map((p) => p.id);
    expect(pillarIds).toContain(NavigationPillarId.LEARNING);
    expect(pillarIds).toContain(NavigationPillarId.TIMELINE);
    expect(pillarIds).toContain(NavigationPillarId.COMMUNITY);
  });

  it('nhóm Học tập chứa cả Chương trình học và Luyện tập trắc nghiệm', () => {
    const learningPillar = NAVIGATION_PILLARS.find((p) => p.id === NavigationPillarId.LEARNING);
    expect(learningPillar).toBeDefined();
    expect(learningPillar?.subItems).toHaveLength(2);

    const hrefs = learningPillar?.subItems?.map((s) => s.href);
    expect(hrefs).toContain('/chuong-trinh-hoc');
    expect(hrefs).toContain(PRACTICE_ROUTE);
  });

  it('nhóm Cộng đồng chứa cả Diễn đàn thảo luận và Blog', () => {
    const communityPillar = NAVIGATION_PILLARS.find((p) => p.id === NavigationPillarId.COMMUNITY);
    expect(communityPillar).toBeDefined();
    expect(communityPillar?.subItems).toHaveLength(2);

    const hrefs = communityPillar?.subItems?.map((s) => s.href);
    expect(hrefs).toContain('/cong-dong');
    expect(hrefs).toContain('/blog');
  });

  it('liên kết Mobile Home trỏ chính xác về trang chủ', () => {
    expect(MOBILE_HOME_LINK.href).toBe('/');
    expect(MOBILE_HOME_LINK.label).toBe('Trang chủ');
  });

  describe('Pathname Active Matching Helpers', () => {
    it('nhận diện chính xác các route thuộc nhóm Học tập', () => {
      expect(isLearningActive('/chuong-trinh-hoc')).toBe(true);
      expect(isLearningActive('/bai-hoc/123')).toBe(true);
      expect(isLearningActive(PRACTICE_ROUTE)).toBe(true);
      expect(isLearningActive('/dong-thoi-gian')).toBe(false);
      expect(isLearningActive(null)).toBe(false);
    });

    it('nhận diện chính xác các route thuộc Dòng thời gian', () => {
      expect(isTimelineActive('/dong-thoi-gian')).toBe(true);
      expect(isTimelineActive('/giai-doan/thoi-ky-hung-vuong')).toBe(true);
      expect(isTimelineActive('/chuong-trinh-hoc')).toBe(false);
      expect(isTimelineActive(null)).toBe(false);
    });

    it('nhận diện chính xác các route thuộc Cộng đồng', () => {
      expect(isCommunityActive('/cong-dong')).toBe(true);
      expect(isCommunityActive('/blog/bai-viet-hay')).toBe(true);
      expect(isCommunityActive('/bai-viet')).toBe(false);
      expect(isCommunityActive(null)).toBe(false);
    });

    it('nhận diện chính xác các route thuộc Khám phá', () => {
      expect(isExploreActive('/kham-pha-khai-niem')).toBe(true);
      expect(isExploreActive('/bai-viet')).toBe(true);
      expect(isExploreActive('/chuyen-muc/su-kien')).toBe(true);
      expect(isExploreActive('/cong-dong')).toBe(false);
      expect(isExploreActive(null)).toBe(false);
    });
  });

  describe('Global Search Dedicated URL Strategy', () => {
    it('chuyển hướng ARTICLE sang /bai-viet kèm từ khóa tìm kiếm encode chuẩn', () => {
      const url = resolveDedicatedSearchUrl(SearchEntryKind.ARTICLE, 'Quang Trung');
      expect(url).toBe('/bai-viet?q=Quang%20Trung');
    });

    it('chuyển hướng ARTICLE sang /bai-viet khi từ khóa rỗng', () => {
      const url = resolveDedicatedSearchUrl(SearchEntryKind.ARTICLE, '   ');
      expect(url).toBe('/bai-viet');
    });

    it('chuyển hướng TIMELINE sang /dong-thoi-gian', () => {
      const url = resolveDedicatedSearchUrl(SearchEntryKind.TIMELINE, '1945');
      expect(url).toBe('/dong-thoi-gian');
    });

    it('chuyển hướng LESSON sang /chuong-trinh-hoc', () => {
      const url = resolveDedicatedSearchUrl(SearchEntryKind.LESSON, 'kháng chiến');
      expect(url).toBe('/chuong-trinh-hoc');
    });
  });
});
