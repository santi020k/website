// @vitest-environment node
import { describe, expect, test } from 'vitest'

import worker from './index.js'
import { isSitePage, parseReports } from './reports.js'

const legacy = {
  'csp-report': {
    'blocked-uri': 'inline',
    'document-uri': 'https://santi020k.com/blog/post/?q=secret#top',
    'effective-directive': 'script-src-elem',
    disposition: 'enforce',
    'line-number': 12,
    'script-sample': 'console.log("x")',
    'source-file': 'https://santi020k.com/blog/post/?token=abc'
  }
}

const batch = [
  { type: 'csp-violation', body: { blockedURL: 'https://evil.example/x.js?id=1', documentURL: 'https://santi020k.com/', effectiveDirective: 'script-src-elem', disposition: 'enforce' } },
  { type: 'deprecation', body: { documentURL: 'https://santi020k.com/' } },
  { type: 'csp-violation', body: { blockedURL: 'inline', documentURL: 'https://elsewhere.example/' } }
]

describe('CSP report collector', () => {
  test('reads both report formats and drops query strings', () => {
    expect(parseReports(legacy)).toEqual([{
      blocked: 'inline',
      directive: 'script-src-elem',
      disposition: 'enforce',
      document: 'https://santi020k.com/blog/post/',
      line: 12,
      sample: 'console.log("x")',
      source: 'https://santi020k.com/blog/post/'
    }])
    expect(parseReports(batch)).toEqual([{
      blocked: 'https://evil.example/x.js',
      directive: 'script-src-elem',
      disposition: 'enforce',
      document: 'https://santi020k.com/'
    }])
  })

  test('ignores reports from other sites and malformed payloads', () => {
    expect(isSitePage('https://v4.santi020k.com/')).toBe(true)
    expect(isSitePage('http://santi020k.com/')).toBe(false)
    expect(isSitePage('https://santi020k.com.evil.example/')).toBe(false)
    expect(parseReports(null)).toEqual([])
    expect(parseReports({ other: 1 })).toEqual([])
    expect(parseReports([1, 'x', { type: 'csp-violation' }])).toEqual([])
  })

  test('answers preflight for the site, accepts reports, and rejects anything else', async () => {
    const preflight = await worker.fetch(new Request('https://csp.example/', { headers: { Origin: 'https://santi020k.com' }, method: 'OPTIONS' }))

    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('Access-Control-Allow-Origin')).toBe('https://santi020k.com')

    const report = await worker.fetch(new Request('https://csp.example/', {
      body: JSON.stringify(batch),
      headers: { 'Content-Type': 'application/reports+json', Origin: 'https://santi020k.com' },
      method: 'POST'
    }))

    expect(report.status).toBe(204)
    expect((await worker.fetch(new Request('https://csp.example/'))).status).toBe(405)
    expect((await worker.fetch(new Request('https://csp.example/', { body: 'x', headers: { 'Content-Type': 'text/plain' }, method: 'POST' }))).status).toBe(415)
    expect((await worker.fetch(new Request('https://csp.example/', { body: '{', headers: { 'Content-Type': 'application/csp-report' }, method: 'POST' }))).status).toBe(400)
  })
})
