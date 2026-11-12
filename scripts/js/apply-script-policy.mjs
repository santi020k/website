import { createHash } from 'node:crypto'
import { glob, readFile, writeFile } from 'node:fs/promises'
import { join, resolve as resolvePath, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { html as markup, parse } from 'parse5'

/**
 * @typedef {import('parse5').DefaultTreeAdapterTypes.ChildNode} ChildNode
 * @typedef {import('parse5').DefaultTreeAdapterTypes.Element} Element
 * @typedef {import('parse5').DefaultTreeAdapterTypes.ParentNode} ParentNode
 */

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
// Archived sites are assembled into v1/, v2/… after this step. Their header rules restore the
// source policy, which still allows their inline event handlers.
const archivePath = /^v\d+\//u
const urlAttributes = new Set(['action', 'formaction', 'href', 'src'])
const policyMeta = /<meta\s+http-equiv=(["'])content-security-policy\1[^>]*>\s*/giu
const charsetMeta = /<meta\s+charset=[^>]*>/iu
const openingHead = /<head\b[^>]*>/iu

// Script types the HTML standard runs: classic JavaScript MIME types, modules, import maps,
// and speculation rules all need a hash; JSON-LD and other data blocks do not.
const executableTypes = new Set([
  '',
  'application/ecmascript',
  'application/javascript',
  'application/x-ecmascript',
  'application/x-javascript',
  'importmap',
  'module',
  'speculationrules',
  'text/ecmascript',
  'text/javascript',
  'text/javascript1.0',
  'text/javascript1.1',
  'text/javascript1.2',
  'text/javascript1.3',
  'text/javascript1.4',
  'text/javascript1.5',
  'text/jscript',
  'text/livescript',
  'text/x-ecmascript',
  'text/x-javascript'
])

/** @param {Element} element @param {string} name */
const readAttribute = (element, name) => element.attrs.find(attribute => attribute.name === name)?.value

/** @param {Element} element */
const readType = element => {
  const type = readAttribute(element, 'type')
  const language = readAttribute(element, 'language')

  if (type !== undefined) return type.trim().toLowerCase()

  return language ? `text/${language}`.trim().toLowerCase() : ''
}

// SVG scripts name their external file with href instead of src.
/** @param {Element} element */
const isExternal = element => element.attrs.some(({ name }) => name === 'src' ||
  (name === 'href' && element.namespaceURI === markup.NS.SVG))

// Browsers hash the script text after the HTML parser normalizes newlines.
/** @param {string} source */
export const hashScript = source => {
  const digest = createHash('sha256').update(source.replace(/\r\n?/gu, '\n')).digest('base64')

  return `'sha256-${digest}'`
}

// URL parsing removes tabs and newlines anywhere and leading controls and spaces, so
// "java&#9;script:" still runs.
/** @param {string} value */
const normalizeUrl = value => {
  const url = value.replace(/[\t\n\r]/gu, '')
  let start = 0

  while (start < url.length && url.charCodeAt(start) <= 0x20) start += 1

  return url.slice(start)
}

/** @param {string} name @param {string} value */
const runsScript = (name, value) => /^on[a-z]+$/u.test(name) ||
  (urlAttributes.has(name) && /^javascript:/iu.test(normalizeUrl(value)))

// Values are JSON-quoted so characters such as the tab in "java&#9;script:" stay visible.
/** @param {Element} element */
const describeStartTag = element => {
  const attributes = element.attrs.map(({ name, prefix, value }) => {
    const qualifiedName = prefix ? `${prefix}:${name}` : name

    return ` ${qualifiedName}=${JSON.stringify(value)}`
  })

  return `<${element.tagName}${attributes.join('')}>`.slice(0, 120)
}

// Template contents are included: they run once a script clones them into the page.
/** @param {ParentNode} root */
const listElements = root => {
  /** @type {Element[]} */
  const elements = []
  /** @type {ChildNode[]} */
  const pending = [...root.childNodes].reverse()

  for (let node = pending.pop(); node; node = pending.pop()) {
    if (!('tagName' in node)) continue

    elements.push(node)

    const children = 'content' in node ? node.content.childNodes : node.childNodes

    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index]

      if (child) pending.push(child)
    }
  }

  return elements
}

/**
 * Reads the document as the browser builds it, so script text, raw text such as styles,
 * comments, and malformed markup follow the HTML parsing rules instead of patterns.
 * Inline handlers and javascript: URLs cannot be allowed by hash without 'unsafe-hashes'.
 * @param {string} html
 */
export const inspectDocument = html => {
  /** @type {string[]} */
  const findings = []
  /** @type {Set<string>} */
  const hashes = new Set()

  for (const element of listElements(parse(html))) {
    if (element.attrs.some(({ name, value }) => runsScript(name.toLowerCase(), value))) {
      findings.push(describeStartTag(element))
    }

    if (element.tagName === 'script' && !isExternal(element) && executableTypes.has(readType(element))) {
      const source = element.childNodes.map(node => ('value' in node ? node.value : '')).join('')

      hashes.add(hashScript(source))
    }
  }

  return { findings, hashes }
}

const policyHeader = /^(\s*Content-Security-Policy:\s*)(.+)$/imu
// Cloudflare ignores a _headers line longer than this, which would drop the whole policy.
const headerLineLimit = 2000

/**
 * The source header policy names the allowed script origins; the built policies keep
 * those and swap 'unsafe-inline' for the hashes of this build's inline scripts. Hashes
 * from an earlier run are dropped so the step can run twice on one build.
 * @param {string} headers
 */
export const readHeaderScriptSources = headers => {
  const policy = policyHeader.exec(headers)?.[2]

  const scriptSources = policy?.split(';').map(directive => directive.trim().split(/\s+/u))
    .find(([name]) => name === 'script-src')

  if (!scriptSources) throw new Error('dist/_headers has no Content-Security-Policy script-src directive.')

  return scriptSources.slice(1).filter(source => source !== '\'unsafe-inline\'' && !source.startsWith('\'sha256-'))
}

/**
 * Rewrites the header policy's script-src so the response header is as strict as the page
 * policy. Archived sites get the source policy back from archive assembly.
 * @param {string} headers @param {string} scriptPolicy
 */
export const applyHeaderPolicy = (headers, scriptPolicy) => {
  const next = headers.replace(policyHeader, (_, name, policy) => {
    const directives = policy.split(';').map((/** @type {string} */ directive) => directive.trim()).filter(Boolean)
      .map((/** @type {string} */ directive) => /^script-src(?:\s|$)/u.test(directive) ? scriptPolicy : directive)

    return `${name}${directives.join('; ')}`
  })

  const line = next.split('\n').find(candidate => policyHeader.test(candidate)) ?? ''

  if (line.length > headerLineLimit) {
    throw new Error(`The Content-Security-Policy header line is ${line.length} characters; Cloudflare allows ${headerLineLimit}. Move repeated inline scripts into processed modules.`)
  }

  return next
}

/** @param {string} html @param {string} policy */
export const injectPolicy = (html, policy) => {
  const tag = `<meta http-equiv="Content-Security-Policy" content="${policy}">`
  const document = html.replace(policyMeta, '')
  const anchor = charsetMeta.exec(document) ?? openingHead.exec(document)

  if (!anchor) return document

  const index = anchor.index + anchor[0].length

  return `${document.slice(0, index)}${tag}${document.slice(index)}`
}

/** @param {string} [root] */
export const applyScriptPolicy = async (root = projectRoot) => {
  const dist = join(root, 'dist')
  const headers = await readFile(join(dist, '_headers'), 'utf8')
  const sources = readHeaderScriptSources(headers)

  const files = (await Array.fromAsync(glob('**/*.html', { cwd: dist })))
    .map(file => file.split(sep).join('/'))
    .filter(file => !archivePath.test(file))
    .sort()

  const documents = new Map()
  const hashes = new Set()
  const unsafe = []

  for (const file of files) {
    const html = await readFile(join(dist, file), 'utf8')
    const { findings, hashes: pageHashes } = inspectDocument(html)

    documents.set(file, html)

    for (const hash of pageHashes) hashes.add(hash)

    for (const finding of findings) unsafe.push(`${file}: ${finding}`)
  }

  if (unsafe.length > 0) {
    const examples = unsafe.slice(0, 20).join('\n')

    throw new Error(`Inline event handlers or javascript: URLs would be blocked by the page policy:\n${examples}`)
  }

  // One policy for every page: ClientRouter swaps pages into the first document, so each
  // document must already allow the inline scripts of every page it can navigate to.
  const policy = `script-src ${[...sources, ...[...hashes].sort()].join(' ')}`

  for (const [file, html] of documents) {
    const next = injectPolicy(html, policy)

    if (next !== html) await writeFile(join(dist, file), next)
  }

  await writeFile(join(dist, '_headers'), applyHeaderPolicy(headers, policy))

  return { files: files.length, hashes: [...hashes].sort(), policy }
}

if (process.argv[1] && resolvePath(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { files, hashes } = await applyScriptPolicy()

  console.log(`Script policy: ${hashes.length} inline script hashes applied to ${files} pages.`)
}
