import { defineConfig } from '@playwright/test'

const port = Number(process.env.WEBSITE_MOTION_PORT ?? 4343)

export default defineConfig({
  testDir: './tests',
  use: { baseURL: `http://127.0.0.1:${port}`, channel: 'chrome', reducedMotion: 'reduce' },
  webServer: { command: `ASTRO_PREVIEW_BACKGROUND=0 pnpm exec astro preview --ignore-lock --host 127.0.0.1 --port ${port}`, url: `http://127.0.0.1:${port}`, reuseExistingServer: false },
  reporter: 'line'
})
