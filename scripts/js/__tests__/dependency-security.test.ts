// @vitest-environment node
import { createHash } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

interface LighthouseConfigLoader {
  loadRcFile: (filename: string) => unknown
}

interface UriComponent {
  error?: string
  scheme?: string
}

interface FastUri {
  normalize: (uri: string) => string
  parse: (uri: string) => UriComponent
}

interface FetchResponse {
  text: () => Promise<string>
}

interface Undici {
  fetch: (input: string, init: { integrity: string }) => Promise<unknown>
}

const require = createRequire(import.meta.url)
const lighthouseRequire = createRequire(require.resolve('@lhci/cli/package.json'))
const configLoader: unknown = lighthouseRequire('@lhci/utils/src/lighthouserc.js')
const ajvRequire = createRequire(createRequire(lighthouseRequire.resolve('lighthouse/package.json')).resolve('ajv/package.json'))
const fastUri: unknown = ajvRequire('fast-uri')
const undici: unknown = createRequire(require.resolve('jsdom/package.json'))('undici')

const assertConfigLoader: (value: unknown) => asserts value is LighthouseConfigLoader = value => {
  if (typeof value !== 'object' || value === null ||
    !('loadRcFile' in value) || typeof value.loadRcFile !== 'function') {
    throw new TypeError('Expected installed Lighthouse configuration loader')
  }
}

const assertFastUri: (value: unknown) => asserts value is FastUri = value => {
  if (typeof value !== 'object' || value === null ||
    !('normalize' in value) || typeof value.normalize !== 'function' ||
    !('parse' in value) || typeof value.parse !== 'function') {
    throw new TypeError('Expected installed AJV fast-uri module')
  }
}

const assertUndici: (value: unknown) => asserts value is Undici = value => {
  if (typeof value !== 'object' || value === null ||
    !('fetch' in value) || typeof value.fetch !== 'function') {
    throw new TypeError('Expected installed jsdom undici module')
  }
}

const assertFetchResponse: (value: unknown) => asserts value is FetchResponse = value => {
  if (typeof value !== 'object' || value === null ||
    !('text' in value) || typeof value.text !== 'function') {
    throw new TypeError('Expected undici fetch response')
  }
}

assertConfigLoader(configLoader)
assertFastUri(fastUri)
assertUndici(undici)

describe('installed dependency security patches', () => {
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

  test('AJV fast-uri rejects percent-encoded schemes instead of normalizing them into active schemes', () => {
    expect(fastUri.normalize('HTTPS://Example.COM/a/../b')).toBe('https://example.com/b')
    for (const prefix of ['%6A', '%u006A']) {
      const scheme = `${prefix}${'javascript'.slice(1)}`
      const input = `${scheme}:alert(1)`
      const normalized = fastUri.normalize(input)
      expect(normalized).toBe(input)
      expect(normalized).not.toMatch(/^javascript:/iu)
      expect(fastUri.parse(input)).toMatchObject({ error: 'URI scheme is malformed.', scheme })
    }
  })

  test('jsdom undici enforces uppercase-algorithm fetch integrity metadata', async () => {
    const integrity = `SHA256-${createHash('sha256').update('expected').digest('base64')}`
    const response = await undici.fetch('data:text/plain,expected', { integrity })
    assertFetchResponse(response)
    expect(await response.text()).toBe('expected')
    const mismatch = undici.fetch('data:text/plain,different', { integrity })
    await expect(mismatch).rejects.toBeInstanceOf(TypeError)
    await expect(mismatch).rejects.toThrow('fetch failed')
  })
})
