import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'

import { expect, test } from 'vitest'

test('renders mention avatars without contacting their external hosts at build time', () => {
  const root = mkdtempSync(join(tmpdir(), 'website-mention-render-'))
  const projectRoot = process.cwd()
  const avatars = [
    'https://avatars.example.invalid/person.png',
    'https://webmention.io/avatar.png',
    'https://miro.medium.com/avatar.png'
  ]

  try {
    symlinkSync(join(projectRoot, 'node_modules'), join(root, 'node_modules'), 'dir')
    mkdirSync(join(root, 'src/pages'), { recursive: true })
    copyFileSync(join(projectRoot, 'src/components/molecules/WebmentionsSection.astro'), join(root, 'src/WebmentionsSection.astro'))
    writeFileSync(join(root, 'src/pages/index.astro'), [
      '---',
      'import WebmentionsSection from \'../WebmentionsSection.astro\'',
      `const mentions = ${JSON.stringify(avatars)}.map(photo => ({`,
      '  author: { name: \'Alice\', photo, url: \'https://alice.example/\' },',
      '  content: null, published: null, summary: null,',
      '  \'wm-property\': \'like-of\', \'wm-received\': null, \'wm-source\': \'https://alice.example/note\'',
      '}))',
      '---',
      '<html lang="en"><head><title>Mention fixture</title></head><body>',
      '<WebmentionsSection mentions={mentions} />',
      '</body></html>'
    ].join('\n'))

    const configuration = {
      root,
      srcDir: join(root, 'src'),
      outDir: join(root, 'dist'),
      publicDir: join(root, 'public'),
      cacheDir: join(root, 'cache'),
      configFile: relative(root, join(projectRoot, 'astro.config.ts')),
      logLevel: 'silent',
      vite: { cacheDir: join(root, 'vite-cache'), resolve: { alias: { '@': join(projectRoot, 'src') } } }
    }
    const result = spawnSync(process.execPath, [
      '--input-type=module',
      '-e',
      `import { build } from 'astro'; globalThis.fetch = () => Promise.reject(new Error('Unexpected build-time fetch')); await build(${JSON.stringify(configuration)});`
    ], { cwd: projectRoot, encoding: 'utf8', timeout: 30_000 })

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0)

    const document = readFileSync(join(root, 'dist/index.html'), 'utf8')

    for (const avatar of avatars) expect(document).toContain(`src="${avatar}"`)
    expect(document).toContain('width="44"')
    expect(document).toContain('height="44"')
    expect(document).toContain('aria-label="Alice"')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}, 35_000)
