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

  it('should return 3 navigation groups matching NavGroupId', () => {
    const groups = navigationFacade.getNavGroups();
    assert.strictEqual(groups.length, 3);

    const groupIds = groups.map((g) => g.id);
    assert.deepStrictEqual(groupIds, [
      NavGroupId.LEARNING,
      NavGroupId.KNOWLEDGE,
      NavGroupId.SYSTEM,
    ]);
  });

  it('should cover the active admin areas in the simplified CMS menu', () => {
    const groups = navigationFacade.getNavGroups();
    const allItems = groups.flatMap((g) => g.items);

    const expectedPages = [
      NavigationPageKey.CURRICULUM, // 1. Quản lý bài học
      NavigationPageKey.ARTICLES, // 2. Bài viết
      NavigationPageKey.TIMELINES, // 3. Dòng thời gian
      NavigationPageKey.CATEGORIES, // 4. Chuyên mục
      NavigationPageKey.TAGS, // 5. Tag
      NavigationPageKey.MEDIA, // 6. Quản lý nguồn tư liệu và media
      NavigationPageKey.QUESTIONS, // 7. Ngân hàng câu hỏi
      NavigationPageKey.QUIZZES, // 8. Quản lý bộ Quiz
      NavigationPageKey.USERS, // 9. Quản lý người dùng và phân quyền
      NavigationPageKey.SETTINGS, // 10. Cài đặt hệ thống
    ];

    for (const expectedPage of expectedPages) {
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
      NavigationPageKey.CURRICULUM,
    );
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage(NavigationPageKey.DASHBOARD),
      NavigationPageKey.CURRICULUM,
    );
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage(NavigationPageKey.ANALYTICS),
      NavigationPageKey.CURRICULUM,
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
    for (const key of [
      NavigationPageKey.ARTICLES,
      NavigationPageKey.TIMELINES,
      NavigationPageKey.CATEGORIES,
      NavigationPageKey.TAGS,
    ]) {
      assert.strictEqual(navigationFacade.resolveActiveSidebarPage(key), key);
    }
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage(NavigationPageKey.USERS),
      NavigationPageKey.USERS,
    );
    assert.strictEqual(
      navigationFacade.resolveActiveSidebarPage(NavigationPageKey.SETTINGS),
      NavigationPageKey.SETTINGS,
    );
  });

  it('should correctly resolve breadcrumbs across strategies', () => {
    const crumbLessons = navigationFacade.resolveBreadcrumb(NavigationPageKey.CURRICULUM);
    assert.strictEqual(crumbLessons.groupTitle, 'QUẢN TRỊ BÀI HỌC & QUIZ');

    const crumbHistory = navigationFacade.resolveBreadcrumb(NavigationPageKey.ARTICLES);
    assert.strictEqual(crumbHistory.groupTitle, 'KHO DỮ LIỆU LỊCH SỬ');

    const crumbSystem = navigationFacade.resolveBreadcrumb(NavigationPageKey.SETTINGS);
    assert.strictEqual(crumbSystem.groupTitle, 'HỆ THỐNG & PHÂN QUYỀN');
  });
});
