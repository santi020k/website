import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'

import { fetchWebmentionsForTarget } from '@/utils/webmentions-fetch'

import { expect, test, vi } from 'vitest'

test.each(['America/Bogota', 'Asia/Tokyo'])('normalizes reader names and renders safe text and dates without fetching avatars in %s', async timezone => {
  // Astro's scoped CSS modules need one canonical root across macOS /var aliases.
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'website-mention-render-')))
  const projectRoot = process.cwd()
  const avatars = [
    'https://avatars.example.invalid/person.png',
    'https://webmention.io/avatar.png',
    'https://miro.medium.com/avatar.png'
  ]
  const readerNames = [
    { name: '𠮷田', initial: '𠮷' },
    { name: 'e\u0301 Reader', initial: 'E\u0301' },
    { name: '👩🏽‍💻 Developer', initial: '👩🏽‍💻' },
    { name: '🇨🇴 Reader', initial: '🇨🇴' }
  ]
  const replyCases = [
    { text: `  ${'a'.repeat(2001)}  `, expected: 'a'.repeat(2000) },
    { text: `${'a'.repeat(1999)}𠮷tail`, expected: 'a'.repeat(1999) },
    { text: `${'a'.repeat(1999)}e\u0301tail`, expected: 'a'.repeat(1999) },
    { text: `${'a'.repeat(1998)}👩🏽‍💻tail`, expected: 'a'.repeat(1998) },
    { text: `${'a'.repeat(1998)}𠮷tail`, expected: `${'a'.repeat(1998)}𠮷` },
    { text: `${'a'.repeat(1998)}𠮷`, expected: `${'a'.repeat(1998)}𠮷` },
    { text: `${'a'.repeat(1999)}\r\nx`, expected: 'a'.repeat(1999) },
    { text: '<script>Reader text</script>', expected: '<script>Reader text</script>' },
    { text: `e${'\u0301'.repeat(2000)}`, expected: '' },
    { text: '   ', expected: '' }
  ]
  const dateCases = [
    { published: '2024-05-01T20:00:00', received: null, expected: '2024-05-01T20:00:00.000Z', label: 'May 1, 2024' },
    { published: '4 Sep 2026', received: null, expected: '2026-09-04T00:00:00.000Z', label: 'Sep 4, 2026' },
    { published: '2024-05-01T20:00:00-05:00', received: null, expected: '2024-05-02T01:00:00.000Z', label: 'May 2, 2024' },
    { published: 'Wed, 01 May 2024 20:00:00 GMT', received: null, expected: '2024-05-01T20:00:00.000Z', label: 'May 1, 2024' },
    { published: null, received: '2024-05-01T20:00:00', expected: '2024-05-01T20:00:00.000Z', label: 'May 1, 2024' },
    { published: 'not a date', received: null, expected: null, label: null }
  ]

  try {
    const rawNames = ['\u200b', '\u00ad', '\u200e\u200f', '👩🏽‍💻', 'می\u200cنا']
    const normalizedMentions = await (async () => {
      const mockedFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
        children: rawNames.flatMap((name, index) => ['like-of', 'in-reply-to'].map(property => ({
          author: { name, url: index % 2 === 0 ? 'https://reader.example/' : null },
          'wm-property': property,
          'wm-source': `https://reader.example/${index}/${property}`
        })))
      })))

      try {
        return await fetchWebmentionsForTarget('https://example.invalid/', 'fixture-token')
      } finally {
        mockedFetch.mockRestore()
      }
    })()

    symlinkSync(join(projectRoot, 'node_modules'), join(root, 'node_modules'), 'dir')
    mkdirSync(join(root, 'src/pages'), { recursive: true })
    copyFileSync(join(projectRoot, 'src/components/molecules/WebmentionsSection.astro'), join(root, 'src/WebmentionsSection.astro'))
    copyFileSync(join(projectRoot, 'src/components/atoms/ArrowExchange.astro'), join(root, 'src/ArrowExchange.astro'))
    writeFileSync(join(root, 'src/pages/index.astro'), [
      '---',
      'import WebmentionsSection from \'../WebmentionsSection.astro\'',
      `const mentions = ${JSON.stringify(avatars)}.map(photo => ({`,
      '  author: { name: \'Alice\', photo, url: \'https://alice.example/\' },',
      '  content: null, published: null, summary: null,',
      '  \'wm-property\': \'like-of\', \'wm-received\': null, \'wm-source\': \'https://alice.example/note\'',
      '}))',
      'const missingAuthor = { ...mentions[0], author: null }',
      'const sourceOnly = { ...mentions[0], author: { name: \'Reader without a profile\', photo: null, url: null } }',
      'const escapedName = { ...mentions[0], author: { name: \'<script>Sample name</script>\', photo: null, url: null } }',
      'const likes = [...mentions, missingAuthor, sourceOnly, escapedName]',
      'const reply = { ...missingAuthor, \'wm-property\': \'in-reply-to\', content: { text: \'A reply without likes.\' } }',
      `const readers = ${JSON.stringify(readerNames)}.map(({ name }) => ({ ...missingAuthor, author: { name, photo: null, url: null } }))`,
      `const replies = ${JSON.stringify(replyCases)}.map(({ text }) => ({ ...reply, content: { text } }))`,
      `const summary = { ...reply, content: null, summary: { value: ${JSON.stringify(`${'a'.repeat(1998)}🇨🇴tail`)} } }`,
      `const dates = ${JSON.stringify(dateCases)}.map(({ published, received }) => ({ ...reply, published, 'wm-received': received }))`,
      `const normalizedMentions = ${JSON.stringify(normalizedMentions)}`,
      '---',
      '<html lang="en"><head><title>Mention fixture</title></head><body>',
      '<div id="multiple"><WebmentionsSection mentions={likes} /></div>',
      '<div id="single"><WebmentionsSection mentions={[missingAuthor]} /></div>',
      '<div id="empty"><WebmentionsSection mentions={[]} /></div>',
      '<div id="replies"><WebmentionsSection mentions={[reply]} /></div>',
      '<div id="unicode-readers"><WebmentionsSection mentions={readers} /></div>',
      '<div id="bounded-replies"><WebmentionsSection mentions={replies} /></div>',
      '<div id="summary"><WebmentionsSection mentions={[summary]} /></div>',
      '<div id="dates"><WebmentionsSection mentions={dates} /></div>',
      '<div id="normalized-names"><WebmentionsSection mentions={normalizedMentions} /></div>',
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
      vite: {
        cacheDir: join(root, 'vite-cache'),
        resolve: {
          alias: {
            '@/components/atoms/ArrowExchange.astro': join(root, 'src/ArrowExchange.astro'),
            '@': join(projectRoot, 'src')
          }
        }
      }
    }
    // Astro keeps prerender output inside outDir only when it sits under process.cwd().
    const result = spawnSync(process.execPath, [
      '--input-type=module',
      '-e',
      `import { build } from 'astro'; globalThis.fetch = () => Promise.reject(new Error('Unexpected build-time fetch')); await build(${JSON.stringify(configuration)});`
    ], { cwd: root, encoding: 'utf8', env: { ...process.env, TZ: timezone }, timeout: 30_000 })

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0)

    const document = readFileSync(join(root, 'dist/index.html'), 'utf8')

    const images = document.match(/<img\b[^>]*>/g) ?? []

    expect(images).toHaveLength(avatars.length)
    for (const avatar of avatars) {
      const image = images.find(tag => tag.includes(`src="${avatar}"`))

      expect(image).toBeDefined()
      expect(image).toContain('referrerpolicy="no-referrer"')
      expect(image).toContain('loading="lazy"')
    }
    expect(document).toContain('width="44"')
    expect(document).toContain('height="44"')
    const dom = new DOMParser().parseFromString(document, 'text/html')
    const strip = dom.querySelector('#multiple [data-webmention-likes]')
    const readers = [...dom.querySelectorAll('#multiple [data-webmention-reader]')]

    expect(strip?.querySelector('[data-webmention-likes-total]')?.textContent).toBe('6')
    expect(strip?.querySelector('[data-webmention-likes-count]')?.textContent).toMatch(/likes/u)
    expect(readers.map(link => link.querySelector('[data-webmention-reader-name]')?.textContent)).toEqual([
      'Alice', 'Alice', 'Alice', 'Someone', 'Reader without a profile', '<script>Sample name</script>'
    ])
    expect(readers.map(link => link.getAttribute('href'))).toEqual([
      ...avatars.map(() => 'https://alice.example/'),
      'https://alice.example/note',
      'https://alice.example/note',
      'https://alice.example/note'
    ])
    for (const reader of readers) {
      expect(reader.getAttribute('target')).toBe('_blank')
      expect(reader.getAttribute('rel')?.split(' ')).toEqual(expect.arrayContaining(['noopener', 'noreferrer']))
      expect(reader.querySelector('[data-webmention-avatar]')?.getAttribute('aria-hidden')).toBe('true')
    }
    expect(strip?.querySelectorAll('script')).toHaveLength(0)
    expect(readers[3]?.querySelector('[data-webmention-avatar]')?.textContent.trim()).toBe('S')
    expect(dom.querySelector('#single [data-webmention-likes-total]')?.textContent).toBe('1')
    expect(dom.querySelector('#single [data-webmention-likes-count]')?.textContent).toMatch(/like$/u)
    expect(dom.querySelector('#empty')?.children).toHaveLength(0)
    expect(dom.querySelector('#replies [data-webmention-likes]')).toBeNull()
    expect(dom.querySelector('#replies [data-webmention-copy]')?.textContent).toBe('A reply without likes.')
    expect([...dom.querySelectorAll('#unicode-readers [data-webmention-reader-name]')].map(name => name.textContent))
      .toEqual(readerNames.map(reader => reader.name))
    expect.soft([...dom.querySelectorAll('#unicode-readers [data-webmention-avatar]')].map(avatar => avatar.textContent.trim()))
      .toEqual(readerNames.map(reader => reader.initial))
    const replyItems = [...dom.querySelectorAll('#bounded-replies [data-webmention-item]')]
    const renderedReplies = replyItems.map(reply => reply.querySelector('[data-webmention-copy]')?.textContent ?? '')

    expect.soft(renderedReplies).toEqual(replyCases.map(reply => reply.expected))
    expect(renderedReplies.every(text => text.length <= 2000)).toBe(true)
    expect(replyItems).toHaveLength(replyCases.length)
    for (const item of replyItems) {
      expect(item.querySelector('[data-webmention-source]')?.textContent).toContain('View original')
      expect(item.querySelector('[data-webmention-source] [data-arrow-exchange]')?.getAttribute('aria-hidden')).toBe('true')
    }
    expect.soft(dom.querySelector('#summary [data-webmention-copy]')?.textContent).toBe('a'.repeat(1998))
    expect(dom.querySelectorAll('#bounded-replies script')).toHaveLength(0)
    expect.soft([...dom.querySelectorAll('#dates [data-webmention-item]')].map(reply => reply.querySelector('time')?.getAttribute('datetime') ?? null))
      .toEqual(dateCases.map(date => date.expected))
    expect.soft([...dom.querySelectorAll('#dates [data-webmention-item]')].map(reply => reply.querySelector('time')?.textContent ?? null))
      .toEqual(dateCases.map(date => date.label))
    expect([...dom.querySelectorAll('#normalized-names [data-webmention-reader-name]')].map(name => name.textContent))
      .toEqual(['Someone', 'Someone', 'Someone', '👩🏽‍💻', 'می\u200cنا'])
    expect([...dom.querySelectorAll('#normalized-names [data-webmention-avatar]')].map(avatar => avatar.textContent.trim()))
      .toEqual(['S', 'S', 'S', '👩🏽‍💻', 'م'])
    expect([...dom.querySelectorAll('#normalized-names [data-webmention-author]')].map(name => name.textContent))
      .toEqual(['Anonymous', 'Anonymous', 'Anonymous', '👩🏽‍💻', 'می\u200cنا'])
    expect([...dom.querySelectorAll('#normalized-names [data-webmention-profile]')].map(link => link.textContent))
      .toEqual(['Anonymous', 'Anonymous', 'می\u200cنا'])
    expect(dom.querySelector('#normalized-names [data-webmention-likes-total]')?.textContent).toBe('5')
    expect(dom.querySelectorAll('#normalized-names [data-webmention-source]')).toHaveLength(5)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}, 35_000)
