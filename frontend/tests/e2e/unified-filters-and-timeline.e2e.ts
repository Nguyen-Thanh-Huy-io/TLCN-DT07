import { expect, test } from '@playwright/test';
import { E2eRoutes } from './e2e.config';
import { ConsoleErrorTracker } from './e2e.pages';

enum TimelineTestRoutes {
  PERIOD_LEAF = '/giai-doan/khang-chien-chong-phap-1858-1896',
  PERIOD_CONTAINER = '/giai-doan/lich-su-can-hien-dai',
}

enum UiSelectors {
  FILTER_BAR = '.sk-filter-bar',
  SEARCH_FIELD = '.sk-search-field',
  FLOATING_TOC_BTN = '.sk-toc-floating-side-tab',
  ACTIVE_FILTERS = '.sk-active-filters',
  RULER_TRACK = '.sk-museum-ruler-track',
  RULER_OPTION = '.sk-museum-ruler-track [role="option"]',
  HORIZONTAL_PANEL = '.sk-horizontal-panel',
  MODAL_SHEET = '.sk-sheet',
  PD_RULER_TICKS = '.pd-ruler-ticks span',
  PD_STREAM_TOOLBAR = '.pd-stream-toolbar',
  PD_ACTIVE_BAR = '.pd-active-detail-bar',
  PD_ACTIVE_PILL = '.pd-active-detail-pill',
  PD_CHIP_CLEAR = '.pd-active-detail-bar .pd-chip-clear',
}

