import { defineConfig, devices } from '@playwright/test'

// Target under test. Defaults to staging; point BASE_URL at the React build later and the
// same specs become the parity gate. A local `nuxt generate` served on a port also works.
const baseURL = process.env.BASE_URL || 'https://staging.hivesigner.com'

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
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
