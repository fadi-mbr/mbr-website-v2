import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  retries: 0,
  use: {
    launchOptions: { args: ['--disable-gpu'] },
    baseURL: process.env.STAGING_URL || 'http://127.0.0.1:3005', headless: true,
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? { 'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET } : {},
  },
  webServer: process.env.STAGING_URL ? undefined : {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3005',
    url: 'http://127.0.0.1:3005',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      VERCEL_ENV: 'development',
      MBR_RUNTIME_ENV: 'staging',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
});
