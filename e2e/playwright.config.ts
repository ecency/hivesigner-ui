import { defineConfig, devices } from '@playwright/test';

// Target under test. Defaults to staging; CI points BASE_URL at the image built for a pull
// request (see .github/workflows/ui-ci.yml) and at staging after a deploy.
const baseURL = process.env.BASE_URL || 'https://staging.hivesigner.com';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // shared staging target; keep request pressure modest
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    headless: true,
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
    // Use the full Chromium binary already on the host. Override with CHROME_PATH elsewhere, or
    // remove this block after `npx playwright install chromium` on a fresh machine.
    launchOptions: process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : undefined,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // The leave during an unlock, in Safari's engine: WebKit delivers a click
    // made while the page is busy later than the others do (see leave.spec).
    // CI only: WebKit needs system libraries a dev machine may not have.
    ...(process.env.CI
      ? [
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
            testMatch: /leave\.spec\.ts/,
          },
        ]
      : []),
  ],
});
