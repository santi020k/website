import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { expect, test } from 'vitest'

test.each([
  { body: null, total: 0, publicCount: 0, failure: false },
  { body: null, total: 0, publicCount: 0, failure: true },
  {
    body: {
      children: [
        null,
        { 'wm-property': 'like-of', 'wm-source': 'https://public.example/note' },
        { 'wm-property': 'like-of', 'wm-private': true, 'wm-source': 'https://private.example/note' },
        { 'wm-property': 'like-of', 'wm-private': 'true', 'wm-source': 'https://private.example/second' }
      ]
    },
    total: 4,
    publicCount: 1,
    failure: false
  }
])('summarizes $total API rows safely (request failure: $failure)', ({ body, total, publicCount, failure }) => {
  const root = mkdtempSync(join(tmpdir(), 'website-check-mentions-'))

  try {
    const directory = join(root, 'scripts/js')
    const script = join(directory, 'check-webmentions.mjs')

    mkdirSync(directory, { recursive: true })
    copyFileSync(join(process.cwd(), 'scripts/js/check-webmentions.mjs'), script)

    const result = spawnSync(process.execPath, [
      '--input-type=module',
      '-e',
      `globalThis.fetch = async (url, options) => {
         if (new URL(url).searchParams.has('token')) throw new Error('Token must not be in the URL');
         if (options.headers.Authorization !== 'Bearer fixture-token') throw new Error('Missing authentication header');
         if (${failure}) throw new Error('fixture-token');
         return new Response(${JSON.stringify(JSON.stringify(body))});
       };
       await import(${JSON.stringify(pathToFileURL(script).href)});`
    ], {
      env: { WEBMENTION_API_KEY: 'fixture-token', WEBMENTION_URL: '' },
      encoding: 'utf8',
      timeout: 5000
    })

    expect(result.stderr).toBe('')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain(failure ?
      'API: fetch failed (network error or request timeout)' :
      `Total rows: ${total}, public (before build validation): ${publicCount}`)
    expect(result.stdout).not.toContain('private.example')
    expect(result.stdout).not.toContain('fixture-token')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
