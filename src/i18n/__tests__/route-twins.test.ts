import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

const pagesRoot = path.resolve('src/pages')
const spanishRoot = path.join(pagesRoot, 'es')

/** Site-wide endpoints with one language-neutral response. */
const englishOnly = new Set(['llms.txt.ts', 'manifest.webmanifest.ts', 'robots.txt.ts'])

const routeFiles = (root: string) => readdirSync(root, { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile() && /\.(?:astro|ts)$/u.test(entry.name))
  .map(entry => path.relative(root, path.join(entry.parentPath, entry.name)))

const english = routeFiles(pagesRoot).filter(file => !file.startsWith(`es${path.sep}`))
const spanish = new Set(routeFiles(spanishRoot))

describe('Spanish route twins', () => {
  test('every English page has a Spanish twin unless it is listed as English-only', () => {
    const missing = english.filter(file => !englishOnly.has(file) && !spanish.has(file))

    expect(english.length).toBeGreaterThan(20)
    expect(missing).toEqual([])
  })

  test('no Spanish page exists without its English original', () => {
    const englishRoutes = new Set(english)

    expect([...spanish].filter(file => !englishRoutes.has(file))).toEqual([])
  })

  test('the English-only list has no stale entries', () => {
    expect([...englishOnly].filter(file => !english.includes(file) || spanish.has(file))).toEqual([])
  })

  test('Spanish page wrappers render their English original', () => {
    const wrappers = [...spanish].filter(file => file.endsWith('.astro'))
    const unrelated = wrappers.filter(file => {
      const source = readFileSync(path.join(spanishRoot, file), 'utf8')

      return !source.includes(`from '@/pages/${file.split(path.sep).join('/')}'`)
    })

    expect(unrelated).toEqual([])
  })
})
