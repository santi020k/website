import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

import { JSDOM } from 'jsdom'

import { archiveFiles } from '../../packages/website-history/finalize-archive.mjs'
import versions from '../../packages/website-history/versions.json' with { type: 'json' }

const directory = resolve(import.meta.dirname, '../../dist')
const origin = 'https://santi020k.com'
const sitemap = await readFile(resolve(directory, 'sitemap-0.xml'), 'utf8')
const headers = await readFile(resolve(directory, '_headers'), 'utf8')
/** @type {string[]} */
const issues = []
let count = 0

for (const { id } of versions) {
  if (sitemap.includes(`${origin}/${id}/`)) issues.push(`${id} was included in the current sitemap`)

  if (!headers.includes(`/${id}/*\n  X-Robots-Tag: noindex, follow`)) issues.push(`${id} is missing noindex headers`)

  for (const file of await archiveFiles(resolve(directory, id))) {
    if (!file.endsWith('.html')) continue

    const dom = new JSDOM(await readFile(file, 'utf8'))
    const document = dom.window.document

    if (document.querySelector('meta[name="robots"]')?.getAttribute('content') !== 'noindex, follow') issues.push(`${file}: noindex missing`)

    if (!document.querySelector('.website-archive-banner a[data-astro-reload]')) issues.push(`${file}: archive exit missing`)

    if (document.querySelector('link[rel="sitemap"], link[rel="manifest"]')) issues.push(`${file}: archive sitemap or manifest present`)

    if (document.querySelector('form[action^="http"], form[method="post"]:not([inert])')) issues.push(`${file}: live form present`)

    for (const element of document.querySelectorAll('a[href], img[src], script[src], link[href]')) {
      const value = element.getAttribute(element.tagName === 'A' || element.tagName === 'LINK' ? 'href' : 'src')

      if (!value?.startsWith('/') || value.startsWith('//')) continue

      const path = new URL(value, origin).pathname

      if (!path.startsWith(`/${id}/`) && !element.closest('.website-archive-banner')) issues.push(`${file}: unscoped URL ${value}`)

      try {
        const target = resolve(directory, `.${decodeURIComponent(path)}`, path.endsWith('/') ? 'index.html' : '')

        await stat(target)
      } catch {
        issues.push(`${file}: missing local URL ${value}`)
      }
    }

    dom.window.close()

    count++
  }
}

if (issues.length > 0) throw new Error(`Archive audit failed:\n${[...new Set(issues)].join('\n')}`)

console.log(`Verified archive SEO, navigation and local assets across ${count} pages.`)
