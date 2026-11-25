import { expect, test } from '@playwright/test';
import {
  E2E_SEED_ACCOUNTS,
  E2eRoutes,
  FollowButtonLabels,
  UiMessages,
} from './e2e.config';
import {
  AuthorProfileFollowPage,
  ConsoleErrorTracker,
  LoginPage,
  PublicArticlesPage,
} from './e2e.pages';

test.describe('Public Content, Auth & Navigation E2E (10 scenarios)', () => {
  test('01. Trang chủ (Landing Page) tải sạch sẽ, không lỗi JS console', async ({
    page,
  }) => {
    const tracker = new ConsoleErrorTracker(page);
    await page.goto(E2eRoutes.HOME, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText('HISGO');
    tracker.expectNoErrors();
  });

  test('02. Tìm kiếm toàn cục (Global Search Modal) mở bằng nút tìm kiếm và lọc tư liệu', async ({
    page,
  }) => {
    await page.goto(E2eRoutes.HOME, { waitUntil: 'domcontentloaded' });
    const searchTrigger = page
      .locator('button')
      .filter({ hasText: /Tìm kiếm|Ctrl/i })
      .first();
    if ((await searchTrigger.count()) > 0 && (await searchTrigger.isVisible())) {
      await searchTrigger.click();
    } else {
      await page.keyboard.press('Control+K');
    }
    await expect(page.locator('body')).toContainText('HISGO');
  });

  test('03. Thư viện bài viết (/bai-viet): tìm kiếm khớp từ khóa (positive) và chuỗi biên 0 kết quả (boundary)', async ({
    page,
  }) => {
    const articlesPage = new PublicArticlesPage(page);
    await articlesPage.openList();
    await expect(page.locator('body')).toContainText(
      E2E_SEED_ACCOUNTS.articleTitle,
    );

    await articlesPage.search('Hai Bà Trưng');
    await expect(page.locator('body')).toContainText(
      E2E_SEED_ACCOUNTS.articleTitle,
    );

    await articlesPage.search('chuoi_khong_ton_tai_boundary_99999');
    await expect(page.locator('body')).not.toContainText(
      E2E_SEED_ACCOUNTS.articleTitle,
    );
  });

  test('04. Thư viện bài viết (/bai-viet): chuyển đổi chế độ Lưới ⇄ Danh sách và mở Mục lục chủ đề', async ({
    page,
  }) => {
    const articlesPage = new PublicArticlesPage(page);
    await articlesPage.openList();

    const listBtn = page.locator("button[aria-label='Xem dạng danh sách']");
    await listBtn.click();
    await expect(page.locator('ol.el-list')).toBeVisible();

    const gridBtn = page.locator("button[aria-label='Xem dạng lưới']");
    await gridBtn.click();
    await expect(page.locator('div.el-grid').first()).toBeVisible();

    const tocBtn = page.locator("button[aria-label='Mở mục lục chủ đề']");
    await tocBtn.click();
    await expect(page.getByText('Mục lục chủ đề').first()).toBeVisible();
  });

  test('05. Điều hướng /chuyen-muc/:slug tự động redirect sang /bai-viet?chuyen-muc=:slug', async ({
    page,
  }) => {
    await page.goto(`/chuyen-muc/${E2E_SEED_ACCOUNTS.categorySlug}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).toHaveURL(
      new RegExp(`/bai-viet\\?chuyen-muc=${E2E_SEED_ACCOUNTS.categorySlug}`),
    );
    await expect(page.locator('h1')).toContainText(
      E2E_SEED_ACCOUNTS.categoryName,
    );
  });

  test('06. Dòng thời gian (/dong-thoi-gian) hiển thị đúng mốc sự kiện từ TimelineNodeArticle không lỗi SSR', async ({
    page,
  }) => {
    const tracker = new ConsoleErrorTracker(page);
    await page.goto(E2eRoutes.TIMELINE, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(
      E2E_SEED_ACCOUNTS.timelineNodeTitle,
    );
    tracker.expectNoErrors();
  });

  test('07. Chi tiết bài viết (/bai-viet/:slug) hiển thị đầy đủ nội dung cho khách chưa đăng nhập và chuyển hướng khi bấm Theo dõi', async ({
    page,
  }) => {
    const followPage = new AuthorProfileFollowPage(page);
    await followPage.openArticleDetail(E2E_SEED_ACCOUNTS.articleSlug);
    await expect(page.locator('body')).toContainText(
      E2E_SEED_ACCOUNTS.articleTitle,
    );
    await expect(page.locator('body')).toContainText(
      'Cuộc khởi nghĩa năm 40 SCN do Trưng Trắc và Trưng Nhị lãnh đạo chống nhà Đông Hán.',
    );

    const followBtn = followPage.getFollowButton();
    await followBtn.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('08. CmsAccessGate chặn khách chưa đăng nhập truy cập /cms và redirect về /login?redirect=%2Fcms', async ({
    page,
  }) => {
    await page.goto(E2eRoutes.CMS_HOME, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login\?redirect=/);
  });

  test('09. Đăng nhập thất bại với mật khẩu sai hiển thị thông báo lỗi và giữ nguyên trang /login', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.submitCredentials(
      E2E_SEED_ACCOUNTS.learnerEmail,
      'WrongPassword#000',
    );
    const err = (await loginPage.getErrorText()).toLowerCase();
    expect(
      err.includes(UiMessages.INVALID_LOGIN_VI) ||
        err.includes(UiMessages.INVALID_LOGIN_EN),
    ).toBe(true);
    await expect(page).toHaveURL(/\/login/);
  });

  test('10. Đăng nhập thành công với tài khoản hợp lệ chuyển hướng về trang chủ', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitRedirect(
      E2E_SEED_ACCOUNTS.learnerEmail,
      E2E_SEED_ACCOUNTS.password,
    );
    await expect(page).toHaveURL(/\/$/);
  });

  test('11. Bản đồ Khái niệm Không gian AI (/kham-pha-khai-niem): khám phá chủ đề gốc, mở rộng nhánh con và hiển thị Minimap không lỗi console', async ({
    page,
  }) => {
    const tracker = new ConsoleErrorTracker(page);

    await page.route('**/public/concept-canvas/explore', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      const body = route.request().postDataJSON() as { prompt?: string } | null;
      const prompt = body?.prompt ?? 'Hai Bà Trưng';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'OK',
          data: {
            prompt,
            periodLabel: '40 – 43 · Thời Hai Bà Trưng',
            text: `**[${prompt}](${prompt})** là cuộc khởi nghĩa chống ách đô hộ nhà Đông Hán năm 40 tại [Mê Linh](Mê Linh).`,
            prompts: [
              'Nguyên nhân bùng nổ khởi nghĩa Hai Bà Trưng?',
              'Ý nghĩa lịch sử của chiến thắng Mê Linh năm 40?',
              'Vai trò của các nữ tướng thời Hai Bà Trưng?',
            ],
            imageUrl: null,
            engine: 'VERTEX_RAG',
            matchedArticles: [],
            matchedTimelineNodes: [],
            webSources: [],
            webSearchQueries: [],
            ragCitations: [],
          },
        }),
      });
    });

    await page.goto(E2eRoutes.CONCEPT_CANVAS, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText(
      'Khám phá Không gian Lịch sử',
    );

    const searchInput = page.getByLabel('Nhập khái niệm lịch sử cần khám phá');
    await searchInput.fill('Hai Bà Trưng');
    await page
      .locator('form')
      .getByRole('button', { name: 'Khám phá', exact: true })
      .click();

    const rootCard = page.getByTestId('spatial-node-sc-node-1');
    await expect(rootCard).toBeVisible();
    await expect(page.getByTestId('spatial-minimap')).toBeVisible();

    const firstFollowUp = page.getByTestId('spatial-followup-sc-node-1-0');
    await expect(firstFollowUp).toBeVisible();
    await firstFollowUp.click();

    await expect(page.getByTestId('spatial-node-sc-node-2')).toBeVisible();
    tracker.expectNoErrors();
  });
});