test.describe('Unified Filters, CMS Hierarchy Timeline & Period Detail E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Chặn tài nguyên ảnh/font ngoại mạng (Wikimedia/CDN) khi chạy offline/CI để tránh nhiễu DNS
    await page.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/i, (route) =>
      route.fulfill({ status: 204, body: '' }),
    );
  });

  test('01. Trang chủ (/) sắp xếp đúng thứ tự Lịch sử Việt Nam đứng trước Lịch sử Thế giới theo displayOrder CMS', async ({
    page,
  }) => {
    const tracker = new ConsoleErrorTracker(page);
    const res = await page.goto(E2eRoutes.HOME, { waitUntil: 'networkidle' });
    expect(res?.status()).toBe(200);

    const bodyText = await page.locator('body').innerText();
    const vnIdx = bodyText.indexOf('Lịch sử Việt Nam');
    const worldIdx = bodyText.indexOf('Lịch sử & Văn minh Thế giới');
    expect(vnIdx).toBeGreaterThanOrEqual(0);
    if (worldIdx >= 0) {
      expect(vnIdx).toBeLessThan(worldIdx);
    }
    tracker.expectNoErrors();
  });

  test('02. Kho tư liệu (/bai-viet): không lặp nút Mục lục trên thanh lọc, ẩn nút nổi khi mở Bộ lọc, lọc Chuyên mục con + Tag & phân trang 48', async ({
    page,
  }) => {
    const tracker = new ConsoleErrorTracker(page);
    const res = await page.goto(E2eRoutes.ARTICLES, { waitUntil: 'networkidle' });
    expect(res?.status()).toBe(200);

    // Không có nút Mục lục dư thừa bên trong thanh .sk-filter-bar
    await expect(
      page.locator(UiSelectors.FILTER_BAR).getByRole('button', { name: /Mục lục/i }),
    ).toHaveCount(0);

    const floatingToc = page.locator("button[aria-label='Mở mục lục chủ đề']");
    await expect(floatingToc).toBeVisible();

    // Khi mở Bộ lọc, nút Mục lục nổi phải tự ẩn
    await page.locator(UiSelectors.FILTER_BAR).getByRole('button', { name: /Bộ lọc/i }).click();
    await expect(floatingToc).toHaveCount(0);

    // Chọn chuyên mục gốc có chuyên mục con (nếu DB đầy đủ) rồi áp dụng
    const firstRootChip = page.locator('.sk-fs-dialog .sk-fs-chip').first();
    await expect(firstRootChip).toBeVisible();
    await firstRootChip.click();

    const applyBtn = page.locator('.sk-fs-apply');
    await applyBtn.click();
    await expect(page.locator(UiSelectors.ACTIVE_FILTERS)).toBeVisible();

    // Đặt lại bộ lọc và đổi kích thước trang sang 48 (nếu có nhiều trang)
    const resetLink = page.locator('.el-reset-link');
    if ((await resetLink.count()) > 0) {
      await resetLink.click();
    }

    const pageSizeSelect = page.locator('select[aria-label*="Số bài mỗi trang"], .el-pagination select').first();
    if ((await pageSizeSelect.count()) > 0 && (await pageSizeSelect.isVisible())) {
      await pageSizeSelect.selectOption('48');
      await expect(pageSizeSelect).toHaveValue('48');
    }

    tracker.expectNoErrors();
  });

  test('03. Dòng thời gian (/dong-thoi-gian): Trục ngang ảo hóa < 35 node DOM, mở Hồ sơ dấu mốc mượt mà không đè nút Mục lục, kết hợp chip Mục lục + Bộ lọc', async ({
    page,
  }) => {
    const tracker = new ConsoleErrorTracker(page);
    const res = await page.goto(E2eRoutes.TIMELINE, { waitUntil: 'networkidle' });
    expect(res?.status()).toBe(200);

    // Không lặp nút Mục lục trong thanh công cụ
    await expect(
      page.locator(UiSelectors.FILTER_BAR).getByRole('button', { name: /Mục lục/i }),
    ).toHaveCount(0);
    await expect(page.locator(UiSelectors.FLOATING_TOC_BTN)).toBeVisible();

    // Mở Bộ lọc -> nút Mục lục nổi tự ẩn
    await page.locator(UiSelectors.FILTER_BAR).getByRole('button', { name: /Bộ lọc/i }).click();
    await expect(page.locator('.sk-fs-dialog')).toBeVisible();
    await expect(page.locator(UiSelectors.FLOATING_TOC_BTN)).toHaveCount(0);
    await page.locator('.sk-fs-close').click();
    await expect(page.locator(UiSelectors.FLOATING_TOC_BTN)).toBeVisible();

    // Chuyển sang Trục ngang -> kiểm tra ảo hóa DOM (< 35 thẻ mốc dù tổng có hàng trăm mốc)
    await page.getByRole('button', { name: /Trục ngang/i }).click();
    await expect(page.locator(UiSelectors.RULER_TRACK)).toBeVisible();
    const mountedOptionCount = await page.locator(UiSelectors.RULER_OPTION).count();
    expect(mountedOptionCount).toBeGreaterThan(0);
    expect(mountedOptionCount).toBeLessThan(35);

    const nextRulerBtn = page.getByRole('button', { name: /Mốc tiếp theo trên thước/i });
    if (await nextRulerBtn.isEnabled()) {
      await nextRulerBtn.click();
    }

    // Mở Hồ sơ dấu mốc bên phải -> không đơ GPU, nút Mục lục nổi tự ẩn không đè chữ
    const firstCardInPanel = page
      .locator(`${UiSelectors.HORIZONTAL_PANEL} .sk-event-card`)
      .first();
    if ((await firstCardInPanel.count()) > 0) {
      await firstCardInPanel.click();
      await expect(page.locator(UiSelectors.MODAL_SHEET)).toBeVisible();
      await expect(page.locator(UiSelectors.FLOATING_TOC_BTN)).toHaveCount(0);

      const nextDrawerBtn = page
        .locator(UiSelectors.MODAL_SHEET)
        .getByRole('button', { name: /Tiếp theo|Sau/i })
        .first();
      if ((await nextDrawerBtn.count()) > 0 && (await nextDrawerBtn.isEnabled())) {
        await nextDrawerBtn.click();
      }

      await page.locator(`${UiSelectors.MODAL_SHEET} .sk-modal-heading button`).click();
      await expect(page.locator(UiSelectors.MODAL_SHEET)).toHaveCount(0);
    }

    // Quay về Trục dọc -> chọn 1 mục trong Mục lục -> chỉ sinh đúng 1 chip "Mục lục: ..." và thanh tìm kiếm vẫn rộng
    await page.getByRole('button', { name: /Trục dọc/i }).click();
    await page.locator(UiSelectors.FLOATING_TOC_BTN).click();
    const firstTocItem = page.locator('.sk-toc-drawer .sk-toc-body button.sk-tree-parent').first();
    if ((await firstTocItem.count()) > 0) {
      await firstTocItem.click();
      const tocChips = page
        .locator(`${UiSelectors.ACTIVE_FILTERS} button`)
        .filter({ hasText: /^Mục lục:/ });
      await expect(tocChips).toHaveCount(1);

      const searchBox = await page.locator(UiSelectors.SEARCH_FIELD).boundingBox();
      expect(searchBox?.width ?? 0).toBeGreaterThan(300);
    }

    tracker.expectNoErrors();
  });

  test('04. Chi tiết giai đoạn (/giai-doan/[slug]): TimeRuler giới hạn đúng niên đại, không hở khoảng trắng 100vh, nút Bỏ lọc căn ngang inline-flex', async ({
    page,
  }) => {
    const tracker = new ConsoleErrorTracker(page);
    const res = await page.goto(TimelineTestRoutes.PERIOD_LEAF, {
      waitUntil: 'networkidle',
    });
    if (res?.status() === 404) {
      test.skip(true, 'DB môi trường hiện tại không có giai đoạn khang-chien-chong-phap-1858-1896');
      return;
    }
    expect(res?.status()).toBe(200);

    // 1. Kiểm tra TimeRuler không chứa mốc ngoại lai 1650 hoặc 2011
    const tickTexts = await page.locator(UiSelectors.PD_RULER_TICKS).allInnerTexts();
    for (const t of tickTexts) {
      expect(t).not.toContain('1650');
      expect(t).not.toContain('2011');
    }

    // 2. Khoảng cách từ thanh công cụ .pd-stream-toolbar xuống danh sách bên dưới không bị hở 100vh
    const toolbar = page.locator(UiSelectors.PD_STREAM_TOOLBAR);
    await toolbar.scrollIntoViewIfNeeded();
    const gapPx = await toolbar.evaluate((el) => {
      const next = el.nextElementSibling as HTMLElement | null;
      if (!next) return 0;
      return Math.round(next.getBoundingClientRect().top - el.getBoundingClientRect().bottom);
    });
    expect(gapPx).toBeLessThan(80);

    // 3. Mở Bộ lọc -> chọn 1 chuyên mục -> kiểm tra pill không bị cắt chữ & nút "× Bỏ lọc" nằm ngang trên 1 hàng
    await toolbar.getByRole('button', { name: /Bộ lọc/i }).click();
    const catChip = page
      .locator('.sk-fs-dialog .sk-fs-chip')
      .filter({ hasText: /Nhân vật lịch sử/i })
      .first();
    const targetChip =
      (await catChip.count()) > 0
        ? catChip
        : page.locator('.sk-fs-dialog .sk-fs-chip').first();
    await targetChip.click();
    await page.locator('.sk-fs-apply').click();

    const activePill = page.locator(UiSelectors.PD_ACTIVE_PILL).first();
    await expect(activePill).toBeVisible();
    if ((await catChip.count()) > 0) {
      await expect(activePill).toContainText('Nhân vật lịch sử');
    }

    const clearBtn = page.locator(UiSelectors.PD_CHIP_CLEAR);
    await expect(clearBtn).toBeVisible();
    const clearDisplay = await clearBtn.evaluate((el) => getComputedStyle(el).display);
    // Trong flex container (.pd-active-detail-bar), CSS spec chuẩn hóa inline-flex thành flex
    expect(['flex', 'inline-flex']).toContain(clearDisplay);

    const iconAndTextAligned = await clearBtn.evaluate((el) => {
      const svg = el.querySelector('svg');
      if (!svg) return true;
      const btnRect = el.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      // Nếu xếp ngang trên 1 dòng, chiều cao nút phải gọn (< 36px) và icon nằm lệch trái tâm nút
      return btnRect.height <= 36 && svgRect.right < btnRect.right - 20;
    });
    expect(iconAndTextAligned).toBe(true);

    await clearBtn.click();
    await expect(page.locator(UiSelectors.PD_ACTIVE_BAR)).toHaveCount(0);

    tracker.expectNoErrors();
  });

  test('05. Thời kỳ cha 0-node (/giai-doan/lich-su-can-hien-dai): hiển thị danh sách giai đoạn con theo thứ tự CMS không lỗi runtime', async ({
    page,
  }) => {
    const tracker = new ConsoleErrorTracker(page);
    const res = await page.goto(TimelineTestRoutes.PERIOD_CONTAINER, {
      waitUntil: 'networkidle',
    });
    if (res?.status() === 404) {
      test.skip(true, 'DB môi trường hiện tại không có thời kỳ lich-su-can-hien-dai');
      return;
    }
    expect(res?.status()).toBe(200);
    await expect(page.locator('.pd-stages li').first()).toBeVisible();
    tracker.expectNoErrors();
  });
});
