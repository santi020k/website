import { defineConfig, devices } from '@playwright/test'

const isGithubCi = Boolean(process.env.CI)

const isCiLikeRun =
  isGithubCi ||
  process.env.npm_lifecycle_event === 'test:e2e:ci' ||
  process.env.npm_lifecycle_event === 'test:e2e:ci:stable'

// Workers do not retain the coordinator's CLI arguments. Preserve the project matrix.
const isSnapshotUpdateRun = process.argv.includes('--update-snapshots') || process.env.PW_UPDATE_SNAPSHOTS === 'true'

if (isSnapshotUpdateRun) process.env.PW_UPDATE_SNAPSHOTS = 'true'

const isSkipBuildRun = Boolean(process.env.SKIP_BUILD)
const shouldRunChromiumOnly = process.env.PW_ONLY_CHROMIUM === 'true'
const chromiumChannel = process.env.PW_CHROMIUM_CHANNEL
const shouldBuildPreviewServer = (!isCiLikeRun && !isSkipBuildRun) || isSnapshotUpdateRun
// CI-like runs default to two workers: every spec reads the same static preview build and keeps
// its state in its own browser context. Standard public runners have four vCPUs shared with the
// preview server, and screenshots and timing assertions need headroom. Set PW_WORKERS to tune it.
const defaultCiWorkers = 2

const resolveCiWorkers = (value: string | undefined): number => {
  if (value === undefined || value === '') return defaultCiWorkers

  const workers = Number(value)

  if (!Number.isInteger(workers) || workers < 1) throw new TypeError(`PW_WORKERS must be a positive integer, received "${value}".`)

  return workers
}

const previewHost = '127.0.0.1'
const previewPort = Number(process.env.PW_PREVIEW_PORT ?? 4173)
const previewURL = `http://${previewHost}:${previewPort}`

const previewServerCommand = shouldBuildPreviewServer ?
  `pnpm run build && pnpm run preview --host ${previewHost} --port ${previewPort}` :
  `pnpm run preview --host ${previewHost} --port ${previewPort}`

// Workaround for occasional CI sandbox/driver instability. These are Chromium switches:
// WebKit refuses to start with an unknown option, so only Chromium projects pass them.
const chromiumLaunchOptions = {
  // Keep the media clock independent of host audio devices, as in the motion workspace.
  args: ['--disable-gpu', '--disable-software-rasterizer', '--disable-audio-output']
}

const chromiumProject = {
  name: 'chromium',
  use: {
    ...devices['Desktop Chrome'],
    launchOptions: chromiumLaunchOptions,
    ...(chromiumChannel ? { channel: chromiumChannel } : {})
  }
}

const fullBrowserProjects = [
  chromiumProject,
  {
    name: 'firefox',
    use: {
      ...devices['Desktop Firefox'],
      launchOptions: {
        firefoxUserPrefs: {
          'accessibility.typeaheadfind': false,
          'accessibility.typeaheadfind.autostart': false,
          'accessibility.typeaheadfind.manual': false
        }
      }
    }
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] }
  },
  {
    name: 'Mobile Chrome',
    use: { ...devices['Pixel 7'], launchOptions: chromiumLaunchOptions }
  },
  {
    name: 'Mobile Safari',
    use: { ...devices['iPhone 14'] }
  }
]

const playwrightProjects = (isCiLikeRun || isSnapshotUpdateRun) && !shouldRunChromiumOnly ?
  fullBrowserProjects :
  [chromiumProject]

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixels: 3_000
    }
  },
  // Test-level parallelism also makes --shard split by test instead of by file, which keeps
  // shards even when a few specs hold most of the tests.
  fullyParallel: true,
  forbidOnly: isCiLikeRun,
  retries: isCiLikeRun ? 2 : 0,
  workers: isCiLikeRun ? resolveCiWorkers(process.env.PW_WORKERS) : '50%',
  reporter: 'html',
  use: {
    baseURL: previewURL,
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
    trace: 'on-first-retry'
  },
  projects: playwrightProjects,
  webServer: {
    command: previewServerCommand,
    timeout: 600_000,
    url: previewURL,
    reuseExistingServer: !isCiLikeRun
  }
})
