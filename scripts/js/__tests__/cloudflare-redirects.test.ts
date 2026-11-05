// @vitest-environment node
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { prepareCloudflareRedirects, validateRedirectDestinations } from '../cloudflare-redirects.mjs'

describe('Cloudflare Pages redirects', () => {
  test('retired project and article links reach active indexes without a redirect chain', async () => {
    const source = await readFile(new URL('../../../public/_redirects', import.meta.url), 'utf8')
    const { rules } = prepareCloudflareRedirects(source)

    for (const [retired, destination] of [
      ['/portfolio/difftale', '/projects/'],
      ['/blog/difftale-explicit-ai-git-workflows', '/blog/']
    ] as const) {
      for (const prefix of ['', '/v3']) {
        for (const suffix of ['', '/']) {
          expect(rules).toContainEqual({ from: `${prefix}${retired}${suffix}`, to: destination, status: 301 })
        }
      }

      expect(rules.some(rule => rule.from === destination)).toBe(false)
    }
  })

  test('preserves historical technology aliases with and without a trailing slash', async () => {
    const source = await readFile(new URL('../../../public/_redirects', import.meta.url), 'utf8')
    const { rules } = prepareCloudflareRedirects(source)

    for (const [legacy, current] of [
      ['React', 'react-js'],
      ['Node', 'node-js'],
      ['Nest.js', 'nestjs'],
      ['Gitlab', 'gitlab'],
      ['Youtube%20API', 'youtube-api'],
      ['CI/CD', 'ci-cd'],
      ['Semantic%20HTML%20&%20CSS', 'semantic-html-and-css']
    ] as const) {
      for (const suffix of ['', '/']) {
        expect(rules).toContainEqual({ from: `/technologies/${legacy}${suffix}`, to: `/technologies/${current}/`, status: 301 })
      }
    }
  })

  test('keeps hundreds of exact redirects out of the 100-rule dynamic budget', () => {
    const exactRules = Array.from({ length: 466 }, (_, index) => `/technologies/Legacy${index}/ /technologies/current-${index}/ 301`)
    const result = prepareCloudflareRedirects([
      '# Retired routes followed by generated technology aliases',
      '/uses/* /about/ 301',
      '/now /about/ 301',
      '/old/:slug /new/:slug 301',
      ...exactRules,
      '/fallback/* /blog/ 301'
    ].join('\n'))

    expect(result.staticCount).toBe(467)
    expect(result.dynamicCount).toBe(3)
    expect(result.rules.slice(0, 467).every(rule => !/\*|:/u.test(rule.from))).toBe(true)
    expect(result.rules.slice(467).map(rule => rule.from)).toEqual(['/uses/*', '/old/:slug', '/fallback/*'])
    expect(result.output.indexOf('/technologies/Legacy465/')).toBeLessThan(result.output.indexOf('/uses/*'))
  })

  test('preserves encoded paths, destinations, statuses, and exact-path precedence', () => {
    const result = prepareCloudflareRedirects('/old/* /fallback/ 301\n/old/special/ /special/ 308\n/CI%2FCD/ /ci-cd/ 301\n/temporary/ /current/\n')

    expect(result.rules).toEqual([
      { from: '/old/special/', to: '/special/', status: 308 },
      { from: '/CI%2FCD/', to: '/ci-cd/', status: 301 },
      { from: '/temporary/', to: '/current/', status: 302 },
      { from: '/old/*', to: '/fallback/', status: 301 }
    ])
    expect(prepareCloudflareRedirects(result.output)).toEqual(result)
  })

  test.each([
    'https://www.santi020k.com/* https://santi020k.com/:splat 301',
    'http://santi020k.com/* https://santi020k.com/:splat 301',
    '//example.com/ /about/ 301',
    '/old/?query=value /about/ 301',
    '/old/#section /about/ 301',
    '/old/ javascript:alert(1) 301',
    '/old/ //example.com/ 301',
    '/old/ https://example.com/ 200',
    '/old/ /new/ 999',
    '/old/ /new/ 301 extra',
    '/missing-destination/',
    '/same/ /same/ 301',
    '/old/ /new/ 301\n/old/ /other/ 301'
  ])('rejects invalid or ambiguous rules before deployment: %s', source => {
    expect(() => prepareCloudflareRedirects(source)).toThrow()
  })

  test('enforces static, dynamic, and line-length limits without silently dropping rules', () => {
    const staticRules = Array.from({ length: 2000 }, (_, index) => `/old-${index}/ /new/ 301`)
    const dynamicRules = Array.from({ length: 100 }, (_, index) => `/old-${index}/* /new/ 301`)

    expect(prepareCloudflareRedirects([...staticRules, ...dynamicRules].join('\n')).rules).toHaveLength(2100)
    expect(() => prepareCloudflareRedirects([...staticRules, '/extra/ /new/ 301'].join('\n'))).toThrow('2000 static')
    expect(() => prepareCloudflareRedirects([...dynamicRules, '/extra/* /new/ 301'].join('\n'))).toThrow('100 dynamic')
    expect(() => prepareCloudflareRedirects(`/${'a'.repeat(1000)} /new/ 301`)).toThrow('1000-character')
  })

  test('checks unlinked destinations against built files and rejects missing pages or directories', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'website-redirects-'))
    const rulesFor = (to: string) => [{ from: '/legacy/', to, status: 301 }]

    try {
      await mkdir(path.join(directory, 'about'))
      await writeFile(path.join(directory, 'about/index.html'), '<h1>About</h1>')
      await writeFile(path.join(directory, 'file.pdf'), 'fixture')

      await expect(validateRedirectDestinations(rulesFor('/about/?ref=old#bio'), directory)).resolves.toBeUndefined()
      await expect(validateRedirectDestinations(rulesFor('/file.pdf'), directory)).resolves.toBeUndefined()
      await expect(validateRedirectDestinations(rulesFor('/missing/'), directory)).rejects.toThrow('missing from the build')
      await expect(validateRedirectDestinations(rulesFor('/missing/?campaign=:spring'), directory)).rejects.toThrow('missing from the build')
      await expect(validateRedirectDestinations(rulesFor('/missing/#:~:text=Example'), directory)).rejects.toThrow('missing from the build')
      await expect(validateRedirectDestinations(rulesFor('https://santi020k.com/missing/'), directory)).rejects.toThrow('missing from the build')
      await expect(validateRedirectDestinations(rulesFor('https://santi020k.com/about/'), directory)).resolves.toBeUndefined()
      await expect(validateRedirectDestinations(rulesFor('/100%/'), directory)).rejects.toThrow('invalid URL encoding: /100%/')
      await expect(validateRedirectDestinations(rulesFor('/about'), directory)).rejects.toThrow('missing from the build')
      await expect(validateRedirectDestinations(rulesFor(`/${encodeURIComponent('../outside')}`), directory)).rejects.toThrow('outside the build')
      await expect(validateRedirectDestinations(rulesFor('https://example.com/'), directory)).resolves.toBeUndefined()
      await expect(validateRedirectDestinations(rulesFor('/new/:slug'), directory)).resolves.toBeUndefined()
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
