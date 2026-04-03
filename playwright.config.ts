import { defineConfig, devices } from '@playwright/test'

const isGithubCi = Boolean(process.env.CI)

const isCiLikeRun =
  isGithubCi || process.env.npm_lifecycle_event === 'test:e2e:ci'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCiLikeRun,
  retries: isCiLikeRun ? 2 : 0,
  ...(isCiLikeRun ? { workers: 1 } : {}),
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: isCiLikeRun ? 'pnpm run preview' : 'pnpm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !isGithubCi
  }
})
