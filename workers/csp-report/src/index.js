import { isSitePage, parseReports } from './reports.js'

/**
 * Collects Content-Security-Policy violation reports for santi020k.com and writes one log
 * line per violation, so they can be searched in Workers Logs. It stores nothing else.
 */

const maxBody = 64 * 1024
const reportTypes = new Set(['application/csp-report', 'application/json', 'application/reports+json'])

/** @param {Request} request */
const corsHeaders = request => {
  const origin = request.headers.get('Origin')

  return origin !== null && isSitePage(origin) ?
    { 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Origin': origin, 'Access-Control-Max-Age': '86400', Vary: 'Origin' } :
    {}
}

/**
 * Reads at most the report byte budget, even when a sender omits or understates Content-Length.
 * An undefined result means the body exceeded that budget; stream failures reject the read.
 * @param {Request} request
 * @returns {Promise<string | undefined>}
 */
const readBody = async request => {
  const reader = request.body?.getReader()

  if (!reader) return ''

  const bytes = new Uint8Array(maxBody)
  let length = 0

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) return new TextDecoder().decode(bytes.subarray(0, length))

      if (value.byteLength > maxBody - length) {
        // A failed transport cancellation must not turn rejected input into a server error.
        await reader.cancel().catch(() => undefined)

        return undefined
      }

      bytes.set(value, length)

      length += value.byteLength
    }
  } finally {
    reader.releaseLock()
  }
}

export default {
  /** @param {Request} request */
  async fetch(request) {
    // The Reporting API sends reports with CORS, so its preflight must succeed.
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(request), status: 204 })

    if (request.method !== 'POST') return new Response('Method not allowed', { headers: { Allow: 'POST, OPTIONS' }, status: 405 })

    const type = request.headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase() ?? ''

    if (!reportTypes.has(type)) return new Response('Unsupported media type', { status: 415 })

    const declared = Number(request.headers.get('Content-Length') ?? 0)

    if (declared > maxBody) {
      await request.body?.cancel().catch(() => undefined)

      return new Response('Payload too large', { status: 413 })
    }

    /** @type {string | undefined} */
    let raw

    try {
      raw = await readBody(request)
    } catch {
      return new Response('Unable to read report', { status: 400 })
    }

    if (raw === undefined) return new Response('Payload too large', { status: 413 })

    /** @type {unknown} */
    let payload

    try {
      payload = JSON.parse(raw)
    } catch {
      return new Response('Invalid JSON', { status: 400 })
    }

    for (const record of parseReports(payload)) console.log(JSON.stringify({ csp: record }))

    return new Response(null, { headers: corsHeaders(request), status: 204 })
  }
}
