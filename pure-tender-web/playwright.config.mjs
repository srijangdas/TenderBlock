import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 30000,
  retries: 0,
  workers: 3,
  reporter: [['list'], ['json', {outputFile:'test-results/results.json'}]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName:'chromium',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {},
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {command:'npm run dev -- --host 127.0.0.1',url:'http://127.0.0.1:5173',reuseExistingServer:!process.env.CI},
    {command:'npm run dev:demo -- --host 127.0.0.1 --port 5176',url:'http://127.0.0.1:5176',reuseExistingServer:!process.env.CI},
  ],
});
