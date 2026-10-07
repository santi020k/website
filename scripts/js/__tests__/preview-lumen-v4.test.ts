import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, test } from 'vitest'

const workspace = 'catalog:\n  "@santi020k/lumen-astro": 2.1.0\noverrides:\n  example: 1.0.0\n'
const lockfile = 'published lockfile\n'
let root = ''

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'website-lumen-preview-'))
  mkdirSync(join(root, 'scripts/js'), { recursive: true })
  mkdirSync(join(root, 'tarballs'))
  mkdirSync(join(root, 'bin'))
  copyFileSync(join(process.cwd(), 'scripts/js/preview-lumen-v4.mjs'), join(root, 'scripts/js/preview.mjs'))
  writeFileSync(join(root, 'pnpm-workspace.yaml'), workspace)
  writeFileSync(join(root, 'pnpm-lock.yaml'), lockfile)
  writeFileSync(join(root, 'bin/pnpm'), '#!/bin/sh\nexit 0\n', { mode: 0o755 })

  for (const name of ['lumen', 'lumen-core', 'lumen-astro']) {
    writeFileSync(join(root, 'tarballs', `santi020k-${name}-4.0.0.tgz`), '')
  }
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('Lumen candidate preview', () => {
  test.each([0, 7])('restores dependency files after a command exits with %i', code => {
    const command = `
      const fs = require('node:fs');
      const workspace = fs.readFileSync('pnpm-workspace.yaml', 'utf8');
      if (!workspace.includes('file:') || !workspace.includes('lumen-core')) process.exit(9);
      fs.writeFileSync('pnpm-lock.yaml', 'temporary candidate lockfile');
      process.exit(${code});
    `
    const result = spawnSync(process.execPath, [
      join(root, 'scripts/js/preview.mjs'), join(root, 'tarballs'), process.execPath, '-e', command
    ], {
      env: { ...process.env, PATH: `${join(root, 'bin')}:${process.env.PATH ?? ''}` },
      encoding: 'utf8'
    })

    expect(result.status).toBe(code === 0 ? 0 : 1)
    expect(readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8')).toBe(workspace)
    expect(readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8')).toBe(lockfile)
  })

  test('rejects missing candidate packages before changing dependency files', () => {
    rmSync(join(root, 'tarballs/santi020k-lumen-core-4.0.0.tgz'))

    const result = spawnSync(process.execPath, [
      join(root, 'scripts/js/preview.mjs'), join(root, 'tarballs')
    ], { encoding: 'utf8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('ENOENT')
    expect(readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8')).toBe(workspace)
    expect(readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8')).toBe(lockfile)
  })
})
