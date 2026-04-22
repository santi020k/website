/**
 * Verifies Webmention.io setup without printing secrets:
 * - Optional: GET a post HTML and check rel="webmention" matches WEBMENTION_URL
 * - GET mentions.jf2 (same query as the Astro build) and summarize public mentions
 *
 * Usage:
 *   pnpm run check:webmentions
 *   pnpm run check:webmentions -- https://santi020k.com/blog/your-post-slug/
 *
 * Reads WEBMENTION_* from process.env first, then repo-root .env
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

function parseEnvFile(filePath) {
  const out = {}
  let raw

  try {
    raw = fs.readFileSync(filePath, 'utf8')
  } catch {
    return out
  }

  for (const line of raw.split('\n')) {
    const t = line.trim()

    if (!t || t.startsWith('#')) {
      continue
    }

    const eq = t.indexOf('=')

    if (eq === -1) {
      continue
    }

    const k = t.slice(0, eq).trim()
    let v = t.slice(eq + 1).trim()

    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith('\'') && v.endsWith('\''))
    ) {
      v = v.slice(1, -1)
    }

    out[k] = v
  }

  return out
}

function loadWebmentionConfig() {
  const fromFile = parseEnvFile(path.join(root, '.env'))

  return {
    apiKey: process.env.WEBMENTION_API_KEY || fromFile.WEBMENTION_API_KEY || '',
    endpoint: process.env.WEBMENTION_URL || fromFile.WEBMENTION_URL || ''
  }
}

/** Default post used for discovery + API sample (override with argv). */
const defaultTarget =
  'https://santi020k.com/blog/migrate-eslint-8-or-less-to-eslint-9/'

const targetArg = process.argv[2]

const targetUrl = (targetArg && targetArg.startsWith('http')) ?
  targetArg :
  defaultTarget

const { apiKey, endpoint } = loadWebmentionConfig()

async function checkDiscovery() {
  if (!endpoint) {
    console.log('Discovery: skip (WEBMENTION_URL unset)')

    return
  }

  const res = await fetch(targetUrl, {
    headers: { Accept: 'text/html' },
    signal: AbortSignal.timeout(15_000)
  })

  if (!res.ok) {
    console.log(`Discovery: GET ${targetUrl} -> ${res.status} (cannot verify <link rel="webmention">)`)

    return
  }

  const html = await res.text()
  const re = /<link[^>]+rel=["']webmention["'][^>]*>/gi
  const matches = [...html.matchAll(re)]

  const hrefs = matches
    .map(m => {
      const tag = m[0]
      const hrefM = /href=["']([^"']+)["']/i.exec(tag)

      return hrefM ? hrefM[1] : null
    })
    .filter(Boolean)

  const expected = endpoint.replace(/\/$/, '')
  const ok = hrefs.some(h => h.replace(/\/$/, '') === expected)

  console.log(`Discovery: rel="webmention" on live page -> ${ok ? 'OK' : 'MISSING OR MISMATCH'}`)

  if (hrefs.length) {
    console.log(`  Found href(s): ${hrefs.join(', ')}`)
  }

  console.log(`  Expected: ${endpoint}`)
}

async function checkJf2() {
  if (!apiKey) {
    console.log('\nAPI: skip (WEBMENTION_API_KEY unset — add to .env for live mention counts)')

    return
  }

  const url = new URL('https://webmention.io/api/mentions.jf2')

  url.searchParams.set('target', targetUrl)

  url.searchParams.set('token', apiKey)

  let res

  try {
    res = await fetch(url.href, {
      headers: { Accept: 'application/jf2+json, application/json' },
      signal: AbortSignal.timeout(15_000)
    })
  } catch (e) {
    console.log(`\nAPI: fetch failed (${e instanceof Error ? e.message : String(e)})`)

    return
  }

  if (!res.ok) {
    console.log(`\nAPI: mentions.jf2 -> HTTP ${res.status} (check token and domain on webmention.io)`)

    return
  }

  let data

  try {
    data = await res.json()
  } catch {
    console.log('\nAPI: invalid JSON from mentions.jf2')

    return
  }

  const children = Array.isArray(data.children) ? data.children : []

  const publicRows = children.filter(
    row => row && row['wm-private'] !== true && typeof row['wm-property'] === 'string'
  )

  console.log(`\nAPI: target ${targetUrl}`)

  console.log(`  Total rows: ${children.length}, public (shown in build): ${publicRows.length}`)

  for (const row of publicRows.slice(0, 8)) {
    const prop = row['wm-property']
    const src = row['wm-source'] || row.url || '(no source)'

    console.log(`  - ${prop}: ${src}`)
  }

  if (publicRows.length > 8) {
    console.log(`  … and ${publicRows.length - 8} more`)
  }

  if (!publicRows.length && children.length) {
    console.log('  (All mentions are private or missing wm-property; build filters those out.)')
  }
}

console.log('Webmention check\n')

await checkDiscovery()

await checkJf2()

console.log(
  '\nNext: send a mention (page linking to your post -> POST to webmention.io), then `pnpm run build` with WEBMENTION_API_KEY set to bake mentions into HTML.'
)
