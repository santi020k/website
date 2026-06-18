import { defineConfig, devices } from '@playwright/test'

const isGithubCi = Boolean(process.env.CI)

const isCiLikeRun =
  isGithubCi ||
  process.env.npm_lifecycle_event === 'test:e2e:ci' ||
  process.env.npm_lifecycle_event === 'test:e2e:ci:stable'

const isSnapshotUpdateRun = process.argv.includes('--update-snapshots')
const isSkipBuildRun = Boolean(process.env.SKIP_BUILD)
const shouldRunChromiumOnly = process.env.PW_ONLY_CHROMIUM === 'true'
const chromiumChannel = process.env.PW_CHROMIUM_CHANNEL
const shouldBuildPreviewServer = (!isCiLikeRun && !isSkipBuildRun) || isSnapshotUpdateRun
const shouldRunSerially = isCiLikeRun
const previewHost = '127.0.0.1'
const previewPort = 4173
const previewURL = `http://${previewHost}:${previewPort}`

const previewServerCommand = shouldBuildPreviewServer ?
  `pnpm run build && pnpm run preview --host ${previewHost} --port ${previewPort}` :
  `pnpm run preview --host ${previewHost} --port ${previewPort}`

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixels: 3_000
    }
  },
  fullyParallel: !isCiLikeRun,
  forbidOnly: isCiLikeRun,
  retries: isCiLikeRun ? 2 : 0,
  workers: shouldRunSerially ? 1 : '50%',
  reporter: 'html',
  use: {
    baseURL: previewURL,
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
    launchOptions: {
      // Workaround for occasional CI sandbox/driver instability.
      args: ['--disable-gpu', '--disable-software-rasterizer']
    },
    trace: 'on-first-retry'
  },
  projects: shouldRunChromiumOnly ?
    [
      {
        name: 'chromium',
        use: {
          ...devices['Desktop Chrome'],
          ...(chromiumChannel ? { channel: chromiumChannel } : {})
        }
      }
    ] :
    (isCiLikeRun || isSnapshotUpdateRun) ?
      [
        {
          name: 'chromium',
          use: {
            ...devices['Desktop Chrome'],
            ...(chromiumChannel ? { channel: chromiumChannel } : {})
          }
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
          use: {
            ...devices['Desktop Chrome'],
            ...(chromiumChannel ? { channel: chromiumChannel } : {})
          }
        }
      ],
  webServer: {
    command: previewServerCommand,
    timeout: 600_000,
    url: previewURL,
    reuseExistingServer: !isCiLikeRun
  }
})
