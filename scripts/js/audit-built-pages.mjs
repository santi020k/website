import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { JSDOM, VirtualConsole } from 'jsdom'

const origin = 'https://santi020k.com'

/** @param {string} directory @returns {Promise<string[]>} */
const walk = async directory => (await Promise.all((await readdir(directory, { withFileTypes: true }))
  .map(entry => entry.isDirectory() ?
    walk(path.join(directory, entry.name)) :
    path.join(directory, entry.name)))).flat()

/** @param {string} relativePath */
const getRoute = relativePath => {
  if (relativePath === 'index.html') return '/'

  if (relativePath === '404.html') return '/404/'

  return `/${relativePath.replaceAll(path.sep, '/').replace(/index\.html$/u, '')}`
}

/** @param {unknown} error */
const isMissing = error => typeof error === 'object' && error !== null && 'code' in error &&
  (error.code === 'ENOENT' || error.code === 'ENOTDIR')

/** @param {string} target */
const getInfo = target => stat(target).catch(error => {
  if (isMissing(error)) return null

  throw error
})

/**
 * @typedef {{route: string, kind: string, target?: string}} PageIssue
 * @typedef {{route: string, pathname: string, hash: string}} LocalReference
 */

/** @param {string} directory */
export const auditBuiltPages = async directory => {
  const files = (await walk(directory)).filter(file => file.endsWith('.html'))
  /** @type {PageIssue[]} */
  const issues = []

  if (!files.length) issues.push({ route: '/', kind: 'missing-documents' })

  /** @type {Map<string, Set<string>>} */
  const anchors = new Map()
  /** @type {LocalReference[]} */
  const references = []

  const redirects = (await readFile(path.join(directory, '_redirects'), 'utf8').catch(error => {
    if (isMissing(error)) return ''

    throw error
  })).split('\n').map(line => line.trim().split(/\s+/u))
    .filter(parts => parts.length >= 2 && !parts[0].startsWith('#'))

  for (const file of files) {
    const route = getRoute(path.relative(directory, file))
    // Resources and scripts stay disabled. CSS diagnostics are outside this DOM
    // audit; rendered accessibility and browser tests verify styles separately.
    const dom = new JSDOM(await readFile(file, 'utf8'), { url: `${origin}${route}`, virtualConsole: new VirtualConsole() })
    const document = dom.window.document
    const ids = [...document.querySelectorAll('[id]')].map(element => element.id)
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)

    anchors.set(route, new Set(ids))

    if (duplicateIds.length) issues.push({ route, kind: 'duplicate-id', target: [...new Set(duplicateIds)].join(', ') })

    if (!document.querySelector('meta[http-equiv="refresh"]')) {
      if (document.querySelectorAll('h1').length !== 1) issues.push({ route, kind: 'heading-count' })

      if (document.querySelectorAll('main').length !== 1) issues.push({ route, kind: 'main-count' })

      if (!document.documentElement.lang) issues.push({ route, kind: 'language' })

      if (!document.title.trim()) issues.push({ route, kind: 'title' })
    }

    for (const element of document.querySelectorAll('a[href], img[src], script[src], link[href]')) {
      const value = element.getAttribute(element.hasAttribute('src') ? 'src' : 'href')

      if (!value) continue

      const url = new URL(value, `${origin}${route}`)

      if (url.origin === origin) references.push({ route, pathname: url.pathname, hash: url.hash })
    }

    dom.window.close()
  }

  /** @param {string} pathname @param {Set<string>} visited @returns {Promise<string | null>} */
  const resolveTarget = async (pathname, visited) => {
    if (visited.has(pathname)) return null

    visited.add(pathname)

    const target = path.join(directory, decodeURIComponent(pathname))
    const info = await getInfo(target)

    if (info?.isFile() || (info?.isDirectory() && await getInfo(path.join(target, 'index.html')))) return pathname

    if (pathname === '/404/' && files.includes(path.join(directory, '404.html'))) return pathname

    const redirect = redirects.find(([from]) => from === pathname ||
      (from.includes('*') && pathname.startsWith(from.split('*')[0])))

    if (!redirect) return null

    const [from, destination] = redirect
    const prefix = from.split('*')[0]
    const url = new URL(destination.replace(':splat', pathname.slice(prefix.length)), origin)

    if (url.origin !== origin) return /^https?:$/u.test(url.protocol) ? url.href : null

    return resolveTarget(url.pathname, visited)
  }

  /** @type {Map<string, string | null>} */
  const targets = new Map()

  for (const reference of references) {
    const { pathname } = reference
    let resolved = targets.get(pathname)

    if (resolved === undefined) {
      resolved = await resolveTarget(pathname, new Set())

      targets.set(pathname, resolved)
    }

    if (resolved === null) {
      issues.push({ route: reference.route, kind: 'missing-target', target: pathname })
    } else if (reference.hash && anchors.has(resolved)) {
      const id = decodeURIComponent(reference.hash.slice(1))

      if (id && !anchors.get(resolved).has(id)) issues.push({ route: reference.route, kind: 'missing-fragment', target: `${pathname}${reference.hash}` })
    }
  }

  return { pages: files.length, targets: targets.size, issues }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await auditBuiltPages(path.resolve('dist'))

  console.log(`Built page audit: ${result.pages} documents, ${result.targets} local targets, ${result.issues.length} errors`)

  for (const issue of result.issues) console.error(`${issue.route}: ${issue.kind}${issue.target ? ` (${issue.target})` : ''}`)

  if (result.issues.length) process.exitCode = 1
}
