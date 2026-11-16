/**
 * Turns Content-Security-Policy violation reports into compact log records. Browsers send
 * either the legacy `report-uri` shape (`{ "csp-report": { … } }`, application/csp-report)
 * or Reporting API batches (`[{ type: "csp-violation", body: { … } }]`,
 * application/reports+json); both become the same record.
 */

const siteHost = 'santi020k.com'
const maxSample = 120
/** @param {unknown} value */
const text = value => (typeof value === 'string' ? value : undefined)

/** Reports must come from pages of the site family; anything else is noise or abuse. */
export const isSitePage = (/** @type {string | undefined} */ value) => {
  if (!value) return false

  try {
    const { hostname, protocol } = new URL(value)

    return protocol === 'https:' && (hostname === siteHost || hostname.endsWith(`.${siteHost}`))
  } catch {
    return false
  }
}

/** Removes query strings and fragments, which can carry search terms or tokens. */
const withoutQuery = (/** @type {string | undefined} */ value) => {
  if (!value) return undefined

  try {
    const url = new URL(value)

    return `${url.origin}${url.pathname}`
  } catch {
    // Keywords such as "inline" or "eval" are not URLs and are kept as they are.
    return value.slice(0, maxSample)
  }
}

/**
 * @typedef {{ blocked?: string, directive?: string, disposition?: string, document: string, line?: number, sample?: string, source?: string }} ViolationRecord
 */

/**
 * @param {Record<string, unknown>} body One report body in either naming convention.
 * @returns {ViolationRecord | undefined}
 */
const toRecord = body => {
  const document = text(body.documentURL) ?? text(body['document-uri'])

  if (!isSitePage(document)) return undefined

  const record = {
    document: /** @type {string} */ (withoutQuery(document)),
    directive: text(body.effectiveDirective) ?? text(body['effective-directive']) ?? text(body['violated-directive']),
    blocked: withoutQuery(text(body.blockedURL) ?? text(body['blocked-uri'])),
    disposition: text(body.disposition),
    source: withoutQuery(text(body.sourceFile) ?? text(body['source-file'])),
    sample: (text(body.sample) ?? text(body['script-sample']))?.slice(0, maxSample),
    line: [body.lineNumber, body['line-number']].find(value => typeof value === 'number')
  }

  return /** @type {ViolationRecord} */ (Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && value !== '')))
}

/**
 * @param {unknown} payload Parsed JSON request body.
 * @returns {ViolationRecord[]}
 */
const readBodies = (/** @type {unknown} */ payload) => {
  if (Array.isArray(payload)) {
    return payload.flatMap(entry => (entry?.type === 'csp-violation' && entry.body && typeof entry.body === 'object' ? [entry.body] : []))
  }

  if (!payload || typeof payload !== 'object' || !('csp-report' in payload)) return []

  const report = payload['csp-report']

  return report && typeof report === 'object' ? [report] : []
}

export const parseReports = payload => {
  const bodies = readBodies(payload)

  return bodies.slice(0, 50).flatMap(body => {
    const record = toRecord(/** @type {Record<string, unknown>} */ (body))

    return record ? [record] : []
  })
}
