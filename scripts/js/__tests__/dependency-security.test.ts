// @vitest-environment node
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

interface LighthouseConfigLoader {
  loadRcFile: (filename: string) => unknown
}

const require = createRequire(import.meta.url)
const lighthouseRequire = createRequire(require.resolve('@lhci/cli/package.json'))
const configLoader: unknown = lighthouseRequire('@lhci/utils/src/lighthouserc.js')

const assertConfigLoader: (value: unknown) => asserts value is LighthouseConfigLoader = value => {
  if (typeof value !== 'object' || value === null ||
    !('loadRcFile' in value) || typeof value.loadRcFile !== 'function') {
    throw new TypeError('Expected installed Lighthouse configuration loader')
  }
}

assertConfigLoader(configLoader)

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
})
