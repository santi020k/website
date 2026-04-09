import { defineConfig, devices } from '@playwright/test'

const isGithubCi = Boolean(process.env.CI)

const isCiLikeRun =
  isGithubCi || process.env.npm_lifecycle_event === 'test:e2e:ci'

const isSnapshotUpdateRun = process.argv.includes('--update-snapshots')
const shouldBuildPreviewServer = !isCiLikeRun || isSnapshotUpdateRun
const shouldRunSerially = isCiLikeRun || isSnapshotUpdateRun

const previewServerCommand = shouldBuildPreviewServer ?
  'pnpm run build && pnpm run preview' :
  'pnpm run preview'

export default defineConfig({
  testDir: './tests',
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 3_000
    }
  },
  fullyParallel: true,
  forbidOnly: isCiLikeRun,
  retries: isCiLikeRun ? 2 : 0,
  ...(shouldRunSerially ? { workers: 1 } : {}),
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
    command: previewServerCommand,
    timeout: 600_000,
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI
  }
})
