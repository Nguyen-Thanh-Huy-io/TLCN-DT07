import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  navigationFacade,
} from '../navigation-strategy.service';
import { NavigationPageKey } from '../../../constants/routes';
import { NavGroupId } from '../../../constants/navigation';

describe('Navigation Strategy & Facade Pattern Suite (Section 7.1 Admin Areas)', () => {
  it('should return singleton instance of NavigationFacade', () => {
    const instance1 = navigationFacade;
    assert.ok(instance1);
  });

  it('should return 4 navigation groups matching NavGroupId', () => {
    const groups = navigationFacade.getNavGroups();
    assert.strictEqual(groups.length, 4);

    const groupIds = groups.map((g) => g.id);
    assert.deepStrictEqual(groupIds, [
      NavGroupId.DASHBOARD,
      NavGroupId.LEARNING,
      NavGroupId.KNOWLEDGE,
      NavGroupId.SYSTEM,
    ]);
  });

  it('should cover all 12 admin areas in Section 7.1', () => {
    const groups = navigationFacade.getNavGroups();
    const allItems = groups.flatMap((g) => g.items);

    const expected12Pages = [
      NavigationPageKey.DASHBOARD, // 1. Dashboard tổng quan
      NavigationPageKey.CURRICULUM, // 2. Quản lý bài học
      NavigationPageKey.EVENTS, // 3. Quản lý sự kiện lịch sử
      NavigationPageKey.ENTITIES, // 4. Quản lý nhân vật
      NavigationPageKey.PERIODS, // 5. Quản lý triều đại, thời kỳ & văn minh
      NavigationPageKey.LOCATIONS, // 6. Quản lý địa danh và liên kết
      NavigationPageKey.MEDIA, // 7. Quản lý nguồn tư liệu và media
      NavigationPageKey.QUESTIONS, // 8. Ngân hàng câu hỏi
      NavigationPageKey.QUIZZES, // 9. Quản lý bộ Quiz
      NavigationPageKey.USERS, // 10. Quản lý người dùng và phân quyền
      NavigationPageKey.ANALYTICS, // 11. Thống kê học tập và hoạt động
      NavigationPageKey.SETTINGS, // 12. Cài đặt hệ thống
    ];

    for (const expectedPage of expected12Pages) {
      const found = allItems.find((item) => item.page === expectedPage);
      assert.ok(found, `Missing admin area item for page key: ${expectedPage}`);
      assert.ok(found.label.length > 0, `Item ${expectedPage} should have a non-empty label`);
      assert.ok(found.icon, `Item ${expectedPage} should have an icon`);
      assert.ok(found.route.startsWith('/'), `Item ${expectedPage} route should be absolute`);
    }
  });

  it('should resolve active page accurately for sidebar navigation', () => {
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage('cms'),
      NavigationPageKey.DASHBOARD,
    );
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage(NavigationPageKey.DASHBOARD),
      NavigationPageKey.DASHBOARD,
    );
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage(NavigationPageKey.ANALYTICS),
      NavigationPageKey.ANALYTICS,
    );
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage(NavigationPageKey.CURRICULUM),
      NavigationPageKey.CURRICULUM,
    );
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage(NavigationPageKey.LESSONS),
      NavigationPageKey.CURRICULUM,
    );
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage(NavigationPageKey.QUESTIONS),
      NavigationPageKey.QUESTIONS,
    );
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage(NavigationPageKey.QUIZZES),
      NavigationPageKey.QUIZZES,
    );
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage(NavigationPageKey.MEDIA),
      NavigationPageKey.MEDIA,
    );
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage(NavigationPageKey.EVENTS),
      NavigationPageKey.EVENTS,
    );
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage(NavigationPageKey.ENTITIES),
      NavigationPageKey.ENTITIES,
    );
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage(NavigationPageKey.PERIODS),
      NavigationPageKey.PERIODS,
    );
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage(NavigationPageKey.LOCATIONS),
      NavigationPageKey.LOCATIONS,
    );
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage(NavigationPageKey.USERS),
      NavigationPageKey.USERS,
    );
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage(NavigationPageKey.SETTINGS),
      NavigationPageKey.SETTINGS,
    );
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage(NavigationPageKey.TAXONOMIES),
      NavigationPageKey.SETTINGS,
    );
  });

  it('should correctly resolve breadcrumbs across strategies', () => {
    const crumbDashboard = navigationFacade.resolveBreadcrumb(NavigationPageKey.DASHBOARD);
    assert.strictEqual(crumbDashboard.groupTitle, 'TỔNG QUAN & BÁO CÁO');

    const crumbLessons = navigationFacade.resolveBreadcrumb(NavigationPageKey.CURRICULUM);
    assert.strictEqual(crumbLessons.groupTitle, 'QUẢN TRỊ BÀI HỌC & QUIZ');

    const crumbHistory = navigationFacade.resolveBreadcrumb(NavigationPageKey.EVENTS);
    assert.strictEqual(crumbHistory.groupTitle, 'KHO DỮ LIỆU LỊCH SỬ');

    const crumbSystem = navigationFacade.resolveBreadcrumb(NavigationPageKey.SETTINGS);
    assert.strictEqual(crumbSystem.groupTitle, 'HỆ THỐNG & PHÂN QUYỀN');
  });
});
