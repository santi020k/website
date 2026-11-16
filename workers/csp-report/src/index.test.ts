// @vitest-environment node
import { describe, expect, test, vi } from 'vitest'

import worker from './index.js'

const byteLimit = 64 * 1024
const encoder = new TextEncoder()

const streamRequest = (body: ReadableStream<Uint8Array>, headers: Record<string, string> = {}) => {
  const init: RequestInit & { duplex: 'half' } = {
    body,
    duplex: 'half',
    headers: { 'Content-Type': 'application/csp-report', ...headers },
    method: 'POST'
  }

  return new Request('https://csp.example/', init)
}

const chunkedBody = (chunks: Uint8Array[]) => {
  let readCount = 0
  const cancel = vi.fn()
  const body = new ReadableStream<Uint8Array>({
    cancel,
    pull(controller) {
      const chunk = chunks[readCount]

      if (chunk) {
        readCount += 1
        controller.enqueue(chunk)
      } else {
        controller.close()
      }
    }
  }, { highWaterMark: 0 })

  return { body, cancel, readCount: () => readCount }
}

describe('CSP report request limits', () => {
  const headerVariants: Record<string, string>[] = [{}, { 'Content-Length': '2' }]

  test.each(headerVariants)('cancels oversized streams with headers %j before reading the rest', async headers => {
    const stream = chunkedBody([new Uint8Array(byteLimit), new Uint8Array(1), new Uint8Array(byteLimit)])
    const response = await worker.fetch(streamRequest(stream.body, headers))

    expect(response.status).toBe(413)
    expect(stream.readCount()).toBe(2)
    expect(stream.cancel).toHaveBeenCalledOnce()
    expect(stream.body.locked).toBe(false)
  })

  test('rejects an oversized declared length without reading the body', async () => {
    const stream = chunkedBody([encoder.encode('[]')])
    const response = await worker.fetch(streamRequest(stream.body, { 'Content-Length': String(byteLimit + 1) }))

    expect(response.status).toBe(413)
    expect(stream.readCount()).toBe(0)
    expect(stream.cancel).toHaveBeenCalledOnce()
  })

  test('accepts a valid JSON body exactly at the byte limit', async () => {
    const bytes = encoder.encode(JSON.stringify('a'.repeat(byteLimit - 2)))
    const stream = chunkedBody([bytes.subarray(0, 20), bytes.subarray(20)])
    const response = await worker.fetch(streamRequest(stream.body))

    expect(bytes.byteLength).toBe(byteLimit)
    expect(response.status).toBe(204)
    expect(stream.cancel).not.toHaveBeenCalled()
    expect(stream.body.locked).toBe(false)
  })

  test('enforces UTF-8 bytes rather than string length', async () => {
    const json = JSON.stringify('💜'.repeat(byteLimit / 4))
    const stream = chunkedBody([encoder.encode(json)])

    expect(json.length).toBeLessThan(byteLimit)
    expect((await worker.fetch(streamRequest(stream.body))).status).toBe(413)
    expect(stream.cancel).toHaveBeenCalledOnce()
  })

  test('decodes reports whose UTF-8 characters span chunks', async () => {
    const bytes = encoder.encode(JSON.stringify({
      'csp-report': {
        'document-uri': 'https://santi020k.com/',
        'script-sample': 'café 💜'
      }
    }))
    const stream = chunkedBody(Array.from(bytes, byte => new Uint8Array([byte])))
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    try {
      expect((await worker.fetch(streamRequest(stream.body))).status).toBe(204)
      expect(log).toHaveBeenCalledWith(JSON.stringify({ csp: { document: 'https://santi020k.com/', sample: 'café 💜' } }))
    } finally {
      log.mockRestore()
    }
  })

  test('returns a safe client error when reading a body fails', async () => {
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.error(new Error('Private transport details'))
      }
    }, { highWaterMark: 0 })
    const response = await worker.fetch(streamRequest(body))

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Unable to read report')
    expect(body.locked).toBe(false)
  })

  test('keeps oversized input rejected when transport cancellation fails', async () => {
    const body = new ReadableStream<Uint8Array>({
      cancel() {
        throw new Error('Transport cancellation failed')
      },
      pull(controller) {
        controller.enqueue(new Uint8Array(byteLimit + 1))
      }
    }, { highWaterMark: 0 })

    expect((await worker.fetch(streamRequest(body))).status).toBe(413)
    expect(body.locked).toBe(false)
  })

  test('rejects empty and malformed JSON after reading a bounded body', async () => {
    for (const input of ['', '{']) {
      const stream = chunkedBody([encoder.encode(input)])

      expect((await worker.fetch(streamRequest(stream.body))).status).toBe(400)
    }
    expect((await worker.fetch(new Request('https://csp.example/', {
      headers: { 'Content-Type': 'application/csp-report' },
      method: 'POST'
    }))).status).toBe(400)
  })
})
