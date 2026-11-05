import { constants } from 'node:fs'
import { cp, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'

import { archiveFiles, archiveHeaderRules } from '../../packages/website-history/finalize-archive.mjs'
import versions from '../../packages/website-history/versions.json' with { type: 'json' }

const root = resolve(import.meta.dirname, '../..')
const currentDirectory = resolve(root, 'dist')
// Error and offline documents describe a request state, not a page with an archived
// counterpart, so archived copies link to the current homepage instead.
const utilityPages = new Set(['404.html', 'offline/index.html'])

const currentPages = new Set((await archiveFiles(currentDirectory))
  .filter(path => path.endsWith('.html') && !versions.some(({ id }) => relative(currentDirectory, path).startsWith(`${id}${sep}`)))
  .map(path => relative(currentDirectory, path).split(sep).join('/'))
  .filter(page => !utilityPages.has(page)))

// Rendered independently of each era's styles. The notice stays in normal flow until
// the archive runtime measures it, then it is pinned and its real height is reserved.
const bannerStyle = `<style data-website-archive>
  .website-archive-banner {
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    background: Canvas;
    color: CanvasText;
    border-top: 1px solid GrayText;
    padding: .8rem max(1rem, env(safe-area-inset-right)) max(.8rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left));
    font: 400 .875rem/1.5 system-ui, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.2rem;
    flex-wrap: wrap;
    text-align: left;
    overflow-wrap: anywhere;
    box-shadow: 0 -2px 12px #0001;
  }
  @media (max-width: 600px) {
    .website-archive-banner { gap: .2rem; text-align: center; }
  }
  .website-archive-banner p { margin: 0; min-width: 0; }
  .website-archive-banner small { display: block; font-size: .75rem; }
  .website-archive-banner nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0 1rem;
    min-width: 0;
    max-width: 100%;
  }
  .website-archive-banner a {
    color: CanvasText;
    text-decoration: underline;
    text-underline-offset: .2em;
    display: inline-flex;
    min-height: 44px;
    min-width: 0;
    align-items: center;
    font-weight: 600;
  }
  .website-archive-banner a:focus-visible { outline: 2px solid Highlight; outline-offset: 4px; }
  html[data-website-archive-ready] {
    scroll-padding-bottom: var(--website-archive-banner-height, 0px);
  }
  html[data-website-archive-ready] body {
    padding-bottom: var(--website-archive-banner-height, 0px) !important;
  }
  html[data-website-archive-ready] .website-archive-banner {
    position: fixed;
    inset: auto 0 0;
    z-index: 2147483647;
    max-height: 45vh;
    max-height: 45dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  html[data-website-archive-ready] #back-to-top {
    bottom: calc(var(--website-archive-banner-height, 0px) + 1rem) !important;
  }
</style>`

for (const version of versions) {
  const destination = resolve(currentDirectory, version.id)

  await rm(destination, { recursive: true, force: true })

  await cp(resolve(root, 'apps', version.id, 'dist'), destination, { recursive: true, mode: constants.COPYFILE_FICLONE })

  await cp(resolve(root, 'packages/website-history/archive-banner.js'), resolve(destination, 'archive-banner.js'))

  const bannerScript = `<script type="module" src="/${version.id}/archive-banner.js" data-website-archive></script>`

  for (const path of await archiveFiles(destination)) {
    if (!path.endsWith('.html')) continue

    const page = relative(destination, path).split(sep).join('/')
    const current = currentPages.has(page) ? `/${page.replace(/index\.html$/, '')}` : '/'
    const currentLabel = current === '/' ? 'Visit current website' : 'View current page'
    const banner = `<aside class="website-archive-banner" aria-label="Website archive"><p><strong>${version.id.toUpperCase()} · ${version.date}</strong> — Archived website<small>Historical content. Forms and comments are disabled.</small></p><nav aria-label="Leave this archive"><a href="/history/" data-astro-reload>Website history</a><a href="${current}" data-astro-reload>${currentLabel}</a></nav></aside>`
    const html = await readFile(path, 'utf8')

    await writeFile(path, html.replace('</head>', `${bannerStyle}${bannerScript}</head>`).replace('</body>', `${banner}</body>`))
  }
}

const headersPath = resolve(currentDirectory, '_headers')
const headers = (await readFile(headersPath, 'utf8')).split('# Website archives')[0]
const archiveHeaders = versions.map(({ id }) => archiveHeaderRules(id)).join('')

await writeFile(headersPath, headers + '# Website archives\n' + archiveHeaders)

console.log(`Assembled current website and ${versions.length} historical versions in dist/.`)
