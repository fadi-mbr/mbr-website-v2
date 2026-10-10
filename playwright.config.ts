import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  retries: 0,
  use: { baseURL: 'http://localhost:3005', headless: true },
  webServer: {
    command: 'npm run dev -- --port 3005',
    url: 'http://localhost:3005',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      VERCEL_ENV: 'development',
      MBR_RUNTIME_ENV: 'staging',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
});
