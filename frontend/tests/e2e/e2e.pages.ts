import { expect, type Page } from '@playwright/test';
import {
  AccountTabLabels,
  E2eRoutes,
  FollowButtonLabels,
} from './e2e.config';

export class ConsoleErrorTracker {
  private readonly errors: string[] = [];

  constructor(page: Page) {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          text.includes('favicon.ico') ||
          text.includes('/_next/hmr') ||
          text.includes('Failed to load resource: the server responded with a status of 401') ||
          text.includes('Failed to load resource: the server responded with a status of 403')
        ) {
          return;
        }
        this.errors.push(text);
      }
    });
    page.on('pageerror', (err) => {
      this.errors.push(err.message);
    });
  }

  getErrors(): string[] {
    return [...this.errors];
  }

  expectNoErrors(): void {
    expect(this.errors).toEqual([]);
  }
}

export class LoginPage {
  constructor(private readonly page: Page) {}

  async open(redirect?: string): Promise<void> {
    const url = redirect
      ? `${E2eRoutes.LOGIN}?redirect=${encodeURIComponent(redirect)}`
      : E2eRoutes.LOGIN;
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  async submitCredentials(email: string, password: string): Promise<void> {
    const emailInput = this.page.locator('#email');
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.click();
    await emailInput.fill(email);

    const passwordInput = this.page.locator('#password');
    await passwordInput.click();
    await passwordInput.fill(password);

    await this.page.locator("form button[type='submit']").click();
  }

  async loginAndWaitRedirect(email: string, password: string): Promise<void> {
    await this.open();
    await this.submitCredentials(email, password);
    try {
      await expect(this.page).not.toHaveURL(/\/login/, { timeout: 8000 });
    } catch {
      await this.open();
      await this.submitCredentials(email, password);
      await expect(this.page).not.toHaveURL(/\/login/);
    }
  }

  async getErrorText(): Promise<string> {
    const errorBox = this.page.locator('form div.text-rose-700');
    await errorBox.waitFor({ state: 'visible' });
    return (await errorBox.innerText()).trim();
  }
}

export class PublicArticlesPage {
  constructor(private readonly page: Page) {}

  async openList(): Promise<void> {
    await this.page.goto(E2eRoutes.ARTICLES, { waitUntil: 'networkidle' });
    await this.page
      .locator("input[aria-label='Tìm bài viết lịch sử']")
      .waitFor({ state: 'visible' });
  }

  async search(query: string): Promise<void> {
    const clearBtn = this.page.locator("button[aria-label='Xóa tìm kiếm']");
    if ((await clearBtn.count()) > 0 && (await clearBtn.first().isVisible())) {
      await clearBtn.first().click();
    }
    const input = this.page.locator("input[aria-label='Tìm bài viết lịch sử']");
    await input.click();
    await input.fill(query);
  }
}

export class AuthorProfileFollowPage {
  constructor(private readonly page: Page) {}

  async openArticleDetail(slug: string): Promise<void> {
    await this.page.goto(`${E2eRoutes.ARTICLES}/${slug}`, {
      waitUntil: 'networkidle',
    });
  }

  async openMemberProfile(username: string): Promise<void> {
    await this.page.goto(`${E2eRoutes.COMMUNITY_MEMBER}/${username}`, {
      waitUntil: 'networkidle',
    });
  }

  getFollowButton() {
    return this.page
      .locator('button')
      .filter({
        hasText: new RegExp(
          `(${FollowButtonLabels.FOLLOW}|${FollowButtonLabels.FOLLOWING})`,
        ),
      })
      .first();
  }

  async toggleFollowAndWaitLabel(expectedLabel: FollowButtonLabels): Promise<void> {
    const btn = this.getFollowButton();
    await btn.waitFor({ state: 'visible' });
    await btn.click();
    await expect(
      this.page.locator('button').filter({ hasText: expectedLabel }).first(),
    ).toBeVisible();
  }
}

export class PracticeQuizPage {
  constructor(private readonly page: Page) {}

  async openPractice(): Promise<void> {
    await this.page.goto(E2eRoutes.PRACTICE, { waitUntil: 'domcontentloaded' });
  }

  async selectQuizByTitle(title: string): Promise<void> {
    const card = this.page.locator('button').filter({ hasText: title }).first();
    await card.waitFor({ state: 'visible' });
    await card.click();
  }

  async startQuiz(): Promise<void> {
    const startBtn = this.page
      .locator('button')
      .filter({ hasText: 'Bắt đầu làm bài' })
      .first();
    await startBtn.waitFor({ state: 'visible' });
    await startBtn.click();
  }

  async chooseAnswerOption(optionText: string): Promise<void> {
    const opt = this.page
      .locator('button, label')
      .filter({ hasText: optionText })
      .first();
    await opt.waitFor({ state: 'visible' });
    await opt.click();
  }

  async submitQuiz(): Promise<void> {
    const submitBtn = this.page
      .locator('button')
      .filter({ hasText: 'Nộp bài & Xem điểm' })
      .first();
    await submitBtn.waitFor({ state: 'visible' });
    await submitBtn.click();
  }
}

export class AccountPage {
  constructor(private readonly page: Page) {}

  async openAccount(): Promise<void> {
    await this.page.goto(E2eRoutes.ACCOUNT, { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByText(AccountTabLabels.PROFILE).first()).toBeVisible();
  }

  async switchTab(label: AccountTabLabels): Promise<void> {
    const btn = this.page.locator('button').filter({ hasText: label }).first();
    await btn.waitFor({ state: 'visible' });
    await btn.click();
  }
}
