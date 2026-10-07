// @vitest-environment node
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

interface BraceNode {
  type: string
  value?: string
  nodes?: BraceNode[]
  parent?: BraceNode
}

interface Braces {
  parse: (input: string, options?: { maxDepth: number }) => unknown
  compile: (input: string | BraceNode) => string
  expand: (input: string | BraceNode) => string[]
  stringify: (input: string | BraceNode) => string
}

interface LighthouseConfigLoader {
  loadRcFile: (filename: string) => unknown
}

const require = createRequire(import.meta.url)
const markdownRequire = createRequire(require.resolve('markdownlint-cli2'))
const micromatchRequire = createRequire(markdownRequire.resolve('micromatch'))
const braces: unknown = micromatchRequire('braces')
const lighthouseRequire = createRequire(require.resolve('@lhci/cli/package.json'))
const configLoader: unknown = lighthouseRequire('@lhci/utils/src/lighthouserc.js')

const assertBraces: (value: unknown) => asserts value is Braces = value => {
  if (typeof value !== 'function' || !('parse' in value) || typeof value.parse !== 'function' ||
    !('compile' in value) || typeof value.compile !== 'function' ||
    !('expand' in value) || typeof value.expand !== 'function' ||
    !('stringify' in value) || typeof value.stringify !== 'function') {
    throw new TypeError('Expected installed braces public API')
  }
}

const assertConfigLoader: (value: unknown) => asserts value is LighthouseConfigLoader = value => {
  if (typeof value !== 'object' || value === null ||
    !('loadRcFile' in value) || typeof value.loadRcFile !== 'function') {
    throw new TypeError('Expected installed Lighthouse configuration loader')
  }
}

assertBraces(braces)
assertConfigLoader(configLoader)

describe('installed dependency security patches', () => {
  test('braces limits nested input while preserving ordinary glob expansion', () => {
    for (const [open, close] of [['{', '}'], ['(', ')']] as const) {
      for (const operation of ['parse', 'compile', 'expand', 'stringify'] as const) {
        expect(() => braces[operation](open.repeat(100) + 'a' + close.repeat(100))).not.toThrow()
        expect(() => braces[operation](open.repeat(101) + 'a' + close.repeat(101))).toThrow(/exceeds max depth/u)
        expect(() => braces[operation](open.repeat(4500) + 'a' + close.repeat(4500))).toThrow(/exceeds max depth/u)
      }
    }

    expect(braces.compile('src/**/*.{js,ts,tsx}')).toBe('src/**/*.(js|ts|tsx)')
    expect(braces.expand('a/{b,c}/d')).toEqual(['a/b/d', 'a/c/d'])
    expect(braces.expand('{01..05}')).toEqual(['01', '02', '03', '04', '05'])
    expect(braces.stringify('foo/({a,b})')).toBe('foo/({a,b})')
    expect(() => braces.parse('{{a,b},c}', { maxDepth: 1.5 })).toThrow(/exceeds max depth/u)
    expect(() => braces.parse('{'.repeat(101) + 'a' + '}'.repeat(101), { maxDepth: Infinity })).toThrow(/exceeds max depth/u)
  })

  test('braces rejects excessive caller-supplied AST depth and parent cycles', () => {
    let nested: BraceNode = { type: 'text', value: 'a' }
    for (let depth = 0; depth < 102; depth++) nested = { type: 'paren', nodes: [nested] }
    for (const operation of ['compile', 'expand', 'stringify'] as const) {
      expect(() => braces[operation](nested)).toThrow(/exceeds max depth/u)
    }
    const cycle: BraceNode = { type: 'paren', nodes: [{ type: 'text', value: 'a' }] }
    cycle.parent = cycle
    expect(() => braces.expand(cycle)).toThrow(/parent chain contains a cycle/u)
  })

  test('Lighthouse still loads YAML and JSON config with safe YAML 4 semantics', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'website-lhci-config-'))
    try {
      const yamlFile = path.join(directory, 'lighthouserc.yaml')
      const jsonFile = path.join(directory, 'lighthouserc.json')
      const config = { ci: { collect: { numberOfRuns: 1, url: ['https://santi020k.com/'] } } }
      await writeFile(yamlFile, 'ci:\n  collect:\n    numberOfRuns: 1\n    url:\n      - https://santi020k.com/\n')
      await writeFile(jsonFile, JSON.stringify(config))
      expect(configLoader.loadRcFile(yamlFile)).toEqual(config)
      expect(configLoader.loadRcFile(jsonFile)).toEqual(config)
      await writeFile(yamlFile, 'ci: !!js/function "function () { return 1 }"\n')
      expect(() => configLoader.loadRcFile(yamlFile)).toThrow(/unknown tag/u)
      expect(() => lighthouseRequire.resolve('sprintf-js')).toThrow()
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
