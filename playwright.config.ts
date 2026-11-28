import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4391',
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 4391',
    url: 'http://127.0.0.1:4391',
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
