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

/** @param {string} html @param {string} id */
export const archiveHtml = (html, id) => html
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
