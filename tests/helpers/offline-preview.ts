import { Buffer } from 'node:buffer'
import { createServer, type ServerResponse } from 'node:http'

/** Simulate an unreachable origin without bypassing WebKit's service workers. */
export const createOfflinePreview = async (baseURL: string | undefined, redirects: Record<string, string> = {}) => {
  if (!baseURL) throw new Error('Missing test preview URL')

  let online = true
  let stalled = false
  let heldRequests = 0
  const stalledResponses = new Set<ServerResponse>()

  const releaseStalled = () => {
    for (const response of stalledResponses) response.destroy()

    stalledResponses.clear()
  }

  const server = createServer((request, response) => {
    if (!online) {
      request.socket.destroy()

      return
    }

    if (stalled) {
      // Accept the request but never send headers, like a connection that stops responding.
      heldRequests += 1

      stalledResponses.add(response)

      response.once('close', () => stalledResponses.delete(response))

      return
    }

    const destination = redirects[request.url ?? '/']

    if (destination) {
      response.writeHead(302, { Location: destination }).end()

      return
    }

    void fetch(new URL(request.url ?? '/', baseURL), { signal: AbortSignal.timeout(10_000) })
      .then(async upstream => {
        const body = Buffer.from(await upstream.arrayBuffer())

        response.writeHead(upstream.status, {
          'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream'
        })

        return response.end(body)
      })
      .catch(() => {
        response.writeHead(502).end('Preview unavailable')
      })
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)

    server.listen(0, '127.0.0.1', resolve)
  })

  const address = server.address()

  if (!address || typeof address === 'string') {
    server.close()

    throw new Error('Missing offline preview address')
  }

  return {
    // This trustworthy loopback hostname avoids intentional dev-only cleanup.
    url: `http://website.localhost:${address.port}`,
    setOnline: (value: boolean) => {
      online = value
    },
    // Held requests are dropped when stalling ends or the preview closes.
    setStalled: (value: boolean) => {
      stalled = value

      if (!value) releaseStalled()
    },
    // Counts every request held while stalled, including ones already released.
    heldRequestCount: () => heldRequests,
    close: () => new Promise<void>((resolve, reject) => {
      releaseStalled()

      server.closeAllConnections()

      server.close(error => {
        if (error) {
          reject(error)

          return
        }

        resolve()
      })
    })
  }
}
