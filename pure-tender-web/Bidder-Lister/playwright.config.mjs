import { defineConfig } from '@playwright/test';
const existingFrontend = process.env.TENDERBLOCK_TEST_FRONTEND_URL;
const origin = process.env.TENDERBLOCK_BACKEND_ORIGIN || 'http://127.0.0.1:8081';
export default defineConfig({
  testDir: './tests/integration',
  testMatch: '**/*.spec.mjs',
  workers: 1,
  fullyParallel: false,
  timeout: 45000,
  expect: { timeout: 8000 },
  reporter: [['list'], ['json', { outputFile: 'test-results/integration-results.json' }]],
  use: {
    baseURL: existingFrontend || 'http://127.0.0.1:5181',
    headless: true,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {},
    screenshot: 'only-on-failure',
  },
  webServer: existingFrontend ? undefined : {
    command: 'npm run dev -- --host 127.0.0.1 --port 5181 --strictPort',
    url: 'http://127.0.0.1:5181',
    reuseExistingServer: false,
    env: { VITE_DEMO_MODE: 'false', VITE_BACKEND_CONTRACT: 'team', VITE_BACKEND_TARGET: origin, VITE_PROPOSAL_MAX_MB: '1' },
  },
});
