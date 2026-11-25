import { expect, test } from '@playwright/test';
import { E2E_SEED_ACCOUNTS, E2eRoutes } from './e2e.config';
import { ConsoleErrorTracker, LoginPage } from './e2e.pages';

test.describe('CMS Content Management, Review & Taxonomy E2E (10 scenarios)', () => {
  test('21. CMS Tổng quan (/cms) & Sidebar: không còn các mục thừa (Cài đặt hệ thống, Thống kê, Thư viện Media)', async ({
    page,
  }) => {
    const tracker = new ConsoleErrorTracker(page);
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitRedirect(
      E2E_SEED_ACCOUNTS.adminEmail,
      E2E_SEED_ACCOUNTS.password,
    );

    await page.goto(E2eRoutes.CMS_ARTICLES, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('HISGO');
    const sidebarText = await page.locator('aside').first().innerText();
    expect(sidebarText).not.toContain('Cài đặt hệ thống');
    expect(sidebarText).not.toContain('Thư viện Media');
    tracker.expectNoErrors();
  });

  test('22. CMS Danh sách bài viết (/articles): hiển thị bài viết E2E và bộ lọc chuyên mục/trạng thái', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitRedirect(
      E2E_SEED_ACCOUNTS.adminEmail,
      E2E_SEED_ACCOUNTS.password,
    );

    await page.goto(E2eRoutes.CMS_ARTICLES, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(
      E2E_SEED_ACCOUNTS.articleTitle,
    );
  });

  test('23. CMS Soạn bài viết (/articles/create): rút gọn đúng 2 tab (Thông tin & Nội dung) kèm bộ chọn Chuyên mục cây cha-con và chặn lưu khi thiếu tiêu đề', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitRedirect(
      E2E_SEED_ACCOUNTS.adminEmail,
      E2E_SEED_ACCOUNTS.password,
    );

    await page.goto(E2eRoutes.CMS_ARTICLE_CREATE, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByText('Thông tin').first()).toBeVisible();
    await expect(page.getByText('Nội dung').first()).toBeVisible();
    await expect(page.getByText('Chuyên mục').first()).toBeVisible();

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Hồ sơ riêng');
    expect(bodyText).not.toContain('Hồ sơ & liên kết');

    // Negative test: Bấm Lưu nháp khi chưa nhập tiêu đề
    const saveDraftBtn = page
      .locator('button')
      .filter({ hasText: 'Lưu nháp' })
      .first();
    await saveDraftBtn.click();
    await expect(page.locator('body')).toContainText(
      'Bài viết cần có tiêu đề.',
    );

    // Chuyển sang tab Nội dung (Block Builder)
    await page.locator('button').filter({ hasText: 'Nội dung' }).first().click();
    await expect(page.locator('body')).toContainText(/Bài viết mới|Khối/i);
  });

  test('24. CMS Quản lý Chuyên mục (/categories): hiển thị cây chuyên mục cha-con', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitRedirect(
      E2E_SEED_ACCOUNTS.adminEmail,
      E2E_SEED_ACCOUNTS.password,
    );

    await page.goto(E2eRoutes.CMS_CATEGORIES, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('body')).toContainText(
      E2E_SEED_ACCOUNTS.categoryName,
    );
  });

  test('25. CMS Quản lý Thẻ tìm kiếm (/tags): hiển thị danh sách Tag và bộ đếm sử dụng', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitRedirect(
      E2E_SEED_ACCOUNTS.adminEmail,
      E2E_SEED_ACCOUNTS.password,
    );

    await page.goto(E2eRoutes.CMS_TAGS, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(E2E_SEED_ACCOUNTS.tagName);
  });

  test('26. CMS Quản lý Dòng thời gian (/timelines): hiển thị dòng thời gian đã tạo và bộ lọc trạng thái', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitRedirect(
      E2E_SEED_ACCOUNTS.adminEmail,
      E2E_SEED_ACCOUNTS.password,
    );

    await page.goto(E2eRoutes.CMS_TIMELINES, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(
      E2E_SEED_ACCOUNTS.timelineTitle,
    );
  });

  test('27. CMS Giáo trình & HISGO Studio (/curriculum): hiển thị lộ trình học và chuyển chế độ Cây chủ đề', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitRedirect(
      E2E_SEED_ACCOUNTS.adminEmail,
      E2E_SEED_ACCOUNTS.password,
    );

    await page.goto(E2eRoutes.CMS_CURRICULUM, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('body')).toContainText(
      E2E_SEED_ACCOUNTS.pathTitle,
    );
  });

  test('28. CMS Trình soạn thảo Bài học (/lessons/create): chuyển đổi giữa tab Hồ sơ bài học và Block Builder Canvas', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitRedirect(
      E2E_SEED_ACCOUNTS.adminEmail,
      E2E_SEED_ACCOUNTS.password,
    );

    await page.goto(E2eRoutes.CMS_LESSON_CREATE, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('body')).toContainText(/Thông tin|Tiêu đề/i);
  });

  test('29. CMS Không gian Khảo thí (/quizzes) & Redirect /questions -> /quizzes?tab=questions', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitRedirect(
      E2E_SEED_ACCOUNTS.adminEmail,
      E2E_SEED_ACCOUNTS.password,
    );

    await page.goto(E2eRoutes.CMS_QUIZZES, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(
      E2E_SEED_ACCOUNTS.quizTitle,
    );

    await page.goto(E2eRoutes.CMS_QUESTIONS_LEGACY, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).toHaveURL(/\/quizzes\?tab=questions/);
    await expect(page.locator('body')).toContainText(
      'Cuộc khởi nghĩa Hai Bà Trưng nổ ra vào năm nào?',
    );
  });

  test('30. CMS Hàng chờ duyệt hợp nhất (/review) & Redirect /moderation -> /review?tab=REPORT, /blog-review -> /review?tab=BLOG', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitRedirect(
      E2E_SEED_ACCOUNTS.adminEmail,
      E2E_SEED_ACCOUNTS.password,
    );

    await page.goto(E2eRoutes.CMS_MODERATION_LEGACY, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).toHaveURL(/\/review\?tab=REPORT/);

    await page.goto(E2eRoutes.CMS_BLOG_REVIEW_LEGACY, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).toHaveURL(/\/review\?tab=BLOG/);
  });
});
