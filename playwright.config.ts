import { defineConfig, devices } from '@playwright/test'

const isGithubCi = Boolean(process.env.CI)

const isCiLikeRun =
  isGithubCi || process.env.npm_lifecycle_event === 'test:e2e:ci'

const isSnapshotUpdateRun = process.argv.includes('--update-snapshots')
const shouldBuildPreviewServer = !isCiLikeRun || isSnapshotUpdateRun
const shouldRunSerially = isCiLikeRun
const previewHost = '127.0.0.1'
const previewPort = 4173
const previewURL = `http://${previewHost}:${previewPort}`

const previewServerCommand = shouldBuildPreviewServer ?
  `pnpm run build && pnpm run preview --host ${previewHost} --port ${previewPort}` :
  `pnpm run preview --host ${previewHost} --port ${previewPort}`

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
  workers: shouldRunSerially ? 1 : '50%',
  reporter: 'html',
  use: {
    baseURL: previewURL,
    trace: 'on-first-retry'
  },
  projects: (isCiLikeRun || isSnapshotUpdateRun) ?
    [
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
      },
      {
        name: 'Mobile Chrome',
        use: { ...devices['Pixel 7'] }
      },
      {
        name: 'Mobile Safari',
        use: { ...devices['iPhone 14'] }
      }
    ] :
    [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] }
      }
    ],
  webServer: {
    command: previewServerCommand,
    timeout: 600_000,
    url: previewURL,
    reuseExistingServer: !isCiLikeRun
  }
})
