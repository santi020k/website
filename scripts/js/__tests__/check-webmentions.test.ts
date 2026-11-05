import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { describe, expect, test } from 'vitest'

const defaultTarget = 'https://santi020k.com/blog/migrate-eslint-8-or-less-to-eslint-9/'
const fixtureTarget = 'https://santi020k.com/blog/fixture-post/'

/**
 * Runs the script as `pnpm run check:webmentions [args]` does: `node <script> [args]`.
 * A preloaded fetch fixture records every requested URL, so no request leaves the process.
 */
const runCheck = (args: string[]) => {
  const root = mkdtempSync(join(tmpdir(), 'website-check-mentions-argv-'))

  try {
    const directory = join(root, 'scripts/js')
    const script = join(directory, 'check-webmentions.mjs')
    const fixture = join(root, 'fetch-fixture.mjs')
    const requestLog = join(root, 'requests.log')

    mkdirSync(directory, { recursive: true })
    copyFileSync(join(process.cwd(), 'scripts/js/check-webmentions.mjs'), script)
    writeFileSync(fixture, `import { appendFileSync } from 'node:fs'

globalThis.fetch = async (input, init) => {
  const url = String(input)

  appendFileSync(${JSON.stringify(requestLog)}, url + '\\n')

  if (url.startsWith('https://webmention.io/api/')) {
    if (init?.headers?.Authorization !== 'Bearer fixture-token') throw new Error('Missing authentication header')

    return Response.json({ children: [] })
  }

  return new Response('<link rel="webmention" href="https://webmention.io/santi020k.com/webmention">')
}
`)

    const result = spawnSync(process.execPath, ['--import', pathToFileURL(fixture).href, script, ...args], {
      cwd: root,
      env: {
        WEBMENTION_API_KEY: 'fixture-token',
        WEBMENTION_URL: 'https://webmention.io/santi020k.com/webmention'
      },
      encoding: 'utf8',
      timeout: 5000
    })
    const requests = existsSync(requestLog) ? readFileSync(requestLog, 'utf8').split('\n').filter(Boolean) : []

    return { ...result, requests }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

describe('webmention check target argument', () => {
  test.each([
    { args: [fixtureTarget], expected: fixtureTarget },
    { args: ['http://127.0.0.1:4321/blog/fixture-post/'], expected: 'http://127.0.0.1:4321/blog/fixture-post/' },
    { args: ['--', fixtureTarget], expected: fixtureTarget },
    {
      args: ['--', ' HTTPS://SANTI020K.COM/blog/fixture-post/?tag=C%2B%2B#part-1 '],
      expected: `${fixtureTarget}?tag=C%2B%2B#part-1`
    },
    { args: [], expected: defaultTarget }
  ])('checks $expected for arguments $args', ({ args, expected }) => {
    const result = runCheck(args)
    const [discovery, api, ...rest] = result.requests

    expect(result.error).toBeUndefined()
    expect(result.stderr).toBe('')
    expect(result.status).toBe(0)
    expect(discovery).toBe(expected)
    expect(rest).toEqual([])

    const apiUrl = new URL(api ?? '')

    expect(`${apiUrl.origin}${apiUrl.pathname}`).toBe('https://webmention.io/api/mentions.jf2')
    expect(apiUrl.searchParams.get('target')).toBe(expected)
    expect(apiUrl.searchParams.has('token')).toBe(false)
    expect(result.stdout).toContain(`API: target ${expected}`)
    expect(result.stdout).not.toContain('fixture-token')
  })

  test.each([
    { args: ['/blog/fixture-post/'], reason: 'a relative path' },
    { args: ['--', '/blog/fixture-post/'], reason: 'a relative path after the separator' },
    { args: ['ftp://santi020k.com/blog/fixture-post/'], reason: 'a non-HTTP scheme' },
    { args: ['https://'], reason: 'a URL without a host' },
    { args: ['http//santi020k.com/blog/fixture-post/'], reason: 'a malformed URL' },
    { args: ['https://fixture-user:fixture-password@example.test/post/'], reason: 'a URL containing credentials' },
    { args: [fixtureTarget, defaultTarget], reason: 'multiple targets' },
    { args: ['--', fixtureTarget, defaultTarget], reason: 'multiple targets after the separator' }
  ])('rejects $reason before any request', ({ args }) => {
    const result = runCheck(args)

    expect(result.error).toBeUndefined()
    expect(result.status).not.toBeNull()
    expect(result.status).not.toBe(0)
    expect(result.stderr.trim()).not.toBe('')
    expect(result.requests).toEqual([])
    expect(`${result.stdout}${result.stderr}`).not.toContain('fixture-token')
    expect(`${result.stdout}${result.stderr}`).not.toContain('fixture-password')
  })
})

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
      `First-page rows: ${total}, public (before build validation): ${publicCount}`)
    expect(result.stdout).not.toContain('private.example')
    expect(result.stdout).not.toContain('fixture-token')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
