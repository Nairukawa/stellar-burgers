import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.pl.tsx',
  workers: 1,
  timeout: 30_000,

  expect: {
    timeout: 10_000
  },

  reporter: 'list',

  use: {
    baseURL: 'http://localhost:4000',
    serviceWorkers: 'block',
    trace: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ],

  webServer: {
    command: 'npm start -- --no-open',
    url: 'http://localhost:4000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
