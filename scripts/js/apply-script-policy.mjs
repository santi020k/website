import { createHash } from 'node:crypto'
import { glob, readFile, writeFile } from 'node:fs/promises'
import { join, resolve as resolvePath, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
// Archived sites are assembled into v1/, v2/… after this step and keep the header policy,
// which still allows their inline event handlers.
const archivePath = /^v\d+\//u
const scriptElement = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/giu
const styleElement = /<style\b[\s\S]*?<\/style\s*>/giu
const startTag = /<[a-z][\w-]*((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/giu
const attributePattern = /\s+([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gu
const urlAttributes = new Set(['action', 'formaction', 'href', 'src'])
const policyMeta = /<meta\s+http-equiv=(["'])content-security-policy\1[^>]*>\s*/giu
const charsetMeta = /<meta\s+charset=[^>]*>/iu
const openingHead = /<head\b[^>]*>/iu
const executableTypes = new Set(['', 'module', 'text/javascript', 'application/javascript'])

/** @param {string} attributes */
const readType = attributes => {
  const match = /(?:^|\s)type\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/iu.exec(attributes)

  return (match?.[1] ?? match?.[2] ?? match?.[3] ?? '').trim().toLowerCase()
}

/** @param {string} attributes */
const isInlineExecutable = attributes => !/(?:^|\s)src\s*=/iu.test(attributes) &&
  executableTypes.has(readType(attributes))

// Browsers hash the script text after the HTML parser normalizes newlines.
/** @param {string} source */
export const hashScript = source => {
  const digest = createHash('sha256').update(source.replace(/\r\n?/gu, '\n')).digest('base64')

  return `'sha256-${digest}'`
}

/** @param {string} name @param {string} value */
const runsScript = (name, value) => /^on[a-z]+$/u.test(name) ||
  (urlAttributes.has(name) && /^\s*javascript:/iu.test(value))

/**
 * Inline handlers and javascript: URLs cannot be allowed by hash without 'unsafe-hashes'.
 * @param {string} html
 */
export const findInlineScriptAttributes = html => {
  const markup = html.replace(scriptElement, '<script>').replace(styleElement, '')
  const findings = []

  for (const [tag, attributes = ''] of markup.matchAll(startTag)) {
    for (const [, name = '', doubleQuoted, singleQuoted, unquoted] of attributes.matchAll(attributePattern)) {
      if (runsScript(name.toLowerCase(), doubleQuoted ?? singleQuoted ?? unquoted ?? '')) {
        findings.push(tag.slice(0, 120))

        break
      }
    }
  }

  return findings
}

/** @param {string} html */
export const collectInlineScriptHashes = html => {
  const hashes = new Set()

  for (const [, attributes = '', source = ''] of html.matchAll(scriptElement)) {
    if (isInlineExecutable(attributes)) hashes.add(hashScript(source))
  }

  return hashes
}

/**
 * The deployed header policy names the allowed script origins; the page policy keeps
 * those and swaps 'unsafe-inline' for the hashes of this build's inline scripts.
 * @param {string} headers
 */
export const readHeaderScriptSources = headers => {
  const policy = /^\s*Content-Security-Policy:\s*(.+)$/imu.exec(headers)?.[1]

  const scriptSources = policy?.split(';').map(directive => directive.trim().split(/\s+/u))
    .find(([name]) => name === 'script-src')

  if (!scriptSources) throw new Error('dist/_headers has no Content-Security-Policy script-src directive.')

  return scriptSources.slice(1).filter(source => source !== '\'unsafe-inline\'')
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
  const sources = readHeaderScriptSources(await readFile(join(dist, '_headers'), 'utf8'))

  const files = (await Array.fromAsync(glob('**/*.html', { cwd: dist })))
    .map(file => file.split(sep).join('/'))
    .filter(file => !archivePath.test(file))
    .sort()

  const documents = new Map()
  const hashes = new Set()
  const unsafe = []

  for (const file of files) {
    const html = await readFile(join(dist, file), 'utf8')

    documents.set(file, html)

    for (const hash of collectInlineScriptHashes(html)) hashes.add(hash)

    for (const finding of findInlineScriptAttributes(html)) unsafe.push(`${file}: ${finding}`)
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

  return { files: files.length, hashes: [...hashes].sort(), policy }
}

if (process.argv[1] && resolvePath(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { files, hashes } = await applyScriptPolicy()

  console.log(`Script policy: ${hashes.length} inline script hashes applied to ${files} pages.`)
}
