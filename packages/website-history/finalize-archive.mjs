import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** @param {string} directory @returns {Promise<string[]>} */
export const archiveFiles = async directory => {
  /** @type {string[]} */
  const files = []

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) files.push(...await archiveFiles(path))
    else if (entry.isFile()) files.push(path)
  }

  return files
}

/** @param {string} value @param {string} id */
export const archiveUrl = (value, id) => {
  if (!value.startsWith('/') || value.startsWith('//') || value === `/${id}` || value.startsWith(`/${id}/`)) return value

  return `/${id}${value}`
}

export const archiveOrigin = 'https://santi020k.com'

/** Keep the skip link first in the keyboard order, followed by the archive notice.
 * @param {string} html @param {string} notice
 */
export const addArchiveNotice = (html, notice) => {
  const skipLink = /<a\b[^>]*\bhref=(["'])#main\1[^>]*>[\s\S]*?<\/a>/i

  if (!skipLink.test(html)) throw new Error('Archive document is missing its skip link')

  return html.replace(skipLink, link => `${link}${notice}`)
}

// Absolute and protocol-relative links to the production origin bypass local URL
// scoping. Outside this archive they lead to another app, so they need a full load.
/** @param {string} value @param {string} id */
export const isArchiveExit = (value, id) => {
  if (!/^(?:https?:)?\/\//i.test(value)) return false

  /** @type {URL} */
  let url

  try {
    url = new URL(value, archiveOrigin)
  } catch {
    return false
  }

  return url.origin === archiveOrigin && url.pathname !== `/${id}` && !url.pathname.startsWith(`/${id}/`)
}

// Astro's client router would otherwise swap the current site into the archive document.
/** @param {string} html @param {string} id */
const markArchiveExits = (html, id) => html.replace(/<a(?=[\s>])[^>]*>/gi, tag => {
  const href = /\shref=(['"])([^'"]*)\1/i.exec(tag)?.[2]

  if (href === undefined || !isArchiveExit(href, id) || /\sdata-astro-reload(?=[\s=/>])/i.test(tag)) return tag

  return `<a data-astro-reload${tag.slice(2)}`
})

/** @param {string} id @param {string} [policy] Source header policy restored for the archive. */
export const archiveHeaderRules = (id, policy) => [
  `/${id}\n  X-Robots-Tag: noindex, follow\n`,
  // The current site's header policy allows inline scripts only by hash. Archived pages use
  // inline event handlers, so each archive detaches that policy and restores the source one.
  `/${id}/*\n  X-Robots-Tag: noindex, follow\n${policy ? `  ! Content-Security-Policy\n  Content-Security-Policy: ${policy}\n` : ''}`,
  // Astro content-hashes every emitted file in _astro, so archive bundles never change in place.
  `/${id}/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n`
].map(rule => `\n${rule}`).join('')

/**
 * Reads the Content-Security-Policy value from a _headers file.
 * @param {string} headers
 */
export const readHeaderPolicy = headers => {
  const prefix = 'content-security-policy:'
  const line = headers.split('\n').map(value => value.trim()).find(value => value.toLowerCase().startsWith(prefix))

  return line?.slice(prefix.length).trim() || undefined
}

/** @param {string} html @param {string} id */
export const archiveHtml = (html, id) => markArchiveExits(html, id)
  .replace(/\b(href|src|action|poster|data-src)=(['"])([^'"]*)\2/g,
    /** @param {string} _ @param {string} attribute @param {string} quote @param {string} value */
    (_, attribute, quote, value) => {
      let url = archiveUrl(value, id)

      if (attribute === 'href' && url.startsWith('/') && !url.startsWith('//')) {
        const suffixIndex = url.search(/[?#]/)
        const pathname = suffixIndex === -1 ? url : url.slice(0, suffixIndex)
        const suffix = suffixIndex === -1 ? '' : url.slice(suffixIndex)

        if (!pathname.endsWith('/') && !/\.[^/]+$/.test(pathname)) url = `${pathname}/${suffix}`
      }

      return `${attribute}=${quote}${url}${quote}`
    })
  .replace(/\bsrcset=(['"])([^'"]*)\1/g,
    /** @param {string} _ @param {string} quote @param {string} value */
    (_, quote, value) => `srcset=${quote}${value.split(',').map(candidate => candidate.replace(/^(\s*)(\/[^\s]+)/,
      /** @param {string} _match @param {string} whitespace @param {string} url */
      (_match, whitespace, url) => `${whitespace}${archiveUrl(url, id)}`)).join(',')}${quote}`)
  .replace(/<meta\b[^>]*name=['"]robots['"][^>]*>/gi, '')
  .replace(/<link\b[^>]*rel=['"](?:manifest|sitemap)['"][^>]*>/gi, '')
  .replace(/<form\b(?=[^>]*(?:method=['"]post['"]|action=['"]https?:))[^>]*>/gi,
    '<form inert aria-label="Archived form — submissions disabled">')
  .replace('</head>', '<meta name="robots" content="noindex, follow"></head>')

/** @param {string} json @param {string} id */
export const archiveSearchIndex = (json, id) => json.replace(/"(path|url|coverUrl|coverAvifUrl)":\s*"([^"\\]*)"/g,
  /** @param {string} _ @param {string} field @param {string} value */
  (_, field, value) => `"${field}":"${archiveUrl(value, id)}"`)

/** @param {URL} dir @param {{ id: string, date: string }} version */
export const finalizeArchive = async (dir, version) => {
  for (const path of await archiveFiles(fileURLToPath(dir))) {
    if (!/\.(?:html|css|js|json)$/.test(path)) continue

    let content = await readFile(path, 'utf8')

    if (path.endsWith('.html')) content = archiveHtml(content, version.id)

    content = content.replace(/url\((['"]?)(\/[^)'"\s]+)\1\)/g,
      /** @param {string} _ @param {string} quote @param {string} value */
      (_, quote, value) => `url(${quote}${archiveUrl(value, version.id)}${quote})`)
      .replace(/(['"])\/search-index\.json\1/g, `$1/${version.id}/search-index.json$1`)

    if (path.endsWith('search-index.json')) content = archiveSearchIndex(content, version.id)

    await writeFile(path, content)
  }
}
