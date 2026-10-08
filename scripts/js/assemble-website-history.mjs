import { constants } from 'node:fs'
import { cp, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'

import { archiveFiles } from '../../packages/website-history/finalize-archive.mjs'
import versions from '../../packages/website-history/versions.json' with { type: 'json' }

const root = resolve(import.meta.dirname, '../..')
const currentDirectory = resolve(root, 'dist')

const currentPages = new Set((await archiveFiles(currentDirectory))
  .filter(path => path.endsWith('.html') && !versions.some(({ id }) => relative(currentDirectory, path).startsWith(`${id}${sep}`)))
  .map(path => relative(currentDirectory, path).split(sep).join('/')))

// Rendered independently of each era's styles; fixed placement preserves its layout.
const bannerStyle = '<style data-website-archive>body{padding-bottom:7rem!important}.website-archive-banner{position:fixed;inset:auto 0 0;z-index:2147483647;background:Canvas;color:CanvasText;border-top:1px solid GrayText;padding:.8rem max(1rem,env(safe-area-inset-right)) max(.8rem,env(safe-area-inset-bottom));font:400 14px/1.5 system-ui,sans-serif;display:flex;align-items:center;justify-content:center;gap:1.2rem;flex-wrap:wrap;box-shadow:0 -2px 12px #0001}.website-archive-banner p{margin:0}.website-archive-banner a{color:CanvasText;text-decoration:underline;text-underline-offset:.2em;display:inline-flex;min-height:44px;align-items:center;font-weight:600}.website-archive-banner a:focus-visible{outline:2px solid Highlight;outline-offset:4px}.website-archive-banner nav{display:flex;gap:1rem}.website-archive-banner small{display:block;font-size:12px}@media(max-width:600px){.website-archive-banner{gap:.2rem;text-align:center}.website-archive-banner nav{justify-content:center}body{padding-bottom:9rem!important}}</style>'

for (const version of versions) {
  const destination = resolve(currentDirectory, version.id)

  await rm(destination, { recursive: true, force: true })

  await cp(resolve(root, 'apps', version.id, 'dist'), destination, { recursive: true, mode: constants.COPYFILE_FICLONE })

  for (const path of await archiveFiles(destination)) {
    if (!path.endsWith('.html')) continue

    const page = relative(destination, path).split(sep).join('/')
    const current = currentPages.has(page) ? `/${page.replace(/index\.html$/, '')}` : '/'
    const currentLabel = current === '/' ? 'Visit current website' : 'View current page'
    const banner = `<aside class="website-archive-banner" aria-label="Website archive"><p><strong>${version.id.toUpperCase()} · ${version.date}</strong> — Archived website<small>Historical content. Forms and comments are disabled.</small></p><nav aria-label="Leave this archive"><a href="/history/" data-astro-reload>Website history</a><a href="${current}" data-astro-reload>${currentLabel}</a></nav></aside>`
    const html = await readFile(path, 'utf8')

    await writeFile(path, html.replace('</head>', `${bannerStyle}</head>`).replace('</body>', `${banner}</body>`))
  }
}

const headersPath = resolve(currentDirectory, '_headers')
const headers = (await readFile(headersPath, 'utf8')).split('# Website archives')[0]
const archiveHeaders = versions.map(({ id }) => `\n/${id}\n  X-Robots-Tag: noindex, follow\n\n/${id}/*\n  X-Robots-Tag: noindex, follow\n`).join('')

await writeFile(headersPath, headers + '# Website archives\n' + archiveHeaders)

console.log(`Assembled current website and ${versions.length} historical versions in dist/.`)
