import { cp } from 'node:fs/promises'

// Each format is a self-contained project for HyperFrames checks and snapshots.
for (const format of ['portrait', 'square', 'landscape']) {
  for (const assets of ['assets', '_astro']) {
    await cp(new URL(`../dist/${assets}`, import.meta.url), new URL(`../dist/${format}/${assets}`, import.meta.url), { recursive: true })
  }
}
