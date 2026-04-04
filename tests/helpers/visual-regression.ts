// Playwright snapshot baselines are platform-specific, and this repo only commits macOS baselines.
export const shouldRunVisualSnapshots = process.platform === 'darwin'

export const visualSnapshotSkipReason =
  'Visual snapshots are currently maintained on macOS only.'
