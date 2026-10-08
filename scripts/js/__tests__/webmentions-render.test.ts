import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test } from 'vitest'

test('renders a mention avatar without fetching dimensions from its external host', () => {
  const root = mkdtempSync(join(tmpdir(), 'website-mention-render-'))
  const projectRoot = process.cwd()
  const avatar = 'https://avatars.example.invalid/person.png'

  try {
    mkdirSync(join(root, 'src/pages'), { recursive: true })
    writeFileSync(join(root, 'src/pages/index.astro'), [
      '---',
      `import WebmentionsSection from ${JSON.stringify(join(projectRoot, 'src/components/molecules/WebmentionsSection.astro'))}`,
      'const mentions = [{',
      `  author: { name: 'Alice', photo: ${JSON.stringify(avatar)}, url: 'https://alice.example/' },`,
      '  content: null, published: null, summary: null,',
      '  \'wm-property\': \'like-of\', \'wm-received\': null, \'wm-source\': \'https://alice.example/note\'',
      '}]',
      '---',
      '<html lang="en"><head><title>Mention fixture</title></head><body>',
      '<WebmentionsSection mentions={mentions} />',
      '</body></html>'
    ].join('\n'))

    const configuration = {
      root: projectRoot,
      srcDir: join(root, 'src'),
      outDir: join(root, 'dist'),
      publicDir: join(root, 'public'),
      cacheDir: join(root, 'cache'),
      configFile: false,
      logLevel: 'silent',
      vite: { resolve: { alias: { '@': join(projectRoot, 'src') } } }
    }
    const result = spawnSync(process.execPath, [
      '--input-type=module',
      '-e',
      `import { build } from 'astro'; await build(${JSON.stringify(configuration)});`
    ], { cwd: projectRoot, encoding: 'utf8', timeout: 30_000 })

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0)

    const document = readFileSync(join(root, 'dist/index.html'), 'utf8')

    expect(document).toContain(`src="${avatar}"`)
    expect(document).toContain('width="40"')
    expect(document).toContain('height="40"')
    expect(document).toContain('aria-label="Alice"')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}, 35_000)
