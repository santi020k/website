// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

const root = join(import.meta.dirname, '../../..')

/** The page file Astro would build for a redirect source, if one exists. */
const pageFor = (from: string) => {
  const path = from.replace(/\/\*$|\/$/u, '').replace(/^\//u, '')

  return ['.astro', '.md', '.mdx', '/index.astro'].map(extension => join(root, 'src/pages', `${path || 'index'}${extension}`))
    .find(file => existsSync(file))
}

describe('public redirects', () => {
  test('never shadow a page that exists', () => {
    // Cloudflare applies _redirects before static assets, so a stale rule hides a new page.
    const sources = readFileSync(join(root, 'public/_redirects'), 'utf8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.split(/\s+/u)[0] ?? '')

    expect(sources.length).toBeGreaterThan(10)
    expect(sources.filter(from => pageFor(from) !== undefined)).toEqual([])
  })
})
