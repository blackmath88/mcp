import { defineConfig } from '@playwright/test'

const url = 'http://127.0.0.1:4174'

export default defineConfig({
  testDir: './tests/browser',
  outputDir: './test-output/browser',
  use: {
    baseURL: url,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {},
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4174 --strictPort',
    url,
    timeout: 30_000,
  },
})
