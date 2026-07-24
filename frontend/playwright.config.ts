import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    // --mode test picks up .env.test, which blanks VITE_TURNSTILE_SITE_KEY —
    // without it the dev server loads the real site key from .env and the
    // widget attempts a genuine Cloudflare challenge, which never resolves
    // in a headless/automated browser and hangs every form-submit test.
    command: 'npm run start -- --mode test --port 5173',
    port: 5173,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
