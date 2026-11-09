import { constants } from 'node:fs'
import { cp, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'

import { addArchiveNotice, archiveFiles, archiveHeaderRules } from '../../packages/website-history/finalize-archive.mjs'
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

// Rendered independently of each era's styles, in document flow above its navigation.
const bannerStyle = `<style data-website-archive>
  .website-archive-banner {
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    background: Canvas;
    color: CanvasText;
    border-bottom: 1px solid GrayText;
    padding: max(.8rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) .8rem max(1rem, env(safe-area-inset-left));
    font: 400 .875rem/1.5 system-ui, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.2rem;
    flex-wrap: wrap;
    text-align: left;
    overflow-wrap: anywhere;
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
  body > a[href="#main"]:focus { z-index: 100; }
  /* V1 alone fixes its mobile header to the viewport. Keep it below the notice,
     with its original content spacing, before it sticks on scroll. */
  @media (width < 48rem) {
    #main-header { position: sticky; width: calc(100% + 2rem); margin-inline: -1rem; margin-bottom: -4rem; }
    #main-header:has(#toggle-nav-menu-mobile[aria-expanded="true"]) { position: fixed; width: 100%; margin-inline: 0; }
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
    const currentLink = current === '/' ? '' : `<a href="${current}" data-astro-reload>View current page</a>`
    const banner = `<aside class="website-archive-banner" aria-label="Website archive"><p><strong>${version.id.toUpperCase()} · ${version.date}</strong> — Archived website<small>Historical content. Forms and comments are disabled.</small></p><nav aria-label="Leave this archive">${currentLink}<a href="/" data-astro-reload>Current homepage</a><a href="/history/" data-astro-reload>Website history</a></nav></aside>`
    const html = await readFile(path, 'utf8')

    await writeFile(path, addArchiveNotice(html.replace('</head>', `${bannerStyle}${bannerScript}</head>`), banner))
  }
}

const headersPath = resolve(currentDirectory, '_headers')
const headers = (await readFile(headersPath, 'utf8')).split('# Website archives')[0]
const archiveHeaders = versions.map(({ id }) => archiveHeaderRules(id)).join('')

await writeFile(headersPath, headers + '# Website archives\n' + archiveHeaders)

console.log(`Assembled current website and ${versions.length} historical versions in dist/.`)
