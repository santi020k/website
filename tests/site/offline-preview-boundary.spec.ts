import { createServer, type IncomingHttpHeaders, request, type RequestListener } from 'node:http'

import { expect, test } from '@playwright/test'

import { createOfflinePreview } from '../helpers/offline-preview'

interface PreviewResponse {
  body: string
  headers: IncomingHttpHeaders
  status: number | undefined
}

interface PreviewBoundary {
  previewURL: string
  sinkRequests: string[]
  sinkURL: string
  upstreamRequests: string[]
}

const listen = async (listener: RequestListener) => {
  const server = createServer(listener)

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })

  const address = server.address()

  if (!address || typeof address === 'string') {
    server.close()

    throw new Error('Missing boundary fixture address')
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => {
      server.closeAllConnections()
      server.close(error => {
        if (error) reject(error)
        else resolve()
      })
    })
  }
}

// URL-based clients normalize authority-like targets before sending them. Node's
// path option preserves the actual HTTP request target received by the proxy.
const requestTarget = (previewURL: string, target: string): Promise<PreviewResponse> => {
  const preview = new URL(previewURL)

  return new Promise((resolve, reject) => {
    const outgoing = request({
      hostname: preview.hostname,
      method: 'GET',
      path: target,
      port: preview.port
    }, incoming => {
      let body = ''

      incoming.setEncoding('utf8')
      incoming.on('data', (chunk: string) => {
        body += chunk
      })
      incoming.once('error', reject)
      incoming.once('end', () => {
        resolve({ body, headers: incoming.headers, status: incoming.statusCode })
      })
    })

    outgoing.once('error', reject)
    outgoing.setTimeout(5000, () => outgoing.destroy(new Error('Boundary request timed out')))
    outgoing.end()
  })
}

const withBoundary = async (check: (boundary: PreviewBoundary) => Promise<void>) => {
  const sinkRequests: string[] = []
  const upstreamRequests: string[] = []
  const sink = await listen((incoming, response) => {
    sinkRequests.push(incoming.url ?? '/')
    response.writeHead(200).end('Foreign origin reached')
  })

  try {
    const upstream = await listen((incoming, response) => {
      const target = incoming.url ?? '/'

      upstreamRequests.push(target)

      if (target === '/redirect-to-other-origin/') {
        response.writeHead(302, { Location: `${sink.url}/redirected/` }).end()

        return
      }

      response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end(target)
    })

    try {
      const preview = await createOfflinePreview(upstream.url, { '/retired-page/': '/about/' }, { hostname: '127.0.0.1' })

      try {
        await check({ previewURL: preview.url, sinkRequests, sinkURL: sink.url, upstreamRequests })
      } finally {
        await preview.close()
      }
    } finally {
      await upstream.close()
    }
  } finally {
    await sink.close()
  }
}

test('offline preview preserves an ordinary encoded path and query on its configured upstream', async () => {
  await withBoundary(async ({ previewURL, sinkRequests, upstreamRequests }) => {
    const target = `/articles/encoded%20name/?q=Astro%26Lumen&next=${encodeURIComponent('https://example.com/')}`
    const response = await requestTarget(previewURL, target)

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toBe('text/plain; charset=utf-8')
    expect(response.body).toBe(target)
    expect(upstreamRequests).toEqual([target])
    expect(sinkRequests).toEqual([])
  })
})

for (const { name, target } of [
  { name: 'absolute URL', target: (sinkURL: string) => `${sinkURL}/escape/` },
  { name: 'protocol-relative URL', target: (sinkURL: string) => `//${new URL(sinkURL).host}/escape/` },
  { name: 'backslash authority', target: (sinkURL: string) => `/\\${new URL(sinkURL).host}/escape/` }
]) {
  test(`offline preview rejects a raw ${name} without contacting either upstream`, async () => {
    await withBoundary(async ({ previewURL, sinkRequests, sinkURL, upstreamRequests }) => {
      const response = await requestTarget(previewURL, target(sinkURL))

      expect(response.status).toBe(400)
      expect(upstreamRequests).toEqual([])
      expect(sinkRequests).toEqual([])
    })
  })
}

for (const encodedAuthority of ['%2F%2F', '%5C%5C']) {
  test(`offline preview keeps ${encodedAuthority} authority-like text inside the upstream pathname`, async () => {
    await withBoundary(async ({ previewURL, sinkRequests, sinkURL, upstreamRequests }) => {
      const target = `/${encodedAuthority}${new URL(sinkURL).host}/escape/?q=retained`
      const response = await requestTarget(previewURL, target)

      expect(response.status).toBe(200)
      expect(response.body).toBe(target)
      expect(upstreamRequests).toEqual([target])
      expect(sinkRequests).toEqual([])
    })
  })
}

test('offline preview refuses an upstream redirect to another origin', async () => {
  await withBoundary(async ({ previewURL, sinkRequests, upstreamRequests }) => {
    const response = await requestTarget(previewURL, '/redirect-to-other-origin/')

    expect(response.status).toBe(502)
    expect(response.body).toBe('Preview unavailable')
    expect(upstreamRequests).toEqual(['/redirect-to-other-origin/'])
    expect(sinkRequests).toEqual([])
  })
})

test('offline preview preserves configured fixture redirects without an upstream request', async () => {
  await withBoundary(async ({ previewURL, sinkRequests, upstreamRequests }) => {
    const response = await requestTarget(previewURL, '/retired-page/')

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('/about/')
    expect(upstreamRequests).toEqual([])
    expect(sinkRequests).toEqual([])
  })
})
