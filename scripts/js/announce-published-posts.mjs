import { readFile } from 'node:fs/promises'
import { resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Tells search engines and linked sites about posts the scheduled workflow just deployed.
 * It waits until production lists each post, then pings IndexNow once for all of them and
 * sends a Webmention to every outbound article link that advertises an endpoint.
 *
 * Usage: node scripts/js/announce-published-posts.mjs https://santi020k.com/blog/slug/ …
 * Runs with Node built-ins only, because the workflow checks out a sparse tree without
 * installing dependencies.
 */

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
const origin = 'https://santi020k.com'
const host = new URL(origin).host
const keyFile = 'indexnow-key.txt'
const indexNowEndpoint = 'https://api.indexnow.org/indexnow'
const requestTimeout = 15_000
const maxTargetsPerPost = 25

/** Hosts that are part of the site family; mentions between them add nothing. */
export const isOwnHost = (/** @type {string} */ hostname) => hostname === host || hostname.endsWith(`.${host}`)

// `&amp;` goes last so an escaped entity such as `&amp;lt;` decodes to `&lt;`, not `<`.
const decodeEntities = (/** @type {string} */ value) => value
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', '\'')
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&amp;', '&')

/**
 * Returns the markup inside `#article-content`, the article prose rendered by the Post layout.
 * The built HTML is generated, so balancing `div` tags is enough to find where it ends.
 * @param {string} html
 */
export const extractArticleBody = html => {
  const start = /<div\b[^>]*\bid=["']?article-content\b[^>]*>/u.exec(html)

  if (!start) return ''

  const tags = /<\/?div\b[^>]*>/giu
  let depth = 1

  tags.lastIndex = start.index + start[0].length

  for (let match = tags.exec(html); match; match = tags.exec(html)) {
    depth += match[0].startsWith('</') ? -1 : 1

    if (depth === 0) return html.slice(start.index + start[0].length, match.index)
  }

  return html.slice(start.index + start[0].length)
}

/**
 * Outbound http(s) links in an article body, without fragments, duplicates, or own hosts.
 * @param {string} body
 * @param {string} base
 */
export const findOutboundLinks = (body, base) => {
  const links = new Set()

  for (const [, , raw = ''] of body.matchAll(/<a\b[^>]*\bhref=(["'])(.*?)\1/giu)) {
    try {
      const url = new URL(decodeEntities(raw), base)

      if (!/^https?:$/u.test(url.protocol) || isOwnHost(url.hostname)) continue

      url.hash = ''

      links.add(url.href)
    } catch {
      // Ignore hrefs that are not URLs.
    }
  }

  return [...links]
}

/**
 * Finds a Webmention endpoint the way the spec orders it: the HTTP Link header first, then
 * the first `<link>` or `<a>` with rel="webmention" in the document.
 * @param {string} target
 * @param {string | null} linkHeader
 * @param {string} html
 */
export const discoverEndpoint = (target, linkHeader, html) => {
  for (const part of linkHeader?.split(/,(?=\s*<)/u) ?? []) {
    const match = /<([^>]*)>\s*;(.*)$/u.exec(part.trim())

    if (match && /\brel\s*=\s*"?[^";]*\bwebmention\b/iu.test(match[2] ?? '')) return new URL(match[1] ?? '', target).href
  }

  for (const [tag = ''] of html.matchAll(/<(?:link|a)\b[^>]*>/giu)) {
    if (!/\brel=(["'])[^"']*\bwebmention\b[^"']*\1/iu.test(tag)) continue

    const href = /\bhref=(["'])(.*?)\1/iu.exec(tag)?.[2]

    if (href !== undefined) return new URL(decodeEntities(href), target).href
  }

  return undefined
}

/**
 * @param {string} key
 * @param {string[]} urlList
 */
export const createIndexNowPayload = (key, urlList) => ({
  host,
  key,
  keyLocation: `${origin}/${keyFile}`,
  urlList
})

const fetchText = async (/** @type {string} */ url) => {
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(requestTimeout) })

  return { response, text: response.ok ? await response.text() : '' }
}

/** Polls the production feed until every URL is listed or the deadline passes. */
const waitForProduction = async (/** @type {string[]} */ urls, /** @type {number} */ deadline) => {
  for (;;) {
    try {
      const { text } = await fetchText(`${origin}/feed.json?announce=${Date.now()}`)
      /** @type {{ items?: { url?: string }[] }} */
      const feed = JSON.parse(text)
      const listed = new Set((feed.items ?? []).flatMap(({ url }) => (url ? [url] : [])))
      const missing = urls.filter(url => !listed.has(url))

      if (missing.length === 0) return true

      console.log(`Waiting for production to list ${missing.length} post(s).`)
    } catch (error) {
      console.log(`Feed check failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    if (Date.now() + 60_000 > deadline) return false

    await new Promise(resolve => setTimeout(resolve, 60_000))
  }
}

const sendWebmentions = async (/** @type {string} */ source) => {
  const { text } = await fetchText(source)
  const targets = findOutboundLinks(extractArticleBody(text), source).slice(0, maxTargetsPerPost)
  let sent = 0

  for (const target of targets) {
    try {
      const { response, text: targetHtml } = await fetchText(target)
      const endpoint = discoverEndpoint(response.url || target, response.headers.get('link'), targetHtml)

      if (!endpoint) continue

      const result = await fetch(endpoint, {
        body: new URLSearchParams({ source, target }),
        method: 'POST',
        signal: AbortSignal.timeout(requestTimeout)
      })

      console.log(`Webmention ${result.status}: ${target}`)

      sent += result.ok ? 1 : 0
    } catch (error) {
      console.log(`Skipped ${target}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  console.log(`${source}: ${sent} Webmention(s) accepted from ${targets.length} outbound link(s).`)
}

if (process.argv[1] && resolvePath(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const urls = process.argv.slice(2).filter(url => url.startsWith(`${origin}/`))
  const minutes = 45

  if (urls.length === 0) {
    console.log('No published posts to announce.')

    process.exit(0)
  }

  if (!await waitForProduction(urls, Date.now() + minutes * 60_000)) {
    console.log(`::warning::Production did not list every post within ${minutes} minutes; nothing was announced.`)

    process.exit(0)
  }

  const key = (await readFile(resolvePath(projectRoot, 'public', keyFile), 'utf8')).trim()

  const indexNow = await fetch(indexNowEndpoint, {
    body: JSON.stringify(createIndexNowPayload(key, urls)),
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    method: 'POST',
    signal: AbortSignal.timeout(requestTimeout)
  })

  // 200 and 202 both mean the submission was accepted.
  console.log(`IndexNow responded with ${indexNow.status}.`)

  if (!indexNow.ok) console.log(`::warning::IndexNow rejected the submission (${indexNow.status}).`)

  for (const url of urls) await sendWebmentions(url)
}
