import { expect, test } from '@playwright/test';
import {
  AccountTabLabels,
  E2E_SEED_ACCOUNTS,
  E2eRoutes,
  FollowButtonLabels,
  UiMessages,
} from './e2e.config';
import {
  AccountPage,
  AuthorProfileFollowPage,
  ConsoleErrorTracker,
  LoginPage,
  PracticeQuizPage,
} from './e2e.pages';

test.describe('Learner Journeys, Curriculum, Quiz & Study Tools E2E (10 scenarios)', () => {
  test('11. Theo dõi tác giả (Author Follow) đồng bộ từ trang bài viết sang hồ sơ thành viên, bền vững sau F5 và bỏ theo dõi', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitRedirect(
      E2E_SEED_ACCOUNTS.learnerEmail,
      E2E_SEED_ACCOUNTS.password,
    );

    const followPage = new AuthorProfileFollowPage(page);
    await followPage.openArticleDetail(E2E_SEED_ACCOUNTS.articleSlug);
    await expect(page.locator('body')).toContainText(
      E2E_SEED_ACCOUNTS.articleTitle,
    );

    await followPage.toggleFollowAndWaitLabel(FollowButtonLabels.FOLLOWING);

    await followPage.openMemberProfile(E2E_SEED_ACCOUNTS.authorUsername);
    await expect(
      page.locator('button').filter({ hasText: FollowButtonLabels.FOLLOWING }).first(),
    ).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(
      page.locator('button').filter({ hasText: FollowButtonLabels.FOLLOWING }).first(),
    ).toBeVisible();

    await followPage.toggleFollowAndWaitLabel(FollowButtonLabels.FOLLOW);
  });

  test('12. Luyện tập (/luyen-tap): chọn đề theo chủ đề, làm bài và nộp bài đạt 100%', async ({
    page,
  }) => {
    const quizPage = new PracticeQuizPage(page);
    await quizPage.openPractice();
    await quizPage.selectQuizByTitle(E2E_SEED_ACCOUNTS.quizTitle);
    await quizPage.startQuiz();
    await quizPage.chooseAnswerOption('Năm 40 SCN');
    await quizPage.submitQuiz();
    await expect(page.locator('body')).toContainText(UiMessages.QUIZ_SUBMITTED);
    await expect(page.locator('body')).toContainText('100%');
  });

  test('13. Chương trình học (/chuong-trinh-hoc): hiển thị lộ trình, lọc theo chủ đề và tìm kiếm bài học trong thư viện', async ({
    page,
  }) => {
    const tracker = new ConsoleErrorTracker(page);
    await page.goto(E2eRoutes.CURRICULUM, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(
      E2E_SEED_ACCOUNTS.pathTitle,
    );
    await expect(page.locator('body')).toContainText(
      E2E_SEED_ACCOUNTS.lessonTitle,
    );

    const topicBtn = page
      .locator('button')
      .filter({ hasText: E2E_SEED_ACCOUNTS.topicName })
      .first();
    await topicBtn.click();
    await expect(page.locator('body')).toContainText(
      E2E_SEED_ACCOUNTS.pathTitle,
    );

    const searchInput = page.locator(
      "input[placeholder='Tìm lộ trình, chương, bài học...']",
    );
    await searchInput.fill('chuoi_khong_khop_lo_trinh_9999');
    await expect(page.locator('body')).toContainText(
      'Chưa tìm thấy lộ trình phù hợp',
    );
    tracker.expectNoErrors();
  });

  test('14. Đọc bài học (/bai-hoc/:slug): khách chưa đăng nhập thấy cổng yêu cầu đăng nhập (LOGIN_REQUIRED)', async ({
    page,
  }) => {
    await page.goto(`/bai-hoc/${E2E_SEED_ACCOUNTS.lessonSlug}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('body')).toContainText(/Đăng nhập/i);
  });

  test('15. Ghi danh lộ trình học (/chuong-trinh-hoc) và mở đọc nội dung bài học (/bai-hoc/:slug)', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitRedirect(
      E2E_SEED_ACCOUNTS.learnerEmail,
      E2E_SEED_ACCOUNTS.password,
    );

    await page.goto(E2eRoutes.CURRICULUM, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(
      E2E_SEED_ACCOUNTS.pathTitle,
    );

    const enrollBtn = page
      .locator('button')
      .filter({ hasText: 'Đăng ký học (miễn phí)' })
      .first();
    if ((await enrollBtn.count()) > 0 && (await enrollBtn.isVisible())) {
      await enrollBtn.click();
    }

    await expect(
      page
        .locator('a')
        .filter({ hasText: /Vào bài đầu tiên|Tiếp tục học/ })
        .first(),
    ).toBeVisible();

    await page.goto(`/bai-hoc/${E2E_SEED_ACCOUNTS.lessonSlug}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('body')).toContainText(
      E2E_SEED_ACCOUNTS.lessonTitle,
    );
    await expect(page.locator('body')).toContainText(
      'Bối cảnh khởi nghĩa Mê Linh',
    );
  });

  test('16. Cộng đồng (/cong-dong): hiển thị bảng tin sử học và bài đăng chia sẻ đã xuất bản', async ({
    page,
  }) => {
    const tracker = new ConsoleErrorTracker(page);
    await page.goto(E2eRoutes.COMMUNITY, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(
      E2E_SEED_ACCOUNTS.blogTitle,
    );
    tracker.expectNoErrors();
  });

  test('17. Redirect /cong-dong/ca-nhan tự động chuyển hướng sang /cong-dong/thanh-vien/me', async ({
    page,
  }) => {
    await page.goto('/cong-dong/ca-nhan', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/cong-dong\/thanh-vien\/me/);
  });

  test('18. Trang Tài khoản (/tai-khoan): chuyển qua toàn bộ 7 tab học tập & bảo mật không lỗi JS console', async ({
    page,
  }) => {
    const tracker = new ConsoleErrorTracker(page);
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitRedirect(
      E2E_SEED_ACCOUNTS.learnerEmail,
      E2E_SEED_ACCOUNTS.password,
    );

    const accountPage = new AccountPage(page);
    await accountPage.openAccount();

    for (const tab of [
      AccountTabLabels.LEARNING,
      AccountTabLabels.GAMIFICATION,
      AccountTabLabels.BOOKMARKS,
      AccountTabLabels.FLASHCARDS,
      AccountTabLabels.MINDMAPS,
      AccountTabLabels.SECURITY,
      AccountTabLabels.PROFILE,
    ]) {
      await accountPage.switchTab(tab);
    }

    tracker.expectNoErrors();
  });

  test('19. Công cụ Thẻ ghi nhớ (Flashcards) trong /tai-khoan: hiển thị giao diện quản lý bộ thẻ', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitRedirect(
      E2E_SEED_ACCOUNTS.learnerEmail,
      E2E_SEED_ACCOUNTS.password,
    );

    const accountPage = new AccountPage(page);
    await accountPage.openAccount();
    await accountPage.switchTab(AccountTabLabels.FLASHCARDS);
    await expect(page.locator('body')).toContainText(/Thẻ ghi nhớ|Bộ thẻ/i);
  });

  test('20. Học viên thường (role USER) truy cập /cms bị CmsAccessGate chặn quyền truy cập', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitRedirect(
      E2E_SEED_ACCOUNTS.learnerEmail,
      E2E_SEED_ACCOUNTS.password,
    );

    await page.goto(E2eRoutes.CMS_ARTICLES, { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText(
      'Khu vực dành cho nhân sự biên soạn',
    );
  });
});
