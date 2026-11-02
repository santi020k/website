import fs from 'node:fs'
import path from 'node:path'

const robotsMetaTag = /<meta\s[^>]*\bname\s*=\s*["']robots["'][^>]*>/iu
const contentAttribute = /\bcontent\s*=\s*["']([^"']*)["']/iu

/** Whether an HTML document's robots meta tag asks search engines not to index it. */
export const hasNoindexDirective = (html: string): boolean => {
  const tag = robotsMetaTag.exec(html)?.[0]
  const content = tag ? contentAttribute.exec(tag)?.[1] ?? '' : ''

  return content.split(',').some(directive => directive.trim().toLowerCase() === 'noindex')
}

// Metadata lives at the top of the document; reading only its head keeps the sitemap pass fast.
const headBytes = 64 * 1024

/** Reads the start of the built document for a page URL, or `undefined` when none exists. */
export const readBuiltPageHead = (outDir: string, url: string): string | undefined => {
  const { pathname } = new URL(url)
  let decoded = pathname

  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    // Keep the encoded path; a malformed URL simply has no matching file.
  }

  const file = decoded.endsWith('/') ?
    path.join(outDir, decoded, 'index.html') :
    path.join(outDir, `${decoded}.html`)

  if (path.relative(outDir, file).startsWith('..')) return undefined

  let descriptor: number

  try {
    descriptor = fs.openSync(file, 'r')
  } catch {
    return undefined
  }

  try {
    const buffer = Buffer.alloc(headBytes)
    const length = fs.readSync(descriptor, buffer, 0, headBytes, 0)

    return buffer.toString('utf8', 0, length)
  } finally {
    fs.closeSync(descriptor)
  }
}

/** Whether the built page for a URL is marked `noindex`. Pages without a built file are not. */
export const isNoindexBuiltPage = (outDir: string, url: string): boolean => {
  const head = readBuiltPageHead(outDir, url)

  return head !== undefined && hasNoindexDirective(head)
}
