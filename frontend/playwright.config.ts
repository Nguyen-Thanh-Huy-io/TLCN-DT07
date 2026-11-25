import { defineConfig, devices } from '@playwright/test';

const FE_BASE_URL = (process.env.E2E_FE_URL || 'http://127.0.0.1:3010').replace(/\/+$/, '');

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 45_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'coverage/e2e-report.json' }]],
  use: {
    baseURL: FE_BASE_URL,
    headless: process.env.E2E_HEADLESS !== '0',
    viewport: { width: 1440, height: 1080 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      channel: 'chrome',
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-proxy-server'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
