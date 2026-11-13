import { constants } from 'node:fs'
import { cp, readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'

import { addArchiveNotice, archiveFiles, archiveHeaderRules, readHeaderPolicy } from '../../packages/website-history/finalize-archive.mjs'
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
  .website-archive-banner, .website-archive-banner * { box-sizing: border-box; }
  .website-archive-banner {
    --archive-muted: color-mix(in srgb, CanvasText 68%, Canvas);
    --archive-line: color-mix(in srgb, CanvasText 18%, Canvas);
    width: 100%;
    max-width: 100%;
    background: color-mix(in srgb, CanvasText 3%, Canvas);
    color: CanvasText;
    border-bottom: 1px solid var(--archive-line);
    padding: max(.75rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) .75rem max(1rem, env(safe-area-inset-left));
    font: 400 .875rem/1.5 system-ui, sans-serif;
    letter-spacing: normal;
    text-align: left;
    overflow-wrap: anywhere;
  }
  .website-archive-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .75rem 2rem;
    flex-wrap: wrap;
    max-width: 72rem;
    margin-inline: auto;
  }
  .website-archive-banner p {
    display: flex;
    flex: 1 1 23rem;
    flex-wrap: wrap;
    align-items: center;
    gap: .2rem .75rem;
    margin: 0;
    min-width: 0;
  }
  .website-archive-heading { font-weight: 650; line-height: 1.3; }
  .website-archive-banner strong {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: .35em;
    max-width: 100%;
    color: var(--archive-muted);
    font-size: .75rem;
    font-weight: 400;
    font-variant-numeric: tabular-nums;
  }
  .website-archive-version {
    padding: .35em .5em;
    border: 1px solid var(--archive-line);
    border-radius: .35rem;
    background: Canvas;
    color: CanvasText;
    font-weight: 650;
    line-height: 1;
  }
  .website-archive-banner small {
    flex-basis: 100%;
    color: var(--archive-muted);
    font-size: .75rem;
  }
  .website-archive-banner nav {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    gap: .4rem .5rem;
    margin-inline-start: auto;
    min-width: 0;
    max-width: 100%;
  }
  .website-archive-banner a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    min-width: 0;
    padding: .5em .75em;
    border: 1px solid transparent;
    border-radius: .5rem;
    color: CanvasText;
    font: inherit;
    font-weight: 500;
    line-height: 1.35;
    text-align: center;
    text-decoration: underline;
    text-decoration-color: var(--archive-line);
    text-underline-offset: .25em;
  }
  .website-archive-banner a:hover {
    background: color-mix(in srgb, CanvasText 8%, Canvas);
    text-decoration-color: currentColor;
  }
  .website-archive-banner a:first-child {
    border-color: CanvasText;
    background: CanvasText;
    color: Canvas;
    font-weight: 600;
    text-decoration: none;
  }
  .website-archive-banner a:first-child:hover {
    background: color-mix(in srgb, CanvasText 88%, Canvas);
  }
  .website-archive-banner a:focus-visible { outline: 2px solid Highlight; outline-offset: 3px; }
  @media (max-width: 600px) {
    .website-archive-banner nav { width: 100%; margin-inline-start: 0; }
    .website-archive-banner a { flex: 1 1 auto; padding-inline: .5em; }
    .website-archive-banner nav:has(> a:nth-child(3)) > a:first-child { flex-basis: 100%; }
  }
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
    const banner = `<aside class="website-archive-banner" aria-label="Website archive"><div class="website-archive-inner"><p><span class="website-archive-heading">Archived website</span><strong><span class="website-archive-version">${version.id.toUpperCase()}</span> · <time datetime="${version.date}">${version.date}</time></strong><small>Forms and comments are disabled.</small></p><nav aria-label="Leave this archive">${currentLink}<a href="/" data-astro-reload>Current homepage</a><a href="/history/" data-astro-reload>Website history</a></nav></div></aside>`
    const html = await readFile(path, 'utf8')

    await writeFile(path, addArchiveNotice(html.replace('</head>', `${bannerStyle}${bannerScript}</head>`), banner))
  }
}

const headersPath = resolve(currentDirectory, '_headers')
const headers = (await readFile(headersPath, 'utf8')).split('# Website archives')[0]
// dist/_headers now carries the hashed script policy; archives get the source policy back.
const archivePolicy = readHeaderPolicy(await readFile(resolve(root, 'public/_headers'), 'utf8'))

if (!archivePolicy) throw new Error('public/_headers has no Content-Security-Policy for the archived sites.')

const archiveHeaders = versions.map(({ id }) => archiveHeaderRules(id, archivePolicy)).join('')

await writeFile(headersPath, headers + '# Website archives\n' + archiveHeaders)

console.log(`Assembled current website and ${versions.length} historical versions in dist/.`)
