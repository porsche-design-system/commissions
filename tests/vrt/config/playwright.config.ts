import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../specs',
  testMatch: '**.vrt.ts',
  // Maximum time one test can run for.
  timeout: 60000,
  expect: {
    // Maximum time expect() should wait for the condition to be met.
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.011,
      // maxDiffPixels: 100,
      threshold: 0,
      animations: 'disabled',
    },
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}-{projectName}{ext}',
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'off', // 'on-first-retry' causes CI job to get stuck
    viewport: null,
  },
  // Run tests in files in parallel
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : undefined,
  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: 'list',
  // Folder for test artifacts such as screenshots, videos, traces, etc.
  outputDir: '../test-results',
  // https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/deviceDescriptorsSource.json
  projects: [
    {
      name: 'chrome',
      use: devices['Desktop Chrome'],
    },
    {
      name: 'safari',
      use: devices['Desktop Safari'],
    },
    {
      name: 'firefox',
      use: devices['Desktop Firefox'],
    },
    {
      name: 'pixel-7',
      use: devices['Pixel 7'],
    },
    {
      name: 'pixel-7-landscape',
      use: devices['Pixel 7 landscape'],
    },
    {
      name: 'iphone-15',
      use: devices['iPhone 15'],
    },
    {
      name: 'iphone-15-landscape',
      use: devices['iPhone 15 landscape'],
    },
    {
      name: 'ipad-pro-11',
      use: devices['iPad Pro 11'],
    },
    {
      name: 'ipad-pro-11-landscape',
      use: devices['iPad Pro 11 landscape'],
    },
  ],
  webServer: {
    command: 'npm run preview',
    port: 4173,
  },
});
